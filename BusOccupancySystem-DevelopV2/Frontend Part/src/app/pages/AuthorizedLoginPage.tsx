import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { startTransition, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { FeedbackPanel } from '../components/common/FeedbackPanel';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuth } from '../context/AuthContext';
import { useClock } from '../hooks/useClock';

function resolveRedirectPath(state: unknown) {
  if (typeof state !== 'object' || state === null || !('redirectTo' in state)) {
    return '/statistics';
  }

  return typeof state.redirectTo === 'string' && state.redirectTo.startsWith('/') ? state.redirectTo : '/statistics';
}

export function AuthorizedLoginPage() {
  const time = useClock();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = resolveRedirectPath(location.state);
  const { isAuthorized, authorizedUsername, isAuthenticating, authError, login, logout } = useAuth();
  const [username, setUsername] = useState(authorizedUsername ?? '');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const loginSucceeded = await login(username.trim(), password);
    if (!loginSucceeded) {
      return;
    }

    setPassword('');
    startTransition(() => {
      navigate(redirectPath, { replace: true });
    });
  }

  return (
    <DashboardShell>
      <DashboardHeader time={time} />

      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
          Dashboard&apos;a don
        </Link>
      </div>

      {isAuthorized ? (
        <FeedbackPanel
          title="Yetkili oturumu aktif"
          description={`${authorizedUsername} olarak giris yaptin. Statistics paneli ve hassas arac verileri acik durumda.`}
          action={
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to={redirectPath}
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-slate-950 bg-amber-300 hover:bg-amber-200 transition-colors"
              >
                Yetkili paneline git
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-slate-200 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors"
              >
                Cikis yap
              </button>
            </div>
          }
        />
      ) : (
        <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6 items-start">
          <section className="bg-slate-800/60 border border-slate-700/50 rounded-[2rem] p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
                <ShieldCheck size={22} className="text-amber-300" />
              </div>
              <div>
                <h1 className="text-slate-100 text-3xl font-semibold leading-tight">Yetkili girisi</h1>
                <p className="text-slate-400 text-sm mt-2">
                  Giris sonrasinda statistics dashboard, plaka-sofor alanlari ve canli operasyon ozetleri aktif olur.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-slate-400 text-xs uppercase tracking-[0.18em]">Kullanici adi</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder:text-slate-500"
                  placeholder="operator"
                  autoComplete="username"
                  required
                />
              </label>

              <label className="block">
                <span className="text-slate-400 text-xs uppercase tracking-[0.18em]">Sifre</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 placeholder:text-slate-500"
                  placeholder="Yetkili sifresi"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 bg-amber-300 hover:bg-amber-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {isAuthenticating ? 'Dogrulaniyor...' : 'Yetkili girisi yap'}
              </button>
            </form>

            {authError && <p className="mt-4 text-sm text-rose-300">{authError}</p>}
          </section>

          <section className="bg-slate-800/60 border border-slate-700/50 rounded-[2rem] p-6 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/12 border border-sky-500/20 flex items-center justify-center">
                <LockKeyhole size={22} className="text-sky-300" />
              </div>
              <div>
                <h2 className="text-slate-100 text-xl font-semibold">Bu panelde neler var?</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Yetkili kullanici acildiginda analiz tarafi operasyon kararlarini daha hizli alacak sekilde detaylanir.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700/40 bg-slate-950/45 p-4">
                <p className="text-slate-100 font-semibold">Aylik gunluk yolcu ortalamalari</p>
                <p className="mt-2 text-sm text-slate-400">
                  Hangi gunlerde talep arttigini cizgi grafik uzerinden anlik gorebilirsin.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700/40 bg-slate-950/45 p-4">
                <p className="text-slate-100 font-semibold">Saat araligi bazli yogunluk incelemesi</p>
                <p className="mt-2 text-sm text-slate-400">
                  Belirli bir saat penceresini secip hangi gunlerde pik olustugunu gun gun karsilastirabilirsin.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700/40 bg-slate-950/45 p-4">
                <p className="text-slate-100 font-semibold">Gercek zamanli panel akisi</p>
                <p className="mt-2 text-sm text-slate-400">
                  WebSocket ile gelen bus degisiklikleri dashboard ve statistics ekranina otomatik yansitilir.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
