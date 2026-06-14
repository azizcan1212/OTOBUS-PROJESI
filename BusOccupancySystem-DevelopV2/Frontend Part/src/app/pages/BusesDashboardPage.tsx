import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router';

import { AuthorizedAccessPanel } from '../components/auth/AuthorizedAccessPanel';
import { FeedbackPanel } from '../components/common/FeedbackPanel';
import { BusCard } from '../components/dashboard/BusCard';
import { BusEmptyState } from '../components/dashboard/BusEmptyState';
import { BusSearchBar } from '../components/dashboard/BusSearchBar';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardSectionHeader } from '../components/dashboard/DashboardSectionHeader';
import { DashboardStatsRow } from '../components/dashboard/DashboardStatsRow';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuth } from '../context/AuthContext';
import { useBusList } from '../hooks/useBusList';
import { useClock } from '../hooks/useClock';
import { filterBuses } from '../utils/busSearch';
import { BUS_LEGEND, getDashboardMetrics } from '../utils/dashboard';

export function BusesDashboardPage() {
  const time = useClock();
  const [query, setQuery] = useState('');
  const { isAuthorized } = useAuth();
  const { data: buses, error, isLoading, isRefreshing, isLiveConnected } = useBusList();
  const deferredQuery = useDeferredValue(query);

  const filteredBuses = filterBuses(buses, deferredQuery);
  const metrics = getDashboardMetrics(buses);

  return (
    <DashboardShell>
      <DashboardHeader
        time={time}
        isLiveConnected={isLiveConnected}
        actions={
          isAuthorized ? (
            <Link
              to="/statistics"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200 transition-colors"
            >
              Statistics
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-400/20 transition-colors"
            >
              Yetkili Girisi
            </Link>
          )
        }
      />
      <AuthorizedAccessPanel />
      <DashboardStatsRow metrics={metrics} />
      {error && (
        <div className="mb-6">
          <FeedbackPanel
            title="Backend erisimi sinirli"
            description={`${error} Dashboard son basarili veriyi gostermeye devam ediyor.`}
          />
        </div>
      )}
      <BusSearchBar
        value={query}
        onChange={setQuery}
        resultCount={filteredBuses.length}
        totalCount={buses.length}
        isRefreshing={isRefreshing}
      />
      <DashboardSectionHeader totalBuses={filteredBuses.length} legend={BUS_LEGEND} />

      {isLoading && buses.length === 0 ? (
        <div className="mb-10">
          <FeedbackPanel
            title="Otobus verileri yukleniyor"
            description="Dashboard PostgreSQL uzerinden gelen en guncel fleet kayitlarini aliyor."
          />
        </div>
      ) : filteredBuses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {filteredBuses.map((bus, index) => (
            <BusCard key={bus.id} bus={bus} index={index} />
          ))}
        </div>
      ) : (
        <div className="mb-10">
          <BusEmptyState query={deferredQuery || query} />
        </div>
      )}

      <DashboardFooter />
    </DashboardShell>
  );
}
