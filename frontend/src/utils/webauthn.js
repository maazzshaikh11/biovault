import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api/webauthn';

export async function registerBiometric(userId, userName) {
  try {
    // 1. Get registration options from server
    const resp = await fetch(`${API_URL}/register/generate-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName }),
    });

    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to generate registration options');
    }

    const options = await resp.json();

    // 2. Prompt user to register biometric via WebAuthn
    let registrationResponse;
    try {
      registrationResponse = await startRegistration({ optionsJSON: options });
    } catch (error) {
       console.error(error);
      throw new Error('Biometric registration was cancelled or failed.');
    }

    // 3. Send response to server for verification
    const verificationResp = await fetch(`${API_URL}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, registrationResponse }),
    });

    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      return registrationResponse.id; // Return the credential ID to use as a key
    } else {
      throw new Error(verificationJSON.error || 'Verification failed on server');
    }
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

export async function authenticateBiometric(userId) {
  try {
    // 1. Get authentication options from server
    const resp = await fetch(`${API_URL}/authenticate/generate-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to generate authentication options');
    }

    const options = await resp.json();

    // 2. Prompt user to authenticate via WebAuthn
    let authenticationResponse;
    try {
      authenticationResponse = await startAuthentication({ optionsJSON: options });
    } catch (error) {
        console.error(error);
        throw new Error('Biometric authentication was cancelled or failed.');
    }

    // 3. Send response to server for verification
    const verificationResp = await fetch(`${API_URL}/authenticate/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, authenticationResponse }),
    });

    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      return authenticationResponse.id; // Return the credential ID used
    } else {
      throw new Error(verificationJSON.error || 'Authentication failed on server');
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
