import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerBiometric } from '../utils/webauthn';
import { createEncryptedWallet } from '../utils/wallet';
import { Fingerprint, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function Register() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // 1. WebAuthn Registration
      const credentialId = await registerBiometric(userId, name);
      console.log('Biometric credential saved:', credentialId);
      
      setStep(2); // Generating wallet UI update

      // 2. Generate Encrypted Wallet
      const { address, encryptedKey } = await createEncryptedWallet(credentialId);

      // 3. Store minimal data locally
      localStorage.setItem('bioVault_user', JSON.stringify({
        userId,
        name,
        address,
        encryptedKey
      }));

      // In a real production app, you might also register this wallet address on the smart contract here,
      // but to save gas and simplify registration logic, we just generate the keypair locally first.
      
      setStep(3); // Success UI update
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
      <div className="panel">
        <div className="section-tag">Welcome to BioVault</div>
        <h2 className="text-2xl font-bold mb-2">Create Your Wallet</h2>
        <p className="subtitle">
          No passwords, no seed phrases. Secure your Ethereum wallet directly with your device's biometric security.
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-mono">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegister}>
            <div className="input-group mb-6">
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
            
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> Registering...</>
              ) : (
                <><Fingerprint size={20} /> Register with Biometric</>
              )}
            </button>
          </form>
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
