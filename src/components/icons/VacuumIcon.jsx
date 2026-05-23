export default function VacuumIcon({ size = 48, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Handle ── */}
      {/* Horizontal grip bar at the very top */}
      <line x1="19" y1="5" x2="29" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Left strut — slight inward angle from grip to body */}
      <line x1="20" y1="5" x2="21" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Right strut */}
      <line x1="28" y1="5" x2="27" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />

      {/* ── Body ── */}
      <rect x="19" y="14" width="10" height="20" rx="2"
        stroke={color} strokeWidth="2" fill="none"
      />
      {/* Power indicator — small filled dot on the body */}
      <circle cx="24" cy="21" r="2" fill={color} />
      {/* Belt/detail line across body */}
      <line x1="19" y1="28" x2="29" y2="28" stroke={color} strokeWidth="1" strokeLinecap="round" />

      {/* ── Cleaning head (wider base) ── */}
      <rect x="11" y="34" width="26" height="7" rx="3.5"
        stroke={color} strokeWidth="2" fill="none"
      />
      {/* Brush roll line inside head */}
      <line x1="14" y1="37.5" x2="34" y2="37.5" stroke={color} strokeWidth="1" strokeLinecap="round" />

      {/* ── Wheels ── */}
      <circle cx="16" cy="43" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="43" r="2.5" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}
