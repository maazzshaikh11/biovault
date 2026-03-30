import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SendTransaction from './pages/SendTransaction';
import FaceAuth from './pages/FaceAuth';

// Simple nav header
function Header() {
  return (
    <header className="flex items-center justify-between p-4 px-8 border-b border-border bg-[rgba(5,10,15,0.7)] backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent2 rounded-lg flex items-center justify-center text-sm shadow-glow">
          <span role="img" aria-label="lock text-black">🔐</span>
        </div>
        Bio<span className="text-accent">Vault</span>
      </div>
      <div className="flex items-center gap-2 font-mono text-xs text-muted">
        <div className="w-2 h-2 rounded-full bg-accent2 shadow-[0_0_8px_var(--tw-shadow-glow2)]"></div>
        SYSTEM ONLINE
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col relative z-10 w-full animate-fadeIn">
        <Header />
        <main className="flex-1 p-4 md:p-8 w-full">
          <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/send" element={<SendTransaction />} />
            <Route path="/face" element={<FaceAuth />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
