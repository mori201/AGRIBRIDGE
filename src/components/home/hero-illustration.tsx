/** Illustration originale AgriBridge : champs en terrasses, soleil, pont et pousse. SVG léger (aucune image externe). */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 400" className={className} role="img" aria-label="Illustration : champs cultivés reliés par un pont vers une pousse dorée">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8f6d5" /><stop offset="1" stopColor="#fdf8ea" /></linearGradient>
        <linearGradient id="f1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7cbf3f" /><stop offset="1" stopColor="#2f8249" /></linearGradient>
        <linearGradient id="f2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1f6a39" /><stop offset="1" stopColor="#18552f" /></linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8cd7a" /><stop offset="1" stopColor="#c9a13b" /></linearGradient>
      </defs>
      <rect x="0" y="0" width="480" height="400" rx="36" fill="url(#sky)" />
      <circle cx="370" cy="96" r="46" fill="url(#gold)" opacity="0.9" />
      <circle cx="370" cy="96" r="66" fill="#c9a13b" opacity="0.12" />
      <path d="M0 250 C 90 200, 170 215, 250 240 S 400 270, 480 230 L480 400 L0 400Z" fill="url(#f1)" />
      <path d="M0 300 C 110 265, 210 280, 300 300 S 420 320, 480 300 L480 400 L0 400Z" fill="url(#f2)" />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${20 + i * 52} 340 q 26 -18 52 0`} stroke="#acd8b7" strokeWidth="2" fill="none" opacity="0.5" />
      ))}
      <path d="M90 262 C 150 180, 300 180, 370 262" fill="none" stroke="#c9a13b" strokeWidth="8" strokeLinecap="round" />
      {[120, 165, 210, 255, 300, 340].map((x, i) => (
        <line key={x} x1={x} y1={[238, 214, 202, 202, 214, 238][i]} x2={x} y2="262" stroke="#fdf8ea" strokeWidth="4" strokeLinecap="round" />
      ))}
      <rect x="80" y="258" width="300" height="9" rx="4.5" fill="#fdf8ea" />
      <g transform="translate(232 150)">
        <path d="M0 40 V -6" stroke="#18552f" strokeWidth="5" strokeLinecap="round" />
        <path d="M0 6 C -30 0, -36 -26, -30 -40 C -6 -36, 4 -18, 0 6Z" fill="#7cbf3f" />
        <path d="M0 -4 C 26 -12, 34 -36, 28 -52 C 6 -46, -4 -26, 0 -4Z" fill="#2f8249" />
      </g>
      <g fill="#18552f" opacity="0.85">
        <circle cx="60" cy="236" r="10" /><rect x="57" y="236" width="6" height="22" rx="2" />
        <circle cx="420" cy="226" r="12" /><rect x="416" y="226" width="8" height="26" rx="2" />
      </g>
      <g transform="translate(40 40)">
        <rect width="150" height="64" rx="16" fill="#ffffff" opacity="0.95" />
        <circle cx="30" cy="32" r="14" fill="#eef7f0" />
        <path d="M24 32 l5 5 l9 -11" stroke="#1f6a39" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="54" y="20" width="80" height="8" rx="4" fill="#d5ecda" />
        <rect x="54" y="36" width="56" height="8" rx="4" fill="#f8edc8" />
      </g>
    </svg>
  );
}
