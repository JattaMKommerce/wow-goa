import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Eye, Wallet, Calendar, Star, Filter, ChevronRight, X, Download, 
  UserPlus, Shield, Plus, CheckCircle, AlertCircle, RefreshCw, Key, Phone, Mail, MapPin, 
  UserCheck, ToggleLeft, ToggleRight, Cake, Send, Gift, Crown, History, Settings, Sparkles, CheckCircle2, Car, Hotel, Compass, Building2, Tag, Edit2
} from 'lucide-react';
import * as api from '../../services/api';
import { calculateLoyaltyTiers, formatBirthdayDisplay } from '../../utils/loyaltyHelper';

function StatusBadge({ status }) {
  const m = { 
    active: ['#dcfce7', '#16a34a'], 
    suspended: ['#fee2e2', '#dc2626'], 
    inactive: ['#fee2e2', '#dc2626'],
    pending: ['#fef9c3', '#ca8a04'], 
    confirmed: ['#dbeafe', '#2563eb'], 
    cancelled: ['#fee2e2', '#dc2626'] 
  };
  const [bg, color] = m[status?.toLowerCase()] || ['#f1f5f9', '#64748b'];
  return <span className="px-2 py-1 rounded-pill fw-bold" style={{ background: bg, color, fontSize: '0.65rem', textTransform: 'uppercase' }}>{status || 'Active'}</span>;
}

function RoleBadge({ role }) {
  const m = {
    admin: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    superadmin: { bg: '#fdf2f8', color: '#db2777', border: '#fbcfe8' },
    subadmin: { bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' },
    agent: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    customer: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
    vendor: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }
  };
  const c = m[role?.toLowerCase()] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  return (
    <span 
      className="px-2 py-0.5 rounded-pill fw-bold" 
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '0.68rem', textTransform: 'capitalize' }}
    >
      {role || 'User'}
    </span>
  );
}

function TierBadgeMini({ tier, icon, count, category }) {
  const colors = {
    Platinum: { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' },
    Gold: { bg: '#fef9c3', color: '#a16207', border: '#fde047' },
    Silver: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    Bronze: { bg: '#ffedd5', color: '#c2410c', border: '#fdba74' }
  };
  const c = colors[tier] || colors.Bronze;
  return (
    <span 
      className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill fw-bold" 
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '0.68rem' }}
      title={`${category}: ${tier} (${count} completed bookings)`}
    >
      <span>{icon}</span>
      <span>{tier}</span>
      <span className="text-muted" style={{ fontSize: '0.6rem' }}>({count})</span>
    </span>
  );
}

