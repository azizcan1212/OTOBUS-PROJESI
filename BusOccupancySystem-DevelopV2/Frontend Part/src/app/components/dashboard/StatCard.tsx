import type { ElementType } from 'react';
import { motion } from 'motion/react';

interface StatCardProps {
  icon: ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export function StatCard({ icon: Icon, label, value, sub, accent }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-5 flex gap-4 items-start backdrop-blur-sm"
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent ?? 'bg-blue-500/20'}`}
      >
        <Icon
          size={20}
          className={accent ? accent.replace('bg-', 'text-').replace('/20', '-400') : 'text-blue-400'}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-slate-100 mt-0.5" style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.2 }}>
          {value}
        </p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}
