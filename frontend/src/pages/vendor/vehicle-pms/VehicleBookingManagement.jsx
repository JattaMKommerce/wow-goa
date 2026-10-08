import React, { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Clock, ArrowRight, AlertCircle, CheckCircle, Car, Filter, Download, Plus, Edit, Trash2, Save, Calendar, User, Phone, Mail, DollarSign, Key, ShieldCheck, Loader2, RotateCcw, Send, FileText } from 'lucide-react';
import { createBooking, updateBooking, updateBookingStatus, deleteBooking, updateBookingHandover, fetchVehicleUnits, sendBookingVoucherEmail } from '../../../services/api';
import WalletRechargeRequiredModal from '../../../components/vendor/WalletRechargeRequiredModal';
import BookingVoucher from '../../../components/common/BookingVoucher';
import { validateVehicleBookingEligibility } from '../../../utils/dateUtils';

const WORKFLOW_STEPS = ['Pending', 'Payment Verification', 'Confirmed', 'Pickup', 'Return', 'Completed'];
const STATUS_COLORS = {
  'Pending': { bg: '#fef9c3', color: '#ca8a04' },
  'Payment Verification': { bg: '#dbeafe', color: '#2563eb' },
  'Confirmed': { bg: '#dcfce7', color: '#16a34a' },
  'Pickup': { bg: '#ede9fe', color: '#7c3aed' },
  'Return': { bg: '#fce7f3', color: '#be185d' },
  'Completed': { bg: '#dcfce7', color: '#059669' },
  'Cancelled': { bg: '#fee2e2', color: '#dc2626' },
  'Rejected': { bg: '#fee2e2', color: '#dc2626' },
};

function StatusBadge({ status, handover_status }) {
  const isCompleted = status === 'Completed' || handover_status === 'Returned';
  const isHandedOver = !isCompleted && (status === 'Pickup' || handover_status === 'Handed Over' || handover_status === 'Active Trip');

  if (isCompleted) {
    return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#059669', fontSize: '0.65rem', textTransform: 'uppercase' }}>COMPLETED</span>;
  }
  if (isHandedOver) {
    return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.65rem', textTransform: 'uppercase' }}>HANDED OVER</span>;
  }
  const s = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: s.bg, color: s.color, fontSize: '0.65rem', textTransform: 'uppercase' }}>{status || 'Pending'}</span>;
}

