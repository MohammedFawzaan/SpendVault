import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 800, delay = 0): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function run() {
      from.current = 0;
      start.current = null;

      function step(ts: number) {
        if (start.current === null) start.current = ts;
        const elapsed = ts - start.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(from.current + (target - from.current) * eased));
        if (progress < 1) {
          raf.current = requestAnimationFrame(step);
        } else {
          setValue(target);
        }
      }

      raf.current = requestAnimationFrame(step);
    }

    timeout = setTimeout(run, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return value;
}
