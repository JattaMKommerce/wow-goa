import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Search, Filter, Plus, Edit2, Trash2, Eye, CheckCircle2,
  XCircle, Clock, AlertCircle, RefreshCw, DollarSign, User, Phone,
  MapPin, ChevronRight, X, Shield, FileText, Download, RotateCcw,
  Layers, Radio, SlidersHorizontal, CreditCard
} from 'lucide-react';
import * as api from '../../services/api';
import { validateVehicleBookingEligibility } from '../../utils/dateUtils';

// ─── Classification & Formatting Helpers ───

export function getBookingServiceType(b) {
  if (!b) return 'VEHICLE';
  const type = String(b.type || '').trim().toLowerCase();
  const pkgType = String(b.package_type || '').trim().toLowerCase();
  const itemId = String(b.item_id || '').trim().toLowerCase();
  const itemName = String(b.item_name || b.service_name || b.package_name || b.hotel_name || '').trim().toLowerCase();

  // 1. FLIGHT
  if (
    type === 'flight' ||
    type.includes('flight') ||
    pkgType.includes('flight') ||
    itemId.includes('flight') ||
    itemName.includes('flight') ||
    itemName.includes('airways') ||
    itemName.includes('airline') ||
    Boolean(b.flight_number || b.airline)
  ) {
    return 'FLIGHT';
  }

  // 2. SIGHTSEEING & ACTIVITY (Evaluated before TRIP to prevent activity bookings from being misclassified as Trip)
  const isActivity = (
    type === 'activity' ||
    type === 'sightseeing' ||
    pkgType === 'activity' ||
    pkgType === 'sightseeing' ||
    itemId.startsWith('act-') ||
    itemId.startsWith('activity-') ||
    itemId.startsWith('sight-') ||
    itemId.startsWith('act_')
  );

  if (isActivity) {
    return 'ACTIVITY';
  }

  // 3. TRIP (Packages, Tours, Craft Trips, Itinerary escapes)
  const isTrip = (
    type === 'package' ||
    type === 'trip' ||
    type === 'custom' ||
    type === 'tour' ||
    itemId.startsWith('pkg-') ||
    itemId.startsWith('package-') ||
    itemId.startsWith('craft-') ||
    itemId.startsWith('tp-') ||
    pkgType.includes('package') ||
    pkgType.includes('trip') ||
    pkgType.includes('tour') ||
    pkgType.includes('holiday') ||
    itemName.includes('craft my trip') ||
    itemName.includes('explorer pack') ||
    itemName.includes('package') ||
    itemName.includes('getaway') ||
    itemName.includes('escape') ||
    itemName.includes('tour') ||
    itemName.includes('heritage trail')
  );

  if (isTrip) {
    return 'TRIP';
  }

  // 3. HOTEL (Pure hotel stays, resorts, villas)
  if (
    type === 'hotel' ||
    itemId.includes('hotel') ||
    pkgType.includes('hotel') ||
    itemName.includes('hotel') ||
    itemName.includes('resort') ||
    itemName.includes('villa') ||
    itemName.includes('palace') ||
    itemName.includes('suites') ||
    itemName.includes('stay') ||
    Boolean(b.hotel_name && !b.vehicle_name && !b.car_included)
  ) {
    return 'HOTEL';
  }

  // 4. VEHICLE (Cars, bikes, self-drive, driver transport, scooters)
  return 'VEHICLE';
}

export function getBookingChannel(b) {
  if (!b) return 'D2C';
  const ch = String(b.booking_channel || '').trim().toUpperCase();
  if (ch === 'B2B' || b.b2b_partner_id || b.b2b_partner_name) {
    return 'B2B';
  }
  return 'D2C';
}

export function getBookingServiceDates(b) {
  if (!b) return { start: '', end: '' };
  
  const svc = getBookingServiceType(b);
  let start = '';
  let end = '';

  if (svc === 'HOTEL') {
    start = b.check_in_date || b.pickup_date || b.departure_date || b.start_date || '';
    end = b.check_out_date || b.drop_date || b.return_date || b.end_date || start;
  } else if (svc === 'FLIGHT') {
    start = b.departure_date || b.pickup_date || b.check_in_date || b.start_date || '';
    end = b.return_date || b.drop_date || b.check_out_date || b.end_date || start;
  } else {
    // VEHICLE and TRIP
    start = b.pickup_date || b.check_in_date || b.departure_date || b.start_date || '';
    end = b.drop_date || b.check_out_date || b.return_date || b.end_date || start;
  }

  if (start && typeof start === 'string') {
    if (start.includes('T')) start = start.split('T')[0];
    if (start.includes(' ')) start = start.split(' ')[0];
  }
  if (end && typeof end === 'string') {
    if (end.includes('T')) end = end.split('T')[0];
    if (end.includes(' ')) end = end.split(' ')[0];
  }
  if (!end) end = start;

  return { start, end };
}

