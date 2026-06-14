import { AlertTriangle, ArrowLeft, Bus, ChevronLeft, ChevronRight, Filter, Save, UserCog, UserPlus, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Link } from 'react-router';

import { FeedbackPanel } from '../components/common/FeedbackPanel';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardShell } from '../components/layout/DashboardShell';
import { useAuth } from '../context/AuthContext';
import { useBusList } from '../hooks/useBusList';
import { useClock } from '../hooks/useClock';
import { createAdminUser, createBus, getErrorLogs, updateBusAssignment } from '../services/adminService';
import type { BusStatus } from '../types/bus';
import type { ErrorLogRecord } from '../types/errorLog';
import { formatDateTime } from '../utils/format';

const ERROR_LOG_PAGE_SIZE = 10;

const ERROR_TYPE_LABELS: Record<ErrorLogRecord['errorType'], string> = {
  MISSING_FIELD: 'Eksik alan',
  VALIDATION_ERROR: 'Dogrulama hatasi',
  MALFORMED_JSON: 'Gecersiz JSON',
};

const BUS_STATUS_LABELS: Record<BusStatus, string> = {
  ON_TIME: 'Zamaninda',
  DELAYED: 'Rotada',
  OUT_OF_SERVICE: 'Serviste degil',
};

const EMPTY_BUS_FORM = {
  lineCode: '',
  routeName: '',
  plateNumber: '',
  fleetCode: '',
  currentStop: '',
  destination: '',
  maxCapacity: '',
  driverName: '',
  status: 'ON_TIME' as BusStatus,
};

type FormMessageValue = { type: 'success' | 'error'; text: string } | null;

const FIELD_LABEL_CLASS = 'text-slate-400 text-xs uppercase tracking-[0.16em]';
const FIELD_INPUT_CLASS =
  'mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-slate-100 disabled:opacity-50';
const BUTTON_BASE_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  wrapperClassName?: string;
}

function FormField({ label, hint, wrapperClassName, ...inputProps }: FormFieldProps) {
  return (
    <label className={wrapperClassName ?? 'block'}>
      <span className={FIELD_LABEL_CLASS}>{label}</span>
      <input {...inputProps} className={FIELD_INPUT_CLASS} />
      {hint && <span className="text-slate-500 text-xs mt-1 block">{hint}</span>}
    </label>
  );
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  wrapperClassName?: string;
  children: ReactNode;
}

function FormSelect({ label, wrapperClassName, children, ...selectProps }: FormSelectProps) {
  return (
    <label className={wrapperClassName ?? 'block'}>
      <span className={FIELD_LABEL_CLASS}>{label}</span>
      <select {...selectProps} className={FIELD_INPUT_CLASS}>
        {children}
      </select>
    </label>
  );
}

function FormMessage({ message }: { message: FormMessageValue }) {
  if (!message) return null;
  return (
    <span className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{message.text}</span>
  );
}

