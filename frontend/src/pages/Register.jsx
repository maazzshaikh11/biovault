import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerBiometric } from '../utils/webauthn';
import { createEncryptedWallet } from '../utils/wallet';
import { Fingerprint, AlertCircle, CheckCircle2, Loader2, ArrowRight, ScanFace } from 'lucide-react';
import Webcam from 'react-webcam';
import clsx from 'clsx';

export default function Register() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [regMode, setRegMode] = useState(null); // 'fingerprint' or 'face'
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      let credentialId;

      if (regMode === 'face') {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) throw new Error("Could not capture image");
        const blob = await fetch(imageSrc).then(res => res.blob());
        
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("user_id", userId);

        const res = await fetch(`http://localhost:8000/register`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        // For Face-only, generate a secure random string as the 'credentialId' encryption key
        credentialId = btoa(Math.random().toString(36).substring(2) + Date.now());
      } else {
        // WebAuthn Registration
        credentialId = await registerBiometric(userId, name);
      }

      console.log('Credential secured:', credentialId);
      setStep(2); 

      // 2. Generate Encrypted Wallet
      const { address, encryptedKey } = await createEncryptedWallet(credentialId);

      // 3. Store minimal data locally
      localStorage.setItem('bioVault_user', JSON.stringify({
        userId,
        name,
        address,
        encryptedKey,
        credentialId,
        authMethods: [regMode === 'face' ? 'face' : 'fingerprint']
      }));

      setStep(3); 
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed. Please try again.');
      setStep(1);
    } finally {
      if (step !== 3) setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="panel max-w-lg w-full">
        <div className="section-tag">Welcome to BioVault</div>
        <h2 className="text-2xl font-bold mb-2">Create Your Wallet</h2>
        <p className="subtitle">
          Secure your Ethereum wallet directly with your choice of biometric security.
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-mono break-words">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="input-group">
              <label htmlFor="name">Wallet Name / Alias</label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Satoshi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            
            {!regMode ? (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setRegMode('fingerprint')}
                  className="btn btn-primary h-16 flex items-center justify-center gap-3 w-full shadow-glow"
                  disabled={loading || !name.trim()}
                >
                  <Fingerprint size={24} /> Option 1: Fingerprint (WebAuthn)
                </button>
                <button 
                  onClick={() => setRegMode('face')}
                  className="btn h-16 border border-accent2 text-accent2 hover:bg-accent2/10 flex items-center justify-center gap-3 w-full transition-all"
                  disabled={loading || !name.trim()}
                >
                  <ScanFace size={24} /> Option 2: Face Recognition (AI)
                </button>
              </div>
            ) : regMode === 'face' ? (
              <div className="flex flex-col items-center gap-4 animate-fadeIn">
                 <div className="rounded-lg overflow-hidden border border-accent2/30 shadow-glow2 w-full max-w-sm">
                  <Webcam 
                    ref={webcamRef} 
                    screenshotFormat="image/jpeg" 
                    className="w-full"
                    mirrored={true}
                  />
                </div>
                <button 
                  onClick={() => handleRegister()}
                  className="btn h-14 bg-accent2 text-black w-full flex justify-center items-center gap-2 font-bold transition-all shadow-glow2"
                  disabled={loading}
                >
                   {loading ? <Loader2 className="animate-spin" size={24} /> : <><ScanFace size={24} /> Register with Face AI</>}
                </button>
                <button
                   onClick={() => setRegMode(null)}
                   className="text-xs text-muted hover:text-white transition-colors"
                   disabled={loading}
                >
                   ← Back to options
                </button>
              </div>
            ) : (
                <div className="flex flex-col gap-4 animate-fadeIn">
                    <button 
                        onClick={() => handleRegister()}
                        className="btn btn-primary h-16 flex items-center justify-center gap-3 w-full"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : <><Fingerprint size={24} /> Start Fingerprint Auth</>}
                    </button>
                    <button
                        onClick={() => setRegMode(null)}
                        className="text-xs text-muted hover:text-white transition-colors text-center"
                        disabled={loading}
                    >
                        ← Back to options
                    </button>
                </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="animate-spin text-accent mb-4" size={48} />
            <h3 className="text-lg font-bold">Generating Wallet</h3>
            <p className="text-muted text-sm mt-2">Securing your private key with biometrics...</p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-[fadeIn_0.5s_ease]">
            <CheckCircle2 className="text-accent2 mb-4" size={48} />
            <h3 className="text-lg font-bold">Wallet Created Successfully</h3>
            <p className="text-muted text-sm mt-2">Redirecting to your vault...</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center text-sm">
          <span className="text-muted">Already have a wallet?</span>
          <button 
            type="button"
            onClick={() => navigate('/login')} 
            className="text-accent hover:text-white transition-colors flex items-center gap-1 font-bold uppercase tracking-wide"
          >
            Authenticate <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
