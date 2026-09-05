import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Lock, RefreshCw, RotateCcw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';

// ─── Score ring ──────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score ?? 0));
  const dashOffset = circumference - (pct / 100) * circumference;

  const color = pct >= 80 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171';
  const textColor = pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
        {/* Track */}
        <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.08)" />
        {/* Progress */}
        <circle
          cx="36" cy="36" r={radius}
          fill="none" strokeWidth="6"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className={`text-xl font-black leading-none ${textColor}`}>{pct}</span>
        <span className="text-[9px] text-[#E5E4E2]/50 font-semibold">/ 100</span>
      </div>
    </div>
  );
}

// ─── Verdict badge ───────────────────────────────────────────────────────────────
function VerdictBadge({ passed }) {
  return passed ? (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
      <ShieldCheck className="w-4 h-4 text-emerald-400" />
      <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">PASS</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30">
      <ShieldAlert className="w-4 h-4 text-red-400" />
      <span className="text-xs font-extrabold text-red-400 uppercase tracking-widest">FAIL</span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────
export default function DraftApprovalPanel({
  draft,
  passedReflection,
  overallScore,
  reflectorWarnings,
  retryCount,
  proposalId,
  onApproved,
  isSubmitting,
}) {
  const [editedDraft, setEditedDraft] = useState(draft ?? '');
  const [showWarnings, setShowWarnings] = useState(true);

  // Sync if parent receives new draft
  useEffect(() => {
    if (draft) setEditedDraft(draft);
  }, [draft]);

  const hasWarnings = reflectorWarnings && reflectorWarnings.length > 0;
  const scoreColor  = overallScore >= 80 ? 'text-emerald-400' : overallScore >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* ── Reflector quality summary ── */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E5E4E2]">Reflector Agent — Quality Review</h2>
            <p className="text-[11px] text-[#E5E4E2]/60">Adversarial audit completed</p>
          </div>
        </div>

        {/* Score + verdict row */}
        <div className="flex items-center gap-5">
          <ScoreRing score={overallScore} />
          <div className="flex-1 space-y-2">
            <VerdictBadge passed={passedReflection} />
            <p className={`text-xs font-semibold ${scoreColor}`}>
              Score: {overallScore} / 100
            </p>
            {retryCount != null && retryCount > 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[#E5E4E2]/50">
                <RotateCcw className="w-3 h-3" />
                {passedReflection
                  ? `Passed after ${retryCount} revision cycle${retryCount !== 1 ? 's' : ''}`
                  : `${retryCount} revision cycle${retryCount !== 1 ? 's' : ''} attempted`
                }
              </div>
            ) : (
              <p className="text-[11px] text-[#E5E4E2]/50 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Passed on first review
              </p>
            )}
          </div>
        </div>

        {/* Warnings */}
        {hasWarnings && (
          <div className="space-y-2">
            <button
              onClick={() => setShowWarnings(v => !v)}
              className="flex items-center gap-2 text-amber-400 text-[11px] font-bold uppercase tracking-wider hover:text-amber-300 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Reflector Warnings ({reflectorWarnings.length})
              <span className="ml-1 text-[#E5E4E2]/40 normal-case font-normal">
                {showWarnings ? '(click to collapse)' : '(click to expand)'}
              </span>
            </button>
            <AnimatePresence>
              {showWarnings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {reflectorWarnings.map((warning, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#E5E4E2]/75 leading-relaxed">{warning}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </GlassCard>

      {/* ── Draft editor ── */}
      <GlassCard className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#E5E4E2]">Generated Proposal Draft</h2>
              <p className="text-[11px] text-[#E5E4E2]/60">Review and edit before finalizing</p>
            </div>
          </div>
          <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-0.5">
            Editable
          </span>
        </div>

        <textarea
          id="proposal-draft-editor"
          rows={20}
          value={editedDraft}
          onChange={(e) => setEditedDraft(e.target.value)}
          className="w-full bg-white/3 border border-white/10 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-xs text-[#E5E4E2]/90 leading-relaxed font-mono resize-y outline-none transition-colors duration-200 placeholder-white/20"
          placeholder="Loading AI draft…"
        />

        <div className="flex flex-col gap-2 pt-1">
          <Button
            id="approve-proposal"
            variant="emerald"
            size="lg"
            icon={Lock}
            onClick={() => onApproved(editedDraft)}
            disabled={isSubmitting || !editedDraft.trim()}
            className="w-full font-extrabold tracking-wider shadow-2xl shadow-emerald-900/40"
          >
            {isSubmitting ? 'Saving…' : 'Approve & Finalize Proposal'}
          </Button>
          <p className="text-center text-[10px] text-[#E5E4E2]/35">
            Any manual edits above will be saved as the final proposal
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
