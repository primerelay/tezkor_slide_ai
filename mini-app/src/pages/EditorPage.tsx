import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Download, Check, Loader2, ArrowLeft, ArrowRight, ListPlus, X, Image as ImageIcon, Search, BarChart3, Shapes, Square, Circle, Type, Minus, Undo2 } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../contexts/LanguageContext';
import { getThemeVisual, ThemeVisual } from '../data/themes';
import SlideSurface, { Slide, SlideElement } from '../components/SlideSurface';

const FULL_BLEED = new Set(['hero', 'conclusion']);

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { haptic, webApp } = useTelegram();
  const { t } = useLanguage();

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('');
  const [title, setTitle] = useState('');
  const [themeId, setThemeId] = useState('academic_blue');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selected, setSelected] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [sent, setSent] = useState(false);
  const [imgPickerOpen, setImgPickerOpen] = useState(false);
  const [imgQuery, setImgQuery] = useState('');
  const [imgResults, setImgResults] = useState<{ url: string; thumb: string; description: string }[]>([]);
  const [imgLoading, setImgLoading] = useState(false);
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [textMenuOpen, setTextMenuOpen] = useState(false);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const undoStack = useRef<{ slideIdx: number; prev: Slide }[]>([]);
  const meta = useRef<{ studentName?: string; teacherName?: string; subtitle?: string }>({});
  const dragRef = useRef<number | null>(null);

  // Pointer-based drag reorder of slides in the rail (mouse + touch).
  const onRailPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current === null) return;
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('[data-thumb]') as HTMLElement | null;
    if (!el) return;
    const to = Number(el.dataset.thumb);
    const from = dragRef.current;
    if (Number.isNaN(to) || to === from) return;
    setSlides((prev) => {
      const a = [...prev];
      const [m] = a.splice(from, 1);
      a.splice(to, 0, m);
      return a.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
    dragRef.current = to;
    setSelected(to);
  };
  const endDrag = () => { dragRef.current = null; };

  // Poll the backend until the AI pipeline finishes, then load the content.
  useEffect(() => {
    let active = true;
    let timer: any;
    const poll = async () => {
      try {
        const res = await fetch(`/api/mini-app/presentation/${id}`);
        if (!res.ok) throw new Error('not found');
        const p = await res.json();
        if (!active) return;
        // Update live progress — always move forward, never backward
        if (p.jobProgress !== undefined) setGenProgress((prev) => Math.max(prev, p.jobProgress));
        if (p.jobStage && p.jobStage !== 'queued') setGenStage(p.jobStage);
        if (p.status === 'completed' && p.generatedContent) {
          setGenProgress(100);
          const c = p.generatedContent;
          setTitle(c.title || p.topic || '');
          setThemeId(c.theme || p.theme || 'academic_blue');
          setSlides((c.slides || []).map((s: Slide, i: number) => ({ ...s, slideNumber: i + 1 })));
          meta.current = { studentName: c.studentName, teacherName: c.teacherName, subtitle: c.subtitle };
          setStatus('ready');
          return;
        }
        if (p.status === 'failed') {
          setStatus('error');
          return;
        }
        // If processing but progress is still 0, show a small hint so user sees movement
        if (p.status === 'processing') setGenProgress((prev) => Math.max(prev, 5));
        timer = setTimeout(poll, 1500);
      } catch {
        timer = setTimeout(poll, 2000);
      }
    };
    poll();
    return () => { active = false; clearTimeout(timer); };
  }, [id]);

  const theme = getThemeVisual(themeId);

  const updateSlide = useCallback((idx: number, patch: Partial<Slide>) => {
    setSlides((prev) => {
      undoStack.current.push({ slideIdx: idx, prev: { ...prev[idx] } });
      if (undoStack.current.length > 30) undoStack.current.shift();
      return prev.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    });
  }, []);

  const undo = () => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    haptic('light');
    setSlides((prev) => prev.map((s, i) => (i === entry.slideIdx ? entry.prev : s)));
    setSelected(entry.slideIdx);
  };

  const addSlide = () => {
    haptic('selection');
    setSlides((prev) => {
      const next = [...prev];
      const insertAt = prev.length; // append before conclusion? keep simple: append at end
      next.splice(insertAt, 0, {
        slideNumber: insertAt + 1,
        type: 'bullets',
        title: '',
        bullets: [''],
        layout: { slideNumber: insertAt + 1, type: 'bullets', layoutVariant: 'left-aligned', hasIcon: false, contentAlignment: 'left', emphasisStyle: 'none' },
        assets: {},
      });
      return next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
    setSelected(slides.length);
  };

  const addChartSlide = () => {
    haptic('selection');
    setSlides((prev) => {
      const next = [...prev, {
        slideNumber: prev.length + 1,
        type: 'chart',
        title: '',
        chart: { chartType: 'bar' as const, data: [{ label: '', value: 50 }, { label: '', value: 75 }, { label: '', value: 100 }] },
        layout: {},
        assets: {},
      }];
      return next.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
    setSelected(slides.length);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    haptic('warning');
    setSlides((prev) => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, slideNumber: i + 1 })));
    setSelected((s) => Math.max(0, s >= idx ? s - 1 : s));
  };

  const moveSlide = (dir: -1 | 1) => {
    const j = selected + dir;
    if (j < 0 || j >= slides.length) return;
    haptic('selection');
    setSlides((prev) => {
      const a = [...prev];
      [a[selected], a[j]] = [a[j], a[selected]];
      return a.map((s, i) => ({ ...s, slideNumber: i + 1 }));
    });
    setSelected(j);
  };

  const addItem = () => {
    const s = slides[selected];
    if (!s) return;
    haptic('selection');
    if (s.type === 'timeline') updateSlide(selected, { timeline: [...(s.timeline || []), { year: '', event: '' }] });
    else if (s.type === 'statistics') updateSlide(selected, { statistics: [...(s.statistics || []), { value: '', label: '' }] });
    else if (s.type === 'comparison' && s.comparison) updateSlide(selected, { comparison: { ...s.comparison, leftItems: [...s.comparison.leftItems, ''], rightItems: [...s.comparison.rightItems, ''] } });
    else if (s.type === 'chart') updateSlide(selected, { chart: { ...(s.chart || {}), data: [...(s.chart?.data || []), { label: '', value: 0 }] } });
    else updateSlide(selected, { bullets: [...(s.bullets || []), ''] });
  };

  const removeItem = () => {
    const s = slides[selected];
    if (!s) return;
    const pop = (arr?: any[]) => (arr || []).slice(0, -1);
    if (s.type === 'timeline') updateSlide(selected, { timeline: pop(s.timeline) });
    else if (s.type === 'statistics') updateSlide(selected, { statistics: pop(s.statistics) });
    else if (s.type === 'comparison' && s.comparison) updateSlide(selected, { comparison: { ...s.comparison, leftItems: pop(s.comparison.leftItems), rightItems: pop(s.comparison.rightItems) } });
    else if (s.type === 'chart') updateSlide(selected, { chart: { ...(s.chart || {}), data: pop(s.chart?.data) } });
    else updateSlide(selected, { bullets: pop(s.bullets) });
  };

  const addElement = (kind: SlideElement['kind']) => {
    haptic('selection');
    setShapeMenuOpen(false);
    const s = slides[selected];
    if (!s) return;
    const id = `el_${Date.now()}_${Math.floor(performance.now())}`;
    const base = { id, kind, x: 0.32, y: 0.36, w: 0.28, h: 0.2 };
    let el: SlideElement;
    if (kind === 'text') el = { ...base, h: 0.12, text: t.placeholderText || 'Matn', fontSize: 24, fontColor: '#111827' };
    else if (kind === 'line') el = { ...base, h: 0.02, color: theme.accent };
    else el = { ...base, color: theme.accent };
    updateSlide(selected, { elements: [...(s.elements || []), el] });
  };

  /** Pitch-like text style presets */
  const TEXT_STYLES = [
    { label: 'Title',       fontSize: 48, bold: true,  italic: false, w: 0.6, h: 0.14 },
    { label: 'Headline',    fontSize: 36, bold: true,  italic: false, w: 0.55, h: 0.12 },
    { label: 'Subheadline', fontSize: 28, bold: false, italic: false, w: 0.5, h: 0.1 },
    { label: 'Normal text', fontSize: 20, bold: false, italic: false, w: 0.45, h: 0.09 },
    { label: 'Small text',  fontSize: 14, bold: false, italic: false, w: 0.4, h: 0.07 },
    { label: '• Bullet list',fontSize: 20, bold: true,  italic: false, w: 0.5, h: 0.09 },
    { label: '1. Number list',fontSize:20,bold: false, italic: false, w: 0.5, h: 0.09 },
  ];

  const addTextStyle = (style: typeof TEXT_STYLES[0]) => {
    haptic('selection');
    setTextMenuOpen(false);
    const s = slides[selected];
    if (!s) return;

    // If a text element is selected → apply the style to it (change type)
    if (selectedElId) {
      const el = (s.elements || []).find((e) => e.id === selectedElId);
      if (el && el.kind === 'text') {
        updateSlide(selected, {
          elements: (s.elements || []).map((e) =>
            e.id === selectedElId
              ? { ...e, fontSize: style.fontSize, bold: style.bold, italic: style.italic, w: style.w, h: style.h }
              : e,
          ),
        });
        return;
      }
    }

    // Otherwise create a new text element with this style
    const id = `el_${Date.now()}_${Math.floor(performance.now())}`;
    const el: SlideElement = {
      id, kind: 'text',
      x: 0.06, y: 0.35, w: style.w, h: style.h,
      text: style.label, fontSize: style.fontSize,
      fontColor: theme.contentText, bold: style.bold, italic: style.italic,
    };
    updateSlide(selected, { elements: [...(s.elements || []), el] });
  };

  const openImagePicker = () => {
    haptic('selection');
    setImgResults([]);
    setImgQuery(slides[selected]?.title || title || '');
    setImgPickerOpen(true);
  };

  const searchImages = async (q: string) => {
    if (!q.trim()) return;
    setImgLoading(true);
    try {
      const res = await fetch(`/api/mini-app/image-search?q=${encodeURIComponent(q)}`);
      setImgResults(res.ok ? await res.json() : []);
    } catch {
      setImgResults([]);
    } finally {
      setImgLoading(false);
    }
  };

  const pickImage = (img: { url: string; thumb: string; description: string }) => {
    haptic('success');
    const s = slides[selected];
    updateSlide(selected, { assets: { ...(s?.assets || {}), image: img } });
    setImgPickerOpen(false);
  };

  const removeImage = () => {
    const s = slides[selected];
    const assets = { ...(s?.assets || {}) };
    delete assets.image;
    updateSlide(selected, { assets });
    setImgPickerOpen(false);
  };

  const download = async () => {
    setDownloading(true);
    haptic('medium');
    try {
      const res = await fetch(`/api/mini-app/presentation/${id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { title, theme: themeId, slides, ...meta.current } }),
      });
      if (!res.ok) throw new Error('finalize failed');
      haptic('success');
      setSent(true);
      if (webApp?.showAlert) {
        webApp.showAlert(`✅ ${t.deckSent}`, () => webApp?.close());
      }
    } catch {
      haptic('error');
      if (webApp?.showAlert) webApp.showAlert(`❌ ${t.errorOccurred}`);
      else alert(t.errorOccurred);
    } finally {
      setDownloading(false);
    }
  };

  if (status === 'loading') {
    const stageLabels: Record<string, string> = {
      queued: t.starting || '🚀',
      parsing: t.analyzingTopic || '🔍',
      outline: t.analyzingTopic || '📋',
      content: t.creatingContent || '✍️',
      layout: t.preparingSlides || '📊',
      assets: t.applyingDesign || '🖼️',
      rendering: t.applyingDesign || '🔧',
      uploading: t.applyingDesign || '📤',
      done: t.ready || '✅',
    };
    const pct = Math.min(genProgress, 99);
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <Loader2 className="w-14 h-14 text-purple-600 animate-spin mb-5" />
        <h2 className="text-lg font-bold text-gray-900 mb-1">{t.buildingDeck}</h2>
        <p className="text-gray-500 text-sm mb-5">{stageLabels[genStage] || t.aiWillCreate}</p>
        <div className="w-full max-w-xs">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">{pct}%</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <X className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-700">{t.errorOccurred}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">{t.back}</button>
      </div>
    );
  }

  const current = slides[selected];

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 shrink-0">
        <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-sm font-semibold text-gray-900 bg-transparent outline-none truncate"
          placeholder={t.title}
        />
        <button
          onClick={download}
          disabled={downloading || sent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-sm font-medium disabled:opacity-60"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {sent ? t.deckSent : t.downloadDeck}
        </button>
      </div>

      {/* Canvas + controls — slide fills available height */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pt-1 pb-1">
        {/* Height-driven slide: fills vertical space, width follows from 16:9 */}
        <div className="flex items-start justify-center" style={{ minHeight: 'calc(100vh - 190px)' }}>
          <div style={{ height: 'calc(100vh - 200px)', aspectRatio: '16/9', maxWidth: '100%', margin: '0 auto', flexShrink: 0 }}>
            <SlideSurface
              key={selected}
              slide={current}
              theme={theme}
              onChange={(patch) => updateSlide(selected, patch)}
              t={t}
              onElementSelect={setSelectedElId}
            />
          </div>
        </div>

        {/* Slide controls */}
        <div className="mt-1.5 flex items-center justify-center gap-1.5 flex-wrap">
            <button onClick={() => moveSlide(-1)} disabled={selected === 0}
              className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-600 disabled:opacity-40">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => moveSlide(1)} disabled={selected === slides.length - 1}
              className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-600 disabled:opacity-40">
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-700 text-sm">
              <ListPlus className="w-4 h-4" /> {t.addBullet}
            </button>
            <button onClick={removeItem}
              className="px-3 py-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-500 text-sm">
              −
            </button>
            <button onClick={openImagePicker}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-700 text-sm">
              <ImageIcon className="w-4 h-4" /> {t.addImage}
            </button>

            {/* Text styles — Pitch-like */}
            <div className="relative">
              <button onClick={() => { setTextMenuOpen((o) => !o); setShapeMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-700 text-sm">
                <Type className="w-4 h-4" /> Text
              </button>
              {textMenuOpen && (() => {
                const hasTextSel = selectedElId && (slides[selected]?.elements || []).find(e => e.id === selectedElId && e.kind === 'text');
                return (
                <div className="absolute bottom-full mb-2 left-0 w-52 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 py-1 z-20">
                  <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">
                    {hasTextSel ? 'Apply style ✏️' : 'Text styles'}
                  </div>
                  {TEXT_STYLES.map((st) => (
                    <button key={st.label} onClick={() => addTextStyle(st)}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors"
                      style={{ fontSize: Math.min(st.fontSize * 0.55, 20), fontWeight: st.bold ? 700 : 400, fontStyle: st.italic ? 'italic' : 'normal' }}>
                      {st.label}
                    </button>
                  ))}
                </div>
                ); })()}
            </div>

            {/* Shape menu */}
            <div className="relative">
              <button onClick={() => { setShapeMenuOpen((o) => !o); setTextMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-700 text-sm">
                <Shapes className="w-4 h-4" /> {t.addShape}
              </button>
              {shapeMenuOpen && (
                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-1 flex gap-1 z-20">
                  <button onClick={() => addElement('rect')} className="p-2 rounded-lg hover:bg-gray-100"><Square className="w-5 h-5 text-gray-700" /></button>
                  <button onClick={() => addElement('ellipse')} className="p-2 rounded-lg hover:bg-gray-100"><Circle className="w-5 h-5 text-gray-700" /></button>
                  <button onClick={() => addElement('line')} className="p-2 rounded-lg hover:bg-gray-100"><Minus className="w-5 h-5 text-gray-700" /></button>
                </div>
              )}
            </div>

            {/* Undo */}
            <button onClick={undo}
              className="p-2 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 text-gray-600">
              <Undo2 className="w-4 h-4" />
            </button>

            {slides.length > 1 && (
              <button onClick={() => deleteSlide(selected)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white shadow-sm ring-1 ring-red-200 text-red-500 text-sm">
                <Trash2 className="w-4 h-4" /> {t.deleteSlide}
              </button>
            )}
          </div>
      </div>

      {/* Slide rail — drag thumbnails to reorder, or use ←/→ */}
      <div
        className="bg-white border-t border-gray-100 px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto"
        onPointerMove={onRailPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {slides.map((s, i) => (
          <button
            key={i}
            data-thumb={i}
            onPointerDown={() => { dragRef.current = i; }}
            onClick={() => { haptic('selection'); setSelected(i); }}
            style={{ touchAction: 'none' }}
            className={`shrink-0 w-20 rounded-md overflow-hidden ring-2 transition-all ${i === selected ? 'ring-purple-500' : 'ring-gray-200'}`}
          >
            <RailThumb slide={s} theme={theme} index={i} />
          </button>
        ))}
        <button
          onClick={addSlide}
          title={t.addSlide}
          className="shrink-0 w-14 h-[45px] rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={addChartSlide}
          title={t.addChart}
          className="shrink-0 w-14 h-[45px] rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>

      {/* Image picker modal */}
      {imgPickerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm" onClick={() => setImgPickerOpen(false)}>
          <div className="mt-auto bg-white rounded-t-3xl flex flex-col max-h-[88%]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <span className="font-bold text-gray-900">{t.addImage}</span>
              <button onClick={() => setImgPickerOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="px-5 py-3 flex gap-2">
              <input
                value={imgQuery}
                onChange={(e) => setImgQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchImages(imgQuery)}
                placeholder={t.imageSearchPlaceholder}
                className="input flex-1"
              />
              <button onClick={() => searchImages(imgQuery)} className="px-4 rounded-xl bg-purple-600 text-white">
                <Search className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {imgLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-purple-600 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {imgResults.map((img, i) => (
                    <button key={i} onClick={() => pickImage(img)} className="rounded-lg overflow-hidden ring-1 ring-gray-200 aspect-video">
                      <img src={img.thumb} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {!imgLoading && imgResults.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-10">{t.imageSearchPlaceholder}</p>
              )}
            </div>
            {slides[selected]?.assets?.image && (
              <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                <button onClick={removeImage} className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
                  {t.removeImage}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Slide thumbnail in the rail ---------- */
function RailThumb({ slide, theme, index }: { slide: Slide; theme: ThemeVisual; index: number }) {
  const full = FULL_BLEED.has(slide.type);
  return (
    <div
      style={{
        aspectRatio: '16/9',
        background: full ? theme.heroBg : theme.contentBg,
        color: full ? theme.heroText : theme.contentText,
        position: 'relative',
      }}
      className="text-[7px] p-1.5 flex flex-col justify-center overflow-hidden"
    >
      {!full && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24%', background: theme.primary }} />}
      <div className="font-bold leading-tight line-clamp-2" style={{ marginTop: full ? 0 : '20%' }}>
        {slide.title || `${index + 1}`}
      </div>
    </div>
  );
}

