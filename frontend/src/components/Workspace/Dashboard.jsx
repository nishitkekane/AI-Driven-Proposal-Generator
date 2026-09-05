import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertTriangle, CheckCircle2, Search, ListChecks,
  MessageSquareDot, Send, ChevronRight, ExternalLink, Lightbulb,
} from 'lucide-react';
import AnimatedBackground from '../Landing/AnimatedBackground';
import Navbar from './Navbar';
import RequirementInput from './RequirementInput';
import AIExecutionTimeline from './AIExecutionTimeline';
import PricingTierPanel from './PricingTierPanel';
import DraftApprovalPanel from './DraftApprovalPanel';
import FinalizePanel from './FinalizePanel';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import { INITIAL_REQUIREMENT } from '../../data/mockData';
import {
  createProposal,
  getProposal,
  startWorkflow,
  submitClarifications,
  finalizePricing,
  approveProposal,
} from '../../services/api';
import useWorkflowWebSocket from '../../hooks/useWorkflowWebSocket';

// ─── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  const map = {
    high:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20   text-amber-400   border-amber-500/30',
    low:    'bg-red-500/20     text-red-400     border-red-500/30',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${map[level] ?? map.low}`}>
      {level}
    </span>
  );
}

// ─── Idle Section ──────────────────────────────────────────────────────────────
function IdleHint() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-[#E5E4E2]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-3-3v6m9-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-[#E5E4E2]/50">
        Fill in your requirements and click<br />
        <span className="text-cyan-400">"Generate AI Proposal"</span> to begin
      </p>
      <p className="text-xs text-[#E5E4E2]/30 mt-2">
        The multi-agent workflow & real-time checkpoints will stream here
      </p>
    </motion.div>
  );
}

function SpinnerOverlay({ label, subtitle }) {
  return (
    <motion.div
      key="spinner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4"
    >
      <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      <div className="space-y-1">
        <p className="text-sm text-[#E5E4E2]/85 font-semibold">{label}</p>
        {subtitle && <p className="text-xs text-[#E5E4E2]/45">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

function ErrorBanner({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span><span className="font-bold">Error:</span> {message}</span>
    </motion.div>
  );
}

/** Phase 1 result — clarification Q&A form */
function ClarificationPanel({ ambiguities, onSubmit, isSubmitting }) {
  const [answers, setAnswers] = useState(ambiguities.map(() => ''));

  const allAnswered = answers.every((a) => a.trim().length > 0);

  const handleChange = (idx, val) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  return (
    <motion.div
      key="clarification"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <MessageSquareDot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E5E4E2]">Clarification Required</h2>
            <p className="text-[11px] text-[#E5E4E2]/60">
              The Planner Agent needs your answers before finalizing the plan
            </p>
          </div>
          <span className="ml-auto text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
            {ambiguities.length} question{ambiguities.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-4">
          {ambiguities.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="space-y-1.5"
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm font-medium text-[#E5E4E2]/90 leading-relaxed">{q}</p>
              </div>
              <textarea
                id={`clarification-answer-${i}`}
                rows={2}
                value={answers[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={isSubmitting}
                placeholder="Your answer…"
                className="w-full ml-7 bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-sm text-[#E5E4E2] placeholder-white/25 resize-none outline-none transition-colors duration-200 disabled:opacity-50"
              />
            </motion.div>
          ))}
        </div>

        <Button
          id="submit-clarifications"
          variant="primary"
          icon={Send}
          onClick={() => onSubmit(answers)}
          disabled={!allAnswered || isSubmitting}
          className="w-full font-bold tracking-wide"
        >
          {isSubmitting ? 'Submitting…' : 'Submit Answers & Finalize Plan'}
        </Button>
      </GlassCard>
    </motion.div>
  );
}

/** Phase 2 result — task list */
function TaskListPanel({ tasks }) {
  if (!tasks || tasks.length === 0) return null;
  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E5E4E2]">Finalized Task Plan</h2>
            <p className="text-[11px] text-[#E5E4E2]/60">{tasks.length} implementation tasks</p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Planner Done
          </span>
        </div>
        <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {tasks.map((task, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-2.5 text-xs text-[#E5E4E2]/80"
            >
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>{task}</span>
            </motion.li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
}

/** Research findings card */
function ResearchFindingsCard({ findings }) {
  if (!findings || findings.length === 0) return null;
  return (
    <GlassCard className="space-y-3">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#E5E4E2]">Research Findings</h2>
          <p className="text-[11px] text-[#E5E4E2]/60">{findings.length} task-anchored insights</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> Research Done
        </span>
      </div>

      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {findings.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-3 rounded-xl bg-white/4 border border-white/8 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                {f.task_reference ?? f.taskReference ?? `Insight ${i+1}`}
              </span>
              {f.confidence && <ConfidenceBadge level={f.confidence} />}
            </div>
            <p className="text-xs text-[#E5E4E2]/80 leading-relaxed">{f.insight}</p>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Dashboard Main Component ──────────────────────────────────────────────────
export default function Dashboard() {
  const [formData, setFormData]                 = useState(INITIAL_REQUIREMENT);
  const [proposalId, setProposalId]             = useState(null);
  const [status, setStatus]                     = useState('idle');
  const [error, setError]                       = useState('');
  const [isSubmitting, setIsSubmitting]         = useState(false);

  // Workflow Data
  const [ambiguities, setAmbiguities]           = useState([]);
  const [tasks, setTasks]                       = useState([]);
  const [findings, setFindings]                 = useState([]);
  const [pricingTiers, setPricingTiers]         = useState(null);
  const [selectedPricing, setSelectedPricing]   = useState(null);
  const [draftData, setDraftData]               = useState(null);
  const [finalProposal, setFinalProposal]       = useState('');
  const [reflectorStats, setReflectorStats]     = useState(null);
  const [retryAttempt, setRetryAttempt]         = useState(0);

  // ── WebSocket message handler ──────────────────────────────────────────────
  const handleWsMessage = useCallback((wsStatus, payload) => {
    console.info(`[Dashboard] WS Event: ${wsStatus}`, payload);

    setStatus(wsStatus);
    setIsSubmitting(false);

    switch (wsStatus) {
      case 'planner_phase1_running':
        break;

      case 'ambiguities_received':
        if (payload?.ambiguities) {
          setAmbiguities(payload.ambiguities);
        }
        break;

      case 'planner_phase2_running':
        break;

      case 'researcher_running':
        break;

      case 'pricing_calculating':
        break;

      case 'pending_pricing':
        if (payload?.tiers) setPricingTiers(payload.tiers);
        if (payload?.tasks) setTasks(payload.tasks);
        if (payload?.findings) setFindings(payload.findings);
        break;

      case 'drafting_proposal':
        break;

      case 'revising_draft':
        if (payload?.retryAttempt) {
          setRetryAttempt(payload.retryAttempt);
        }
        break;

      case 'pending_draft_approval':
        if (payload) {
          setDraftData({
            draft: payload.draft || '',
            passedReflection: payload.passed_reflection ?? false,
            overallScore: payload.overall_score ?? 0,
            reflectorWarnings: payload.reflector_warnings || [],
            retryCount: payload.retry_count ?? 0,
          });
          setReflectorStats({
            overallScore: payload.overall_score ?? 0,
            passedReflection: payload.passed_reflection ?? false,
            retryCount: payload.retry_count ?? 0,
          });
        }
        break;

      case 'completed':
        break;

      case 'error':
        setError(payload?.error || 'An error occurred during workflow execution.');
        break;

      default:
        break;
    }
  }, []);

  // Hook up WebSocket
  useWorkflowWebSocket(proposalId, handleWsMessage);

  // ── Polling Fallback (ensures UI sync even if WebSocket drops or reconnects) ───
  useEffect(() => {
    if (!proposalId) return;
    if (status === 'completed' || status === 'error') return;

    const safeParse = (val) => {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    };

    const syncProposalState = async () => {
      try {
        const prop = await getProposal(proposalId);
        if (!prop || !prop.status) return;

        if (prop.status === 'PENDING_PRICING') {
          const parsedTiers = safeParse(prop.pricingTiers);
          const parsedTasks = safeParse(prop.planTasks);
          const parsedFindings = safeParse(prop.researchFindings);

          if (parsedTiers) setPricingTiers(parsedTiers);
          if (parsedTasks && Array.isArray(parsedTasks)) setTasks(parsedTasks);
          if (parsedFindings && Array.isArray(parsedFindings)) setFindings(parsedFindings);

          setStatus('pending_pricing');
          setIsSubmitting(false);
        } else if (prop.status === 'PENDING_CLARIFICATION' && status !== 'planner_phase2_running') {
          const parsedAmbiguities = safeParse(prop.planTasks);
          if (parsedAmbiguities && Array.isArray(parsedAmbiguities)) {
            setAmbiguities(parsedAmbiguities);
          }
          setStatus('ambiguities_received');
          setIsSubmitting(false);
        } else if (prop.status === 'PENDING_DRAFT_APPROVAL') {
          const parsedTasks = safeParse(prop.planTasks);
          if (parsedTasks && Array.isArray(parsedTasks)) setTasks(parsedTasks);
          setDraftData(prev => prev || {
            draft: prop.draftProposal || '',
            passedReflection: true,
            overallScore: 85,
            reflectorWarnings: [],
            retryCount: 0,
          });
          setStatus('pending_draft_approval');
          setIsSubmitting(false);
        } else if (prop.status === 'COMPLETED') {
          setFinalProposal(prop.finalProposal || prop.draftProposal);
          setStatus('completed');
          setIsSubmitting(false);
        } else if (prop.status === 'FAILED') {
          setError('Proposal generation encountered a failure.');
          setStatus('error');
          setIsSubmitting(false);
        }
      } catch (err) {
        console.debug('[Dashboard] Poll sync check:', err);
      }
    };

    syncProposalState();
    const interval = setInterval(syncProposalState, 2500);

    return () => clearInterval(interval);
  }, [proposalId, status]);

  const buildText = (fd) =>
    [
      fd.projectTitle && `Project: ${fd.projectTitle}`,
      fd.clientName   && `Client: ${fd.clientName}`,
      fd.industry     && `Industry: ${fd.industry}`,
      fd.description,
      fd.budgetRange  && `Budget: ${fd.budgetRange}`,
      fd.deadline     && `Timeline: ${fd.deadline}`,
    ]
      .filter(Boolean)
      .join('\n\n');

  // ── Step 1: Start Workflow ─────────────────────────────────────────────────
  const handleGenerate = async () => {
    setError('');
    setAmbiguities([]);
    setTasks([]);
    setFindings([]);
    setPricingTiers(null);
    setSelectedPricing(null);
    setDraftData(null);
    setFinalProposal('');
    setReflectorStats(null);
    setRetryAttempt(0);
    setIsSubmitting(true);

    try {
      const text = buildText(formData);
      const title = formData.projectTitle?.trim() || 'Custom Proposal';

      // 1. Create Proposal record in DB
      const proposal = await createProposal({
        title,
        customerRequirement: text,
      });

      setProposalId(proposal.id);
      setStatus('planner_phase1_running');

      // 2. Trigger async orchestrator workflow
      await startWorkflow(proposal.id);
    } catch (err) {
      console.error('Failed to initiate proposal workflow:', err);
      setError(err.message || 'Failed to start AI workflow.');
      setStatus('error');
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Submit Clarification Answers ───────────────────────────────────
  const handleAnswersSubmit = async (answers) => {
    setIsSubmitting(true);
    setError('');
    try {
      await submitClarifications(proposalId, answers, ambiguities);
      setStatus('planner_phase2_running');
    } catch (err) {
      console.error('Failed to submit clarifications:', err);
      setError(err.message || 'Failed to submit clarifications.');
      setIsSubmitting(false);
    }
  };

  // ── Step 3: Confirm Pricing Tier ───────────────────────────────────────────
  const handlePricingConfirm = async (tierKey, pricingSelection) => {
    setIsSubmitting(true);
    setError('');
    setSelectedPricing({ tierName: tierKey, ...pricingSelection });
    try {
      await finalizePricing(proposalId, {
        tierName: tierKey,
        ...pricingSelection,
      });
      setStatus('drafting_proposal');
    } catch (err) {
      console.error('Failed to finalize pricing:', err);
      setError(err.message || 'Failed to confirm pricing.');
      setIsSubmitting(false);
    }
  };

  // ── Step 4: Approve & Finalize Proposal ────────────────────────────────────
  const handleProposalApprove = async (editedDraftText) => {
    setIsSubmitting(true);
    setError('');
    setFinalProposal(editedDraftText);
    try {
      await approveProposal(proposalId, editedDraftText);
      setStatus('completed');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to approve proposal:', err);
      setError(err.message || 'Failed to approve proposal.');
      setIsSubmitting(false);
    }
  };

  // ── Right-panel Renderer ───────────────────────────────────────────────────
  const renderRightPanel = () => {
    if (status === 'idle') return <IdleHint />;

    if (status === 'planner_phase1_running') {
      return <SpinnerOverlay label="Planner Agent analysing requirements…" subtitle="Identifying missing parameters and blocking clarifications" />;
    }

    if (status === 'ambiguities_received') {
      return (
        <ClarificationPanel
          ambiguities={ambiguities}
          onSubmit={handleAnswersSubmit}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (status === 'planner_phase2_running') {
      return (
        <div className="space-y-4">
          <TaskListPanel tasks={tasks} />
          <SpinnerOverlay label="Planner Agent finalizing implementation roadmap…" subtitle="Incorporating your clarification answers" />
        </div>
      );
    }

    if (status === 'researcher_running') {
      return (
        <div className="space-y-4">
          <TaskListPanel tasks={tasks} />
          <SpinnerOverlay label="Researcher Agent gathering facts & web intelligence…" subtitle="Scanning market spot rates and domain benchmarks" />
        </div>
      );
    }

    if (status === 'pricing_calculating') {
      return (
        <div className="space-y-4">
          <TaskListPanel tasks={tasks} />
          <ResearchFindingsCard findings={findings} />
          <SpinnerOverlay label="Executor Agent calculating 3-Tier cost models…" subtitle="Querying company rate cards and historical project hours" />
        </div>
      );
    }

    if (status === 'pending_pricing') {
      return (
        <div className="space-y-4">
          <TaskListPanel tasks={tasks} />
          <ResearchFindingsCard findings={findings} />
          {pricingTiers ? (
            <PricingTierPanel
              tiers={pricingTiers}
              onConfirm={handlePricingConfirm}
              isSubmitting={isSubmitting}
            />
          ) : (
            <SpinnerOverlay label="Preparing Pricing Tiers…" subtitle="Structuring estimates from rate cards and historical benchmarks" />
          )}
        </div>
      );
    }

    if (status === 'drafting_proposal') {
      return (
        <div className="space-y-4">
          <TaskListPanel tasks={tasks} />
          <SpinnerOverlay label="Executor Agent drafting comprehensive proposal…" subtitle="Synthesizing scope, deliverables, and financial model" />
        </div>
      );
    }

    if (status === 'revising_draft') {
      return (
        <div className="space-y-4">
          <TaskListPanel tasks={tasks} />
          <SpinnerOverlay
            label={`Reflector Agent revision in progress (Attempt #${retryAttempt})…`}
            subtitle="Adversarial audit flagged inconsistencies; Executor is revising the draft"
          />
        </div>
      );
    }

    if (status === 'pending_draft_approval' && draftData) {
      return (
        <DraftApprovalPanel
          {...draftData}
          proposalId={proposalId}
          onApproved={handleProposalApprove}
          isSubmitting={isSubmitting}
        />
      );
    }

    if (status === 'completed') {
      return (
        <FinalizePanel
          proposalId={proposalId}
          finalProposal={finalProposal || draftData?.draft}
          selectedPricing={selectedPricing}
          title={formData.projectTitle}
        />
      );
    }

    if (status === 'error') {
      return (
        <div className="space-y-4">
          <ErrorBanner message={error} />
          {tasks.length > 0 && <TaskListPanel tasks={tasks} />}
        </div>
      );
    }

    return null;
  };

  const isRunning = [
    'planner_phase1_running',
    'planner_phase2_running',
    'researcher_running',
    'pricing_calculating',
    'drafting_proposal',
    'revising_draft',
  ].includes(status);

  return (
    <div className="min-h-screen text-[#E5E4E2] relative overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-5">
              <RequirementInput
                formData={formData}
                setFormData={setFormData}
                onGenerate={handleGenerate}
                isGenerating={isRunning || isSubmitting}
                hasGenerated={status !== 'idle'}
              />

              <AIExecutionTimeline
                status={status}
                reflectorStats={reflectorStats}
                retryAttempt={retryAttempt}
              />

              {/* Error banner on left column */}
              {status === 'error' && (
                <ErrorBanner message={error} />
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-5">
              <AnimatePresence mode="wait">
                {renderRightPanel()}
              </AnimatePresence>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