export default function AdminCustomerManagement({ usersList = [], bookings = [], initialOpenAddUser = false, currentUser }) {
  const [activeMainTab, setActiveMainTab] = useState('directory'); // 'directory' | 'birthdays_today' | 'birthday_logs' | 'birthday_settings'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [liveBookings, setLiveBookings] = useState(bookings);

  // Birthday Management State
  const [todayBirthdays, setTodayBirthdays] = useState([]);
  const [loadingBirthdays, setLoadingBirthdays] = useState(false);
  const [birthdayLogs, setBirthdayLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [birthdayOffers, setBirthdayOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [wishSendingPhone, setWishSendingPhone] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);
  const [cronRunning, setCronRunning] = useState(false);

  // Customer Wallet Drawer State
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loadingSelectedWallet, setLoadingSelectedWallet] = useState(false);

  useEffect(() => {
    if (selected?.phone || selected?.id) {
      setLoadingSelectedWallet(true);
      api.fetchCustomerWallet(selected.phone, selected.id).then(res => {
        setSelectedWallet(res);
      }).catch(() => {
        setSelectedWallet(null);
      }).finally(() => {
        setLoadingSelectedWallet(false);
      });
    } else {
      setSelectedWallet(null);
    }
  }, [selected]);

  // B2B Partner & Pricing Rules State
  const [b2bPartners, setB2bPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [b2bRules, setB2bRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [b2bAuditLogs, setB2bAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [b2bSubTab, setB2bSubTab] = useState('partners'); // 'partners' | 'rules' | 'logs'
  const [b2bStatusFilter, setB2bStatusFilter] = useState('all'); // 'all' | 'pending' | 'active' | 'rejected'
  const [viewingPartner, setViewingPartner] = useState(null);
  const [rejectingPartner, setRejectingPartner] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerFormData, setPartnerFormData] = useState({
    id: '',
    username: '',
    company_name: '',
    business_type: 'Travel Agency',
    name: '',
    phone: '',
    email: '',
    website: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    state: 'Goa',
    country: 'India',
    pincode: '',
    password: '',
    default_commission_rate: 10.0,
    default_net_discount_rate: 10.0,
    allow_commission: 1,
    allow_non_commission: 1,
    status: 'active'
  });
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleFormData, setRuleFormData] = useState({
    partner_id: 'all',
    service_type: 'all',
    commission_percent: 10.0,
    net_discount_percent: 10.0,
    is_active: 1,
    notes: ''
  });

  const loadB2BData = async () => {
    setLoadingPartners(true);
    setLoadingRules(true);
    setLoadingAuditLogs(true);
    try {
      const [pts, rls, logs] = await Promise.all([
        api.fetchB2BPartners(),
        api.fetchB2BPricingRules(),
        api.fetchB2BAuditLogs()
      ]);
      setB2bPartners(Array.isArray(pts) ? pts : []);
      setB2bRules(Array.isArray(rls) ? rls : []);
      setB2bAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.warn('Failed to load B2B admin data:', err);
    } finally {
      setLoadingPartners(false);
      setLoadingRules(false);
      setLoadingAuditLogs(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'b2b_partners') {
      loadB2BData();
    }
  }, [activeMainTab]);

  const handleApprovePartner = async (partnerId) => {
    const target = b2bPartners.find(p => p.id === partnerId);
    const agencyName = target ? (target.company_name || target.name) : 'Partner';
    if (!window.confirm(`Are you sure you want to APPROVE B2B Partner "${agencyName}"? This will enable their B2B Portal access.`)) {
      return;
    }
    try {
      await api.b2bApprovePartner(partnerId);
      if (viewingPartner && viewingPartner.id === partnerId) {
        setViewingPartner(prev => ({ ...prev, status: 'active', approved_at: new Date().toISOString() }));
      }
      await loadB2BData();
      setActionAlert({ type: 'success', text: `B2B Partner "${agencyName}" has been APPROVED and activated.` });
      setTimeout(() => setActionAlert(null), 3500);
    } catch (err) {
      alert(err.message || 'Failed to approve partner.');
    }
  };

  const handleRejectPartnerSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingPartner) return;
    try {
      await api.b2bRejectPartner(rejectingPartner.id, rejectReason);
      if (viewingPartner && viewingPartner.id === rejectingPartner.id) {
        setViewingPartner(prev => ({ ...prev, status: 'rejected', rejection_reason: rejectReason }));
      }
      setRejectingPartner(null);
      setRejectReason('');
      await loadB2BData();
      setActionAlert({ type: 'success', text: `B2B Partner "${rejectingPartner.company_name || rejectingPartner.name}" application was rejected.` });
      setTimeout(() => setActionAlert(null), 3500);
    } catch (err) {
      alert(err.message || 'Failed to reject partner.');
    }
  };

  const handleSavePartnerSubmit = async (e) => {
    e.preventDefault();
    if (!partnerFormData.company_name || !partnerFormData.phone) {
      alert('Please provide Agency Company Name and Phone.');
      return;
    }
    try {
      await api.saveB2BPartner(partnerFormData);
      setShowPartnerModal(false);
      await loadB2BData();
      setActionAlert({ type: 'success', text: `B2B Partner Agency ${partnerFormData.company_name} saved successfully!` });
      setTimeout(() => setActionAlert(null), 3500);
    } catch (err) {
      alert(err.message || 'Failed to save partner.');
    }
  };

  const handleSaveRuleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.saveB2BPricingRule(ruleFormData);
      setShowRuleModal(false);
      await loadB2BData();
      setActionAlert({ type: 'success', text: `B2B Pricing Rule saved successfully!` });
      setTimeout(() => setActionAlert(null), 3500);
    } catch (err) {
      alert(err.message || 'Failed to save rule.');
    }
  };

  // Add Users / Team Management Modal State
  const [showUsersModal, setShowUsersModal] = useState(initialOpenAddUser);
  const [usersSubTab, setUsersSubTab] = useState('list');
  const [allUsers, setAllUsers] = useState(usersList);
  useEffect(() => {
    if (Array.isArray(usersList)) {
      setAllUsers(usersList);
    }
  }, [usersList]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModalMessage, setUserModalMessage] = useState(null);

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    city: '',
    role: 'subadmin',
    password: '',
    status: 'active'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (initialOpenAddUser) {
      setShowUsersModal(true);
    }
  }, [initialOpenAddUser]);

  const loadLiveUsers = async () => {
    setLoadingUsers(true);
    try {
      const u = await api.fetchUsers();
      if (Array.isArray(u)) {
        setAllUsers(u);
      }
    } catch (err) {
      console.warn("Failed to fetch live users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadBirthdaysData = async () => {
    setLoadingBirthdays(true);
    try {
      const bdays = await api.fetchTodayBirthdays();
      setTodayBirthdays(bdays || []);
    } catch (e) {
      console.warn("Failed to load today's birthdays", e);
    } finally {
      setLoadingBirthdays(false);
    }
  };

  const loadLogsData = async () => {
    setLoadingLogs(true);
    try {
      const logs = await api.fetchBirthdayLogs();
      setBirthdayLogs(logs || []);
    } catch (e) {
      console.warn("Failed to load birthday logs", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadOffersData = async () => {
    setLoadingOffers(true);
    try {
      const offers = await api.fetchBirthdayOffers();
      setBirthdayOffers(offers || []);
    } catch (e) {
      console.warn("Failed to load birthday offers", e);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    loadBirthdaysData();
    loadOffersData();
    loadLiveUsers();
  }, []);

  // Synchronize liveBookings with prop updates
  useEffect(() => {
    if (Array.isArray(bookings)) {
      setLiveBookings(prev => {
        const idMap = new Map();
        prev.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
        bookings.forEach(b => { if (b?.id) idMap.set(String(b.id), b); });
        return Array.from(idMap.values());
      });
    }
  }, [bookings]);

  // Real-time booking synchronization & cross-tab sync
  useEffect(() => {
    const fetchFresh = async () => {
      try {
        const freshBookings = await api.fetchBookings();
        if (Array.isArray(freshBookings) && freshBookings.length > 0) {
          setLiveBookings(prev => {
            if (
              prev.length === freshBookings.length &&
              prev.every((b, idx) => b.id === freshBookings[idx].id && b.status === freshBookings[idx].status && b.payment_status === freshBookings[idx].payment_status)
            ) {
              return prev;
            }
            return freshBookings;
          });
        }
        const freshUsers = await api.fetchUsers();
        if (Array.isArray(freshUsers) && freshUsers.length > 0) {
          setAllUsers(prev => {
            if (
              prev.length === freshUsers.length &&
              prev.every((u, idx) => u.id === freshUsers[idx].id && u.role === freshUsers[idx].role && u.name === freshUsers[idx].name)
            ) {
              return prev;
            }
            return freshUsers;
          });
        }
      } catch (e) {}
    };

    const handleNewBooking = (e) => {
      if (e?.detail) {
        setLiveBookings(prev => {
          const id = String(e.detail.id);
          const exists = prev.some(b => String(b.id) === id);
          return exists ? prev.map(b => String(b.id) === id ? { ...b, ...e.detail } : b) : [e.detail, ...prev];
        });
      }
      fetchFresh();
    };

    window.addEventListener('new-booking-created', handleNewBooking);
    window.addEventListener('booking-updated', handleNewBooking);
    window.addEventListener('booking-status-updated', handleNewBooking);
    window.addEventListener('booking-deleted', fetchFresh);
    window.addEventListener('tripgalileo-booking-sync', handleNewBooking);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('tripgalileo_bookings_sync');
        bc.onmessage = () => fetchFresh();
      }
    } catch (e) {}

    const interval = setInterval(fetchFresh, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('new-booking-created', handleNewBooking);
      window.removeEventListener('booking-updated', handleNewBooking);
      window.removeEventListener('booking-status-updated', handleNewBooking);
      window.removeEventListener('booking-deleted', fetchFresh);
      window.removeEventListener('tripgalileo-booking-sync', handleNewBooking);
      if (bc) bc.close();
    };
  }, []);

  useEffect(() => {
    if (activeMainTab === 'birthdays_today') loadBirthdaysData();
    if (activeMainTab === 'birthday_logs') loadLogsData();
    if (activeMainTab === 'birthday_settings') loadOffersData();
  }, [activeMainTab]);

  useEffect(() => {
    if (showUsersModal) {
      loadLiveUsers();
    }
  }, [showUsersModal]);

  const handleSendWish = async (cust) => {
    setWishSendingPhone(cust.phone);
    try {
      await api.sendBirthdayWish({
        customer_id: cust.customer_id || cust.id,
        name: cust.name,
        phone: cust.phone,
        email: cust.email,
        tier: cust.highest_tier || 'Bronze',
        channel: 'SMS'
      });
      setActionAlert({ type: 'success', text: `Birthday wishes sent successfully to ${cust.name}!` });
      await loadBirthdaysData();
      setTimeout(() => setActionAlert(null), 4000);
    } catch (e) {
      setActionAlert({ type: 'error', text: e.message || 'Failed to send birthday wish' });
      setTimeout(() => setActionAlert(null), 4000);
    } finally {
      setWishSendingPhone(null);
    }
  };

  const handleRunBirthdayCron = async () => {
    setCronRunning(true);
    try {
      const res = await api.runBirthdayCron();
      const alertType = (res?.sent_count > 0) ? 'success' : 'info';
      const alertMsg = res?.message || `Daily Birthday Job Executed: ${res?.sent_count || 0} messages sent, ${res?.skipped_duplicate_count || 0} duplicates skipped.`;
      setActionAlert({ 
        type: alertType, 
        text: alertMsg
      });
      await loadBirthdaysData();
      await loadLogsData();
      setTimeout(() => setActionAlert(null), 6000);
    } catch (e) {
      setActionAlert({ type: 'error', text: e.message || 'Cron execution failed' });
      setTimeout(() => setActionAlert(null), 5000);
    } finally {
      setCronRunning(false);
    }
  };

  const handleSaveOfferTemplate = async (tier, title, discountAmt, discountPct, template) => {
    try {
      await api.saveBirthdayOffer({
        tier,
        title,
        discount_amount: discountAmt,
        discount_percent: discountPct,
        message_template: template
      });
      setActionAlert({ type: 'success', text: `Birthday offer updated for ${tier} tier!` });
      await loadOffersData();
      setTimeout(() => setActionAlert(null), 3000);
    } catch (e) {
      setActionAlert({ type: 'error', text: e.message || 'Failed to update offer' });
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.toggleUserStatus(user.id, nextStatus);
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      setUserModalMessage({ type: 'success', text: `User ${user.name || user.username} is now ${nextStatus}.` });
      setTimeout(() => setUserModalMessage(null), 3000);
    } catch (err) {
      setUserModalMessage({ type: 'error', text: err.message || 'Failed to update user status.' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert("Name and email are required.");
      return;
    }
    setCreatingUser(true);
    setUserModalMessage(null);
    try {
      const payload = {
        name: newUser.name.trim(),
        username: (newUser.username.trim() || newUser.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        email: newUser.email.trim(),
        phone: newUser.phone.trim(),
        city: newUser.city.trim() || 'Goa',
        role: newUser.role,
        password: newUser.password.trim() || 'Pass@123',
        status: newUser.status
      };
      const res = await api.addUser(payload);
      if (res.success) {
        setUserModalMessage({ type: 'success', text: `User ${payload.name} (${payload.role}) created successfully!` });
        setNewUser({
          name: '',
          username: '',
          email: '',
          phone: '',
          city: '',
          role: 'subadmin',
          password: '',
          status: 'active'
        });
        await loadLiveUsers();
        setUsersSubTab('list');
      } else {
        throw new Error(res.error || 'Failed to create user');
      }
    } catch (err) {
      setUserModalMessage({ type: 'error', text: err.message || 'Error creating user' });
    } finally {
      setCreatingUser(false);
    }
  };

  // Derive real customer records dynamically from registered users & live bookings
  const customerMap = new Map();

  // 1. Registered customer users from DB
  (allUsers.length > 0 ? allUsers : usersList).filter(u => u.role === 'customer' || !u.role).forEach(u => {
    const key = (u.phone || u.email || u.username || String(u.id)).toLowerCase();
    const uTime = u.created_at ? new Date(String(u.created_at).replace(' ', 'T')).getTime() || 0 : 0;
    customerMap.set(key, {
      id: u.id,
      name: u.name || u.username || 'Customer',
      email: u.email || '',
      phone: u.phone || '—',
      date_of_birth: u.date_of_birth || '',
      city: u.city || 'Goa',
      joined: u.created_at ? String(u.created_at).slice(0, 10) : '2026-08-01',
      status: u.status || 'active',
      bookings: 0,
      spent: 0,
      wallet: 0,
      kyc: u.kyc_status || 'verified',
      latest_timestamp: uTime,
      rawBookings: []
    });
  });

  // 2. Customers with active bookings from DB
  (liveBookings || []).forEach(b => {
    const key = (b.phone || b.email || b.name || '').toLowerCase();
    if (!key) return;
    const bAmt = Number(b.total_amount || b.total_paid || b.amount_paid || 0) || 0;
    const bDateStr = b.created_at || b.pickup_date || '';
    const bTime = bDateStr ? new Date(bDateStr.replace(' ', 'T')).getTime() || 0 : 0;

    if (customerMap.has(key)) {
      const existing = customerMap.get(key);
      existing.bookings += 1;
      existing.spent += bAmt;
      if (bTime >= (existing.latest_timestamp || 0)) {
        existing.latest_timestamp = bTime;
      }
      if (!existing.phone || existing.phone === '—') existing.phone = b.phone || '—';
      if (!existing.email && b.email) existing.email = b.email;
      if (!existing.date_of_birth && b.date_of_birth) existing.date_of_birth = b.date_of_birth;
      existing.rawBookings.push(b);
    } else {
      customerMap.set(key, {
        id: b.id || `CUST-${Math.random().toString(36).substr(2, 6)}`,
        name: b.name || 'Direct Customer',
        email: b.email || '',
        phone: b.phone || '—',
        date_of_birth: b.date_of_birth || '',
        city: b.pickup_loc || 'Goa',
        joined: (b.created_at ? String(b.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10)),
        status: 'active',
        bookings: 1,
        spent: bAmt,
        wallet: 0,
        kyc: 'verified',
        latest_timestamp: bTime,
        rawBookings: [b]
      });
    }
  });

  // Compute Loyalty Tiers for each customer and sort latest to previous
  const allCustomers = Array.from(customerMap.values()).map(c => {
    if (Array.isArray(c.rawBookings)) {
      c.rawBookings.sort((a, b) => new Date(b.created_at || b.pickup_date || 0) - new Date(a.created_at || a.pickup_date || 0));
    }
    const tiers = calculateLoyaltyTiers(c.rawBookings);
    return {
      ...c,
      tiers: tiers,
      carTier: tiers.car,
      hotelTier: tiers.hotel,
      tripTier: tiers.trip,
      highestTier: tiers.highest_tier
    };
  }).sort((a, b) => {
    const timeA = a.latest_timestamp || new Date(a.joined || 0).getTime() || 0;
    const timeB = b.latest_timestamp || new Date(b.joined || 0).getTime() || 0;
    return timeB - timeA;
  });

  const filtered = allCustomers.filter(c => {
    const matchStatus = statusFilter === 'all' || (c.status || '').toLowerCase() === statusFilter.toLowerCase();
    const query = search.toLowerCase();
    const matchSearch = String(c.name || '').toLowerCase().includes(query) || 
      String(c.email || '').toLowerCase().includes(query) || 
      String(c.phone || '').includes(query);
    return matchStatus && matchSearch;
  });

  const customerBookings = selected ? (liveBookings || []).filter(b => b.name === selected.name || b.phone === selected.phone || b.customer_id === selected.id) : [];

  const handleExportCSV = () => {
    if (!filtered || filtered.length === 0) {
      alert("No customer records to export.");
      return;
    }
    const headers = ["Customer Name", "Email", "Phone", "Date of Birth", "Car Tier", "Hotel Tier", "Trip Tier", "City", "Member Since", "Status", "Total Bookings", "Total Spent (INR)"];
    const rows = filtered.map(c => [
      `"${c.name || ''}"`,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.date_of_birth || ''}"`,
      `"${c.carTier?.tier || 'Bronze'} (${c.carTier?.count || 0})"`,
      `"${c.hotelTier?.tier || 'Bronze'} (${c.hotelTier?.count || 0})"`,
      `"${c.tripTier?.tier || 'Bronze'} (${c.tripTier?.count || 0})"`,
      `"${c.city || ''}"`,
      `"${c.joined || ''}"`,
      `"${c.status || ''}"`,
      c.bookings,
      c.spent
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wowgoa_customers_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4">
      {/* Action Notification Alert */}
      {actionAlert && (
        <div className={`alert ${actionAlert.type === 'success' ? 'alert-success text-success' : actionAlert.type === 'info' ? 'alert-info text-info-emphasis' : 'alert-danger text-danger'} border-0 shadow-sm rounded-3 py-2.5 px-4 d-flex align-items-center justify-content-between mb-4 text-xs animate-fade-in`}>
          <div className="d-flex align-items-center gap-2">
            <CheckCircle2 size={16} />
            <span className="fw-semibold">{actionAlert.text}</span>
          </div>
          <button className="btn btn-sm p-0 border-0" onClick={() => setActionAlert(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3">
        <div>
          <h5 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '18px' }}>Customer CRM & Loyalty Management</h5>
          <p className="mb-0 mt-0.5" style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Manage customer directories, service-specific loyalty tiers, birthdays, and automated greetings.
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button 
            onClick={handleRunBirthdayCron}
            disabled={cronRunning}
            className="btn btn-sm rounded-pill fw-bold px-3 py-2 text-white shadow-sm d-flex align-items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, #FF6026 0%, #E04D15 100%)', border: 'none', fontSize: '0.8rem' }}
          >
            <Sparkles size={14} className={cronRunning ? 'animate-spin' : ''} />
            {cronRunning ? 'Running Cron...' : 'Run Birthday Automation'}
          </button>

          <button 
            onClick={() => setShowUsersModal(true)}
            className="btn btn-sm rounded-pill fw-bold px-3 py-2 d-flex align-items-center gap-1.5"
            style={{ background: '#0D1B2E', color: '#fff', border: 'none', fontSize: '0.8rem' }}
          >
            <Users size={14} /> Team & Sub-Admins ({allUsers.filter(u => ['subadmin', 'agent'].includes(u.role)).length})
          </button>

          <button 
            onClick={handleExportCSV}
            className="btn btn-sm rounded-pill fw-bold px-3 py-2 d-flex align-items-center gap-1.5"
            style={{ background: '#fff', color: '#0D1B2E', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main CRM Navigation Tabs */}
      <div className="d-flex flex-wrap align-items-center border-bottom mb-4 gap-2">
        <button
          onClick={() => setActiveMainTab('directory')}
          className={`btn btn-sm fw-bold px-3.5 py-2.5 rounded-top-3 border-0 d-flex align-items-center gap-2 ${activeMainTab === 'directory' ? 'bg-white text-primary shadow-sm border-bottom border-primary border-2' : 'text-muted'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <Users size={16} /> Customer Directory ({allCustomers.length})
        </button>

        <button
          onClick={() => setActiveMainTab('birthdays_today')}
          className={`btn btn-sm fw-bold px-3.5 py-2.5 rounded-top-3 border-0 d-flex align-items-center gap-2 ${activeMainTab === 'birthdays_today' ? 'bg-white text-danger shadow-sm border-bottom border-danger border-2' : 'text-muted'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <Cake size={16} className="text-danger" /> 
          <span>Today's Birthdays</span>
          {todayBirthdays.length > 0 && (
            <span className="badge bg-danger text-white rounded-pill px-2 py-0.5 text-xs">
              {todayBirthdays.length} Today
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('birthday_logs')}
          className={`btn btn-sm fw-bold px-3.5 py-2.5 rounded-top-3 border-0 d-flex align-items-center gap-2 ${activeMainTab === 'birthday_logs' ? 'bg-white text-dark shadow-sm border-bottom border-dark border-2' : 'text-muted'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <History size={16} /> Birthday History Logs
        </button>

        <button
          onClick={() => setActiveMainTab('birthday_settings')}
          className={`btn btn-sm fw-bold px-3.5 py-2.5 rounded-top-3 border-0 d-flex align-items-center gap-2 ${activeMainTab === 'birthday_settings' ? 'bg-white text-dark shadow-sm border-bottom border-dark border-2' : 'text-muted'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <Settings size={16} /> Birthday Offer Settings
        </button>

        <button
          onClick={() => setActiveMainTab('b2b_partners')}
          className={`btn btn-sm fw-bold px-3.5 py-2.5 rounded-top-3 border-0 d-flex align-items-center gap-2 ${activeMainTab === 'b2b_partners' ? 'bg-white text-dark shadow-sm border-bottom border-dark border-2' : 'text-muted'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <Building2 size={16} className="text-warning" /> 
          <span>💼 B2B Partners & Rules</span>
          {b2bPartners.length > 0 && (
            <span className="badge bg-dark text-warning rounded-pill px-2 py-0.5 text-xs">
              {b2bPartners.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: CUSTOMER DIRECTORY & TIERS ─── */}
      {activeMainTab === 'directory' && (
        <div className="animate-fade-in">
          {/* Stats */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="rounded-4 p-3 bg-white shadow-sm border">
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL CUSTOMERS</div>
                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#0D1B2E' }}>{allCustomers.length}</div>
                <div style={{ fontSize: '0.7rem', color: '#16a34a' }}>Registered & Booking Guests</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="rounded-4 p-3 bg-white shadow-sm border">
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>ACTIVE ACCOUNTS</div>
                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#16a34a' }}>{allCustomers.filter(c => c.status === 'active').length}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Verified profiles</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="rounded-4 p-3 bg-white shadow-sm border">
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>PLATINUM MEMBERS</div>
                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#8b5cf6' }}>
                  {allCustomers.filter(c => c.highestTier === 'Platinum').length}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#8b5cf6' }}>10+ Completed Trips</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="rounded-4 p-3 bg-white shadow-sm border">
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL REVENUE</div>
                <div className="fw-bold mt-1" style={{ fontSize: '1.4rem', color: '#0D1B2E' }}>₹{(allCustomers.reduce((s, c) => s + c.spent, 0) / 1000).toFixed(1)}K</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cumulative bookings</div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="rounded-4 p-3 mb-4 d-flex flex-wrap gap-2 align-items-center justify-content-between bg-white border shadow-sm">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '420px' }}>
              <Search size={15} style={{ color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control form-control-sm border-0 shadow-none"
                placeholder="Search customers by name, phone, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
              {['all', 'active', 'suspended'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="btn btn-sm px-2.5 py-1 rounded-pill fw-bold"
                  style={{
                    fontSize: '0.7rem',
                    background: statusFilter === s ? '#0D1B2E' : '#f1f5f9',
                    color: statusFilter === s ? '#fff' : '#64748b',
                    textTransform: 'capitalize',
                    border: 'none'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Table */}
          <div className="rounded-4 shadow-sm bg-white border overflow-hidden">
            <div className="table-responsive">
              <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Customer</th>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Contact</th>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>🎂 Birthday</th>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>🚗 Car Tier</th>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>🏨 Hotel Tier</th>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>🧳 Trip Tier</th>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Spent</th>
                    <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                    <th className="px-3 py-3 fw-bold text-muted text-end" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }} onClick={() => setSelected(c)}>
                      <td className="px-3 py-3">
                        <div className="fw-bold" style={{ color: '#0D1B2E' }}>{c.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Member since {c.joined}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div>{c.phone}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.email || '—'}</div>
                      </td>
                      <td className="px-3 py-3">
                        {c.date_of_birth ? (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill">
                            🎂 {formatBirthdayDisplay(c.date_of_birth)}
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <TierBadgeMini tier={c.carTier?.tier || 'Bronze'} icon="🚗" count={c.carTier?.count || 0} category="Car Tier" />
                      </td>
                      <td className="px-3 py-3">
                        <TierBadgeMini tier={c.hotelTier?.tier || 'Bronze'} icon="🏨" count={c.hotelTier?.count || 0} category="Hotel Tier" />
                      </td>
                      <td className="px-3 py-3">
                        <TierBadgeMini tier={c.tripTier?.tier || 'Bronze'} icon="🧳" count={c.tripTier?.count || 0} category="Trip Tier" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="fw-bold text-success">₹{c.spent.toLocaleString()}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{c.bookings} booking{c.bookings !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-3 py-3 text-end" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => setSelected(c)}
                          className="btn btn-sm btn-light border rounded-pill px-2.5 py-1 text-xs fw-bold text-dark"
                        >
                          <Eye size={12} className="me-1 inline" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center py-5 text-muted">
                        No customer records matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TODAY'S BIRTHDAYS ─── */}
      {activeMainTab === 'birthdays_today' && (
        <div className="animate-fade-in">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <div>
                <h6 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '16px' }}>
                  🎂 Today's Customer Birthdays ({new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })})
                </h6>
                <p className="text-muted text-xs mb-0">
                  Customers celebrating their birthday today. Personalized greetings are matched against their highest tier.
                </p>
              </div>
              <button 
                onClick={loadBirthdaysData} 
                disabled={loadingBirthdays}
                className="btn btn-sm btn-light border rounded-pill px-3 py-1.5 text-xs fw-bold"
              >
                <RefreshCw size={13} className={`me-1 inline ${loadingBirthdays ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {todayBirthdays.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-4 border">
                <div className="text-muted mb-2">
                  <Cake size={48} className="mx-auto text-secondary opacity-50" />
                </div>
                <h6 className="fw-bold text-dark mb-1">No Customer Birthdays Today</h6>
                <p className="text-muted text-xs mb-0">
                  Any customer whose date of birth matches today's date will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="table-responsive rounded-3 border">
                <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Customer</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Phone & Email</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>DOB</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Highest Tier</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                      <th className="px-3 py-3 fw-bold text-muted text-end" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayBirthdays.map((b, i) => {
                      const isSent = b.status === 'Sent';
                      return (
                        <tr key={b.id || i} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <td className="px-3 py-3">
                            <div className="fw-bold" style={{ color: '#0D1B2E' }}>{b.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Customer ID: {b.customer_id}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div>{b.phone}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.email || '—'}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill">
                              🎂 {b.formatted_dob || b.date_of_birth}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill fw-bold">
                              👑 {b.highest_tier}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {isSent ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1">
                                <CheckCircle2 size={12} /> Sent ({b.sent_at ? String(b.sent_at).slice(11,16) : 'Today'})
                              </span>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2.5 py-1 rounded-pill fw-bold">
                                ⚠️ Pending Send
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-end">
                            <button
                              onClick={() => handleSendWish(b)}
                              disabled={wishSendingPhone === b.phone}
                              className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold ${isSent ? 'btn-light border text-muted' : 'btn-warning text-dark'}`}
                            >
                              <Send size={12} className={`me-1 inline ${wishSendingPhone === b.phone ? 'animate-spin' : ''}`} />
                              {wishSendingPhone === b.phone ? 'Sending...' : (isSent ? 'Resend Wish' : 'Send Birthday Wishes')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: BIRTHDAY NOTIFICATION LOGS ─── */}
      {activeMainTab === 'birthday_logs' && (
        <div className="animate-fade-in">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '16px' }}>
                  📜 Birthday Communication Audit Logs
                </h6>
                <p className="text-muted text-xs mb-0">
                  Chronological history of all automated and manual birthday wishes dispatched to customers.
                </p>
              </div>
              <button 
                onClick={loadLogsData} 
                disabled={loadingLogs}
                className="btn btn-sm btn-light border rounded-pill px-3 py-1.5 text-xs fw-bold"
              >
                <RefreshCw size={13} className={`me-1 inline ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh Logs
              </button>
            </div>

            {birthdayLogs.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-4 border">
                <History size={48} className="mx-auto text-secondary opacity-50 mb-2" />
                <h6 className="fw-bold text-dark mb-1">No Sent Logs Recorded Yet</h6>
                <p className="text-muted text-xs mb-0">Sent birthday notifications will be logged here with complete timestamps.</p>
              </div>
            ) : (
              <div className="table-responsive rounded-3 border">
                <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Sent Timestamp</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Customer</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Phone</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Tier Applied</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Channel</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                      <th className="px-3 py-3 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Message Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {birthdayLogs.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td className="px-3 py-3 text-muted" style={{ fontSize: '0.75rem' }}>
                          {l.sent_at || l.created_at || '—'}
                        </td>
                        <td className="px-3 py-3 fw-bold" style={{ color: '#0D1B2E' }}>
                          {l.customer_name}
                        </td>
                        <td className="px-3 py-3">{l.phone}</td>
                        <td className="px-3 py-3">
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5 rounded-pill fw-bold">
                            {l.highest_tier || 'Bronze'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="badge bg-light text-dark border px-2 py-0.5 rounded">{l.channel || 'SMS'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-0.5 rounded-pill fw-bold">
                            {l.status || 'Sent'}
                          </span>
                        </td>
                        <td className="px-3 py-3" style={{ maxWidth: '280px' }}>
                          <span className="text-muted text-truncate d-block" style={{ fontSize: '0.72rem' }} title={l.message_text}>
                            {l.message_text}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: BIRTHDAY OFFER SETTINGS ─── */}
      {activeMainTab === 'birthday_settings' && (
        <div className="animate-fade-in">
          <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
            <h6 className="fw-black text-dark mb-1 font-heading" style={{ fontSize: '16px' }}>
              ⚙️ Tier-Specific Birthday Perk Settings
            </h6>
            <p className="text-muted text-xs mb-4">
              Configure discount vouchers and greeting templates sent automatically on customer birthdays.
            </p>

            <div className="row g-4">
              {['Bronze', 'Silver', 'Gold', 'Platinum'].map(tier => {
                const existing = birthdayOffers.find(o => o.tier === tier) || {
                  title: `${tier} Birthday Perk`,
                  discount_amount: tier === 'Platinum' ? 2000 : (tier === 'Gold' ? 1000 : (tier === 'Silver' ? 500 : 0)),
                  discount_percent: tier === 'Platinum' ? 15 : (tier === 'Gold' ? 10 : (tier === 'Silver' ? 5 : 0)),
                  message_template: `Warm birthday wishes from WOW GOA for our valued ${tier} member! 🌴`
                };

                return (
                  <div key={tier} className="col-12 col-md-6">
                    <div className="card h-100 border rounded-4 p-3.5 bg-light shadow-sm">
                      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-3 p-1.5 bg-dark text-white text-xs fw-bold">
                            {tier === 'Platinum' ? '💎' : tier === 'Gold' ? '🥇' : tier === 'Silver' ? '🥈' : '🥉'}
                          </div>
                          <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '14px' }}>{tier} Member Perk</h6>
                        </div>
                        <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-xs">
                          {tier === 'Platinum' ? '10+ Trips' : tier === 'Gold' ? '7–9 Trips' : tier === 'Silver' ? '4–6 Trips' : '1–3 Trips'}
                        </span>
                      </div>

                      <div className="mb-2">
                        <label className="form-label text-xs fw-bold text-muted">Perk / Offer Title</label>
                        <input
                          type="text"
                          className="form-control form-control-sm text-xs"
                          defaultValue={existing.title}
                          id={`title_${tier}`}
                        />
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label text-xs fw-bold text-muted">Discount Value (₹)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm text-xs"
                            defaultValue={existing.discount_amount}
                            id={`amt_${tier}`}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label text-xs fw-bold text-muted">Discount (%)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm text-xs"
                            defaultValue={existing.discount_percent}
                            id={`pct_${tier}`}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label text-xs fw-bold text-muted">Message Template</label>
                        <textarea
                          className="form-control form-control-sm text-xs"
                          rows="3"
                          defaultValue={existing.message_template}
                          id={`tpl_${tier}`}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-dark w-100 rounded-pill fw-bold text-xs py-1.5"
                        onClick={() => {
                          const tTitle = document.getElementById(`title_${tier}`)?.value || '';
                          const tAmt = parseInt(document.getElementById(`amt_${tier}`)?.value || 0);
                          const tPct = parseInt(document.getElementById(`pct_${tier}`)?.value || 0);
                          const tTpl = document.getElementById(`tpl_${tier}`)?.value || '';
                          handleSaveOfferTemplate(tier, tTitle, tAmt, tPct, tTpl);
                        }}
                      >
                        Save {tier} Offer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: B2B PARTNERS & PRICING RULES ─── */}
      {activeMainTab === 'b2b_partners' && (
        <div className="animate-fade-in">
          {/* Header & Subtabs */}
          <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 bg-white d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => setB2bSubTab('partners')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${b2bSubTab === 'partners' ? 'btn-dark text-white' : 'btn-light border'}`}
              >
                <Building2 size={14} className="me-1" /> Partner Agencies ({b2bPartners.length})
              </button>
              <button
                onClick={() => setB2bSubTab('rules')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${b2bSubTab === 'rules' ? 'btn-dark text-white' : 'btn-light border'}`}
              >
                <Tag size={14} className="me-1" /> Pricing Rules ({b2bRules.length})
              </button>
              <button
                onClick={() => setB2bSubTab('logs')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-xs ${b2bSubTab === 'logs' ? 'btn-dark text-white' : 'btn-light border'}`}
              >
                <History size={14} className="me-1" /> Audit Trail ({b2bAuditLogs.length})
              </button>
            </div>

            <div className="d-flex gap-2">
              {b2bSubTab === 'partners' && (
                <button
                  onClick={() => {
                    setPartnerFormData({
                      id: '',
                      username: '',
                      company_name: '',
                      name: '',
                      phone: '',
                      email: '',
                      password: '',
                      default_commission_rate: 10.0,
                      default_net_discount_rate: 10.0,
                      allow_commission: 1,
                      allow_non_commission: 1,
                      status: 'active'
                    });
                    setShowPartnerModal(true);
                  }}
                  className="btn btn-warning text-dark fw-bold btn-sm rounded-pill px-3 py-1.5 text-xs d-flex align-items-center gap-1.5 shadow-sm font-heading"
                >
                  <Plus size={15} /> Add B2B Agency
                </button>
              )}
              {b2bSubTab === 'rules' && (
                <button
                  onClick={() => {
                    setRuleFormData({
                      partner_id: 'all',
                      service_type: 'all',
                      commission_percent: 10.0,
                      net_discount_percent: 10.0,
                      is_active: 1,
                      notes: ''
                    });
                    setShowRuleModal(true);
                  }}
                  className="btn btn-warning text-dark fw-bold btn-sm rounded-pill px-3 py-1.5 text-xs d-flex align-items-center gap-1.5 shadow-sm font-heading"
                >
                  <Plus size={15} /> Add Pricing Rule
                </button>
              )}
            </div>
          </div>

          {/* Subtab 1: B2B Partners Table */}
          {b2bSubTab === 'partners' && (
            <div>
              {/* Status Filter Bar */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                {[
                  { id: 'all', label: 'All Applications', count: b2bPartners.length, color: 'btn-dark' },
                  { id: 'pending', label: '⏳ Pending Verification', count: b2bPartners.filter(p => (p.status || '').toLowerCase() === 'pending').length, color: 'btn-warning text-dark' },
                  { id: 'active', label: '✅ Approved / Active', count: b2bPartners.filter(p => (p.status || '').toLowerCase() === 'active').length, color: 'btn-success text-white' },
                  { id: 'rejected', label: '❌ Rejected', count: b2bPartners.filter(p => (p.status || '').toLowerCase() === 'rejected').length, color: 'btn-danger text-white' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setB2bStatusFilter(f.id)}
                    className={`btn btn-sm rounded-pill px-3 py-1 text-xs fw-bold ${b2bStatusFilter === f.id ? f.color : 'btn-light border'}`}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>

              <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.83rem' }}>
                    <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th className="ps-3 py-3">Agency</th>
                        <th className="py-3">Business Type</th>
                        <th className="py-3">Contact Person</th>
                        <th className="py-3">Business Contact</th>
                        <th className="py-3">City / State</th>
                        <th className="py-3">Status</th>
                        <th className="py-3">Registered Date</th>
                        <th className="pe-3 py-3 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingPartners ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">Loading B2B partner applications...</td>
                        </tr>
                      ) : b2bPartners.filter(p => b2bStatusFilter === 'all' || (p.status || 'pending').toLowerCase() === b2bStatusFilter).length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4 text-muted">No partner applications found matching current filter.</td>
                        </tr>
                      ) : (
                        b2bPartners
                          .filter(p => b2bStatusFilter === 'all' || (p.status || 'pending').toLowerCase() === b2bStatusFilter)
                          .map(p => {
                            const pStatus = (p.status || 'pending').toLowerCase();
                            return (
                              <tr key={p.id}>
                                <td className="ps-3">
                                  <div className="fw-bold text-dark font-heading">{p.company_name || p.name}</div>
                                  <div className="text-muted text-xxs font-monospace">@{p.username || p.email} • ID: {p.id}</div>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 text-xs">
                                    {p.business_type || 'Travel Agency'}
                                  </span>
                                </td>
                                <td className="fw-semibold text-dark">
                                  {p.contact_name || p.name || '—'}
                                </td>
                                <td>
                                  <div>{p.phone}</div>
                                  <div className="text-muted text-xxs">{p.email}</div>
                                </td>
                                <td>
                                  <div>{p.city || '—'}</div>
                                  <div className="text-muted text-xxs">{p.state || p.country || 'India'}</div>
                                </td>
                                <td>
                                  {pStatus === 'active' ? (
                                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 fw-bold text-xxs">
                                      ✅ ACTIVE
                                    </span>
                                  ) : pStatus === 'pending' ? (
                                    <span className="badge bg-warning bg-opacity-20 text-dark rounded-pill px-2.5 py-1 fw-bold text-xxs font-heading">
                                      ⏳ PENDING
                                    </span>
                                  ) : (
                                    <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill px-2.5 py-1 fw-bold text-xxs">
                                      ❌ REJECTED
                                    </span>
                                  )}
                                </td>
                                <td className="text-muted text-xxs">
                                  {p.created_at ? p.created_at.slice(0, 10) : '—'}
                                </td>
                                <td className="pe-3 text-end">
                                  <div className="d-flex justify-content-end gap-1">
                                    <button
                                      onClick={() => setViewingPartner(p)}
                                      className="btn btn-outline-secondary btn-sm rounded-circle p-1.5"
                                      title="View Application Details"
                                      style={{ width: '28px', height: '28px' }}
                                    >
                                      <Eye size={13} />
                                    </button>

                                    {pStatus === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleApprovePartner(p.id)}
                                          className="btn btn-success btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold"
                                          title="Approve Partner Application"
                                        >
                                          <CheckCircle size={12} className="me-1" /> Approve
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRejectingPartner(p);
                                            setRejectReason('');
                                          }}
                                          className="btn btn-outline-danger btn-sm rounded-pill px-2.5 py-1 text-xs"
                                          title="Reject Application"
                                        >
                                          <X size={12} className="me-1" /> Reject
                                        </button>
                                      </>
                                    )}

                                    {pStatus === 'active' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setPartnerFormData({
                                              id: p.id,
                                              username: p.username || '',
                                              company_name: p.company_name || '',
                                              business_type: p.business_type || 'Travel Agency',
                                              name: p.name || '',
                                              phone: p.phone || '',
                                              email: p.email || '',
                                              website: p.website || '',
                                              contact_name: p.contact_name || p.name || '',
                                              contact_email: p.contact_email || p.email || '',
                                              contact_phone: p.contact_phone || p.phone || '',
                                              address: p.address || '',
                                              city: p.city || '',
                                              state: p.state || 'Goa',
                                              country: p.country || 'India',
                                              pincode: p.pincode || '',
                                              password: '',
                                              default_commission_rate: p.default_commission_rate || 10.0,
                                              default_net_discount_rate: p.default_net_discount_rate || 10.0,
                                              allow_commission: p.allow_commission !== undefined ? p.allow_commission : 1,
                                              allow_non_commission: p.allow_non_commission !== undefined ? p.allow_non_commission : 1,
                                              status: p.status || 'active'
                                            });
                                            setShowPartnerModal(true);
                                          }}
                                          className="btn btn-outline-dark btn-sm rounded-pill px-2.5 py-1 text-xs"
                                          title="Edit Partner Agency Terms"
                                        >
                                          <Edit2 size={12} className="me-1" /> Edit
                                        </button>
                                        <button
                                          onClick={() => {
                                            setRejectingPartner(p);
                                            setRejectReason('Account suspended by admin');
                                          }}
                                          className="btn btn-outline-danger btn-sm rounded-circle p-1.5"
                                          title="Suspend / Reject Partner"
                                          style={{ width: '28px', height: '28px' }}
                                        >
                                          <X size={13} />
                                        </button>
                                      </>
                                    )}

                                    {pStatus === 'rejected' && (
                                      <button
                                        onClick={() => handleApprovePartner(p.id)}
                                        className="btn btn-outline-success btn-sm rounded-pill px-2.5 py-1 text-xs fw-bold"
                                        title="Re-Approve Partner"
                                      >
                                        <CheckCircle size={12} className="me-1" /> Re-Approve
                                      </button>
                                    )}
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
            </div>
          )}

          {/* Subtab 2: Pricing Rules Table */}
          {b2bSubTab === 'rules' && (
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.83rem' }}>
                  <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th className="ps-3 py-3">Partner Target</th>
                      <th className="py-3">Service Scope</th>
                      <th className="py-3">Commission %</th>
                      <th className="py-3">Net Discount %</th>
                      <th className="py-3">Rule Status</th>
                      <th className="py-3">Notes</th>
                      <th className="pe-3 py-3 text-end">Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRules ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">Loading pricing rules...</td>
                      </tr>
                    ) : b2bRules.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">No pricing rules defined.</td>
                      </tr>
                    ) : (
                      b2bRules.map(r => (
                        <tr key={r.id}>
                          <td className="ps-3 fw-bold font-heading">
                            {r.partner_id === 'all' ? (
                              <span className="badge bg-dark text-white rounded-pill px-2.5 py-1">🌐 All Partners (Global)</span>
                            ) : (
                              <span>{r.company_name || r.partner_id}</span>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 text-uppercase">
                              {r.service_type || 'all'}
                            </span>
                          </td>
                          <td className="fw-bold text-success">{r.commission_percent}%</td>
                          <td className="fw-bold text-primary">{r.net_discount_percent}%</td>
                          <td>
                            <span className={`badge rounded-pill px-2 py-0.5 ${r.is_active ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                              {r.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="text-muted text-xxs">{r.notes || '—'}</td>
                          <td className="pe-3 text-end">
                            <button
                              onClick={() => {
                                setRuleFormData({
                                  partner_id: r.partner_id || 'all',
                                  service_type: r.service_type || 'all',
                                  commission_percent: r.commission_percent || 10.0,
                                  net_discount_percent: r.net_discount_percent || 10.0,
                                  is_active: r.is_active !== undefined ? r.is_active : 1,
                                  notes: r.notes || ''
                                });
                                setShowRuleModal(true);
                              }}
                              className="btn btn-outline-dark btn-sm rounded-pill px-2.5 py-1 text-xs"
                            >
                              <Edit2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 3: Audit Logs Table */}
          {b2bSubTab === 'logs' && (
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.80rem' }}>
                  <thead className="table-light text-muted fw-semibold" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th className="ps-3 py-3">Timestamp</th>
                      <th className="py-3">Action</th>
                      <th className="py-3">Partner ID</th>
                      <th className="py-3">Booking ID</th>
                      <th className="py-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingAuditLogs ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">Loading audit logs...</td>
                      </tr>
                    ) : b2bAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">No audit trail records found.</td>
                      </tr>
                    ) : (
                      b2bAuditLogs.map(l => (
                        <tr key={l.id}>
                          <td className="ps-3 text-muted text-xxs font-monospace">{l.created_at}</td>
                          <td>
                            <span className="badge bg-dark text-warning rounded-pill px-2 py-0.5 text-xxs font-monospace">
                              {l.action}
                            </span>
                          </td>
                          <td className="font-monospace text-xs">{l.partner_id}</td>
                          <td className="font-monospace text-primary text-xs">{l.booking_id ? `#${l.booking_id}` : '—'}</td>
                          <td className="text-muted text-xs">{l.reason || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Partner View Details Modal */}
      {viewingPartner && (
        <div className="checkout-modal-backdrop animate-fade-in" onClick={() => setViewingPartner(null)} style={{ zIndex: 1060 }}>
          <div className="checkout-modal-content rounded-4 p-4 shadow-2xl bg-white" style={{ maxWidth: '620px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold text-dark font-heading mb-0">{viewingPartner.company_name || viewingPartner.name}</h5>
                <span className="text-muted text-xs">Application ID: {viewingPartner.id}</span>
              </div>
              <button className="btn btn-link text-muted p-0 border-0" onClick={() => setViewingPartner(null)}>✕</button>
            </div>

            {/* Application Overview Sections */}
            <div className="p-3 bg-light rounded-3 mb-3 border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-xs fw-bold text-muted text-uppercase">Account Status</span>
                <span className={`badge rounded-pill px-3 py-1 fw-bold text-xs ${
                  viewingPartner.status === 'active' ? 'bg-success text-white' : 
                  viewingPartner.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger text-white'
                }`}>
                  {viewingPartner.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              {viewingPartner.rejection_reason && (
                <div className="alert alert-danger py-1.5 px-2.5 rounded-2 text-xs mb-0 mt-2">
                  <strong>Rejection Reason:</strong> {viewingPartner.rejection_reason}
                </div>
              )}
            </div>

            <div className="row g-3 mb-3">
              {/* Business Info */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-3 h-100">
                  <h6 className="fw-bold text-xs text-uppercase text-muted border-bottom pb-1.5 mb-2 font-heading">
                    🏢 Business Information
                  </h6>
                  <div className="text-xs mb-1.5"><span className="text-muted">Type:</span> <strong>{viewingPartner.business_type || 'Travel Agency'}</strong></div>
                  <div className="text-xs mb-1.5"><span className="text-muted">Business Email:</span> <strong>{viewingPartner.email}</strong></div>
                  <div className="text-xs mb-1.5"><span className="text-muted">Business Phone:</span> <strong>{viewingPartner.phone}</strong></div>
                  <div className="text-xs mb-0"><span className="text-muted">Website:</span> <strong>{viewingPartner.website || '—'}</strong></div>
                </div>
              </div>

              {/* Primary Contact */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded-3 h-100">
                  <h6 className="fw-bold text-xs text-uppercase text-muted border-bottom pb-1.5 mb-2 font-heading">
                    👤 Primary Contact
                  </h6>
                  <div className="text-xs mb-1.5"><span className="text-muted">Name:</span> <strong>{viewingPartner.contact_name || viewingPartner.name || '—'}</strong></div>
                  <div className="text-xs mb-1.5"><span className="text-muted">Contact Email:</span> <strong>{viewingPartner.contact_email || viewingPartner.email || '—'}</strong></div>
                  <div className="text-xs mb-0"><span className="text-muted">Mobile:</span> <strong>{viewingPartner.contact_phone || viewingPartner.phone || '—'}</strong></div>
                </div>
              </div>

              {/* Address */}
              <div className="col-12">
                <div className="p-3 border rounded-3">
                  <h6 className="fw-bold text-xs text-uppercase text-muted border-bottom pb-1.5 mb-2 font-heading">
                    📍 Registered Address
                  </h6>
                  <div className="text-xs mb-1"><strong>{viewingPartner.address || '—'}</strong></div>
                  <div className="text-xs text-muted">
                    {viewingPartner.city || '—'}, {viewingPartner.state || '—'} - {viewingPartner.pincode || '—'}, {viewingPartner.country || 'India'}
                  </div>
                </div>
              </div>

              {/* System Details */}
              <div className="col-12">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="row g-2 text-xxs text-muted">
                    <div className="col-6">Username: <strong className="text-dark">@{viewingPartner.username}</strong></div>
                    <div className="col-6">Registered: <strong className="text-dark">{viewingPartner.created_at || '—'}</strong></div>
                    <div className="col-6">Approved Date: <strong className="text-dark">{viewingPartner.approved_at || '—'}</strong></div>
                    <div className="col-6">Approved By: <strong className="text-dark">{viewingPartner.approved_by || '—'}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
              <button type="button" className="btn btn-light btn-sm rounded-pill px-3" onClick={() => setViewingPartner(null)}>
                Close
              </button>

              <div className="d-flex gap-2">
                {viewingPartner.status !== 'rejected' && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm rounded-pill px-3"
                    onClick={() => {
                      setRejectingPartner(viewingPartner);
                      setRejectReason('');
                    }}
                  >
                    Reject Application
                  </button>
                )}
                {viewingPartner.status !== 'active' && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm rounded-pill px-4 fw-bold"
                    onClick={() => handleApprovePartner(viewingPartner.id)}
                  >
                    Approve Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Partner Modal */}
      {rejectingPartner && (
        <div className="checkout-modal-backdrop animate-fade-in" onClick={() => setRejectingPartner(null)} style={{ zIndex: 1070 }}>
          <div className="checkout-modal-content rounded-4 p-4 shadow-2xl bg-white" style={{ maxWidth: '460px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold text-danger font-heading mb-0">Reject B2B Application</h5>
              <button className="btn btn-link text-muted p-0 border-0" onClick={() => setRejectingPartner(null)}>✕</button>
            </div>
            <form onSubmit={handleRejectPartnerSubmit}>
              <p className="text-muted text-xs mb-3">
                Are you sure you want to reject the B2B application for <strong>{rejectingPartner.company_name || rejectingPartner.name}</strong>?
              </p>
              <div className="mb-3">
                <label className="form-label text-xs fw-bold text-muted mb-1">Reason for Rejection (Optional but recommended)</label>
                <textarea
                  className="form-control form-control-sm text-xs"
                  rows="3"
                  placeholder="e.g. Incomplete business documents or invalid contact details."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" className="btn btn-light btn-sm rounded-pill px-3" onClick={() => setRejectingPartner(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger btn-sm rounded-pill px-3 fw-bold">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Modal */}
      {showPartnerModal && (
        <div className="checkout-modal-backdrop animate-fade-in" onClick={() => setShowPartnerModal(false)} style={{ zIndex: 1060 }}>
          <div className="checkout-modal-content rounded-4 p-4 shadow-2xl bg-white" style={{ maxWidth: '580px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold text-dark font-heading mb-0">{partnerFormData.id ? 'Edit B2B Partner Agency' : 'Add New B2B Agency Partner'}</h5>
              <button className="btn btn-link text-muted p-0 border-0" onClick={() => setShowPartnerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSavePartnerSubmit}>
              <div className="row g-2 mb-2.5">
                <div className="col-8">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Company / Agency Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Royal Goa Holidays Pvt Ltd"
                    value={partnerFormData.company_name}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-4">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Business Type</label>
                  <select
                    className="form-select form-select-sm"
                    value={partnerFormData.business_type}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, business_type: e.target.value })}
                  >
                    <option value="Travel Agency">Travel Agency</option>
                    <option value="Tour Operator">Tour Operator</option>
                    <option value="Travel Consultant">Travel Consultant</option>
                    <option value="Corporate Travel">Corporate Travel</option>
                    <option value="Online Travel Agency">Online Travel Agency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="row g-2 mb-2.5">
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Rajesh Kumar"
                    value={partnerFormData.name}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    placeholder="10-digit mobile"
                    value={partnerFormData.phone}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="row g-2 mb-2.5">
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Agency Email</label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    placeholder="agent@agency.com"
                    value={partnerFormData.email}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, email: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Password {partnerFormData.id && '(Leave blank to keep current)'}</label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    placeholder="Partner password"
                    value={partnerFormData.password}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Default Commission (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm"
                    value={partnerFormData.default_commission_rate}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, default_commission_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Default Net Discount (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm"
                    value={partnerFormData.default_net_discount_rate}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, default_net_discount_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 justify-content-end pt-2 border-top">
                <button type="button" className="btn btn-light btn-sm rounded-pill px-3" onClick={() => setShowPartnerModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-warning text-dark fw-bold btn-sm rounded-pill px-4">Save Agency</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pricing Rule Modal */}
      {showRuleModal && (
        <div className="checkout-modal-backdrop animate-fade-in" onClick={() => setShowRuleModal(false)} style={{ zIndex: 1060 }}>
          <div className="checkout-modal-content rounded-4 p-4 shadow-2xl bg-white" style={{ maxWidth: '480px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold text-dark font-heading mb-0">Save B2B Pricing Rule</h5>
              <button className="btn btn-link text-muted p-0 border-0" onClick={() => setShowRuleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveRuleSubmit}>
              <div className="mb-2.5">
                <label className="form-label text-xs fw-bold text-muted mb-1">Target Partner</label>
                <select
                  className="form-select form-select-sm"
                  value={ruleFormData.partner_id}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, partner_id: e.target.value })}
                >
                  <option value="all">🌐 All Partners (Global Standard)</option>
                  {b2bPartners.map(p => (
                    <option key={p.id} value={p.id}>{p.company_name || p.name} ({p.id})</option>
                  ))}
                </select>
              </div>
              <div className="mb-2.5">
                <label className="form-label text-xs fw-bold text-muted mb-1">Service Scope</label>
                <select
                  className="form-select form-select-sm"
                  value={ruleFormData.service_type}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, service_type: e.target.value })}
                >
                  <option value="all">All Services (Hotel, Vehicle, Package)</option>
                  <option value="hotel">Hotels & Resorts Only</option>
                  <option value="vehicle">Vehicles & Fleets Only</option>
                  <option value="package">Holiday Packages & Tours Only</option>
                </select>
              </div>
              <div className="row g-2 mb-2.5">
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm"
                    value={ruleFormData.commission_percent}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, commission_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-xs fw-bold text-muted mb-1">Net Discount Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control form-control-sm"
                    value={ruleFormData.net_discount_percent}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, net_discount_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-xs fw-bold text-muted mb-1">Internal Notes</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Standard Season B2B Contract"
                  value={ruleFormData.notes}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, notes: e.target.value })}
                />
              </div>
              <div className="d-flex gap-2 justify-content-end pt-2 border-top">
                <button type="button" className="btn btn-light btn-sm rounded-pill px-3" onClick={() => setShowRuleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-warning text-dark fw-bold btn-sm rounded-pill px-4">Save Pricing Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER DETAIL DRAWER ─── */}
      {selected && (
        <div
          className="position-fixed top-0 end-0 h-100 shadow-lg d-flex flex-column animate-fade-in"
          style={{ width: '100%', maxWidth: '480px', background: '#fff', zIndex: 1050, borderLeft: '1px solid rgba(0,0,0,0.1)' }}
        >
          <div className="p-4 border-bottom d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
            <div>
              <h6 className="fw-bold mb-0">{selected.name}</h6>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {selected.id}</div>
            </div>
            <button className="btn btn-sm p-0 text-white-50 border-0" onClick={() => setSelected(null)}>
              <X size={20} />
            </button>
          </div>

          <div className="d-flex border-bottom px-4 pt-2 bg-light">
            {['overview', 'wallet', 'bookings'].map(tab => (
              <button
                key={tab}
                onClick={() => setDrawerTab(tab)}
                className="btn btn-sm px-3 py-2 fw-bold text-capitalize border-0 rounded-top d-flex align-items-center gap-1"
                style={{
                  fontSize: '0.78rem',
                  borderBottom: drawerTab === tab ? '2px solid #FF6333' : 'none',
                  color: drawerTab === tab ? '#FF6333' : '#64748b',
                  background: drawerTab === tab ? '#fff' : '#f8fafc'
                }}
              >
                {tab === 'wallet' && <Wallet size={13} />}
                <span>{tab === 'wallet' ? '💰 Wallet' : tab}</span>
              </button>
            ))}
          </div>

          <div className="flex-grow-1 overflow-auto p-4">
            {drawerTab === 'overview' ? (
              <div>
                {/* 3 Loyalty Tiers Overview */}
                <div className="p-3 rounded-4 mb-3 bg-light border">
                  <div className="fw-bold text-dark text-xs mb-2 d-flex align-items-center gap-1">
                    <Crown size={14} className="text-warning" /> Customer Loyalty Tiers
                  </div>
                  <div className="row g-2">
                    <div className="col-4">
                      <div className="p-2 bg-white rounded-3 text-center border">
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>🚗 Car Tier</div>
                        <div className="fw-bold text-xs mt-0.5">{selected.carTier?.tier || 'Bronze'}</div>
                        <div className="text-muted" style={{ fontSize: '0.62rem' }}>{selected.carTier?.count || 0} Trips</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 bg-white rounded-3 text-center border">
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>🏨 Hotel Tier</div>
                        <div className="fw-bold text-xs mt-0.5">{selected.hotelTier?.tier || 'Bronze'}</div>
                        <div className="text-muted" style={{ fontSize: '0.62rem' }}>{selected.hotelTier?.count || 0} Trips</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 bg-white rounded-3 text-center border">
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>🧳 Trip Tier</div>
                        <div className="fw-bold text-xs mt-0.5">{selected.tripTier?.tier || 'Bronze'}</div>
                        <div className="text-muted" style={{ fontSize: '0.62rem' }}>{selected.tripTier?.count || 0} Trips</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cashback Wallet Summary Badge */}
                <div className="p-3 rounded-4 mb-3 bg-dark text-white shadow-sm d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-3 p-2 bg-warning text-dark">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <div className="text-white-50 text-xxs text-uppercase fw-bold">Cashback Wallet</div>
                      <div className="fw-black text-warning font-heading fs-5">
                        ₹{(selectedWallet?.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setDrawerTab('wallet')}
                    className="btn btn-sm btn-light py-1 px-2.5 rounded-pill text-xs fw-bold"
                  >
                    View Ledger →
                  </button>
                </div>

                <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Account Status</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Phone</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.phone}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Email</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.email || '—'}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Date of Birth</span>
                    <span className="fw-semibold text-danger" style={{ fontSize: '0.8rem' }}>
                      {selected.date_of_birth ? `🎂 ${selected.date_of_birth} (${formatBirthdayDisplay(selected.date_of_birth)})` : 'Not on record'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>City</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.city}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Joined Date</span>
                    <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selected.joined}</span>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>TOTAL SPENT</div>
                      <div className="fw-bold mt-1" style={{ fontSize: '1.1rem', color: '#16a34a' }}>₹{selected.spent.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded-3 text-center" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>TOTAL BOOKINGS</div>
                      <div className="fw-bold mt-1" style={{ fontSize: '1.1rem', color: '#2563eb' }}>{selected.bookings}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : drawerTab === 'wallet' ? (
              <div>
                <div className="card border-0 rounded-4 shadow-sm mb-3 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)' }}>
                  <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="text-white-50 text-xxs text-uppercase fw-bold">Available Cashback Balance</div>
                      <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-0.5 rounded-pill">10% Policy</span>
                    </div>
                    <div className="fs-3 fw-black text-warning font-heading my-1">
                      ₹{(selectedWallet?.available_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    {selectedWallet?.nearest_expiring && (
                      <div className="text-white-50 text-xxs mt-1">
                        ⏳ ₹{selectedWallet.nearest_expiring.amount} expires on {selectedWallet.nearest_expiring.formatted_expires_at}
                      </div>
                    )}
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <div className="p-2.5 rounded-3 bg-light border text-center">
                      <div className="text-muted text-xxs fw-bold">EARNED</div>
                      <div className="fw-bold text-success text-sm mt-0.5">₹{(selectedWallet?.total_earned || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2.5 rounded-3 bg-light border text-center">
                      <div className="text-muted text-xxs fw-bold">USED</div>
                      <div className="fw-bold text-primary text-sm mt-0.5">₹{(selectedWallet?.total_used || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2.5 rounded-3 bg-light border text-center">
                      <div className="text-muted text-xxs fw-bold">EXPIRED</div>
                      <div className="fw-bold text-danger text-sm mt-0.5">₹{(selectedWallet?.total_expired || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-dark text-xs mb-2">Wallet Transactions Ledger ({selectedWallet?.transactions?.length || 0})</h6>
                {(selectedWallet?.transactions || []).map((tx, idx) => {
                  const isCredit = tx.transaction_type === 'CASHBACK_CREDIT';
                  const isUsed = tx.transaction_type === 'CASHBACK_USED';
                  return (
                    <div key={idx} className="p-2.5 rounded-3 mb-2 bg-light border" style={{ fontSize: '0.78rem' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-dark">
                          {isCredit ? '🎁 Cashback Earned' : (isUsed ? '💳 Cashback Used' : '❌ Expired')}
                        </span>
                        <span className={`fw-bold ${isCredit ? 'text-success' : (isUsed ? 'text-primary' : 'text-danger')}`}>
                          {isCredit ? `+₹${parseFloat(tx.amount).toLocaleString()}` : `-₹${parseFloat(tx.amount).toLocaleString()}`}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-muted text-xxs">
                        <span>{tx.booking_id ? `#${tx.booking_id}` : 'General'} • {tx.status}</span>
                        <span>{tx.created_at || tx.earned_at}</span>
                      </div>
                    </div>
                  );
                })}
                {(!selectedWallet?.transactions || selectedWallet.transactions.length === 0) && (
                  <div className="text-center py-4 text-muted text-xs">No wallet transactions recorded for this customer.</div>
                )}
              </div>
            ) : (
              <div>
                <h6 className="fw-bold mb-3" style={{ fontSize: '0.85rem' }}>Booking History ({customerBookings.length})</h6>
                {customerBookings.map((b, i) => (
                  <div key={i} className="p-3 rounded-3 mb-2" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>#{b.id} — {b.item_name || 'Booking'}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="d-flex justify-content-between" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      <span>{b.pickup_date || b.created_at || '—'}</span>
                      <span className="fw-bold text-success">₹{(b.total_amount || b.total_paid || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {customerBookings.length === 0 && <div className="text-center py-4 text-muted" style={{ fontSize: '0.8rem' }}>No bookings for this customer</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEAM & USER MANAGEMENT MODAL */}
      {showUsersModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
          <div className="rounded-4 shadow-lg overflow-hidden animate__animated animate__fadeInUp" style={{ width: '100%', maxWidth: '780px', background: '#fff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
              <div className="d-flex align-items-center gap-2">
                <Shield size={18} style={{ color: '#FF6333' }} />
                <h6 className="mb-0 fw-bold">User & Team Management</h6>
              </div>
              <button className="btn p-0 text-white-50 border-0" onClick={() => setShowUsersModal(false)}><X size={18} /></button>
            </div>

            <div className="d-flex border-bottom px-4 pt-2 bg-light gap-2">
              <button 
                onClick={() => setUsersSubTab('list')}
                className={`btn btn-sm px-3 py-2 fw-bold rounded-top-3 border-0 ${usersSubTab === 'list' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
                style={{ fontSize: '0.82rem' }}
              >
                <Users size={14} className="me-1.5 inline" /> Team Members & Sub-Admins ({allUsers.length})
              </button>
              <button 
                onClick={() => setUsersSubTab('add')}
                className={`btn btn-sm px-3 py-2 fw-bold rounded-top-3 border-0 ${usersSubTab === 'add' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
                style={{ fontSize: '0.82rem' }}
              >
                <UserPlus size={14} className="me-1.5 inline text-success" /> + Create User / Sub-Admin
              </button>
            </div>

            {userModalMessage && (
              <div className={`px-4 py-2 text-white fw-semibold d-flex align-items-center justify-content-between ${userModalMessage.type === 'success' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.8rem' }}>
                <span>{userModalMessage.text}</span>
                <button className="btn btn-sm p-0 text-white border-0" onClick={() => setUserModalMessage(null)}><X size={14} /></button>
              </div>
            )}

            <div className="flex-grow-1 overflow-auto p-4">
              {usersSubTab === 'list' ? (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                      All registered team members, sub-admins, agents, and platform users eligible for lead handling.
                    </span>
                    <button onClick={loadLiveUsers} disabled={loadingUsers} className="btn btn-sm btn-light border d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                      <RefreshCw size={12} className={loadingUsers ? 'animate-spin' : ''} /> Refresh
                    </button>
                  </div>

                  <div className="table-responsive rounded-3 border">
                    <table className="table align-middle mb-0" style={{ fontSize: '0.8rem' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>User / Name</th>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Contact</th>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Role</th>
                          <th className="px-3 py-2.5 fw-bold text-muted" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Status</th>
                          <th className="px-3 py-2.5 fw-bold text-muted text-end" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(u => (
                          <tr key={u.id || u.username} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                            <td className="px-3 py-2.5">
                              <div className="fw-bold" style={{ color: '#0D1B2E' }}>{u.name || u.username}</div>
                              <div className="font-monospace text-muted" style={{ fontSize: '0.7rem' }}>@{u.username}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <div>{u.email}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{u.phone || '—'}</div>
                            </td>
                            <td className="px-3 py-2.5">
                              <RoleBadge role={u.role} />
                            </td>
                            <td className="px-3 py-2.5">
                              <StatusBadge status={u.status} />
                            </td>
                            <td className="px-3 py-2.5 text-end">
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`btn btn-sm px-2.5 py-0.5 rounded-pill border fw-bold text-xs ${u.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateUser}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold">Full Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. Rahul Sharma"
                        value={newUser.name}
                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold">Username</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. rahul_ops"
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold">Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        className="form-control form-control-sm text-xs"
                        placeholder="e.g. rahul@tripgalileo.com"
                        value={newUser.email}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold">Phone</label>
                      <input
                        type="tel"
                        className="form-control form-control-sm text-xs"
                        placeholder="10-digit mobile"
                        value={newUser.phone}
                        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold">Role <span className="text-danger">*</span></label>
                      <select
                        className="form-select form-select-sm text-xs"
                        value={newUser.role}
                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                      >
                        <option value="subadmin">Sub-Admin (Operational Management & CRM)</option>
                        <option value="agent">Support Agent (Leads & Live Inquiries)</option>
                        <option value="admin">Full Admin</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-xs fw-bold">Password</label>
                      <input
                        type="password"
                        className="form-control form-control-sm text-xs"
                        placeholder="Pass@123"
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-sm btn-light border" onClick={() => setUsersSubTab('list')}>Cancel</button>
                    <button type="submit" disabled={creatingUser} className="btn btn-sm btn-primary fw-bold px-3">
                      {creatingUser ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
