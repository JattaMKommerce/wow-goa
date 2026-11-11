import { useEffect, useState } from 'react';

// The brand intro (index.html) covers the home page for a few seconds while the site loads.
// Heavy extras such as background videos should wait until it has gone, so the intro plays smoothly.

export function isIntroDone() {
  if (typeof window === 'undefined') return true;
  if (window.__WG_INTRO_DONE__) return true;
  // No intro on this visit (other pages, app, ?nointro, reduced motion ...) or it is already fading out.
  return !document.documentElement.classList.contains('wg-intro');
}

// Returns true once the intro has finished (immediately if there is none),
// optionally waiting an extra delayMs afterwards.
export function useIntroDone(delayMs = 0) {
  const [done, setDone] = useState(() => delayMs === 0 && isIntroDone());

  useEffect(() => {
    if (done) return undefined;
    let timer;
    const finish = () => {
      window.removeEventListener('wg-intro-done', finish);
      clearTimeout(safety);
      timer = setTimeout(() => setDone(true), delayMs);
    };
    // Never wait forever, even if the intro script did not run.
    const safety = setTimeout(finish, 25000);
    if (isIntroDone()) finish();
    else window.addEventListener('wg-intro-done', finish);
    return () => {
      window.removeEventListener('wg-intro-done', finish);
      clearTimeout(safety);
      clearTimeout(timer);
    };
  }, [done, delayMs]);

  return done;
}
