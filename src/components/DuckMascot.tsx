export default function DuckMascot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true">
      {/* Füsse */}
      <path d="M38 132 l-14 10 h28 z" fill="#f5a524" />
      <path d="M82 132 l14 10 h-28 z" fill="#f5a524" />
      {/* Körper */}
      <ellipse cx="60" cy="100" rx="42" ry="35" fill="#e0453f" />
      {/* Flügel */}
      <ellipse cx="20" cy="100" rx="11" ry="22" fill="#c9362f" />
      <ellipse cx="100" cy="100" rx="11" ry="22" fill="#c9362f" />
      {/* Bauch-Münze */}
      <ellipse cx="60" cy="100" rx="17" ry="24" fill="#f2c94c" />
      <text
        x="60" y="110"
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fill="#7a5b12"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>
      {/* Hals */}
      <rect x="50" y="52" width="20" height="22" rx="9" fill="#c8cdd4" />
      {/* Kopf */}
      <circle cx="60" cy="38" r="27" fill="#c8cdd4" />
      {/* Augen */}
      <circle cx="50" cy="34" r="8" fill="#ffffff" />
      <circle cx="70" cy="34" r="8" fill="#ffffff" />
      <circle cx="51" cy="35" r="3.5" fill="#1b1b1b" />
      <circle cx="69" cy="35" r="3.5" fill="#1b1b1b" />
      {/* Schnabel */}
      <ellipse cx="60" cy="52" rx="13" ry="8" fill="#f5a524" />
      <path d="M48 52 h24" stroke="#d98c12" strokeWidth="1.5" />
    </svg>
  )
}
