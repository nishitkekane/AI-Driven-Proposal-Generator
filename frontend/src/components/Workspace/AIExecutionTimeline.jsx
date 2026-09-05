import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Loader2, Compass, Search,
  MessageSquareDot, Cpu, DollarSign, ShieldCheck, Lock, RotateCcw,
} from 'lucide-react';
import GlassCard from '../ui/GlassCard';

/**
 * AIExecutionTimeline
 *
 * Full 8-stage real-status execution timeline driven by the `status` prop.
 * No simulated timeouts — every state change comes from the WebSocket.
 *
 * Status values (from AgentOrchestratorService WebSocket events):
 *   'idle'                    → component hidden
 *   'planner_phase1_running'  → stage 1 active
 *   'ambiguities_received'    → stage 1 done, stage 2 active (awaiting user)
 *   'planner_phase2_running'  → stage 1+2 done, stage 3 active
 *   'researcher_running'      → stage 3 active
 *   'pricing_calculating'     → stage 3 done, stage 4 active
 *   'pending_pricing'         → stage 4 done, stage 5 active (awaiting user)
 *   'drafting_proposal'       → stage 5 done, stage 6 active
 *   'revising_draft'          → stage 6+7 active (reflector loop)
 *   'pending_draft_approval'  → stage 6+7 done, stage 8 active (awaiting user)
 *   'completed'               → all done
 *   'error'                   → timeline stays in last known state
 *
 * Props:
 *   status          {string}  - Current workflow status
 *   reflectorStats  {object}  - { overallScore, passedReflection, retryCount }
 *   retryAttempt    {number}  - Current revision attempt number (live)
 */

// ─── All statuses in pipeline order ─────────────────────────────────────────────
const ALL_STATUSES = [
  'planner_phase1_running',
  'ambiguities_received',
  'planner_phase2_running',
  'researcher_running',
  'pricing_calculating',
  'pending_pricing',
  'drafting_proposal',
  'revising_draft',
  'pending_draft_approval',
  'completed',
];

const STAGES = [
  {
    id: 'planner1',
    agent: 'Planner Agent',
    title: 'Phase 1 — Ambiguity Detection',
    detail: 'Reading requirements, identifying missing parameters and blocking clarifications.',
    icon: Compass,
    color: 'blue',
    activeOn: ['planner_phase1_running'],
    doneOn: ['ambiguities_received', 'planner_phase2_running', 'researcher_running',
             'pricing_calculating', 'pending_pricing', 'drafting_proposal',
             'revising_draft', 'pending_draft_approval', 'completed'],
  },
  {
    id: 'hitl_clarify',
    agent: 'Human-in-the-Loop',
    title: 'Clarification Q&A',
    detail: 'Awaiting your answers to the clarifying questions before finalising the plan.',
    icon: MessageSquareDot,
    color: 'amber',
    activeOn: ['ambiguities_received'],
    doneOn: ['planner_phase2_running', 'researcher_running', 'pricing_calculating',
             'pending_pricing', 'drafting_proposal', 'revising_draft',
             'pending_draft_approval', 'completed'],
  },
  {
    id: 'researcher',
    agent: 'Researcher Agent',
    title: 'Fact Gathering & Synthesis',
    detail: 'Deriving search queries, scanning the web, synthesising task-anchored findings.',
    icon: Search,
    color: 'cyan',
    activeOn: ['planner_phase2_running', 'researcher_running'],
    doneOn: ['pricing_calculating', 'pending_pricing', 'drafting_proposal',
             'revising_draft', 'pending_draft_approval', 'completed'],
  },
  {
    id: 'executor_pricing',
    agent: 'Executor Agent',
    title: '3-Tier Pricing Calculation',
    detail: 'Querying rate cards, analysing historical data, generating Conservative, Standard & Aggressive tiers.',
    icon: DollarSign,
    color: 'emerald',
    activeOn: ['pricing_calculating'],
    doneOn: ['pending_pricing', 'drafting_proposal', 'revising_draft',
             'pending_draft_approval', 'completed'],
  },
  {
    id: 'hitl_pricing',
    agent: 'Human-in-the-Loop',
    title: 'Pricing Tier Selection',
    detail: 'Awaiting your tier selection to trigger proposal draft generation.',
    icon: DollarSign,
    color: 'amber',
    activeOn: ['pending_pricing'],
    doneOn: ['drafting_proposal', 'revising_draft', 'pending_draft_approval', 'completed'],
  },
  {
    id: 'executor_draft',
    agent: 'Executor Agent',
    title: 'Proposal Draft Generation',
    detail: 'Composing the full proposal document using your selected pricing, tasks, and research insights.',
    icon: Cpu,
    color: 'violet',
    activeOn: ['drafting_proposal', 'revising_draft'],
    doneOn: ['pending_draft_approval', 'completed'],
  },
  {
    id: 'reflector',
    agent: 'Reflector Agent',
    title: 'Adversarial Quality Review',
    detail: 'Auditing the draft for hallucinations, pricing inconsistencies, and missing requirements. Revising if needed.',
    icon: ShieldCheck,
    color: 'rose',
    activeOn: ['revising_draft'],
    doneOn: ['pending_draft_approval', 'completed'],
  },
  {
    id: 'hitl_approve',
    agent: 'Human-in-the-Loop',
    title: 'Final Review & Approval',
    detail: 'Review the AI draft, make any edits, and approve to lock the proposal.',
    icon: Lock,
    color: 'emerald',
    activeOn: ['pending_draft_approval'],
    doneOn: ['completed'],
  },
];

