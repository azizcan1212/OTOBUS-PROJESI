import { Activity, ArrowLeft, BarChart3, Clock3, Filter, Gauge, ShieldAlert, Users } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import { FeedbackPanel } from '../components/common/FeedbackPanel';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { DashboardShell } from '../components/layout/DashboardShell';
import { StatisticsDailyBarChart } from '../components/statistics/StatisticsDailyBarChart';
import { StatisticsDailyLineChart } from '../components/statistics/StatisticsDailyLineChart';
import { StatisticsStatusDonutChart } from '../components/statistics/StatisticsStatusDonutChart';
import { StatisticsTrendChart } from '../components/statistics/StatisticsTrendChart';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../hooks/useClock';
import { useStatistics } from '../hooks/useStatistics';
import type { StatisticsFilters, StatisticsPeriod } from '../types/statistics';
import { formatDateTime, formatHourRange } from '../utils/format';
import {
  DEFAULT_STATISTICS_FILTERS,
  getPeakDailyPoint,
  getPeakHourPoint,
  PERIOD_OPTIONS,
} from '../utils/statistics';

export function StatisticsPage() {
  const time = useClock();
  const { isAuthorized, authorizedUsername } = useAuth();
  const [draftFilters, setDraftFilters] = useState<StatisticsFilters>(DEFAULT_STATISTICS_FILTERS);
  const [filters, setFilters] = useState<StatisticsFilters>(DEFAULT_STATISTICS_FILTERS);
  const { data, error, isLoading, isRefreshing, isLiveConnected } = useStatistics(filters, isAuthorized);

  const peakPassengerDay = useMemo(
    () => getPeakDailyPoint(data.dailyBreakdown, (point) => point.averagePassengerCount),
    [data.dailyBreakdown],
  );
  const peakOccupancyDay = useMemo(
    () => getPeakDailyPoint(data.dailyBreakdown, (point) => point.averageOccupancyRate),
    [data.dailyBreakdown],
  );
  const peakHour = useMemo(
    () => getPeakHourPoint(data.hourlyBreakdown),
    [data.hourlyBreakdown],
  );
  const hourRangeLabel = formatHourRange(data.hourFrom, data.hourTo);

  const summaryCards = useMemo(
    () => [
      {
        icon: Activity,
        label: 'Ortalama Doluluk',
        value: `${data.averageOccupancyRate}%`,
        sub: `${data.sampleCount} snapshot`,
        accent: 'bg-amber-500/20',
      },
      {
        icon: Users,
        label: 'Ortalama Yolcu',
        value: `${data.averagePassengerCount}`,
        sub: 'secili filtreler icin',
        accent: 'bg-cyan-500/20',
      },
      {
        icon: Gauge,
        label: 'Pik Yolcu Gunu',
        value: peakPassengerDay ? peakPassengerDay.label : 'Veri yok',
        sub: peakPassengerDay ? `${peakPassengerDay.averagePassengerCount} ortalama yolcu` : 'gunluk dagilim bekleniyor',
        accent: 'bg-sky-500/20',
      },
      {
        icon: Clock3,
        label: 'Saat Penceresi',
        value: hourRangeLabel,
        sub: peakHour ? `${String(peakHour.hour).padStart(2, '0')}:00 saatinde zirve` : data.zoneId,
        accent: 'bg-emerald-500/20',
      },
      {
        icon: BarChart3,
        label: 'Canli Fleet',
        value: `${data.liveBusCount} bus`,
        sub: isLiveConnected ? 'websocket bagli' : 'baglanti yeniden kuruluyor',
        accent: 'bg-violet-500/20',
      },
      {
        icon: Filter,
        label: 'Aktif Filtre',
        value: data.plateNumber ?? data.fleetCode ?? 'Tum fleet',
        sub: data.plateNumber ? 'Plaka bazli' : data.fleetCode ? 'Arac kodu bazli' : 'Genel gorunum',
        accent: 'bg-rose-500/20',
      },
    ],
    [data, hourRangeLabel, isLiveConnected, peakHour, peakPassengerDay],
  );

  function updateDraft<K extends keyof StatisticsFilters>(key: K, value: StatisticsFilters[K]) {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({
      ...draftFilters,
      plateNumber: draftFilters.plateNumber.trim(),
      fleetCode: draftFilters.fleetCode.trim(),
    });
  }

  function clearFilters() {
    setDraftFilters(DEFAULT_STATISTICS_FILTERS);
    setFilters(DEFAULT_STATISTICS_FILTERS);
  }

  if (!isAuthorized) {
    return (
      <DashboardShell>
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
            <ArrowLeft size={16} />
            Dashboard&apos;a don
          </Link>
        </div>

        <FeedbackPanel
          title="Statistics erisimi yetki gerektiriyor"
          description="Bu ekran sadece yetkili kullanicilar icin acik. Dashboard ekranindan giris yapip tekrar deneyebilirsin."
          action={
            <Link
              to="/login"
              state={{ redirectTo: '/statistics' }}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-slate-950 bg-amber-300 hover:bg-amber-200 transition-colors"
            >
              Yetkili girisine git
            </Link>
          }
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        time={time}
        isLiveConnected={isLiveConnected}
        actions={
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-2">
            <BarChart3 size={13} className="text-amber-300" />
            <span className="text-amber-200 text-xs font-semibold tracking-[0.18em]">
              AUTHORIZED / {authorizedUsername}
            </span>
          </div>
        }
      />

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
          Dashboard&apos;a don
        </Link>
        <p className="text-slate-500 text-sm">
          Aralik: {formatDateTime(data.startAt)} - {formatDateTime(data.endAt)}
        </p>
      </div>

      {data.liveDataIncluded && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Statistics sonucu anlik `buses` verisini de icerdigi icin yolcu sayisi degisiklikleri sayfaya daha hizli yansir.
        </div>
      )}

      <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm mb-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
            <Filter size={22} className="text-amber-300" />
          </div>
          <div>
            <h2 className="text-slate-100 text-xl font-semibold">Statistics filtreleri</h2>
            <p className="text-slate-400 text-sm mt-1">
              Periyot, saat, plaka veya arac kodu secerek gunluk yogunluk degisimini ve aylik ortalamalari incele.
            </p>
          </div>
        </div>

        <form onSubmit={applyFilters} className="grid lg:grid-cols-5 gap-4">
          <label className="block">
            <span className="text-slate-400 text-xs uppercase tracking-[0.16em]">Periyot</span>
            <select
              value={draftFilters.period}
              onChange={(event) => updateDraft('period', event.target.value as StatisticsPeriod)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-slate-400 text-xs uppercase tracking-[0.16em]">Saat baslangici</span>
            <input
              type="number"
              min="0"
              max="23"
              value={draftFilters.hourFrom}
              onChange={(event) => updateDraft('hourFrom', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
              placeholder="15"
            />
          </label>

          <label className="block">
            <span className="text-slate-400 text-xs uppercase tracking-[0.16em]">Saat bitisi</span>
            <input
              type="number"
              min="1"
              max="24"
              value={draftFilters.hourTo}
              onChange={(event) => updateDraft('hourTo', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
              placeholder="16"
            />
          </label>

          <label className="block">
            <span className="text-slate-400 text-xs uppercase tracking-[0.16em]">Plaka</span>
            <input
              type="text"
              value={draftFilters.plateNumber}
              onChange={(event) => updateDraft('plateNumber', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
              placeholder="34ABC123"
            />
          </label>

          <label className="block">
            <span className="text-slate-400 text-xs uppercase tracking-[0.16em]">Arac kodu</span>
            <input
              type="text"
              value={draftFilters.fleetCode}
              onChange={(event) => updateDraft('fleetCode', event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100"
              placeholder="B-100"
            />
          </label>

          <div className="lg:col-span-5 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 bg-amber-300 hover:bg-amber-200 transition-colors"
            >
              Filtreyi uygula
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-200 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors"
            >
              Temizle
            </button>
            {isRefreshing && <span className="text-slate-500 text-sm">Veri yenileniyor...</span>}
          </div>
        </form>
      </section>

      {error && (
        <div className="mb-8">
          <FeedbackPanel title="Statistics verisi alinamadi" description={error} />
        </div>
      )}

      {isLoading ? (
        <FeedbackPanel
          title="Statistics yukleniyor"
          description="Yetkili statistics servisi secilen filtrelere gore PostgreSQL snapshot verisini getiriyor."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
            {summaryCards.map((metric) => (
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

          <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
            <StatisticsDailyLineChart points={data.dailyBreakdown} />
            <StatisticsStatusDonutChart points={data.statusDistribution} />
          </div>

          <div className="mb-6">
            <StatisticsDailyBarChart
              points={data.dailyBreakdown}
              title={`${hourRangeLabel} icin gun gun yogunluk`}
              description="Belirli ayda secilen saat araliginin gunluk yolcu hareketini sutun grafik uzerinden karsilastir."
            />
          </div>

          <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm mb-10">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/12 border border-sky-500/20 flex items-center justify-center">
                <BarChart3 size={22} className="text-sky-300" />
              </div>
              <div>
                <h2 className="text-slate-100 text-xl font-semibold">Saatlik degisim egilimi</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Saat bazinda ortalama doluluk ve yolcu sayisi karsilastirmasi.
                </p>
              </div>
            </div>

            {data.hourlyBreakdown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-slate-400 text-sm">
                Secili filtreler icin snapshot bulunamadi. Snapshot scheduler verisi veya filtreleri kontrol et.
              </div>
            ) : (
              <div className="space-y-6">
                <StatisticsTrendChart points={data.hourlyBreakdown} />

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.hourlyBreakdown.map((point) => (
                    <div key={point.hour} className="rounded-2xl bg-slate-950/45 border border-slate-700/40 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-slate-100 text-lg font-semibold">
                          {String(point.hour).padStart(2, '0')}:00
                        </p>
                        <span className="text-xs px-2.5 py-1 rounded-full border border-slate-700 text-slate-300">
                          {point.sampleCount} sample
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 text-sm">Ortalama doluluk</span>
                          <span className="text-amber-300 text-sm font-semibold">{point.averageOccupancyRate}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 text-sm">Ortalama yolcu</span>
                          <span className="text-cyan-300 text-sm font-semibold">{point.averagePassengerCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
                <ShieldAlert size={22} className="text-emerald-300" />
              </div>
              <div>
                <h2 className="text-slate-100 text-xl font-semibold">Statistics ozeti</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Bus plateNumber ve fleetCode filtreleri birlikte veya ayri ayri uygulanabilir.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-950/45 border border-slate-700/40 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-[0.16em]">Aktif filtre</p>
                <p className="text-slate-100 text-lg font-semibold mt-2">
                  {data.plateNumber ?? data.fleetCode ?? 'Tum fleet verisi'}
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {data.plateNumber ? 'Plaka bazli tek arac' : data.fleetCode ? 'Arac kodu bazli grup' : 'Genel filo'}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/45 border border-slate-700/40 p-4">
                <p className="text-slate-500 text-xs uppercase tracking-[0.16em]">Pik doluluk gunu</p>
                <p className="text-slate-100 text-lg font-semibold mt-2">{peakOccupancyDay?.label ?? 'Veri yok'}</p>
                <p className="text-slate-500 text-sm mt-1">
                  {peakOccupancyDay
                    ? `${peakOccupancyDay.averageOccupancyRate}% ortalama doluluk ile one cikiyor.`
                    : `Ortalama hesaplari bu sayidaki kayda dayanir. Son uretim: ${formatDateTime(data.generatedAt)}`}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-950/45 border border-slate-700/40 p-4">
              <p className="text-slate-500 text-xs uppercase tracking-[0.16em]">Son uretim</p>
              <p className="text-slate-100 text-lg font-semibold mt-2">{formatDateTime(data.generatedAt)}</p>
              <p className="text-slate-500 text-sm mt-1">
                WebSocket tetiklemeleri geldikce statistics paneli secili filtrelerle yeniden hesaplanir.
              </p>
            </div>
          </section>
        </>
      )}

      <DashboardFooter />
    </DashboardShell>
  );
}
