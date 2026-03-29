const express = require('express');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { db, admin } = require('./firebaseConfig');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const rpName = process.env.WEBAUTHN_RP_NAME || 'BioVault';
const origin = process.env.WEBAUTHN_ORIGIN || `http://${rpID}:5173`;

// In-memory challenge store (or use Redis for production)
const challenges = new Map();

// ── REGISTRATION ───────────────────────────────────────────

router.post('/register/generate-options', async (req, res) => {
  const { userId, userName } = req.body;

  if (!userId || !userName) {
    return res.status(400).json({ error: 'User ID and name are required' });
  }

  // Get user's existing credentials from Firestore
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const existingCredentials = userDoc.exists ? (userDoc.data().credentials || []) : [];

  const userIDBuffer = Buffer.from(userId, 'utf-8');

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userIDBuffer,
    userName,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(cred => ({
      id: cred.credentialID,
      type: 'public-key',
      transports: cred.transports,
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });

  // Store challenge for verification
  challenges.set(userId, options.challenge);

  res.json(options);
});

router.post('/register/verify', async (req, res) => {
  const { userId, registrationResponse } = req.body;

  const userIDBuffer = Buffer.from(userId, 'utf-8');

  const expectedChallenge = challenges.get(userIDBuffer.toString('utf-8'));
  if (!expectedChallenge) {
    return res.status(400).json({ error: 'Challenge not found' });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }

  const { verified, registrationInfo } = verification;

  if (verified && registrationInfo) {
    const { credential } = registrationInfo;
    const { id: credentialID, publicKey: credentialPublicKey, counter, transports } = credential;

    if (!credentialID || !credentialPublicKey) {
      return res.status(400).json({ error: 'Missing credential data in registration' });
    }

    // Ensure credentialID is stored as base64url (standard WebAuthn format)
    let credentialIDStr;
    if (typeof credentialID === 'string') {
      credentialIDStr = credentialID;
    } else if (Buffer.isBuffer(credentialID)) {
      credentialIDStr = credentialID.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    } else {
      credentialIDStr = Buffer.from(credentialID).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    const newCredential = {
      credentialID: credentialIDStr,
      publicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      transports: (transports || registrationResponse.response.transports || []).filter(t => t === 'internal'),
    };

    // Store credential in Firestore
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      credentials: admin.firestore.FieldValue.arrayUnion(newCredential)
    }, { merge: true });

    challenges.delete(userId);
    res.json({ verified: true });
  } else {
    res.status(400).json({ error: 'Verification failed' });
  }
});

// ── AUTHENTICATION ──────────────────────────────────────────

router.post('/authenticate/generate-options', async (req, res) => {
  const { userId } = req.body;

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }

  const credentials = userDoc.data().credentials || [];
  
  console.log('User ID:', userId);
  console.log('Credentials count:', credentials.length);
  console.log('Raw credentials:', credentials);
  
  if (!credentials || credentials.length === 0) {
    return res.status(400).json({ error: 'No credentials registered for this user' });
  }
  
  try {
    const allowCredentialsList = credentials.map(cred => {
      console.log('Credential entry:', cred);
      console.log('Credential ID:', cred.credentialID, 'Type:', typeof cred.credentialID);
      
      if (!cred.credentialID) {
        throw new Error('Credential ID is missing');
      }
      
      // Filter to only 'internal' transport (platform authenticator)
      const filteredTransports = (cred.transports || []).filter(t => t === 'internal');
      
      return {
        id: cred.credentialID,
        type: 'public-key',
        transports: filteredTransports.length > 0 ? filteredTransports : ['internal'],
      };
    });
    
    console.log('Allow credentials list:', allowCredentialsList);
    
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: allowCredentialsList,
      userVerification: 'preferred',
    });
    
    challenges.set(userId, options.challenge);
    res.json(options);
  } catch (error) {
    console.error('Error generating auth options:', error);
    return res.status(400).json({ error: error.message });
  }
});

