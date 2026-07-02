import { useRef, useState } from 'react';
import { ThemeVisual } from '../data/themes';
import { Translations } from '../i18n/translations';

export interface SlideElement {
  id: string;
  kind: 'rect' | 'ellipse' | 'line' | 'text';
  x: number; y: number; w: number; h: number; // 0..1 fractions
  color?: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Faithful, inline-editable 16:9 slide surface — renders each slide type the
 * way the PPTX renderer does, with contentEditable text so the user edits
 * directly on the slide (WYSIWYG). Uses container-query units (cqw) to scale.
 */

export type Slide = {
  slideNumber: number;
  type: string;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  quote?: { text: string; author: string };
  timeline?: { year: string; event: string }[];
  statistics?: { value: string; label: string }[];
  comparison?: { leftTitle: string; rightTitle: string; leftItems: string[]; rightItems: string[] };
  chart?: { data: { label: string; value: number }[]; chartType?: 'bar' | 'pie' | 'line' };
  elements?: SlideElement[];
  layout?: any;
  assets?: any;
};

const FULL_BLEED = new Set(['hero', 'conclusion']);

/** Uncontrolled contentEditable that reports its text on blur (no cursor jumps). */
function Editable({
  value,
  onChange,
  style,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      data-ph={placeholder || ''}
      className="editable"
      style={{ outline: 'none', cursor: 'text', whiteSpace: multiline ? 'pre-wrap' : 'normal', ...style }}
      onBlur={(e) => onChange(e.currentTarget.textContent || '')}
    >
      {value}
    </div>
  );
}

interface Props {
  slide: Slide;
  theme: ThemeVisual;
  onChange: (patch: Partial<Slide>) => void;
  t?: Translations;
  /** Reports the currently selected element ID (or null) to the parent. */
  onElementSelect?: (id: string | null) => void;
}

// Default placeholders (Uzbek) for backward compatibility
const defaultT = {
  placeholderTitle: 'Sarlavha',
  placeholderSubtitle: 'Quyi sarlavha',
  placeholderText: 'Matn',
  placeholderConclusion: 'Xulosa',
  placeholderQuote: 'Iqtibos matni',
  placeholderAuthor: 'Muallif',
  placeholderPlan: 'Reja',
  placeholderYear: 'Yil',
  placeholderEvent: 'Voqea',
  placeholderNote: 'Izoh',
  placeholderName: 'Nom',
};

export default function SlideSurface({ slide, theme, onChange, t, onElementSelect }: Props) {
  const full = FULL_BLEED.has(slide.type);
  const font = theme.serif ? 'Georgia, "Times New Roman", serif' : 'system-ui, sans-serif';
  const bg = full ? theme.heroBg : theme.contentBg;
  const fg = full ? theme.heroText : theme.contentText;
  const tr = { ...defaultT, ...t };

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', aspectRatio: '16/9', background: bg, color: fg, fontFamily: font, containerType: 'size', overflow: 'hidden' }}
      className="rounded-xl shadow-lg ring-1 ring-black/5"
    >
      {slide.type === 'hero' && <Hero slide={slide} theme={theme} onChange={onChange} font={font} t={tr} />}
      {slide.type === 'conclusion' && <Conclusion slide={slide} theme={theme} onChange={onChange} font={font} t={tr} />}
      {slide.type === 'quote' && <Quote slide={slide} theme={theme} onChange={onChange} t={tr} />}
      {slide.type === 'reja' && <Reja slide={slide} theme={theme} onChange={onChange} t={tr} />}
      {(slide.type === 'bullets' || !['hero', 'conclusion', 'quote', 'reja', 'timeline', 'comparison', 'statistics', 'chart'].includes(slide.type)) && (
        <Bullets slide={slide} theme={theme} onChange={onChange} t={tr} />
      )}
      {slide.type === 'timeline' && <Timeline slide={slide} theme={theme} onChange={onChange} t={tr} />}
      {slide.type === 'comparison' && <Comparison slide={slide} theme={theme} onChange={onChange} t={tr} />}
      {slide.type === 'statistics' && <Statistics slide={slide} theme={theme} onChange={onChange} t={tr} />}
      {slide.type === 'chart' && <Chart slide={slide} theme={theme} onChange={onChange} t={tr} />}

      <ElementsLayer elements={slide.elements || []} theme={theme} onChange={(els) => onChange({ elements: els })} t={tr} onSelect={onElementSelect} />
    </div>
  );
}

