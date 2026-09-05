import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function FeatureCard({ agent, index }) {
  const IconComponent = Icons[agent.icon] || Icons.Bot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <GlassCard hoverEffect className="h-full flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-[#E5E4E2]/40 transition-colors">
              <IconComponent className="w-6 h-6 text-[#E5E4E2]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#E5E4E2]/80">
              Agent 0{index + 1}
            </span>
          </div>

          <h3 className="text-xl font-bold text-[#E5E4E2] mb-1 group-hover:text-white transition-colors">
            {agent.name}
          </h3>
          <p className="text-xs font-semibold text-cyan-300/80 mb-3 tracking-wide uppercase">
            {agent.role}
          </p>

          <p className="text-sm text-[#E5E4E2]/75 leading-relaxed">
            {agent.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-xs font-medium text-[#E5E4E2]/50 group-hover:text-[#E5E4E2] transition-colors">
          <span>Explore agent capability</span>
          <Icons.ArrowRight className="w-3.5 h-3.5 ml-2 transition-transform group-hover:translate-x-1" />
        </div>
      </GlassCard>
    </motion.div>
  );
}
