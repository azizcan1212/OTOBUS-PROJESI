import { useId } from 'react';
import { motion } from 'motion/react';

import { getCapacityInfo } from '../utils/capacity';

interface BusSideViewProps {
  capacity: number;
}

const VB_W = 300;
const VB_H = 130;
const B = { x: 6, y: 10, w: 278, h: 84, rx: 7 };
const B_BOTTOM = B.y + B.h;
const WAVE_AMP = 9;
const EXTRA = WAVE_AMP + 3;
const WHEEL_CY = 103;
const WHEEL_R = 17;

function makeWave(amplitude: number, period = 80): string {
  const half = period / 2;
  let d = `M-${period * 2},0`;
  let dir = -1;

  for (let x = -period * 2; x < VB_W + period * 2; x += half) {
    const cp = amplitude * dir;
    d += ` C${x + half * 0.25},${cp} ${x + half * 0.75},${cp} ${x + half},0`;
    dir *= -1;
  }

  d += ` V300 H-${period * 2} Z`;
  return d;
}

const WAVE_MAIN = makeWave(WAVE_AMP, 80);
const WAVE_BACK = makeWave(WAVE_AMP - 2, 80);

const WINDOWS = [
  { x: 14, y: 14, w: 42, h: 32, rx: 5 },
  { x: 64, y: 14, w: 34, h: 28, rx: 4 },
  { x: 104, y: 14, w: 34, h: 28, rx: 4 },
  { x: 144, y: 14, w: 34, h: 28, rx: 4 },
  { x: 184, y: 14, w: 24, h: 28, rx: 4 },
];

const WINDSHIELD = { x: 212, y: 14, w: 60, h: 28, rx: 4 };
const DOOR = { x: 212, y: 54, w: 26, h: 34, rx: 4 };

export function BusSideView({ capacity }: BusSideViewProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, 'x');
  const info = getCapacityInfo(capacity);
  const waveY = B_BOTTOM + EXTRA - (capacity / 100) * (B.h + EXTRA);
  const clipId = `clip-${uid}`;
  const gradId = `grad-${uid}`;
  const shimId = `shim-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-full"
      style={{ overflow: 'visible' }}
      aria-label={`Bus at ${capacity}% capacity`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={B.rx} />
        </clipPath>

        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={info.fillLight} stopOpacity={0.95} />
          <stop offset="100%" stopColor={info.fill} />
        </linearGradient>

        <linearGradient id={shimId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity={0.15} />
        </linearGradient>
      </defs>

      <ellipse cx={B.x + B.w / 2} cy={VB_H - 4} rx={B.w * 0.42} ry={5} fill="rgba(0,0,0,0.25)" />

      {[{ cx: 60 }, { cx: 248 }].map(({ cx }, index) => (
        <g key={index}>
          <circle cx={cx} cy={WHEEL_CY} r={WHEEL_R} fill="#1e293b" />
          <circle cx={cx} cy={WHEEL_CY} r={WHEEL_R} fill="none" stroke="#334155" strokeWidth={2} />
          <circle cx={cx} cy={WHEEL_CY} r={10} fill="#0f172a" />
          <circle cx={cx} cy={WHEEL_CY} r={4.5} fill="#475569" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const radians = angle * (Math.PI / 180);

            return (
              <circle
                key={angle}
                cx={cx + Math.cos(radians) * 6.5}
                cy={WHEEL_CY + Math.sin(radians) * 6.5}
                r={1.8}
                fill="#334155"
              />
            );
          })}
        </g>
      ))}

      <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={B.rx} fill="#f1f5f9" />

      <g clipPath={`url(#${clipId})`}>
        <motion.g animate={{ y: waveY }} transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1] }}>
          <motion.g animate={{ x: [40, -40] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}>
            <path d={WAVE_BACK} fill={info.fill} opacity={0.35} />
          </motion.g>
        </motion.g>

        <motion.g animate={{ y: waveY }} transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1] }}>
          <motion.g animate={{ x: [0, -80] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}>
            <path d={WAVE_MAIN} fill={`url(#${gradId})`} />
          </motion.g>
        </motion.g>
      </g>

      <rect x={32} y={B_BOTTOM - 10} width={234} height={10} rx={2} fill="#1d4ed8" />
      <rect x={B.x + B.rx} y={B.y} width={B.w - B.rx * 2} height={6} rx={2} fill="rgba(29,78,216,0.6)" />

      {WINDOWS.map((windowItem, index) => (
        <g key={index}>
          <rect {...windowItem} fill="rgba(186,230,253,0.72)" stroke="#94a3b8" strokeWidth={1.5} />
          <rect
            x={windowItem.x + 2}
            y={windowItem.y + 2}
            width={windowItem.w * 0.45}
            height={windowItem.h - 4}
            rx={3}
            fill={`url(#${shimId})`}
          />
        </g>
      ))}

      <rect {...WINDSHIELD} fill="rgba(186,230,253,0.82)" stroke="#94a3b8" strokeWidth={1.5} />
      <rect
        x={WINDSHIELD.x + 2}
        y={WINDSHIELD.y + 2}
        width={WINDSHIELD.w * 0.42}
        height={WINDSHIELD.h - 4}
        rx={3}
        fill={`url(#${shimId})`}
      />

      <rect x={208} y={B.y} width={4} height={B.h} fill="#94a3b8" opacity={0.55} />
      <rect {...DOOR} fill="rgba(219,234,254,0.55)" stroke="#94a3b8" strokeWidth={1} />
      <line
        x1={DOOR.x + DOOR.w / 2}
        y1={DOOR.y + 5}
        x2={DOOR.x + DOOR.w / 2}
        y2={DOOR.y + DOOR.h - 5}
        stroke="#94a3b8"
        strokeWidth={1}
      />
      <rect
        x={DOOR.x + DOOR.w / 2 - 5}
        y={DOOR.y + DOOR.h / 2 - 3}
        width={10}
        height={5}
        rx={2}
        fill="#64748b"
      />

      <rect x={WINDSHIELD.x} y={3} width={WINDSHIELD.w} height={7} rx={1.5} fill="#0f172a" />
      <text
        x={WINDSHIELD.x + WINDSHIELD.w / 2}
        y={9}
        textAnchor="middle"
        fontSize={5}
        fontWeight={700}
        fill="#fbbf24"
        fontFamily="sans-serif"
      >
        BELEDIYE
      </text>

      <rect x={B.x} y={B.y} width={B.w} height={B.h} rx={B.rx} fill="none" stroke="#64748b" strokeWidth={2.5} />
      <rect x={281} y={28} width={6} height={26} rx={3} fill="#fef3c7" stroke="#ca8a04" strokeWidth={1} />
      <rect x={281} y={24} width={6} height={4} rx={1} fill="#93c5fd" opacity={0.8} />
      <rect x={281} y={80} width={7} height={14} rx={3} fill="#94a3b8" stroke="#64748b" strokeWidth={1} />
      <rect x={7} y={28} width={6} height={26} rx={3} fill="#fecaca" stroke="#ef4444" strokeWidth={1} />
      <rect x={7} y={24} width={6} height={4} rx={1} fill="#fca5a5" opacity={0.9} />
      <rect x={6} y={80} width={7} height={14} rx={3} fill="#94a3b8" stroke="#64748b" strokeWidth={1} />

      <line
        x1={B.x + B.rx}
        y1={B.y + B.h - 16}
        x2={207}
        y2={B.y + B.h - 16}
        stroke={info.fill}
        strokeWidth={2.5}
        opacity={0.55}
      />
    </svg>
  );
}
