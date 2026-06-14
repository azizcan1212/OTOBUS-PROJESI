import type { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(135deg, #080c1a 0%, #0d1527 50%, #0a1020 100%)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
