/* eslint-disable */
// @ts-nocheck
'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ScanSolve animation engine — timeline + sprites + a chrome-free embed stage.
// Vendored visual code (raw hex / px by design); type-checking is disabled.
//
// EmbedStage is the production stage: no scrubber, no letterbox, no keyboard.
// It auto-scales to its container width, plays only while scrolled into view
// (IntersectionObserver), and freezes on a static frame when the visitor has
// prefers-reduced-motion enabled.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';

export const Easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
  easeInExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return 0.5 * Math.pow(2, 20 * t - 10);
    return 1 - 0.5 * Math.pow(2, -20 * t + 10);
  },
  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  easeInBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function interpolate(input, output, ease = Easing.linear) {
  return (t) => {
    if (t <= input[0]) return output[0];
    if (t >= input[input.length - 1]) return output[output.length - 1];
    for (let i = 0; i < input.length - 1; i++) {
      if (t >= input[i] && t <= input[i + 1]) {
        const span = input[i + 1] - input[i];
        const local = span === 0 ? 0 : (t - input[i]) / span;
        const easeFn = Array.isArray(ease) ? (ease[i] || Easing.linear) : ease;
        const eased = easeFn(local);
        return output[i] + (output[i + 1] - output[i]) * eased;
      }
    }
    return output[output.length - 1];
  };
}

export function animate({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }) {
  return (t) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

export const TimelineContext = React.createContext({ time: 0, duration: 10, playing: false });
export const useTime = () => React.useContext(TimelineContext).time;
export const useTimeline = () => React.useContext(TimelineContext);

export const SpriteContext = React.createContext({ localTime: 0, progress: 0, duration: 0 });
export const useSprite = () => React.useContext(SpriteContext);

export function Sprite({ start = 0, end = Infinity, children, keepMounted = false }) {
  const { time } = useTimeline();
  const visible = time >= start && time <= end;
  if (!visible && !keepMounted) return null;
  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress = duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;
  const value = { localTime, progress, duration, visible };
  return React.createElement(
    SpriteContext.Provider,
    { value },
    typeof children === 'function' ? children(value) : children
  );
}

// Chrome-free stage: scales to container width, plays only while in view.
export function EmbedStage({ width, height, duration, background, loop = true, staticFrame = 22.6, children }) {
  const [time, setTime] = React.useState(0);
  const [scale, setScale] = React.useState(0);
  const [active, setActive] = React.useState(false);
  const wrapRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastRef = React.useRef(null);
  const reduced = React.useRef(false);

  // fit to container width
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => { const w = el.clientWidth; if (w > 0) setScale(w / width); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [width]);

  // reduced-motion freeze + play-when-visible
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    if (mq.matches) { setTime(staticFrame); return; }
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => setActive(!!es[0] && es[0].isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [staticFrame]);

  // animation loop (only while active and not reduced-motion)
  React.useEffect(() => {
    if (!active || reduced.current) { lastRef.current = null; return; }
    const step = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setTime((t) => { let n = t + dt; if (n >= duration) { n = loop ? n % duration : duration; } return n; });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [active, duration, loop]);

  const ctxValue = React.useMemo(
    () => ({ time, duration, playing: active, setTime, setPlaying: () => {} }),
    [time, duration, active]
  );

  const outerStyle = { position: 'relative', width: '100%', overflow: 'hidden' };
  if (scale > 0) outerStyle.height = height * scale;
  else outerStyle.paddingBottom = (height / width * 100) + '%';

  const innerStyle = {
    position: 'absolute', top: 0, left: 0, width, height, background,
    transform: 'scale(' + scale + ')', transformOrigin: 'top left', overflow: 'hidden',
  };

  return React.createElement(
    'div',
    { ref: wrapRef, style: outerStyle },
    React.createElement(
      'div',
      { style: innerStyle },
      React.createElement(TimelineContext.Provider, { value: ctxValue }, children)
    )
  );
}
