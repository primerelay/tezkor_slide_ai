import { ThemeVisual } from '../data/themes';

type Variant = 'hero' | 'content' | 'conclusion';

interface Props {
  theme: ThemeVisual;
  variant: Variant;
  title: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A realistic 16:9 mini-slide preview that mirrors the PPTX renderer design.
 * Uses container-query units (cqw) so it scales perfectly from a small card
 * to a large modal slide. No external assets — pure CSS, original design.
 */
export default function SlideMockup({ theme, variant, title, className, style }: Props) {
  const font = theme.serif ? 'Georgia, "Times New Roman", serif' : 'system-ui, sans-serif';

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        containerType: 'size',
        fontFamily: font,
        ...style,
      }}
    >
      {variant === 'hero' && <Hero theme={theme} title={title} font={font} />}
      {variant === 'content' && <Content theme={theme} title={title} font={font} />}
      {variant === 'conclusion' && <Conclusion theme={theme} title={title} font={font} />}
    </div>
  );
}

function Hero({ theme, title, font }: { theme: ThemeVisual; title: string; font: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.heroBg, color: theme.heroText }}>
      {/* photo-background themes: dark overlay + faint scenery glyph */}
      {theme.photo && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.34)' }} />
          <div style={{ position: 'absolute', right: '13%', top: '13%', width: '12%', aspectRatio: '1', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: '17%', height: '42%', background: 'rgba(255,255,255,0.14)', clipPath: 'polygon(0 100%, 25% 45%, 50% 78%, 72% 28%, 100% 68%, 100% 100%)' }} />
        </>
      )}
      {/* soft decorative circle (geometric themes) */}
      {!theme.serif && !theme.photo && (
        <div
          style={{
            position: 'absolute', right: '-8%', top: '-22%', width: '46%', aspectRatio: '1',
            borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          }}
        />
      )}
      {/* top-left accent marker */}
      <div style={{ position: 'absolute', left: '7%', top: '14%', width: theme.serif ? '20%' : '11%', height: '1.6cqw', background: theme.accent, borderRadius: '999px' }} />
      {/* title */}
      <div
        style={{
          position: 'absolute', left: '7%', right: '7%', top: '30%',
          fontSize: '9cqw', fontWeight: 800, lineHeight: 1.02, fontFamily: font,
          textAlign: theme.serif ? 'left' : 'center',
        }}
      >
        {title}
      </div>
      {/* subtitle bar */}
      <div
        style={{
          position: 'absolute', top: '62%', height: '2cqw', width: '42%',
          left: theme.serif ? '7%' : '29%', borderRadius: '999px',
          background: theme.heroText, opacity: 0.55,
        }}
      />
      {/* bottom info bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '17%', background: 'rgba(0,0,0,0.26)' }}>
        <div style={{ position: 'absolute', left: '7%', top: '34%', width: '8%', height: '2cqw', background: theme.heroText, opacity: 0.85, borderRadius: '2px' }} />
        <div style={{ position: 'absolute', right: '7%', top: '30%', width: '26%', height: '1.8cqw', background: theme.heroText, opacity: 0.6, borderRadius: '999px' }} />
      </div>
    </div>
  );
}

function Content({ theme, title, font }: { theme: ThemeVisual; title: string; font: string }) {
  const muted = (o: number): React.CSSProperties => ({ background: theme.contentText, opacity: o, borderRadius: '999px' });
  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.contentBg, color: theme.contentText }}>
      {/* top title bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '21%', background: theme.primary }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2.6%', background: theme.accent }} />
        <div style={{ position: 'absolute', left: '7%', top: '34%', width: '46%', height: '3cqw', background: '#fff', opacity: 0.92, borderRadius: '3px' }} />
      </div>
      {/* left bullet column */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: '7%', top: `${33 + i * 17}%`, display: 'flex', alignItems: 'center', gap: '2.5cqw', width: '46%' }}>
          <div style={{ width: '2.6cqw', height: '2.6cqw', borderRadius: '50%', background: theme.accent, flex: 'none' }} />
          <div style={{ height: '2cqw', width: `${88 - i * 12}%`, ...muted(0.22) }} />
        </div>
      ))}
      {/* right image placeholder */}
      <div
        style={{
          position: 'absolute', right: '6%', top: '31%', width: '36%', height: '52%',
          borderRadius: '8px', overflow: 'hidden',
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
          boxShadow: '0 4cqw 8cqw rgba(0,0,0,0.18)',
        }}
      >
        {/* tiny "photo" glyph: sun + mountains */}
        <div style={{ position: 'absolute', right: '16%', top: '18%', width: '14%', aspectRatio: '1', borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', background: 'rgba(255,255,255,0.28)', clipPath: 'polygon(0 100%, 30% 35%, 55% 75%, 80% 20%, 100% 60%, 100% 100%)' }} />
      </div>
      <span style={{ fontFamily: font, display: 'none' }}>{title}</span>
    </div>
  );
}

function Conclusion({ theme, title, font }: { theme: ThemeVisual; title: string; font: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.heroBg, color: theme.heroText }}>
      {theme.photo && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.34)' }} />}
      <div style={{ position: 'absolute', left: '7%', top: '12%', width: theme.serif ? '20%' : '11%', height: '1.6cqw', background: theme.accent, borderRadius: '999px' }} />
      <div
        style={{
          position: 'absolute', left: '7%', right: '7%', top: '20%',
          fontSize: '7.5cqw', fontWeight: 800, fontFamily: font,
          textAlign: theme.serif ? 'left' : 'center',
        }}
      >
        {title}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: 'absolute', left: '10%', top: `${42 + i * 13}%`, display: 'flex', alignItems: 'center', gap: '2.5cqw', width: '70%' }}>
          <div style={{ width: '3cqw', height: '3cqw', borderRadius: '50%', background: theme.accent, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.heroText, fontSize: '2cqw', fontWeight: 700 }}>✓</div>
          <div style={{ height: '2cqw', width: `${70 - i * 10}%`, background: theme.heroText, opacity: 0.6, borderRadius: '999px' }} />
        </div>
      ))}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '17%', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ position: 'absolute', left: '37%', top: '38%', width: '26%', height: '2cqw', background: theme.heroText, opacity: 0.7, borderRadius: '999px' }} />
      </div>
    </div>
  );
}