export function formatServiceDateRange(start, end) {
  if (!start && !end) return '—';
  if (!start) return end;
  if (!end || start === end) {
    try {
      const [y, m, d] = start.split('-');
      if (!y || !m || !d) return start;
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return start;
    }
  }

  try {
    const [y1, m1, d1] = start.split('-');
    const [y2, m2, d2] = end.split('-');
    const dt1 = new Date(Number(y1), Number(m1) - 1, Number(d1));
    const dt2 = new Date(Number(y2), Number(m2) - 1, Number(d2));
    const s1 = dt1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const s2 = dt2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${s1} – ${s2}`;
  } catch {
    return `${start} to ${end}`;
  }
}

export function ServiceBadge({ type }) {
  switch (type) {
    case 'VEHICLE':
      return (
        <span className="badge rounded-pill px-2.5 py-1 fw-bold text-primary border border-primary-subtle" style={{ background: '#eff6ff', fontSize: '0.72rem' }}>
          🚗 VEHICLE
        </span>
      );
    case 'HOTEL':
      return (
        <span className="badge rounded-pill px-2.5 py-1 fw-bold border border-indigo-subtle" style={{ background: '#f5f3ff', color: '#6366f1', fontSize: '0.72rem' }}>
          🏨 HOTEL
        </span>
      );
    case 'TRIP':
      return (
        <span className="badge rounded-pill px-2.5 py-1 fw-bold border border-success-subtle" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem' }}>
          🌴 TRIP
        </span>
      );
    case 'ACTIVITY':
      return (
        <span className="badge rounded-pill px-2.5 py-1 fw-bold border border-teal-subtle" style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.72rem' }}>
          🎯 SIGHTSEEING & ACTIVITY
        </span>
      );
    case 'FLIGHT':
      return (
        <span className="badge rounded-pill px-2.5 py-1 fw-bold border border-info-subtle" style={{ background: '#f0f9ff', color: '#0284c7', fontSize: '0.72rem' }}>
          ✈️ FLIGHT
        </span>
      );
    default:
      return (
        <span className="badge rounded-pill px-2.5 py-1 fw-bold text-secondary border bg-light" style={{ fontSize: '0.72rem' }}>
          📦 {type}
        </span>
      );
  }
}

export function ChannelBadge({ channel, mode, partnerName }) {
  if (channel === 'B2B') {
    return (
      <div>
        <span className="badge rounded-pill px-2.5 py-1 fw-bold border border-warning-subtle" style={{ background: '#fffbeb', color: '#b45309', fontSize: '0.72rem' }}>
          💼 B2B
        </span>
        {mode && (
          <div className="text-muted mt-0.5 fw-semibold" style={{ fontSize: '0.66rem' }}>
            {mode === 'COMMISSION' ? '💰 Comm' : '🏷️ Net'}
          </div>
        )}
        {partnerName && (
          <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.70rem', maxWidth: '110px' }} title={partnerName}>
            {partnerName}
          </div>
        )}
      </div>
    );
  }
  return (
    <span className="badge rounded-pill px-2.5 py-1 fw-bold border border-secondary-subtle" style={{ background: '#f8fafc', color: '#334155', fontSize: '0.72rem' }}>
      🔵 D2C
    </span>
  );
}

function StatusBadge({ status }) {
  const s = (status || 'Pending').toLowerCase();
  if (s === 'confirmed') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-primary border border-primary-subtle" style={{ background: '#dbeafe', fontSize: '0.72rem' }}>Confirmed</span>;
  }
  if (s === 'completed') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-success border border-success-subtle" style={{ background: '#dcfce7', color: '#059669', fontSize: '0.72rem' }}>Completed</span>;
  }
  if (s === 'rejected') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-danger border border-danger-subtle" style={{ background: '#fee2e2', fontSize: '0.72rem' }}>Rejected</span>;
  }
  if (s === 'cancelled') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-danger border border-danger-subtle" style={{ background: '#fee2e2', fontSize: '0.72rem' }}>Cancelled</span>;
  }
  if (s === 'checked in') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-info border border-info-subtle" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem' }}>Checked In</span>;
  }
  if (s === 'checked out') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-secondary border border-secondary-subtle" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem' }}>Checked Out</span>;
  }
  if (s === 'pending') {
    return <span className="badge rounded-pill px-2.5 py-1 fw-bold text-warning border border-warning-subtle" style={{ background: '#fef9c3', color: '#854d0e', fontSize: '0.72rem' }}>Pending</span>;
  }
  return <span className="badge rounded-pill px-2.5 py-1 fw-bold border text-capitalize" style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.72rem' }}>{status || 'Pending'}</span>;
}

function PaymentBadge({ status }) {
  const s = (status || 'pending').toLowerCase();
  if (s === 'paid' || s === 'full' || s === 'completed') {
    return <span className="badge rounded-pill px-2 py-0.5 fw-bold text-success bg-success-subtle" style={{ fontSize: '0.68rem' }}>Paid</span>;
  }
  if (s === 'partial' || s === 'advance') {
    return <span className="badge rounded-pill px-2 py-0.5 fw-bold text-info bg-info-subtle" style={{ fontSize: '0.68rem' }}>Partial</span>;
  }
  return <span className="badge rounded-pill px-2 py-0.5 fw-bold text-secondary bg-secondary-subtle" style={{ fontSize: '0.68rem' }}>Unpaid</span>;
}

export default function AdminBookingManagement({
  bookings: initialBookings = [],
  onRefreshBookings,
  onNavigateToCalendar,
  onNavigateToPayments,
  currentUser,
  hotels = [],
  cars = [],
  bikes = []
}) {
  const [bookingsList, setBookingsList] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('search') || sessionStorage.getItem('tg_booking_search') || '';
      if (sessionStorage.getItem('tg_booking_search')) {
        sessionStorage.removeItem('tg_booking_search');
      }
      return q;
    } catch (_) {
      return '';
    }
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'INDIAN' | 'FOREIGN'
  const [dateFilter, setDateFilter] = useState('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewBooking, setViewBooking] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Driver Assignment State
  const [driversList, setDriversList] = useState([]);
  const [assigningBooking, setAssigningBooking] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [driverAssignMsg, setDriverAssignMsg] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    license: '',
    serviceType: 'hotel',
    item_id: '',
    item_name: '',
    pickup_date: '',
    drop_date: '',
    pickup_loc: 'Goa',
    total_amount: '',
    amount_paid: '',
    payment_method: 'Cash',
    status: 'Confirmed',
    payment_status: 'Paid',
    customizations: '',
    driver_required: 0
  });

  const fetchLatestBookings = async () => {
    setLoading(true);
    try {
      const fresh = await api.fetchBookings();
      if (Array.isArray(fresh)) {
        setBookingsList(fresh);
      }
      if (onRefreshBookings) {
        await onRefreshBookings();
      }
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDriversList = async () => {
    try {
      const drvs = await api.fetchDrivers();
      setDriversList(drvs || []);
    } catch (e) {
      console.error('Failed to fetch drivers in bookings:', e);
    }
  };

  useEffect(() => {
    fetchLatestBookings();
    loadDriversList();
  }, []);

  useEffect(() => {
    if (initialBookings && initialBookings.length > 0) {
      setBookingsList(initialBookings);
    }
  }, [initialBookings]);

  const handleAssignDriverSubmit = async (e) => {
    e.preventDefault();
    if (!assigningBooking || !selectedDriverId) return;
    setActionLoading(true);
    setFormError('');
    try {
      await api.assignDriver(assigningBooking.id, selectedDriverId, assignNotes);
      setDriverAssignMsg(`Driver successfully assigned to booking #${assigningBooking.id}!`);
      setTimeout(() => setDriverAssignMsg(''), 4000);
      setAssigningBooking(null);
      setSelectedDriverId('');
      setAssignNotes('');
      await fetchLatestBookings();
    } catch (err) {
      setFormError(err.message || 'Failed to assign driver.');
    } finally {
      setActionLoading(false);
    }
  };

  // Date overlap helper: Universal interval overlap [bStart, bEnd] with [targetStart, targetEnd]
  const matchesOperationalDate = (b) => {
    if (dateFilter === 'ALL') return true;

    const { start, end } = getBookingServiceDates(b);
    if (!start) return false;
    const bStart = start;
    const bEnd = end || start;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = fmt(now);

    if (dateFilter === 'TODAY') {
      // Overlap with today: starts on or before today, and ends on or after today
      return bStart <= todayStr && bEnd >= todayStr;
    }

    if (dateFilter === 'TOMORROW') {
      const tmr = new Date(now);
      tmr.setDate(tmr.getDate() + 1);
      const tmrStr = fmt(tmr);
      // Overlap with tomorrow
      return bStart <= tmrStr && bEnd >= tmrStr;
    }

    if (dateFilter === 'THIS_WEEK') {
      // Monday to Sunday of current week
      const dayOfWeek = now.getDay();
      const distToMon = (dayOfWeek + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - distToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const weekStart = fmt(monday);
      const weekEnd = fmt(sunday);

      return bStart <= weekEnd && bEnd >= weekStart;
    }

    if (dateFilter === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthStart = fmt(firstDay);
      const monthEnd = fmt(lastDay);

      return bStart <= monthEnd && bEnd >= monthStart;
    }

    if (dateFilter === 'CUSTOM') {
      if (!customStartDate && !customEndDate) return true;
      const targetStart = customStartDate || customEndDate;
      const targetEnd = customEndDate || customStartDate;
      return bStart <= targetEnd && bEnd >= targetStart;
    }

    return true;
  };

  // Filter Bookings - combinable across Service, Channel, Date, Status, Search
  const filteredBookings = (bookingsList || []).filter(b => {
    // 1. Service filter
    if (serviceFilter !== 'ALL') {
      const svc = getBookingServiceType(b);
      if (svc !== serviceFilter) return false;
    }

    // 2. Channel filter
    const ch = getBookingChannel(b);
    if (channelFilter === 'D2C' && ch !== 'D2C') return false;
    if (channelFilter === 'B2B' && ch !== 'B2B') return false;

    // 3. Operational Date filter
    if (!matchesOperationalDate(b)) return false;

    // 4. Status filter
    const s = (b.status || 'pending').toLowerCase();
    if (statusFilter === 'pending_utr') {
      if (b.payment_verification_status !== 'Pending Verification') return false;
    } else if (statusFilter !== 'all' && s !== statusFilter.toLowerCase()) {
      return false;
    }

    // 4b. Customer Category Filter (ALL, INDIAN, FOREIGN)
    if (categoryFilter !== 'ALL') {
      const isIndianBooking = (b.customer_category === 'INDIAN' || (!b.customer_category && (b.customer_country_code === 'IN' || !b.customer_country_code || (b.customer_country || '').toLowerCase() === 'india')));
      const resolvedCategory = isIndianBooking ? 'INDIAN' : 'FOREIGN';
      if (resolvedCategory !== categoryFilter) return false;
    }

    // 5. Search query (includes UTR and Payment Reference)
    if (search.trim()) {
      const query = search.toLowerCase();
      const matchSearch =
        String(b.id || '').toLowerCase().includes(query) ||
        String(b.name || b.customer_name || '').toLowerCase().includes(query) ||
        String(b.phone || '').toLowerCase().includes(query) ||
        String(b.item_name || '').toLowerCase().includes(query) ||
        String(b.b2b_partner_name || '').toLowerCase().includes(query) ||
        String(b.email || '').toLowerCase().includes(query) ||
        String(b.payment_reference || '').toLowerCase().includes(query) ||
        String(b.customer_payment_utr || '').toLowerCase().includes(query) ||
        String(b.vendor_payout_reference || '').toLowerCase().includes(query) ||
        String(b.vendor_payout_utr || '').toLowerCase().includes(query) ||
        String(b.payment_verification_status || '').toLowerCase().includes(query) ||
        String(b.vendor_id || '').toLowerCase().includes(query);
      if (!matchSearch) return false;
    }

    return true;
  });

  const pendingUtrCount = useMemo(() => {
    return (bookingsList || []).filter(b => b.payment_verification_status === 'Pending Verification' && (b.status || '').toLowerCase() !== 'cancelled').length;
  }, [bookingsList]);

  // Dynamic counts calculated from current bookingsList (NEVER hardcoded)
  const serviceCounts = useMemo(() => ({
    ALL: bookingsList.length,
    VEHICLE: bookingsList.filter(b => getBookingServiceType(b) === 'VEHICLE').length,
    HOTEL: bookingsList.filter(b => getBookingServiceType(b) === 'HOTEL').length,
    TRIP: bookingsList.filter(b => getBookingServiceType(b) === 'TRIP').length,
    ACTIVITY: bookingsList.filter(b => getBookingServiceType(b) === 'ACTIVITY').length,
    FLIGHT: bookingsList.filter(b => getBookingServiceType(b) === 'FLIGHT').length,
  }), [bookingsList]);

  const channelCounts = useMemo(() => ({
    ALL: bookingsList.length,
    D2C: bookingsList.filter(b => getBookingChannel(b) === 'D2C').length,
    B2B: bookingsList.filter(b => getBookingChannel(b) === 'B2B').length,
  }), [bookingsList]);

  const categoryCounts = useMemo(() => ({
    ALL: bookingsList.length,
    INDIAN: bookingsList.filter(b => (b.customer_category === 'INDIAN' || (!b.customer_category && (b.customer_country_code === 'IN' || !b.customer_country_code || (b.customer_country || '').toLowerCase() === 'india')))).length,
    FOREIGN: bookingsList.filter(b => !(b.customer_category === 'INDIAN' || (!b.customer_category && (b.customer_country_code === 'IN' || !b.customer_country_code || (b.customer_country || '').toLowerCase() === 'india')))).length,
  }), [bookingsList]);

  const handleResetFilters = () => {
    setServiceFilter('ALL');
    setChannelFilter('ALL');
    setCategoryFilter('ALL');
    setDateFilter('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('all');
    setSearch('');
  };

  const isAnyFilterActive =
    serviceFilter !== 'ALL' ||
    channelFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    dateFilter !== 'ALL' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    statusFilter !== 'all' ||
    search.trim() !== '';

  // Calculate Metrics
  const totalCount = bookingsList.length;
  const confirmedCount = bookingsList.filter(b => (b.status || '').toLowerCase() === 'confirmed').length;
  const pendingCount = bookingsList.filter(b => (b.status || '').toLowerCase() === 'pending').length;
  const totalRevenue = bookingsList.reduce((sum, b) => sum + Number(b.total_amount || b.total_paid || b.price || 0), 0);

  // Handle Create Booking
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.item_name) {
      setFormError('Please fill in required fields (Customer Name, Phone, and Item).');
      return;
    }

    const isPkg = formData.serviceType === 'package' || formData.serviceType === 'custom';
    const isSd = formData.serviceType === 'selfdrive';
    const isCar = formData.serviceType === 'car';
    const isBike = formData.serviceType === 'bike';
    const isHotel = formData.serviceType === 'hotel';
    const isActivity = formData.serviceType === 'activity';
    const isVehicle = isSd || isCar || isBike;

    if (isVehicle) {
      const isSelfDrive = (!formData.driver_required || isBike);
      const eligibility = validateVehicleBookingEligibility(
        formData.date_of_birth,
        formData.pickup_date,
        isSelfDrive,
        formData.license
      );
      if (!eligibility.valid) {
        setFormError(eligibility.error);
        return;
      }
    }

    setActionLoading(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name,
        customer_name: formData.name,
        phone: formData.phone,
        customer_phone: formData.phone,
        email: formData.email || null,
        customer_email: formData.email || null,
        license: formData.license || '',
        date_of_birth: formData.date_of_birth || '',
        item_id: formData.item_id || (isActivity ? `act-${Date.now()}` : `item-${Date.now()}`),
        item_name: formData.item_name,
        package_name: formData.item_name,
        package_type: isPkg ? 'Trip Package' : (isSd ? 'Self Drive Package' : (isCar ? 'Car Rental' : (isBike ? 'Bike Rental' : (isHotel ? 'Hotel Stay' : (isActivity ? 'Sightseeing & Activity' : 'Trip Package'))))),
        type: isPkg ? 'package' : (isSd ? 'selfdrive' : (isCar ? 'car' : (isBike ? 'bike' : (isHotel ? 'hotel' : (isActivity ? 'activity' : 'package'))))),
        pickup_date: formData.pickup_date || null,
        drop_date: formData.drop_date || null,
        pickup_loc: formData.pickup_loc || 'Goa',
        total_amount: Number(formData.total_amount || 0),
        total_paid: Number(formData.amount_paid || formData.total_amount || 0),
        amount_paid: Number(formData.amount_paid || 0),
        remaining_amount: Math.max(0, Number(formData.total_amount || 0) - Number(formData.amount_paid || 0)),
        payment_method: formData.payment_method || 'Cash',
        status: formData.status || 'Confirmed',
        payment_status: formData.payment_status || 'Paid',
        customizations: formData.customizations || null,
        booking_days: 1
      };

      await api.createBooking(payload);
      setShowCreateModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        license: '',
        serviceType: 'hotel',
        item_id: '',
        item_name: '',
        pickup_date: '',
        drop_date: '',
        pickup_loc: 'Goa',
        total_amount: '',
        amount_paid: '',
        payment_method: 'Cash',
        status: 'Confirmed',
        payment_status: 'Paid',
        customizations: ''
      });
      await fetchLatestBookings();
      alert('Booking created successfully and saved to database!');
    } catch (err) {
      setFormError(err.message || 'Failed to create booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Update Status
  const handleQuickStatusChange = async (bookingId, newStatus, currentPaymentStatus = null) => {
    try {
      await api.updateBookingStatus(bookingId, newStatus, currentPaymentStatus);
      setBookingsList(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      if (editBooking && editBooking.id === bookingId) {
        setEditBooking(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editBooking) return;
    setActionLoading(true);
    try {
      await api.updateBookingStatus(editBooking.id, editBooking.status, editBooking.payment_status);
      setEditBooking(null);
      await fetchLatestBookings();
      alert('Booking updated successfully!');
    } catch (err) {
      alert('Failed to update booking: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Booking
  const handleDeleteBooking = async (id) => {
    if (!window.confirm(`Are you sure you want to delete Booking #${id}? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteBooking(id);
      setBookingsList(prev => prev.filter(b => b.id !== id));
      if (viewBooking?.id === id) setViewBooking(null);
      if (editBooking?.id === id) setEditBooking(null);
      await fetchLatestBookings();
    } catch (err) {
      alert('Failed to delete booking: ' + err.message);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1" style={{ color: '#0D1B2E', fontSize: '18px' }}>
            Booking Management
          </h5>
          <p className="mb-0 text-muted" style={{ fontSize: '0.82rem' }}>
            Track, create, update, and manage all customer reservations across hotels, vehicles, and trips.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {onNavigateToCalendar && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1.5 bg-white shadow-sm fw-semibold"
              onClick={onNavigateToCalendar}
              title="Open Availability & Reservation Calendar"
            >
              <Calendar size={14} />
              Availability Calendar
            </button>
          )}
          {onNavigateToPayments && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1.5 bg-white shadow-sm fw-bold"
              onClick={onNavigateToPayments}
              title="Open full Static QR payment verification and vendor settlement console"
            >
              <CreditCard size={14} />
              <span>Payment &amp; UTR Console</span>
              {pendingUtrCount > 0 && (
                <span className="badge bg-danger text-white rounded-pill px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                  {pendingUtrCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1.5 bg-white shadow-sm"
            onClick={fetchLatestBookings}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm px-3.5 py-2 rounded-3 d-flex align-items-center gap-2 fw-bold shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1e3a8a 100%)', border: 'none' }}
            onClick={() => { setFormError(''); setShowCreateModal(true); }}
          >
            <Plus size={16} />
            Create Booking
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #3b82f6' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Total Bookings</div>
                <div className="fs-4 fw-bold text-dark mt-1">{totalCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #10b981' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Confirmed</div>
                <div className="fs-4 fw-bold text-success mt-1">{confirmedCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-success-subtle text-success">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #f59e0b' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Pending Approval</div>
                <div className="fs-4 fw-bold text-warning mt-1">{pendingCount}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 rounded-3" style={{ background: '#fff', borderLeft: '4px solid #8b5cf6' }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small fw-semibold">Revenue Volume</div>
                <div className="fs-4 fw-bold text-dark mt-1">₹{totalRevenue.toLocaleString()}</div>
              </div>
              <div className="p-2.5 rounded-3 bg-purple-subtle text-purple" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                <DollarSign size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Control Center */}
      <div className="admin-filter-control-card">
        {/* Top Row: Search and Status Tabs */}
        <div className="row g-3 align-items-center mb-3 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
          <div className="col-12 col-lg-5">
            <div className="input-group">
              <span
                className="input-group-text border-end-0 text-muted"
                style={{ background: '#f8fafc', borderColor: '#e2e8f0', paddingLeft: '14px', paddingRight: '10px' }}
              >
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder="Search booking ID, customer name, phone, item..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: '#f8fafc',
                  borderColor: '#e2e8f0',
                  fontSize: '0.82rem',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  boxShadow: 'none'
                }}
              />
              {search && (
                <button
                  type="button"
                  className="btn border-start-0 text-muted"
                  style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
                  onClick={() => setSearch('')}
                  title="Clear Search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="col-12 col-lg-7 d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
            <span className="text-secondary fw-bold text-uppercase d-flex align-items-center gap-1.5 me-1" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
              <SlidersHorizontal size={13} className="text-muted" /> Status:
            </span>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              {['all', 'confirmed', 'pending', 'pending_utr', 'completed', 'cancelled'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={`admin-filter-pill ${statusFilter === tab ? 'active-navy' : ''}`}
                  onClick={() => setStatusFilter(tab)}
                >
                  {tab === 'pending_utr' ? (
                    <span className="d-flex align-items-center gap-1 text-warning fw-bold">
                      ⚡ UTR Pending ({pendingUtrCount})
                    </span>
                  ) : tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pending UTR Verification Alert Banner */}
        {pendingUtrCount > 0 && (
          <div className="alert alert-warning py-2 px-3 rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 shadow-xs border border-warning" style={{ background: '#fffbeb' }}>
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={16} className="text-warning flex-shrink-0" />
              <span className="text-xs fw-bold text-dark">
                {pendingUtrCount} customer booking{pendingUtrCount === 1 ? '' : 's'} with submitted Static QR UPI UTR awaiting verification!
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className={`btn btn-xs rounded-pill px-3 py-1 text-xxs fw-bold ${statusFilter === 'pending_utr' ? 'btn-warning text-dark' : 'btn-dark text-white'}`}
                onClick={() => setStatusFilter(statusFilter === 'pending_utr' ? 'all' : 'pending_utr')}
              >
                {statusFilter === 'pending_utr' ? 'Showing Pending UTRs ✓' : 'Filter Pending UTRs'}
              </button>
              {onNavigateToPayments && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline-primary rounded-pill px-3 py-1 text-xxs fw-bold bg-white"
                  onClick={onNavigateToPayments}
                >
                  Go to Payment Console →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Rows (Service, Channel, Date) */}
        <div className="d-flex flex-column gap-3 py-1">
          {/* Row 1: Service Filter */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="admin-filter-label">
              <Layers size={14} className="text-primary" />
              <span>Service:</span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
              <button
                type="button"
                className={`admin-filter-pill ${serviceFilter === 'ALL' ? 'active-navy' : ''}`}
                onClick={() => setServiceFilter('ALL')}
              >
                ALL <span className="admin-pill-badge">{serviceCounts.ALL}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${serviceFilter === 'VEHICLE' ? 'active-blue' : ''}`}
                onClick={() => setServiceFilter('VEHICLE')}
              >
                🚗 VEHICLE <span className="admin-pill-badge">{serviceCounts.VEHICLE}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${serviceFilter === 'HOTEL' ? 'active-indigo' : ''}`}
                onClick={() => setServiceFilter('HOTEL')}
              >
                🏨 HOTEL <span className="admin-pill-badge">{serviceCounts.HOTEL}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${serviceFilter === 'TRIP' ? 'active-emerald' : ''}`}
                onClick={() => setServiceFilter('TRIP')}
              >
                🌴 TRIP <span className="admin-pill-badge">{serviceCounts.TRIP}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${serviceFilter === 'ACTIVITY' ? 'active-teal' : ''}`}
                style={serviceFilter === 'ACTIVITY' ? { background: '#0D1B2E', color: '#fff', borderColor: '#0D1B2E' } : {}}
                onClick={() => setServiceFilter('ACTIVITY')}
              >
                🎯 SIGHTSEEING & ACTIVITY <span className="admin-pill-badge">{serviceCounts.ACTIVITY}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${serviceFilter === 'FLIGHT' ? 'active-sky' : ''}`}
                onClick={() => setServiceFilter('FLIGHT')}
              >
                ✈️ FLIGHT <span className="admin-pill-badge">{serviceCounts.FLIGHT}</span>
              </button>
            </div>
          </div>

          {/* Row 2: Channel Filter */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="admin-filter-label">
              <Radio size={14} className="text-info" />
              <span>Channel:</span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
              <button
                type="button"
                className={`admin-filter-pill ${channelFilter === 'ALL' ? 'active-navy' : ''}`}
                onClick={() => setChannelFilter('ALL')}
              >
                ALL <span className="admin-pill-badge">{channelCounts.ALL}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${channelFilter === 'D2C' ? 'active-blue' : ''}`}
                onClick={() => setChannelFilter('D2C')}
              >
                🔵 D2C <span className="admin-pill-badge">{channelCounts.D2C}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${channelFilter === 'B2B' ? 'active-amber' : ''}`}
                onClick={() => setChannelFilter('B2B')}
              >
                💼 B2B <span className="admin-pill-badge">{channelCounts.B2B}</span>
              </button>
            </div>
          </div>

          {/* Row 2b: Customer Category Filter (ALL, INDIAN, FOREIGN) */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="admin-filter-label">
              <span style={{ fontSize: '13px' }}>🌍</span>
              <span>Category:</span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-grow-1 flex-wrap">
              <button
                type="button"
                className={`admin-filter-pill ${categoryFilter === 'ALL' ? 'active-navy' : ''}`}
                onClick={() => setCategoryFilter('ALL')}
              >
                ALL <span className="admin-pill-badge">{categoryCounts.ALL}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${categoryFilter === 'INDIAN' ? 'active-emerald' : ''}`}
                onClick={() => setCategoryFilter('INDIAN')}
              >
                🇮🇳 INDIAN <span className="admin-pill-badge">{categoryCounts.INDIAN}</span>
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${categoryFilter === 'FOREIGN' ? 'active-blue' : ''}`}
                onClick={() => setCategoryFilter('FOREIGN')}
              >
                🌐 FOREIGN <span className="admin-pill-badge">{categoryCounts.FOREIGN}</span>
              </button>
            </div>
          </div>

          {/* Row 3: Operational Date Filter */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="admin-filter-label">
              <Calendar size={14} className="text-warning" />
              <span>Date:</span>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'ALL' ? 'active-navy' : ''}`}
                onClick={() => setDateFilter('ALL')}
              >
                ALL
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'TODAY' ? 'active-navy' : ''}`}
                onClick={() => setDateFilter('TODAY')}
              >
                TODAY
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'TOMORROW' ? 'active-navy' : ''}`}
                onClick={() => setDateFilter('TOMORROW')}
              >
                TOMORROW
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'THIS_WEEK' ? 'active-navy' : ''}`}
                onClick={() => setDateFilter('THIS_WEEK')}
              >
                THIS WEEK
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'THIS_MONTH' ? 'active-navy' : ''}`}
                onClick={() => setDateFilter('THIS_MONTH')}
              >
                THIS MONTH
              </button>
              <button
                type="button"
                className={`admin-filter-pill ${dateFilter === 'CUSTOM' ? 'active-blue' : ''}`}
                onClick={() => setDateFilter('CUSTOM')}
              >
                📅 CUSTOM DATE
              </button>
            </div>
          </div>

          {/* Row 4: Custom Date Picker Inputs (shown when dateFilter === 'CUSTOM') */}
          {dateFilter === 'CUSTOM' && (
            <div
              className="p-3 rounded-3 border d-flex align-items-center gap-3 flex-wrap mt-1"
              style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
            >
              <div className="d-flex align-items-center gap-1.5 text-dark fw-bold" style={{ fontSize: '0.78rem' }}>
                <Calendar size={14} className="text-primary" />
                <span>Custom Period:</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '0.74rem' }}>From:</span>
                <input
                  type="date"
                  className="form-control form-control-sm py-1 px-2.5 bg-white border"
                  style={{ width: 'auto', fontSize: '0.78rem', borderColor: '#cbd5e1' }}
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small fw-semibold" style={{ fontSize: '0.74rem' }}>To:</span>
                <input
                  type="date"
                  className="form-control form-control-sm py-1 px-2.5 bg-white border"
                  style={{ width: 'auto', fontSize: '0.78rem', borderColor: '#cbd5e1' }}
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary py-1 px-3 rounded-pill fw-semibold ms-auto"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                >
                  Clear Dates
                </button>
              )}
            </div>
          )}

          {/* Active Filter Summary Bar */}
          <div
            className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-2 pt-3 border-top"
            style={{ borderColor: '#f1f5f9' }}
          >
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div
                className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill"
                style={{ background: '#f1f5f9', fontSize: '0.76rem', color: '#475569' }}
              >
                <span>Showing</span>
                <strong className="text-dark fw-bold px-1.5 py-0.5 rounded" style={{ background: '#ffffff', color: '#0f172a' }}>
                  {filteredBookings.length}
                </strong>
                <span>of <strong>{bookingsList.length}</strong> total bookings</span>
              </div>

              {/* Active Filter Removable Tags / Chips */}
              {serviceFilter !== 'ALL' && (
                <span
                  className="admin-filter-chip bg-primary-subtle text-primary border border-primary-subtle"
                  onClick={() => setServiceFilter('ALL')}
                  title="Click to remove service filter"
                >
                  Service: {serviceFilter}
                  <X size={12} />
                </span>
              )}

              {channelFilter !== 'ALL' && (
                <span
                  className="admin-filter-chip bg-info-subtle text-info-emphasis border border-info-subtle"
                  onClick={() => setChannelFilter('ALL')}
                  title="Click to remove channel filter"
                >
                  Channel: {channelFilter}
                  <X size={12} />
                </span>
              )}

              {categoryFilter !== 'ALL' && (
                <span
                  className="admin-filter-chip bg-primary-subtle text-primary border border-primary-subtle"
                  onClick={() => setCategoryFilter('ALL')}
                  title="Click to remove category filter"
                >
                  Category: {categoryFilter}
                  <X size={12} />
                </span>
              )}

              {dateFilter !== 'ALL' && (
                <span
                  className="admin-filter-chip bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                  onClick={() => { setDateFilter('ALL'); setCustomStartDate(''); setCustomEndDate(''); }}
                  title="Click to remove date filter"
                >
                  Date: {dateFilter === 'CUSTOM' ? (customStartDate && customEndDate ? `${customStartDate} → ${customEndDate}` : 'Custom') : dateFilter}
                  <X size={12} />
                </span>
              )}

              {statusFilter !== 'all' && (
                <span
                  className="admin-filter-chip bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle text-capitalize"
                  onClick={() => setStatusFilter('all')}
                  title="Click to remove status filter"
                >
                  Status: {statusFilter}
                  <X size={12} />
                </span>
              )}

              {search.trim() && (
                <span
                  className="admin-filter-chip bg-light text-dark border"
                  onClick={() => setSearch('')}
                  title="Click to clear search query"
                >
                  Search: "{search}"
                  <X size={12} />
                </span>
              )}
            </div>

            {isAnyFilterActive && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold"
                style={{ fontSize: '0.74rem', transition: 'all 0.15s ease' }}
                onClick={handleResetFilters}
              >
                <RotateCcw size={13} />
                Reset All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden" style={{ background: '#fff' }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.83rem' }}>
            <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <tr>
                <th className="ps-3 py-3">Booking ID</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Service</th>
                <th className="py-3">Channel</th>
                <th className="py-3">Service Date</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Payment</th>
                <th className="pe-3 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    <Calendar size={36} className="text-muted opacity-50 mb-2" />
                    <div className="fw-semibold text-dark">No bookings found matching current filters.</div>
                    <div className="small text-muted mt-1">Try adjusting the Service, Channel, Date, or Status filters.</div>
                    {isAnyFilterActive && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary px-3 py-1 rounded-pill mt-2.5"
                        onClick={handleResetFilters}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const bId = b.id || b.booking_id;
                  const cName = b.name || b.customer_name || 'Customer';
                  const cPhone = b.phone || '—';
                  const itemName = b.item_name || b.service_name || 'Package / Stay';
                  const amount = Number(b.total_amount || b.total_paid || b.price || 0);
                  const svcType = getBookingServiceType(b);
                  const chType = getBookingChannel(b);
                  const svcDates = getBookingServiceDates(b);

                  return (
                    <tr key={bId}>
                      <td className="ps-3 fw-bold text-dark font-monospace" style={{ fontSize: '0.8rem' }}>
                        #{bId}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{cName}</div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{cPhone}</div>
                        {(() => {
                          const isIndianBooking = (b.customer_category === 'INDIAN' || (!b.customer_category && (b.customer_country_code === 'IN' || !b.customer_country_code || (b.customer_country || '').toLowerCase() === 'india')));
                          const cat = isIndianBooking ? 'INDIAN' : 'FOREIGN';
                          return (
                            <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
                              <span className={`badge rounded-pill px-2 py-0.5 fw-bold ${cat === 'INDIAN' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-primary-subtle text-primary border border-primary-subtle'}`} style={{ fontSize: '0.65rem' }}>
                                {cat === 'INDIAN' ? '🇮🇳 INDIAN' : '🌐 FOREIGN'}
                              </span>
                              {b.customer_country && (
                                <span className="badge rounded-pill bg-light text-dark border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                  {b.customer_country} {b.customer_country_code ? `(${b.customer_country_code})` : ''}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                        {b.email && <div className="text-muted text-xxs" style={{ fontSize: '0.68rem' }}>{b.email}</div>}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5 mb-1">
                          <ServiceBadge type={svcType} />
                        </div>
                        <div className="fw-semibold text-truncate text-dark" style={{ maxWidth: '200px' }} title={itemName}>
                          {itemName}
                        </div>
                        {b.pickup_loc && (
                          <div className="text-muted small d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.72rem' }}>
                            <MapPin size={11} /> {b.pickup_loc}
                          </div>
                        )}
                        {(['PICKUP', 'DROP', 'FULL'].includes(String(b.driver_service_type || '').toUpperCase()) || b.driver_required == 1 || b.driver_required === 'yes' || b.driver_required === true) && (
                          <div className="mt-1 d-flex align-items-center gap-1 flex-wrap">
                            <span className="badge rounded-pill bg-warning bg-opacity-25 text-dark fw-bold border border-warning" style={{ fontSize: '0.66rem' }}>
                              🚗 Driver: {b.driver_service_type || 'FULL'} (₹{b.driver_charge || (String(b.driver_service_type).toUpperCase() === 'FULL' ? (800 * Math.max(1, parseInt(b.driver_days || b.booking_days || 1))) : 400)})
                            </span>
                            {b.assigned_driver_id ? (
                              <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle fw-semibold" style={{ fontSize: '0.66rem' }}>
                                🟢 Driver: {b.assigned_driver_name || b.assigned_driver_id} {b.assigned_driver_phone ? `(${b.assigned_driver_phone})` : ''} • {b.driver_job_status || 'Accepted'}
                              </span>
                            ) : (
                              <div className="d-flex align-items-center gap-1">
                                <span className="badge rounded-pill bg-warning-subtle text-dark border border-warning-subtle fw-bold" style={{ fontSize: '0.64rem' }}>
                                  ⚡ Open for Driver First-Accept
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-xs py-0 px-2 fw-bold text-white rounded-pill"
                                  style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.65rem' }}
                                  onClick={() => {
                                    setAssigningBooking(b);
                                    setSelectedDriverId('');
                                    setAssignNotes('');
                                  }}
                                >
                                  + Manual Assign
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <ChannelBadge
                          channel={chType}
                          mode={b.b2b_mode}
                          partnerName={b.b2b_partner_name}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1.5 fw-semibold text-dark" style={{ fontSize: '0.80rem' }}>
                          <Calendar size={13} className="text-primary flex-shrink-0" />
                          <span>{formatServiceDateRange(svcDates.start, svcDates.end)}</span>
                        </div>
                        {svcDates.start && svcDates.end && svcDates.start !== svcDates.end && (
                          <div className="text-muted text-xxs mt-0.5" style={{ fontSize: '0.70rem' }}>
                            {svcDates.start} → {svcDates.end}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold text-dark">₹{amount.toLocaleString('en-IN')} <span className="text-muted text-xxs font-monospace">INR</span></div>
                        {b.customer_currency && b.customer_currency !== 'INR' && b.converted_display_amount && (
                          <div className="text-primary fw-semibold mt-0.5" style={{ fontSize: '0.72rem' }} title={`Exchange Rate: 1 INR = ${b.exchange_rate_used} ${b.customer_currency}`}>
                            {b.customer_currency} {Number(b.converted_display_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-muted text-xxs d-block" style={{ fontSize: '0.65rem' }}>
                              Rate: {Number(b.exchange_rate_used || 0).toFixed(4)}
                            </span>
                          </div>
                        )}
                        {b.amount_paid !== undefined && (
                          <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                            Paid: ₹{Number(b.amount_paid || 0).toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm py-0.5 px-2 fw-semibold rounded-pill border-0 shadow-none"
                          style={{
                            width: 'auto',
                            fontSize: '0.75rem',
                            background: b.status === 'Completed' ? '#dcfce7' : b.status === 'Confirmed' ? '#dbeafe' : (b.status === 'Cancelled' || b.status === 'Rejected') ? '#fee2e2' : '#fef9c3',
                            color: b.status === 'Completed' ? '#059669' : b.status === 'Confirmed' ? '#1d4ed8' : (b.status === 'Cancelled' || b.status === 'Rejected') ? '#991b1b' : '#854d0e',
                            cursor: 'pointer'
                          }}
                          value={b.status || 'Pending'}
                          onChange={e => handleQuickStatusChange(bId, e.target.value, b.payment_status)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td>
                        <PaymentBadge status={b.payment_status} />
                        {(b.customer_payment_utr || b.payment_reference) ? (
                          <div className="mt-1" title="Customer Payment UTR (Customer → Vendor)">
                            <span className="badge font-monospace text-primary bg-primary bg-opacity-10 border border-primary border-opacity-25 px-1.5 py-0.5" style={{ fontSize: '0.70rem', letterSpacing: '0.3px' }}>
                              Cust UTR: {b.customer_payment_utr || b.payment_reference}
                            </span>
                          </div>
                        ) : (
                          <div className="text-muted text-xxs mt-0.5">{b.payment_method || 'Cash / Offline'}</div>
                        )}
                        {(b.vendor_payout_utr || b.vendor_payout_reference) && (
                          <div className="mt-0.5" title="Historical Settlement UTR">
                            <span className="badge font-monospace bg-light text-secondary border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                              Vendor UTR: {b.vendor_payout_utr || b.vendor_payout_reference}
                            </span>
                          </div>
                        )}
                        {b.payment_verification_status && (
                          <div className="mt-1">
                            <span className={`badge rounded-pill text-xxs ${
                              b.payment_verification_status === 'Approved' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' :
                              b.payment_verification_status === 'Rejected' ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' :
                              'bg-warning bg-opacity-20 text-warning-emphasis border border-warning'
                            }`}>
                              {b.payment_verification_status === 'Pending Verification' ? '⏳ UTR Pending Verification' : b.payment_verification_status}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="pe-3 text-end">
                        <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
                          {b.payment_verification_status === 'Pending Verification' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success text-white fw-bold px-2 py-0.5 rounded-pill shadow-xs"
                              style={{ fontSize: '0.68rem' }}
                              title={`Approve Customer Payment UTR ${b.customer_payment_utr || b.payment_reference} & confirm booking`}
                              onClick={async () => {
                                try {
                                  const res = await api.adminVerifyPayment(bId, 'Approved', 'Verified from Bookings table');
                                  if (res && (res.success || res.status === 'success')) {
                                    await fetchLatestBookings();
                                    alert(`Booking #${bId} payment verified & booking confirmed!`);
                                  } else {
                                    alert(res?.error || res?.message || 'Failed to verify payment');
                                  }
                                } catch(e) {
                                  alert(e.message || 'Failed to verify payment');
                                }
                              }}
                            >
                              ✓ Approve UTR
                            </button>
                          )}
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-light btn-sm text-secondary"
                              title="View Details"
                              onClick={() => setViewBooking(b)}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-light btn-sm text-primary"
                              title="Edit Booking"
                              onClick={() => setEditBooking({ ...b })}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-light btn-sm text-danger"
                              title="Delete Booking"
                              onClick={() => handleDeleteBooking(bId)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BOOKING MODAL */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom py-3 px-4" style={{ background: '#f8fafc' }}>
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <Calendar size={18} className="text-primary" />
                  Create New Manual Booking
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                      <AlertCircle size={16} /> {formError}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Customer Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-2"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Kulkarni"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Phone Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-2"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-sm rounded-2"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="customer@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Pickup Location</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-2"
                        value={formData.pickup_loc}
                        onChange={e => setFormData({ ...formData, pickup_loc: e.target.value })}
                        placeholder="e.g. Dabolim Airport, Goa"
                      />
                    </div>

                    {(formData.serviceType === 'car' || formData.serviceType === 'bike' || formData.serviceType === 'selfdrive') && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">Date of Birth *</label>
                          <input
                            type="date"
                            className="form-control form-control-sm rounded-2"
                            value={formData.date_of_birth}
                            onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-secondary">
                            Driving License No. {!formData.driver_required && <span className="text-danger">*</span>}
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-2"
                            value={formData.license}
                            onChange={e => setFormData({ ...formData, license: e.target.value })}
                            placeholder="e.g. DL-1420180098765"
                            required={!formData.driver_required}
                          />
                        </div>
                      </>
                    )}

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Service Type</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.serviceType}
                        onChange={e => {
                          const type = e.target.value;
                          setFormData({ ...formData, serviceType: type, item_name: '', item_id: '' });
                        }}
                      >
                        <option value="package">Trip Package</option>
                        <option value="selfdrive">Self-Drive Holiday</option>
                        <option value="hotel">Hotel Stay</option>
                        <option value="car">Self-Drive Car Rental</option>
                        <option value="bike">Rental Bike</option>
                        <option value="activity">Sightseeing & Activity</option>
                        <option value="custom">Custom Trip Package</option>
                      </select>
                    </div>

                    <div className="col-md-8">
                      <label className="form-label small fw-bold text-secondary">Select / Enter Item Name *</label>
                      {formData.serviceType === 'hotel' && hotels.length > 0 ? (
                        <select
                          className="form-select form-select-sm rounded-2"
                          value={formData.item_id}
                          onChange={e => {
                            const h = hotels.find(x => x.id === e.target.value);
                            setFormData({
                              ...formData,
                              item_id: e.target.value,
                              item_name: h ? h.name : '',
                              total_amount: h ? String(h.price || '') : formData.total_amount
                            });
                          }}
                          required
                        >
                          <option value="">-- Choose Hotel Property --</option>
                          {hotels.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (₹{h.price}/night)</option>
                          ))}
                        </select>
                      ) : formData.serviceType === 'car' && cars.length > 0 ? (
                        <select
                          className="form-select form-select-sm rounded-2"
                          value={formData.item_id}
                          onChange={e => {
                            const c = cars.find(x => x.id === e.target.value);
                            setFormData({
                              ...formData,
                              item_id: e.target.value,
                              item_name: c ? c.name : '',
                              total_amount: c ? String(c.price || '') : formData.total_amount
                            });
                          }}
                          required
                        >
                          <option value="">-- Choose Rental Car --</option>
                          {cars.map(c => (
                            <option key={c.id} value={c.id}>{c.name} (₹{c.price}/day)</option>
                          ))}
                        </select>
                      ) : formData.serviceType === 'bike' && bikes.length > 0 ? (
                        <select
                          className="form-select form-select-sm rounded-2"
                          value={formData.item_id}
                          onChange={e => {
                            const b = bikes.find(x => x.id === e.target.value);
                            setFormData({
                              ...formData,
                              item_id: e.target.value,
                              item_name: b ? b.name : '',
                              total_amount: b ? String(b.price || '') : formData.total_amount
                            });
                          }}
                          required
                        >
                          <option value="">-- Choose Rental Bike --</option>
                          {bikes.map(b => (
                            <option key={b.id} value={b.id}>{b.name} (₹{b.price}/day)</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-control form-control-sm rounded-2"
                          value={formData.item_name}
                          onChange={e => setFormData({ ...formData, item_name: e.target.value, item_id: 'custom-' + Date.now() })}
                          placeholder="e.g. 4D3N Luxury Goa Tour"
                          required
                        />
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Pickup / Check-in Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm rounded-2"
                        value={formData.pickup_date}
                        onChange={e => setFormData({ ...formData, pickup_date: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Drop / Check-out Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm rounded-2"
                        value={formData.drop_date}
                        onChange={e => setFormData({ ...formData, drop_date: e.target.value })}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Total Amount (₹) *</label>
                      <input
                        type="number"
                        className="form-control form-control-sm rounded-2"
                        value={formData.total_amount}
                        onChange={e => setFormData({ ...formData, total_amount: e.target.value })}
                        placeholder="e.g. 15000"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Amount Paid (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm rounded-2"
                        value={formData.amount_paid}
                        onChange={e => setFormData({ ...formData, amount_paid: e.target.value })}
                        placeholder="e.g. 5000"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-bold text-secondary">Payment Method</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.payment_method}
                        onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                      >
                        <option value="Cash">Cash on Delivery</option>
                        <option value="UPI">UPI / GPay / PhonePe</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Razorpay">Razorpay Gateway</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Initial Booking Status</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-secondary">Payment Status</label>
                      <select
                        className="form-select form-select-sm rounded-2"
                        value={formData.payment_status}
                        onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                      >
                        <option value="Paid">Paid (Full)</option>
                        <option value="Partial">Partial (Advance)</option>
                        <option value="Pending">Pending / Unpaid</option>
                      </select>
                    </div>
                    <div className="col-12 mt-1">
                      <div className="form-check p-2 rounded bg-light border">
                        <input
                          type="checkbox"
                          className="form-check-input ms-0 me-2"
                          id="admin_drv_req"
                          checked={formData.driver_required == 1}
                          onChange={e => setFormData({ ...formData, driver_required: e.target.checked ? 1 : 0 })}
                        />
                        <label className="form-check-label small fw-bold text-dark" htmlFor="admin_drv_req">
                          🚗 Require Private Driver / Chauffeur for this booking
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-4 fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Create Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BOOKING DETAILS MODAL */}
      {viewBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white py-3 px-4">
                <h5 className="modal-title fw-bold fs-6">Booking #{viewBooking.id || viewBooking.booking_id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewBooking(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Status:</span>
                  <StatusBadge status={viewBooking.status} />
                </div>
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Payment:</span>
                  <PaymentBadge status={viewBooking.payment_status} />
                </div>
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Service:</span>
                  <ServiceBadge type={getBookingServiceType(viewBooking)} />
                </div>
                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Channel:</span>
                  <ChannelBadge
                    channel={getBookingChannel(viewBooking)}
                    mode={viewBooking.b2b_mode}
                    partnerName={viewBooking.b2b_partner_name}
                  />
                </div>
                <hr className="my-2 text-muted opacity-25" />
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="text-muted small">Customer Name</div>
                    <div className="fw-bold">{viewBooking.name || viewBooking.customer_name || '—'}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Phone</div>
                    <div className="fw-bold">{viewBooking.phone || '—'}</div>
                  </div>
                  <div className="col-12 mt-2">
                    <div className="text-muted small">Service / Item</div>
                    <div className="fw-semibold text-primary">{viewBooking.item_name || '—'}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Service / Travel Dates</div>
                    <div className="small fw-semibold text-dark">
                      {formatServiceDateRange(getBookingServiceDates(viewBooking).start, getBookingServiceDates(viewBooking).end)}
                    </div>
                    {getBookingServiceDates(viewBooking).start && (
                      <div className="text-muted text-xxs mt-0.5">
                        {getBookingServiceDates(viewBooking).start} to {getBookingServiceDates(viewBooking).end}
                      </div>
                    )}
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Pickup Location</div>
                    <div className="small">{viewBooking.pickup_loc || 'Goa'}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Total Price</div>
                    <div className="fw-bold fs-6 text-dark">₹{Number(viewBooking.total_amount || viewBooking.total_paid || 0).toLocaleString()}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted small">Payment Method</div>
                    <div className="small fw-semibold">{viewBooking.payment_method || 'Cash / Offline'}</div>
                  </div>

                  {/* Customer Country, Dial Code & Currency Snapshot */}
                  <div className="col-12 mt-2 p-2.5 rounded-3 bg-light border">
                    <div className="fw-bold text-dark text-xxs text-uppercase mb-2 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5">
                        <span>🌍 Customer Country & Currency Snapshot</span>
                        <span
                          className="badge rounded-pill fw-bold"
                          style={{
                            fontSize: '0.68rem',
                            letterSpacing: '0.4px',
                            color: String(viewBooking.customer_category || '').toUpperCase() === 'FOREIGN' || (viewBooking.customer_country_iso && viewBooking.customer_country_iso !== 'IN') ? '#7c3aed' : '#059669',
                            backgroundColor: String(viewBooking.customer_category || '').toUpperCase() === 'FOREIGN' || (viewBooking.customer_country_iso && viewBooking.customer_country_iso !== 'IN') ? '#f3e8ff' : '#ecfdf5',
                            border: `1px solid ${String(viewBooking.customer_category || '').toUpperCase() === 'FOREIGN' || (viewBooking.customer_country_iso && viewBooking.customer_country_iso !== 'IN') ? '#ddd6fe' : '#a7f3d0'}`
                          }}
                        >
                          {String(viewBooking.customer_category || '').toUpperCase() === 'FOREIGN' || (viewBooking.customer_country_iso && viewBooking.customer_country_iso !== 'IN') ? '✈️ FOREIGN' : '🇮🇳 INDIAN'}
                        </span>
                      </div>
                      <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-1.5 py-0.5">
                        {viewBooking.customer_currency || 'INR'}
                      </span>
                    </div>
                    <div className="row g-2 text-xs">
                      <div className="col-4">
                        <span className="text-muted d-block text-xxs">Customer Country</span>
                        <span className="fw-bold text-dark">{viewBooking.customer_country || 'India'}</span>
                      </div>
                      <div className="col-4">
                        <span className="text-muted d-block text-xxs">Customer Category</span>
                        <span className="fw-bold" style={{ color: String(viewBooking.customer_category || '').toUpperCase() === 'FOREIGN' || (viewBooking.customer_country_iso && viewBooking.customer_country_iso !== 'IN') ? '#7c3aed' : '#059669' }}>
                          {String(viewBooking.customer_category || '').toUpperCase() === 'FOREIGN' || (viewBooking.customer_country_iso && viewBooking.customer_country_iso !== 'IN') ? 'FOREIGN' : 'INDIAN'}
                        </span>
                      </div>
                      <div className="col-4">
                        <span className="text-muted d-block text-xxs">Dial / ISO Code</span>
                        <span className="fw-semibold text-dark font-monospace">{viewBooking.customer_country_code || '+91'}</span>
                      </div>
                      <div className="col-4 mt-1">
                        <span className="text-muted d-block text-xxs">Currency Code</span>
                        <span className="fw-bold text-primary font-monospace">{viewBooking.customer_currency || 'INR'}</span>
                      </div>
                      <div className="col-4 mt-1">
                        <span className="text-muted d-block text-xxs">Base Price (INR)</span>
                        <span className="fw-bold text-dark">₹{Number(viewBooking.total_amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="col-4 mt-1">
                        <span className="text-muted d-block text-xxs">Display Amount</span>
                        <span className="fw-bold text-success font-heading">
                          {viewBooking.converted_display_amount ? `${viewBooking.customer_currency} ${Number(viewBooking.converted_display_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '₹' + Number(viewBooking.total_amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="col-4 mt-1">
                        <span className="text-muted d-block text-xxs">Exchange Rate</span>
                        <span className="fw-semibold font-monospace">{viewBooking.exchange_rate_used ? Number(viewBooking.exchange_rate_used).toFixed(4) : '1.0000'}</span>
                      </div>
                      {viewBooking.currency_rate_timestamp && (
                        <div className="col-8 mt-1">
                          <span className="text-muted text-xxs">Rate Snapshot Taken: {viewBooking.currency_rate_timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Split & Two-UTR Breakdown */}
                <div className="rounded-3 mb-3 p-3 border" style={{ background: '#f8fafc' }}>
                  <div className="fw-bold text-dark text-xs mb-2 pb-1 border-bottom d-flex justify-content-between">
                    <span>Payment &amp; Platform Fee Breakdown</span>
                    <span className="text-muted text-xxs">Direct Vendor Payment Flow</span>
                  </div>

                  {/* 1. Customer Payment Box */}
                  <div className="p-2.5 rounded-3 mb-2 bg-white border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark text-xs">Customer Direct Payment (Customer → Vendor)</span>
                      <span className={`badge rounded-pill text-xxs ${viewBooking.payment_verification_status === 'Approved' || viewBooking.payment_verification_status === 'Verified' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                        {viewBooking.payment_verification_status || 'Paid to Vendor'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between text-xs">
                      <span className="text-muted">Amount Paid:</span>
                      <strong className="text-dark">₹{Number(viewBooking.customer_payment || viewBooking.total_amount || 0).toLocaleString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between text-xs mt-1">
                      <span className="text-muted">Customer UTR:</span>
                      <span className="badge font-monospace text-primary bg-primary bg-opacity-10 border border-primary border-opacity-25 px-2 py-0.5 text-xs">
                        {viewBooking.customer_payment_utr || viewBooking.payment_reference || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* WOW GOA Platform Fee */}
                  <div className="d-flex justify-content-between text-xs py-1 px-1 text-success mb-1">
                    <span>WOW GOA Platform Fee (Debited from Vendor Wallet):</span>
                    <strong>₹{Number(viewBooking.wow_goa_platform_fee || (Number(viewBooking.customer_payment || viewBooking.total_amount || 0) * 0.10)).toLocaleString()}</strong>
                  </div>

                  {/* Historical Settlement Box (Only shown if historical payout exists) */}
                  {viewBooking.vendor_payout_status === 'Settled' && (
                    <div className="p-2.5 rounded-3 border mt-2" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-success text-xs">Historical Settlement Record</span>
                        <span className="badge bg-success text-white text-xxs">Settled</span>
                      </div>
                      <div className="d-flex justify-content-between text-xs">
                        <span className="text-muted">Settled Amount:</span>
                        <strong className="text-success font-heading fs-6">
                          ₹{Number(viewBooking.vendor_service_amount || (Number(viewBooking.customer_payment || viewBooking.total_amount || 0) * 0.90)).toLocaleString()}
                        </strong>
                      </div>
                      {viewBooking.vendor_payout_utr && (
                        <div className="d-flex justify-content-between text-xs mt-1">
                          <span className="text-muted">Settlement UTR:</span>
                          <span className="badge font-monospace bg-light text-secondary border px-2 py-0.5 text-xs">
                            {viewBooking.vendor_payout_utr}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cancellation Audit (If Cancelled) */}
                {(viewBooking.status || '').toLowerCase() === 'cancelled' && (
                  <div className="p-3 rounded-3 mb-2" style={{ background: '#fef2f2', border: '1px solid #fee2e2' }}>
                    <div className="fw-bold text-danger text-xs mb-1">Cancellation Audit Record</div>
                    <div className="row g-2 text-xxs text-dark">
                      <div className="col-6">
                        <strong>Requested At:</strong> {viewBooking.cancellation_requested_at || '—'}
                      </div>
                      <div className="col-6">
                        <strong>Applied Rule:</strong> {viewBooking.cancellation_rule_applied || '—'}
                      </div>
                      <div className="col-6">
                        <strong>Refund %:</strong> {viewBooking.cancellation_refund_percentage}%
                      </div>
                      <div className="col-6">
                        <strong>Refund to Customer:</strong> ₹{viewBooking.cancellation_refund_amount}
                      </div>
                      <div className="col-6">
                        <strong>Retained Platform Fee:</strong> ₹{viewBooking.cancellation_platform_fee}
                      </div>
                      <div className="col-12">
                        <strong>Reason:</strong> {viewBooking.cancellation_reason || '—'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Driver Requirement Info */}
                <div className="p-3 rounded-3 bg-light border mt-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="small fw-bold text-dark">
                      Driver Requirement:
                    </span>
                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${(['PICKUP', 'DROP', 'FULL'].includes(String(viewBooking.driver_service_type || '').toUpperCase()) || viewBooking.driver_required == 1 || viewBooking.driver_required === 'yes') ? 'bg-warning text-dark' : 'bg-secondary-subtle text-secondary'}`} style={{ fontSize: '0.72rem' }}>
                      {viewBooking.driver_service_type ? `🚗 YES (${viewBooking.driver_service_type})` : ((viewBooking.driver_required == 1 || viewBooking.driver_required === 'yes') ? '🚗 YES (Driver Required)' : 'NO (Self Drive / Unrequested)')}
                    </span>
                  </div>
                  {(['PICKUP', 'DROP', 'FULL'].includes(String(viewBooking.driver_service_type || '').toUpperCase()) || viewBooking.driver_required == 1 || viewBooking.driver_required === 'yes') && (
                    <div className="mt-2 pt-2 border-top">
                      {viewBooking.assigned_driver_id ? (
                        <div className="small">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Assigned Driver:</span>
                            <span className="fw-bold text-success">
                              {viewBooking.assigned_driver_name || viewBooking.assigned_driver_id} ({viewBooking.driver_job_status || 'Accepted'})
                            </span>
                          </div>
                          {viewBooking.assigned_driver_phone && (
                            <div className="d-flex justify-content-between align-items-center mt-1">
                              <span className="text-muted">Driver Contact:</span>
                              <span className="fw-semibold text-dark">{viewBooking.assigned_driver_phone}</span>
                            </div>
                          )}
                          {viewBooking.assigned_driver_vehicle && (
                            <div className="d-flex justify-content-between align-items-center mt-1">
                              <span className="text-muted">Assigned Vehicle:</span>
                              <span className="text-dark">{viewBooking.assigned_driver_vehicle}</span>
                            </div>
                          )}
                          <div className="d-flex justify-content-between align-items-center mt-1 border-top pt-1">
                            <span className="text-muted">Driver Service & Fee:</span>
                            <span className="fw-bold text-dark">{viewBooking.driver_service_type || 'FULL'} • ₹{Number(viewBooking.driver_charge || (String(viewBooking.driver_service_type).toUpperCase() === 'FULL' ? (800 * Math.max(1, parseInt(viewBooking.driver_days || viewBooking.booking_days || 1))) : 400)).toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <span className="text-muted">Driver Earning Payout:</span>
                            <span className="fw-bold text-success">₹{Number(viewBooking.driver_earning || viewBooking.driver_charge || (String(viewBooking.driver_service_type).toUpperCase() === 'FULL' ? (800 * Math.max(1, parseInt(viewBooking.driver_days || viewBooking.booking_days || 1))) : 400)).toLocaleString()} • {viewBooking.driver_payment_status || (viewBooking.driver_job_status === 'Completed' ? 'Payable' : 'Pending')}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted small">No driver assigned yet.</span>
                          <button
                            type="button"
                            className="btn btn-sm text-white fw-bold px-3 py-1 rounded-pill shadow-sm"
                            style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.75rem' }}
                            onClick={() => {
                              setAssigningBooking(viewBooking);
                              setViewBooking(null);
                            }}
                          >
                            Assign Driver Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top py-2 px-4 bg-light">
                <button type="button" className="btn btn-sm btn-secondary px-3" onClick={() => setViewBooking(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom py-3 px-4 bg-light">
                <h5 className="modal-title fw-bold fs-6">Edit Booking #{editBooking.id}</h5>
                <button type="button" className="btn-close" onClick={() => setEditBooking(null)} />
              </div>
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Booking Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={editBooking.status || 'Pending'}
                      onChange={e => setEditBooking({ ...editBooking, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Payment Status</label>
                    <select
                      className="form-select form-select-sm"
                      value={editBooking.payment_status || 'Pending'}
                      onChange={e => setEditBooking({ ...editBooking, payment_status: e.target.value })}
                    >
                      <option value="Paid">Paid (Full)</option>
                      <option value="Partial">Partial (Advance)</option>
                      <option value="Pending">Pending / Unpaid</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top py-2 px-4 bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setEditBooking(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary px-4 fw-bold" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN DRIVER MODAL */}
      {assigningBooking && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(11,25,44,0.6)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header text-white py-3 px-4" style={{ background: '#0D1B2E' }}>
                <h5 className="modal-title fw-bold fs-6">Assign Driver — Booking #{assigningBooking.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setAssigningBooking(null)} />
              </div>
              <form onSubmit={handleAssignDriverSubmit}>
                <div className="modal-body p-4">
                  <div className="p-3 rounded bg-light border mb-3 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Customer:</span>
                      <span className="fw-bold">{assigningBooking.name || assigningBooking.customer_name} ({assigningBooking.phone})</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Pickup Location:</span>
                      <span className="fw-bold">{assigningBooking.pickup_loc || 'Goa'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Service / Item:</span>
                      <span className="fw-bold">{assigningBooking.item_name}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Select Approved / Active Driver *
                    </label>
                    <select
                      className="form-select form-select-sm fw-semibold"
                      value={selectedDriverId}
                      onChange={e => setSelectedDriverId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Approved Driver --</option>
                      {driversList.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active').map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.phone} • {d.vehicle_details || 'Commercial'} • Status: {d.status})
                        </option>
                      ))}
                    </select>
                    {driversList.filter(d => (d.status || '').toLowerCase() === 'approved' || (d.status || '').toLowerCase() === 'active').length === 0 && (
                      <div className="text-danger small mt-1">
                        No approved drivers available. Please approve drivers in Driver Management.
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      Assignment Notes / Instructions (Optional)
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="2"
                      placeholder="e.g. Airport pickup at arrival gate 2..."
                      value={assignNotes}
                      onChange={e => setAssignNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top py-2.5 px-4 bg-light">
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAssigningBooking(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm px-4 fw-bold text-white shadow-sm"
                    style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}
                    disabled={actionLoading || !selectedDriverId}
                  >
                    {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
