'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register plugins once for the whole client bundle.
gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Media query used by every animation so reduced-motion users get none. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

export { gsap, ScrollTrigger, useGSAP };