export function AdminPage() {
  const time = useClock();
  const { isAuthorized, authorizedUsername } = useAuth();
  const { data: buses, isLiveConnected, refetch: refetchBuses } = useBusList();

  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<FormMessageValue>(null);

  const [errorLogs, setErrorLogs] = useState<ErrorLogRecord[]>([]);
  const [logsPage, setLogsPage] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsFromFilter, setLogsFromFilter] = useState('');
  const [logsToFilter, setLogsToFilter] = useState('');
  const [appliedLogsFilter, setAppliedLogsFilter] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const [busForm, setBusForm] = useState(EMPTY_BUS_FORM);
  const [isCreatingBus, setIsCreatingBus] = useState(false);
  const [busFormMessage, setBusFormMessage] = useState<FormMessageValue>(null);

  const [userForm, setUserForm] = useState({ username: '', password: '' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userFormMessage, setUserFormMessage] = useState<FormMessageValue>(null);

  const selectedBus = buses.find((bus) => bus.id === selectedBusId) ?? null;

  function updateBusField<K extends keyof typeof EMPTY_BUS_FORM>(
    field: K,
    transform: (raw: string) => (typeof EMPTY_BUS_FORM)[K] = (raw) => raw as (typeof EMPTY_BUS_FORM)[K],
  ) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setBusForm((form) => ({ ...form, [field]: transform(event.target.value) }));
  }

  function updateUserField<K extends keyof typeof userForm>(field: K) {
    return (event: ChangeEvent<HTMLInputElement>) => setUserForm((form) => ({ ...form, [field]: event.target.value }));
  }

  // Secili otobus degisince formu mevcut degerlerle doldur
  useEffect(() => {
    setDriverName(selectedBus?.driverName ?? '');
    setPlateNumber(selectedBus?.plateNumber ?? '');
    setSaveMessage(null);
  }, [selectedBus]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    let isMounted = true;
    setLogsLoading(true);

    const filter = {
      ...(appliedLogsFilter.from && { from: appliedLogsFilter.from }),
      ...(appliedLogsFilter.to && { to: appliedLogsFilter.to }),
    };

    getErrorLogs(logsPage, ERROR_LOG_PAGE_SIZE, filter)
      .then((response) => {
        if (!isMounted) return;
        setErrorLogs(response.content);
        setLogsTotalPages(response.totalPages);
        setLogsError(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setLogsError(error instanceof Error ? error.message : 'Hata loglari alinamadi.');
      })
      .finally(() => {
        if (isMounted) setLogsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthorized, logsPage, appliedLogsFilter]);

  async function handleAssignmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBus) return;

    const trimmedDriver = driverName.trim();
    const trimmedPlate = plateNumber.trim();

    if (!trimmedDriver && !trimmedPlate) {
      setSaveMessage({ type: 'error', text: 'Sofor adi veya plaka alanlarindan en az biri doldurulmali.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Bos alanlar gonderilmez, sadece doldurulan alanlar guncellenir
      await updateBusAssignment(selectedBus.id, {
        ...(trimmedDriver && { driverName: trimmedDriver }),
        ...(trimmedPlate && { plateNumber: trimmedPlate }),
      });
      setSaveMessage({ type: 'success', text: `${selectedBus.fleetCode} icin atama guncellendi.` });
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Atama guncellenemedi.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogsFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLogsPage(0);
    setAppliedLogsFilter({ from: logsFromFilter, to: logsToFilter });
  }

  function handleLogsFilterClear() {
    setLogsFromFilter('');
    setLogsToFilter('');
    setLogsPage(0);
    setAppliedLogsFilter({ from: '', to: '' });
  }

  async function handleCreateBusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lineCode = busForm.lineCode.trim();
    const routeName = busForm.routeName.trim();
    const plate = busForm.plateNumber.trim().toUpperCase();

    if (!lineCode || !routeName || !plate) {
      setBusFormMessage({ type: 'error', text: 'Hat kodu, rota adi ve plaka alanlari zorunludur.' });
      return;
    }

    setIsCreatingBus(true);
    setBusFormMessage(null);

    try {
      await createBus({
        lineCode,
        routeName,
        plateNumber: plate,
        status: busForm.status,
        ...(busForm.fleetCode.trim() && { fleetCode: busForm.fleetCode.trim() }),
        ...(busForm.currentStop.trim() && { currentStop: busForm.currentStop.trim() }),
        ...(busForm.destination.trim() && { destination: busForm.destination.trim() }),
        ...(busForm.driverName.trim() && { driverName: busForm.driverName.trim() }),
        ...(busForm.maxCapacity.trim() && { maxCapacity: Number(busForm.maxCapacity) }),
      });
      setBusFormMessage({ type: 'success', text: `${plate} plakali otobus olusturuldu (doluluk 0 ile basladi).` });
      setBusForm(EMPTY_BUS_FORM);
      await refetchBuses();
    } catch (error) {
      setBusFormMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Otobus olusturulamadi.',
      });
    } finally {
      setIsCreatingBus(false);
    }
  }

  async function handleCreateUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const username = userForm.username.trim();
    const password = userForm.password;

    if (username.length < 3 || password.length < 6) {
      setUserFormMessage({
        type: 'error',
        text: 'Kullanici adi en az 3, sifre en az 6 karakter olmalidir.',
      });
      return;
    }

    setIsCreatingUser(true);
    setUserFormMessage(null);

    try {
      await createAdminUser({ username, password });
      setUserFormMessage({ type: 'success', text: `${username} adli ADMIN kullanici olusturuldu.` });
      setUserForm({ username: '', password: '' });
    } catch (error) {
      setUserFormMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Kullanici olusturulamadi.',
      });
    } finally {
      setIsCreatingUser(false);
    }
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
          title="Admin paneli yetki gerektiriyor"
          description="Bu ekran sadece yetkili kullanicilar icin acik. Dashboard ekranindan giris yapip tekrar deneyebilirsin."
          action={
            <Link
              to="/login"
              state={{ redirectTo: '/admin' }}
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
            <UserCog size={13} className="text-amber-300" />
            <span className="text-amber-200 text-xs font-semibold tracking-[0.18em]">
              AUTHORIZED / {authorizedUsername}
            </span>
          </div>
        }
      />

      <div className="mb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
          Dashboard&apos;a don
        </Link>
      </div>

      <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm mb-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/12 border border-amber-500/20 flex items-center justify-center">
            <UserCog size={22} className="text-amber-300" />
          </div>
          <div>
            <h2 className="text-slate-100 text-xl font-semibold">Sofor ve plaka atamasi</h2>
            <p className="text-slate-400 text-sm mt-1">
              Otobus secip sofor adini ve plakasini guncelle. Bos birakilan alanlar degistirilmez.
            </p>
          </div>
        </div>

        <form onSubmit={handleAssignmentSubmit} className="grid lg:grid-cols-4 gap-4">
          <FormSelect
            label="Otobus"
            wrapperClassName="block lg:col-span-2"
            value={selectedBusId ?? ''}
            onChange={(event) => setSelectedBusId(event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">Otobus sec...</option>
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id}>
                {bus.fleetCode} - {bus.lineCode} ({bus.plateNumber ?? 'plaka yok'})
              </option>
            ))}
          </FormSelect>

          <FormField
            label="Sofor adi"
            type="text"
            value={driverName}
            onChange={(event) => setDriverName(event.target.value)}
            disabled={!selectedBus}
            maxLength={100}
            placeholder="Ahmet Yilmaz"
          />

          <FormField
            label="Plaka"
            type="text"
            value={plateNumber}
            onChange={(event) => setPlateNumber(event.target.value.toUpperCase())}
            disabled={!selectedBus}
            maxLength={15}
            placeholder="34 ABC 123"
            hint="Buyuk harf, rakam ve bosluk (4-15 karakter)"
          />

          <div className="lg:col-span-4 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={!selectedBus || isSaving}
              className={`${BUTTON_BASE_CLASS} bg-amber-300 hover:bg-amber-200`}
            >
              <Save size={16} />
              {isSaving ? 'Kaydediliyor...' : 'Atamayi kaydet'}
            </button>
            <FormMessage message={saveMessage} />
          </div>
        </form>
      </section>

      <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm mb-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center">
            <Bus size={22} className="text-emerald-300" />
          </div>
          <div>
            <h2 className="text-slate-100 text-xl font-semibold">Yeni otobus olustur</h2>
            <p className="text-slate-400 text-sm mt-1">
              Doluluk haric tum bilgileri gir. Yeni otobus her zaman %0 doluluk ile baslar.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateBusSubmit} className="grid lg:grid-cols-4 gap-4">
          <FormField
            label="Hat kodu *"
            type="text"
            value={busForm.lineCode}
            onChange={updateBusField('lineCode')}
            maxLength={20}
            required
            placeholder="34A"
          />

          <FormField
            label="Rota adi *"
            wrapperClassName="block lg:col-span-2"
            type="text"
            value={busForm.routeName}
            onChange={updateBusField('routeName')}
            maxLength={100}
            required
            placeholder="Kadikoy - Taksim"
          />

          <FormField
            label="Plaka *"
            type="text"
            value={busForm.plateNumber}
            onChange={updateBusField('plateNumber', (raw) => raw.toUpperCase())}
            maxLength={15}
            required
            placeholder="34 ABC 123"
          />

          <FormField
            label="Filo kodu"
            type="text"
            value={busForm.fleetCode}
            onChange={updateBusField('fleetCode')}
            maxLength={20}
            placeholder="BUS-034"
          />

          <FormField
            label="Mevcut durak"
            type="text"
            value={busForm.currentStop}
            onChange={updateBusField('currentStop')}
            maxLength={100}
            placeholder="Kadikoy Iskele"
          />

          <FormField
            label="Varis noktasi"
            type="text"
            value={busForm.destination}
            onChange={updateBusField('destination')}
            maxLength={100}
            placeholder="Taksim"
          />

          <FormField
            label="Maks. kapasite"
            type="number"
            value={busForm.maxCapacity}
            onChange={updateBusField('maxCapacity')}
            min={1}
            max={500}
            placeholder="50 (varsayilan)"
          />

          <FormField
            label="Sofor adi"
            type="text"
            value={busForm.driverName}
            onChange={updateBusField('driverName')}
            maxLength={100}
            placeholder="Ahmet Yilmaz"
          />

          <FormSelect label="Durum" value={busForm.status} onChange={updateBusField('status', (raw) => raw as BusStatus)}>
            {Object.entries(BUS_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormSelect>

          <div className="lg:col-span-4 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={isCreatingBus}
              className={`${BUTTON_BASE_CLASS} bg-emerald-300 hover:bg-emerald-200`}
            >
              <Bus size={16} />
              {isCreatingBus ? 'Olusturuluyor...' : 'Otobusu olustur'}
            </button>
            <FormMessage message={busFormMessage} />
          </div>
        </form>
      </section>

      <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm mb-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/12 border border-sky-500/20 flex items-center justify-center">
            <UserPlus size={22} className="text-sky-300" />
          </div>
          <div>
            <h2 className="text-slate-100 text-xl font-semibold">Yeni admin kullanici ekle</h2>
            <p className="text-slate-400 text-sm mt-1">Olusturulan kullanici ADMIN yetkisiyle kaydedilir.</p>
          </div>
        </div>

        <form onSubmit={handleCreateUserSubmit} className="grid lg:grid-cols-4 gap-4">
          <FormField
            label="Kullanici adi"
            wrapperClassName="block lg:col-span-2"
            type="text"
            value={userForm.username}
            onChange={updateUserField('username')}
            minLength={3}
            maxLength={50}
            required
            placeholder="yeni.admin"
          />

          <FormField
            label="Sifre"
            wrapperClassName="block lg:col-span-2"
            type="password"
            value={userForm.password}
            onChange={updateUserField('password')}
            minLength={6}
            required
            placeholder="En az 6 karakter"
          />

          <div className="lg:col-span-4 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={isCreatingUser}
              className={`${BUTTON_BASE_CLASS} bg-sky-300 hover:bg-sky-200`}
            >
              <UserPlus size={16} />
              {isCreatingUser ? 'Olusturuluyor...' : 'Kullaniciyi olustur'}
            </button>
            <FormMessage message={userFormMessage} />
          </div>
        </form>
      </section>

      <section className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/12 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle size={22} className="text-rose-300" />
          </div>
          <div>
            <h2 className="text-slate-100 text-xl font-semibold">Hata loglari</h2>
            <p className="text-slate-400 text-sm mt-1">
              Cihaz/AI girisinde olusan dogrulama hatalarinin kaydi (en yeni once).
            </p>
          </div>
        </div>

        <form onSubmit={handleLogsFilterSubmit} className="flex items-end gap-3 flex-wrap mb-5">
          <FormField
            label="Baslangic"
            type="datetime-local"
            value={logsFromFilter}
            onChange={(event) => setLogsFromFilter(event.target.value)}
          />

          <FormField
            label="Bitis"
            type="datetime-local"
            value={logsToFilter}
            onChange={(event) => setLogsToFilter(event.target.value)}
          />

          <button type="submit" className={`${BUTTON_BASE_CLASS} bg-rose-300 hover:bg-rose-200`}>
            <Filter size={16} />
            Filtrele
          </button>

          {(appliedLogsFilter.from || appliedLogsFilter.to) && (
            <button
              type="button"
              onClick={handleLogsFilterClear}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-200 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
              Temizle
            </button>
          )}
        </form>

        {logsError && (
          <div className="mb-4">
            <FeedbackPanel title="Hata loglari alinamadi" description={logsError} />
          </div>
        )}

        {logsLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-slate-400 text-sm">
            Hata loglari yukleniyor...
          </div>
        ) : errorLogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-slate-400 text-sm">
            Kayitli hata bulunamadi.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 text-xs uppercase tracking-[0.12em] border-b border-slate-700/50">
                    <th className="py-3 pr-4">Tarih</th>
                    <th className="py-3 pr-4">Tur</th>
                    <th className="py-3 pr-4">Kamera / Bus</th>
                    <th className="py-3 pr-4">Mesaj</th>
                    <th className="py-3 pr-4">Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800/60 align-top">
                      <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs px-2.5 py-1 rounded-full border border-rose-500/30 text-rose-300 whitespace-nowrap">
                          {ERROR_TYPE_LABELS[log.errorType]}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">
                        {log.cameraId ?? '-'} / {log.busId ?? '-'}
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{log.errorMessage}</td>
                      <td className="py-3 pr-4 text-slate-500 font-mono text-xs">{log.endpoint}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-slate-500 text-xs">
                Sayfa {logsPage + 1} / {Math.max(logsTotalPages, 1)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLogsPage((page) => Math.max(0, page - 1))}
                  disabled={logsPage === 0}
                  className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-slate-200 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setLogsPage((page) => Math.min(logsTotalPages - 1, page + 1))}
                  disabled={logsPage + 1 >= logsTotalPages}
                  className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-slate-200 border border-slate-600 hover:border-slate-500 hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="mt-8">
        <DashboardFooter />
      </div>
    </DashboardShell>
  );
}
