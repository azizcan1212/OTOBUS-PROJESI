import { ArrowRight, ShieldCheck, ShieldEllipsis } from 'lucide-react';
import { Link } from 'react-router';

import { useAuth } from '../../context/AuthContext';

export function AuthorizedAccessPanel() {
  const { isAuthorized, authorizedUsername, logout } = useAuth();

  if (isAuthorized) {
    return (
      <section className="bg-slate-800/60 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-sm mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center">
              <ShieldCheck size={22} className="text-emerald-300" />
            </div>
            <div>
              <h2 className="text-slate-100 text-xl font-semibold">Yetkili gorunumu aktif</h2>
              <p className="text-slate-400 text-sm mt-1">
                {authorizedUsername} olarak giris yaptin. Artik plaka, sofor bilgisi ve statistics modulu acik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/statistics"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-slate-950 bg-amber-300 hover:bg-amber-200 transition-colors"
            >
              Yetkili paneline git
            </Link>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-slate-200 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors"
            >
              Admin paneli
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold text-slate-200 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors"
            >
              Cikis yap
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm mb-8">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
          <ShieldEllipsis size={22} className="text-amber-300" />
        </div>
        <div>
          <h2 className="text-slate-100 text-xl font-semibold">Yetkili girisi</h2>
          <p className="text-slate-400 text-sm mt-1">
            Normal kullanici olarak dashboard acik kalir. Yetkili kullanici giris yaptiginda plaka, sofor ve statistics verileri de gorunur.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5 items-start">
        <div className="rounded-2xl border border-slate-700/40 bg-slate-950/45 p-5">
          <p className="text-slate-200 text-base font-semibold">Yetkili erisimi ile neler acilir?</p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/70 p-4 text-slate-300">
              Gercek zamanli doluluk takibi ve canli dashboard akislarini gorebilirsin.
            </div>
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/70 p-4 text-slate-300">
              Aylik gunluk ortalamalar ve saat araligina gore yogunluk analizleri acilir.
            </div>
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/70 p-4 text-slate-300">
              Plaka ve sofor gibi hassas alanlara kontrollu sekilde erisilir.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5">
          <p className="text-amber-100 text-lg font-semibold">Yetkili Girisi</p>
          <p className="mt-2 text-sm text-amber-100/75">
            Ana dashboard herkese acik kalir. Yetkili girisinden sonra statistics ve detayli operasyon verileri aktif olur.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200"
          >
            Yetkili girisine git
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
