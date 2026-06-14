import type { ReactNode } from 'react';

interface FeedbackPanelProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function FeedbackPanel({ title, description, action }: FeedbackPanelProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-sm">
      <p className="text-slate-100 text-xl font-semibold">{title}</p>
      <p className="text-slate-400 text-sm mt-2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