router.post('/authenticate/verify', async (req, res) => {
  const { userId, authenticationResponse } = req.body;

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }

  const credentials = userDoc.data().credentials || [];
  
  console.log('Authentication response ID:', authenticationResponse.id);
  console.log('Stored credentials:', credentials.map(c => c.credentialID));
  
  // The responseId should already be in the correct format (base64url from browser)
  const responseId = typeof authenticationResponse.id === 'string' 
    ? authenticationResponse.id 
    : (Buffer.isBuffer(authenticationResponse.id) 
        ? authenticationResponse.id.toString('base64') 
        : String(authenticationResponse.id));
  
  console.log('Matching responseId:', responseId);
  
  // Find the matching credential
  const credential = credentials.find(c => {
    const matches = c.credentialID === responseId;
    console.log(`Comparing ${c.credentialID} === ${responseId}: ${matches}`);
    return matches;
  });
  
  console.log('Found credential:', credential);

  if (!credential) {
    console.error('Available credential IDs:', credentials.map(c => c.credentialID));
    console.error('Response ID:', responseId);
    return res.status(400).json({ error: 'Credential not found for this user' });
  }

  const expectedChallenge = challenges.get(userId);
  if (!expectedChallenge) {
    return res.status(400).json({ error: 'Challenge not found' });
  }

  let verification;
  try {
    // Credentials might be stored as plain base64 (old format) or base64url (new format)  
    // Try to detect and handle both formats
    const storedId = credential.credentialID;
    let credentialIDBuffer;
    
    // If it has URL-safe chars, it's definitely base64url
    if (storedId.includes('-') || storedId.includes('_')) {
      // Base64url with URL-safe characters
      credentialIDBuffer = Buffer.from(storedId, 'base64url');
    } else {
      // Could be plain base64, try decoding as base64url first (works for regular base64 too)
      // If that fails, fall back to standard base64
      try {
        credentialIDBuffer = Buffer.from(storedId, 'base64url');
      } catch (e) {
        // Add padding and try standard base64
        const padded = storedId + '='.repeat((4 - storedId.length % 4) % 4);
        credentialIDBuffer = Buffer.from(padded, 'base64');
      }
    }
    
    const publicKeyBuffer = Buffer.from(credential.publicKey, 'base64');
    
    // Format the response properly - browser sends everything as base64url
    // Keep WebAuthn response fields as base64url strings for @simplewebauthn/server
    const formattedResponse = {
      id: authenticationResponse.id,
      rawId: authenticationResponse.rawId,
      response: {
        authenticatorData: authenticationResponse.response.authenticatorData,
        clientDataJSON: authenticationResponse.response.clientDataJSON,
        signature: authenticationResponse.response.signature,
        userHandle: authenticationResponse.response.userHandle,
      },
      type: authenticationResponse.type,
      clientExtensionResults: authenticationResponse.clientExtensionResults || {},
      authenticatorAttachment: authenticationResponse.authenticatorAttachment,
    };
    
    const credentialRecord = {
      id: credentialIDBuffer,
      publicKey: publicKeyBuffer,
      counter: credential.counter || 0,
    };
    
    console.log('Formatted response:', {
      id: formattedResponse.id,
      rawId: typeof formattedResponse.rawId,
      authenticatorData: typeof formattedResponse.response.authenticatorData,
      clientDataJSON: typeof formattedResponse.response.clientDataJSON,
      signature: typeof formattedResponse.response.signature,
    });
    
    verification = await verifyAuthenticationResponse({
      response: formattedResponse,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: credentialRecord,
    });
    
    console.log('Verification successful!');
  } catch (error) {
    console.error('Detailed auth verification error:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(400).json({ error: error.message || 'Authentication verification failed' });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    // Update counter in database
    const updatedCredentials = credentials.map(c => {
      if (c.credentialID === responseId) {
        return { ...c, counter: authenticationInfo.newCounter };
      }
      return c;
    });

    await userRef.update({ credentials: updatedCredentials });

    challenges.delete(userId);
    res.json({ verified: true });
  } else {
    res.status(400).json({ error: 'Verification failed' });
  }
});

module.exports = router;
