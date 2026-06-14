import { Bus, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface DashboardHeaderProps {
  time: string;
  actions?: ReactNode;
  isLiveConnected?: boolean;
}

export function DashboardHeader({ time, actions, isLiveConnected = false }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Bus size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-slate-100" style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2 }}>
              CityBus Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Spring Boot backed fleet visibility panel</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {actions}
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 border ${
              isLiveConnected ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-amber-500/10 border-amber-500/25'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isLiveConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLiveConnected ? 'bg-emerald-400' : 'bg-amber-300'
                }`}
              />
            </span>
            <span
              className={`text-xs ${isLiveConnected ? 'text-emerald-400' : 'text-amber-200'}`}
              style={{ fontWeight: 600 }}
            >
              {isLiveConnected ? 'LIVE SOCKET' : 'RECONNECTING'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-4 py-2">
            <Clock size={13} className="text-slate-500" />
            <span className="text-slate-300 text-sm font-mono">{time}</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
