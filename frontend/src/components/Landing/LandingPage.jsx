import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Clock, 
  TrendingUp, 
  FileText, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import FeatureCard from './FeatureCard';
import Button from '../ui/Button';
import GlassCard from '../ui/GlassCard';
import { MOCK_AGENTS } from '../../data/mockData';

export default function LandingPage() {
  const navigate = useNavigate();

  const heroWords = ["Forge", "Winning", "Proposals,", "Instantly"];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen text-[#E5E4E2] relative overflow-hidden flex flex-col justify-between">
      <AnimatedBackground />

      {/* Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E5E4E2] to-slate-400 p-[1px] shadow-lg shadow-black/40">
            <div className="w-full h-full bg-[#082567] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#E5E4E2]" />
            </div>
          </div>
          <span className="text-xl font-black tracking-tight text-[#E5E4E2]">
            ProposalForge <span className="text-cyan-400 font-semibold text-sm">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20 text-center flex-1 flex flex-col items-center justify-center">
        {/* Top Tagline Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-[#E5E4E2]/20 mb-8"
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#E5E4E2]/90">
            Autonomous 4-Agent AI Workflow
          </span>
        </motion.div>

        {/* 4-Word Massive Hero Title */}
        <motion.h1 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6 glow-text"
        >
          {heroWords.map((word, idx) => (
            <motion.span
              key={idx}
              variants={wordVariants}
              className={idx === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-[#E5E4E2] via-white to-slate-300 inline-block mr-3" : "inline-block mr-3"}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* 2-Line Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg md:text-xl text-[#E5E4E2]/85 max-w-3xl leading-relaxed font-normal mb-10 text-balance"
        >
          Transform complex raw material requirements into optimized, client-ready proposals in seconds using automated intelligence.  
          <br className="hidden md:block" />
          Seamlessly refine AI outputs with integrated human-in-the-loop controls to ensure total precision.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-16"
        >
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => navigate('/dashboard')}
            icon={ArrowRight}
            className="w-full sm:w-auto shadow-2xl shadow-white/10"
          >
            Launch Workspace
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={() => navigate('/signup')}
            className="w-full sm:w-auto"
          >
            Create Free Account
          </Button>
        </motion.div>

        {/* Quick Value Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl"
        >
          <GlassCard className="p-4 text-center" >
            <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#E5E4E2]">4-6 Hours</div>
            <div className="text-xs text-[#E5E4E2]/70">Saved per proposal</div>
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#E5E4E2]">+38%</div>
            <div className="text-xs text-[#E5E4E2]/70">Average win rate boost</div>
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <ShieldCheck className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#E5E4E2]">Adversarial</div>
            <div className="text-xs text-[#E5E4E2]/70">Overquote protection</div>
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <Zap className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-[#E5E4E2]">&lt; 30 Seconds</div>
            <div className="text-xs text-[#E5E4E2]/70">Full draft synthesis</div>
          </GlassCard>
        </motion.div>
      </main>

      {/* Agents Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-[#E5E4E2]/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2 block">
            Beyond Prompt Engineering
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#E5E4E2] mb-4">
            The 4-Agent Orchestrated Workflow
          </h2>
          <p className="text-sm text-[#E5E4E2]/75">
            Single-prompt AI fails at business proposals because it lacks domain context and self-auditing. ProposalForge deploys four autonomous agents acting in unison.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_AGENTS.map((agent, index) => (
            <FeatureCard key={agent.id} agent={agent} index={index} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 border-t border-[#E5E4E2]/10 w-full flex flex-col sm:flex-row items-center justify-between text-xs text-[#E5E4E2]/60 gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>ProposalForge AI &copy; 2026. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-[#E5E4E2] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#E5E4E2] transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-[#E5E4E2] transition-colors">API Documentation</a>
        </div>
      </footer>
    </div>
  );
}
