import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar, Car, X, Phone, Mail, 
  MapPin, Clock, Eye, RotateCcw, ChevronDown 
} from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const currentYear = new Date().getFullYear();
const startYear = 2020;
const endYear = Math.max(2035, currentYear + 5);
const YEARS = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function VehicleFleetCalendar({ cars = [], bikes = [], bookings = [] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Active highlighted / selected date (defaults to today's date)
  const [selectedDate, setSelectedDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate()
  });

  // States matching Admin Portal Availability Calendar
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [viewBookingModal, setViewBookingModal] = useState(null);
  const dayDetailsRef = useRef(null);

  // Date picker calendar popover state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  const [pickerMonth, setPickerMonth] = useState(viewMonth);
  const [pickerYear, setPickerYear] = useState(viewYear);

  const allVehicles = [
    ...(cars || []).map(c => ({ ...c, type: 'car' })),
    ...(bikes || []).map(b => ({ ...b, type: 'bike' }))
  ];

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyBefore = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
      setPickerMonth(11);
      setPickerYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
      setPickerMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
      setPickerMonth(0);
      setPickerYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
      setPickerMonth(m => m + 1);
    }
  };

  const getVehicleCategory = (b) => {
    if (!b) return 'car';
    if (b.type === 'bike') return 'bike';
    const name = (b.item_name || b.vehicle_name || '').toLowerCase();
    if (
      name.includes('bullet') || name.includes('ninja') || name.includes('activa') || 
      name.includes('gt') || name.includes('bike') || name.includes('classic') || 
      name.includes('reborn') || name.includes('himalayan') || name.includes('scooter') || 
      name.includes('access')
    ) {
      return 'bike';
    }
    return 'car';
  };

  // Filter real bookings for a specific day in viewMonth & viewYear
  const getBookingsForDay = (day, yr = viewYear, mo = viewMonth) => {
    const checkDateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDate = new Date(yr, mo, day);

    return (bookings || []).filter(b => {
      if (b.status === 'Cancelled') return false;

      // Match selected vehicle
      if (selectedVehicle !== 'all') {
        const vehicleMatch = (b.item_name && b.item_name.toLowerCase().includes(selectedVehicle.toLowerCase())) ||
                             (b.vehicle_name && b.vehicle_name.toLowerCase().includes(selectedVehicle.toLowerCase())) ||
                             String(b.item_id) === String(selectedVehicle);
        if (!vehicleMatch) return false;
      }

      const pStr = b.pickup_date ? b.pickup_date.slice(0, 10) : '';
      const dStr = b.drop_date ? b.drop_date.slice(0, 10) : (b.return_date ? b.return_date.slice(0, 10) : pStr);

      if (pStr && dStr) {
        return checkDateStr >= pStr && checkDateStr <= dStr;
      }

      const pickup = b.pickup_date ? new Date(b.pickup_date) : null;
      const drop = b.drop_date ? new Date(b.drop_date) : (b.return_date ? new Date(b.return_date) : pickup);
      if (!pickup) return false;
      return checkDate >= pickup && checkDate <= (drop || pickup);
    });
  };

  // Calculate available units for a specific date
  const getAvailableVehiclesForDay = (checkDateStr) => {
    return allVehicles.filter(v => {
      const hasConflict = (bookings || []).some(b => {
        if (b.status === 'Cancelled') return false;
        const matchesVeh = (String(b.item_id) === String(v.id)) || 
                           (b.item_name && b.item_name.toLowerCase() === v.name?.toLowerCase()) ||
                           (b.vehicle_name && b.vehicle_name.toLowerCase() === v.name?.toLowerCase());
        if (!matchesVeh) return false;
        const pStr = b.pickup_date ? b.pickup_date.slice(0, 10) : '';
        const dStr = b.drop_date ? b.drop_date.slice(0, 10) : (b.return_date ? b.return_date.slice(0, 10) : pStr);
        return checkDateStr >= pStr && checkDateStr <= dStr;
      });
      return !hasConflict;
    });
  };

  // Today Date String
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Check if a day cell has the active red box selection
  const isDaySelected = (day) => {
    return selectedDate && 
      selectedDate.year === viewYear && 
      selectedDate.month === viewMonth && 
      selectedDate.day === day;
  };

  // Handle selecting any day on the calendar: moves the red box to that day
  const handleSelectDay = (day, yr = viewYear, mo = viewMonth) => {
    setViewYear(yr);
    setViewMonth(mo);
    setPickerYear(yr);
    setPickerMonth(mo);
    setSelectedDate({
      year: yr,
      month: mo,
      day
    });

    const dayBookings = getBookingsForDay(day, yr, mo);
    const isToday = day === today.getDate() && mo === today.getMonth() && yr === today.getFullYear();
    const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const availableUnits = getAvailableVehiclesForDay(dateStr);
    setSelectedDayDetails({
      dateStr,
      day,
      bookings: dayBookings,
      availableUnits,
      isToday
    });
    setTimeout(() => {
      dayDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  };

  // Go to Next Date: advances selected day by +1 and moves the red box
  const handleNextDay = () => {
    const curDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    curDate.setDate(curDate.getDate() + 1);
    const newYear = curDate.getFullYear();
    const newMonth = curDate.getMonth();
    const newDay = curDate.getDate();

    setViewYear(newYear);
    setViewMonth(newMonth);
    setSelectedDate({ year: newYear, month: newMonth, day: newDay });

    const checkDateStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    const isToday = newDay === today.getDate() && newMonth === today.getMonth() && newYear === today.getFullYear();
    const dayBks = (bookings || []).filter(b => {
      if (b.status === 'Cancelled') return false;
      const pStr = b.pickup_date ? b.pickup_date.slice(0, 10) : '';
      const dStr = b.drop_date ? b.drop_date.slice(0, 10) : (b.return_date ? b.return_date.slice(0, 10) : pStr);
      return checkDateStr >= pStr && checkDateStr <= dStr;
    });
    const availUnits = getAvailableVehiclesForDay(checkDateStr);

    setSelectedDayDetails({
      dateStr: checkDateStr,
      day: newDay,
      bookings: dayBks,
      availableUnits: availUnits,
      isToday
    });
  };

  // Go to Previous Date: decrements selected day by -1 and moves the red box
  const handlePrevDay = () => {
    const curDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    curDate.setDate(curDate.getDate() - 1);
    const newYear = curDate.getFullYear();
    const newMonth = curDate.getMonth();
    const newDay = curDate.getDate();

    setViewYear(newYear);
    setViewMonth(newMonth);
    setSelectedDate({ year: newYear, month: newMonth, day: newDay });

    const checkDateStr = `${newYear}-${String(newMonth + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
    const isToday = newDay === today.getDate() && newMonth === today.getMonth() && newYear === today.getFullYear();
    const dayBks = (bookings || []).filter(b => {
      if (b.status === 'Cancelled') return false;
      const pStr = b.pickup_date ? b.pickup_date.slice(0, 10) : '';
      const dStr = b.drop_date ? b.drop_date.slice(0, 10) : (b.return_date ? b.return_date.slice(0, 10) : pStr);
      return checkDateStr >= pStr && checkDateStr <= dStr;
    });
    const availUnits = getAvailableVehiclesForDay(checkDateStr);

    setSelectedDayDetails({
      dateStr: checkDateStr,
      day: newDay,
      bookings: dayBks,
      availableUnits: availUnits,
      isToday
    });
  };

  // Refresh calendar view back to Today's date (moves the red box back to today)
  const handleRefreshToToday = () => {
    const tYear = today.getFullYear();
    const tMonth = today.getMonth();
    const tDay = today.getDate();

    setViewYear(tYear);
    setViewMonth(tMonth);
    setPickerYear(tYear);
    setPickerMonth(tMonth);
    setSelectedDate({ year: tYear, month: tMonth, day: tDay });

    const dayBks = getBookingsForDay(tDay, tYear, tMonth);
    const availUnits = getAvailableVehiclesForDay(todayDateStr);
    setSelectedDayDetails({
      dateStr: todayDateStr,
      day: tDay,
      bookings: dayBks,
      availableUnits: availUnits,
      isToday: true
    });
  };

  // Keyboard navigation for Left / Right arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewBookingModal) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowLeft') {
        handlePrevDay();
      } else if (e.key === 'ArrowRight') {
        handleNextDay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate, viewMonth, viewYear, viewBookingModal]);

  // Click outside to close Date Picker Calendar Popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Calculate real stats for each vehicle in the fleet
  const vehicleStats = allVehicles.map(v => {
    let bookedCount = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const checkDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasBooking = (bookings || []).some(b => {
        if (b.status === 'Cancelled') return false;
        const matchesVeh = (String(b.item_id) === String(v.id)) || 
                           (b.item_name && b.item_name.toLowerCase() === v.name?.toLowerCase()) ||
                           (b.vehicle_name && b.vehicle_name.toLowerCase() === v.name?.toLowerCase());
        if (!matchesVeh) return false;

        const pStr = b.pickup_date ? b.pickup_date.slice(0, 10) : '';
        const dStr = b.drop_date ? b.drop_date.slice(0, 10) : (b.return_date ? b.return_date.slice(0, 10) : pStr);
        return checkDateStr >= pStr && checkDateStr <= dStr;
      });
      if (hasBooking) bookedCount++;
    }

    const availableCount = Math.max(0, daysInMonth - bookedCount);
    const occupancyPct = Math.round((bookedCount / daysInMonth) * 100);

    return {
      ...v,
      bookedDays: bookedCount,
      availableDays: availableCount,
      occupancy: occupancyPct
    };
  });

  return (
    <div className="p-3 p-md-4 pb-5" style={{ background: '#f8fafc', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Custom styles for clean, clearly visible horizontal scrollbars on zoom */}
      <style>{`
        .calendar-scroll-wrapper::-webkit-scrollbar,
        .table-responsive::-webkit-scrollbar {
          height: 9px;
        }
        .calendar-scroll-wrapper::-webkit-scrollbar-track,
        .table-responsive::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
          margin: 0 4px;
        }
        .calendar-scroll-wrapper::-webkit-scrollbar-thumb,
        .table-responsive::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 6px;
          border: 2px solid #f1f5f9;
        }
        .calendar-scroll-wrapper::-webkit-scrollbar-thumb:hover,
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      {/* Top Header & Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '18px' }}>Fleet Calendar</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            Real-time vehicle availability and bookings from database
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Specific Vehicle Filter */}
          <select 
            className="form-select form-select-sm shadow-sm" 
            style={{ borderRadius: '10px', fontSize: '0.82rem', minWidth: '180px', borderColor: '#e2e8f0' }} 
            value={selectedVehicle} 
            onChange={e => setSelectedVehicle(e.target.value)}
          >
            <option value="all">All Vehicles ({allVehicles.length})</option>
            {allVehicles.map(v => (
              <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend & Month/Date Navigation Bar */}
      <div className="card border-0 rounded-4 shadow-sm p-3 mb-3" style={{ background: '#fff' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          
          {/* Left: Month & Year Controller */}
          <div className="d-flex align-items-center gap-1.5">
            <button 
              onClick={prevMonth} 
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm" 
              style={{ width: '34px', height: '34px', background: '#f1f5f9' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="d-flex align-items-center gap-1">
              <select
                value={viewMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setViewMonth(m);
                  setPickerMonth(m);
                }}
                className="form-select form-select-sm border-0 fw-bold font-heading text-dark py-1 ps-2 pe-4 shadow-none"
                style={{ fontSize: '1rem', background: '#f1f5f9', borderRadius: '8px', cursor: 'pointer', width: 'auto' }}
                title="Select Month"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setViewYear(y);
                  setPickerYear(y);
                }}
                className="form-select form-select-sm border-0 fw-bold font-heading text-dark py-1 ps-2 pe-4 shadow-none"
                style={{ fontSize: '1rem', background: '#f1f5f9', borderRadius: '8px', cursor: 'pointer', width: 'auto' }}
                title="Select Year"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={nextMonth} 
              className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border-0 shadow-sm" 
              style={{ width: '34px', height: '34px', background: '#f1f5f9' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Center: Date Stepper (Previous Date / Next Date) with Calendar Popover */}
          <div className="position-relative d-flex align-items-center gap-1.5 p-1 rounded-pill border bg-light shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="btn btn-sm btn-light rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 border-0 fw-semibold text-dark"
              style={{ fontSize: '0.74rem' }}
              title="Navigate to Previous Date"
            >
              <ChevronLeft size={14} /> Prev Date
            </button>
            <button 
              type="button"
              onClick={() => {
                setPickerMonth(selectedDate.month);
                setPickerYear(selectedDate.year);
                setShowDatePicker(prev => !prev);
              }}
              className="btn btn-sm px-3 py-1 rounded-pill fw-bold border d-flex align-items-center gap-1.5 transition-all shadow-2xs" 
              style={{ 
                background: isDaySelected(today.getDate()) && viewMonth === today.getMonth() ? '#FFF5F2' : '#fff',
                borderColor: '#FF6333',
                fontSize: '0.78rem',
                color: '#FF6333',
                cursor: 'pointer'
              }}
              title="Click calendar icon to open calendar"
            >
              <span style={{ fontSize: '1rem' }}>📅</span>
              <span>{selectedDate.day} {MONTHS[selectedDate.month]?.slice(0, 3)} {selectedDate.year}</span>
              <ChevronDown size={14} className="text-muted" style={{ transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <button
              onClick={handleNextDay}
              className="btn btn-sm btn-light rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 border-0 fw-semibold text-dark"
              style={{ fontSize: '0.74rem' }}
              title="Navigate to Next Date"
            >
              Next Date <ChevronRight size={14} />
            </button>

            {/* Date Picker Calendar Popover */}
            {showDatePicker && (
              <div 
                ref={datePickerRef}
                className="position-absolute shadow-2xl rounded-4 p-3 bg-white animate-fade-in"
                style={{
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '310px',
                  zIndex: 1060,
                  border: '1px solid rgba(0,0,0,0.12)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.18)'
                }}
              >
                {/* Popover Header: Month & Year navigation with direct dropdown selectors */}
                <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                  <button
                    type="button"
                    onClick={() => {
                      if (pickerMonth === 0) {
                        setPickerMonth(11);
                        setPickerYear(y => y - 1);
                        setViewMonth(11);
                        setViewYear(y => y - 1);
                      } else {
                        setPickerMonth(m => m - 1);
                        setViewMonth(m => m - 1);
                      }
                    }}
                    className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px' }}
                    title="Previous Month"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <div className="d-flex align-items-center gap-1">
                    <select
                      value={pickerMonth}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setPickerMonth(m);
                        setViewMonth(m);
                      }}
                      className="form-select form-select-sm fw-bold border-0 bg-light py-1 ps-2 pe-3 text-dark shadow-none"
                      style={{ fontSize: '0.84rem', cursor: 'pointer', width: 'auto', minWidth: '100px' }}
                      title="Select Month"
                    >
                      {MONTHS.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={pickerYear}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setPickerYear(y);
                        setViewYear(y);
                      }}
                      className="form-select form-select-sm fw-bold border-0 bg-light py-1 ps-2 pe-3 text-dark shadow-none"
                      style={{ fontSize: '0.84rem', cursor: 'pointer', width: 'auto', minWidth: '76px' }}
                      title="Select Year"
                    >
                      {YEARS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (pickerMonth === 11) {
                        setPickerMonth(0);
                        setPickerYear(y => y + 1);
                        setViewMonth(0);
                        setViewYear(y => y + 1);
                      } else {
                        setPickerMonth(m => m + 1);
                        setViewMonth(m => m + 1);
                      }
                    }}
                    className="btn btn-sm btn-light rounded-circle p-0 d-flex align-items-center justify-content-center"
                    style={{ width: '28px', height: '28px' }}
                    title="Next Month"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* Day of Week Headers */}
                <div className="d-grid text-center mb-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d} className="text-muted fw-bold" style={{ fontSize: '0.65rem' }}>{d}</span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {Array.from({ length: getFirstDayOfMonth(pickerYear, pickerMonth) }, (_, i) => (
                    <div key={`empty-p-${i}`} />
                  ))}

                  {Array.from({ length: getDaysInMonth(pickerYear, pickerMonth) }, (_, i) => i + 1).map(d => {
                    const isSel = selectedDate.year === pickerYear && selectedDate.month === pickerMonth && selectedDate.day === d;
                    const isTod = today.getFullYear() === pickerYear && today.getMonth() === pickerMonth && today.getDate() === d;

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          handleSelectDay(d, pickerYear, pickerMonth);
                          setShowDatePicker(false);
                        }}
                        className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center fw-bold transition-all"
                        style={{
                          width: '32px',
                          height: '32px',
                          margin: 'auto',
                          fontSize: '0.78rem',
                          background: isSel ? '#FF6333' : (isTod ? '#FFF5F2' : 'transparent'),
                          color: isSel ? '#fff' : (isTod ? '#FF6333' : '#1e293b'),
                          border: isSel ? '1px solid #FF6333' : (isTod ? '1px dashed #FF6333' : '1px solid transparent'),
                          cursor: 'pointer'
                        }}
                        title={`${d} ${MONTHS[pickerMonth]} ${pickerYear}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>

                {/* Popover Footer */}
                <div className="d-flex align-items-center justify-content-between pt-2 mt-2 border-top">
                  <button
                    type="button"
                    onClick={() => {
                      handleRefreshToToday();
                      setShowDatePicker(false);
                    }}
                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                    style={{ color: '#FF6333', fontSize: '0.74rem' }}
                  >
                    Go to Today
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="btn btn-sm btn-secondary rounded-pill px-3 py-0.5"
                    style={{ fontSize: '0.72rem' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Refresh & Legend Controls */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Refresh back to Today's date button */}
            <button
              onClick={handleRefreshToToday}
              className="btn btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5 shadow-sm transition-all"
              style={{
                fontSize: '0.74rem',
                background: isDaySelected(today.getDate()) && viewMonth === today.getMonth() && viewYear === today.getFullYear() ? '#FF6333' : '#fff',
                color: isDaySelected(today.getDate()) && viewMonth === today.getMonth() && viewYear === today.getFullYear() ? '#fff' : '#FF6333',
                border: '1px solid #FF6333',
                cursor: 'pointer'
              }}
              title="Refresh / Reset calendar back to Today's date"
            >
              <RotateCcw size={13} /> Refresh (Today)
            </button>

            {/* Booked Indicator */}
            <div className="d-flex align-items-center gap-1.5 px-2.5 py-1 rounded" style={{ background: '#dbeafe', border: '1px solid #bfdbfe' }}>
              <div style={{ width: '12px', height: '12px', background: '#dbeafe', border: '1px solid #2563eb', borderRadius: '3px' }} />
              <span style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 600 }}>Booked</span>
            </div>

            {/* Available mode toggle */}
            <div 
              onClick={() => setShowAvailableOnly(prev => !prev)}
              className="d-flex align-items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded transition-all"
              style={{
                background: showAvailableOnly ? '#dcfce7' : '#fff',
                border: showAvailableOnly ? '1px solid #16a34a' : '1px solid #bbf7d0',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Click to view Available vehicle units per day"
            >
              <div style={{ width: '12px', height: '12px', background: '#dcfce7', border: '1px solid #16a34a', borderRadius: '3px' }} />
              <span style={{ fontSize: '0.74rem', color: showAvailableOnly ? '#15803d' : '#16a34a', fontWeight: 700 }}>
                {showAvailableOnly ? '✓ Available (Active)' : 'Available'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid Card with Responsive Horizontal Scroll & Bottom Scrollbar */}
      <div className="card border-0 rounded-4 shadow-sm mb-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div 
          className="calendar-scroll-wrapper"
          style={{ 
            overflowX: 'auto', 
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '8px'
          }}
        >
          <div style={{ minWidth: '980px' }}>
            {/* Day Name Headers */}
            <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {DAYS.map(d => (
                <div key={d} className="text-center py-2.5 fw-bold" style={{ fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.5px' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="d-grid p-2" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {emptyBefore.map(i => (
                <div key={`empty-${i}`} className="rounded-3" style={{ minHeight: '88px', background: '#f8fafc', opacity: 0.5 }} />
              ))}

              {days.map(day => {
                const dayBookings = getBookingsForDay(day);
                const isSelected = isDaySelected(day);
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const hasBookings = dayBookings.length > 0;
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const availableUnits = getAvailableVehiclesForDay(dateStr);

                return (
                  <div
                    key={day}
                    onClick={() => handleSelectDay(day)}
                    className="rounded-3 p-2 d-flex flex-column transition-all"
                    style={{
                      minHeight: '94px',
                      background: isSelected ? '#FFF5F2' : (isToday ? '#fffaf8' : (hasBookings ? '#f8fafc' : '#fff')),
                      border: isSelected ? '2px solid #FF6333' : (isToday ? '1px dashed #FF6333' : (hasBookings ? '1px solid #93c5fd' : '1px solid #e2e8f0')),
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: isSelected ? '0 0 0 1px #FF6333, 0 4px 12px rgba(255,99,51,0.18)' : 'none',
                      transform: isSelected ? 'scale(1.01)' : 'none',
                      transition: 'all 0.15s ease-in-out'
                    }}
                    title={`Click to focus on ${day} ${MONTHS[viewMonth]}`}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.82rem', color: isSelected || isToday ? '#FF6333' : '#0D1B2E' }}>
                        {day} 
                        {isToday && <span className="badge bg-danger p-0 px-1" style={{ fontSize: '0.58rem' }}>TODAY</span>}
                        {isSelected && !isToday && <span className="badge p-0 px-1" style={{ fontSize: '0.55rem', background: '#FF6333', color: '#fff' }}>ACTIVE</span>}
                      </span>
                      
                      <div className="d-flex align-items-center gap-1">
                        {/* Available count badge if Available filter active */}
                        {showAvailableOnly ? (
                          <span className="badge rounded-pill bg-success" style={{ fontSize: '0.6rem', padding: '2px 6px' }} title={`${availableUnits.length} vehicles available on this date`}>
                            ✓ {availableUnits.length} Free
                          </span>
                        ) : hasBookings && (
                          <span className="badge rounded-pill" style={{ background: isSelected ? '#FF6333' : '#2563eb', fontSize: '0.6rem', padding: '2px 6px' }}>
                            {dayBookings.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Available highlight mode if toggled */}
                    {showAvailableOnly && (
                      <div className="text-success small fw-bold mb-1" style={{ fontSize: '0.62rem' }}>
                        ✓ {availableUnits.length} Available
                      </div>
                    )}

                    {/* Booking mini event cards */}
                    <div className="d-flex flex-column gap-1 overflow-hidden">
                      {dayBookings.slice(0, 2).map((b, idx) => {
                        const isBike = getVehicleCategory(b) === 'bike';
                        const catEmoji = isBike ? '🏍️' : '🚗';
                        const displayItem = b.vehicle_name || b.item_name || 'Vehicle';

                        return (
                          <div
                            key={b.id || idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectDay(day);
                              setViewBookingModal(b);
                            }}
                            className="rounded p-1 text-truncate"
                            title={`${catEmoji} ${displayItem} · Customer: ${b.name || b.customer_name || 'Guest'} (${b.status || 'Confirmed'})`}
                            style={{
                              background: isBike ? '#ede9fe' : '#dbeafe',
                              color: isBike ? '#7c3aed' : '#1e40af',
                              borderLeft: `3px solid ${isBike ? '#8b5cf6' : '#2563eb'}`,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              cursor: 'pointer'
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between gap-1">
                              <span className="text-truncate">
                                {catEmoji} {displayItem}
                              </span>
                              <span className="badge p-0 px-1" style={{ 
                                fontSize: '0.52rem', 
                                background: b.status === 'Completed' ? '#dcfce7' : '#dbeafe', 
                                color: b.status === 'Completed' ? '#15803d' : '#1e40af' 
                              }}>
                                {b.status || 'OK'}
                              </span>
                            </div>
                            <div className="text-truncate mt-0.5" style={{ fontSize: '0.56rem', fontWeight: 500, opacity: 0.85 }}>
                              👤 {b.name || b.customer_name || 'Guest'} {b.pickup_time ? `• ⏰ ${b.pickup_time}` : ''}
                            </div>
                          </div>
                        );
                      })}

                      {/* "+X more" button: opens selected day details table drawer */}
                      {dayBookings.length > 2 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectDay(day);
                          }}
                          className="btn p-0 border-0 text-start w-100 fw-bold d-block text-decoration-none"
                          style={{ 
                            fontSize: '0.62rem', 
                            color: '#2563eb', 
                            cursor: 'pointer' 
                          }}
                          title={`Click to view all ${dayBookings.length} bookings for this day`}
                        >
                          <span 
                            className="badge rounded-pill bg-primary bg-opacity-10 text-primary py-0.5 px-1.5 w-100 text-truncate text-start"
                            style={{ fontSize: '0.62rem', fontWeight: 700 }}
                          >
                            +{dayBookings.length - 2} more
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Details Section / Drawer (Identical to Admin Portal Calendar) */}
      {selectedDayDetails && (
        <div 
          ref={dayDetailsRef} 
          className="card border-0 rounded-4 shadow-sm p-4 mb-4 animate-fade-in" 
          style={{ background: '#fff', borderLeft: '4px solid #FF6333' }}
        >
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div>
                <h6 className="fw-bold mb-0 font-heading" style={{ color: '#0D1B2E', fontSize: '1.05rem' }}>
                  {selectedDayDetails.isToday ? "🔥 Today's Schedule — " : 'Reservations & Availability — '} 
                  {MONTHS[viewMonth]} {selectedDayDetails.day}, {viewYear}
                </h6>
                <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                  {selectedDayDetails.bookings.length} active reservation(s) • {(selectedDayDetails.availableUnits || []).length} available fleet unit(s)
                </span>
              </div>

              {/* Day stepper controls inside drawer header */}
              <div className="btn-group btn-group-sm rounded-pill border bg-light shadow-2xs">
                <button 
                  onClick={handlePrevDay} 
                  className="btn btn-sm btn-light border-0 px-2.5 py-1 fw-semibold"
                  style={{ fontSize: '0.72rem' }}
                  title="Previous Date"
                >
                  <ChevronLeft size={13} /> Prev Date
                </button>
                <button 
                  onClick={handleNextDay} 
                  className="btn btn-sm btn-light border-0 px-2.5 py-1 fw-semibold"
                  style={{ fontSize: '0.72rem' }}
                  title="Next Date"
                >
                  Next Date <ChevronRight size={13} />
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleRefreshToToday}
                className="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-1"
                style={{ fontSize: '0.75rem' }}
                title="Jump back to Today"
              >
                <RotateCcw size={12} /> Today
              </button>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                style={{ fontSize: '0.75rem' }}
              >
                Close
              </button>
            </div>
          </div>

          {selectedDayDetails.bookings.length === 0 ? (
            <div className="p-3 text-center text-muted bg-light rounded-3 mb-3" style={{ fontSize: '0.82rem' }}>
              No bookings active on this date. All fleet units available.
            </div>
          ) : (
            <div className="table-responsive mb-3">
              <table className="table align-middle small mb-0" style={{ minWidth: '820px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Category</th>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Dates / Schedule</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayDetails.bookings.map(b => {
                    const isBike = getVehicleCategory(b) === 'bike';
                    const catEmoji = isBike ? '🏍️ Bike' : '🚗 Car';

                    return (
                      <tr key={b.id}>
                        <td>
                          <span className="badge rounded-pill px-2.5 py-1 fw-bold" style={{
                            background: isBike ? '#ede9fe' : '#dbeafe',
                            color: isBike ? '#7c3aed' : '#1e40af',
                            fontSize: '0.7rem'
                          }}>
                            {catEmoji}
                          </span>
                        </td>
                        <td className="fw-bold text-primary">#{b.id}</td>
                        <td>
                          <div className="fw-semibold">{b.name || b.customer_name || 'Guest'}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{b.phone || '—'}</div>
                        </td>
                        <td className="fw-bold" style={{ color: '#0D1B2E' }}>
                          {b.vehicle_name || b.item_name || 'Vehicle'}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem' }}>
                            {b.pickup_date || '—'} → {b.drop_date || b.return_date || '—'}
                          </div>
                          {b.pickup_time && (
                            <span className="text-muted text-xs">⏰ {b.pickup_time}</span>
                          )}
                        </td>
                        <td className="fw-bold text-success">
                          ₹{Number(b.total_amount || b.total_paid || 0).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${b.status === 'Completed' ? 'bg-success text-white' : b.status === 'Cancelled' ? 'bg-danger text-white' : 'bg-primary text-white'}`}>
                            {b.status || 'Confirmed'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setViewBookingModal(b)}
                            className="btn btn-sm btn-outline-primary py-1 px-2.5 d-flex align-items-center gap-1 rounded-pill"
                            style={{ fontSize: '0.74rem' }}
                          >
                            <Eye size={12} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Available Units on Selected Date */}
          {selectedDayDetails.availableUnits && selectedDayDetails.availableUnits.length > 0 && (
            <div className="border-top pt-3 mt-2">
              <h6 className="fw-bold mb-2 text-success font-heading" style={{ fontSize: '0.85rem' }}>
                ✓ Available Fleet Units on {selectedDayDetails.dateStr} ({selectedDayDetails.availableUnits.length} Units Free)
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {selectedDayDetails.availableUnits.slice(0, 16).map(it => (
                  <span 
                    key={it.id} 
                    className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill shadow-xs d-flex align-items-center gap-1.5"
                    style={{ fontSize: '0.74rem' }}
                  >
                    {it.type === 'bike' ? '🏍️' : '🚗'} <strong>{it.name}</strong> (₹{it.price || 0}/day)
                  </span>
                ))}
                {selectedDayDetails.availableUnits.length > 16 && (
                  <span className="badge bg-secondary text-white px-2 py-1.5 rounded-pill" style={{ fontSize: '0.74rem' }}>
                    +{selectedDayDetails.availableUnits.length - 16} more units available
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comprehensive Individual Booking Details Modal (Identical to Admin Portal) */}
      {viewBookingModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }} onClick={() => setViewBookingModal(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header border-0 px-4 pt-4 pb-3" style={{ background: '#0D1B2E', color: '#fff' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: 'rgba(255,99,51,0.15)', color: '#FF6333' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-white" style={{ color: '#ffffff' }}>Booking #{viewBookingModal.id}</h5>
                    <span className="text-white-50 small">Reservation details and customer information</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewBookingModal(null)} />
              </div>

              <div className="modal-body p-4 text-start bg-light">
                <div className="row g-3">
                  {/* Category & Status */}
                  <div className="col-12 d-flex align-items-center gap-2 flex-wrap pb-2 border-bottom">
                    <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{
                      background: getVehicleCategory(viewBookingModal) === 'bike' ? '#ede9fe' : '#dbeafe',
                      color: getVehicleCategory(viewBookingModal) === 'bike' ? '#7c3aed' : '#1e40af',
                      fontSize: '0.82rem'
                    }}>
                      {getVehicleCategory(viewBookingModal) === 'bike' ? '🏍️ Bike Rental' : '🚗 Vehicle Rental'}
                    </span>
                    <span className="badge rounded-pill px-3 py-1.5 fw-bold bg-success" style={{ fontSize: '0.82rem' }}>
                      {viewBookingModal.status || 'Confirmed'}
                    </span>
                    <span className="badge rounded-pill px-3 py-1.5 fw-bold bg-secondary" style={{ fontSize: '0.82rem' }}>
                      Payment: {viewBookingModal.payment_status || 'Paid'}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Customer Details
                      </h6>
                      <div className="fw-bold fs-6 text-dark mb-1">{viewBookingModal.name || viewBookingModal.customer_name || 'Guest'}</div>
                      <div className="text-muted small d-flex align-items-center gap-1.5 mb-1">
                        <Phone size={13} /> {viewBookingModal.phone || 'No phone'}
                      </div>
                      <div className="text-muted small d-flex align-items-center gap-1.5 mb-2">
                        <Mail size={13} /> {viewBookingModal.email || 'No email'}
                      </div>
                      {viewBookingModal.license && (
                        <div className="small text-secondary">
                          <strong>License:</strong> {viewBookingModal.license}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reserved Inventory Item */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Reserved Item
                      </h6>
                      <div className="fw-bold fs-6 text-primary mb-1">
                        {viewBookingModal.vehicle_name || viewBookingModal.item_name || 'Item'}
                      </div>
                      <div className="text-muted small mb-2">
                        <strong>Category:</strong> {getVehicleCategory(viewBookingModal).toUpperCase()}
                      </div>
                      {(viewBookingModal.pickup_loc || viewBookingModal.pickup_location) && (
                        <div className="text-muted small d-flex align-items-center gap-1.5">
                          <MapPin size={13} /> <strong>Location:</strong> {viewBookingModal.pickup_loc || viewBookingModal.pickup_location}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Schedule / Dates
                      </h6>
                      <div className="small text-dark mb-1">
                        <strong>Start Date:</strong> {viewBookingModal.pickup_date || '—'} {viewBookingModal.pickup_time ? `(${viewBookingModal.pickup_time})` : ''}
                      </div>
                      <div className="small text-dark mb-1">
                        <strong>End Date:</strong> {viewBookingModal.drop_date || viewBookingModal.return_date || '—'} {viewBookingModal.drop_time ? `(${viewBookingModal.drop_time})` : ''}
                      </div>
                      {viewBookingModal.booking_days && (
                        <div className="small text-muted">
                          <strong>Duration:</strong> {viewBookingModal.booking_days} day(s)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="col-md-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 h-100 bg-white">
                      <h6 className="fw-bold text-secondary text-uppercase mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                        Financial & Payment
                      </h6>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-muted">Total Amount:</span>
                        <strong className="fs-6 text-success">₹{Number(viewBookingModal.total_paid || viewBookingModal.total_amount || 0).toLocaleString()}</strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small text-muted">Payment Status:</span>
                        <span className="badge bg-success-subtle text-success">{viewBookingModal.payment_status || 'Paid'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver details if any */}
                  {Boolean(viewBookingModal.driver_required || viewBookingModal.driver_service_type || viewBookingModal.assigned_driver_id) && (
                    <div className="col-12">
                      <div className="card p-3 border-0 shadow-sm rounded-3 bg-white" style={{ borderLeft: '4px solid #f59e0b' }}>
                        <h6 className="fw-bold text-warning text-uppercase mb-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                          🧑‍✈️ Driver / Chauffeur Service
                        </h6>
                        <div className="small text-dark">
                          <strong>Service:</strong> {viewBookingModal.driver_service_type || 'Driver Assigned'} ·{' '}
                          <strong>Driver:</strong> {viewBookingModal.assigned_driver_name || (viewBookingModal.assigned_driver_id ? `#${viewBookingModal.assigned_driver_id}` : 'Pending Driver Assignment')} ·{' '}
                          <strong>Fee:</strong> ₹{viewBookingModal.driver_charge || 0}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer px-4 py-3 bg-white border-top">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setViewBookingModal(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Utilization for Month */}
      <div className="mt-4 rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="fw-bold" style={{ color: '#0D1B2E', fontSize: '13px' }}>Fleet Utilization for {MONTHS[viewMonth]} {viewYear}</div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem', minWidth: '650px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Vehicle</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Type</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Booked Days</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Available Days</th>
                <th className="px-3 py-2 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {vehicleStats.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#0D1B2E' }}>{v.name}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: v.type === 'car' ? '#dbeafe' : '#ede9fe', color: v.type === 'car' ? '#2563eb' : '#7c3aed', fontSize: '0.65rem', textTransform: 'uppercase' }}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 fw-bold" style={{ color: v.bookedDays > 0 ? '#dc2626' : '#64748b' }}>{v.bookedDays} days</td>
                  <td className="px-3 py-2 fw-bold" style={{ color: '#16a34a' }}>{v.availableDays} days</td>
                  <td className="px-3 py-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="flex-grow-1 rounded-pill overflow-hidden" style={{ height: '6px', background: '#f1f5f9' }}>
                        <div className="rounded-pill" style={{ width: `${v.occupancy}%`, height: '100%', background: v.occupancy >= 80 ? '#dc2626' : v.occupancy >= 50 ? '#d97706' : '#16a34a' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D1B2E' }}>{v.occupancy}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {vehicleStats.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-4 text-center text-muted">No vehicles in fleet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
