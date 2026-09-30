import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

/**
 * B2BModalPortal:
 * Renders B2B booking and detail modals directly into document.body using React Portal.
 * 
 * While open:
 * 1. Visually and interactively hides the B2B sidebar, header, and underlying page.
 * 2. Applies `inert` and `aria-hidden` to `.b2b-portal-shell` so clicks and keyboard focus cannot escape to the background.
 * 3. Prevents background page scrolling via global lockScroll with position preservation.
 * 4. Displays a backdrop with blur and deep contrast so no background elements are recognizable.
 * 5. Provides internal scrolling for the modal dialog.
 * 
 * On close:
 * Completely restores the sidebar, header, main content, and background scrolling without page reload or state loss.
 */
export default function B2BModalPortal({
  isOpen,
  onClose,
  children,
  zIndex = 99999,
  className = '',
  overlayStyle = {},
  ariaLabel = 'B2B Modal',
  closeOnBackdrop = false,
  isFullScreen = false
}) {
  const portalIdRef = useRef(`b2b-modal-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (!isOpen) return;

    const lockId = portalIdRef.current;

    // 1. Add modal-active classes to body
    document.body.classList.add('b2b-modal-active');
    
    // 2. Hide and inert the B2B Portal Shell
    const shell = document.querySelector('.b2b-portal-shell');
    if (shell) {
      shell.classList.add('b2b-shell-inert');
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-hidden', 'true');
    }

    // 3. Lock background scroll via standard scrollLock utility
    lockScroll(lockId);

    // 4. Handle Escape key to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore portal to normal state
    return () => {
      document.body.classList.remove('b2b-modal-active');
      unlockScroll(lockId);
      window.removeEventListener('keydown', handleKeyDown);

      const shellEl = document.querySelector('.b2b-portal-shell');
      if (shellEl) {
        shellEl.classList.remove('b2b-shell-inert');
        shellEl.removeAttribute('inert');
        shellEl.removeAttribute('aria-hidden');
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const defaultOverlayStyle = isFullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        height: '100dvh',
        background: '#ffffff',
        padding: 0,
        display: 'block',
        overflowY: 'auto'
      }
    : {};

  return createPortal(
    <div
      className={`b2b-modal-portal-overlay ${isFullScreen ? 'b2b-modal-fullscreen' : ''} ${className}`}
      style={{ zIndex, ...defaultOverlayStyle, ...overlayStyle }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {children}
    </div>,
    document.body
  );
}

