export default function DusterIcon({ size = 48, color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Handle — thick diagonal stick */}
      <line
        x1="35" y1="43"
        x2="20" y2="17"
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
      {/* Collar — small oval where feathers attach */}
      <ellipse
        cx="18.5" cy="14.5" rx="3.5" ry="1.8"
        transform="rotate(-57 18.5 14.5)"
        stroke={color} strokeWidth="1.5" fill="none"
      />
      {/* Feather strokes — 6 thin curves radiating from the tip */}
      <path d="M 19 16 Q 7 17 6 8"    stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 19 16 Q 10 9 12 4"   stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 19 16 Q 16 7 18 4"   stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 19 16 Q 22 7 24 4"   stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 19 16 Q 27 9 30 7"   stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M 19 16 Q 30 13 32 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
