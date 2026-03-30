import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBalance } from '../utils/wallet';
import { registerBiometric } from '../utils/webauthn';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Lock, Loader2, Copy, CheckCircle2, ShieldCheck, Fingerprint, Scan } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  const [regStatus, setRegStatus] = useState({ loading: false, error: '' });
  const [sessionMethod, setSessionMethod] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    // Verify session
    const sessionPk = sessionStorage.getItem('bioVault_session_pk');
    const method = sessionStorage.getItem('bioVault_session_method');
    
    if (!sessionPk) {
      navigate('/login');
      return;
    }
    
    setSessionMethod(method || '');

    const userData = JSON.parse(localStorage.getItem('bioVault_user') || '{}');
    setUser(userData);

    const fetchBalance = async () => {
      try {
        if (userData.address) {
          const bal = await getBalance(userData.address);
          setBalance(Number(bal).toFixed(4));
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [navigate]);

  const setupFingerprint = async () => {
    setRegStatus({ loading: true, error: '' });
    try {
      const newCredentialId = await registerBiometric(user.userId, user.name);
      // Update local storage to reflect we have a 'real' credential now
      const updatedUser = { 
        ...user, 
        credentialId: newCredentialId,
        authMethods: [...(user.authMethods || []), 'fingerprint']
      };
      localStorage.setItem('bioVault_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert('Fingerprint added successfully! Your account is now fully secured with hardware biometrics.');
    } catch (err) {
      console.error(err);
      setRegStatus({ loading: false, error: err.message });
    } finally {
      setRegStatus({ loading: false });
    }
  };

  const copyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReceive = () => {
    if (!user?.address) return;
    copyAddress();
    alert('Address copied!');
  };

  const logout = () => {
    sessionStorage.removeItem('bioVault_session_pk');
    sessionStorage.removeItem('bioVault_session_id');
    sessionStorage.removeItem('bioVault_session_method');
    navigate('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isWebAuthnActive = user.credentialId?.length > 30;

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full max-w-2xl mx-auto pt-8 px-4">
      
      {/* Vault Header Card */}
      <div className="bg-surface border border-border rounded-[24px] p-8 w-full shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden mb-8">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10 relative z-10">
          <div>
            <div className="section-tag">{user.name}'s Vault</div>
            <h2 className="text-3xl font-bold tracking-tight">Decentralized Wallet</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="font-mono text-xs text-muted bg-surface2 px-3 py-1.5 rounded-full border border-border">
                {formatAddress(user.address)}
              </div>
              <button 
                onClick={copyAddress}
                className="text-muted hover:text-accent transition-colors p-1.5 hover:bg-surface2 rounded-md transition-all active:scale-95"
              >
                {copied ? <CheckCircle2 size={16} className="text-accent2" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <div className="bg-accent2/10 border border-accent2/20 text-accent2 px-4 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,157,0.15)] animate-pulse-slow">
            <ShieldCheck size={16} />
            Biometric Session Active
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0a1f35] to-[#0d2a45] rounded-3xl p-8 border border-border/50 relative overflow-hidden shadow-inner">
           <div className="font-mono text-[10px] text-muted uppercase tracking-[3px] mb-2 font-bold">Total Balance</div>
           <div className="text-5xl font-extrabold bg-gradient-to-r from-accent to-accent2 text-transparent bg-clip-text drop-shadow-[0_2px_10px_rgba(0,210,255,0.3)]">
             {balance} <span className="text-2xl font-medium text-white/40">ETH</span>
           </div>
           <div className="text-[10px] text-muted tracking-widest mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent2"></span> Sepolia Testnet
           </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
        <Link to="/send" className="flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] bg-surface2 border border-border hover:border-accent hover:bg-accent/5 transition-all group">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-glow">
            <ArrowUpRight size={24} />
          </div>
          <span className="font-bold text-xs tracking-widest uppercase">Send</span>
        </Link>
        <button
          onClick={handleReceive}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] bg-surface2 border border-border hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-glow">
            <ArrowDownRight size={24} />
          </div>
          <span className="font-bold text-xs tracking-widest uppercase">Receive</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] bg-surface2 border border-border opacity-40 cursor-not-allowed grayscale">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted">
            <ArrowRightLeft size={24} />
          </div>
          <span className="font-bold text-xs tracking-widest uppercase text-muted">Swap</span>
        </button>
        <button onClick={logout} className="flex flex-col items-center justify-center gap-3 p-5 rounded-[20px] bg-surface2 border border-border hover:border-danger/50 hover:bg-danger/5 transition-all group">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted group-hover:text-danger group-hover:scale-110 transition-transform">
            <Lock size={24} />
          </div>
          <span className="font-bold text-xs tracking-widest uppercase group-hover:text-danger">Lock</span>
        </button>
      </div>

      {/* Security Info */}
      <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl">
        {regStatus.error && (
            <div className="text-[10px] font-mono text-danger bg-danger/10 p-3 rounded-xl border border-danger/20 flex items-center gap-2">
                <AlertCircle size={14} /> {regStatus.error}
            </div>
        )}
        <div className="flex justify-between items-center mb-1">
          <div className="section-tag mb-0">Multimodal Security</div>
          <div className="flex gap-2">
            {sessionMethod === 'fingerprint' && (
                <Link to="/face" className="px-3 py-1.5 bg-accent2/10 hover:bg-accent2/20 border border-accent2/20 rounded-lg text-[10px] font-black uppercase tracking-tighter text-accent2 transition-all flex items-center gap-1.5">
                  <Scan size={14} /> Add Face AI
                </Link>
            )}
            {sessionMethod === 'face' && !isWebAuthnActive && (
                <button 
                  onClick={setupFingerprint}
                  disabled={regStatus.loading}
                  className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg text-[10px] font-black uppercase tracking-tighter text-accent transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Fingerprint size={14} /> {regStatus.loading ? 'Processing...' : 'Link Fingerprint'}
                </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
            <span className="text-muted text-[10px] uppercase tracking-widest font-bold">Primary</span>
            <span className="text-accent2 font-black flex items-center gap-1">
               <ShieldCheck size={12} /> SECURED
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
            <span className="text-muted text-[10px] uppercase tracking-widest font-bold">Biometrics</span>
            <span className={clsx("font-black", isWebAuthnActive ? "text-accent" : "text-amber-400")}>
                {isWebAuthnActive ? 'FULL HARDWARE' : 'AI-SOFTWARE'}
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col gap-1.5">
            <span className="text-muted text-[10px] uppercase tracking-widest font-bold">Method</span>
            <span className="text-white font-black uppercase italic tracking-tighter">
                Logged via {sessionMethod || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
