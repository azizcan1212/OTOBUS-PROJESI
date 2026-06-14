import { Circle } from 'lucide-react';

export function DashboardFooter() {
  return (
    <footer className="border-t border-slate-800 pt-6 flex items-center justify-between flex-wrap gap-3">
      <p className="text-slate-600 text-xs">CityBus Smart Transit | REST + WebSocket destekli canli filo gorunumu</p>
      <div className="flex items-center gap-1.5 text-slate-600 text-xs">
        <Circle size={6} className="fill-emerald-500 text-emerald-500" />
        Realtime stream active
      </div>
    </footer>
  );
}
