import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBalance } from '../utils/wallet';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft, Lock, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Verify session
    const sessionPk = sessionStorage.getItem('bioVault_session_pk');
    if (!sessionPk) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('bioVault_user') || '{}');
    setUser(userData);

    const fetchBalance = async () => {
      try {
        if (userData.address) {
          const bal = await getBalance(userData.address);
          // Format to 4 decimal places max
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

  const copyAddress = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReceive = () => {
    if (!user?.address) {
      return;
    }
    copyAddress();
    alert('Address copied!');
  };

  const logout = () => {
    sessionStorage.removeItem('bioVault_session_pk');
    sessionStorage.removeItem('bioVault_session_id');
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

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full max-w-2xl mx-auto pt-8">
      
      {/* Vault Header Card */}
      <div className="bg-surface border border-border rounded-[24px] p-8 w-full shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden mb-8">
        {/* Glow orb */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <div className="section-tag">{user.name}'s Vault</div>
            <h2 className="text-3xl font-bold tracking-tight">Decentralized Wallet</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="font-mono text-xs text-muted bg-surface2 px-3 py-1.5 rounded-full border border-border">
                {formatAddress(user.address)}
              </div>
              <button 
                onClick={copyAddress}
                className="text-muted hover:text-accent transition-colors p-1.5 hover:bg-surface2 rounded-md"
                title="Copy Address"
              >
                {copied ? <CheckCircle2 size={16} className="text-accent2" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <div className="bg-accent2/10 border border-accent2/20 text-accent2 px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(0,255,157,0.1)]">
            <span className="w-2 h-2 rounded-full bg-accent2 animate-pulse"></span>
            Biometric Session Active
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0a1f35] to-[#0d2a45] rounded-2xl p-8 border border-border/50 relative overflow-hidden">
           <div className="font-mono text-xs text-muted uppercase tracking-[2px] mb-2">Total Balance</div>
           <div className="text-5xl font-extrabold bg-gradient-to-r from-accent to-accent2 text-transparent bg-clip-text">
             {balance} <span className="text-2xl font-medium text-white/40 mix-blend-overlay">ETH</span>
           </div>
           <div className="text-sm text-muted mt-2">Sepolia Testnet</div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
        <Link to="/send" className="flex flex-col items-center justify-center gap-3 p-5 rounded-[16px] bg-surface2 border border-border hover:border-accent hover:bg-accent/5 transition-all group">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
            <ArrowUpRight size={24} />
          </div>
          <span className="font-bold text-sm tracking-wide uppercase">Send</span>
        </Link>
        <button
          onClick={handleReceive}
          className="flex flex-col items-center justify-center gap-3 p-5 rounded-[16px] bg-surface2 border border-border hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
            <ArrowDownRight size={24} />
          </div>
          <span className="font-bold text-sm tracking-wide uppercase">Receive</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-[16px] bg-surface2 border border-border opacity-60 cursor-not-allowed">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted">
            <ArrowRightLeft size={24} />
          </div>
          <span className="font-bold text-sm tracking-wide uppercase text-muted">Swap</span>
        </button>
        <button onClick={logout} className="flex flex-col items-center justify-center gap-3 p-5 rounded-[16px] bg-surface2 border border-border hover:border-danger/50 hover:bg-danger/5 transition-all group">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted group-hover:text-danger group-hover:scale-110 transition-transform">
            <Lock size={24} />
          </div>
          <span className="font-bold text-sm tracking-wide uppercase group-hover:text-danger">Lock</span>
        </button>
      </div>

      {/* Security Info */}
      <div className="w-full bg-surface2 border border-border rounded-xl p-5 flex flex-col gap-3">
        <div className="section-tag mb-0">Security Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-muted">Private Key</span>
            <span className="text-accent2">Never Exposed</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted">Biometrics</span>
            <span className="text-accent2">Hardware Stored</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted">Network</span>
            <span className="text-accent2">Sepolia (Test)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
