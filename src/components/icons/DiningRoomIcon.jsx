export default function DiningRoomIcon({ size = 48, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Pendant light ── */}
      {/* Wire */}
      <line x1="24" y1="2" x2="24" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Shade (trapezoid, wider at bottom) */}
      <path
        d="M 21 10 L 27 10 L 29 17 L 19 17 Z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none"
      />
      {/* Glow dot inside shade */}
      <circle cx="24" cy="14" r="1.5" fill={color} />

      {/* ── Dining table ── */}
      {/* Table top */}
      <rect x="9" y="22" width="30" height="4" rx="1"
        stroke={color} strokeWidth="1.5" fill="none"
      />
      {/* Left leg */}
      <line x1="14" y1="26" x2="14" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Right leg */}
      <line x1="34" y1="26" x2="34" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Left chair (back on the left, seat extends toward table) ── */}
      {/* Seat */}
      <rect x="1" y="19" width="10" height="4" rx="1"
        stroke={color} strokeWidth="1.5" fill="none"
      />
      {/* Back (vertical, outer edge) */}
      <line x1="2" y1="13" x2="2" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Back top rail */}
      <line x1="2" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Front leg */}
      <line x1="10" y1="23" x2="10" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Back leg */}
      <line x1="2" y1="23" x2="2" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Right chair (back on the right, mirror of left) ── */}
      {/* Seat */}
      <rect x="37" y="19" width="10" height="4" rx="1"
        stroke={color} strokeWidth="1.5" fill="none"
      />
      {/* Back (vertical, outer edge) */}
      <line x1="46" y1="13" x2="46" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Back top rail */}
      <line x1="40" y1="13" x2="46" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Front leg */}
      <line x1="38" y1="23" x2="38" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Back leg */}
      <line x1="46" y1="23" x2="46" y2="34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
