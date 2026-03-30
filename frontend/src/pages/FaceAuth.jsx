import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Link } from "react-router-dom";
import { ArrowLeft, Scan, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function FaceAuth() {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle, success, error

  const capture = async (type) => {
    const userData = JSON.parse(localStorage.getItem('bioVault_user') || '{}');
    const userId = userData.userId || "guest";

    if (userId === "guest") {
      setMessage("Error: No local user found. Register first.");
      setStatus("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setStatus("idle");
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error("Could not capture image");
      const blob = await fetch(imageSrc).then(res => res.blob());

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("user_id", userId);

      const res = await fetch(`http://localhost:8000/${type}`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      
      if (data.status === "success" || data.verified === true) {
        setStatus("success");
        const successMsg = type === "register" ? "Face registered successfully!" : "Face verified successfully!";
        setMessage(successMsg);

        // SYNC METADATA: If registering, update the local user profile
        if (type === "register") {
            const updatedUser = { 
                ...userData, 
                authMethods: Array.from(new Set([...(userData.authMethods || []), 'face']))
            };
            localStorage.setItem('bioVault_user', JSON.stringify(updatedUser));
        }
      } else {
        setStatus("error");
        // Prioritize data.error, followed by data.message, then general fallback
        setMessage(data.error || data.message || "Failed to process face data. Ensure you are clearly visible.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Error connecting to Face AI server. Make sure it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-3xl border border-border max-w-lg mx-auto mt-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent2/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <Link to="/dashboard" className="absolute top-6 left-6 text-muted hover:text-white transition-colors flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest z-10">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
      
      <div className="section-tag mt-8">Biometric Extension</div>
      <h2 className="text-3xl font-bold mb-2 text-white text-center tracking-tight">Face Recognition</h2>
      <p className="text-muted text-sm text-center mb-8 max-w-xs">
        Use AI to create a secondary biometric layer for your wallet.
      </p>
      
      <div className="rounded-2xl overflow-hidden border border-accent2/20 shadow-[0_0_30px_rgba(0,255,157,0.1)] mb-8 relative group">
        <Webcam 
          ref={webcamRef} 
          screenshotFormat="image/jpeg" 
          className="w-full max-w-sm aspect-video object-cover"
          mirrored={true}
        />
        <div className="absolute inset-0 border-2 border-accent2/20 rounded-2xl pointer-events-none group-hover:border-accent2/40 transition-colors"></div>
        
        {loading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm animate-fadeIn">
                <Loader2 className="animate-spin text-accent2" size={40} />
                <span className="text-xs font-mono uppercase tracking-widest text-accent2">Analyzing...</span>
            </div>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full">
        <button 
          onClick={() => capture("register")}
          disabled={loading}
          className="btn h-14 bg-accent2 text-black font-extrabold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow2 disabled:opacity-50"
        >
          <Scan size={20} /> Register My Face
        </button>

        <button 
          onClick={() => capture("verify")}
          disabled={loading}
          className="btn h-14 bg-surface2 border border-border text-white flex items-center justify-center gap-2 hover:border-accent2/50 transition-all disabled:opacity-50"
        >
          Verify Alignment
        </button>
      </div>

      {message && (
        <div className={`mt-6 p-4 rounded-xl text-xs font-mono flex items-center gap-3 animate-slideUp w-full border ${
          status === "success" ? "bg-accent2/10 border-accent2/20 text-accent2" : 
          status === "error" ? "bg-danger/10 border-danger/20 text-danger" : 
          "bg-white/5 border-white/10 text-muted"
        }`}>
          {status === "success" ? <CheckCircle2 size={16} /> : status === "error" ? <AlertCircle size={16} /> : null}
          <span className="flex-1">{message}</span>
        </div>
      )}
    </div>
  );
}
