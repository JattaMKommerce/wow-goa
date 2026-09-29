import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Quote, Sparkles } from 'lucide-react';
import * as api from '../../services/api';

export default function CustomerReviewsSection({ className = '' }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.fetchPublicReviews()
      .then(res => {
        if (!isMounted) return;
        // Strictly guarantee sort order: 5-Star first, then 4, 3, 2, 1
        const list = Array.isArray(res) ? [...res] : [];
        list.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        setReviews(list);
      })
      .catch(err => {
        console.warn('[CustomerReviewsSection] Failed to load public reviews:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Format date cleanly
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  if (!loading && reviews.length === 0) {
    return null; // Clean fallback if no reviews in DB
  }

  return (
    <section className={`py-5 ${className}`} style={{ background: '#F8FAFC' }}>
      <div className="container px-3 px-md-4">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-5">
          <div
            className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill mb-2 fw-bold text-xs"
            style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FFEDD5' }}
          >
            <Sparkles size={13} />
            <span>Verified Customer Experiences</span>
          </div>

          <h2 className="fw-black text-dark mb-2 font-heading" style={{ fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
            What Travelers Say About WOW GOA
          </h2>
          <p className="text-muted small mb-0" style={{ maxWidth: '540px', margin: '0 auto' }}>
            Genuine ratings and reviews from customers who explored Goa with our self-drive fleet, holiday packages, and stays.
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="row g-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white placeholder-glow">
                  <div className="d-flex gap-1 mb-3">
                    <span className="placeholder col-4 py-2 rounded"></span>
                  </div>
                  <p className="placeholder col-12 mb-2"></p>
                  <p className="placeholder col-8 mb-4"></p>
                  <div className="d-flex align-items-center gap-2 mt-auto">
                    <div className="placeholder rounded-circle" style={{ width: 36, height: 36 }}></div>
                    <span className="placeholder col-6"></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Strictly Ordered Reviews Grid (5★ -> 4★ -> 3★ -> 2★ -> 1★) */
          <div className="row g-3 g-md-4">
            {reviews.map(rev => (
              <div key={rev.id || rev.booking_id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card border-0 rounded-4 p-4 h-100 d-flex flex-column justify-content-between shadow-sm position-relative overflow-hidden"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="mb-3">
                    {/* Stars and Service Tag */}
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-2.5">
                      <div className="d-flex align-items-center gap-1" title={`${rev.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map(starIdx => (
                          <Star
                            key={starIdx}
                            size={16}
                            fill={starIdx <= rev.rating ? '#FFB800' : 'none'}
                            stroke={starIdx <= rev.rating ? '#FFB800' : '#E2E8F0'}
                            strokeWidth={starIdx <= rev.rating ? 0 : 1.5}
                          />
                        ))}
                      </div>

                      <span
                        className="badge text-truncate fw-semibold px-2 py-1 rounded"
                        style={{
                          background: '#F1F5F9',
                          color: '#475569',
                          fontSize: '11px',
                          maxWidth: '150px'
                        }}
                        title={rev.service_name}
                      >
                        {rev.service_name}
                      </span>
                    </div>

                    {/* Review Comment */}
                    {rev.review_text ? (
                      <p
                        className="text-dark small mb-0"
                        style={{
                          fontSize: '13px',
                          lineHeight: '1.6',
                          color: '#334155'
                        }}
                      >
                        "{rev.review_text}"
                      </p>
                    ) : (
                      <p className="text-muted fst-italic small mb-0" style={{ fontSize: '12.5px' }}>
                        Rated {rev.rating} out of 5 stars for this trip.
                      </p>
                    )}
                  </div>

                  {/* Customer Information Footer (Privacy Compliant) */}
                  <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-auto" style={{ borderColor: '#F1F5F9' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{
                          width: '34px',
                          height: '34px',
                          background: 'linear-gradient(135deg, #0D1B2E 0%, #2563EB 100%)',
                          fontSize: '12.5px'
                        }}
                      >
                        {(rev.customer_name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-1">
                          <span className="fw-bold text-dark text-xs" style={{ fontSize: '13px' }}>
                            {rev.customer_name}
                          </span>
                          <span title="Verified Customer">
                            <ShieldCheck size={14} className="text-success" />
                          </span>
                        </div>
                        <span className="text-muted d-block text-xxs" style={{ fontSize: '11px' }}>
                          Verified Booking
                        </span>
                      </div>
                    </div>

                    {rev.created_at && (
                      <span className="text-muted text-xxs" style={{ fontSize: '11px' }}>
                        {formatDate(rev.created_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
