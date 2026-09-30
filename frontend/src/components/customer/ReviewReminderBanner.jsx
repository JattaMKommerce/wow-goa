import React from 'react';
import { Star, X, ChevronRight } from 'lucide-react';

export default function ReviewReminderBanner({
  booking,
  onRateNow,
  onDismiss
}) {
  if (!booking) return null;

  const bookingId = booking.id || booking.booking_id;
  const serviceName = booking.item_name || booking.vehicle_name || booking.package_name || booking.hotel_name || 'Completed Trip';

  return (
    <div
      className="alert alert-dismissible fade show rounded-4 shadow-sm mb-4 p-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
      style={{
        background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF3E8 100%)',
        border: '1px solid #FED7AA',
        color: '#7C2D12'
      }}
      role="alert"
    >
      <div className="d-flex align-items-center gap-3">
        <div
          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{ width: '42px', height: '42px', background: '#FFEDD5', color: '#EA580C' }}
        >
          <Star size={22} fill="#EA580C" stroke="#EA580C" />
        </div>
        <div>
          <h6 className="fw-bold mb-0.5" style={{ fontSize: '14.5px', color: '#7C2D12' }}>
            How was your experience?
          </h6>
          <p className="mb-0 text-muted" style={{ fontSize: '12.5px' }}>
            You haven't reviewed your completed booking yet ({serviceName} • #{bookingId}).
          </p>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto ms-sm-0">
        <button
          type="button"
          className="btn btn-sm px-3 py-1.5 rounded-pill fw-semibold text-secondary"
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            fontSize: '12.5px'
          }}
          onClick={() => onDismiss && onDismiss(bookingId, 'maybe_later')}
          title="Maybe Later"
        >
          Maybe Later
        </button>

        <button
          type="button"
          className="btn btn-sm px-3.5 py-2 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center gap-1.5"
          style={{
            background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)',
            border: 'none',
            fontSize: '12.5px'
          }}
          onClick={() => onRateNow && onRateNow(booking)}
        >
          <span>Rate Now</span>
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          className="btn btn-sm btn-link text-muted p-1"
          onClick={() => onDismiss && onDismiss(bookingId, 'close')}
          title="Dismiss reminder"
          aria-label="Dismiss reminder"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
