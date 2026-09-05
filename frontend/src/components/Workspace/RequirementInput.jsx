import React from 'react';
import { Sparkles, FileText, Building2, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';

export default function RequirementInput({ 
  formData, 
  setFormData, 
  onGenerate, 
  isGenerating, 
  hasGenerated 
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePresetSample = () => {
    setFormData({
      projectTitle: "Aerospace Titanium & Composite Procurement Platform",
      clientName: "Starlight Dynamics",
      industry: "Defense & Aviation",
      description: `Starlight Dynamics requires an integrated AI workflow to extract component specs for 500 units of Ti-6Al-4V titanium forged housings and carbon fiber wing structural spars.

Requirements:
1. Vendor pricing cross-match against ISO 9001 / AS9100 certified suppliers.
2. Automated RFQ breakdown with 3-tier pricing (Conservative, Standard, High-Velocity).
3. Integration with SAP S/4HANA ERP for real-time inventory ledger updates.
4. Lead time constraint: Mandatory arrival before Q4 2026.`,
      budgetRange: "$150,000 - $200,000",
      deadline: "3 Weeks Turnaround",
    });
  };

  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E5E4E2]">1. Requirement Input</h2>
            <p className="text-[11px] text-[#E5E4E2]/60">Paste client RFP, email notes, or material specs</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePresetSample}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Load Sample RFP
        </button>
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }} 
        className="space-y-3.5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#E5E4E2]/70 uppercase tracking-wider mb-1">
              Project / RFP Title
            </label>
            <input
              type="text"
              name="projectTitle"
              required
              value={formData.projectTitle}
              onChange={handleChange}
              placeholder="e.g. Titanium Component Procurement"
              className="w-full px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#E5E4E2]/70 uppercase tracking-wider mb-1">
              Client / Company Name
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-[#E5E4E2]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="clientName"
                required
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g. AeroTech Corp"
                className="w-full pl-8 pr-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-[#E5E4E2]/70 uppercase tracking-wider mb-1">
              Industry / Domain
            </label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="e.g. Aerospace & Defence, SaaS, Healthcare"
              className="w-full px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#E5E4E2]/70 uppercase tracking-wider mb-1">
            Raw Material Requirements & Technical Specs
          </label>
          <textarea
            name="description"
            required
            rows={5}
            value={formData.description}
            onChange={handleChange}
            placeholder="Paste RFP text, email threads, or unformatted material specification notes..."
            className="w-full px-3 py-2.5 rounded-lg glass-input text-xs leading-relaxed font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-[#E5E4E2]/70 uppercase tracking-wider mb-1">
              Target Budget Range
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-[#E5E4E2]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="budgetRange"
                value={formData.budgetRange}
                onChange={handleChange}
                placeholder="e.g. $120,000 - $160,000"
                className="w-full pl-8 pr-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#E5E4E2]/70 uppercase tracking-wider mb-1">
              Timeline Constraint
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-[#E5E4E2]/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                placeholder="e.g. Q3 2026 / 4-Week Delivery"
                className="w-full pl-8 pr-3 py-2 rounded-lg glass-input text-xs"
              />
            </div>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isGenerating}
            icon={Sparkles}
            className="w-full py-3.5 text-sm uppercase tracking-wider font-extrabold shadow-xl shadow-[#082567]/50"
          >
            {isGenerating ? 'Running AI Agents…' : hasGenerated ? 'Re-Generate Proposal' : 'Generate AI Proposal'}
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
