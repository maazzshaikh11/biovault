import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateBiometric } from '../utils/webauthn';
import { loadWallet } from '../utils/wallet';
import { Fingerprint, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userContext, setUserContext] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user exists on this device
    const saved = localStorage.getItem('bioVault_user');
    if (saved) {
      setUserContext(JSON.parse(saved));
    }
  }, []);

  const handleLogin = async () => {
    if (!userContext) {
      setError('No registered wallet found on this device. Please register first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. WebAuthn Authentication
      const credentialId = await authenticateBiometric(userContext.userId);

      // 2. Decrypt Wallet using credentialId
      const wallet = loadWallet(userContext.encryptedKey, credentialId);

      // Save decrypted wallet temporarily to sessionStorage (clears on tab close)
      // DO NOT store raw private key in localStorage
      sessionStorage.setItem('bioVault_session_pk', wallet.privateKey);
      sessionStorage.setItem('bioVault_session_id', credentialId);

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="panel">
        <div className="section-tag">Welcome Back</div>
        <h2 className="text-2xl font-bold mb-2">Access Your Vault</h2>
        <p className="subtitle">
          {userContext 
            ? `Authenticate as ${userContext.name} to unlock your wallet and sign transactions.`
            : 'Authenticate with your biometrics to access your Ethereum wallet.'
          }
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-mono">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex flex-col items-center gap-6 mt-8">
          <button 
            type="button" 
            onClick={handleLogin}
            className="btn btn-primary h-20 text-lg flex flex-col items-center justify-center gap-3 w-4/5 shadow-[0_4px_30px_rgba(0,229,255,0.4)]"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="animate-spin text-black" size={32} /> Automagicizing...</>
            ) : (
              <><Fingerprint size={32} /> Unlock Wallet</>
            )}
          </button>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex justify-between items-center text-sm">
          <span className="text-muted">Need a new wallet?</span>
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="text-accent hover:text-white transition-colors flex items-center gap-1 font-bold uppercase tracking-wide"
          >
            Register <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
