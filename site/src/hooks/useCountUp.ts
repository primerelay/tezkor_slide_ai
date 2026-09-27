import { useEffect, useRef, useState } from 'react';

/**
 * Count from 0 to `end` once the element scrolls into view.
 * Returns the current value and a ref to attach to the target element.
 */
export function useCountUp(end: number, durationMs = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / durationMs, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(eased * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, durationMs]);

  return { value, ref };
}