function WorkflowBadge({ status, handover_status }) {
  const isCompleted = status === 'Completed' || handover_status === 'Returned';
  let effectiveStatus = status;
  if (isCompleted) {
    effectiveStatus = 'Completed';
  } else if (handover_status === 'Handed Over' || handover_status === 'Active Trip') {
    if (['Pending', 'Payment Verification', 'Confirmed'].includes(status)) {
      effectiveStatus = 'Pickup';
    }
  }
  const idx = WORKFLOW_STEPS.indexOf(effectiveStatus);
  return (
    <div className="d-flex align-items-center gap-1">
      {WORKFLOW_STEPS.map((step, i) => {
        const isDone = isCompleted || i < idx;
        const isCurrent = !isCompleted && i === idx;
        return (
          <React.Fragment key={step}>
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center" 
              title={step} 
              style={{ 
                width: '18px', 
                height: '18px', 
                background: isDone ? '#16a34a' : isCurrent ? '#FF6333' : '#e2e8f0', 
                flexShrink: 0 
              }}
            >
              {isDone && <Check size={10} style={{ color: '#fff' }} />}
              {isCurrent && <div className="rounded-circle" style={{ width: '6px', height: '6px', background: '#fff' }} />}
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div 
                style={{ 
                  width: '8px', 
                  height: '2px', 
                  background: isDone ? '#16a34a' : '#e2e8f0' 
                }} 
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function VehicleBookingManagement({ bookings = [], cars = [], bikes = [], initialStatus, setBookingsList, currentUser, onNavigate }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'all');
  const [selected, setSelected] = useState(null);
  const [localBookings, setLocalBookings] = useState(bookings || []);
  const [blockedModal, setBlockedModal] = useState({
    show: false,
    balance: 0,
    negativeBookingCount: 0,
    maxNegativeBookings: 2
  });

  // Keep local bookings in sync when parent bookings prop updates
  useEffect(() => {
    if (bookings && Array.isArray(bookings)) {
      setLocalBookings(bookings);
    }
  }, [bookings]);

  useEffect(() => {
    if (initialStatus) {
      setStatusFilter(initialStatus);
    }
  }, [initialStatus]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Handover & Trip Tracking Modal states
  const [handoverModalBooking, setHandoverModalBooking] = useState(null);
  const [handoverForm, setHandoverForm] = useState({
    assigned_vehicle_plate: '',
    physical_unit_id: '',
    handover_status: 'Handed Over',
    handover_odometer: '',
    return_odometer: '',
    handover_fuel: '100% Full Tank',
    return_fuel: '100% Full Tank',
    deposit_amount: 0,
    deposit_status: 'Paid via UPI',
    delivery_agent_name: '',
    delivery_agent_phone: ''
  });
  const [vehicleUnitsList, setVehicleUnitsList] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [savingHandover, setSavingHandover] = useState(false);
  const [handoverMsg, setHandoverMsg] = useState('');
  const [handoverError, setHandoverError] = useState('');

  // Customer Voucher Email Dispatch state
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState(null);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [showEmailOverrideModal, setShowEmailOverrideModal] = useState(false);
  const [selectedVoucherModal, setSelectedVoucherModal] = useState(null);

  const handleDispatchVoucherEmail = async (booking, overrideEmail = null) => {
    if (!booking) return;
    const targetEmail = (overrideEmail || booking.email || customEmailInput || '').trim();
    if (!targetEmail || targetEmail.includes('@guest.wowgoa.com') || !targetEmail.includes('@')) {
      setShowEmailOverrideModal(true);
      setCustomEmailInput(booking.email && !booking.email.includes('@guest.wowgoa.com') ? booking.email : '');
      return;
    }

    setIsEmailSending(true);
    setEmailStatusMsg(null);
    try {
      const res = await sendBookingVoucherEmail(booking.id, targetEmail);
      if (res.success) {
        const nowFmt = res.sent_at || new Date().toLocaleString();
        const updatedBooking = {
          ...booking,
          email: targetEmail,
          voucher_email_sent: 1,
          voucher_email_sent_at: nowFmt,
          voucher_email_recipient: targetEmail,
          ...(res.booking || {})
        };
        setSelected(updatedBooking);
        setLocalBookings(prev => prev.map(b => String(b.id) === String(booking.id) ? updatedBooking : b));
        if (typeof setBookingsList === 'function') {
          setBookingsList(prev => prev.map(b => String(b.id) === String(booking.id) ? updatedBooking : b));
        }
        setEmailStatusMsg({
          type: 'success',
          text: `✓ Official booking voucher successfully emailed to ${targetEmail}!`
        });
        setShowEmailOverrideModal(false);
      } else {
        setEmailStatusMsg({
          type: 'error',
          text: res.error || 'Failed to dispatch voucher email.'
        });
      }
    } catch (err) {
      setEmailStatusMsg({
        type: 'error',
        text: err.message || 'Error sending voucher email.'
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  const openHandoverModal = async (b) => {
    if (!b) return;
    setHandoverModalBooking(b);
    setHandoverMsg('');
    setHandoverError('');
    const isCompleted = b.status === 'Completed' || b.handover_status === 'Returned';
    const isHandedOver = !isCompleted && (b.status === 'Pickup' || b.handover_status === 'Handed Over' || b.handover_status === 'Active Trip');

    let initialHandoverStatus = 'Handed Over';
    if (isCompleted) {
      initialHandoverStatus = 'Returned';
    } else if (isHandedOver) {
      initialHandoverStatus = 'Returned';
    } else if (b.handover_status && b.handover_status !== 'Confirmed') {
      initialHandoverStatus = b.handover_status;
    }

    setHandoverForm({
      assigned_vehicle_plate: b.assigned_vehicle_plate || '',
      physical_unit_id: b.physical_unit_id || '',
      handover_status: initialHandoverStatus,
      handover_odometer: b.handover_odometer !== null && b.handover_odometer !== undefined ? b.handover_odometer : '',
      return_odometer: b.return_odometer !== null && b.return_odometer !== undefined ? b.return_odometer : '',
      handover_fuel: b.handover_fuel || '100% Full Tank',
      return_fuel: b.return_fuel || (b.handover_fuel || '100% Full Tank'),
      deposit_amount: b.deposit_amount !== undefined ? b.deposit_amount : 0,
      deposit_status: b.deposit_status || (Number(b.deposit_amount) > 0 ? 'Paid via UPI' : 'Not Required / ₹0'),
      delivery_agent_name: b.delivery_agent_name || '',
      delivery_agent_phone: b.delivery_agent_phone || ''
    });

    try {
      setLoadingUnits(true);
      const units = await fetchVehicleUnits(b.item_id || '', b.vendor_id || '');
      setVehicleUnitsList(units || []);
    } catch (e) {
      setVehicleUnitsList([]);
    } finally {
      setLoadingUnits(false);
    }
  };

  // Combined vehicle fleet list
  const allVehicles = [
    ...(cars || []).map(c => ({ ...c, _type: 'car' })),
    ...(bikes || []).map(b => ({ ...b, _type: 'bike' }))
  ];

  const defaultVehicle = allVehicles[0] || { id: '', name: '', price: 1500 };

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const getAfterTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  };

  const [createForm, setCreateForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    license: '',
    item_id: defaultVehicle.id || '',
    item_name: defaultVehicle.name || '',
    pickup_loc: 'Goa Airport (Dabolim / Mopa)',
    pickup_date: getTomorrowStr(),
    drop_date: getAfterTomorrowStr(),
    booking_days: 2,
    total_amount: (defaultVehicle.price || 1500) * 2,
    amount_paid: (defaultVehicle.price || 1500) * 2,
    status: 'Confirmed',
    payment_status: 'Paid',
    payment_method: 'UPI'
  });

  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setLocalBookings(bookings || []);
  }, [bookings]);

  // Recalculate price and days when vehicle or dates change in createForm
  const handleVehicleSelect = (vehId) => {
    const found = allVehicles.find(v => String(v.id) === String(vehId));
    if (found) {
      const days = parseInt(createForm.booking_days, 10) || 1;
      const total = (found.price || 1500) * days;
      setCreateForm(prev => ({
        ...prev,
        item_id: found.id,
        item_name: found.name,
        total_amount: total,
        amount_paid: total
      }));
    }
  };

  const handleDateChange = (type, val) => {
    setCreateForm(prev => {
      const pDate = type === 'pickup' ? val : prev.pickup_date;
      const dDate = type === 'drop' ? val : prev.drop_date;
      let days = 1;
      if (pDate && dDate) {
        const diffMs = new Date(dDate) - new Date(pDate);
        days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }
      const found = allVehicles.find(v => String(v.id) === String(prev.item_id)) || defaultVehicle;
      const total = (found.price || 1500) * days;
      return {
        ...prev,
        [type === 'pickup' ? 'pickup_date' : 'drop_date']: val,
        booking_days: days,
        total_amount: total,
        amount_paid: total
      };
    });
  };

  const allVehicleIds = new Set([
    ...(cars || []).map(c => String(c.id)),
    ...(bikes || []).map(b => String(b.id)),
  ]);

  const isVehicleBooking = (b) => {
    if (!b) return false;
    const type = String(b.type || b.item_type || '').toLowerCase();
    if (['vehicle', 'car', 'bike', 'rental'].includes(type)) return true;
    if (b.vehicle_id || b.car_id || b.bike_id) return true;
    const iId = String(b.item_id || '').toLowerCase();
    if (iId.startsWith('car-') || iId.startsWith('bike-') || iId.startsWith('veh-') || allVehicleIds.has(String(b.item_id))) return true;
    const name = String(b.item_name || b.name || '').toLowerCase();
    if (name.includes('flight') || name.includes('hotel') || name.includes('resort') || name.includes('tour') || name.includes('package') || name.includes('craft my trip')) return false;
    return true;
  };

  const rawList = localBookings && localBookings.length > 0 ? localBookings : (bookings || []);
  const vehicleBookings = rawList.filter(isVehicleBooking);

  const displayed = vehicleBookings.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchSearch = (b.name || b.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.phone || '').includes(search) ||
                        (b.item_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.id || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!createForm.customer_name || !createForm.phone) {
      setFormError('Customer name and phone number are required.');
      return;
    }

    const eligibility = validateVehicleBookingEligibility(
      createForm.date_of_birth,
      createForm.pickup_date,
      true,
      createForm.license
    );
    if (!eligibility.valid) {
      setFormError(eligibility.error);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: createForm.customer_name,
        customer_name: createForm.customer_name,
        phone: createForm.phone,
        email: createForm.email,
        date_of_birth: createForm.date_of_birth,
        license: createForm.license,
        type: 'selfdrive',
        item_id: createForm.item_id,
        item_name: createForm.item_name,
        pickup_loc: createForm.pickup_loc,
        pickup_date: createForm.pickup_date,
        drop_date: createForm.drop_date,
        booking_days: parseInt(createForm.booking_days, 10) || 1,
        total_amount: parseInt(createForm.total_amount, 10) || 0,
        amount_paid: parseInt(createForm.amount_paid, 10) || 0,
        total_paid: parseInt(createForm.total_amount, 10) || 0,
        status: createForm.status || 'Confirmed',
        payment_status: createForm.payment_status || 'Paid',
        payment_method: createForm.payment_method || 'UPI',
        vendor_id: currentUser?.id || 'vendor-1'
      };

      const res = await createBooking(payload);
      if (res && res.success) {
        const newRecord = res.booking || {
          ...payload,
          id: res.booking_id || res.id || `BK-${Math.floor(100000 + Math.random() * 900000)}`
        };
        const updated = [newRecord, ...localBookings];
        setLocalBookings(updated);
        if (setBookingsList) setBookingsList(updated);
        setShowCreateModal(false);
        setCreateForm({
          customer_name: '',
          phone: '',
          email: '',
          date_of_birth: '',
          license: '',
          item_id: defaultVehicle.id || '',
          item_name: defaultVehicle.name || '',
          pickup_loc: 'Goa Airport (Dabolim / Mopa)',
          pickup_date: getTomorrowStr(),
          drop_date: getAfterTomorrowStr(),
          booking_days: 2,
          total_amount: (defaultVehicle.price || 1500) * 2,
          amount_paid: (defaultVehicle.price || 1500) * 2,
          status: 'Confirmed',
          payment_status: 'Paid',
          payment_method: 'UPI'
        });
      }
    } catch (err) {
      setFormError('Failed to create booking: ' + (err.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditBooking = (b) => {
    setEditingBooking(b);
    setEditForm({
      id: b.id,
      name: b.name || b.customer_name || '',
      phone: b.phone || '',
      email: b.email || '',
      license: b.license || '',
      item_id: b.item_id || '',
      item_name: b.item_name || '',
      pickup_loc: b.pickup_loc || b.pickup_location || 'Goa Delivery',
      pickup_date: b.pickup_date || '',
      drop_date: b.drop_date || b.return_date || '',
      booking_days: b.booking_days || 1,
      total_amount: b.total_amount || b.total_paid || 0,
      status: b.status || 'Pending',
      payment_status: b.payment_status || 'Paid',
      payment_method: b.payment_method || b.payment_mode || 'Cash'
    });
    setShowEditModal(true);
    setFormError('');
  };

  const handleSaveEditBooking = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.phone) {
      setFormError('Name and phone are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await updateBooking(editForm);
      const updated = localBookings.map(b => b.id === editForm.id ? { ...b, ...editForm } : b);
      setLocalBookings(updated);
      if (setBookingsList) setBookingsList(updated);
      if (selected?.id === editForm.id) setSelected(prev => ({ ...prev, ...editForm }));
      setShowEditModal(false);
    } catch (err) {
      setFormError('Failed to update booking: ' + (err.message || 'Server error'));
    } finally {
      setSaving(false);
    }
  };

  const broadcastBookingSync = (bookingId, newStatus) => {
    try {
      window.dispatchEvent(new CustomEvent('tripgalileo-booking-sync', { detail: { bookingId, status: newStatus } }));
      window.dispatchEvent(new CustomEvent('booking-status-updated', { detail: { bookingId, status: newStatus } }));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('tripgalileo_bookings_sync');
        bc.postMessage({ type: 'BOOKING_UPDATED', bookingId, status: newStatus, timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {}
  };

  const advanceStatus = async (booking) => {
    const idx = WORKFLOW_STEPS.indexOf(booking.status);
    if (idx < WORKFLOW_STEPS.length - 1) {
      const next = WORKFLOW_STEPS[idx + 1];
      try {
        await updateBookingStatus(booking.id, next);

        let newHandover = booking.handover_status || 'Confirmed';
        let newHandedOverAt = booking.handed_over_at || null;
        let newReturnedAt = booking.returned_at || null;
        const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

        if (next === 'Pickup') {
          newHandover = 'Handed Over';
          if (!newHandedOverAt) newHandedOverAt = nowStr;
        } else if (next === 'Return' || next === 'Completed') {
          newHandover = 'Returned';
          if (!newReturnedAt) newReturnedAt = nowStr;
        }

        const updated = localBookings.map(b => b.id === booking.id ? { 
          ...b, 
          status: next,
          handover_status: newHandover,
          handed_over_at: newHandedOverAt,
          returned_at: newReturnedAt
        } : b);
        setLocalBookings(updated);
        if (setBookingsList) setBookingsList(updated);
        if (selected?.id === booking.id) setSelected(prev => ({ 
          ...prev, 
          status: next,
          handover_status: newHandover,
          handed_over_at: newHandedOverAt,
          returned_at: newReturnedAt
        }));
        broadcastBookingSync(booking.id, next);
      } catch (e) {
        if (e.code === 'WALLET_BLOCKED' || (e.message && e.message.includes('WALLET_BLOCKED'))) {
          setBlockedModal({
            show: true,
            balance: e.balance !== undefined ? e.balance : (e.data?.balance ?? 0),
            negativeBookingCount: e.negative_booking_count !== undefined ? e.negative_booking_count : (e.data?.negative_booking_count ?? 0),
            maxNegativeBookings: e.max_negative_bookings !== undefined ? e.max_negative_bookings : (e.data?.max_negative_bookings ?? 2)
          });
        } else {
          alert('Failed to update booking status: ' + e.message);
        }
      }
    }
  };

  const markCompleted = async (booking) => {
    if (!['Confirmed', 'Pickup', 'Return'].includes(booking.status)) {
      alert('Cannot complete an unconfirmed booking. Booking must first be confirmed with platform fee processed.');
      return;
    }
    try {
      await updateBookingStatus(booking.id, 'Completed');
      const nowStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const updated = localBookings.map(b => b.id === booking.id ? { 
        ...b, 
        status: 'Completed',
        handover_status: 'Returned',
        returned_at: b.returned_at || nowStr
      } : b);
      setLocalBookings(updated);
      if (setBookingsList) setBookingsList(updated);
      if (selected?.id === booking.id) setSelected(prev => ({ 
        ...prev, 
        status: 'Completed',
        handover_status: 'Returned',
        returned_at: prev.returned_at || nowStr
      }));
      broadcastBookingSync(booking.id, 'Completed');
    } catch (e) {
      if (e.code === 'WALLET_BLOCKED' || (e.message && e.message.includes('WALLET_BLOCKED'))) {
        setBlockedModal({
          show: true,
          balance: e.balance !== undefined ? e.balance : (e.data?.balance ?? 0),
          negativeBookingCount: e.negative_booking_count !== undefined ? e.negative_booking_count : (e.data?.negative_booking_count ?? 0),
          maxNegativeBookings: e.max_negative_bookings !== undefined ? e.max_negative_bookings : (e.data?.max_negative_bookings ?? 2)
        });
      } else {
        alert('Failed to mark booking as completed: ' + e.message);
      }
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await updateBookingStatus(id, 'Cancelled');
      const updated = localBookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b);
      setLocalBookings(updated);
      if (setBookingsList) setBookingsList(updated);
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: 'Cancelled' }));
      broadcastBookingSync(id, 'Cancelled');
    } catch (e) {
      alert('Failed to cancel booking: ' + e.message);
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking record? Customer records will remain intact.')) return;
    try {
      await deleteBooking(id);
      const updated = localBookings.filter(b => b.id !== id);
      setLocalBookings(updated);
      if (setBookingsList) setBookingsList(updated);
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      alert('Failed to delete booking: ' + e.message);
    }
  };

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '16px' }}>All Bookings</h5>
          <p className="mb-0 mt-1" style={{ fontSize: '0.78rem', color: '#64748b' }}>Manage vehicle bookings, status workflow, and customer reservations</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => { setShowCreateModal(true); setFormError(''); }} className="btn px-4 py-2 fw-bold text-white d-flex align-items-center gap-2 rounded-3 shadow-sm" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)', fontSize: '0.83rem' }}>
            <Plus size={15} /> Create Booking
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'All Bookings', count: vehicleBookings.length, color: '#2563eb' },
          { label: 'Pending', count: vehicleBookings.filter(b => b.status === 'Pending').length, color: '#ca8a04' },
          { label: 'Confirmed', count: vehicleBookings.filter(b => b.status === 'Confirmed').length, color: '#16a34a' },
          { label: 'Completed', count: vehicleBookings.filter(b => b.status === 'Completed').length, color: '#059669' },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="rounded-3 p-3 text-center shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="fw-bold" style={{ fontSize: '1.4rem', color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <div className="position-relative flex-grow-1" style={{ minWidth: '220px' }}>
          <Search size={14} className="position-absolute" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input className="form-control" style={{ paddingLeft: '32px', borderRadius: '10px', fontSize: '0.85rem' }} placeholder="Search by customer, phone, vehicle, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', ...WORKFLOW_STEPS, 'Cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className="btn btn-sm px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.7rem', background: statusFilter === s ? '#0D1B2E' : '#fff', color: statusFilter === s ? '#fff' : '#475569', border: '1px solid rgba(0,0,0,0.1)' }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.07)', background: '#fff' }}>
        <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['ID', 'Customer', 'Vehicle', 'Dates', 'Amount', 'Payment', 'Status', 'Progress', 'Actions'].map(h => (
                <th key={h} className="px-3 py-3 fw-bold" style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <td className="px-3 py-3 fw-bold" style={{ color: '#2563eb', fontSize: '0.78rem' }}>#{b.id}</td>
                <td className="px-3 py-3">
                  <div className="fw-bold" style={{ color: '#0D1B2E' }}>{b.name || b.customer_name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{b.phone}</div>
                  {b.email && <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{b.email}</div>}
                </td>
                <td className="px-3 py-3" style={{ maxWidth: '140px' }}>
                  <div className="fw-bold text-truncate" style={{ color: '#0D1B2E' }}>{b.item_name || 'Vehicle Rental'}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>📍 {b.pickup_loc || b.pickup_location || 'Goa'}</div>
                </td>
                <td className="px-3 py-3">
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>{b.pickup_date || '—'} →</div>
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>{b.drop_date || b.return_date || '—'}</div>
                </td>
                <td className="px-3 py-3 fw-bold" style={{ color: '#16a34a' }}>
                  ₹{parseFloat(b.total_amount || b.total_paid || 0).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <span className="badge rounded-pill fw-bold" style={{ background: (b.payment_status === 'Paid' || b.payment_status === 'paid') ? '#dcfce7' : '#fef9c3', color: (b.payment_status === 'Paid' || b.payment_status === 'paid') ? '#16a34a' : '#ca8a04', fontSize: '0.62rem' }}>
                    {b.payment_status || 'Pending'}
                  </span>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>{b.payment_method || b.payment_mode || 'Cash'}</div>
                </td>
                <td className="px-3 py-3"><StatusBadge status={b.status} handover_status={b.handover_status} /></td>
                <td className="px-3 py-3">
                  {b.status !== 'Cancelled' && <WorkflowBadge status={b.status} handover_status={b.handover_status} />}
                </td>
                <td className="px-3 py-3">
                  <div className="d-flex gap-1 align-items-center">
                    {(() => {
                      const isCompleted = b.status === 'Completed' || b.handover_status === 'Returned';
                      const isHandedOver = !isCompleted && (b.status === 'Pickup' || b.handover_status === 'Handed Over' || b.handover_status === 'Active Trip');

                      if (isCompleted) {
                        return (
                          <button 
                            className="btn btn-sm px-2 py-1 rounded-2 text-white fw-bold d-flex align-items-center gap-1 shadow-xs" 
                            title="Vehicle Returned & Completed — Click to view/edit inspection" 
                            style={{ background: '#059669', fontSize: '0.68rem' }} 
                            onClick={() => openHandoverModal(b)}
                          >
                            <CheckCircle size={11} /> Returned
                          </button>
                        );
                      }
                      if (isHandedOver) {
                        return (
                          <button 
                            className="btn btn-sm px-2 py-1 rounded-2 text-white fw-bold d-flex align-items-center gap-1 shadow-xs" 
                            title="Vehicle Handed Over (Customer Driving) — Click to Process Return" 
                            style={{ background: '#7c3aed', fontSize: '0.68rem' }} 
                            onClick={() => openHandoverModal(b)}
                          >
                            <RotateCcw size={11} /> Return
                          </button>
                        );
                      }
                      return (
                        <button 
                          className="btn btn-sm px-2 py-1 rounded-2 text-white fw-bold d-flex align-items-center gap-1 shadow-xs" 
                          title="Vehicle Handover & Live Customer Dispatch" 
                          style={{ background: '#FF6333', fontSize: '0.68rem' }} 
                          onClick={() => openHandoverModal(b)}
                        >
                          <Key size={11} /> Handover
                        </button>
                      );
                    })()}
                    <button className="btn btn-sm px-2 py-1 rounded-2" title="View Details" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.68rem' }} onClick={() => setSelected(b)}>
                      <Eye size={12} />
                    </button>
                    <button className="btn btn-sm px-2 py-1 rounded-2" title="Edit Booking" style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '0.68rem' }} onClick={() => handleEditBooking(b)}>
                      <Edit size={12} />
                    </button>
                    {b.status !== 'Completed' && b.handover_status !== 'Returned' && b.status !== 'Cancelled' && (
                      <button 
                        className="btn btn-sm px-2 py-1 rounded-2" 
                        title="Next Step" 
                        style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.68rem' }} 
                        onClick={() => advanceStatus(b)}
                      >
                        <ArrowRight size={12} />
                      </button>
                    )}
                    <button className="btn btn-sm px-2 py-1 rounded-2" title="Delete Booking" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.68rem' }} onClick={() => handleDeleteBooking(b.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div className="text-center py-5 text-muted" style={{ fontSize: '0.85rem' }}>
            No bookings found. Click "Create Booking" above to add a new reservation.
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={() => setShowCreateModal(false)}>
          <div className="rounded-4 overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: '580px', background: '#fff', margin: '0 16px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ background: '#0D1B2E' }}>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>Create New Vehicle Booking</h6>
              <button className="btn p-1 border-0 text-white-50" onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateBooking} className="p-4">
              {formError && <div className="alert alert-danger py-2 px-3 mb-3 rounded-3" style={{ fontSize: '0.82rem' }}>{formError}</div>}

              {/* Customer Info */}
              <div className="fw-bold mb-2" style={{ fontSize: '0.75rem', color: '#FF6333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Customer Details</div>
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Customer Name *</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.customer_name} onChange={e => setCreateForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="e.g. Ramesh Sharma" required />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Phone Number *</label>
                  <input type="tel" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. +91 9876543210" required />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Email Address</label>
                  <input type="email" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="customer@gmail.com" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Date of Birth *</label>
                  <input type="date" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.date_of_birth} onChange={e => setCreateForm(f => ({ ...f, date_of_birth: e.target.value }))} required />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Driving License No. *</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.license} onChange={e => setCreateForm(f => ({ ...f, license: e.target.value }))} placeholder="e.g. DL-07-20210012" required />
                </div>
              </div>

              {/* Vehicle & Dates */}
              <div className="fw-bold mb-2" style={{ fontSize: '0.75rem', color: '#FF6333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Vehicle & Rental Dates</div>
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Select Vehicle *</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.item_id} onChange={e => handleVehicleSelect(e.target.value)} required>
                    {allVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v._type === 'car' ? '🚗 Car' : '🏍️ Bike'}) — ₹{v.price}/day
                      </option>
                    ))}
                    {allVehicles.length === 0 && <option value="">No vehicles found in fleet</option>}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Pickup Location</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.pickup_loc} onChange={e => setCreateForm(f => ({ ...f, pickup_loc: e.target.value }))} placeholder="e.g. Goa Airport / Hotel Delivery" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Pickup Date *</label>
                  <input type="date" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.pickup_date} onChange={e => handleDateChange('pickup', e.target.value)} required />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Return Date *</label>
                  <input type="date" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.drop_date} onChange={e => handleDateChange('drop', e.target.value)} required />
                </div>
              </div>

              {/* Payment & Amount */}
              <div className="fw-bold mb-2" style={{ fontSize: '0.75rem', color: '#FF6333', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Pricing & Payment</div>
              <div className="row g-2 mb-4">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Duration (Days)</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.booking_days} readOnly />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Total Amount (₹) *</label>
                  <input type="number" className="form-control fw-bold text-success" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.total_amount} onChange={e => setCreateForm(f => ({ ...f, total_amount: e.target.value, amount_paid: e.target.value }))} required />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Mode</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.payment_method} onChange={e => setCreateForm(f => ({ ...f, payment_method: e.target.value }))}>
                    {['UPI', 'Cash', 'Card', 'Net Banking', 'Pay at Pickup'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Status</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.payment_status} onChange={e => setCreateForm(f => ({ ...f, payment_status: e.target.value }))}>
                    {['Paid', 'Pending', 'Partial'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Booking Status</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={createForm.status} onChange={e => setCreateForm(f => ({ ...f, status: e.target.value }))}>
                    {WORKFLOW_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn w-100 py-2 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>
                <Check size={15} />{saving ? 'Creating Booking...' : 'Confirm & Save Booking'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && editingBooking && (
        <div className="position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(13,27,46,0.65)', backdropFilter: 'blur(6px)', zIndex: 1060 }} onClick={() => setShowEditModal(false)}>
          <div className="rounded-4 overflow-hidden shadow-lg" style={{ width: '100%', maxWidth: '580px', background: '#fff', margin: '0 16px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={{ background: '#0D1B2E' }}>
              <h6 className="mb-0 fw-bold text-white" style={{ fontSize: '14px' }}>Edit Booking #{editingBooking.id}</h6>
              <button className="btn p-1 border-0 text-white-50" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEditBooking} className="p-4">
              {formError && <div className="alert alert-danger py-2 px-3 mb-3 rounded-3" style={{ fontSize: '0.82rem' }}>{formError}</div>}

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Customer Name *</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Phone *</label>
                  <input type="tel" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.phone || ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} required />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Email</label>
                  <input type="email" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Vehicle Name</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.item_name || ''} onChange={e => setEditForm(f => ({ ...f, item_name: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Pickup Date</label>
                  <input type="date" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.pickup_date || ''} onChange={e => setEditForm(f => ({ ...f, pickup_date: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Drop Date</label>
                  <input type="date" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.drop_date || ''} onChange={e => setEditForm(f => ({ ...f, drop_date: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Total Amount (₹)</label>
                  <input type="number" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.total_amount || ''} onChange={e => setEditForm(f => ({ ...f, total_amount: e.target.value }))} />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Booking Status</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.status || 'Pending'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                    {[...WORKFLOW_STEPS, 'Cancelled', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Status</label>
                  <select className="form-select" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.payment_status || 'Paid'} onChange={e => setEditForm(f => ({ ...f, payment_status: e.target.value }))}>
                    {['Paid', 'Pending', 'Partial'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Payment Mode</label>
                  <input type="text" className="form-control" style={{ fontSize: '0.85rem', borderRadius: '8px' }} value={editForm.payment_method || ''} onChange={e => setEditForm(f => ({ ...f, payment_method: e.target.value }))} />
                </div>
              </div>

              <button type="submit" disabled={saving} className="btn w-100 py-2 fw-bold text-white rounded-3 d-flex align-items-center justify-content-center gap-2" style={{ background: 'linear-gradient(90deg,#FF6333,#FF8A00)' }}>
                <Save size={15} />{saving ? 'Saving Changes...' : 'Save Booking Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="position-fixed top-0 end-0 bottom-0 shadow-lg d-flex flex-column" style={{ width: '420px', background: '#fff', zIndex: 1050, borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
          <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E' }}>
            <div>
              <div className="fw-bold text-white" style={{ fontSize: '14px' }}>Booking #{selected.id}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)' }}>{selected.item_name}</div>
            </div>
            <button className="btn p-1 border-0 text-white-50" onClick={() => setSelected(null)}><X size={16} /></button>
          </div>

          <div className="flex-grow-1 overflow-auto p-4">
            {/* Workflow */}
            {selected.status !== 'Cancelled' && (
              <div className="mb-4">
                <div className="fw-bold mb-2" style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Progress</div>
                <div className="d-flex flex-column gap-2">
                  {(() => {
                    const isCompleted = selected.status === 'Completed' || selected.handover_status === 'Returned';
                    let effectiveStatus = selected.status;
                    if (isCompleted) {
                      effectiveStatus = 'Completed';
                    } else if (selected.handover_status === 'Handed Over' || selected.handover_status === 'Active Trip') {
                      if (['Pending', 'Payment Verification', 'Confirmed'].includes(selected.status)) {
                        effectiveStatus = 'Pickup';
                      }
                    }
                    const currentIdx = WORKFLOW_STEPS.indexOf(effectiveStatus);

                    return WORKFLOW_STEPS.map((step, i) => {
                      const isDone = isCompleted || i < currentIdx;
                      const isCurrent = !isCompleted && i === currentIdx;
                      return (
                        <div 
                          key={step} 
                          className="d-flex align-items-center gap-3 py-2 px-3 rounded-2" 
                          style={{ 
                            background: isDone ? '#dcfce7' : isCurrent ? '#FFF5F2' : '#f8fafc', 
                            border: isDone ? '1px solid rgba(22,163,74,0.2)' : isCurrent ? '1px solid #FF633350' : '1px solid transparent' 
                          }}
                        >
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              background: isDone ? '#16a34a' : isCurrent ? '#FF6333' : '#e2e8f0' 
                            }}
                          >
                            {isDone ? (
                              <Check size={12} style={{ color: '#fff' }} />
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: isCurrent ? '#fff' : '#94a3b8', fontWeight: 700 }}>
                                {i + 1}
                              </span>
                            )}
                          </div>
                          <span 
                            className="fw-bold" 
                            style={{ 
                              fontSize: '0.82rem', 
                              color: isDone ? '#16a34a' : isCurrent ? '#FF6333' : '#94a3b8' 
                            }}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            {selected.status === 'Cancelled' && (
              <div className="rounded-3 p-3 mb-4" style={{ background: '#fee2e2', border: '1px solid rgba(220,38,38,0.2)' }}>
                <div className="fw-bold" style={{ color: '#dc2626', fontSize: '0.85rem' }}>❌ Booking Cancelled</div>
              </div>
            )}

            {/* Details */}
            <div className="fw-bold mb-2" style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reservation Summary</div>
            {[
              { label: 'Customer Name', value: selected.name || selected.customer_name },
              { label: 'Phone', value: selected.phone },
              { label: 'Email', value: (selected.email && !selected.email.includes('@guest.wowgoa.com')) ? selected.email : '—' },
              { label: 'Driving License', value: selected.license || '—' },
              { label: 'Vehicle', value: selected.item_name },
              { label: 'Pickup Location', value: selected.pickup_loc || selected.pickup_location || 'Goa Delivery' },
              { label: 'Pickup Date', value: selected.pickup_date || '—' },
              { label: 'Drop Date', value: selected.drop_date || selected.return_date || '—' },
              { label: 'Payment Mode', value: selected.payment_method || selected.payment_mode || 'Cash' },
              { label: 'Payment Status', value: selected.payment_status || 'Paid' },
              { label: 'Total Amount', value: `₹${parseFloat(selected.total_amount || selected.total_paid || 0).toLocaleString()}` },
            ].map(f => (
              <div key={f.label} className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '0.82rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>{f.label}</span>
                <span style={{ color: '#0D1B2E', fontWeight: f.label.includes('Amount') ? 700 : 400 }}>{f.value}</span>
              </div>
            ))}

            {/* Customer Booking Voucher & Email Dispatch Tracking Card */}
            <div className="p-3 rounded-3 mt-3 border shadow-xs" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-dark text-xs d-flex align-items-center gap-1.5">
                  <Mail size={13} className="text-primary" />
                  Official Voucher Email Delivery
                </span>
                {selected.voucher_email_sent == 1 ? (
                  <span className="badge rounded-pill fw-bold" style={{ background: '#dcfce7', color: '#059669', fontSize: '0.68rem' }}>
                    ✓ Emailed
                  </span>
                ) : (
                  <span className="badge rounded-pill fw-bold" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.68rem' }}>
                    ⚠️ Not Emailed
                  </span>
                )}
              </div>

              {selected.voucher_email_sent == 1 ? (
                <div className="p-2.5 rounded-2 bg-white border mb-2 text-xs">
                  <div className="text-success fw-bold d-flex align-items-center gap-1">
                    <CheckCircle size={12} /> Voucher Delivered to Customer
                  </div>
                  <div className="text-dark mt-1" style={{ fontSize: '0.74rem' }}>
                    Recipient: <strong className="font-monospace text-primary">{selected.voucher_email_recipient || selected.email}</strong>
                  </div>
                  {selected.voucher_email_sent_at && (
                    <div className="text-muted mt-0.5" style={{ fontSize: '0.70rem' }}>
                      Timestamp: {selected.voucher_email_sent_at}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-2 bg-white border mb-2 text-xs text-muted" style={{ fontSize: '0.74rem' }}>
                  Customer has not received the official confirmation voucher email yet.
                  {(selected.email && !selected.email.includes('@guest.wowgoa.com')) ? (
                    <div className="mt-1 text-dark">
                      Ready to send to: <strong className="font-monospace text-dark">{selected.email}</strong>
                    </div>
                  ) : (
                    <div className="mt-1 text-warning fw-semibold">
                      ⚠️ Customer email not recorded yet. Click below to enter Gmail and dispatch.
                    </div>
                  )}
                </div>
              )}

              {emailStatusMsg && (
                <div className={`p-2 rounded-2 mb-2 text-xs fw-semibold ${emailStatusMsg.type === 'success' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}`}>
                  {emailStatusMsg.text}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary flex-grow-1 py-1.5 rounded-2 fw-bold text-xs d-flex align-items-center justify-content-center gap-1 shadow-sm"
                  onClick={() => handleDispatchVoucherEmail(selected)}
                  disabled={isEmailSending}
                >
                  {isEmailSending ? (
                    <>
                      <Loader2 size={12} className="spinner-border spinner-border-sm" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={12} /> {selected.voucher_email_sent == 1 ? 'Resend Voucher Email' : 'Email Voucher to Customer'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark py-1.5 px-2.5 rounded-2 fw-bold text-xs d-flex align-items-center gap-1"
                  onClick={() => setSelectedVoucherModal(selected)}
                  title="View and print official corporate booking voucher"
                >
                  <FileText size={12} /> View Voucher
                </button>
              </div>
            </div>

            {/* Vehicle Handover & Trip Inspection Details */}
            <div className="mt-3 pt-3 border-top">
              {(() => {
                const isCompleted = selected.status === 'Completed' || selected.handover_status === 'Returned';
                const isHandedOver = !isCompleted && (selected.status === 'Pickup' || selected.handover_status === 'Handed Over' || selected.handover_status === 'Active Trip');

                return (
                  <>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fw-bold" style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Handover & Dispatch Inspection
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm py-1 px-2.5 rounded-pill text-xs fw-bold d-flex align-items-center gap-1 ${
                          isCompleted ? 'btn-outline-success' : isHandedOver ? 'text-white' : 'btn-outline-primary'
                        }`}
                        style={isHandedOver ? { background: '#7c3aed', borderColor: '#7c3aed' } : {}}
                        onClick={() => openHandoverModal(selected)}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle size={11} /> View / Edit Inspection
                          </>
                        ) : isHandedOver ? (
                          <>
                            <RotateCcw size={11} /> Process Return
                          </>
                        ) : (
                          <>
                            <Key size={11} /> Handover Vehicle
                          </>
                        )}
                      </button>
                    </div>

                    {/* Prominent State Banners */}
                    {isHandedOver && (
                      <div className="p-2.5 rounded-3 mb-2.5 border" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span className="badge rounded-pill text-white fw-bold" style={{ background: '#7c3aed', fontSize: '0.68rem' }}>
                            🔑 Customer Driving (Active Trip)
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm text-white px-2 py-0.5 rounded-pill fw-bold"
                            style={{ background: '#7c3aed', fontSize: '0.68rem' }}
                            onClick={() => openHandoverModal(selected)}
                          >
                            Return Vehicle →
                          </button>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Keys handed to <strong>{selected.name || selected.customer_name}</strong>. Drop scheduled by {selected.drop_date} ({selected.drop_time || '10:00 AM'}).
                        </div>
                      </div>
                    )}

                    {isCompleted && (
                      <div className="p-2.5 rounded-3 mb-2.5 border" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                        <div className="d-flex align-items-center gap-2">
                          <CheckCircle size={16} className="text-success flex-shrink-0" />
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.78rem', color: '#065f46' }}>
                              ✓ Vehicle Returned & Rental Completed
                            </div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              Odometer & fuel inspected. Vehicle ready for subsequent bookings.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-2.5 rounded-3 bg-light border mb-2 text-xs">
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted fw-bold">Commercial Plate:</span>
                        <div className="d-flex align-items-center gap-1">
                          <span className="badge bg-warning text-dark border border-dark font-monospace fw-black">
                            {selected.assigned_vehicle_plate || 'Not Assigned'}
                          </span>
                          {selected.physical_unit_id && (
                            <span className="badge bg-secondary text-white font-monospace" style={{ fontSize: '0.65rem' }}>
                              {selected.physical_unit_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted fw-bold">Handover Status:</span>
                        <span className={`badge rounded-pill fw-bold ${
                          isCompleted ? 'bg-success text-white' : isHandedOver ? 'text-white' : 'bg-primary text-white'
                        }`} style={isHandedOver ? { background: '#7c3aed' } : {}}>
                          {selected.handover_status || (selected.status === 'Completed' ? 'Returned' : 'Confirmed')}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted fw-bold">Car Given to Customer:</span>
                        <span className="fw-bold text-dark">
                          {selected.handed_over_at || `${selected.pickup_date} (${selected.pickup_time || '10:00 AM'})`}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted fw-bold">Scheduled Return Due:</span>
                        <span className="fw-bold text-primary">
                          ⏰ {selected.drop_date} by {selected.drop_time || '10:00 AM'}
                        </span>
                      </div>
                      {selected.returned_at && (
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted fw-bold">Actual Return Time:</span>
                          <span className="fw-bold text-success">✓ {selected.returned_at}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted fw-bold">Start Odometer:</span>
                        <span className="fw-bold font-monospace text-dark">{selected.handover_odometer ? `${selected.handover_odometer} KM` : '—'}</span>
                      </div>
                      {selected.return_odometer && (
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted fw-bold">Return Odometer:</span>
                          <span className="fw-bold font-monospace text-dark">{selected.return_odometer} KM</span>
                        </div>
                      )}
                      {selected.return_odometer && selected.handover_odometer && (
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted fw-bold">Distance Driven:</span>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold font-monospace">
                            {Number(selected.return_odometer) - Number(selected.handover_odometer)} KM
                          </span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted fw-bold">Handover Fuel:</span>
                        <span className="fw-bold text-dark">{selected.handover_fuel || '—'}</span>
                      </div>
                      {selected.return_fuel && (
                        <div className="d-flex justify-content-between py-1 border-bottom">
                          <span className="text-muted fw-bold">Return Fuel:</span>
                          <span className="fw-bold text-dark">{selected.return_fuel}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between py-1 border-bottom">
                        <span className="text-muted fw-bold">Security Deposit:</span>
                        <span className="fw-bold text-success">₹{selected.deposit_amount || 0} ({selected.deposit_status || 'Unpaid'})</span>
                      </div>
                      {selected.delivery_agent_name && (
                        <div className="d-flex justify-content-between py-1">
                          <span className="text-muted fw-bold">
                            {selected.driver_required == 1 ? 'Chauffeur / Agent:' : 'Delivery Agent:'}
                          </span>
                          <span className="fw-bold text-dark">{selected.delivery_agent_name} {selected.delivery_agent_phone ? `(${selected.delivery_agent_phone})` : ''}</span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="px-4 py-3 flex-shrink-0 d-flex gap-2" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: '#f8fafc' }}>
            <button onClick={() => handleEditBooking(selected)} className="btn flex-grow-1 py-2 rounded-3 fw-bold btn-outline-dark d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '0.82rem' }}>
              <Edit size={13} /> Edit
            </button>
            {selected.status !== 'Completed' && selected.status !== 'Cancelled' && (
              <>
                <button 
                  onClick={() => advanceStatus(selected)} 
                  className="btn flex-grow-1 py-2 rounded-3 fw-bold text-white d-flex align-items-center justify-content-center gap-1" 
                  style={{ 
                    background: 'linear-gradient(90deg,#FF6333,#FF8A00)', 
                    fontSize: '0.82rem' 
                  }}
                  title={selected.status === 'Return' ? 'Advance to Completed' : selected.status === 'Payment Verification' ? 'Confirm Booking and Process Platform Fee' : 'Advance to next workflow step'}
                >
                  <ArrowRight size={13} /> {selected.status === 'Payment Verification' ? 'Confirm Booking' : 'Next'}
                </button>
                {['Confirmed', 'Pickup', 'Return'].includes(selected.status) && (
                  <button 
                    onClick={() => markCompleted(selected)} 
                    className="btn py-2 px-3 rounded-3 fw-bold text-white d-flex align-items-center justify-content-center gap-1" 
                    style={{ background: '#059669', fontSize: '0.82rem' }}
                    title="Mark this vehicle rental as Completed"
                  >
                    <CheckCircle size={13} /> Complete
                  </button>
                )}
                <button onClick={() => cancelBooking(selected.id)} className="btn py-2 px-3 rounded-3 fw-bold" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.82rem' }}>
                  Cancel
                </button>
              </>
            )}
            {selected.status === 'Completed' && (
              <>
                <button 
                  onClick={() => setSelected(null)} 
                  className="btn flex-grow-1 py-2 rounded-3 fw-bold text-white d-flex align-items-center justify-content-center gap-1 shadow-sm" 
                  style={{ background: '#059669', fontSize: '0.82rem', cursor: 'pointer' }}
                  title="Booking is Completed. Click to Close"
                >
                  <CheckCircle size={13} /> Completed (Close)
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await updateBookingStatus(selected.id, 'Return');
                      const updated = localBookings.map(b => b.id === selected.id ? { ...b, status: 'Return' } : b);
                      setLocalBookings(updated);
                      if (setBookingsList) setBookingsList(updated);
                      setSelected(prev => ({ ...prev, status: 'Return' }));
                    } catch (e) {
                      alert('Failed to update: ' + e.message);
                    }
                  }} 
                  className="btn py-2 px-3 rounded-3 fw-bold text-muted border" 
                  style={{ background: '#fff', fontSize: '0.78rem' }}
                  title="Reopen booking back to Return step"
                >
                  Reopen
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── VEHICLE HANDOVER & LIVE DISPATCH TRACKER MODAL ─── */}
      {handoverModalBooking && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(13,27,46,0.85)', backdropFilter: 'blur(5px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header border-0 text-white px-4 py-3" style={{ background: 'linear-gradient(135deg,#0D1B2E 0%,#1a3050 100%)' }}>
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle p-2 bg-warning text-dark">
                    <Key size={18} />
                  </div>
                  <div>
                    {(() => {
                      const isModalCompleted = handoverModalBooking.status === 'Completed' || handoverModalBooking.handover_status === 'Returned';
                      const isModalHandedOver = !isModalCompleted && (handoverModalBooking.status === 'Pickup' || handoverModalBooking.handover_status === 'Handed Over' || handoverModalBooking.handover_status === 'Active Trip');

                      return (
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="modal-title fw-bold mb-0">
                            {isModalCompleted 
                              ? 'Vehicle Handover & Completed Inspection Record' 
                              : isModalHandedOver 
                              ? 'Vehicle Return & Final Inspection' 
                              : 'Vehicle Handover & Customer Dispatch'}
                          </h5>
                          <span className={`badge rounded-pill text-xs px-2.5 py-0.5 ${
                            isModalCompleted 
                              ? 'bg-success' 
                              : isModalHandedOver 
                              ? 'text-white' 
                              : handoverModalBooking.driver_required == 1 
                              ? 'bg-primary' 
                              : 'bg-success'
                          }`} style={isModalHandedOver ? { background: '#7c3aed' } : {}}>
                            {isModalCompleted 
                              ? '✓ Returned & Completed' 
                              : isModalHandedOver 
                              ? '🔄 Return Inspection Pending' 
                              : handoverModalBooking.driver_required == 1 
                              ? '🚗 Chauffeur Service' 
                              : '🔑 Self-Drive Rental'}
                          </span>
                        </div>
                      );
                    })()}
                    <p className="small mb-0 text-white-50">Booking #{handoverModalBooking.id} • {handoverModalBooking.name || handoverModalBooking.customer_name} • {handoverModalBooking.item_name}</p>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setHandoverModalBooking(null)} />
              </div>
              <div className="modal-body p-4 bg-light">
                {handoverMsg && (
                  <div className="alert alert-success py-2 px-3 mb-3 small d-flex align-items-center gap-2">
                    <CheckCircle size={16} />
                    <span>{handoverMsg}</span>
                  </div>
                )}
                {handoverError && (
                  <div className="alert alert-danger py-2 px-3 mb-3 small d-flex align-items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{handoverError}</span>
                  </div>
                )}

                <div className="row g-3">
                  {/* Physical Fleet Unit Selector */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Select Physical Fleet Unit</label>
                    <select
                      className="form-select font-monospace"
                      value={handoverForm.physical_unit_id}
                      onChange={e => {
                        const uId = e.target.value;
                        const matched = vehicleUnitsList.find(u => u.id === uId);
                        setHandoverForm(f => ({
                          ...f,
                          physical_unit_id: uId,
                          assigned_vehicle_plate: matched ? matched.registration_no : f.assigned_vehicle_plate
                        }));
                      }}
                      disabled={loadingUnits}
                    >
                      <option value="">{loadingUnits ? 'Loading fleet units...' : '— Select Registered Unit (Optional) —'}</option>
                      {vehicleUnitsList.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.registration_no} ({u.unit_name})
                        </option>
                      ))}
                    </select>
                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>Links to physical garage unit for availability tracking</span>
                  </div>

                  {/* Commercial Plate No */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Commercial Vehicle Plate No *</label>
                    <input 
                      type="text" 
                      className="form-control font-monospace fw-bold" 
                      placeholder="e.g. GA-01-AB-1234"
                      value={handoverForm.assigned_vehicle_plate}
                      onChange={e => setHandoverForm(f => ({ ...f, assigned_vehicle_plate: e.target.value }))}
                      required
                    />
                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>Verified yellow commercial plate</span>
                  </div>

                  {/* Handover & Trip Status */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Handover & Trip Status</label>
                    <select 
                      className="form-select fw-bold"
                      value={handoverForm.handover_status}
                      onChange={e => setHandoverForm(f => ({ ...f, handover_status: e.target.value }))}
                    >
                      <option value="Confirmed">Confirmed (Reserved in Garage)</option>
                      <option value="Dispatched">Dispatched (Delivery Boy En Route)</option>
                      <option value="Handed Over">Handed Over (Keys with Customer)</option>
                      <option value="Active Trip">Active Trip (Customer On Road)</option>
                      <option value="Returned">Returned (Back in Garage & Inspected)</option>
                    </select>
                  </div>

                  {/* Security Deposit */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Security Deposit Amount & Status</label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={handoverForm.deposit_amount}
                        onChange={e => setHandoverForm(f => ({ ...f, deposit_amount: parseFloat(e.target.value) || 0 }))}
                      />
                      <select 
                        className="form-select"
                        value={handoverForm.deposit_status}
                        onChange={e => setHandoverForm(f => ({ ...f, deposit_status: e.target.value }))}
                      >
                        <option value="Paid via UPI">Paid via UPI</option>
                        <option value="Paid Cash">Paid Cash</option>
                        <option value="Refunded">Refunded</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Not Required / ₹0">Not Required / ₹0</option>
                      </select>
                    </div>
                  </div>

                  {/* Starting Odometer & Handover Fuel */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Starting Odometer (KM)</label>
                    <input 
                      type="number" 
                      className="form-control font-monospace" 
                      placeholder="e.g. 14850"
                      value={handoverForm.handover_odometer}
                      onChange={e => setHandoverForm(f => ({ ...f, handover_odometer: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Fuel Level at Handover</label>
                    <select 
                      className="form-select"
                      value={handoverForm.handover_fuel}
                      onChange={e => setHandoverForm(f => ({ ...f, handover_fuel: e.target.value }))}
                    >
                      <option value="100% Full Tank">100% Full Tank</option>
                      <option value="75%">75% Fuel</option>
                      <option value="50%">50% Half Tank</option>
                      <option value="25%">25% Quarter Tank</option>
                    </select>
                  </div>

                  {/* Return Odometer & Return Fuel */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Return Odometer (KM) [On Return]</label>
                    <input 
                      type="number" 
                      className="form-control font-monospace" 
                      placeholder="e.g. 15200"
                      value={handoverForm.return_odometer}
                      onChange={e => setHandoverForm(f => ({ ...f, return_odometer: e.target.value }))}
                    />
                    {handoverForm.handover_odometer && handoverForm.return_odometer && (
                      <div className="mt-1">
                        {Number(handoverForm.return_odometer) >= Number(handoverForm.handover_odometer) ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success fw-bold font-monospace">
                            ✓ Distance: {Number(handoverForm.return_odometer) - Number(handoverForm.handover_odometer)} KM
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger fw-bold">
                            ⚠️ Cannot be less than starting KM
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">Fuel Level at Return [On Return]</label>
                    <select 
                      className="form-select"
                      value={handoverForm.return_fuel}
                      onChange={e => setHandoverForm(f => ({ ...f, return_fuel: e.target.value }))}
                    >
                      <option value="100% Full Tank">100% Full Tank</option>
                      <option value="75%">75% Fuel</option>
                      <option value="50%">50% Half Tank</option>
                      <option value="25%">25% Quarter Tank</option>
                    </select>
                  </div>

                  {/* Delivery / Handover Personnel */}
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">
                      {handoverModalBooking.driver_required == 1 ? 'Dispatch / Delivery Coordinator Name' : 'Delivery / Handover Agent Name'}
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Ramesh Patil"
                      value={handoverForm.delivery_agent_name}
                      onChange={e => setHandoverForm(f => ({ ...f, delivery_agent_name: e.target.value }))}
                    />
                    <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                      {handoverModalBooking.driver_required == 1 ? 'Personnel handling delivery coordination' : 'Handover specialist delivering keys'}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-bold">
                      {handoverModalBooking.driver_required == 1 ? 'Coordinator Phone' : 'Delivery Agent Phone'}
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 9822100000"
                      value={handoverForm.delivery_agent_phone}
                      onChange={e => setHandoverForm(f => ({ ...f, delivery_agent_phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 bg-white px-4 py-3">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setHandoverModalBooking(null)}>
                  Close
                </button>
                <button 
                  type="button" 
                  disabled={savingHandover}
                  className="btn text-white rounded-pill px-4 fw-bold shadow-xs d-flex align-items-center gap-1.5" 
                  style={{ background: '#FF6333' }}
                  onClick={async () => {
                    setHandoverError('');
                    // Validations
                    if (handoverForm.handover_odometer && Number(handoverForm.handover_odometer) < 0) {
                      setHandoverError('Starting odometer cannot be negative.');
                      return;
                    }
                    if (handoverForm.return_odometer && Number(handoverForm.return_odometer) < 0) {
                      setHandoverError('Return odometer cannot be negative.');
                      return;
                    }
                    if (handoverForm.handover_odometer && handoverForm.return_odometer && Number(handoverForm.return_odometer) < Number(handoverForm.handover_odometer)) {
                      setHandoverError(`Return odometer (${handoverForm.return_odometer} KM) cannot be less than starting odometer (${handoverForm.handover_odometer} KM).`);
                      return;
                    }
                    if (handoverForm.handover_status === 'Returned' && !handoverForm.return_odometer) {
                      setHandoverError('Return odometer is required when marking vehicle as Returned.');
                      return;
                    }

                    setSavingHandover(true);
                    setHandoverMsg('');
                    try {
                      const res = await updateBookingHandover({
                        booking_id: handoverModalBooking.id,
                        ...handoverForm
                      });
                      if (res && res.success && res.booking) {
                        setHandoverMsg('Handover details updated and synced with customer live tracker!');
                        const updatedBookings = localBookings.map(b => b.id === handoverModalBooking.id ? { ...b, ...res.booking } : b);
                        setLocalBookings(updatedBookings);
                        if (setBookingsList) setBookingsList(updatedBookings);
                        if (selected?.id === handoverModalBooking.id) {
                          setSelected(prev => ({ ...prev, ...res.booking }));
                        }
                        broadcastBookingSync(handoverModalBooking.id, res.booking.status || res.booking.handover_status);
                        setTimeout(() => setHandoverModalBooking(null), 1200);
                      } else {
                        setHandoverError(res?.error || 'Failed to update handover details.');
                      }
                    } catch (e) {
                      setHandoverError('Error: ' + e.message);
                    } finally {
                      setSavingHandover(false);
                    }
                  }}
                >
                  {savingHandover ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>
                    {savingHandover 
                      ? 'Saving...' 
                      : (handoverModalBooking.status === 'Pickup' || handoverModalBooking.handover_status === 'Handed Over' || handoverModalBooking.handover_status === 'Active Trip')
                      ? 'Save & Finalize Return' 
                      : (handoverModalBooking.status === 'Completed' || handoverModalBooking.handover_status === 'Returned')
                      ? 'Update Inspection Record'
                      : 'Save & Hand Over Vehicle'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL EMAIL VOUCHER MODAL */}
      {showEmailOverrideModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header py-3 px-4 bg-light border-bottom">
                <h6 className="modal-title fw-bold text-dark d-flex align-items-center gap-2 mb-0" style={{ fontSize: '0.85rem' }}>
                  <Mail size={15} className="text-primary" /> Send Voucher via Email
                </h6>
                <button type="button" className="btn-close" onClick={() => setShowEmailOverrideModal(false)} />
              </div>
              <div className="modal-body p-4 text-xs">
                <label className="form-label fw-bold text-secondary mb-1">Customer Gmail / Email *</label>
                <input
                  type="email"
                  className="form-control form-control-sm rounded-2 font-monospace mb-2"
                  placeholder="customer@gmail.com"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  autoFocus
                />
                <small className="text-muted d-block">
                  The branded trip confirmation voucher will be emailed to this address with full vehicle &amp; schedule details.
                </small>
              </div>
              <div className="modal-footer py-2 px-3 bg-light border-top d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => setShowEmailOverrideModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-3 fw-bold d-flex align-items-center gap-1.5"
                  disabled={isEmailSending || !customEmailInput.includes('@')}
                  onClick={() => handleDispatchVoucherEmail(selected, customEmailInput)}
                >
                  {isEmailSending ? <Loader2 size={12} className="spinner-border spinner-border-sm" /> : <Send size={12} />}
                  <span>Send Voucher Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* A4 CORPORATE BOOKING VOUCHER PREVIEW / PRINT MODAL */}
      {selectedVoucherModal && (
        <BookingVoucher
          booking={selectedVoucherModal}
          currentUser={currentUser}
          onClose={() => setSelectedVoucherModal(null)}
          isModal={true}
        />
      )}

      <WalletRechargeRequiredModal
        show={blockedModal.show}
        isOpen={blockedModal.show}
        balance={blockedModal.balance}
        negativeBookingCount={blockedModal.negativeBookingCount}
        maxNegativeBookings={blockedModal.maxNegativeBookings}
        onClose={() => setBlockedModal(prev => ({ ...prev, show: false }))}
        onAddMoney={() => {
          setBlockedModal(prev => ({ ...prev, show: false }));
          if (onNavigate) {
            onNavigate('wallet');
          } else {
            window.dispatchEvent(new CustomEvent('navigate-vendor-tab', { detail: 'wallet' }));
          }
        }}
      />
    </div>
  );
}
