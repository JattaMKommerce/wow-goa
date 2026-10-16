import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Search, Filter, Download, Plus, Phone, Mail, MessageSquare, 
  Building, Car, CheckCircle, XCircle, Clock, Trash2, Eye, Edit3, 
  Shield, Tag, Calendar, MapPin, X, ArrowUpRight, PhoneCall, AlertCircle, 
  RefreshCw, Sparkles, UserCheck, Activity, Radio, Save, Send, UserPlus, CornerDownRight, Check, ExternalLink, Globe
} from 'lucide-react';
import * as api from '../../services/api';
import { parseTravelDate } from '../../utils/dateUtils';
import AIChatbotToggle from '../common/AIChatbotToggle';

const SOURCE_TABS = [
  'All',
  'Goa Tourist Visa',
  'Hotel Enquiries',
  'Vehicle Rental',
  'Vendor Onboarding',
  'Custom Trips',
  'AI Planner',
  'Contact Us'
];

const STATUS_LIST = [
  'All Statuses',
  'Pending Inquiry',
  'Inquiry',
  'Booked',
  'New',
  'Contacted',
  'In Progress',
  'Qualified',
  'Closed-Won',
  'Closed-Lost'
];

const NEXT_ACTION_PRESETS = [
  'Call customer',
  'WhatsApp customer',
  'Confirm travel dates',
  'Confirm budget',
  'Send quotation',
  'Share vehicle/hotel options',
  'Follow up tomorrow',
  'Awaiting customer response',
  'Convert to booking',
  'Mark as Lost'
];

