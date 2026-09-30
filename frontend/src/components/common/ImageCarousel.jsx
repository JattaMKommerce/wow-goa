import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Maximize2, Layers } from 'lucide-react';

/**
 * Reusable ImageCarousel with Thumbnail Selectors and Lightbox Modal
 * Matches the Bike Rental / Vehicle Preview UI in TripGalileo.
 */
export default function ImageCarousel({
  images = [],
  alt = 'Preview',
  height = '380px',
  rounded = '16px',
  className = '',
  fallbackImage = ''
}) {
  // 1. Normalize image input (handles Array, JSON string, comma-separated, or single URL)
  const normalizedImages = useMemo(() => {
    let list = [];
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) list = parsed;
        else if (parsed) list = [parsed];
      } catch {
        list = images.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(images)) {
      list = images;
    }

    const cleaned = list
      .map(item => {
        if (!item) return null;
        if (typeof item === 'string') return item.trim();
        if (typeof item === 'object') return item.url || item.src || item.image || null;
        return null;
      })
      .filter(Boolean);

    return cleaned.length > 0
      ? Array.from(new Set(cleaned))
      : [fallbackImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80'];
  }, [images, fallbackImage]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  // Sync activeIdx if images list changes
  useEffect(() => {
    if (activeIdx >= normalizedImages.length) {
      setActiveIdx(0);
    }
  }, [normalizedImages, activeIdx]);

  const prevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  }, [normalizedImages.length]);

  const nextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % normalizedImages.length);
  }, [normalizedImages.length]);

  const prevLightbox = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightboxIdx((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
  }, [normalizedImages.length]);

  const nextLightbox = useCallback((e) => {
    if (e) e.stopPropagation();
    setLightboxIdx((prev) => (prev + 1) % normalizedImages.length);
  }, [normalizedImages.length]);

  const openLightbox = useCallback((index) => {
    setLightboxIdx(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxOpen, closeLightbox, prevLightbox, nextLightbox]);

  const total = normalizedImages.length;
  const currentMainImage = normalizedImages[activeIdx] || normalizedImages[0];

  return (
    <div className={`package-image-carousel ${className}`} style={{ width: '100%' }}>
      {/* ─── MAIN HERO IMAGE CONTAINER ─── */}
      <div
        onClick={() => openLightbox(activeIdx)}
        style={{
          position: 'relative',
          width: '100%',
          height: height,
          borderRadius: rounded,
          overflow: 'hidden',
          backgroundColor: '#0f172a',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}
      >
        <img
          src={currentMainImage}
          alt={`${alt} - Photo ${activeIdx + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'opacity 0.25s ease, transform 0.3s ease'
          }}
          onError={(e) => {
            e.currentTarget.src = fallbackImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80';
          }}
        />

        {/* Subtle Gradient Shadow Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%, rgba(0,0,0,0.2) 100%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top-Right: Fullscreen / Expand Button */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 6 }}>
          <button
            type="button"
            aria-label="View Fullscreen"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(activeIdx);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(6px)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#00B8D9'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.75)'; }}
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Bottom-Right: Photo Counter Badge */}
        {total > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              zIndex: 6,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Layers size={13} color="#00B8D9" />
            <span>{activeIdx + 1} / {total}</span>
          </div>
        )}

        {/* Left and Right Overlay Navigation Buttons */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(13, 27, 46, 0.85)',
                color: '#ffffff',
                border: '1.5px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.backgroundColor = '#00B8D9'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(13, 27, 46, 0.85)'; }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            <button
              type="button"
              aria-label="Next photo"
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(13, 27, 46, 0.85)',
                color: '#ffffff',
                border: '1.5px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; e.currentTarget.style.backgroundColor = '#00B8D9'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.backgroundColor = 'rgba(13, 27, 46, 0.85)'; }}
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {/* ─── HORIZONTAL THUMBNAIL STRIP ─── */}
      {total > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            padding: '10px 2px 2px 2px',
            scrollbarWidth: 'thin',
            msOverflowStyle: 'none'
          }}
        >
          {normalizedImages.map((img, i) => {
            const isActive = activeIdx === i;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Select photo ${i + 1}`}
                onClick={() => setActiveIdx(i)}
                style={{
                  flexShrink: 0,
                  width: '64px',
                  height: '46px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  padding: 0,
                  border: isActive ? '2.5px solid #00B8D9' : '2px solid transparent',
                  opacity: isActive ? 1 : 0.65,
                  boxShadow: isActive ? '0 0 0 3px rgba(0,184,217,0.35)' : '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  backgroundColor: '#0f172a',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <img
                  src={img}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ─── FULLSCREEN LIGHTBOX MODAL ─── */}
      {lightboxOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 12, 24, 0.94)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backdropFilter: 'blur(12px)'
          }}
        >
          {/* Lightbox Modal Card Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '960px',
              maxHeight: '92vh',
              backgroundColor: '#0D1B2E',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflow: 'hidden'
            }}
          >
            {/* Topbar Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '15px' }}>
                  {lightboxIdx + 1} / {total}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: '500' }}>
                  {alt}
                </span>
              </div>
              <button
                type="button"
                aria-label="Close Lightbox"
                onClick={closeLightbox}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FF6333';
                  e.currentTarget.style.borderColor = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Main Image Stage with Prominent Visible Arrow Buttons */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                flexGrow: 1,
                minHeight: '280px',
                maxHeight: '62vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: '#070f1a'
              }}
            >
              <img
                src={normalizedImages[lightboxIdx] || normalizedImages[0]}
                alt={`${alt} - Zoom ${lightboxIdx + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '62vh',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  userSelect: 'none'
                }}
                onError={(e) => {
                  e.currentTarget.src = fallbackImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80';
                }}
              />

              {/* Navigation Left Arrow Button */}
              {total > 1 && (
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={prevLightbox}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(13, 27, 46, 0.9)',
                    color: '#ffffff',
                    border: '2px solid rgba(255, 255, 255, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#00B8D9';
                    e.currentTarget.style.borderColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(13, 27, 46, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronLeft size={28} strokeWidth={2.8} />
                </button>
              )}

              {/* Navigation Right Arrow Button */}
              {total > 1 && (
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={nextLightbox}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(13, 27, 46, 0.9)',
                    color: '#ffffff',
                    border: '2px solid rgba(255, 255, 255, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#00B8D9';
                    e.currentTarget.style.borderColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(13, 27, 46, 0.9)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <ChevronRight size={28} strokeWidth={2.8} />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails Rail */}
            {total > 1 && (
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '4px 0',
                  flexShrink: 0
                }}
              >
                {normalizedImages.map((img, i) => {
                  const isActive = lightboxIdx === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => setLightboxIdx(i)}
                      style={{
                        width: '68px',
                        height: '46px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        padding: 0,
                        border: isActive ? '2.5px solid #00B8D9' : '1.5px solid rgba(255,255,255,0.2)',
                        opacity: isActive ? 1 : 0.5,
                        boxShadow: isActive ? '0 0 0 3px rgba(0,184,217,0.45)' : 'none',
                        cursor: 'pointer',
                        background: '#070f1a',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = fallbackImage || 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
