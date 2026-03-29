import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authenticateBiometric } from '../utils/webauthn';
import { loadWallet, sendTransaction, getBalance } from '../utils/wallet';
import { ArrowLeft, Send, AlertCircle, CheckCircle2, Loader2, Fingerprint, Copy } from 'lucide-react';

export default function SendTransaction() {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const sessionPk = sessionStorage.getItem('bioVault_session_pk');
    if (!sessionPk) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(localStorage.getItem('bioVault_user') || '{}');
    setUser(userData);
  }, [navigate]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!address || !amount) {
      setError('Please fill in both fields');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      // 1. Biometric Re-Auth
      const credentialId = await authenticateBiometric(user.userId);
      
      // 2. Load wallet securely
      const wallet = loadWallet(user.encryptedKey, credentialId);
      
      // 3. Simple balance check (optional but good practice)
      const currentBalance = await getBalance(wallet.address);
      if (parseFloat(currentBalance) < parseFloat(amount)) {
        throw new Error("Insufficient balance for this transaction.");
      }

      // 4. Send transaction
      const receipt = await sendTransaction(wallet, address, amount);
      
      setSuccess(receipt.hash);
      setAddress('');
      setAmount('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-lg mb-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted hover:text-accent font-bold uppercase text-sm tracking-wider transition-colors">
          <ArrowLeft size={16} /> Back to Vault
        </Link>
      </div>
      
      <div className="panel">
        <div className="section-tag">Biometric-Authorized Transfer</div>
        <h2 className="text-2xl font-bold mb-2">Send ETH</h2>
        <p className="subtitle">
          Enter recipient details. A live face verifiable authentication is required to sign the transaction.
        </p>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mb-4 flex items-center gap-2 text-sm font-mono">
            <AlertCircle size={16} className="shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-accent2/10 border border-accent2/30 text-accent2 p-4 rounded-xl mb-6 flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold font-syne text-lg">
              <CheckCircle2 size={24} /> 
              Transaction Successful!
            </div>
            <div className="text-sm text-white font-mono break-all bg-surface border border-border p-3 rounded-lg flex items-center justify-between">
              <span className="truncate mr-2">{success}</span>
              <button onClick={() => copyHash(success)} className="text-muted hover:text-accent shrink-0">
                <Copy size={16} />
              </button>
            </div>
            <a 
              href={`https://sepolia.etherscan.io/tx/${success}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-white underline font-mono text-sm inline-block mt-1"
            >
              View on Sepolia Etherscan ↗
            </a>
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="input-group mb-4">
            <label htmlFor="address">Recipient Address (0x...)</label>
            <input
              id="address"
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              className="font-mono bg-surface2 border-border focus:border-accent w-full p-3 rounded-xl border text-sm text-white"
            />
          </div>
          
          <div className="input-group mb-8">
            <label htmlFor="amount">Amount (ETH)</label>
            <div className="relative relative flex items-center">
              <input
                id="amount"
                type="number"
                step="0.0001"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="w-full bg-surface2 p-3 pr-12 rounded-xl border border-border focus:border-accent text-lg font-mono text-white outline-none"
              />
              <span className="absolute right-4 text-muted font-bold tracking-widest text-sm pointer-events-none">ETH</span>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary h-14"
            disabled={loading || !address || !amount}
          >
            {loading ? (
              <><Loader2 className="animate-spin" size={20} /> Authorizing...</>
            ) : (
              <><Fingerprint size={20} /> Authorize strictly with Biometric &amp; Send</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

