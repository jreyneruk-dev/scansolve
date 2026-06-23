'use client';
// Responsive hero animation slot.
// - Tablet / desktop (md and up): the 16:9 landscape walkthrough.
// - Phones (below md = 768px): the 9:16 portrait walkthrough.
//
// Both are always mounted, but each EmbedStage only runs its animation loop
// while it is actually visible on screen (IntersectionObserver inside
// EmbedStage). A `display:none` element never reports as intersecting, so the
// hidden variant stays idle — a phone never runs the desktop animation, and
// vice-versa.
import { ScanSolveLandscape } from './ScanSolveLandscape';
import { ScanSolvePortrait } from './ScanSolvePortrait';

const frame: React.CSSProperties = {
  overflow: 'hidden',
  border: '1px solid #ece9fb',
  boxShadow: '0 30px 60px -22px rgba(40,30,90,0.28)',
  background: '#EFEFFA',
};

export function HeroAnimation() {
  return (
    <div style={{ marginTop: 56 }}>
      {/* desktop / tablet */}
      <div className="hidden md:block" style={{ ...frame, borderRadius: 18, maxWidth: 820, margin: '0 auto' }}>
        <ScanSolveLandscape />
      </div>
      {/* phone */}
      <div className="block md:hidden" style={{ ...frame, borderRadius: 24, width: 340, maxWidth: '100%', margin: '0 auto' }}>
        <ScanSolvePortrait />
      </div>
    </div>
  );
}
