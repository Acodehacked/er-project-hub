'use client';

import { useRef } from 'react';
import { gsap, useGSAP, MOTION_OK } from './gsap';

/**
 * Decorative animated background for the landing hero: an engineering-paper
 * grid with slowly drifting warm glows and a "circuit trace" that draws itself.
 */
export function HeroBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.to('[data-orb="a"]', { x: 60, y: -30, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to('[data-orb="b"]', { x: -50, y: 40, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.fromTo(
          '[data-trace]',
          { strokeDashoffset: 1200 },
          { strokeDashoffset: 0, duration: 3.5, ease: 'power2.inOut', stagger: 0.6, delay: 0.3 },
        );
        gsap.to('[data-node]', { scale: 1.6, opacity: 0.25, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4, transformOrigin: 'center' });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div data-orb="a" className="absolute -top-24 left-[10%] size-[28rem] rounded-full bg-primary/20 blur-3xl" />
      <div data-orb="b" className="absolute top-20 right-[5%] size-[22rem] rounded-full bg-info/15 blur-3xl" />
      <svg className="absolute inset-x-0 top-10 mx-auto h-[420px] w-full max-w-6xl text-primary/40" viewBox="0 0 1200 420" fill="none">
        <path data-trace d="M0 320 H220 L260 280 H460 L500 240 H700" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1200" />
        <path data-trace d="M1200 120 H980 L940 160 H760 L720 200 H560" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1200" />
        <path data-trace d="M1200 360 H1040 L1000 320 H860" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1200" />
        <circle data-node cx="700" cy="240" r="4" fill="currentColor" />
        <circle data-node cx="560" cy="200" r="4" fill="currentColor" />
        <circle data-node cx="860" cy="320" r="4" fill="currentColor" />
      </svg>
    </div>
  );
}
