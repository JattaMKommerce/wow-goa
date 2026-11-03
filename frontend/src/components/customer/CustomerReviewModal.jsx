import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import * as api from '../../services/api';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

export default function CustomerReviewModal({
  booking,
  customerUser,
  isOpen,
  onClose,
  onSuccess
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRating, setSubmittedRating] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(Boolean(booking?.has_reviewed));
  const [existingRating, setExistingRating] = useState(booking?.review_rating || null);

  const bookingId = booking ? (booking.id || booking.booking_id) : null;
  const serviceName = booking ? (booking.item_name || booking.vehicle_name || booking.package_name || booking.hotel_name || 'WOW GOA Experience') : '';

  // Authoritatively verify review status with backend on modal mount
  React.useEffect(() => {
    if (!bookingId) return;

    if (booking?.has_reviewed) {
      setAlreadyReviewed(true);
      setExistingRating(booking.review_rating || 5);
      if (onSuccess) onSuccess(bookingId, booking.review_rating);
      return;
    }

    let isMounted = true;
    api.checkBookingReviewStatus(bookingId).then((res) => {
      if (isMounted && res && res.has_reviewed) {
        setAlreadyReviewed(true);
        const rVal = res.review?.rating || 5;
        setExistingRating(rVal);
        if (onSuccess) onSuccess(bookingId, rVal);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [bookingId, booking?.has_reviewed, onSuccess]);

  if (!isOpen || !booking) return null;

  const currentActiveRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        booking_id: bookingId,
        rating: rating,
        review_text: reviewText.trim(),
        customer_phone: customerUser?.phone || booking.phone || '',
        customer_email: customerUser?.email || booking.email || '',
        customer_name: customerUser?.name || booking.name || 'Verified Customer'
      };

      const res = await api.submitCustomerReview(payload);
      if (res && res.success) {
        setSubmittedRating(rating);
        setIsSuccess(true);
        // Authoritatively notify parent that review was successfully submitted
        if (onSuccess) {
          onSuccess(bookingId, rating);
        }
      } else {
        const errMsg = res?.error || 'Failed to submit review.';
        setError(errMsg);
        if (errMsg.toLowerCase().includes('already been submitted') || errMsg.toLowerCase().includes('multiple reviews')) {
          setAlreadyReviewed(true);
          if (onSuccess) {
            onSuccess(bookingId, null);
          }
        }
      }
    } catch (err) {
      const errStr = err.message || 'Error submitting review. Please try again.';
      setError(errStr);
      if (errStr.toLowerCase().includes('already been submitted') || errStr.toLowerCase().includes('multiple reviews')) {
        setAlreadyReviewed(true);
        if (onSuccess) {
          onSuccess(bookingId, null);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueSuccess = () => {
    if (onSuccess) {
      onSuccess(bookingId, submittedRating);
    }
    if (onClose) {
      onClose('success_completed');
    }
  };

  return createPortal(
    <div
      className="modal fade show d-block"
      style={{
        backgroundColor: 'rgba(13, 27, 46, 0.78)',
        zIndex: 1070,
        backdropFilter: 'blur(4px)',
        overflowY: 'auto'
      }}
      onClick={() => !submitting && onClose && onClose('dismissed')}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: '480px', margin: '1.75rem auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden" style={{ background: '#FFFFFF' }}>
          
          {/* Header */}
          <div
            className="modal-header py-3.5 px-4 text-white position-relative"
            style={{
              background: 'linear-gradient(135deg, #0D1B2E 0%, #172A45 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-warning"
                style={{ width: '36px', height: '36px', background: 'rgba(255, 184, 0, 0.15)' }}
              >
                <Star size={20} fill="#FFB800" stroke="#FFB800" />
              </div>
              <div>
                <h6 className="modal-title fw-bold mb-0 text-white" style={{ fontSize: '15px', letterSpacing: '-0.2px' }}>
                  {isSuccess ? 'Thank You for Your Feedback! 🌟' : alreadyReviewed ? 'Review Already Submitted' : 'How was your experience?'}
                </h6>
                <div className="text-white-50" style={{ fontSize: '11.5px' }}>
                  Booking #{bookingId} • {serviceName}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => !submitting && onClose && onClose(isSuccess ? 'success_completed' : 'dismissed')}
              disabled={submitting}
              aria-label="Close"
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 text-start">
            {isSuccess ? (
              /* Success View */
              <div className="text-center py-2 animate-fade-in">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                  style={{
                    width: '68px',
                    height: '68px',
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    color: '#059669',
                    border: '2px solid #A7F3D0'
                  }}
                >
                  <CheckCircle2 size={38} />
                </div>
                
                <h5 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '20px' }}>
                  Thank You for Your Feedback! 🌟
                </h5>
                <p className="fw-bold mb-2" style={{ color: '#EA580C', fontSize: '14px' }}>
                  We truly appreciate you taking the time to review your journey.
                </p>
                <p className="text-secondary small mb-3 px-1" style={{ lineHeight: '1.6', fontSize: '13px' }}>
                  {submittedRating >= 4 ? (
                    <>
                      We are thrilled to know that you had a wonderful holiday experience with <strong>WOW GOA</strong>. Your valuable review helps fellow travelers discover the magic of Goa and inspires our team to continuously elevate our luxury services!
                    </>
                  ) : (
                    <>
                      Thank you for sharing your candid feedback with <strong>WOW GOA</strong>. We deeply value your honesty and will use your input to refine our hospitality standards and ensure future journeys exceed expectations.
                    </>
                  )}
                </p>

                {/* Dynamically matching submitted star rating */}
                <div
                  className="p-3 rounded-4 mb-3 d-inline-flex flex-column align-items-center justify-content-center w-100"
                  style={{
                    background: 'linear-gradient(135deg, #FFFDF8 0%, #FFF8EE 100%)',
                    border: '1.5px solid #FDE68A',
                    boxShadow: '0 4px 14px rgba(251, 191, 36, 0.12)'
                  }}
                >
                  <span className="text-muted text-xs text-uppercase fw-bold mb-1" style={{ letterSpacing: '0.8px' }}>
                    Verified Rating • {serviceName}
                  </span>
                  <div className="d-flex align-items-center justify-content-center gap-1.5 my-1">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        size={24}
                        fill={starIdx <= submittedRating ? '#F59E0B' : 'none'}
                        stroke={starIdx <= submittedRating ? '#F59E0B' : '#CBD5E1'}
                        strokeWidth={starIdx <= submittedRating ? 0 : 1.5}
                        style={{ filter: starIdx <= submittedRating ? 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.35))' : 'none' }}
                      />
                    ))}
                  </div>
                  <span className="fw-black text-xs mt-1" style={{ color: '#92400E' }}>
                    {submittedRating} / 5 Stars — {RATING_LABELS[submittedRating] || `${submittedRating} Stars`}
                  </span>
                </div>

                <div className="text-center text-muted mb-3" style={{ fontSize: '12px' }}>
                  🌴 <em>We look forward to welcoming you back on your next Goa holiday!</em>
                </div>

                <div>
                  <button
                    type="button"
                    className="btn w-100 py-2.5 rounded-pill fw-bold text-white shadow-sm"
                    style={{
                      background: 'linear-gradient(135deg, #0D1B2E 0%, #1A2F4C 100%)',
                      border: 'none',
                      fontSize: '14px',
                      letterSpacing: '0.2px'
                    }}
                    onClick={handleContinueSuccess}
                  >
                    Done — Back to Dashboard
                  </button>
                </div>
              </div>
            ) : alreadyReviewed ? (
              /* Already Reviewed Notice View */
              <div className="text-center py-2">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '60px', height: '60px', background: 'rgba(255, 184, 0, 0.12)', color: '#D97706' }}
                >
                  <Star size={32} fill="#D97706" stroke="#D97706" />
                </div>
                
                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '17px' }}>
                  Review Already Submitted
                </h5>
                <p className="text-muted small mb-3" style={{ lineHeight: '1.5' }}>
                  A review for this booking has already been submitted. Multiple reviews are not permitted.
                </p>

                {existingRating && (
                  <div
                    className="p-2.5 rounded-3 mb-4 d-inline-flex flex-column align-items-center justify-content-center"
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', minWidth: '180px' }}
                  >
                    <span className="text-muted text-xs text-uppercase fw-semibold mb-1">
                      Submitted Rating
                    </span>
                    <div className="d-flex align-items-center justify-content-center gap-1 my-0.5">
                      {[1, 2, 3, 4, 5].map((starIdx) => (
                        <Star
                          key={starIdx}
                          size={18}
                          fill={starIdx <= existingRating ? '#FFB800' : 'none'}
                          stroke={starIdx <= existingRating ? '#FFB800' : '#CBD5E1'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="button"
                    className="btn w-100 py-2.5 rounded-3 fw-bold text-white shadow-sm"
                    style={{ background: '#0D1B2E', border: 'none', fontSize: '14px' }}
                    onClick={() => onClose && onClose('already_reviewed')}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Review Form View */
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger py-2 px-3 rounded-3 d-flex align-items-center gap-2 mb-3" style={{ fontSize: '12.5px' }}>
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <p className="text-muted small mb-3">
                    Tap a star to rate your completed booking for <strong>{serviceName}</strong>.
                  </p>

                  {/* 1 to 5 Star Rating Selector */}
                  <div
                    className="d-flex align-items-center justify-content-center gap-2 py-2"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((s) => {
                      const isFilled = s <= currentActiveRating;
                      return (
                        <button
                          key={s}
                          type="button"
                          className="btn p-1 border-0 bg-transparent"
                          style={{
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => !submitting && setRating(s)}
                          onMouseEnter={() => !submitting && setHoverRating(s)}
                          title={`${s} Star - ${RATING_LABELS[s]}`}
                        >
                          <Star
                            size={32}
                            fill={isFilled ? '#FFB800' : 'none'}
                            stroke={isFilled ? '#FFB800' : '#CBD5E1'}
                            strokeWidth={isFilled ? 0 : 1.5}
                          />
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Rating Indicator Label */}
                  <div style={{ minHeight: '22px' }}>
                    {currentActiveRating > 0 ? (
                      <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ background: '#FFF7ED', color: '#EA580C', fontSize: '12px' }}>
                        {currentActiveRating} Star{currentActiveRating > 1 ? 's' : ''} — {RATING_LABELS[currentActiveRating]}
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        Select your rating
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Review Textarea */}
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark d-flex align-items-center justify-content-between mb-1.5" style={{ fontSize: '13px' }}>
                    <span className="d-flex align-items-center gap-1.5">
                      <MessageSquare size={14} className="text-muted" />
                      Write your review
                    </span>
                    <span className="text-muted fw-normal" style={{ fontSize: '11px' }}>(Optional)</span>
                  </label>
                  <textarea
                    className="form-control rounded-3 border"
                    rows="3"
                    placeholder="Tell us about the vehicle condition, service quality, or travel experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    disabled={submitting}
                    maxLength="1000"
                    style={{ fontSize: '13px', resize: 'vertical' }}
                  />
                  <div className="text-end text-muted mt-1" style={{ fontSize: '10.5px' }}>
                    {reviewText.length}/1000
                  </div>
                </div>

                {/* Buttons: [Submit Review] [Maybe Later] */}
                <div className="d-flex align-items-center gap-2 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-light flex-fill py-2.5 rounded-3 fw-semibold text-secondary"
                    onClick={() => !submitting && onClose && onClose('maybe_later')}
                    disabled={submitting}
                    style={{ fontSize: '13.5px' }}
                  >
                    Maybe Later
                  </button>

                  <button
                    type="submit"
                    className="btn flex-fill py-2.5 rounded-3 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-1.5"
                    disabled={submitting || rating === 0}
                    style={{
                      background: rating === 0 ? '#94A3B8' : 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
                      border: 'none',
                      fontSize: '13.5px',
                      cursor: rating === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Review</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
