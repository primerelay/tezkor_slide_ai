// Decorative twinkling sparkles layer (pure CSS/SVG, no images).
const SPARKS = [
  { top: '8%', left: '12%', size: 13, delay: '0s', color: '#818cf8' },
  { top: '18%', left: '82%', size: 10, delay: '0.6s', color: '#60a5fa' },
  { top: '30%', left: '45%', size: 8, delay: '1.2s', color: '#a5b4fc' },
  { top: '52%', left: '6%', size: 11, delay: '0.3s', color: '#c4b5fd' },
  { top: '66%', left: '90%', size: 13, delay: '0.9s', color: '#38bdf8' },
  { top: '78%', left: '30%', size: 9, delay: '1.5s', color: '#818cf8' },
  { top: '40%', left: '70%', size: 11, delay: '0.4s', color: '#93c5fd' },
  { top: '88%', left: '60%', size: 8, delay: '1.1s', color: '#a5b4fc' },
];

function Star({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 0c.6 6 5.4 10.8 11.4 11.4C17.4 12 12.6 16.8 12 22.8 11.4 16.8 6.6 12 .6 11.4 6.6 10.8 11.4 6 12 0Z"
        fill={color}
      />
    </svg>
  );
}

export default function Sparkles() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[1]">
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle"
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          <Star size={s.size} color={s.color} />
        </span>
      ))}
    </div>
  );
}
