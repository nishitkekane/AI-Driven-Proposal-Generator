import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Lock, CheckCircle2, FileText, Building2, DollarSign, Clock, Copy, ExternalLink } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';

/**
 * FinalizePanel
 *
 * Shown after the proposal is approved (status === 'completed').
 * Uses real data from the backend — no mock data.
 *
 * Props:
 *   proposalId      {string}  UUID of the completed proposal
 *   finalProposal   {string}  The approved proposal text
 *   selectedPricing {object}  { tierName, totalHours, totalCost, roleBreakdown, rationale }
 *   title           {string}  Proposal title (from formData.projectTitle)
 */
export default function FinalizePanel({ proposalId, finalProposal, selectedPricing, title }) {
  const [copied, setCopied] = useState(false);

  if (!finalProposal) return null;

  const tierName  = selectedPricing?.tierName   ?? '—';
  const totalCost = selectedPricing?.totalCost  ?? 0;
  const totalHours = selectedPricing?.totalHours ?? 0;

  const handleExport = () => {
    const content = [
      'PROPOSALFORGE AI — FINALIZED PROPOSAL',
      '='.repeat(50),
      '',
      `Title:     ${title || 'Proposal'}`,
      `Tier:      ${tierName} (${totalHours}h @ $${totalCost.toLocaleString()})`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '─'.repeat(50),
      '',
      finalProposal,
      '',
      '─'.repeat(50),
      '--- Finalized with ProposalForge AI ---',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `proposal_${title?.replace(/\s+/g, '_') || 'export'}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalProposal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = finalProposal;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-4"
    >
      {/* ── Success card ── */}
      <GlassCard className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E5E4E2]">Proposal Finalized</h2>
            <p className="text-[11px] text-[#E5E4E2]/60">Multi-agent workflow complete</p>
          </div>
        </div>

        {/* Summary banner */}
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Approved & Locked
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#E5E4E2]/80">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{title || 'Proposal'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#E5E4E2]/80">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="capitalize">{tierName} Tier</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white/4 border border-white/10">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-black text-emerald-400">
              ${(totalCost / 1000).toFixed(0)}k
            </div>
            <div className="text-[10px] text-[#E5E4E2]/55 mt-0.5">Total Cost</div>
          </div>
          <div className="p-3 rounded-xl bg-white/4 border border-white/10">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-black text-cyan-400">{totalHours}h</div>
            <div className="text-[10px] text-[#E5E4E2]/55 mt-0.5">Total Hours</div>
          </div>
          <div className="p-3 rounded-xl bg-white/4 border border-white/10">
            <div className="text-lg font-black text-[#E5E4E2] capitalize">{tierName}</div>
            <div className="text-[10px] text-[#E5E4E2]/55 mt-0.5">Tier</div>
          </div>
        </div>

        {/* Export actions */}
        <div className="space-y-2 pt-1">
          <Button
            id="export-proposal"
            variant="primary"
            size="lg"
            icon={Download}
            onClick={handleExport}
            className="w-full font-bold tracking-wide"
          >
            Export as .txt File
          </Button>
          <Button
            id="copy-proposal"
            variant="secondary"
            size="md"
            icon={copied ? CheckCircle2 : Copy}
            onClick={handleCopy}
            className={`w-full font-semibold transition-colors ${copied ? 'text-emerald-400' : ''}`}
          >
            {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
          </Button>
        </div>
      </GlassCard>

      {/* ── Final proposal preview ── */}
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#E5E4E2]">Final Proposal Preview</h2>
            <p className="text-[11px] text-[#E5E4E2]/50">Read-only — export or copy to use</p>
          </div>
        </div>
        <pre className="whitespace-pre-wrap text-xs text-[#E5E4E2]/75 leading-relaxed font-mono max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-1">
          {finalProposal}
        </pre>
      </GlassCard>
    </motion.div>
  );
}
