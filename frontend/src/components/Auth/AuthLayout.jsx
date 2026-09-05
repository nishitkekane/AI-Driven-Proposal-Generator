import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import AnimatedBackground from '../Landing/AnimatedBackground';
import GlassCard from '../ui/GlassCard';

export default function AuthLayout({ children, title, subtitle }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-[#E5E4E2] relative flex flex-col justify-between overflow-hidden">
      <AnimatedBackground />

      {/* Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E5E4E2] to-slate-400 p-[1px]">
            <div className="w-full h-full bg-[#082567] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#E5E4E2]" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight text-[#E5E4E2]">
            ProposalForge <span className="text-cyan-400 font-medium text-xs">AI</span>
          </span>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#E5E4E2]/70 hover:text-[#E5E4E2] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>
      </header>

      {/* Centered Glass Form Container */}
      <main className="relative z-10 max-w-md w-full mx-auto px-6 py-12 flex-1 flex items-center justify-center">
        <GlassCard glow className="w-full p-8 md:p-10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[#E5E4E2] mb-2">{title}</h1>
            {subtitle && (
              <p className="text-xs text-[#E5E4E2]/70">{subtitle}</p>
            )}
          </div>

          {children}
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-[#E5E4E2]/50">
        ProposalForge AI &copy; 2026 &bull; Autonomous Proposal Engine
      </footer>
    </div>
  );
}
