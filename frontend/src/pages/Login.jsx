import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateBiometric } from '../utils/webauthn';
import { loadWallet } from '../utils/wallet';
import { Fingerprint, AlertCircle, Loader2, ArrowRight, ScanFace, ShieldCheck } from 'lucide-react';
import Webcam from 'react-webcam';
import clsx from 'clsx';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userContext, setUserContext] = useState(null);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [alias, setAlias] = useState('');
  const [matchingUser, setMatchingUser] = useState(null);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user exists on this device
    const saved = localStorage.getItem('bioVault_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUserContext(parsed);
      // Auto-fill if there's only one user
      setAlias(parsed.name || '');
      setMatchingUser(parsed);
    }
  }, []);

  const handleAliasChange = (e) => {
    const val = e.target.value;
    setAlias(val);
    if (userContext && val.toLowerCase() === userContext.name.toLowerCase()) {
      setMatchingUser(userContext);
    } else {
      setMatchingUser(null);
    }
  };

  const handleWebAuthnLogin = async () => {
    if (!matchingUser) return;
    setLoading(true);
    setError('');
    try {
      const credentialId = await authenticateBiometric(matchingUser.userId);
      const wallet = loadWallet(matchingUser.encryptedKey, credentialId);
      sessionStorage.setItem('bioVault_session_pk', wallet.privateKey);
      sessionStorage.setItem('bioVault_session_id', credentialId);
      sessionStorage.setItem('bioVault_session_method', 'fingerprint');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async () => {
    if (!matchingUser) return;
    setLoading(true);
    setError('');
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Could not capture image from webcam");
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("user_id", matchingUser.userId);

      const res = await fetch(`http://localhost:8000/verify`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.verified) {
        const wallet = loadWallet(matchingUser.encryptedKey, matchingUser.credentialId);
        sessionStorage.setItem('bioVault_session_pk', wallet.privateKey);
        sessionStorage.setItem('bioVault_session_id', matchingUser.credentialId);
        sessionStorage.setItem('bioVault_session_method', 'face');
        navigate('/dashboard');
      } else {
        throw new Error(data.error || "Face verification failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Face Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const authMethods = matchingUser?.authMethods || [];
  const hasBoth = authMethods.includes('fingerprint') && authMethods.includes('face');

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="panel max-w-md w-full">
        <div className="section-tag">Welcome Back</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Access Your Vault</h2>
        
        <div className="input-group mt-6">
          <label htmlFor="alias">Wallet Name / Alias</label>
          <input
            id="alias"
            type="text"
            placeholder="Enter your wallet name"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white focus:border-accent outline-none transition-all"
            value={alias}
            onChange={handleAliasChange}
            autoComplete="off"
          />
        </div>

        {matchingUser && (
           <div className="mt-4 animate-fadeIn">
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent flex items-center gap-2 mb-4 bg-accent/5 p-3 rounded-xl border border-accent/20">
                 <ShieldCheck size={14} />
                 {hasBoth 
                   ? "Both authentication methods are added. You can use any!" 
                   : `Secured with ${authMethods.join(' & ')}`}
              </div>
           </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg mt-4 flex items-center gap-2 text-sm font-mono break-words">
            <AlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {!matchingUser && alias && (
            <div className="text-xs text-muted mt-4 p-4 bg-white/5 rounded-xl border border-white/5 animate-pulse">
                No local wallet found for "{alias}". Please register or check the name.
            </div>
        )}

        <div className={clsx("transition-all duration-500", !matchingUser ? "opacity-30 pointer-events-none grayscale blur-[1px]" : "opacity-100")}>
           {showFaceAuth ? (
             <div className="flex flex-col items-center gap-4 mt-8 animate-fadeIn">
               <div className="rounded-2xl overflow-hidden border border-accent2/30 shadow-glow2 w-full">
                 <Webcam 
                   ref={webcamRef} 
                   screenshotFormat="image/jpeg" 
                   className="w-full"
                   mirrored={true}
                 />
               </div>
               
               <button 
                 type="button" 
                 onClick={handleFaceLogin}
                 className="btn h-14 bg-accent2 text-black hover:opacity-90 w-full flex justify-center items-center gap-2 font-black transition-all shadow-glow2 mt-2"
                 disabled={loading}
               >
                 {loading ? (
                   <><Loader2 className="animate-spin text-black" size={24} /> Processing...</>
                 ) : (
                   <><ScanFace size={24} /> Verify via Face AI</>
                 )}
               </button>
               <button
                  type="button"
                  onClick={() => setShowFaceAuth(false)}
                  className="text-xs text-muted hover:text-white transition-colors mt-2 uppercase font-bold tracking-widest"
                  disabled={loading}
               >
                  Cancel Face Login
               </button>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-4 mt-6">
               <button 
                 type="button" 
                 onClick={handleWebAuthnLogin}
                 className="btn btn-primary h-16 text-lg flex items-center justify-center gap-3 w-full shadow-[0_10px_30px_rgba(0,229,255,0.3)] transition-all active:scale-[0.98]"
                 disabled={loading || !matchingUser}
               >
                 {loading ? (
                   <><Loader2 className="animate-spin text-black" size={28} /> Authenticating...</>
                 ) : (
                   <><Fingerprint size={28} /> WebAuthn Fingerprint</>
                 )}
               </button>

               <button 
                 type="button" 
                 onClick={() => setShowFaceAuth(true)}
                 className="btn h-14 border border-accent2 text-accent2 hover:bg-accent2/10 flex items-center justify-center gap-3 w-full transition-all active:scale-[0.98]"
                 disabled={loading || !matchingUser}
               >
                 <ScanFace size={24} /> Login with Face AI
               </button>
             </div>
           )}
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center text-xs">
          <span className="text-muted">Need a new wallet?</span>
          <button 
            type="button"
            onClick={() => navigate('/')} 
            className="text-accent hover:text-white transition-colors flex items-center gap-1 font-bold uppercase tracking-widest"
          >
            Create Wallet <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