const colorMap = {
  blue:    { done: 'bg-blue-500/20 border-blue-500/60 text-blue-400',      active: 'bg-blue-500/15 border-blue-500/60 text-blue-300 animate-pulse',    label: 'text-blue-400',    line: 'bg-blue-500/40'    },
  amber:   { done: 'bg-amber-500/20 border-amber-500/60 text-amber-400',   active: 'bg-amber-500/15 border-amber-500/60 text-amber-300 animate-pulse',  label: 'text-amber-400',   line: 'bg-amber-500/40'   },
  cyan:    { done: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400', active: 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 animate-pulse',  label: 'text-cyan-400',    line: 'bg-cyan-500/40'    },
  emerald: { done: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400', active: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300 animate-pulse', label: 'text-emerald-400', line: 'bg-emerald-500/40' },
  violet:  { done: 'bg-violet-500/20 border-violet-500/60 text-violet-400',active: 'bg-violet-500/15 border-violet-500/60 text-violet-300 animate-pulse', label: 'text-violet-400', line: 'bg-violet-500/40'  },
  rose:    { done: 'bg-rose-500/20 border-rose-500/60 text-rose-400',      active: 'bg-rose-500/15 border-rose-500/60 text-rose-300 animate-pulse',     label: 'text-rose-400',    line: 'bg-rose-500/40'    },
};

// ─── Reflector score badge ───────────────────────────────────────────────────────
function ReflectorScoreBadge({ reflectorStats }) {
  if (!reflectorStats) return null;
  const { overallScore, passedReflection, retryCount } = reflectorStats;
  const scoreColor = overallScore >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : overallScore >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-red-400 bg-red-500/10 border-red-500/30';
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
      {passedReflection ? <CheckCircle2 className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
      Score: {overallScore}/100 — {passedReflection ? 'PASS' : 'FAIL'}
      {retryCount > 0 && ` (${retryCount} revision${retryCount !== 1 ? 's' : ''})`}
    </div>
  );
}

export default function AIExecutionTimeline({ status, reflectorStats, retryAttempt }) {
  if (!status || status === 'idle') return null;

  const isRunning = ['planner_phase1_running', 'planner_phase2_running', 'researcher_running',
                     'pricing_calculating', 'drafting_proposal', 'revising_draft'].includes(status);
  const isDone    = status === 'completed';
  const isWaiting = ['ambiguities_received', 'pending_pricing', 'pending_draft_approval'].includes(status);

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#E5E4E2]">AI Agent Execution Stream</h2>
          <p className="text-[11px] text-[#E5E4E2]/60">Live multi-agent orchestration pipeline</p>
        </div>
        <div className="ml-auto">
          {isRunning && (
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-medium">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing…</span>
            </div>
          )}
          {isDone && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete</span>
            </div>
          )}
          {isWaiting && !isDone && !isRunning && (
            <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
              <MessageSquareDot className="w-3.5 h-3.5" />
              <span>Awaiting your input</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {STAGES.map((stage, idx) => {
          const isDoneStep   = stage.doneOn.includes(status);
          const isActiveStep = stage.activeOn.includes(status) && !isDoneStep;
          const isPending    = !isDoneStep && !isActiveStep;
          const Icon         = stage.icon;
          const colors       = colorMap[stage.color];
          const isReflector  = stage.id === 'reflector';
          const isRevising   = status === 'revising_draft';

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.04 }}
              className="flex items-start gap-3"
            >
              {/* Status icon + connector line */}
              <div className="flex flex-col items-center mt-0.5">
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-500 flex-shrink-0
                  ${isDoneStep   ? colors.done   : ''}
                  ${isActiveStep ? colors.active : ''}
                  ${isPending    ? 'bg-white/5 border-white/10 text-white/30' : ''}
                `}>
                  {isDoneStep   && <CheckCircle2 className="w-4 h-4" />}
                  {isActiveStep && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending    && <Circle className="w-3 h-3" />}
                </div>
                {idx < STAGES.length - 1 && (
                  <div className={`w-px h-5 mt-1 transition-all duration-500 ${isDoneStep ? colors.line : 'bg-white/8'}`} />
                )}
              </div>

              {/* Stage content */}
              <div className="flex-1 pb-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isDoneStep ? colors.label : isActiveStep ? colors.label : 'text-white/25'}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isDoneStep ? colors.label : isActiveStep ? colors.label : 'text-white/25'}`}>
                    {stage.agent}
                  </span>
                  {/* Retry badge for reflector when actively revising */}
                  {isReflector && isRevising && isActiveStep && retryAttempt > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1">
                      <RotateCcw className="w-2.5 h-2.5" />
                      Revision #{retryAttempt}
                    </span>
                  )}
                  {/* Score badge after reflector done */}
                  {isReflector && isDoneStep && reflectorStats && (
                    <ReflectorScoreBadge reflectorStats={reflectorStats} />
                  )}
                </div>
                <p className={`text-sm font-semibold mb-0.5 leading-snug ${isDoneStep || isActiveStep ? 'text-[#E5E4E2]' : 'text-white/20'}`}>
                  {stage.title}
                </p>
                <AnimatePresence>
                  {(isDoneStep || isActiveStep) && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-[#E5E4E2]/55 leading-relaxed"
                    >
                      {stage.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
