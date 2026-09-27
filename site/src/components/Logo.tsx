interface LogoProps {
  showWord?: boolean;
  size?: number;
  className?: string;
}

/**
 * SliderAI.uz brand logo — a gradient tile with a ribbon "S" and an AI spark,
 * drawn as crisp SVG so it scales to any size. The wordmark inherits the
 * current text color (so it works on both light and dark backgrounds).
 */
export default function Logo({ showWord = true, size = 38, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sliderai-tile" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4f46e5" />
            <stop offset="0.55" stopColor="#7c3aed" />
            <stop offset="1" stopColor="#9333ea" />
          </linearGradient>
          <linearGradient id="sliderai-s" x1="14" y1="10" x2="34" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#e0e7ff" />
          </linearGradient>
        </defs>

        {/* rounded tile */}
        <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#sliderai-tile)" />
        {/* subtle top gloss */}
        <rect x="2" y="2" width="44" height="20" rx="13" fill="white" opacity="0.08" />

        {/* ribbon S */}
        <path
          d="M33 16.6c0-4.1-4-6.1-9-6.1-5.3 0-9.2 2.7-9.2 6.8 0 3.9 3.4 5.4 9 6.3 5.7.9 8.4 2.1 8.4 5.6 0 4.1-4.1 6.4-9.2 6.4-5 0-8.8-2-9.2-5.4"
          stroke="url(#sliderai-s)"
          strokeWidth="4.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* AI spark */}
        <path
          d="M36.5 9.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"
          fill="white"
        />
      </svg>

      {showWord && (
        <span className="font-extrabold text-lg tracking-tight leading-none">
          Slider<span className="gradient-text">AI</span>.uz
        </span>
      )}
    </span>
  );
}
