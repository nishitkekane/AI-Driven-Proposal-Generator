import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Clock, Users, ChevronDown, ChevronUp, CheckCircle2, Zap, Shield, Gauge } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';

// ─── Tier config ────────────────────────────────────────────────────────────────
const TIER_META = {
  conservative: {
    label: 'Conservative',
    icon: Shield,
    accent: 'from-blue-500 to-indigo-600',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    glow: 'shadow-blue-900/30',
  },
  standard: {
    label: 'Standard',
    icon: Gauge,
    accent: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    glow: 'shadow-emerald-900/30',
    recommended: true,
  },
  aggressive: {
    label: 'Aggressive',
    icon: Zap,
    accent: 'from-amber-500 to-orange-600',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    glow: 'shadow-amber-900/30',
  },
};

// ─── Role breakdown table ────────────────────────────────────────────────────────
function RoleBreakdownTable({ roleBreakdown }) {
  if (!roleBreakdown || roleBreakdown.length === 0) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 mt-3">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/3">
            <th className="text-left px-3 py-2 font-bold text-[#E5E4E2]/60 uppercase tracking-wider">Role</th>
            <th className="text-center px-3 py-2 font-bold text-[#E5E4E2]/60 uppercase tracking-wider">Hours</th>
            <th className="text-center px-3 py-2 font-bold text-[#E5E4E2]/60 uppercase tracking-wider">Rate</th>
            <th className="text-right px-3 py-2 font-bold text-[#E5E4E2]/60 uppercase tracking-wider">Cost</th>
          </tr>
        </thead>
        <tbody>
          {roleBreakdown.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
              <td className="px-3 py-2.5 text-[#E5E4E2]/90 font-medium">{row.role}</td>
              <td className="px-3 py-2.5 text-center text-cyan-400 font-mono">{row.hours}h</td>
              <td className="px-3 py-2.5 text-center text-[#E5E4E2]/70 font-mono">${row.rate}/h</td>
              <td className="px-3 py-2.5 text-right text-emerald-400 font-bold font-mono">
                ${row.cost?.toLocaleString() ?? (row.hours * row.rate).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Single tier card ────────────────────────────────────────────────────────────
function TierCard({ tierKey, tier, meta, isSelected, onSelect }) {
  const Icon = meta.icon;
  return (
    <motion.div
      layout
      onClick={() => onSelect(tierKey)}
      className={`
        relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex flex-col gap-2
        ${isSelected
          ? `${meta.border} ${meta.bg} shadow-lg ${meta.glow}`
          : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
        }
      `}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Recommended badge */}
      {meta.recommended && (
        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}>
          Recommended
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mt-1">
        <div className={`p-1.5 rounded-lg ${meta.bg} border ${meta.border}`}>
          <Icon className={`w-3.5 h-3.5 ${meta.text}`} />
        </div>
        <span className={`text-sm font-extrabold uppercase tracking-wider ${isSelected ? meta.text : 'text-[#E5E4E2]/70'}`}>
          {meta.label}
        </span>
        {isSelected && (
          <CheckCircle2 className={`w-4 h-4 ml-auto ${meta.text}`} />
        )}
      </div>

      {/* Price */}
      <div className={`text-2xl font-black ${isSelected ? meta.text : 'text-[#E5E4E2]'}`}>
        ${tier.total_cost?.toLocaleString() ?? '—'}
      </div>

      {/* Hours */}
      <div className="flex items-center gap-3 text-xs text-[#E5E4E2]/60">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {tier.total_hours}h total
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {tier.role_breakdown?.length ?? 0} roles
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function PricingTierPanel({ tiers, onConfirm, isSubmitting }) {
  const [selectedKey, setSelectedKey] = useState('standard');
  const [showBreakdown, setShowBreakdown] = useState(true);

  if (!tiers) return null;

  const tierKeys = ['conservative', 'standard', 'aggressive'].filter(k => tiers[k]);
  const selectedTier = tiers[selectedKey];
  const selectedMeta = TIER_META[selectedKey];

  const handleConfirm = () => {
    if (!selectedTier) return;
    onConfirm(selectedKey, {
      totalHours:    selectedTier.total_hours,
      totalCost:     selectedTier.total_cost,
      roleBreakdown: selectedTier.role_breakdown,
      rationale:     selectedTier.rationale,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <GlassCard className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E5E4E2]">Executor Agent — 3-Tier Pricing</h2>
            <p className="text-[11px] text-[#E5E4E2]/60">Select your pricing strategy to generate the proposal draft</p>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {tierKeys.map(key => (
            <TierCard
              key={key}
              tierKey={key}
              tier={tiers[key]}
              meta={TIER_META[key]}
              isSelected={selectedKey === key}
              onSelect={setSelectedKey}
            />
          ))}
        </div>

        {/* Selected tier detail */}
        <AnimatePresence mode="wait">
          {selectedTier && (
            <motion.div
              key={selectedKey}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border p-4 space-y-3 ${selectedMeta.border} ${selectedMeta.bg}`}
            >
              {/* Toggle breakdown */}
              <button
                onClick={() => setShowBreakdown(v => !v)}
                className="flex items-center gap-2 w-full text-left"
              >
                <Users className={`w-3.5 h-3.5 ${selectedMeta.text}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${selectedMeta.text}`}>
                  Role Breakdown — {selectedTier.role_breakdown?.length} roles
                </span>
                {showBreakdown
                  ? <ChevronUp className="w-3.5 h-3.5 ml-auto text-[#E5E4E2]/40" />
                  : <ChevronDown className="w-3.5 h-3.5 ml-auto text-[#E5E4E2]/40" />
                }
              </button>

              {showBreakdown && (
                <RoleBreakdownTable roleBreakdown={selectedTier.role_breakdown} />
              )}

              {/* Rationale */}
              {selectedTier.rationale && (
                <div className="pt-1 border-t border-white/10">
                  <p className="text-[11px] font-bold text-[#E5E4E2]/50 uppercase tracking-wider mb-1">AI Rationale</p>
                  <p className="text-xs text-[#E5E4E2]/75 leading-relaxed">{selectedTier.rationale}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white/4 border border-white/10">
            <div className={`text-lg font-black ${selectedMeta.text}`}>
              ${selectedTier?.total_cost?.toLocaleString() ?? '—'}
            </div>
            <div className="text-[10px] text-[#E5E4E2]/60 mt-0.5">Total Cost</div>
          </div>
          <div className="p-3 rounded-xl bg-white/4 border border-white/10">
            <div className="text-lg font-black text-cyan-400">{selectedTier?.total_hours ?? '—'}h</div>
            <div className="text-[10px] text-[#E5E4E2]/60 mt-0.5">Total Hours</div>
          </div>
          <div className="p-3 rounded-xl bg-white/4 border border-white/10">
            <div className={`text-lg font-black ${selectedMeta.text}`}>
              {TIER_META[selectedKey]?.label}
            </div>
            <div className="text-[10px] text-[#E5E4E2]/60 mt-0.5">Selected Tier</div>
          </div>
        </div>

        {/* Confirm button */}
        <Button
          id="confirm-pricing"
          variant="emerald"
          size="lg"
          icon={CheckCircle2}
          onClick={handleConfirm}
          disabled={isSubmitting || !selectedTier}
          className="w-full font-extrabold tracking-wider shadow-2xl shadow-emerald-900/40"
        >
          {isSubmitting ? 'Confirming…' : `Confirm ${TIER_META[selectedKey]?.label} Pricing & Generate Draft`}
        </Button>
      </GlassCard>
    </motion.div>
  );
}
