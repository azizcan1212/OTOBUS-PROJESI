import { Activity, ArrowLeft, Bus, Clock3, MapPin, Radio, Route, ShieldCheck, Users } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { FeedbackPanel } from '../components/common/FeedbackPanel';
import { BusSideView } from '../components/BusSideView';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useBusDetail } from '../hooks/useBusDetail';
import { useClock } from '../hooks/useClock';
import { formatDateTime } from '../utils/format';
import { getBusDetailMetrics, getBusOperationalRows, getBusServiceSummary } from '../utils/busDetails';
import { getCapacityInfo } from '../utils/capacity';
import { getStatusLabel, getStatusStyle } from '../utils/busPresentation';
import { useAuth } from '../context/AuthContext';

export function BusDetailPage() {
  const { id = '' } = useParams();
  const time = useClock();
  const { isAuthorized } = useAuth();
  const parsedBusId = Number.parseInt(id, 10);
  const numericBusId = Number.isNaN(parsedBusId) ? null : parsedBusId;
  const { data: bus, error, isLoading, isLiveConnected } = useBusDetail(numericBusId);

  if (numericBusId === null) {
    return (
      <DashboardShell>
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft size={16} />
            Dashboard'a don
          </Link>
        </div>

        <FeedbackPanel
          title="Gecersiz bus kimligi"
          description="Detay sayfasi sayisal bir bus id bekler. Dashboard uzerinden tekrar secim yapabilirsin."
        />
      </DashboardShell>
    );
  }

  if (!bus && isLoading) {
    return (
      <DashboardShell>
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft size={16} />
            Dashboard&apos;a don
          </Link>
        </div>

        <FeedbackPanel
          title="Bus detail loading..."
          description="Secilen otobus kaydi Spring Boot backend uzerinden getiriliyor."
        />
      </DashboardShell>
    );
  }

  if (!bus) {
    return (
      <DashboardShell>
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft size={16} />
            Dashboard&apos;a don
          </Link>
        </div>

        <FeedbackPanel
          title="Bus bulunamadi"
          description={
            error
              ? error
              : `${id} id degerine ait kayit bulunamadi. Dashboard uzerinden farkli bir arac secilebilir.`
          }
        />
      </DashboardShell>
    );
  }

  const capacityInfo = getCapacityInfo(bus.occupancyRate);
  const detailMetrics = getBusDetailMetrics(bus);
  const operationalRows = getBusOperationalRows(bus);
  const serviceSummary = getBusServiceSummary(bus);
  const lastUpdatedLabel = formatDateTime(bus.lastUpdatedAt, 'en-GB');

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
          Dashboard&apos;a don
        </Link>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2">
            <Radio size={13} className="text-emerald-300" />
            <span className="text-emerald-300 text-xs font-semibold tracking-[0.2em]">
              {isLiveConnected ? 'LIVE DETAIL' : 'DETAIL SYNC'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-4 py-2">
            <Clock3 size={13} className="text-slate-500" />
            <span className="text-slate-300 text-sm font-mono">{time}</span>
          </div>
        </div>
      </div>

      <section className="bg-slate-800/60 border border-slate-700/50 rounded-[2rem] p-6 lg:p-8 backdrop-blur-sm mb-8 overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="text-xs px-3 py-1 rounded-full border border-slate-700 bg-slate-900/70 text-slate-300">
                #{bus.id} / {bus.fleetCode}
              </span>
              <span className="text-xs px-3 py-1 rounded-full border bg-sky-500/10 border-sky-500/20 text-sky-300">
                {bus.lineCode}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full border border-current/15 ${getStatusStyle(bus.status)}`}
              >
                {getStatusLabel(bus.status)}
              </span>
            </div>

            <h1 className="text-slate-100 text-4xl font-semibold leading-tight">{bus.destination}</h1>
            <p className="text-slate-400 text-base mt-3 max-w-2xl">
              {serviceSummary}. Bu sayfa `GET /bus/{'{id}'}` endpointi ile ayni detay semasini kullanir.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="rounded-2xl bg-slate-900/55 border border-slate-700/50 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-2">Current Stop</p>
                <p className="text-slate-100 text-lg font-semibold">{bus.currentStop}</p>
                <p className="text-slate-500 text-sm mt-1">Last update {lastUpdatedLabel}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/55 border border-slate-700/50 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-[0.2em] mb-2">Occupancy State</p>
                <p className="text-slate-100 text-lg font-semibold">{capacityInfo.label}</p>
                <p className="text-slate-500 text-sm mt-1">{bus.occupancyRate}% doluluk ile aktif gorunum</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute inset-x-8 bottom-6 h-12 rounded-full blur-2xl opacity-70"
              style={{ backgroundColor: capacityInfo.fill }}
            />
            <div className="relative rounded-[2rem] border border-slate-700/50 bg-slate-900/55 p-6">
              <div className="relative w-full mx-auto" style={{ aspectRatio: '300 / 130' }}>
                <BusSideView capacity={bus.occupancyRate} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {detailMetrics.map((metric) => (
          <StatCard
            key={metric.label}
            icon={metric.icon}
            label={metric.label}
            value={metric.value}
            sub={metric.sub}
            accent={metric.accent}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-10">
        <section className="bg-slate-800/55 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/12 border border-cyan-500/20 flex items-center justify-center">
              <Route size={18} className="text-cyan-300" />
            </div>
            <div>
              <h2 className="text-slate-100 text-lg font-semibold">Operational Snapshot</h2>
              <p className="text-slate-500 text-sm">Secili bus icin veritabani destekli anlik ozet</p>
            </div>
          </div>

          <div className="space-y-3">
            {operationalRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 rounded-2xl bg-slate-900/45 border border-slate-700/40 p-4"
              >
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-[0.16em]">{row.label}</p>
                  <p className="text-slate-100 text-sm font-medium mt-1">{row.value}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${row.tone}`}>{row.tag}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-800/55 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
              <Activity size={18} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-slate-100 text-lg font-semibold">Journey Context</h2>
              <p className="text-slate-500 text-sm">REST ve WebSocket akisi ile senkron operasyonel baglam</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-900/45 border border-slate-700/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <MapPin size={15} />
                Route Target
              </div>
              <p className="text-slate-100 font-semibold">{bus.destination}</p>
              <p className="text-slate-500 text-sm mt-1">Current stop: {bus.currentStop}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/45 border border-slate-700/40 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Users size={15} />
                Capacity View
              </div>
              <p className="text-slate-100 font-semibold">
                {bus.activePassengerCount} / {bus.maxCapacity} passenger
              </p>
              <p className="text-slate-500 text-sm mt-1">{capacityInfo.label} occupancy band</p>
            </div>

            <div className="rounded-2xl bg-slate-900/45 border border-slate-700/40 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Bus size={15} />
                API Mode
              </div>
              <p className="text-slate-100 font-semibold">Spring Boot API active, PostgreSQL source connected</p>
              <p className="text-slate-500 text-sm mt-1">
                Frontend detail verisi `GET /bus/{'{id}'}` ile alinip WebSocket eventleri geldikce otomatik guncelleniyor.
              </p>
            </div>
          </div>
        </section>
      </div>

      {isAuthorized && (bus.plateNumber || bus.driverName) && (
        <section className="bg-slate-800/55 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-sm mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck size={18} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-slate-100 text-lg font-semibold">Yetkili alanlar</h2>
              <p className="text-slate-500 text-sm">Bu bilgiler sadece giris yapan yetkili kullanicilara gosterilir.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-900/45 border border-slate-700/40 p-4">
              <p className="text-slate-500 text-xs uppercase tracking-[0.16em]">Plate Number</p>
              <p className="text-slate-100 text-lg font-semibold mt-2">{bus.plateNumber ?? 'Tanimsiz'}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/45 border border-slate-700/40 p-4">
              <p className="text-slate-500 text-xs uppercase tracking-[0.16em]">Driver Name</p>
              <p className="text-slate-100 text-lg font-semibold mt-2">{bus.driverName ?? 'Tanimsiz'}</p>
            </div>
          </div>
        </section>
      )}

      <DashboardFooter />
    </DashboardShell>
  );
}
