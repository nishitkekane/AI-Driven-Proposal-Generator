import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import { logoutUser, getUser } from '../../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  // Derive initials from name or email
  const displayName = user?.name || user?.email || 'User';
  const initials = displayName
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('');

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <header className="relative z-20 border-b border-[#E5E4E2]/15 bg-[#082567]/80 backdrop-blur-xl px-6 py-4">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E5E4E2] to-slate-400 p-[1px] shadow-lg shadow-black/40">
            <div className="w-full h-full bg-[#082567] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-[#E5E4E2]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-[#E5E4E2]">
                ProposalForge <span className="text-cyan-400 font-bold text-xs">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Workspace
              </span>
            </div>
            <p className="text-[10px] text-[#E5E4E2]/60 font-medium hidden sm:block">
              Multi-Agent Material Sourcing &amp; Proposal Engine
            </p>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs text-[#E5E4E2]/80 font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Agents Operational</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>JWT Session Active</span>
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pr-2 border-r border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-xs font-bold text-white shadow-md">
              {initials || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#E5E4E2] capitalize">{displayName}</div>
              <div className="text-[10px] text-[#E5E4E2]/60">{user?.email || ''}</div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-[#E5E4E2]/70 hover:text-red-400"
            icon={LogOut}
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
