import { AlertTriangle, Bus, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';

import { BusSideView } from '../BusSideView';
import type { BusRecord } from '../../types/bus';
import { getCapacityInfo, isOvercapacity } from '../../utils/capacity';
import { getBadgeStyle, getStatusDot, getStatusLabel, getStatusStyle } from '../../utils/busPresentation';

interface BusCardProps {
  bus: BusRecord;
  index: number;
}

export function BusCard({ bus, index }: BusCardProps) {
  const info = getCapacityInfo(bus.occupancyRate);
  const isActive = bus.status !== 'OUT_OF_SERVICE';
  const overcapacity = isOvercapacity(bus.occupancyRate);

  return (
    <Link
      to={`/${bus.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 rounded-2xl"
      aria-label={`${bus.id} detay sayfasini ac`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.07 }}
        className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-slate-600/70 hover:bg-slate-800/80 transition-all duration-300 group"
      >
        <div className="px-5 pt-4 pb-3 border-b border-slate-700/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              {isActive && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${getStatusDot(bus.status)}`}
                />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusDot(bus.status)}`} />
            </span>
            <div className="min-w-0">
              <p className="text-slate-100 truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {bus.lineCode}
              </p>
              <p className="text-slate-500 text-xs truncate">
                {bus.fleetCode}
                {bus.plateNumber ? ` - ${bus.plateNumber}` : ''}
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full border shrink-0 ${getBadgeStyle(info.badge)}`}
            style={{ fontWeight: 500 }}
          >
            {info.label}
          </span>
        </div>

        {overcapacity && (
          <div className="px-5 pt-3">
            <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300">
              <AlertTriangle size={14} className="shrink-0" />
              <span className="text-xs" style={{ fontWeight: 600 }}>
                Kapasite asildi - {bus.activePassengerCount} / {bus.maxCapacity} yolcu
              </span>
            </div>
          </div>
        )}

        <div className="px-5 py-4">
          <div className="relative w-full" style={{ aspectRatio: '300 / 130' }}>
            {bus.occupancyRate > 0 && (
              <motion.div
                animate={{ opacity: [0.2, 0.45, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-4 bottom-2 h-8 rounded-full blur-xl pointer-events-none"
                style={{ backgroundColor: info.fill }}
              />
            )}
            <BusSideView capacity={bus.occupancyRate} />
          </div>
        </div>

        <div className="px-5 pb-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 text-xs">Occupancy</span>
            <span className="text-xs" style={{ color: info.fill, fontWeight: 600 }}>
              {bus.occupancyRate}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: info.fill }}
              initial={{ width: 0 }}
              animate={{ width: `${bus.occupancyRate}%` }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            />
          </div>
        </div>

        <div className="px-5 pt-3 pb-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Users size={13} className="text-slate-400" />
            </div>
            <div>
              <p className="text-slate-100 text-xs" style={{ fontWeight: 600 }}>
                {bus.activePassengerCount}{' '}
                <span className="text-slate-500" style={{ fontWeight: 400 }}>
                  / {bus.maxCapacity}
                </span>
              </p>
              <p className="text-slate-600 text-xs" style={{ fontSize: '0.65rem' }}>
                passengers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <MapPin size={13} className="text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-slate-100 text-xs truncate" style={{ fontWeight: 600 }}>
                {bus.currentStop}
              </p>
              <p className="text-slate-600 text-xs" style={{ fontSize: '0.65rem' }}>
                current stop
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 col-span-2">
            <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
              <Bus size={13} className="text-slate-400" />
            </div>
            <div className="flex items-center justify-between flex-1 min-w-0">
              <p className="text-slate-400 text-xs truncate">
                {bus.routeName} {'->'} {bus.destination}
              </p>
              <span
                className={`text-xs shrink-0 ml-2 flex items-center gap-1 ${getStatusStyle(bus.status)}`}
                style={{ fontWeight: 500 }}
              >
                {bus.delayInMinutes !== null && <span className="text-amber-400">(+{bus.delayInMinutes}m)</span>}
                {getStatusLabel(bus.status)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
