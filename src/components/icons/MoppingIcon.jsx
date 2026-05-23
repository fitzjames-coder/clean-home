export default function MoppingIcon({ size = 48, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ── Mop (left half) ── */}
      {/* Handle */}
      <line x1="13" y1="3" x2="13" y2="27" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Head cross-bar */}
      <line x1="6" y1="27" x2="20" y2="27" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* String mop — 7 slightly fanned strands */}
      <line x1="7"  y1="27" x2="6"  y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="27" x2="9"  y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="27" x2="11" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13" y1="27" x2="13" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="27" x2="15" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="27" x2="17" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="27" x2="20" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />

      {/* ── Bucket (right half) ── */}
      {/* Handle arc above the rim */}
      <path
        d="M 28 25 Q 34 17 41 25"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
      {/* Rim */}
      <line x1="27" y1="25" x2="42" y2="25" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Bucket body (trapezoid — wider at bottom) */}
      <path
        d="M 27 25 L 25 43 L 44 43 L 42 25"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none"
      />
      {/* Water level line inside bucket */}
      <line x1="27" y1="31" x2="42" y2="31" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  );
}
