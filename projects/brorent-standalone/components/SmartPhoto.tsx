'use client';

import { useEffect, useState } from 'react';

type Props = {
  src: string;
  fallback: string;
  alt?: string;
  className?: string;
};

const originalOk = new Map<string, boolean>();

function probeOriginal(src: string): Promise<boolean> {
  if (originalOk.has(src)) return Promise.resolve(originalOk.get(src)!);
  return new Promise((resolve) => {
    const img = new window.Image();
    const timer = setTimeout(() => {
      originalOk.set(src, false);
      resolve(false);
    }, 4000);
    img.onload = () => {
      clearTimeout(timer);
      originalOk.set(src, true);
      resolve(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      originalOk.set(src, false);
      resolve(false);
    };
    img.src = src;
  });
}

export default function SmartPhoto({ src, fallback, alt = '', className = '' }: Props) {
  const [current, setCurrent] = useState(fallback);

  useEffect(() => {
    let cancelled = false;
    if (current === src) return;
    probeOriginal(src).then((ok) => {
      if (!cancelled && ok) setCurrent(src);
    });
    return () => { cancelled = true; };
  }, [src, current]);

  return <img src={current} alt={alt} className={className} loading="lazy" />;
}
