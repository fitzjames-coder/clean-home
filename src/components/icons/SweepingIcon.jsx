export default function SweepingIcon({ size = 48, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Handle — angled from top-right to the ferrule */}
      <line
        x1="37" y1="5"
        x2="22" y2="27"
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
      {/* Ferrule — binding band where bristles meet handle */}
      <rect
        x="14" y="26" width="16" height="3.5" rx="1.75"
        stroke={color} strokeWidth="1.5" fill="none"
      />
      {/* Bristle strokes — 7 lines fanning from binding to floor */}
      <line x1="15" y1="29.5" x2="9"  y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="29.5" x2="13" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="29.5" x2="17" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="29.5" x2="22" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25" y1="29.5" x2="27" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="29.5" x2="31" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="29.5" x2="35" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Dust particles — small dots kicked up near the bristle base */}
      <circle cx="6"  cy="43" r="1.5" fill={color} />
      <circle cx="10" cy="45" r="1.2" fill={color} />
      <circle cx="13" cy="44" r="1.0" fill={color} />
    </svg>
  );
}
