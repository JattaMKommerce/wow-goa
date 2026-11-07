import { Suspense, use } from 'react';

/**
 * Load a page's code only when it is first shown (code splitting).
 *
 * Differences from plain React.lazy:
 *  - `.preload()` fetches the code in advance (e.g. when the browser is idle),
 *    and once loaded the page renders instantly with no loading flash.
 *  - Each page has its own small Suspense boundary, so only the page area shows
 *    a spinner while loading — the navbar and the rest of the site stay put.
 *  - The component tree shape never changes, so page state is never reset.
 */
export function lazyPage(loader) {
  let Component = null;
  let promise = null;

  const load = () => {
    if (!promise) {
      promise = loader().then(
        (mod) => { Component = mod.default; return mod; },
        (err) => { promise = null; throw err; } // allow retry after a network error
      );
    }
    return promise;
  };

  function Inner(props) {
    if (!Component) use(load());
    return <Component {...props} />;
  }

  function LazyPage(props) {
    return (
      <Suspense fallback={<PageLoading />}>
        <Inner {...props} />
      </Suspense>
    );
  }

  LazyPage.preload = load;
  return LazyPage;
}

/** Preload several lazy pages when the browser is idle (skipped on Save-Data). */
export function preloadWhenIdle(pages) {
  if (typeof window === 'undefined') return;
  const conn = navigator.connection || {};
  if (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return;
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
  let i = 0;
  const next = () => {
    if (i >= pages.length) return;
    const p = pages[i++];
    Promise.resolve(p.preload()).catch(() => {}).finally(() => idle(next, { timeout: 4000 }));
  };
  idle(next, { timeout: 4000 });
}

function PageLoading() {
  return (
    <div
      className="d-flex align-items-center justify-content-center w-100"
      style={{ minHeight: '50vh' }}
      role="status"
      aria-live="polite"
    >
      <div className="spinner-border text-warning" style={{ width: '2.25rem', height: '2.25rem' }}>
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  );
}
