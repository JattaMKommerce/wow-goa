/**
 * Global Scroll Lock Utility (scrollLock.js)
 * 
 * Provides robust, cross-platform scroll locking for overlays (modals, drawers, lightboxes):
 * 1. Freezes background page completely (both <body> and <html>)
 * 2. Preserves exact page scroll position without jumping
 * 3. Prevents layout shift from disappearing scrollbars
 * 4. Uses reference-counted lock stack so multiple overlays (e.g. modal + chatbot) do not conflict
 * 5. Cleanly restores previous scroll position and styles upon all overlays closing
 * 6. Non-passive wheel and touchmove containment to prevent background leakage
 */

const activeLocks = new Map();
let savedScrollY = 0;
let savedScrollX = 0;
let previousBodyStyles = null;
let previousHtmlStyles = null;
let isCurrentlyLocked = false;

// Event listeners to completely isolate wheel/touch outside scrollable overlay containers
function handleWindowWheel(e) {
  if (!isCurrentlyLocked) return;
  const target = e.target;
  if (!target || typeof target.closest !== 'function') return;

  // If the wheel event is inside an active scrollable container, permit normal scrolling
  const scrollable = target.closest(
    '.checkout-body, .modal-body, .activity-modal-body, .overflow-y-auto, .overflow-auto, .ai-chatbot-body, .custom-scrollbar, [data-scrollable="true"], .modal-dialog-scrollable .modal-content, .modal-voucher-scroll-body, .custom-voucher-scrollbar, .voucher-modal-backdrop, .booking-voucher-document'
  );

  if (!scrollable) {
    if (e.cancelable) e.preventDefault();
  }
}

function handleWindowTouch(e) {
  if (!isCurrentlyLocked) return;
  const target = e.target;
  if (!target || typeof target.closest !== 'function') return;

  // If the touch event is inside an active scrollable container, permit normal scrolling
  const scrollable = target.closest(
    '.checkout-body, .modal-body, .activity-modal-body, .overflow-y-auto, .overflow-auto, .ai-chatbot-body, .custom-scrollbar, [data-scrollable="true"], .modal-dialog-scrollable .modal-content, .modal-voucher-scroll-body, .custom-voucher-scrollbar, .voucher-modal-backdrop, .booking-voucher-document'
  );

  if (!scrollable) {
    if (e.cancelable) e.preventDefault();
  }
}

export function lockScroll(lockId = 'overlay') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const currentCount = activeLocks.get(lockId) || 0;
  activeLocks.set(lockId, currentCount + 1);

  // Apply lock on first active overlay
  if (!isCurrentlyLocked) {
    isCurrentlyLocked = true;

    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    savedScrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      width: document.body.style.width,
      height: document.body.style.height,
      overflow: document.body.style.overflow,
      overscrollBehavior: document.body.style.overscrollBehavior,
      paddingRight: document.body.style.paddingRight,
    };

    previousHtmlStyles = {
      overflow: document.documentElement.style.overflow,
      overscrollBehavior: document.documentElement.style.overscrollBehavior,
      height: document.documentElement.style.height,
    };

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.height = '100%';

    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = `-${savedScrollX}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.classList.add('tg-scroll-locked');
    document.documentElement.classList.add('tg-scroll-locked');

    // Attach listeners with passive: false to prevent background movement
    window.addEventListener('wheel', handleWindowWheel, { passive: false });
    window.addEventListener('touchmove', handleWindowTouch, { passive: false });
  }
}

export function unlockScroll(lockId = 'overlay') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const currentCount = activeLocks.get(lockId) || 0;
  if (currentCount <= 1) {
    activeLocks.delete(lockId);
  } else {
    activeLocks.set(lockId, currentCount - 1);
  }

  // Only restore when all overlays have closed
  if (activeLocks.size === 0 && isCurrentlyLocked) {
    isCurrentlyLocked = false;
    const restoreY = savedScrollY;
    const restoreX = savedScrollX;

    window.removeEventListener('wheel', handleWindowWheel);
    window.removeEventListener('touchmove', handleWindowTouch);

    if (previousBodyStyles) {
      document.body.style.position = previousBodyStyles.position || '';
      document.body.style.top = previousBodyStyles.top || '';
      document.body.style.left = previousBodyStyles.left || '';
      document.body.style.width = previousBodyStyles.width || '';
      document.body.style.height = previousBodyStyles.height || '';
      document.body.style.overflow = previousBodyStyles.overflow || '';
      document.body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior || '';
      document.body.style.paddingRight = previousBodyStyles.paddingRight || '';
      previousBodyStyles = null;
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
      document.body.style.paddingRight = '';
    }

    if (previousHtmlStyles) {
      document.documentElement.style.overflow = previousHtmlStyles.overflow || '';
      document.documentElement.style.overscrollBehavior = previousHtmlStyles.overscrollBehavior || '';
      document.documentElement.style.height = previousHtmlStyles.height || '';
      previousHtmlStyles = null;
    } else {
      document.documentElement.style.overflow = '';
      document.documentElement.style.overscrollBehavior = '';
      document.documentElement.style.height = '';
    }

    document.body.classList.remove('tg-scroll-locked');
    document.documentElement.classList.remove('tg-scroll-locked');

    // Instantly restore exact pixel scroll position
    window.scrollTo(restoreX, restoreY);
  }
}

/**
 * React hook to automatically manage scroll locking for a component lifecycle
 */
export function useScrollLock(isLocked = true, lockId = 'overlay') {
  const React = window.React || (typeof require !== 'undefined' ? require('react') : null);
  if (!React || !React.useEffect) return;

  React.useEffect(() => {
    if (!isLocked) return;
    lockScroll(lockId);
    return () => {
      unlockScroll(lockId);
    };
  }, [isLocked, lockId]);
}