function SourceBadge({ source }) {
  const configs = {
    'Goa Tourist Visa': { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3', icon: Globe },
    'Hotel Enquiries': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: Building },
    'Vehicle Rental': { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', icon: Car },
    'Vendor Onboarding': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', icon: Shield },
    'Custom Trips': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', icon: Sparkles },
    'AI Planner': { bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff', icon: Sparkles },
    'Contact Us': { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', icon: MessageSquare }
  };
  const c = configs[source] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', icon: Tag };
  const Icon = c.icon;

  return (
    <span 
      className="px-2 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '0.68rem' }}
    >
      <Icon size={11} /> {source}
    </span>
  );
}

function isVehicleRentalLead(lead) {
  if (!lead) return false;

  const cat = String(lead.source || lead.category || lead.service_type || '').toLowerCase();
  const serv = String(lead.service || '').toLowerCase();
  const title = String(lead.title || '').toLowerCase();
  const notes = String(lead.notes || '').toLowerCase();

  // If this is explicitly a Custom Trips lead from the custom enquiry form, let Custom Trips handle it
  if (cat.includes('custom') && !cat.includes('vehicle')) {
    return false;
  }

  // Explicit vehicle rental source / category
  if (cat.includes('vehicle') || cat.includes('rental') || cat.includes('self-drive') || cat.includes('self drive')) {
    return true;
  }

  const combined = `${cat} ${serv} ${title} ${notes}`.trim();

  // Specific Goan self-drive rental vehicle models (Thar, Fortuner, Scorpio, Innova, Activa, scooter, etc.)
  if (/\b(thar|fortuner|scorpio|innova|activa|scooter)\b/i.test(combined)) {
    return true;
  }

  // Generic vehicle keywords with rental / self-drive intent
  const hasRentalIntent = 
    /\b(rent|rental|self\s*drive|self-drive|selfdrive|hire|renting)\b/i.test(combined);
  const hasVehicleKeyword = 
    /\b(car|bike|vehicle|suv|sedan|jeep|two\s*wheeler|4x4)\b/i.test(combined);

  if (hasRentalIntent && hasVehicleKeyword) {
    return true;
  }

  return false;
}

function getCustomItineraryDays(numDays, enq = {}, lead = {}) {
  const dest = enq.destinations || lead.service || 'Goa';
  const hasCar = enq.req_car == 1;
  const hasBike = enq.req_bike == 1;
  const hasAirport = enq.req_airport_pickup == 1 || enq.req_flight == 1;
  const hasSightseeing = enq.req_sightseeing == 1;
  const hasAdventure = enq.req_adventure == 1;
  const hotelCat = enq.hotel_category ? `${enq.hotel_category} Hotel` : 'Hotel';

  // 1-Day Same-Day Excursion / Tour Plan
  if (numDays === 1) {
    let morningPickup = 'Morning pickup & start of Goa exploration.';
    if (hasCar) morningPickup = 'Self-drive car handover & morning coastal drive.';
    else if (hasBike) morningPickup = 'Bike rental handover & scenic coastal ride.';
    else if (hasAirport) morningPickup = 'Airport/Station private pickup (Dabolim/Mopa) with welcome drink.';

    let morningActivity = hasAdventure 
      ? 'High-speed water sports at Calangute/Baga: Jet Ski, Parasailing & Banana Boat ride.' 
      : 'Scenic beach walk at Calangute & Baga, coastal photography & relaxed Goan breakfast.';

    let eveningActivity = hasSightseeing 
      ? 'Guided visit to Fort Aguada Lighthouse & sunset Mandovi River Cruise with Goan folk dance.' 
      : 'Breathtaking sunset at Chapora Fort (Dil Chahta Hai viewpoint) & Vagator cliff.';

    return [
      {
        dayNum: 1,
        title: `Full-Day ${dest} Tour & Highlights`,
        morning: `${morningPickup} ${morningActivity}`,
        afternoon: `Traditional Goan seafood curry lunch at a beachside shack. Heritage visit to historic coastal forts & churches.`,
        evening: eveningActivity,
        night: `Shopping for cashews, feni & local handicrafts. Candlelight beachside dinner at Tito's Lane / Candolim, followed by departure transfer.`
      }
    ];
  }

  // Multi-day itinerary pool
  const dayTemplates = [
    {
      title: `Arrival, Check-in & North Goa Exploration`,
      morning: `${hasAirport ? 'Airport/Station private pickup (Dabolim GOI / Mopa GOX).' : 'Arrival in Goa.'} ${hasCar ? 'Self-drive car handover.' : hasBike ? 'Bike rental handover.' : ''} Check-in at ${hotelCat} & freshen up.`,
      afternoon: `Relaxed coastal lunch at Calangute/Candolim. Stroll along the golden beach sands.`,
      evening: `Scenic sunset viewing at Fort Aguada lighthouse & Candolim beach promenade.`,
      night: hasSightseeing ? `Seaside dinner & exploring vibrant nightlife around Tito's Lane & Baga.` : `Authentic Goan dinner at hotel or nearby beach shack.`
    },
    {
      title: `Beaches, Water Sports & Forts`,
      morning: hasAdventure 
        ? `Adrenaline water sports: Jet Ski, Parasailing, Banana Boat & Bumper Ride at Baga Beach.` 
        : `Morning leisure beach walk at Anjuna & Baga. Coconut water & sunbathing.`,
      afternoon: `Cliffside lunch at Vagator overlooking the Arabian Sea.`,
      evening: `Panoramic sunset photography at Chapora Fort (Dil Chahta Hai point) & Little Vagator.`,
      night: `Acoustic live music, beach shack dining & artisan night market at Anjuna.`
    },
    {
      title: `South Goa Heritage & Mandovi Sunset Cruise`,
      morning: `UNESCO Heritage tour: Basilica of Bom Jesus, Se Cathedral & historical churches of Old Goa.`,
      afternoon: `Heritage walk through Fontainhas (Portuguese Latin Quarter) & authentic café lunch.`,
      evening: hasSightseeing 
        ? `Sunset Mandovi River Cruise with live Goan folk dance & DJ music.` 
        : `Miramar Beach sunset stroll & Panjim promenade walk.`,
      night: `Fine dining Goan seafood dinner along Miramar coastline.`
    },
    {
      title: `Dudhsagar Waterfalls & Spice Plantation`,
      morning: `Scenic jungle jeep safari to majestic Dudhsagar Waterfalls. Natural pool swim.`,
      afternoon: `Traditional Goan spice plantation tour with authentic buffet lunch served on banana leaf.`,
      evening: `Return scenic drive through lush Western Ghats countryside.`,
      night: `Relaxed dinner & evening drinks by the beach.`
    },
    {
      title: `Grand Island Marine Adventure & Scuba`,
      morning: `Speedboat cruise to Grand Island. Dolphin spotting & guided snorkeling / scuba diving with certified instructors.`,
      afternoon: `Barbecue beach lunch at Monkey Beach with swimming & leisure.`,
      evening: `Cruise back to harbor. Sunset relaxation at Sinquerim Beach.`,
      night: `Dinner at award-winning Goan cuisine restaurant.`
    },
    {
      title: `Fontainhas Art, Culture & Latin Quarter`,
      morning: `Architectural walking tour of colorful Latin Quarter homes, art galleries & bakeries.`,
      afternoon: `Traditional Portuguese-Goan lunch at iconic heritage restaurant.`,
      evening: `Dona Paula viewpoint sunset & shopping for Goan handicrafts & Mario Miranda souvenirs.`,
      night: `Live jazz & coastal dining in Panjim.`
    }
  ];

  const days = [];
  for (let i = 0; i < numDays; i++) {
    if (i === numDays - 1 && numDays > 1) {
      days.push({
        dayNum: i + 1,
        title: `Leisure, Souvenirs & Departure`,
        morning: `Buffet breakfast at ${hotelCat}. Souvenir shopping for cashews, spices, port wine & handicrafts at Panjim/Mapusa market.`,
        afternoon: `Hotel check-out. Scenic coastal drive through palm groves.`,
        evening: hasAirport 
          ? `Private transfer to airport (Dabolim GOI / Mopa GOX) or railway station.` 
          : `Onward journey departure from Goa.`,
        night: ''
      });
    } else {
      const tmplIndex = i % dayTemplates.length;
      const tmpl = dayTemplates[tmplIndex];
      days.push({
        dayNum: i + 1,
        title: tmpl.title,
        morning: tmpl.morning,
        afternoon: tmpl.afternoon,
        evening: tmpl.evening,
        night: tmpl.night
      });
    }
  }

  return days;
}

export default function LeadManagement({ usersList = [], currentUser }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  const [search, setSearch] = useState('');
  const [activeSource, setActiveSource] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignModalLead, setAssignModalLead] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Lead / Itinerary Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLead, setPreviewLead] = useState(null);

  // Linked custom_enquiries record for Custom Trips leads
  const [linkedEnquiry, setLinkedEnquiry] = useState(null);
  const [linkedEnquiryLoading, setLinkedEnquiryLoading] = useState(false);

  const fetchLinkedEnquiryForLead = useCallback(async (lead) => {
    if (!lead) {
      setLinkedEnquiry(null);
      return null;
    }
    const isCustomTrip = (lead.source || '').toLowerCase().includes('custom');
    const notesStr = lead.notes || '';
    const enqIdMatch = notesStr.match(/(?:ENQ|INQ)-[A-Z0-9]+/i);
    const targetEnqId = enqIdMatch ? enqIdMatch[0].toUpperCase() : null;

    if (!isCustomTrip && !targetEnqId) {
      setLinkedEnquiry(null);
      return null;
    }

    setLinkedEnquiryLoading(true);
    try {
      const list = await api.fetchCustomEnquiries();
      const cleanTargetPhone = String(lead.phone || '').replace(/\D/g, '').slice(-10);
      const cleanTargetEmail = String(lead.email || '').trim().toLowerCase();

      const match = (list || []).find(item => {
        const eid = String(item.enquiry_id || item.id || '').toUpperCase();
        if (targetEnqId && eid === targetEnqId) return true;
        if (cleanTargetPhone) {
          const itemPhone = String(item.phone || '').replace(/\D/g, '').slice(-10);
          if (itemPhone && itemPhone === cleanTargetPhone) return true;
        }
        if (cleanTargetEmail) {
          const itemEmail = String(item.email || '').trim().toLowerCase();
          if (itemEmail && itemEmail === cleanTargetEmail) return true;
        }
        return false;
      });
      setLinkedEnquiry(match || null);
      return match || null;
    } catch (e) {
      setLinkedEnquiry(null);
      return null;
    } finally {
      setLinkedEnquiryLoading(false);
    }
  }, []);

  const handleOpenPreview = async (lead, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const target = lead || selectedLead;
    setPreviewLead(target);
    setIsPreviewOpen(true);

    if (target) {
      const isCustomTrip = (target.source || '').toLowerCase().includes('custom');
      const notesStr = target.notes || '';
      const enqIdMatch = notesStr.match(/(?:ENQ|INQ)-[A-Z0-9]+/i);
      const targetEnqId = enqIdMatch ? enqIdMatch[0].toUpperCase() : null;
      const currentEnqId = String(linkedEnquiry?.enquiry_id || linkedEnquiry?.id || '').toUpperCase();

      if ((isCustomTrip || targetEnqId) && (!linkedEnquiry || (targetEnqId && currentEnqId !== targetEnqId))) {
        await fetchLinkedEnquiryForLead(target);
      }
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewLead(null);
  };

  const [assignableUsers, setAssignableUsers] = useState([]);
  
  // Create Sub-Admin Modal state
  const [showSubAdminModal, setShowSubAdminModal] = useState(false);
  const [newSubAdmin, setNewSubAdmin] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: ''
  });
  const [creatingSubAdmin, setCreatingSubAdmin] = useState(false);

  const handleCreateSubAdmin = async (e) => {
    e.preventDefault();
    if (!newSubAdmin.name.trim() || !newSubAdmin.email.trim()) {
      alert("Sub-Admin Name and Email are required.");
      return;
    }
    setCreatingSubAdmin(true);
    try {
      const payload = {
        name: newSubAdmin.name.trim(),
        username: (newSubAdmin.username.trim() || newSubAdmin.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        email: newSubAdmin.email.trim(),
        phone: newSubAdmin.phone.trim(),
        role: 'subadmin',
        password: newSubAdmin.password.trim() || 'Pass@123',
        status: 'active'
      };
      await api.addUser(payload);
      alert(`✅ Sub-Admin "${payload.name}" created successfully!\n\nSub-Admin Login URL: http://localhost:5173/sub-admin\nUsername/Email: ${payload.username}\nPassword: ${payload.password}`);
      setNewSubAdmin({ name: '', username: '', email: '', phone: '', password: '' });
      setShowSubAdminModal(false);
      loadAssignableUsers();
    } catch (err) {
      alert("Failed to create Sub-Admin: " + err.message);
    } finally {
      setCreatingSubAdmin(false);
    }
  };
  
  // Comments thread state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentsEndRef = useRef(null);

  // Next action editing
  const [editingNextAction, setEditingNextAction] = useState(false);
  const [nextActionDraft, setNextActionDraft] = useState('');
  const [savingNextAction, setSavingNextAction] = useState(false);

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // New Lead Form state
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Hotel Enquiries',
    service: '',
    assignedTo: 'Unassigned',
    status: 'New',
    budget: '',
    notes: '',
    nextAction: ''
  });

  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin' || 
    (typeof window !== 'undefined' && (window.location.pathname.startsWith('/superadmin') || window.location.pathname.startsWith('/super-admin')));
  const isSubAdmin = currentUser?.role === 'subadmin' || currentUser?.role === 'sub_admin' || currentUser?.role === 'agent' ||
    (typeof window !== 'undefined' && (window.location.pathname.startsWith('/sub-admin') || window.location.pathname.startsWith('/subadmin')));
  const isAdmin = !isSuperAdmin && !isSubAdmin;
  const currentUserName = currentUser?.name || currentUser?.username || (isSuperAdmin ? 'Super Admin' : (isAdmin ? 'Admin' : 'Sub-Admin'));
  const currentUserRole = currentUser?.role || (isSuperAdmin ? 'superadmin' : (isAdmin ? 'admin' : 'subadmin'));

  // Load assignable team members (Admins + Sub-Admins strictly)
  const loadAssignableUsers = useCallback(async () => {
    try {
      const users = await api.fetchAssignableUsers();
      const isAssignable = (u) => {
        const r = (u.role || '').toLowerCase().trim();
        const s = (u.status || 'active').toLowerCase().trim();
        return ['admin', 'subadmin', 'sub_admin', 'agent'].includes(r) && s === 'active';
      };

      if (Array.isArray(users) && users.length > 0) {
        setAssignableUsers(users.filter(isAssignable));
      } else if (usersList && usersList.length > 0) {
        setAssignableUsers(usersList.filter(isAssignable));
      }
    } catch (e) {
      if (usersList && usersList.length > 0) {
        setAssignableUsers(usersList.filter(u => {
          const r = (u.role || '').toLowerCase().trim();
          const s = (u.status || 'active').toLowerCase().trim();
          return ['admin', 'subadmin', 'sub_admin', 'agent'].includes(r) && s === 'active';
        }));
      }
    }
  }, [usersList]);

  // Keep ref to selectedLead for stable callbacks
  const selectedLeadRef = useRef(selectedLead);
  useEffect(() => {
    selectedLeadRef.current = selectedLead;
  }, [selectedLead]);

  // Fetch leads live from backend database (stable callback)
  const loadLeads = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsSyncing(true);
    try {
      const data = await api.fetchLeads();
      if (Array.isArray(data)) {
        // Exact Flow 2 Lead Scoping
        let visibleLeads = data;
        if (isSubAdmin) {
          // Sub-Admin strictly sees only leads assigned to them
          visibleLeads = data.filter(l => {
            const a = (l.assigned_to || l.assignedTo || '').toLowerCase().trim();
            const u = (currentUser?.username || '').toLowerCase().trim();
            const n = (currentUser?.name || '').toLowerCase().trim();
            return (u && (a === u || a.includes(u))) || (n && (a === n || a.includes(n)));
          });
        } else if (isAdmin) {
          // Admin sees leads assigned to Admin, unassigned leads, and leads assigned to Sub-Admins to monitor their work
          visibleLeads = data.filter(l => {
            const a = (l.assigned_to || l.assignedTo || '').toLowerCase().trim();
            const u = (currentUser?.username || '').toLowerCase().trim();
            const n = (currentUser?.name || '').toLowerCase().trim();
            const isUnassigned = !a || a === 'unassigned' || a === 'none' || a === 'null';
            const isAssignedToThisAdmin = a === 'admin' || (u && (a === u || a.includes(u))) || (n && (a === n || a.includes(n)));
            
            // Check if assigned to any Sub-Admin / Agent
            const isAssignedToSubAdmin = assignableUsers.some(sub => {
              const subR = (sub.role || '').toLowerCase();
              if (!['subadmin', 'sub_admin', 'agent'].includes(subR)) return false;
              const subU = (sub.username || '').toLowerCase().trim();
              const subN = (sub.name || '').toLowerCase().trim();
              return (subU && a.includes(subU)) || (subN && a.includes(subN));
            });

            return isUnassigned || isAssignedToThisAdmin || isAssignedToSubAdmin;
          });
        }
        // If isSuperAdmin: sees all leads without filtering

        setLeads(visibleLeads);
        setLastSyncedAt(Date.now());
        setSecondsAgo(0);

        // If a lead is currently selected, update only if meaningful changes exist
        if (selectedLeadRef.current) {
          const fresh = data.find(l => l.id === selectedLeadRef.current.id);
          if (fresh) {
            const cur = selectedLeadRef.current;
            if (
              cur.status !== fresh.status ||
              cur.assigned_to !== fresh.assigned_to ||
              cur.next_action !== fresh.next_action ||
              cur.notes !== fresh.notes ||
              cur.budget !== fresh.budget
            ) {
              setSelectedLead(fresh);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[LeadManagement] Fetch error:', err.message);
    } finally {
      setLoading(false);
      if (showIndicator) {
        setTimeout(() => setIsSyncing(false), 300);
      }
    }
  }, [isSuperAdmin, isSubAdmin, isAdmin, currentUser, assignableUsers]);

  // Fetch comments for selected lead (silent by default to prevent flickering)
  const loadComments = useCallback(async (leadId, showSpinner = false) => {
    if (!leadId) return;
    if (showSpinner) setLoadingComments(true);
    try {
      const data = await api.fetchLeadComments(leadId, currentUser?.role, currentUser?.username);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to load comments:", err);
    } finally {
      if (showSpinner) setLoadingComments(false);
    }
  }, [currentUser]);

  // Initial fetch and event-driven updates + periodic multi-device synchronization
  useEffect(() => {
    loadLeads();
    loadAssignableUsers();

    const handleRealtimeLead = () => {
      loadLeads(true);
      if (selectedLeadRef.current?.id) {
        loadComments(selectedLeadRef.current.id);
      }
    };
    window.addEventListener('realtime-lead-created', handleRealtimeLead);
    window.addEventListener('lead_created', handleRealtimeLead);
    window.addEventListener('ai_leads_updated', handleRealtimeLead);
    window.addEventListener('new-booking-created', handleRealtimeLead);
    window.addEventListener('tripgalileo-notification-sync', handleRealtimeLead);
    window.addEventListener('tripgalileo-booking-sync', handleRealtimeLead);

    // Cross-device / separate computer synchronization (Flow 2 reliable sync)
    const syncInterval = setInterval(() => {
      loadLeads(false);
      if (selectedLeadRef.current?.id) {
        loadComments(selectedLeadRef.current.id, false);
      }
    }, 4000);

    // BroadcastChannel cross-tab synchronization
    let bcBookings = null;
    let bcNotif = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bcBookings = new BroadcastChannel('tripgalileo_bookings_sync');
        bcBookings.onmessage = (ev) => {
          if (ev.data?.type && (ev.data.type.startsWith('lead') || ev.data.type === 'NOTIFICATIONS_SYNC' || ev.data?.detail?.type === 'lead')) {
            handleRealtimeLead();
          }
        };
        bcNotif = new BroadcastChannel('tripgalileo_notifications_sync');
        bcNotif.onmessage = (ev) => {
          if (ev.data?.type === 'lead' || ev.data?.type === 'NOTIFICATIONS_SYNC' || ev.data?.detail?.type === 'lead') {
            handleRealtimeLead();
          }
        };
      }
    } catch (e) {}

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('realtime-lead-created', handleRealtimeLead);
      window.removeEventListener('lead_created', handleRealtimeLead);
      window.removeEventListener('ai_leads_updated', handleRealtimeLead);
      window.removeEventListener('new-booking-created', handleRealtimeLead);
      window.removeEventListener('tripgalileo-notification-sync', handleRealtimeLead);
      window.removeEventListener('tripgalileo-booking-sync', handleRealtimeLead);
      if (bcBookings) bcBookings.close();
      if (bcNotif) bcNotif.close();
    };
  }, [loadLeads, loadAssignableUsers, loadComments]);

  // Load comments and linked enquiry when selectedLead ID changes
  const selectedLeadId = selectedLead?.id;
  useEffect(() => {
    if (selectedLeadId) {
      setNextActionDraft(selectedLead?.next_action || selectedLead?.nextAction || '');
      setNotesDraft(selectedLead?.notes || '');
      setEditingNextAction(false);
      setEditingNotes(false);
      loadComments(selectedLeadId, true);
      fetchLinkedEnquiryForLead(selectedLead);
    } else {
      setComments([]);
      setLinkedEnquiry(null);
    }
  }, [selectedLeadId, loadComments, fetchLinkedEnquiryForLead]);

  // Scroll comments to bottom
  useEffect(() => {
    if (comments.length > 0 && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Filtered Leads
  const filteredLeads = leads.filter(item => {
    const matchSource = (activeSource === 'All') || (item.source === activeSource);
    const matchStatus = (selectedStatus === 'All Statuses') || (item.status === selectedStatus);
    const q = search.toLowerCase().trim();
    const matchSearch = !q || 
      String(item.name || '').toLowerCase().includes(q) ||
      String(item.id || '').toLowerCase().includes(q) ||
      String(item.phone || '').toLowerCase().includes(q) ||
      String(item.email || '').toLowerCase().includes(q) ||
      String(item.service || '').toLowerCase().includes(q) ||
      String(item.assigned_to || item.assignedTo || '').toLowerCase().includes(q) ||
      String(item.next_action || item.nextAction || '').toLowerCase().includes(q);

    return matchSource && matchStatus && matchSearch;
  });

  // KPI Calculations
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter(l => l.status === 'New' || l.status === 'Pending Inquiry' || l.status === 'Inquiry' || !l.assigned_to || l.assigned_to === 'Unassigned' || l.assignedTo === 'Unassigned').length;
  const convertedCount = leads.filter(l => l.status === 'Closed-Won' || l.status === 'Booked').length;
  const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0';
  const lostCount = leads.filter(l => l.status === 'Closed-Lost').length;

  const handleExportCSV = () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      alert("No lead records available to export.");
      return;
    }
    const headers = ["Lead ID", "Customer Name", "Phone", "Email", "Lead Source", "Service / Property", "Assigned Agent", "Assigned On", "Status", "Next Action", "Budget", "Created At", "Notes"];
    const rows = filteredLeads.map(l => [
      `"${l.id || ''}"`,
      `"${l.name || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.email || ''}"`,
      `"${l.source || ''}"`,
      `"${l.service || ''}"`,
      `"${l.assigned_to || l.assignedTo || 'Unassigned'}"`,
      `"${l.assigned_at || l.assignedAt || ''}"`,
      `"${l.status || ''}"`,
      `"${(l.next_action || l.nextAction || '').replace(/"/g, '""')}"`,
      `"${l.budget || ''}"`,
      `"${l.created_at || l.createdAt || ''}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tripgalileo_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      alert("Please enter customer name and phone number.");
      return;
    }

    const payload = {
      id: 'LD-' + Math.floor(1000 + Math.random() * 9000),
      name: newLead.name.trim(),
      phone: newLead.phone.trim(),
      email: newLead.email.trim(),
      source: newLead.source,
      service: newLead.service.trim() || 'General Trip Consultation',
      assigned_to: newLead.assignedTo || 'Unassigned',
      assigned_by: currentUserName,
      assigned_at: newLead.assignedTo !== 'Unassigned' ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null,
      status: newLead.status || 'New',
      budget: newLead.budget.trim() || 'Not specified',
      notes: newLead.notes.trim(),
      next_action: newLead.nextAction.trim()
    };

    try {
      await api.createLead(payload);
      await loadLeads(true);
      setShowAddModal(false);
      setNewLead({
        name: '',
        phone: '',
        email: '',
        source: 'Hotel Enquiries',
        service: '',
        assignedTo: 'Unassigned',
        status: 'New',
        budget: '',
        notes: '',
        nextAction: ''
      });
    } catch (err) {
      alert("Failed to save lead: " + err.message);
    }
  };

  const handleOpenAssignModal = (lead) => {
    setAssignModalLead(lead);
    setSelectedAssignee(lead.assigned_to || lead.assignedTo || 'Unassigned');
  };
  const handleConfirmAssignment = async (e) => {
    if (e) e.preventDefault();
    if (!assignModalLead) return;

    setAssigning(true);
    try {
      const res = await api.assignLead(assignModalLead.id, selectedAssignee, currentUserName, currentUserRole);
      const nowStr = res.assigned_at || new Date().toISOString().replace('T', ' ').slice(0, 19);

      // Optimistic update
      setLeads(prev => prev.map(l => l.id === assignModalLead.id ? { 
        ...l, 
        assigned_to: selectedAssignee, 
        assignedTo: selectedAssignee, 
        assigned_by: currentUserName,
        assigned_at: nowStr 
      } : l));

      if (selectedLead && selectedLead.id === assignModalLead.id) {
        setSelectedLead(prev => ({ 
          ...prev, 
          assigned_to: selectedAssignee, 
          assignedTo: selectedAssignee, 
          assigned_by: currentUserName,
          assigned_at: nowStr 
        }));
        await loadComments(assignModalLead.id);
      }

      setAssignModalLead(null);
    } catch (err) {
      alert("Failed to assign lead: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId, nextStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(prev => ({ ...prev, status: nextStatus }));
    }

    try {
      await api.updateLeadStatus(leadId, nextStatus, currentUser || { id: 'admin', name: currentUserName, role: currentUserRole });
      if (selectedLead && selectedLead.id === leadId) {
        await loadComments(leadId);
      }
    } catch (err) {
      console.error("Failed to update status on server:", err);
      loadLeads(false);
    }
  };

  const handleSaveNextAction = async () => {
    if (!selectedLead) return;
    setSavingNextAction(true);
    try {
      await api.updateNextAction(selectedLead.id, nextActionDraft, currentUser || { id: 'admin', name: currentUserName, role: currentUserRole });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, next_action: nextActionDraft, nextAction: nextActionDraft } : l));
      setSelectedLead(prev => ({ ...prev, next_action: nextActionDraft, nextAction: nextActionDraft }));
      setEditingNextAction(false);
      await loadComments(selectedLead.id);
    } catch (err) {
      alert("Failed to save next action: " + err.message);
    } finally {
      setSavingNextAction(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      await api.updateLead(selectedLead.id, { notes: notesDraft });
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, notes: notesDraft } : l));
      setSelectedLead(prev => ({ ...prev, notes: notesDraft }));
      setEditingNotes(false);
    } catch (err) {
      alert("Failed to save notes: " + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSendComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || !selectedLead) return;

    setSendingComment(true);
    const draftText = newCommentText.trim();
    setNewCommentText('');

    try {
      const res = await api.addLeadComment(selectedLead.id, draftText, currentUser || { id: 'admin', name: currentUserName, role: currentUserRole });
      if (res.comment) {
        setComments(prev => [...prev, res.comment]);
      } else {
        await loadComments(selectedLead.id);
      }
    } catch (err) {
      alert("Failed to post comment: " + err.message);
      setNewCommentText(draftText);
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.deleteLeadComment(commentId, selectedLead.id);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert("Failed to delete comment: " + err.message);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm(`Are you sure you want to permanently delete lead #${leadId}?`)) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(null);
      }

      try {
        await api.deleteLead(leadId);
      } catch (err) {
        console.error("Failed to delete lead from server:", err);
        loadLeads(false);
      }
    }
  };

  return (
    <div className="p-3">
      {/* Top Header & Live Sync Status */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold mb-0" style={{ color: '#0D1B2E', fontSize: '20px' }}>
              Enterprise Lead Management Hub
            </h4>
            
            {/* Realtime Live Pulse Badge */}
            <span 
              className="badge rounded-pill px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5 fw-bold"
              style={{ 
                background: '#ecfdf5', 
                color: '#059669', 
                border: '1px solid #a7f3d0',
                fontSize: '0.68rem',
                letterSpacing: '0.3px'
              }}
              title="Real-time synchronized with backend database"
            >
              <span 
                className="rounded-circle" 
                style={{ 
                  width: '7px', 
                  height: '7px', 
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981'
                }} 
              />
              LIVE REAL-TIME SYNC
            </span>
          </div>

          <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: '#64748b' }}>
            {isSubAdmin 
              ? `Assigned Lead Queue for ${currentUserName} (${currentUser?.role})` 
              : 'Multi-channel pipeline tracking hotel queries, fleet rentals, custom packages & team dispatch'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Manual Refresh / Sync Button */}
          <button 
            onClick={() => loadLeads(true)}
            disabled={isSyncing}
            className="btn btn-light px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm border" 
            style={{ fontSize: '0.82rem', color: '#475569' }}
            title="Fetch latest leads immediately"
          >
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} style={{ color: '#FF6333' }} />
            <span>{isSyncing ? 'Syncing...' : (secondsAgo <= 3 ? 'Synced just now' : `Synced ${secondsAgo}s ago`)}</span>
          </button>

          <button 
            onClick={handleExportCSV}
            className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm" 
            style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.82rem', border: '1px solid #bbf7d0' }}
          >
            <Download size={14} /> Export CSV
          </button>
          
          {!isSubAdmin && (
            <>
              <button 
                onClick={() => setShowSubAdminModal(true)}
                className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm text-white" 
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', fontSize: '0.82rem', border: 'none' }}
              >
                <UserPlus size={16} /> Create Sub-Admin
              </button>

              <button 
                onClick={() => window.open('/sub-admin', '_blank')}
                className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm" 
                style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: '0.82rem', border: '1px solid #ddd6fe' }}
                title="Open Sub-Admin Desk (/sub-admin) in a new tab"
              >
                <ExternalLink size={15} /> Open Sub-Admin Desk
              </button>

              <button 
                onClick={() => setShowAddModal(true)}
                className="btn px-3 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 shadow-sm text-white" 
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem', border: 'none' }}
              >
                <Plus size={16} /> Add Manual Lead
              </button>
            </>
          )}
        </div>
      </div>

      {/* AI Assistant Chatbot Master Control Banner */}
      {!isSubAdmin && (
        <div className="mb-3">
          <AIChatbotToggle />
        </div>
      )}

      {/* KPI Cards (Grid of 4) */}
      <div className="row g-2 mb-2.5">
        <div className="col-md-3">
          <div className="rounded-3 py-2 px-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-0.5">
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {isSubAdmin ? 'My Assigned Leads' : 'Total Inbound Leads'}
              </span>
              <div className="rounded-2 p-1 bg-light text-muted"><Users size={14} /></div>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.35rem', color: '#0D1B2E', lineHeight: 1.2 }}>{totalLeads}</div>
            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>Active pipeline records</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="rounded-3 py-2 px-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-0.5">
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>New / Unassigned</span>
              <div className="rounded-2 p-1" style={{ background: '#fee2e2', color: '#dc2626' }}><AlertCircle size={14} /></div>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.35rem', color: '#dc2626', lineHeight: 1.2 }}>{newLeadsCount}</div>
            <div style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 600 }}>Requires agent dispatch</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="rounded-3 py-2 px-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-0.5">
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Converted (Won)</span>
              <div className="rounded-2 p-1" style={{ background: '#dcfce7', color: '#16a34a' }}><CheckCircle size={14} /></div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <div className="fw-bold" style={{ fontSize: '1.35rem', color: '#16a34a', lineHeight: 1.2 }}>{convertedCount}</div>
              <span className="badge bg-success bg-opacity-10 text-success fw-bold" style={{ fontSize: '0.7rem' }}>{conversionRate}% Win Rate</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 600 }}>Closed booking revenues</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="rounded-3 py-2 px-3 shadow-sm" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="d-flex justify-content-between align-items-center mb-0.5">
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Lost / Dropped</span>
              <div className="rounded-2 p-1 bg-light text-muted"><XCircle size={14} /></div>
            </div>
            <div className="fw-bold" style={{ fontSize: '1.35rem', color: '#64748b', lineHeight: 1.2 }}>{lostCount}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>Price / schedule mismatches</div>
          </div>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div className="card shadow-sm border-0 rounded-4 mb-2.5" style={{ background: '#fff' }}>
        <div className="card-body p-2.5">
          {/* Source Tabs */}
          <div className="d-flex gap-1 overflow-auto pb-1.5 mb-2 border-bottom" style={{ scrollbarWidth: 'none' }}>
            {SOURCE_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveSource(tab)}
                className="btn btn-sm px-3 py-1 rounded-pill fw-bold text-nowrap"
                style={{
                  fontSize: '0.74rem',
                  background: activeSource === tab ? '#0D1B2E' : '#f8fafc',
                  color: activeSource === tab ? '#fff' : '#64748b',
                  border: activeSource === tab ? '1px solid #0D1B2E' : '1px solid rgba(0,0,0,0.06)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search, Status & Controls */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="position-relative flex-grow-1" style={{ minWidth: '220px', maxWidth: '420px' }}>
              <Search size={14} className="position-absolute" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control form-control-sm"
                style={{ paddingLeft: '32px', borderRadius: '8px', fontSize: '0.8rem' }}
                placeholder="Search leads by name, phone, email, service, ID, next action..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-1.5">
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Stage:</span>
              <select
                className="form-select form-select-sm fw-bold"
                style={{ width: '135px', fontSize: '0.76rem', borderRadius: '8px' }}
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
              >
                {STATUS_LIST.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Master Leads Table */}
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden" style={{ background: '#fff' }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '0.82rem' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="px-2.5 py-2.5 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap', width: '90px', minWidth: '85px' }}>Lead ID</th>
                <th className="px-2.5 py-2.5 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap', width: '140px', minWidth: '130px' }}>Customer Contact</th>
                <th className="px-2.5 py-2.5 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', width: '180px', minWidth: '150px', maxWidth: '210px' }}>Source & Requirement</th>
                <th className="px-2.5 py-2.5 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap', width: '145px', minWidth: '135px' }}>Assignment State</th>
                <th className="px-2.5 py-2.5 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', width: '140px', minWidth: '125px', maxWidth: '165px' }}>Next Action</th>
                <th className="px-2.5 py-2.5 fw-bold" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap', width: '115px', minWidth: '110px' }}>Pipeline Status</th>
                <th className="px-2.5 py-2.5 fw-bold text-center" style={{ color: '#475569', fontSize: '0.68rem', textTransform: 'uppercase', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.07)', whiteSpace: 'nowrap', width: '125px', minWidth: '125px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(item => {
                const assignee = item.assigned_to || item.assignedTo || 'Unassigned';
                const isAssigned = assignee && assignee !== 'Unassigned';
                const nextAct = item.next_action || item.nextAction || '';

                return (
                  <tr 
                    key={item.id} 
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                    className="hover-bg-light"
                    onClick={() => {
                      setSelectedLead(item);
                    }}
                  >
                    {/* Lead ID */}
                    <td className="px-2.5 py-2" style={{ whiteSpace: 'nowrap', width: '90px', minWidth: '85px' }}>
                      <span className="fw-bold font-monospace text-primary d-block" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        #{item.id}
                      </span>
                      <div className="text-muted" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                        {(item.created_at || item.createdAt || '').slice(0, 10)}
                      </div>
                    </td>

                    {/* Customer Contact */}
                    <td className="px-2.5 py-2" style={{ whiteSpace: 'nowrap', width: '140px', minWidth: '130px' }}>
                      <div className="fw-bold text-truncate" title={item.name} style={{ color: '#0D1B2E', maxWidth: '135px' }}>{item.name}</div>
                      <div className="d-flex align-items-center gap-1 mt-0.5 text-nowrap" style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <span>{item.phone}</span>
                      </div>
                    </td>

                    {/* Lead Source & Customer Requirement */}
                    <td className="px-2.5 py-2" style={{ width: '180px', minWidth: '150px', maxWidth: '210px' }}>
                      <div className="d-flex align-items-center gap-1 mb-1 flex-wrap">
                        <SourceBadge source={item.source || 'Hotel Enquiries'} />
                        {item.pax && (
                          <span className="badge rounded-pill bg-light text-dark border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                            👥 {item.pax}
                          </span>
                        )}
                        {item.budget && (
                          <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.65rem' }}>
                            {item.budget}
                          </span>
                        )}
                      </div>
                      {item.notes && !item.notes.includes('Inquired via') ? (
                        <div>
                          <div className="fw-bold text-dark text-truncate" title={item.notes} style={{ fontSize: '0.76rem', color: '#0F172A' }}>
                            <span className="text-primary me-1">💬</span>{item.notes}
                          </div>
                          {item.service && item.service !== 'AI Travel Assistant Chat' && (
                            <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.68rem', fontWeight: 600 }}>
                              {item.service}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="fw-semibold text-truncate" title={item.service} style={{ color: '#0D1B2E', fontSize: '0.76rem' }}>
                            {item.service || 'General Trip Consultation'}
                          </div>
                          {item.notes && (
                            <div className="text-muted text-truncate mt-0.5" style={{ fontSize: '0.68rem' }}>
                              {item.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Assignment State & Action */}
                    <td className="px-2.5 py-2" style={{ whiteSpace: 'nowrap', width: '145px', minWidth: '135px' }} onClick={e => e.stopPropagation()}>
                      {isAssigned ? (
                        <div>
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge rounded-pill px-2 py-0.5 fw-bold text-truncate" style={{ background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', fontSize: '0.7rem', maxWidth: '95px' }}>
                              <UserCheck size={10} className="me-1 inline" /> {assignee}
                            </span>
                            {isSuperAdmin && (
                              <button 
                                onClick={() => handleOpenAssignModal(item)}
                                className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                                style={{ fontSize: '0.7rem', color: '#7c3aed' }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="badge rounded-pill px-2 py-0.5 fw-bold" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '0.68rem' }}>
                            Unassigned
                          </span>
                          {isSuperAdmin && (
                            <button 
                              onClick={() => handleOpenAssignModal(item)}
                              className="btn btn-sm px-2 py-0.5 rounded-pill fw-bold text-white shadow-none"
                              style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.68rem' }}
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Next Actionable Step */}
                    <td className="px-2.5 py-2" style={{ width: '140px', minWidth: '125px', maxWidth: '165px' }}>
                      {nextAct ? (
                        <div className="d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontSize: '0.7rem', fontWeight: 600, maxWidth: '155px' }}>
                          <Clock size={11} className="flex-shrink-0 text-amber-600" />
                          <span className="text-truncate" title={nextAct}>{nextAct}</span>
                        </div>
                      ) : (
                        <span className="text-muted fst-italic" style={{ fontSize: '0.7rem' }}>None</span>
                      )}
                    </td>

                    {/* Status Dropdown / Pill */}
                    <td className="px-2.5 py-2" style={{ whiteSpace: 'nowrap', width: '115px', minWidth: '110px' }} onClick={e => e.stopPropagation()}>
                      <select
                        className="form-select form-select-sm border-0 fw-bold py-0.5"
                        style={{ 
                          fontSize: '0.72rem', 
                          width: '105px',
                          background: (item.status === 'Closed-Won' || item.status === 'Booked') ? '#dcfce7' : (item.status === 'Pending Inquiry' || item.status === 'Pending') ? '#fef3c7' : (item.status === 'Inquiry' || item.status === 'In Progress') ? '#dbeafe' : item.status === 'New' ? '#fee2e2' : item.status === 'Qualified' ? '#f5f3ff' : '#f8fafc',
                          color: (item.status === 'Closed-Won' || item.status === 'Booked') ? '#15803d' : (item.status === 'Pending Inquiry' || item.status === 'Pending') ? '#d97706' : (item.status === 'Inquiry' || item.status === 'In Progress') ? '#0284c7' : item.status === 'New' ? '#dc2626' : item.status === 'Qualified' ? '#7c3aed' : '#475569'
                        }}
                        value={item.status || 'New'}
                        onChange={e => handleUpdateLeadStatus(item.id, e.target.value)}
                      >
                        {STATUS_LIST.filter(s => s !== 'All Statuses').map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>

                    {/* Quick Actions */}
                    <td className="px-2.5 py-2 text-center" style={{ whiteSpace: 'nowrap', width: '125px', minWidth: '125px' }} onClick={e => e.stopPropagation()}>
                      <div className="d-flex align-items-center justify-content-center gap-1 flex-nowrap">
                        {/* WhatsApp Quick Action */}
                        {item.phone && (
                          <a
                            href={`https://wa.me/${String(item.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${item.name}, thank you for contacting TripGalileo regarding ${item.service || 'your trip'}!`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-light p-1 rounded-2 text-success d-inline-flex align-items-center justify-content-center"
                            style={{ width: '26px', height: '26px' }}
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </a>
                        )}

                        {/* Phone Call Quick Action */}
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            className="btn btn-sm btn-light p-1 rounded-2 text-primary d-inline-flex align-items-center justify-content-center"
                            style={{ width: '26px', height: '26px' }}
                            title="Call Customer"
                          >
                            <Phone size={13} />
                          </a>
                        )}

                        {/* View Details Drawer */}
                        <button
                          type="button"
                          className="btn btn-sm btn-light p-1 rounded-2 text-secondary d-inline-flex align-items-center justify-content-center"
                          style={{ width: '26px', height: '26px' }}
                          onClick={() => setSelectedLead(item)}
                          title="View Lead Details & Discussion"
                        >
                          <Eye size={13} />
                        </button>

                        {/* Delete (Admin only) */}
                        {!isSubAdmin && (
                          <button
                            type="button"
                            className="btn btn-sm btn-light p-1 rounded-2 text-danger d-inline-flex align-items-center justify-content-center"
                            style={{ width: '26px', height: '26px' }}
                            onClick={() => handleDeleteLead(item.id)}
                            title="Delete Lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-5 px-3">
            <div className="rounded-circle d-inline-flex p-3 mb-3" style={{ background: '#f8fafc' }}>
              <Users size={36} style={{ color: '#94a3b8' }} />
            </div>
            <h6 className="fw-bold text-dark mb-1">
              {isSubAdmin ? 'No Assigned Leads in Your Queue' : 'No Leads Found'}
            </h6>
            <p className="text-muted mx-auto mb-4" style={{ fontSize: '0.82rem', maxWidth: '420px' }}>
              {leads.length === 0 
                ? (isSubAdmin ? 'When an administrator assigns incoming leads to you, they will appear here in real-time.' : 'Your lead pipeline is clean. Inbound inquiries from hotel bookings, fleet rentals, custom packages, and AI chatbot chats will appear here in real-time.')
                : 'No leads matched your current search or filter criteria.'}
            </p>
            {!isSubAdmin && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-sm px-4 py-2 rounded-pill fw-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)' }}
              >
                + Create First Lead
              </button>
            )}
          </div>
        )}
      </div>

      {/* QUICK LEAD DETAILS & COMMUNICATION DRAWER */}
      {selectedLead && (
        <div className="position-fixed top-0 end-0 bottom-0 shadow-lg d-flex flex-column" style={{ width: '480px', maxWidth: '95vw', background: '#fff', zIndex: 1050, borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
          {/* Drawer Top Bar */}
          <div className="d-flex align-items-center justify-content-between px-4 py-3 flex-shrink-0" style={{ background: '#0D1B2E', color: '#fff' }}>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h6 className="mb-0 fw-bold text-white">{selectedLead.name}</h6>
                <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.68rem' }}>#{selectedLead.id}</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{selectedLead.source}</div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button 
                type="button"
                className="btn btn-sm btn-outline-light py-1 px-2.5 rounded-pill d-flex align-items-center gap-1.5 text-white shadow-xs" 
                style={{ fontSize: '0.74rem', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.12)' }}
                onClick={(e) => handleOpenPreview(selectedLead, e)}
                title="Preview Complete Itinerary & Trip Plan"
              >
                <Eye size={13} style={{ color: '#FF8A00' }} /> Preview Trip Plan
              </button>
              <button className="btn p-1 border-0 text-white-50 hover-text-white" onClick={() => setSelectedLead(null)}><X size={18} /></button>
            </div>
          </div>

          <div className="flex-grow-1 overflow-auto p-4">
            {/* Quick Contact Bar */}
            {(() => {
              const rawPhone = String(selectedLead.phone || '').replace(/[^0-9]/g, '');
              const waNumber = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;
              return (
                <div className="d-flex gap-2 mb-3">
                  <a 
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${selectedLead.name}, this is ${currentUserName} from WOW GOA regarding your inquiry for ${selectedLead.service || 'your trip'}!`)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold"
                  >
                    <MessageSquare size={14} /> Direct WhatsApp Chat
                  </a>
                  <a 
                    href={`tel:${selectedLead.phone}`} 
                    className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-bold"
                  >
                    <PhoneCall size={14} /> Call Customer
                  </a>
                  {selectedLead.email && (
                    <a 
                      href={`mailto:${selectedLead.email}`} 
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center p-2"
                      title="Send Email to Customer"
                    >
                      <Mail size={14} />
                    </a>
                  )}
                </div>
              );
            })()}

            {/* 1. LEAD ASSIGNMENT INFORMATION SECTION */}
            <div className="p-3 rounded-3 mb-3" style={{ background: '#f5f3ff', border: '1px solid #e9d5ff' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-uppercase" style={{ fontSize: '0.72rem', color: '#7c3aed', letterSpacing: '0.5px' }}>
                  LEAD ASSIGNMENT
                </span>
                {isSuperAdmin && (
                  <button 
                    onClick={() => handleOpenAssignModal(selectedLead)}
                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                    style={{ fontSize: '0.72rem', color: '#7c3aed' }}
                  >
                    {selectedLead.assigned_to && selectedLead.assigned_to !== 'Unassigned' ? 'Reassign' : 'Assign Now'}
                  </button>
                )}
              </div>
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                <span className="text-muted">Assigned To:</span>
                <span className="fw-bold text-dark">{selectedLead.assigned_to || selectedLead.assignedTo || 'Unassigned'}</span>
              </div>
              {selectedLead.assigned_by && (
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.76rem' }}>
                  <span className="text-muted">Assigned By:</span>
                  <span className="fw-semibold text-secondary">{selectedLead.assigned_by}</span>
                </div>
              )}
              {selectedLead.assigned_at && (
                <div className="d-flex justify-content-between" style={{ fontSize: '0.74rem' }}>
                  <span className="text-muted">Assigned On:</span>
                  <span className="fw-semibold text-secondary">{String(selectedLead.assigned_at).slice(0, 16)}</span>
                </div>
              )}
            </div>

            {/* 2. CUSTOMER REQUIREMENT / ENQUIRY SECTION */}
            <div className="p-3 rounded-3 mb-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-success text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                  📌 CUSTOMER REQUIREMENT / ENQUIRY
                </span>
                {!editingNotes ? (
                  <button 
                    onClick={() => { setEditingNotes(true); setNotesDraft(selectedLead.notes || ''); }}
                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                    style={{ fontSize: '0.72rem', color: '#16a34a' }}
                  >
                    Edit Requirement
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button onClick={() => setEditingNotes(false)} className="btn btn-sm btn-link p-0 text-secondary text-decoration-none" style={{ fontSize: '0.72rem' }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveNotes} disabled={savingNotes} className="btn btn-sm btn-success py-0 px-2 fw-bold text-white" style={{ fontSize: '0.72rem' }}>
                      <Save size={11} className="me-1" /> Save
                    </button>
                  </div>
                )}
              </div>

              {editingNotes ? (
                <div>
                  <textarea
                    rows={2}
                    className="form-control form-control-sm mb-1.5"
                    placeholder="e.g. South Goa trip – 3 days, 4 people, Budget ₹20,000"
                    value={notesDraft}
                    onChange={e => setNotesDraft(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <div className="text-muted" style={{ fontSize: '0.67rem' }}>
                    💡 <em>Refining this requirement permanently protects it from automated overwrite.</em>
                  </div>
                </div>
              ) : linkedEnquiry ? (
                /* ── Custom Enquiry: show the actual submitted form data ── */
                <div>
                  {/* Destinations + Travel Dates */}
                  {(linkedEnquiry.destinations || linkedEnquiry.travel_dates) && (
                    <div className="mb-2">
                      {linkedEnquiry.destinations && (
                        <p className="mb-0 text-dark fw-bold" style={{ fontSize: '0.85rem' }}>
                          📍 {linkedEnquiry.destinations}
                        </p>
                      )}
                      {linkedEnquiry.travel_dates && (
                        <p className="mb-0 text-muted" style={{ fontSize: '0.78rem' }}>
                          📅 {linkedEnquiry.travel_dates}{linkedEnquiry.flexible_dates == 1 ? ' (Flexible)' : ''}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Guests */}
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                    {(linkedEnquiry.adults > 0) && (
                      <span className="badge rounded-pill bg-white text-dark border px-2" style={{ fontSize: '0.68rem' }}>
                        👥 {linkedEnquiry.adults} Adults{linkedEnquiry.children > 0 ? ` · ${linkedEnquiry.children} Children` : ''}{linkedEnquiry.infants > 0 ? ` · ${linkedEnquiry.infants} Infants` : ''}
                      </span>
                    )}
                    {linkedEnquiry.budget_range && (
                      <span className="badge rounded-pill bg-white text-success border border-success-subtle px-2 fw-bold" style={{ fontSize: '0.68rem' }}>
                        💰 {linkedEnquiry.budget_range}
                      </span>
                    )}
                    {linkedEnquiry.hotel_category && (
                      <span className="badge rounded-pill bg-white text-dark border px-2" style={{ fontSize: '0.68rem' }}>
                        🏨 {linkedEnquiry.hotel_category}{linkedEnquiry.room_type ? ` · ${linkedEnquiry.room_type}` : ''}
                      </span>
                    )}
                    {linkedEnquiry.meal_pref && (
                      <span className="badge rounded-pill bg-white text-dark border px-2" style={{ fontSize: '0.68rem' }}>
                        🍽️ {linkedEnquiry.meal_pref}
                      </span>
                    )}
                  </div>
                  {/* Requested Services */}
                  <div className="d-flex flex-wrap gap-1">
                    {linkedEnquiry.req_flight == 1 && <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '0.67rem' }}>✈️ Flight</span>}
                    {linkedEnquiry.req_train == 1 && <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.67rem' }}>🚆 Train</span>}
                    {linkedEnquiry.req_car == 1 && <span className="badge bg-warning-subtle text-warning-emphasis border" style={{ fontSize: '0.67rem' }}>🚗 Car</span>}
                    {linkedEnquiry.req_bike == 1 && <span className="badge bg-warning-subtle text-warning-emphasis border" style={{ fontSize: '0.67rem' }}>🏍️ Bike</span>}
                    {linkedEnquiry.req_airport_pickup == 1 && <span className="badge bg-info-subtle text-info border" style={{ fontSize: '0.67rem' }}>🛬 Airport Pickup</span>}
                    {linkedEnquiry.req_sightseeing == 1 && <span className="badge bg-success-subtle text-success border" style={{ fontSize: '0.67rem' }}>🗺️ Sightseeing</span>}
                    {linkedEnquiry.req_adventure == 1 && <span className="badge bg-danger-subtle text-danger border" style={{ fontSize: '0.67rem' }}>🌊 Adventure</span>}
                  </div>
                  {linkedEnquiry.special_requests && (
                    <p className="mb-0 mt-2 text-muted fst-italic" style={{ fontSize: '0.75rem' }}>
                      💬 {linkedEnquiry.special_requests}
                    </p>
                  )}
                </div>
              ) : linkedEnquiryLoading ? (
                <p className="mb-0 text-muted fst-italic" style={{ fontSize: '0.8rem' }}>Loading enquiry details…</p>
              ) : (
                <div>
                  <p className="mb-1 text-dark fw-bold" style={{ fontSize: '0.85rem' }}>
                    {selectedLead.notes || <span className="text-muted fw-normal fst-italic">No requirement recorded yet.</span>}
                  </p>
                  <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                    {selectedLead.pax && (
                      <span className="badge rounded-pill bg-white text-dark border px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                        👥 {selectedLead.pax} Guests
                      </span>
                    )}
                    {selectedLead.budget && (
                      <span className="badge rounded-pill bg-white text-success border border-success-subtle px-2 py-0.5 fw-bold" style={{ fontSize: '0.68rem' }}>
                        💰 Budget: {selectedLead.budget}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Chatbot Transcript Viewer Toggle if chat_history exists */}
              {selectedLead.chat_history && (
                <div className="mt-2 pt-2 border-top border-success-subtle">
                  <button
                    type="button"
                    onClick={() => setShowTranscript(prev => !prev)}
                    className="btn btn-xs btn-outline-success py-0.5 px-2 rounded-pill d-inline-flex align-items-center gap-1.5 fw-semibold"
                    style={{ fontSize: '0.7rem' }}
                  >
                    <Sparkles size={11} /> {showTranscript ? 'Hide AI Chatbot Transcript' : 'View AI Chatbot Transcript'}
                  </button>

                  {showTranscript && (
                    <div className="mt-2 p-2.5 rounded-3 bg-white border border-success-subtle d-flex flex-column gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {(() => {
                        let msgs = [];
                        try {
                          msgs = typeof selectedLead.chat_history === 'string' ? JSON.parse(selectedLead.chat_history) : (selectedLead.chat_history || []);
                        } catch (e) {
                          msgs = [];
                        }
                        if (!Array.isArray(msgs) || msgs.length === 0) {
                          return <div className="text-muted small">No transcript messages recorded.</div>;
                        }
                        return msgs.map((m, idx) => {
                          const isUser = m.role === 'user';
                          return (
                            <div 
                              key={idx}
                              className={`p-2 rounded-3 ${isUser ? 'align-self-end bg-light border text-dark' : 'align-self-start text-white'}`}
                              style={{ 
                                maxWidth: '85%', 
                                fontSize: '0.74rem',
                                background: isUser ? '#f1f5f9' : '#0D1B2E',
                                color: isUser ? '#0f172a' : '#fff'
                              }}
                            >
                              <div className="fw-bold mb-0.5" style={{ fontSize: '0.65rem', color: isUser ? '#2563eb' : '#FF8A00' }}>
                                {isUser ? (selectedLead.name || 'Customer') : 'Luzia AI'}
                              </div>
                              <div>{m.content}</div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. NEXT ACTIONABLE STEP SECTION */}
            <div className="p-3 rounded-3 mb-3" style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold text-warning text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                  <Clock size={13} className="text-warning" /> NEXT ACTIONABLE STEP
                </span>
                {!editingNextAction ? (
                  <button 
                    onClick={() => { setEditingNextAction(true); setNextActionDraft(selectedLead.next_action || selectedLead.nextAction || ''); }}
                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold"
                    style={{ fontSize: '0.72rem', color: '#b45309' }}
                  >
                    Edit Action
                  </button>
                ) : (
                  <div className="d-flex gap-2">
                    <button onClick={() => setEditingNextAction(false)} className="btn btn-sm btn-link p-0 text-secondary text-decoration-none" style={{ fontSize: '0.72rem' }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveNextAction} disabled={savingNextAction} className="btn btn-sm btn-warning py-0 px-2 fw-bold" style={{ fontSize: '0.72rem' }}>
                      <Save size={11} className="me-1" /> Save
                    </button>
                  </div>
                )}
              </div>

              {editingNextAction ? (
                <div>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="e.g. Call customer to confirm travel dates..."
                    value={nextActionDraft}
                    onChange={e => setNextActionDraft(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <div className="mb-1" style={{ fontSize: '0.68rem', fontWeight: 600, color: '#92400e' }}>
                    QUICK PRESETS (Click to select):
                  </div>
                  <div className="d-flex flex-wrap gap-1.5">
                    {NEXT_ACTION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNextActionDraft(preset)}
                        className="btn btn-xs rounded-pill px-2 py-0.5 border text-start"
                        style={{
                          fontSize: '0.68rem',
                          background: nextActionDraft === preset ? '#f59e0b' : '#fff',
                          color: nextActionDraft === preset ? '#fff' : '#78350f',
                          borderColor: nextActionDraft === preset ? '#f59e0b' : '#fde68a'
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mb-0 text-dark fw-semibold" style={{ fontSize: '0.82rem' }}>
                  {selectedLead.next_action || selectedLead.nextAction || <span className="text-muted fw-normal fst-italic">No next action set. Click 'Edit Action' to define next step.</span>}
                </p>
              )}
            </div>

            {/* 3. FIELD DETAILS & STATUS */}
            <div className="p-3 rounded-3 mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="row g-2">
                <div className="col-6">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>SERVICE REQUESTED</span>
                  <div className="d-flex align-items-center gap-1.5 mt-0.5">
                    <span className="fw-bold" style={{ fontSize: '0.82rem', color: '#0D1B2E' }}>{selectedLead.service || 'General Inquiry'}</span>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-primary py-0 px-1.5 rounded-pill d-inline-flex align-items-center gap-1"
                      style={{ fontSize: '0.68rem', height: '20px' }}
                      onClick={(e) => handleOpenPreview(selectedLead, e)}
                      title="View Complete Trip Itinerary"
                    >
                      <Eye size={11} /> Plan
                    </button>
                  </div>
                </div>
                <div className="col-6">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>ESTIMATED BUDGET</span>
                  <span className="fw-bold text-success" style={{ fontSize: '0.82rem' }}>{selectedLead.budget || 'Not specified'}</span>
                </div>
                <div className="col-6 mt-2">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PHONE NUMBER</span>
                  <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>{selectedLead.phone}</span>
                </div>
                <div className="col-6 mt-2">
                  <span className="d-block text-muted" style={{ fontSize: '0.68rem', fontWeight: 600 }}>PIPELINE STAGE</span>
                  <select
                    className="form-select form-select-sm fw-bold mt-1"
                    style={{ fontSize: '0.76rem' }}
                    value={selectedLead.status || 'New'}
                    onChange={e => handleUpdateLeadStatus(selectedLead.id, e.target.value)}
                  >
                    {STATUS_LIST.filter(s => s !== 'All Statuses').map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. CHRONOLOGICAL COMMUNICATION & COMMENT THREAD */}
            <div className="rounded-3 p-3 mb-3" style={{ background: '#f8fafc', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <span className="fw-bold text-dark text-uppercase d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                  <MessageSquare size={13} style={{ color: '#FF6333' }} /> LEAD COMMUNICATION & DISCUSSION ({comments.length})
                </span>
                <button onClick={() => loadComments(selectedLead.id, true)} disabled={loadingComments} className="btn btn-sm btn-link p-0 text-muted" title="Refresh discussion">
                  <RefreshCw size={12} className={loadingComments ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Message Feed */}
              <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {comments.length === 0 && !loadingComments && (
                  <div className="text-center py-4 text-muted" style={{ fontSize: '0.78rem' }}>
                    No messages or notes recorded yet. Write an update or question below.
                  </div>
                )}

                {comments.map((c, idx) => {
                  const isSys = c.user_role === 'system' || c.user_id === 'system';
                  const isAdm = c.user_role === 'admin' || c.user_role === 'superadmin';
                  const isSub = c.user_role === 'subadmin' || c.user_role === 'agent';

                  if (isSys) {
                    return (
                      <div key={c.id || idx} className="text-center my-1">
                        <span className="badge rounded-pill bg-light text-muted border fw-normal" style={{ fontSize: '0.68rem' }}>
                          ⚡ {c.comment} · {String(c.created_at || '').slice(11, 16)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={c.id || idx} 
                      className="p-2.5 rounded-3 shadow-none position-relative group"
                      style={{ 
                        background: isAdm ? '#0D1B2E' : (isSub ? '#f5f3ff' : '#f8fafc'), 
                        color: isAdm ? '#fff' : '#1e1b4b',
                        border: isAdm ? 'none' : (isSub ? '1px solid #ddd6fe' : '1px solid #e2e8f0'),
                        alignSelf: isAdm ? 'flex-end' : 'flex-start',
                        maxWidth: '90%'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <span className="fw-bold" style={{ fontSize: '0.72rem', color: isAdm ? '#FF8A00' : '#7c3aed' }}>
                          {c.user_name} ({c.user_role === 'subadmin' ? 'Sub-Admin Response' : c.user_role})
                        </span>
                        <div className="d-flex align-items-center gap-1.5">
                          <span style={{ fontSize: '0.64rem', color: isAdm ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>
                            {String(c.created_at || '').slice(11, 16)}
                          </span>
                          {!isSubAdmin && (
                            <button 
                              onClick={() => handleDeleteComment(c.id)} 
                              className="btn btn-sm p-0 border-0 text-muted opacity-50 hover-opacity-100" 
                              title="Delete message"
                            >
                              <X size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                        {c.comment}
                      </p>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendComment} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder={isSubAdmin ? "Write your work update or response to Admin..." : "Write an update, question, or note... (Press Enter)"}
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  disabled={sendingComment}
                  style={{ fontSize: '0.8rem' }}
                />
                <button 
                  type="submit" 
                  disabled={sendingComment || !newCommentText.trim()}
                  className="btn btn-sm text-white px-3 fw-bold d-flex align-items-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', border: 'none', whiteSpace: 'nowrap' }}
                >
                  <Send size={13} /> {isSubAdmin ? 'Send Response to Admin' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN / REASSIGN LEAD MODAL */}
      {assignModalLead && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2050, backdropFilter: 'blur(3px)' }}>
          <div className="rounded-4 shadow-lg overflow-hidden animate__animated animate__fadeInUp" style={{ width: '100%', maxWidth: '460px', background: '#fff' }}>
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
              <div className="d-flex align-items-center gap-2">
                <UserCheck size={18} style={{ color: '#FF6333' }} />
                <h6 className="mb-0 fw-bold">Assign Lead to Team Member</h6>
              </div>
              <button className="btn p-0 text-white-50 border-0" onClick={() => setAssignModalLead(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="p-4">
              <div className="p-3 rounded-3 mb-3 bg-light border">
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Lead ID:</span>
                  <span className="fw-bold font-monospace text-primary">#{assignModalLead.id}</span>
                </div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Customer Name:</span>
                  <span className="fw-bold text-dark">{assignModalLead.name}</span>
                </div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Service / Item:</span>
                  <span className="fw-semibold text-secondary">{assignModalLead.service || 'Trip Inquiry'}</span>
                </div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem' }}>
                  <span className="text-muted">Current Assignee:</span>
                  <span className="fw-bold text-purple" style={{ color: '#7c3aed' }}>{assignModalLead.assigned_to || assignModalLead.assignedTo || 'Unassigned'}</span>
                </div>
                {assignModalLead.assigned_by && (
                  <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.76rem' }}>
                    <span className="text-muted">Assigned By:</span>
                    <span className="text-secondary">{assignModalLead.assigned_by}</span>
                  </div>
                )}
                {assignModalLead.assigned_at && (
                  <div className="d-flex justify-content-between" style={{ fontSize: '0.74rem' }}>
                    <span className="text-muted">Assigned On:</span>
                    <span className="text-secondary">{String(assignModalLead.assigned_at).slice(0, 16)}</span>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Assign Directly To (Admin or Sub-Admin) *
                </label>
                <select
                  className="form-select fw-bold"
                  value={selectedAssignee}
                  onChange={e => setSelectedAssignee(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                  required
                >
                  <option value="Unassigned">-- Unassigned --</option>
                  
                  {/* Administrators */}
                  {assignableUsers.filter(u => (u.role || '').toLowerCase() === 'admin').length > 0 && (
                    <optgroup label="── Administrators ──">
                      {assignableUsers
                        .filter(u => (u.role || '').toLowerCase() === 'admin')
                        .map(u => (
                          <option key={u.id || u.username} value={u.name || u.username}>
                            {u.name || u.username} (Admin) — {u.email || u.username}
                          </option>
                        ))}
                    </optgroup>
                  )}

                  {/* Sub-Admins */}
                  {assignableUsers.filter(u => ['subadmin', 'sub_admin', 'agent'].includes((u.role || '').toLowerCase())).length > 0 && (
                    <optgroup label="── Sub-Admins / Agents ──">
                      {assignableUsers
                        .filter(u => ['subadmin', 'sub_admin', 'agent'].includes((u.role || '').toLowerCase()))
                        .map(u => (
                          <option key={u.id || u.username} value={u.name || u.username}>
                            {u.name || u.username} ({u.role || 'subadmin'}) — {u.status || 'active'}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                  Super Admin Controller: Directly assign to an Administrator or Sub-Admin. The assigned person will work on the lead and record updates in the activity timeline.
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-3 py-2 fw-bold" style={{ fontSize: '0.82rem' }} onClick={() => setAssignModalLead(null)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={assigning}
                  className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2" 
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem', border: 'none' }}
                >
                  <CheckCircle size={14} /> {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MANUAL LEAD MODAL */}
      {showAddModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2000, backdropFilter: 'blur(3px)' }}>
          <div className="rounded-4 shadow-lg overflow-hidden animate__animated animate__fadeInUp" style={{ width: '100%', maxWidth: '520px', background: '#fff' }}>
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
              <div className="d-flex align-items-center gap-2">
                <Plus size={18} style={{ color: '#FF6333' }} />
                <h6 className="mb-0 fw-bold">Add New Multi-Channel Lead</h6>
              </div>
              <button className="btn p-0 text-white-50 border-0" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddLead} className="p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Rahul Mehta"
                    value={newLead.name}
                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={newLead.phone}
                    onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="rahul@example.com"
                    value={newLead.email}
                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Lead Source *</label>
                  <select
                    className="form-select"
                    value={newLead.source}
                    onChange={e => setNewLead({ ...newLead, source: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="Hotel Enquiries">Hotel Enquiries</option>
                    <option value="Vehicle Rental">Vehicle Rental</option>
                    <option value="Vendor Onboarding">Vendor Onboarding</option>
                    <option value="Custom Trips">Custom Trips</option>
                    <option value="AI Planner">AI Planner</option>
                    <option value="Contact Us">Contact Us</option>
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Service / Property Interested In</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Grand Hyatt Goa (3 Nights) or Mahindra Thar 4x4"
                    value={newLead.service}
                    onChange={e => setNewLead({ ...newLead, service: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Estimated Budget</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ₹50,000"
                    value={newLead.budget}
                    onChange={e => setNewLead({ ...newLead, budget: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Assign To</label>
                  <select
                    className="form-select"
                    value={newLead.assignedTo}
                    onChange={e => setNewLead({ ...newLead, assignedTo: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="Unassigned">-- Unassigned --</option>
                    {assignableUsers.map(u => (
                      <option key={u.id || u.username} value={u.name || u.username}>
                        {u.name || u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Next Actionable Step</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Call customer at 4 PM to discuss itinerary"
                    value={newLead.nextAction}
                    onChange={e => setNewLead({ ...newLead, nextAction: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Lead Notes / Special Requests</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Customer requirements, preferred dates, etc."
                    value={newLead.notes}
                    onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  ></textarea>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-3 py-2 fw-bold" style={{ fontSize: '0.82rem' }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2" 
                  style={{ background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', fontSize: '0.82rem', border: 'none' }}
                >
                  <CheckCircle size={14} /> Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUB-ADMIN MODAL */}
      {showSubAdminModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 2050, backdropFilter: 'blur(3px)' }}>
          <div className="rounded-4 shadow-lg overflow-hidden animate__animated animate__fadeInUp" style={{ width: '100%', maxWidth: '480px', background: '#fff' }}>
            <div className="px-4 py-3 d-flex align-items-center justify-content-between" style={{ background: '#0D1B2E', color: '#fff' }}>
              <div className="d-flex align-items-center gap-2">
                <UserPlus size={18} style={{ color: '#FF8A00' }} />
                <h6 className="mb-0 fw-bold">Create Sub-Admin Login Credentials</h6>
              </div>
              <button className="btn p-0 text-white-50 border-0" onClick={() => setShowSubAdminModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="p-4">
              <div className="p-3 rounded-3 mb-3" style={{ background: '#f5f3ff', border: '1px solid #e9d5ff', fontSize: '0.78rem', color: '#6b21a8' }}>
                🔑 Creating a Sub-Admin grants access to the dedicated Sub-Admin Portal (<code className="fw-bold">/sub-admin</code>) to manage assigned leads and communicate with Admin.
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control form-control-sm"
                    placeholder="e.g. Karan Deshmukh"
                    value={newSubAdmin.name}
                    onChange={e => setNewSubAdmin({ ...newSubAdmin, name: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Username</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. karan_subadmin"
                    value={newSubAdmin.username}
                    onChange={e => setNewSubAdmin({ ...newSubAdmin, username: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-control form-control-sm"
                    placeholder="karan@wowgoa.com"
                    value={newSubAdmin.email}
                    onChange={e => setNewSubAdmin({ ...newSubAdmin, email: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Phone Number</label>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    placeholder="+91 98765 43210"
                    value={newSubAdmin.phone}
                    onChange={e => setNewSubAdmin({ ...newSubAdmin, phone: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label fw-bold" style={{ fontSize: '0.78rem', color: '#475569' }}>Login Password *</label>
                  <input
                    type="text"
                    required
                    className="form-control form-control-sm font-monospace fw-bold"
                    placeholder="e.g. SubPass@2026"
                    value={newSubAdmin.password}
                    onChange={e => setNewSubAdmin({ ...newSubAdmin, password: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                    The Sub-Admin will use this password to log in at <span className="fw-bold text-dark">http://localhost:5173/sub-admin</span>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top">
                <button type="button" className="btn btn-light px-3 py-2 fw-bold" style={{ fontSize: '0.82rem' }} onClick={() => setShowSubAdminModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creatingSubAdmin}
                  className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2" 
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', fontSize: '0.82rem', border: 'none' }}
                >
                  <CheckCircle size={14} /> {creatingSubAdmin ? 'Creating...' : 'Create Sub-Admin Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LEAD & TRIP PLAN PREVIEW MODAL ────────────────────────────────────── */}
      {isPreviewOpen && previewLead && (
        <div 
          className="modal-backdrop-custom d-flex align-items-center justify-content-center"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(11, 25, 44, 0.75)', 
            backdropFilter: 'blur(8px)', 
            zIndex: 1250, 
            padding: '16px' 
          }}
          onClick={handleClosePreview}
        >
          <div 
            className="animate-fade-in-up bg-white rounded-4 shadow-2xl overflow-hidden d-flex flex-column"
            style={{ 
              width: '860px', 
              maxWidth: '96vw', 
              maxHeight: '90vh', 
              border: '1px solid rgba(0,0,0,0.1)' 
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="px-4 py-3 d-flex align-items-center justify-content-between flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #1e293b 100%)', color: '#fff' }}
            >
              <div className="d-flex align-items-center gap-3">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #FF6333 0%, #FF8A00 100%)', color: '#fff' }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="mb-0 fw-bold text-white font-heading">{previewLead.name || 'Lead Details'}</h5>
                    <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.7rem' }}>#{previewLead.id}</span>
                    <span 
                      className="badge rounded-pill fw-bold" 
                      style={{ 
                        fontSize: '0.68rem',
                        background: (previewLead.status === 'Closed-Won' || previewLead.status === 'Booked') ? '#dcfce7' : (previewLead.status === 'Pending Inquiry' || previewLead.status === 'Pending') ? '#fef3c7' : (previewLead.status === 'Inquiry' || previewLead.status === 'In Progress') ? '#dbeafe' : '#fee2e2',
                        color: (previewLead.status === 'Closed-Won' || previewLead.status === 'Booked') ? '#15803d' : (previewLead.status === 'Pending Inquiry' || previewLead.status === 'Pending') ? '#d97706' : (previewLead.status === 'Inquiry' || previewLead.status === 'In Progress') ? '#0284c7' : '#dc2626'
                      }}
                    >
                      {previewLead.status || 'New'}
                    </span>
                  </div>
                  <div className="text-white-50" style={{ fontSize: '0.75rem' }}>
                    {previewLead.source} · Created {previewLead.created_at || previewLead.createdAt || 'Recently'}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                className="btn p-1 text-white-50 hover-text-white border-0" 
                onClick={handleClosePreview}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-grow-1 overflow-auto p-4" style={{ background: '#f8fafc' }}>
              {/* Top Overview Cards: Customer Requirement & Next Actionable */}
              <div className="row g-3 mb-3">
                <div className="col-md-6 col-sm-12">
                  <div className="p-3 bg-white rounded-3 shadow-xs border h-100" style={{ borderLeft: '4px solid #16a34a' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', color: '#16a34a' }}>
                        📌 CUSTOMER REQUIREMENT / ENQUIRY
                      </span>
                      {linkedEnquiry ? (
                        <span className="badge rounded-pill bg-success text-white px-2" style={{ fontSize: '0.64rem' }}>Custom Enquiry</span>
                      ) : previewLead.pax ? (
                        <span className="badge rounded-pill bg-light text-dark border px-2 py-0.5" style={{ fontSize: '0.66rem' }}>
                          👥 {previewLead.pax} Guests
                        </span>
                      ) : null}
                    </div>
                    {linkedEnquiryLoading ? (
                      <div className="py-2 text-muted small fst-italic">
                        <span className="spinner-border spinner-border-sm text-success me-2" />
                        Loading custom enquiry details...
                      </div>
                    ) : linkedEnquiry ? (
                      <div>
                        {linkedEnquiry.destinations && (
                          <h6 className="fw-bold text-dark mb-1 font-heading" style={{ fontSize: '0.92rem' }}>📍 {linkedEnquiry.destinations}</h6>
                        )}
                        {linkedEnquiry.travel_dates && (
                          <p className="mb-1 text-muted" style={{ fontSize: '0.76rem' }}>📅 {linkedEnquiry.travel_dates}{linkedEnquiry.flexible_dates == 1 ? ' (Flexible)' : ''}</p>
                        )}
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          {linkedEnquiry.adults > 0 && <span className="badge bg-light text-dark border" style={{ fontSize: '0.66rem' }}>👥 {linkedEnquiry.adults} Adults{linkedEnquiry.children > 0 ? ` + ${linkedEnquiry.children} Ch` : ''}{linkedEnquiry.infants > 0 ? ` + ${linkedEnquiry.infants} Inf` : ''}</span>}
                          {linkedEnquiry.budget_range && <span className="badge bg-success-subtle text-success border" style={{ fontSize: '0.66rem' }}>💰 {linkedEnquiry.budget_range}</span>}
                          {linkedEnquiry.hotel_category && <span className="badge bg-light text-dark border" style={{ fontSize: '0.66rem' }}>🏨 {linkedEnquiry.hotel_category}{linkedEnquiry.room_type ? ` · ${linkedEnquiry.room_type}` : ''}</span>}
                          {linkedEnquiry.meal_pref && <span className="badge bg-light text-dark border" style={{ fontSize: '0.66rem' }}>🍽️ {linkedEnquiry.meal_pref}</span>}
                          {linkedEnquiry.req_flight == 1 && <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '0.66rem' }}>✈️ Flight</span>}
                          {linkedEnquiry.req_train == 1 && <span className="badge bg-secondary-subtle text-secondary border" style={{ fontSize: '0.66rem' }}>🚆 Train</span>}
                          {linkedEnquiry.req_car == 1 && <span className="badge bg-warning-subtle text-warning-emphasis border" style={{ fontSize: '0.66rem' }}>🚗 Car</span>}
                          {linkedEnquiry.req_bike == 1 && <span className="badge bg-warning-subtle text-warning-emphasis border" style={{ fontSize: '0.66rem' }}>🏍️ Bike</span>}
                          {linkedEnquiry.req_airport_pickup == 1 && <span className="badge bg-info-subtle text-info border" style={{ fontSize: '0.66rem' }}>🛬 Airport Transfer</span>}
                          {linkedEnquiry.req_sightseeing == 1 && <span className="badge bg-success-subtle text-success border" style={{ fontSize: '0.66rem' }}>🗺️ Sightseeing</span>}
                          {linkedEnquiry.req_adventure == 1 && <span className="badge bg-danger-subtle text-danger border" style={{ fontSize: '0.66rem' }}>🌊 Adventure</span>}
                        </div>
                        {linkedEnquiry.special_requests && (
                          <p className="mb-0 mt-1 text-muted fst-italic" style={{ fontSize: '0.72rem' }}>💬 {linkedEnquiry.special_requests}</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <h6 className="fw-bold text-dark mb-1 font-heading" style={{ fontSize: '0.92rem' }}>
                          {previewLead.notes || previewLead.service || 'General Trip Consultation'}
                        </h6>
                        <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                          Service: {previewLead.service || 'Holiday Planning'} · Category: {previewLead.source}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6 col-sm-12">
                  <div className="p-3 bg-white rounded-3 shadow-xs border h-100" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="text-muted text-uppercase fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.68rem', color: '#b45309' }}>
                        <Clock size={12} className="text-warning" /> NEXT ACTIONABLE STEP
                      </span>
                      {previewLead.budget && (
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-0.5 fw-bold" style={{ fontSize: '0.66rem' }}>
                          Budget: {previewLead.budget}
                        </span>
                      )}
                    </div>
                    <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem', color: '#b45309' }}>
                      {previewLead.next_action || previewLead.nextAction || <span className="text-muted fw-normal fst-italic">No next action set</span>}
                    </h6>
                    <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                      Assigned to: <strong className="text-dark">{previewLead.assigned_to || previewLead.assignedTo || 'Unassigned'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Chatbot Transcript in Preview Modal if available */}
              {previewLead.chat_history && (
                <div className="p-3 rounded-3 mb-3 bg-white shadow-xs border">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <span className="fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                      <Sparkles size={14} style={{ color: '#FF6333' }} /> AI CHATBOT CONVERSATION TRANSCRIPT
                    </span>
                    <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: '0.68rem' }}>
                      Luzia AI Assistant
                    </span>
                  </div>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {(() => {
                      let msgs = [];
                      try {
                        msgs = typeof previewLead.chat_history === 'string' ? JSON.parse(previewLead.chat_history) : (previewLead.chat_history || []);
                      } catch (e) {
                        msgs = [];
                      }
                      if (!Array.isArray(msgs) || msgs.length === 0) {
                        return <div className="text-muted small">No conversation messages recorded.</div>;
                      }
                      return msgs.map((m, idx) => {
                        const isUser = m.role === 'user';
                        return (
                          <div 
                            key={idx}
                            className={`p-2 rounded-3 ${isUser ? 'align-self-end bg-light border' : 'align-self-start text-white'}`}
                            style={{ 
                              maxWidth: '85%', 
                              fontSize: '0.75rem',
                              background: isUser ? '#f1f5f9' : '#0D1B2E',
                              color: isUser ? '#0f172a' : '#fff'
                            }}
                          >
                            <div className="fw-bold mb-0.5" style={{ fontSize: '0.66rem', color: isUser ? '#2563eb' : '#FF8A00' }}>
                              {isUser ? (previewLead.name || 'Customer') : 'Luzia AI'}
                            </div>
                            <div>{m.content}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Customer Contact & Action Banner */}
              <div className="p-3 rounded-3 mb-4 bg-white shadow-xs border">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-2 rounded-circle bg-light text-primary">
                      <Phone size={18} />
                    </div>
                    <div>
                      <span className="d-block text-muted" style={{ fontSize: '0.72rem' }}>CUSTOMER CONTACT</span>
                      <span className="fw-bold text-dark">{previewLead.phone}</span>
                      {previewLead.email && <span className="text-muted ms-2 small">({previewLead.email})</span>}
                    </div>
                  </div>
                  {(() => {
                    const rawP = String(previewLead.phone || '').replace(/[^0-9]/g, '');
                    const waP = rawP.length === 10 ? '91' + rawP : rawP;
                    return (
                      <div className="d-flex gap-2">
                        <a 
                          href={`https://wa.me/${waP}?text=${encodeURIComponent(`Hi ${previewLead.name}, this is ${currentUserName} from WOW GOA regarding your requested trip/service (${previewLead.service || 'Goa Holiday'})!`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-success btn-sm d-flex align-items-center gap-1.5 fw-bold"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <MessageSquare size={14} /> WhatsApp
                        </a>
                        <a 
                          href={`tel:${previewLead.phone}`}
                          className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 fw-bold"
                          style={{ fontSize: '0.78rem' }}
                        >
                          <PhoneCall size={14} /> Call
                        </a>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Dynamic Lead Schedule: Vehicle Rental Handover vs Tour Package Itinerary */}
              {(() => {
                const isVehicleRental = isVehicleRentalLead(previewLead);

                if (isVehicleRental) {
                  const defaultPickup = 'Goa Airport (Dabolim / Mopa) / Doorstep Delivery';
                  let pickupInfo = defaultPickup;
                  if (previewLead.notes) {
                    if (previewLead.notes.includes('|')) {
                      const parts = previewLead.notes.split('|').map(s => s.trim()).filter(Boolean);
                      const locPart = parts.find(p => /airport|mopa|dabolim|doorstep|delivery|hotel|station|calangute|candolim|baga|panjim/i.test(p));
                      pickupInfo = (locPart && !/^(thar|car|bike|scooter|rental)/i.test(locPart)) ? locPart : (parts[1] || defaultPickup);
                    } else {
                      const isVehicleReqOnly = /^(?:rent\s+a\s+|need\s+a\s+|self\s+drive\s+)?(?:thar|car|bike|scooter|fortuner|scorpio|innova|activa)(?:\s+rental|\s+rent)?$/i.test(previewLead.notes.trim()) ||
                        previewLead.notes.trim().toLowerCase() === 'thar rental';
                      if (!isVehicleReqOnly && /airport|mopa|dabolim|doorstep|delivery|hotel|station|calangute|candolim|baga|panjim/i.test(previewLead.notes)) {
                        pickupInfo = previewLead.notes.trim();
                      }
                    }
                  }

                  const vehicleTitle = (() => {
                    const serv = (previewLead.service || '').trim();
                    const isGenericChat = /ai\s*(?:travel\s*assistant|planner|chat)/i.test(serv) || serv.toLowerCase() === 'general inquiry';
                    if (!isGenericChat && serv) {
                      return serv;
                    }
                    if (previewLead.notes && !previewLead.notes.toLowerCase().startsWith('inquired via')) {
                      const cleanNote = previewLead.notes.split('|')[0].trim();
                      if (cleanNote) return cleanNote;
                    }
                    return 'Self-Drive Vehicle';
                  })();

                  return (
                    <div className="bg-white rounded-3 shadow-xs border p-4 mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div>
                          <h6 className="fw-bold text-dark mb-0 font-heading d-flex align-items-center gap-2">
                            <Car size={18} className="text-warning" />
                            <span>Vehicle Rental &amp; Handover Schedule</span>
                          </h6>
                          <span className="text-muted small">Fleet allocation &amp; handover schedule for {previewLead.name}</span>
                        </div>
                        <span className="badge rounded-pill bg-light text-dark border px-3 py-1.5 fw-bold" style={{ fontSize: '0.75rem' }}>
                          {vehicleTitle}
                        </span>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {/* Handover & Delivery Schedule */}
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge bg-warning text-dark fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>Phase 1</span>
                            <span className="fw-bold text-dark small">Vehicle Delivery, Handover &amp; Digital Inspection</span>
                          </div>
                          <div className="row g-2 mt-1">
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-dark d-block">📍 Delivery / Pickup Point</span>
                                <span className="text-muted">{pickupInfo}</span>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-primary d-block">📋 Digital Checklist &amp; Verification</span>
                                <span className="text-muted">DL / ID check, 360° pre-handover photo inspection &amp; fuel gauge confirmation.</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Standard Rental Assurance & Inclusions */}
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge bg-success text-white fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>Inclusions</span>
                            <span className="fw-bold text-dark small">WOW GOA Premium Rental Assurance</span>
                          </div>
                          <div className="row g-2 mt-1">
                            <div className="col-md-4">
                              <div className="p-2 rounded bg-white border h-100" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-success d-block">🛡️ Zero Security Deposit</span>
                                <span className="text-muted">No hidden hold or security freeze on credit/debit card.</span>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="p-2 rounded bg-white border h-100" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-primary d-block">🛣️ Unlimited Kilometers</span>
                                <span className="text-muted">Drive freely across all North &amp; South Goa routes with no cap.</span>
                              </div>
                            </div>
                            <div className="col-md-4">
                              <div className="p-2 rounded bg-white border h-100" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-info d-block">📄 Full Insurance &amp; RSA</span>
                                <span className="text-muted">Comprehensive bumper-to-bumper cover with 24/7 roadside assist.</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Return & Clearance */}
                        <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge bg-dark text-white fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>Phase 2</span>
                            <span className="fw-bold text-dark small">Return Drop-Off &amp; Instant Key Handover Clearance</span>
                          </div>
                          <div className="row g-2 mt-1">
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-dark d-block">🔄 Flexible Drop-Off Location</span>
                                <span className="text-muted">Airport terminal departure lane or hotel lobby return with seamless handover.</span>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-success d-block">⚡ Instant Handover Clearance</span>
                                <span className="text-muted">Quick 2-minute digital check-out with instant clearance confirmation.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // If custom enquiry is still loading, show loading spinner
                if (linkedEnquiryLoading) {
                  return (
                    <div className="bg-white rounded-3 shadow-xs border p-5 mb-3 text-center">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                      <span className="text-muted small fw-semibold">Loading custom enquiry details and generating tailored itinerary...</span>
                    </div>
                  );
                }

                // ── Custom Trips: build itinerary from the linked enquiry record ──
                const enq = linkedEnquiry;
                if (enq) {
                  // Calculate duration from travel_dates e.g. "12 Sep 2026 to 14 Sep 2026" or "15/09/2026"
                  let numDays = 1;
                  let durationLabel = '1 Day Plan';

                  if (enq.travel_dates) {
                    const cleanDates = enq.travel_dates.replace(' (Flexible)', '').trim();
                    const parts = cleanDates.split(/\s+(?:to|-)\s+/i);
                    if (parts.length === 2) {
                      let s1 = parts[0].trim();
                      let s2 = parts[1].trim();
                      if (!/\d{4}/.test(s1) && /\d{4}/.test(s2)) {
                        const yearMatch = s2.match(/\d{4}/);
                        if (yearMatch) s1 += ' ' + yearMatch[0];
                      }
                      const d1 = parseTravelDate(s1);
                      const d2 = parseTravelDate(s2);
                      if (d1 && d2 && d2 >= d1) {
                        const diff = Math.round((d2 - d1) / 86400000);
                        if (diff === 0) {
                          numDays = 1;
                          durationLabel = `1 Day (Same-Day Plan)${enq.flexible_dates == 1 ? ' · Flexible' : ''}`;
                        } else {
                          numDays = diff + 1;
                          durationLabel = `${numDays} Days / ${diff} Night${diff !== 1 ? 's' : ''}${enq.flexible_dates == 1 ? ' · Flexible' : ''}`;
                        }
                      } else {
                        durationLabel = enq.travel_dates;
                      }
                    } else {
                      // Single date e.g. "15/09/2026" or "From 15 Sep 2026"
                      const singleStr = cleanDates.replace(/^From\s+/i, '').trim();
                      const d = parseTravelDate(singleStr);
                      if (d) {
                        numDays = 1;
                        durationLabel = `1 Day (${cleanDates})${enq.flexible_dates == 1 ? ' · Flexible' : ''}`;
                      } else {
                        durationLabel = enq.travel_dates;
                      }
                    }
                  } else {
                    const dMatch = (previewLead.service || previewLead.title || previewLead.notes || '').match(/(\d+)\s*(?:days?|d\b)/i);
                    if (dMatch) {
                      numDays = Math.max(1, parseInt(dMatch[1], 10));
                      const nights = Math.max(0, numDays - 1);
                      durationLabel = numDays === 1 ? '1 Day Plan' : `${numDays} Days / ${nights} Night${nights !== 1 ? 's' : ''}`;
                    } else {
                      numDays = 1;
                      durationLabel = '1 Day Plan (Flexible Dates)';
                    }
                  }

                  // Build day templates based on what the customer actually requested
                  const days = getCustomItineraryDays(numDays, enq, previewLead);

                  // Services summary for the itinerary header
                  const reqServices = [
                    enq.req_flight == 1 && '✈️ Flight',
                    enq.req_train == 1 && '🚆 Train',
                    enq.req_car == 1 && '🚗 Self-Drive Car',
                    enq.req_bike == 1 && '🏍️ Bike Rental',
                    enq.req_airport_pickup == 1 && '🛬 Airport Transfer',
                    enq.req_sightseeing == 1 && '🗺️ Sightseeing',
                    enq.req_adventure == 1 && '🌊 Adventure/Activities',
                    enq.hotel_category && `🏨 ${enq.hotel_category} Hotel`,
                  ].filter(Boolean);

                  return (
                    <div className="bg-white rounded-3 shadow-xs border p-4 mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div>
                          <h6 className="fw-bold text-dark mb-0 font-heading">
                            📍 Custom Trip Itinerary — {enq.destinations || 'Goa'}
                          </h6>
                          <span className="text-muted small">Based on enquiry requirements submitted by {previewLead.name}</span>
                        </div>
                        <span className="badge rounded-pill bg-success text-white px-3 fw-bold" style={{ fontSize: '0.75rem' }}>
                          {durationLabel}
                        </span>
                      </div>

                      {/* Requested services summary */}
                      {reqServices.length > 0 && (
                        <div className="p-2 rounded-3 mb-3 d-flex flex-wrap gap-1" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                          <span className="fw-bold text-success me-1" style={{ fontSize: '0.72rem' }}>Requested Services:</span>
                          {reqServices.map((s, i) => (
                            <span key={i} className="badge bg-white text-dark border" style={{ fontSize: '0.68rem' }}>{s}</span>
                          ))}
                        </div>
                      )}

                      {/* Special requests */}
                      {enq.special_requests && (
                        <div className="p-2 rounded-3 mb-3" style={{ background: '#fefce8', border: '1px solid #fde68a', fontSize: '0.78rem' }}>
                          <span className="fw-bold text-warning-emphasis">💬 Special Request: </span>
                          <span className="text-dark">{enq.special_requests}</span>
                        </div>
                      )}

                      {/* Day-wise itinerary */}
                      <div className="d-flex flex-column gap-3">
                        {days.map((day, idx) => (
                          <div key={idx} className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-primary text-white fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>Day {day.dayNum || idx + 1}</span>
                              <span className="fw-bold text-dark small">{day.title}</span>
                            </div>
                            <div className="row g-2 mt-1">
                              <div className="col-md-6">
                                <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                  <span className="fw-bold text-warning d-block">🌅 Morning</span>
                                  <span className="text-muted">{day.morning}</span>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                  <span className="fw-bold text-primary d-block">☀️ Afternoon</span>
                                  <span className="text-muted">{day.afternoon}</span>
                                </div>
                              </div>
                              {day.evening && (
                                <div className="col-md-6">
                                  <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                    <span className="fw-bold text-info d-block">🌆 Evening</span>
                                    <span className="text-muted">{day.evening}</span>
                                  </div>
                                </div>
                              )}
                              {day.night && (
                                <div className="col-md-6">
                                  <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                    <span className="fw-bold d-block" style={{ color: '#7c3aed' }}>🌙 Night</span>
                                    <span className="text-muted">{day.night}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Enquiry reference */}
                      <div className="mt-3 pt-2 border-top text-muted" style={{ fontSize: '0.72rem' }}>
                        Enquiry Ref: <strong>{enq.enquiry_id || enq.id}</strong> · Trip Type: {enq.trip_type || 'Holiday'} · Submitted by {enq.customer_name}
                      </div>
                    </div>
                  );
                }

                // ── Fallback: Tour / Package Leads without linked custom enquiry ──
                const dMatch = (previewLead.service || previewLead.title || previewLead.notes || '').match(/(\d+)\s*(?:days?|d\b)/i);
                const hasExplicitDuration = Boolean(dMatch || previewLead.booking_days);
                const isGenericAiEnquiry = (
                  previewLead.source === 'AI Planner' || 
                  (previewLead.service || '').toLowerCase().includes('ai travel assistant')
                ) && !hasExplicitDuration;

                // For generic AI enquiries without requested trip duration, do NOT fabricate a fake 4-day itinerary
                if (isGenericAiEnquiry) {
                  return (
                    <div className="bg-white rounded-3 shadow-xs border p-4 mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div>
                          <h6 className="fw-bold text-dark mb-0 font-heading d-flex align-items-center gap-2">
                            <Sparkles size={18} style={{ color: '#FF6333' }} />
                            <span>AI Travel Consultation Overview</span>
                          </h6>
                          <span className="text-muted small">Inquiry consultation details for {previewLead.name}</span>
                        </div>
                        <span className="badge rounded-pill bg-light text-primary border px-3 py-1.5 fw-bold" style={{ fontSize: '0.75rem' }}>
                          AI Inbound Inquiry
                        </span>
                      </div>

                      <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="badge bg-primary text-white fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>Requirement</span>
                          <span className="fw-bold text-dark small">{previewLead.notes || 'General Trip Consultation'}</span>
                        </div>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                          The customer connected via Luzia AI Assistant. Review the conversation transcript above for full context and use the quick action buttons to follow up.
                        </p>
                      </div>
                    </div>
                  );
                }

                let fallbackDays = 4;
                let fallbackDuration = '4 Days / 3 Nights';

                if (dMatch) {
                  fallbackDays = Math.max(1, parseInt(dMatch[1], 10));
                  const nights = Math.max(0, fallbackDays - 1);
                  fallbackDuration = fallbackDays === 1 ? '1 Day Plan' : `${fallbackDays} Days / ${nights} Night${nights !== 1 ? 's' : ''}`;
                } else if (previewLead.booking_days) {
                  fallbackDays = Math.max(1, parseInt(previewLead.booking_days, 10));
                  const nights = Math.max(0, fallbackDays - 1);
                  fallbackDuration = fallbackDays === 1 ? '1 Day Plan' : `${fallbackDays} Days / ${nights} Night${nights !== 1 ? 's' : ''}`;
                }

                const fallbackDaysList = getCustomItineraryDays(fallbackDays, {}, previewLead);

                return (
                  <div className="bg-white rounded-3 shadow-xs border p-4 mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                      <div>
                        <h6 className="fw-bold text-dark mb-0 font-heading">
                          📍 {fallbackDays === 1 ? '1-Day Itinerary & Activity Schedule' : `${fallbackDays}-Day Itinerary & Activity Schedule`}
                        </h6>
                        <span className="text-muted small">Customized travel schedule for {previewLead.name}</span>
                      </div>
                      <span className="badge rounded-pill bg-light text-dark border px-3 py-1.5 fw-bold" style={{ fontSize: '0.75rem' }}>
                        {fallbackDuration}
                      </span>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {fallbackDaysList.map((day, idx) => (
                        <div key={idx} className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="badge bg-primary text-white fw-bold px-2 py-1" style={{ fontSize: '0.72rem' }}>Day {day.dayNum || idx + 1}</span>
                            <span className="fw-bold text-dark small">{day.title}</span>
                          </div>
                          <div className="row g-2 mt-1">
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-warning d-block">🌅 Morning</span>
                                <span className="text-muted">{day.morning}</span>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                <span className="fw-bold text-primary d-block">☀️ Afternoon</span>
                                <span className="text-muted">{day.afternoon}</span>
                              </div>
                            </div>
                            {day.evening && (
                              <div className="col-md-6">
                                <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                  <span className="fw-bold text-info d-block">🌆 Evening</span>
                                  <span className="text-muted">{day.evening}</span>
                                </div>
                              </div>
                            )}
                            {day.night && (
                              <div className="col-md-6">
                                <div className="p-2 rounded bg-white border" style={{ fontSize: '0.78rem' }}>
                                  <span className="fw-bold text-purple d-block" style={{ color: '#7c3aed' }}>🌙 Night</span>
                                  <span className="text-muted">{day.night}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-white border-top d-flex align-items-center justify-content-between flex-shrink-0">
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                Trip Galileo CRM Itinerary &amp; Operations Engine
              </div>
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm px-3 py-1.5 fw-bold" 
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => window.print()}
                >
                  {isVehicleRentalLead(previewLead) ? 'Print Rental Summary' : 'Print Itinerary'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-dark btn-sm px-4 py-1.5 fw-bold" 
                  style={{ fontSize: '0.8rem' }}
                  onClick={handleClosePreview}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