/* ---------- Free-form draggable/resizable elements overlay ---------- */
function ElementsLayer({ elements, theme, onChange, t, onSelect }: { elements: SlideElement[]; theme: ThemeVisual; onChange: (els: SlideElement[]) => void; t: typeof defaultT; onSelect?: (id: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [selected, _setSelected] = useState<string | null>(null);
  const setSelected = (id: string | null) => { _setSelected(id); onSelect?.(id); };
  const drag = useRef<{ id: string; mode: 'move' | 'resize'; px: number; py: number; box: SlideElement } | null>(null);

  const update = (id: string, patch: Partial<SlideElement>) =>
    onChange(elements.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => { onChange(elements.filter((e) => e.id !== id)); setSelected(null); };

  const onMove = (ev: React.PointerEvent) => {
    const d = drag.current;
    const rect = ref.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = (ev.clientX - d.px) / rect.width;
    const dy = (ev.clientY - d.py) / rect.height;
    if (d.mode === 'move') {
      update(d.id, {
        x: Math.min(1 - d.box.w, Math.max(0, d.box.x + dx)),
        y: Math.min(1 - d.box.h, Math.max(0, d.box.y + dy)),
      });
    } else {
      update(d.id, {
        w: Math.min(1 - d.box.x, Math.max(0.05, d.box.w + dx)),
        h: Math.min(1 - d.box.y, Math.max(0.04, d.box.h + dy)),
      });
    }
  };
  const start = (e: SlideElement, mode: 'move' | 'resize') => (ev: React.PointerEvent) => {
    ev.stopPropagation();
    setSelected(e.id);
    // Capture the pointer so drag keeps working even outside the element box.
    try { (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId); } catch {}
    drag.current = { id: e.id, mode, px: ev.clientX, py: ev.clientY, box: { ...e } };
  };
  const end = () => { drag.current = null; };

  const COLORS = [theme.primary, theme.accent, '#111827', '#ffffff'];

  // The overlay itself never captures taps (so the underlying editable text
  // stays tappable); only the element boxes below are interactive.
  return (
    <div
      ref={ref}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {elements.map((e) => {
        const sel = selected === e.id;
        const common: React.CSSProperties = {
          position: 'absolute', left: `${e.x * 100}%`, top: `${e.y * 100}%`,
          width: `${e.w * 100}%`, height: `${e.h * 100}%`,
          cursor: 'move', boxSizing: 'border-box', pointerEvents: 'auto',
          outline: sel ? '2px solid #7c3aed' : 'none',
        };
        return (
          <div key={e.id} style={common}
            onPointerDown={start(e, 'move')}
            onPointerMove={onMove}
            onPointerUp={end}
            onPointerCancel={end}
          >
            {e.kind === 'rect' && <div style={{ width: '100%', height: '100%', background: e.color || theme.accent, borderRadius: 4 }} />}
            {e.kind === 'ellipse' && <div style={{ width: '100%', height: '100%', background: e.color || theme.accent, borderRadius: '50%' }} />}
            {e.kind === 'line' && <div style={{ width: '100%', height: 0, borderTop: `0.6cqw solid ${e.color || theme.accent}`, marginTop: '50%' }} />}
            {e.kind === 'text' && (
              <Editable value={e.text || ''} onChange={(v) => update(e.id, { text: v })} placeholder={t.placeholderText}
                style={{
                  width: '100%', height: '100%',
                  fontSize: `${(e.fontSize || 20) / 5}cqw`,
                  color: e.fontColor || '#111827',
                  display: 'flex', alignItems: 'center',
                  fontWeight: e.bold ? 700 : 400,
                  fontStyle: e.italic ? 'italic' : 'normal',
                }} />
            )}
            {sel && (
              <>
                {/* resize handle */}
                <div onPointerDown={start(e, 'resize')} onPointerMove={onMove} onPointerUp={end} onPointerCancel={end}
                  style={{ position: 'absolute', right: -6, bottom: -6, width: 16, height: 16, background: '#7c3aed', borderRadius: '50%', cursor: 'nwse-resize', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                {/* delete */}
                <button onPointerDown={(ev) => { ev.stopPropagation(); remove(e.id); }} style={{ position: 'absolute', right: -10, top: -12, width: 20, height: 20, background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 12, lineHeight: '20px' }}>×</button>

                {/* floating toolbar — color + size + bold + italic */}
                <div onPointerDown={(ev) => ev.stopPropagation()} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: -38, background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.18)', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', zIndex: 20 }}>
                  {/* color swatches */}
                  {COLORS.map((c) => (
                    <div key={c} onPointerDown={() => update(e.id, e.kind === 'text' ? { fontColor: c } : { color: c })}
                      style={{ width: 13, height: 13, borderRadius: '50%', background: c, border: '1.5px solid rgba(0,0,0,0.2)', cursor: 'pointer', flexShrink: 0 }} />
                  ))}
                  {/* divider */}
                  <div style={{ width: 1, height: 14, background: '#e5e7eb', margin: '0 2px' }} />
                  {/* size presets — only for text */}
                  {e.kind === 'text' && [14, 20, 28, 40].map((sz) => (
                    <button key={sz} onPointerDown={() => update(e.id, { fontSize: sz })}
                      style={{ fontSize: 9, padding: '1px 4px', borderRadius: 4, background: e.fontSize === sz ? '#7c3aed' : '#f3f4f6', color: e.fontSize === sz ? '#fff' : '#374151', fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                      {sz === 14 ? 'S' : sz === 20 ? 'M' : sz === 28 ? 'L' : 'XL'}
                    </button>
                  ))}
                  {/* bold + italic — only for text */}
                  {e.kind === 'text' && <>
                    <button onPointerDown={() => update(e.id, { bold: !e.bold })}
                      style={{ fontSize: 11, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: e.bold ? '#7c3aed' : '#f3f4f6', color: e.bold ? '#fff' : '#374151', cursor: 'pointer', border: 'none' }}>B</button>
                    <button onPointerDown={() => update(e.id, { italic: !e.italic })}
                      style={{ fontSize: 11, fontStyle: 'italic', padding: '1px 5px', borderRadius: 4, background: e.italic ? '#7c3aed' : '#f3f4f6', color: e.italic ? '#fff' : '#374151', cursor: 'pointer', border: 'none' }}>I</button>
                  </>}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----- content-slide top bar (shared) ----- */
function TopBar({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '20%', background: theme.primary, color: '#fff', display: 'flex', alignItems: 'center' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2.5%', background: theme.accent }} />
      <Editable value={slide.title || ''} onChange={(v) => onChange({ title: v })} placeholder={t.placeholderTitle}
        style={{ marginLeft: '6%', marginRight: '5%', fontSize: '6cqw', fontWeight: 800, width: '90%' }} />
    </div>
  );
}

function Hero({ slide, theme, onChange, font, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; font: string; t: typeof defaultT }) {
  const align = theme.serif ? 'left' : 'center';
  return (
    <>
      {theme.photo && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />}
      <div style={{ position: 'absolute', left: '7%', top: '14%', width: theme.serif ? '20%' : '11%', height: '1.4cqw', background: theme.accent, borderRadius: 99 }} />
      <Editable value={slide.title || ''} onChange={(v) => onChange({ title: v })} placeholder={t.placeholderTitle} multiline
        style={{ position: 'absolute', left: '7%', right: '7%', top: '32%', fontSize: '9cqw', fontWeight: 800, lineHeight: 1.02, textAlign: align, fontFamily: font }} />
      <Editable value={slide.subtitle || ''} onChange={(v) => onChange({ subtitle: v })} placeholder={t.placeholderSubtitle}
        style={{ position: 'absolute', left: theme.serif ? '7%' : '15%', right: theme.serif ? '7%' : '15%', top: '64%', fontSize: '4cqw', opacity: 0.85, textAlign: align }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '15%', background: 'rgba(0,0,0,0.24)' }} />
    </>
  );
}

function Conclusion({ slide, theme, onChange, font, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; font: string; t: typeof defaultT }) {
  const setB = (i: number, v: string) => { const a = [...(slide.bullets || [])]; a[i] = v; onChange({ bullets: a }); };
  return (
    <>
      {theme.photo && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} />}
      <Editable value={slide.title || ''} onChange={(v) => onChange({ title: v })} placeholder={t.placeholderConclusion}
        style={{ position: 'absolute', left: '7%', right: '7%', top: '12%', fontSize: '7cqw', fontWeight: 800, fontFamily: font }} />
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '34%' }}>
        {(slide.bullets || []).slice(0, 5).map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2.5cqw', marginBottom: '2.5cqw' }}>
            <div style={{ width: '3.4cqw', height: '3.4cqw', borderRadius: '50%', background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2cqw', flex: 'none' }}>✓</div>
            <Editable value={b} onChange={(v) => setB(i, v)} style={{ fontSize: '3.4cqw', flex: 1 }} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '15%', background: 'rgba(0,0,0,0.28)' }} />
    </>
  );
}

function Quote({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  const q = slide.quote || { text: '', author: '' };
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#f4f4f6', color: '#1f2937' }}>
      <div style={{ position: 'absolute', left: '4%', top: '6%', bottom: '6%', width: '1.4%', background: theme.primary }} />
      <div style={{ position: 'absolute', left: '8%', top: '8%', fontSize: '18cqw', color: theme.accent, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
      <Editable value={q.text} onChange={(v) => onChange({ quote: { ...q, text: v } })} placeholder={t.placeholderQuote} multiline
        style={{ position: 'absolute', left: '10%', right: '8%', top: '30%', fontSize: '5cqw', fontStyle: 'italic', fontFamily: 'Georgia, serif' }} />
      <Editable value={q.author} onChange={(v) => onChange({ quote: { ...q, author: v } })} placeholder={t.placeholderAuthor}
        style={{ position: 'absolute', right: '8%', bottom: '14%', fontSize: '3.4cqw', fontWeight: 700, color: theme.primary, textAlign: 'right' }} />
    </div>
  );
}

function Reja({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  const items = slide.bullets || [];
  const setB = (i: number, v: string) => { const a = [...items]; a[i] = v; onChange({ bullets: a }); };
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1.4%', background: theme.primary }} />
      <Editable value={slide.title || t.placeholderPlan} onChange={(v) => onChange({ title: v })} placeholder={t.placeholderPlan}
        style={{ position: 'absolute', left: '6%', top: '6%', fontSize: '7cqw', fontWeight: 800, color: theme.primary }} />
      <div style={{ position: 'absolute', left: '6%', right: '6%', top: '24%' }}>
        {items.slice(0, 8).map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2.5cqw', marginBottom: '1.6cqw' }}>
            <div style={{ width: '4.5cqw', height: '4.5cqw', background: theme.primary, color: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4cqw', fontWeight: 700, flex: 'none' }}>{i + 1}</div>
            <Editable value={it} onChange={(v) => setB(i, v)} style={{ fontSize: '3cqw', flex: 1 }} />
          </div>
        ))}
      </div>
    </>
  );
}

function Bullets({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  const setB = (i: number, v: string) => { const a = [...(slide.bullets || [])]; a[i] = v; onChange({ bullets: a }); };
  const img: string | undefined = slide.assets?.image?.url || slide.assets?.image?.thumb;
  return (
    <>
      <TopBar slide={slide} theme={theme} onChange={onChange} t={t} />
      <div style={{ position: 'absolute', left: '6%', right: img ? '42%' : '6%', top: '27%' }}>
        {(slide.bullets || []).slice(0, 6).map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '2.5cqw', marginBottom: '2.4cqw' }}>
            <div style={{ width: '2cqw', height: '2cqw', borderRadius: '50%', background: theme.accent, marginTop: '1.4cqw', flex: 'none' }} />
            <Editable value={b} onChange={(v) => setB(i, v)} multiline style={{ fontSize: '3.2cqw', flex: 1, lineHeight: 1.25 }} />
          </div>
        ))}
      </div>
      {img && (
        <div style={{ position: 'absolute', right: '6%', top: '27%', width: '34%', height: '58%', borderRadius: 8, overflow: 'hidden', boxShadow: '0 3cqw 6cqw rgba(0,0,0,0.18)' }}>
          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
    </>
  );
}

function Timeline({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  const ev = slide.timeline || [];
  const set = (i: number, patch: Partial<{ year: string; event: string }>) => { const a = [...ev]; a[i] = { ...a[i], ...patch }; onChange({ timeline: a }); };
  return (
    <>
      <TopBar slide={slide} theme={theme} onChange={onChange} t={t} />
      <div style={{ position: 'absolute', left: '6%', right: '6%', top: '26%' }}>
        {ev.slice(0, 6).map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2.5cqw', marginBottom: '2cqw' }}>
            <Editable value={e.year} onChange={(v) => set(i, { year: v })} placeholder={t.placeholderYear} style={{ fontSize: '3.2cqw', fontWeight: 800, color: theme.primary, width: '14%', flex: 'none' }} />
            <div style={{ width: '2.2cqw', height: '2.2cqw', borderRadius: '50%', background: theme.accent, flex: 'none' }} />
            <Editable value={e.event} onChange={(v) => set(i, { event: v })} placeholder={t.placeholderEvent} style={{ fontSize: '3cqw', flex: 1 }} />
          </div>
        ))}
      </div>
    </>
  );
}

function Comparison({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  const c = slide.comparison || { leftTitle: '', rightTitle: '', leftItems: [], rightItems: [] };
  const col = (side: 'left' | 'right') => {
    const tk = side === 'left' ? 'leftTitle' : 'rightTitle';
    const ik = side === 'left' ? 'leftItems' : 'rightItems';
    return (
      <div style={{ flex: 1, background: theme.contentBg === '#ffffff' ? '#f5f7fb' : 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3cqw', border: `1px solid ${side === 'left' ? theme.primary : theme.accent}` }}>
        <Editable value={(c as any)[tk]} onChange={(v) => onChange({ comparison: { ...c, [tk]: v } })} placeholder={t.placeholderTitle}
          style={{ fontSize: '3.4cqw', fontWeight: 700, color: side === 'left' ? theme.primary : theme.accent, textAlign: 'center', marginBottom: '2cqw' }} />
        {((c as any)[ik] as string[]).map((it, i) => (
          <Editable key={i} value={it} onChange={(v) => { const a = [...(c as any)[ik]]; a[i] = v; onChange({ comparison: { ...c, [ik]: a } }); }} style={{ fontSize: '2.8cqw', marginBottom: '1.2cqw' }} />
        ))}
      </div>
    );
  };
  return (
    <>
      <TopBar slide={slide} theme={theme} onChange={onChange} t={t} />
      <div style={{ position: 'absolute', left: '4%', right: '4%', top: '25%', bottom: '6%', display: 'flex', gap: '3cqw' }}>
        {col('left')}
        {col('right')}
      </div>
    </>
  );
}

function Statistics({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  const st = slide.statistics || [];
  const set = (i: number, patch: Partial<{ value: string; label: string }>) => { const a = [...st]; a[i] = { ...a[i], ...patch }; onChange({ statistics: a }); };
  return (
    <>
      <TopBar slide={slide} theme={theme} onChange={onChange} t={t} />
      <div style={{ position: 'absolute', left: '5%', right: '5%', top: '28%', display: 'flex', gap: '3cqw', justifyContent: 'center' }}>
        {st.slice(0, 4).map((s, i) => (
          <div key={i} style={{ flex: 1, maxWidth: '22%', textAlign: 'center', background: theme.contentBg === '#ffffff' ? '#f5f7fb' : 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3cqw' }}>
            <Editable value={s.value} onChange={(v) => set(i, { value: v })} placeholder="00%" style={{ fontSize: '6cqw', fontWeight: 800, color: theme.primary, textAlign: 'center' }} />
            <Editable value={s.label} onChange={(v) => set(i, { label: v })} placeholder={t.placeholderNote} style={{ fontSize: '2.4cqw', textAlign: 'center', marginTop: '1cqw' }} />
          </div>
        ))}
      </div>
    </>
  );
}

function Chart({ slide, theme, onChange, t }: { slide: Slide; theme: ThemeVisual; onChange: (p: Partial<Slide>) => void; t: typeof defaultT }) {
  const data = slide.chart?.data || [];
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const set = (i: number, patch: Partial<{ label: string; value: number }>) => {
    const a = [...data];
    a[i] = { ...a[i], ...patch };
    onChange({ chart: { ...(slide.chart || {}), data: a } });
  };
  return (
    <>
      <TopBar slide={slide} theme={theme} onChange={onChange} t={t} />
      <div style={{ position: 'absolute', left: '6%', right: '6%', top: '27%', bottom: '7%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '2cqw' }}>
        {data.slice(0, 8).map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <Editable value={String(d.value ?? '')} onChange={(v) => set(i, { value: Number(v.replace(/[^0-9.\-]/g, '')) || 0 })} placeholder="0" style={{ fontSize: '2.6cqw', fontWeight: 700, color: theme.primary }} />
            <div style={{ width: '64%', height: `${((Number(d.value) || 0) / max) * 100}%`, minHeight: '2%', background: `linear-gradient(180deg, ${theme.accent}, ${theme.primary})`, borderRadius: '1.2cqw 1.2cqw 0 0', marginTop: '1cqw' }} />
            <Editable value={d.label} onChange={(v) => set(i, { label: v })} placeholder={t.placeholderName} style={{ fontSize: '2.4cqw', marginTop: '1cqw', textAlign: 'center', maxWidth: '100%' }} />
          </div>
        ))}
      </div>
    </>
  );
}
