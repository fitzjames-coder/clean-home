export default function VacuumBotIcon({ size = 48, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Outer body — circular disc ── */}
      <circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2" fill="none" />

      {/* ── Front bump — small arc at top indicating direction ── */}
      <path
        d="M 21 8 Q 24 5.5 27 8"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />

      {/* ── Center sensor / button — filled dot ── */}
      <circle cx="24" cy="24" r="3" fill={color} />

      {/* ── Inner sensor ring ── */}
      <circle cx="24" cy="24" r="7" stroke={color} strokeWidth="1" fill="none" strokeDasharray="3 2" />

      {/* ── Motion arcs — suggest spinning / cleaning sweep ── */}
      <path
        d="M 13 16 Q 7 24 13 32"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
      <path
        d="M 35 16 Q 41 24 35 32"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}
