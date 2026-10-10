import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import {
  DollarSign,
  Receipt,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  X,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ArrowRight,
  ShieldCheck,
  Send,
  Check,
  User,
  Car,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

const BillingSettlements = () => {
  // Primary Tabs: 'invoices' | 'pricing' | 'payouts'
  const [activeTab, setActiveTab] = useState('invoices');

  // Data states
  const [invoices, setInvoices] = useState([]);
  const [pricingCards, setPricingCards] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [clients, setClients] = useState([]);
  const [summary, setSummary] = useState({
    total_invoiced: 0,
    total_paid: 0,
    total_outstanding: 0,
    overdue_count: 0,
    draft_count: 0,
    monthly_revenue: [],
    top_clients: []
  });
  const [loading, setLoading] = useState(true);

  // Filters for Invoices
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoiceClientFilter, setInvoiceClientFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPayoutGenModal, setShowPayoutGenModal] = useState(false);

  // Selected item for modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form states
  const [generateInvoiceForm, setGenerateInvoiceForm] = useState({
    client_id: '',
    period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10)
  });
  const [generateSubmitting, setGenerateSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    payment_reference: '',
    payment_mode: 'NEFT',
    amount_paid_inr: ''
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [pricingForm, setPricingForm] = useState({
    client: '',
    service_type: 'AIRPORT_TRANSFER',
    vehicle_class: 'SEDAN',
    base_rate_inr: 2500,
    extra_km_rate_inr: 15,
    included_km: 40,
    night_surcharge_pct: 15,
    weekend_surcharge_pct: 10,
    gst_pct: 5,
    notes: ''
  });
  const [pricingSubmitting, setPricingSubmitting] = useState(false);

  const [payoutGenForm, setPayoutGenForm] = useState({
    period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    period_end: new Date().toISOString().slice(0, 10),
    base_pay_per_trip: 800
  });
  const [payoutGenSubmitting, setPayoutGenSubmitting] = useState(false);

  // Load all billing datasets
  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const [invRes, summaryRes, pricingRes, payoutsRes, clientsRes] = await Promise.all([
        api.get('billing/invoices/'),
        api.get('billing/invoices/summary/'),
        api.get('billing/pricing/'),
        api.get('billing/payouts/'),
        api.get('dispatches/clients/')
      ]);

      setInvoices(invRes.data.results || invRes.data || []);
      setSummary(summaryRes.data || {});
      setPricingCards(pricingRes.data.results || pricingRes.data || []);
      setPayouts(payoutsRes.data.results || payoutsRes.data || []);
      setClients(clientsRes.data.results || clientsRes.data || []);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceStatusFilter !== 'ALL' && inv.status !== invoiceStatusFilter) return false;
    if (invoiceClientFilter && String(inv.client) !== String(invoiceClientFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.invoice_number?.toLowerCase().includes(q);
      const matchClient = inv.client_name?.toLowerCase().includes(q);
      const matchRef = inv.payment_reference?.toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchRef) return false;
    }
    return true;
  });

  // Action: Generate Invoice
  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!generateInvoiceForm.client_id) {
      alert('Please select a corporate client.');
      return;
    }
    setGenerateSubmitting(true);
    try {
      await api.post('billing/invoices/generate_invoice/', generateInvoiceForm);
      setShowGenerateInvoiceModal(false);
      fetchBillingData();
    } catch (err) {
      alert('Error generating invoice: ' + (err.response?.data?.error || err.message));
    } finally {
      setGenerateSubmitting(false);
    }
  };

  // Action: Mark Invoice as Sent
  const handleMarkSent = async (invoiceId) => {
    try {
      await api.post(`billing/invoices/${invoiceId}/mark_sent/`);
      fetchBillingData();
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Action: Open Payment Modal
  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      payment_reference: '',
      payment_mode: 'NEFT',
      amount_paid_inr: invoice.amount_due_inr || invoice.total_inr
    });
    setShowPaymentModal(true);
  };

  // Action: Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaymentSubmitting(true);
    try {
      await api.post(`billing/invoices/${selectedInvoice.id}/mark_paid/`, paymentForm);
      setShowPaymentModal(false);
      fetchBillingData();
    } catch (err) {
      alert('Error recording payment: ' + (err.response?.data?.message || err.message));
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Action: Save Contract Pricing Card
  const handleCreatePricingCard = async (e) => {
    e.preventDefault();
    if (!pricingForm.client) {
      alert('Please choose a corporate client.');
      return;
    }
    setPricingSubmitting(true);
    try {
      await api.post('billing/pricing/', pricingForm);
      setShowPricingModal(false);
      fetchBillingData();
    } catch (err) {
      alert('Error saving pricing card: ' + JSON.stringify(err.response?.data || err.message));
    } finally {
      setPricingSubmitting(false);
    }
  };

  // Action: Generate Driver Payouts
  const handleGeneratePayouts = async (e) => {
    e.preventDefault();
    setPayoutGenSubmitting(true);
    try {
      const res = await api.post('billing/payouts/generate_payouts/', payoutGenForm);
      alert(res.data.message || 'Driver payouts generated!');
      setShowPayoutGenModal(false);
      fetchBillingData();
    } catch (err) {
      alert('Error generating payouts: ' + (err.response?.data?.error || err.message));
    } finally {
      setPayoutGenSubmitting(false);
    }
  };

  // Action: Mark Driver Payout as Paid
  const handleMarkPayoutPaid = async (payoutId) => {
    try {
      await api.post(`billing/payouts/${payoutId}/mark_paid/`);
      fetchBillingData();
    } catch (err) {
      alert('Error updating payout: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open Invoice Preview Modal
  const handleOpenInvoicePreview = (invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  return (
    <div style={{ padding: '24px 36px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* PAGE HEADER & ACTION CONTROLS */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Corporate Billing & Settlements
            </h1>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              background: '#1e293b',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>
              Phase 3 Live
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', margin: '4px 0 0 0' }}>
            Automated GST tax invoicing, contract rate cards, and chauffeur payroll settlements
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchBillingData}
            className="btn-secondary"
            title="Refresh Financials"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', borderRadius: '12px' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {activeTab === 'invoices' && (
            <button
              onClick={() => {
                if (clients.length > 0) {
                  setGenerateInvoiceForm(prev => ({ ...prev, client_id: clients[0].id }));
                }
                setShowGenerateInvoiceModal(true);
              }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '12px' }}
            >
              <Plus size={16} />
              <span>Generate Batch Invoice</span>
            </button>
          )}

          {activeTab === 'pricing' && (
            <button
              onClick={() => {
                if (clients.length > 0) {
                  setPricingForm(prev => ({ ...prev, client: clients[0].id }));
                }
                setShowPricingModal(true);
              }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '12px' }}
            >
              <Plus size={16} />
              <span>Add Rate Card</span>
            </button>
          )}

          {activeTab === 'payouts' && (
            <button
              onClick={() => setShowPayoutGenModal(true)}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '12px' }}
            >
              <CreditCard size={16} />
              <span>Calculate Driver Payouts</span>
            </button>
          )}
        </div>
      </div>

      {/* EXECUTIVE FINANCIAL KPI CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        {/* Card 1: Total Invoiced */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          padding: '22px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Billed
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={18} color="#0f172a" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{summary.total_invoiced?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
            Across {invoices.length} corporate billing cycles
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          padding: '22px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Collected
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(240, 253, 244, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#15803d" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', letterSpacing: '-0.02em' }}>
            ₹{summary.total_paid?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '6px' }}>
            Settled via NEFT / RTGS transfers
          </div>
        </div>

        {/* Card 3: Outstanding Receivables */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          padding: '22px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Outstanding Balance
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: summary.overdue_count > 0 ? 'rgba(254, 242, 242, 0.9)' : '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color={summary.overdue_count > 0 ? '#b91c1c' : '#b45309'} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: summary.overdue_count > 0 ? '#b91c1c' : '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{summary.total_outstanding?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </div>
          <div style={{ fontSize: '0.78rem', color: summary.overdue_count > 0 ? '#b91c1c' : '#64748b', marginTop: '6px', fontWeight: summary.overdue_count > 0 ? 600 : 400 }}>
            {summary.overdue_count} overdue accounts • {summary.draft_count} draft batch
          </div>
        </div>

        {/* Card 4: Driver Payouts Pending */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRadius: '18px',
          border: '1px solid var(--border-color)',
          padding: '22px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Chauffeur Payouts Accrued
            </span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="#0f172a" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            ₹{payouts.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + Number(p.net_pay_inr || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
            {payouts.filter(p => p.status === 'PENDING').length} pending disbursements ready
          </div>
        </div>
      </div>

      {/* PRIMARY TAB NAVIGATION */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '14px',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'invoices' ? '#1e293b' : 'transparent',
            color: activeTab === 'invoices' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Receipt size={17} />
          <span>Corporate Tax Invoices</span>
          <span style={{
            fontSize: '0.74rem',
            padding: '2px 8px',
            borderRadius: '10px',
            background: activeTab === 'invoices' ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
            color: activeTab === 'invoices' ? '#ffffff' : '#334155'
          }}>
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'pricing' ? '#1e293b' : 'transparent',
            color: activeTab === 'pricing' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Building2 size={17} />
          <span>Contract Rate Cards</span>
          <span style={{
            fontSize: '0.74rem',
            padding: '2px 8px',
            borderRadius: '10px',
            background: activeTab === 'pricing' ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
            color: activeTab === 'pricing' ? '#ffffff' : '#334155'
          }}>
            {pricingCards.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payouts')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: activeTab === 'payouts' ? '#1e293b' : 'transparent',
            color: activeTab === 'payouts' ? '#ffffff' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <CreditCard size={17} />
          <span>Chauffeur Payout Settlements</span>
          <span style={{
            fontSize: '0.74rem',
            padding: '2px 8px',
            borderRadius: '10px',
            background: activeTab === 'payouts' ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0',
            color: activeTab === 'payouts' ? '#ffffff' : '#334155'
          }}>
            {payouts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CORPORATE INVOICES */}
      {activeTab === 'invoices' && (
        <div>
          {/* SEARCH & STATUS FILTER BAR */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            {/* Status Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'All Invoices' },
                { key: 'DRAFT', label: 'Draft' },
                { key: 'SENT', label: 'Sent to Client' },
                { key: 'PAID', label: 'Paid' },
                { key: 'OVERDUE', label: 'Overdue' }
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setInvoiceStatusFilter(status.key)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: invoiceStatusFilter === status.key ? '#1e293b' : 'var(--border-color)',
                    background: invoiceStatusFilter === status.key ? '#1e293b' : '#ffffff',
                    color: invoiceStatusFilter === status.key ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* Search and Client select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search invoice #, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '34px', paddingRight: '12px', height: '36px', fontSize: '0.82rem', borderRadius: '10px' }}
                />
              </div>

              <select
                className="select-field"
                value={invoiceClientFilter}
                onChange={(e) => setInvoiceClientFilter(e.target.value)}
                style={{ height: '36px', fontSize: '0.82rem', borderRadius: '10px', padding: '0 12px' }}
              >
                <option value="">All Corporate Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* INVOICES LIST / CARDS */}
          {filteredInvoices.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.85)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)'
            }}>
              <Receipt size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                No invoices found
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                Try adjusting your filters or generate a new batch invoice from completed dispatches.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '18px',
                    border: '1px solid var(--border-color)',
                    padding: '20px 24px',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  {/* Left: Invoice Identity & Client */}
                  <div style={{ minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        color: '#0f172a'
                      }}>
                        {inv.invoice_number}
                      </span>
                      {inv.status === 'PAID' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', background: 'rgba(240, 253, 244, 0.9)', padding: '3px 8px', borderRadius: '12px' }}>
                          ● Paid
                        </span>
                      )}
                      {inv.status === 'SENT' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e293b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '12px' }}>
                          ● Sent to Client
                        </span>
                      )}
                      {inv.status === 'DRAFT' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', background: '#e2e8f0', padding: '3px 8px', borderRadius: '12px' }}>
                          ● Draft
                        </span>
                      )}
                      {inv.status === 'OVERDUE' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b91c1c', background: 'rgba(254, 242, 242, 0.9)', padding: '3px 8px', borderRadius: '12px' }}>
                          ● Overdue
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>
                      {inv.client_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                      Billing Period: {inv.billing_period_start} to {inv.billing_period_end} • {inv.booking_count} trips billed
                    </div>
                  </div>

                  {/* Middle: Financials Breakdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Subtotal</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        ₹{Number(inv.subtotal_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Tolls + 5% GST</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                        ₹{(Number(inv.toll_reimbursements_inr) + Number(inv.gst_inr)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Invoiced</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                        ₹{Number(inv.total_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Due Date</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: inv.is_overdue ? '#b91c1c' : '#334155', marginTop: '2px' }}>
                        {inv.due_date || 'Net 30'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleOpenInvoicePreview(inv)}
                      className="btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      <FileText size={15} color="#0f172a" />
                      <span>View Tax Invoice</span>
                    </button>

                    {inv.status === 'DRAFT' && (
                      <button
                        onClick={() => handleMarkSent(inv.id)}
                        className="btn-secondary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                      >
                        <Send size={14} />
                        <span>Send to Client</span>
                      </button>
                    )}

                    {inv.status !== 'PAID' && (
                      <button
                        onClick={() => handleOpenPaymentModal(inv)}
                        className="btn-primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                      >
                        <Check size={14} />
                        <span>Record Payment</span>
                      </button>
                    )}

                    {inv.status === 'PAID' && (
                      <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600, padding: '4px 8px' }}>
                        Paid: {inv.payment_reference || 'NEFT'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTRACT PRICING CARDS */}
      {activeTab === 'pricing' && (
        <div>
          <div style={{ marginBottom: '18px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Corporate negotiated tariff agreements and SLAs. Dispatches automatically inherit these contracted rates.
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '18px'
          }}>
            {pricingCards.map((card) => (
              <div
                key={card.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '18px',
                  border: '1px solid var(--border-color)',
                  padding: '22px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b', background: '#f1f5f9', padding: '3px 10px', borderRadius: '12px' }}>
                      {card.vehicle_class}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#15803d', fontWeight: 600 }}>
                      ● Active Contract
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                    {card.client_name}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                    {card.service_type_display}
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '10px 0 16px 0', lineHeight: 1.4 }}>
                    {card.notes || 'Official contracted pricing schedule.'}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    padding: '14px',
                    background: 'rgba(248, 250, 252, 0.85)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Base Package</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{Number(card.base_rate_inr).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>incl. {card.included_km} km</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Extra Rate</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                        ₹{card.extra_km_rate_inr} <span style={{ fontSize: '0.74rem', fontWeight: 500 }}>/ km</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>+{card.gst_pct}% GST</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <span>Night Surcharge: <strong>{card.night_surcharge_pct}%</strong></span>
                  <span>Weekend: <strong>{card.weekend_surcharge_pct}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CHAUFFEUR PAYOUT SETTLEMENTS */}
      {activeTab === 'payouts' && (
        <div>
          <div style={{ marginBottom: '18px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Chauffeur trip earnings, distance incentives, and payroll disbursement records.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {payouts.map((payout) => (
              <div
                key={payout.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '18px',
                  border: '1px solid var(--border-color)',
                  padding: '20px 24px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                {/* Chauffeur Info */}
                <div style={{ minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {payout.driver_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Badge: {payout.driver_badge || 'CH-001'} • License: {payout.driver_license || 'DL-GOA'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '8px' }}>
                    Period: {payout.period_start} to {payout.period_end}
                  </div>
                </div>

                {/* Performance & Mileage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Trips Logged</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {payout.total_trips} trips
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Distance Driven</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {Number(payout.total_km).toFixed(1)} km
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Base Pay</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      ₹{Number(payout.base_pay_inr).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Incentive</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#15803d' }}>
                      +₹{Number(payout.incentive_inr).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Net Disbursable</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{Number(payout.net_pay_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Status & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {payout.status === 'PAID' ? (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', background: 'rgba(240, 253, 244, 0.9)', padding: '5px 12px', borderRadius: '12px' }}>
                      ✓ Paid on {payout.payment_date || 'Fortnight'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkPayoutPaid(payout.id)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem' }}
                    >
                      <Check size={14} />
                      <span>Disburse Payout</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: BATCH INVOICE GENERATOR */}
      {/* ========================================================= */}
      {showGenerateInvoiceModal && createPortal(
        <div className="portal-modal-overlay" onClick={() => setShowGenerateInvoiceModal(false)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '28px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Generate Batch Corporate Invoice
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                    Auto-aggregate completed trips & calculate 5% GST
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateInvoiceModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '50%', width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Select Corporate Account *
                </label>
                <select
                  className="select-field"
                  value={generateInvoiceForm.client_id}
                  onChange={(e) => setGenerateInvoiceForm({ ...generateInvoiceForm, client_id: e.target.value })}
                  required
                  style={{ width: '100%', borderRadius: '10px', padding: '10px' }}
                >
                  <option value="">Choose client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (GSTIN: {c.gstin || 'None'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Billing Period Start *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={generateInvoiceForm.period_start}
                    onChange={(e) => setGenerateInvoiceForm({ ...generateInvoiceForm, period_start: e.target.value })}
                    required
                    style={{ width: '100%', borderRadius: '10px', padding: '10px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                    Billing Period End *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={generateInvoiceForm.period_end}
                    onChange={(e) => setGenerateInvoiceForm({ ...generateInvoiceForm, period_end: e.target.value })}
                    required
                    style={{ width: '100%', borderRadius: '10px', padding: '10px' }}
                  />
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(248, 250, 252, 0.9)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: '#475569' }}>
                💡 <strong>System Automation:</strong> The engine queries all completed dispatches for the selected client in this range, applies contracted tariff cards, calculates toll/parking reimbursements, and formats a compliant GST tax invoice.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowGenerateInvoiceModal(false)}
                  className="btn-secondary"
                  style={{ padding: '9px 18px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateSubmitting}
                  className="btn-primary"
                  style={{ padding: '9px 20px', borderRadius: '10px' }}
                >
                  {generateSubmitting ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PRINTABLE GST TAX INVOICE */}
      {/* ========================================================= */}
      {showInvoiceModal && selectedInvoice && createPortal(
        <div className="portal-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div
            className="portal-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '820px', maxHeight: '92vh', overflowY: 'auto', padding: '36px', borderRadius: '24px', background: '#ffffff' }}
          >
            {/* INVOICE ACTIONS TOP BAR */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, background: '#1e293b', color: '#fff', padding: '4px 12px', borderRadius: '20px' }}>
                  GST TAX INVOICE
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  SAC Code: 996601 (Passenger Transport Services)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', fontSize: '0.82rem' }}
                >
                  <Printer size={15} />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="btn-secondary"
                  style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* INVOICE DOCUMENT CONTAINER (Standard Corporate Template) */}
            <div id="printable-gst-invoice" style={{ border: '1px solid #cbd5e1', borderRadius: '16px', padding: '28px', background: '#ffffff' }}>
              
              {/* Header: Company & Invoice Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    METRO FLEET LOGISTICS LTD
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                    Trading as <strong>APEX FLEET B2B MOBILITY</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                    Plot 12, Patto Plaza Commercial Complex, Panaji, Goa 403001<br />
                    GSTIN: <strong>30AABCM1029F1Z0</strong> • CIN: U60221GA2020PLC014221<br />
                    Billing Helpdesk: accounts@apexmobility.b2b • +91 832 242 9900
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    {selectedInvoice.invoice_number}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Date of Issue: <strong>{selectedInvoice.created_at?.slice(0, 10) || selectedInvoice.billing_period_end}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Due Date: <strong>{selectedInvoice.due_date || 'Net 30 Days'}</strong>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      background: selectedInvoice.status === 'PAID' ? 'rgba(240, 253, 244, 0.9)' : '#fefce8',
                      color: selectedInvoice.status === 'PAID' ? '#15803d' : '#b45309'
                    }}>
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bill To & Billing Period */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Billed To (Corporate Enterprise)
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                    {selectedInvoice.client_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '3px' }}>
                    GSTIN: <strong>{selectedInvoice.client_gstin || 'Unregistered Corporate Account'}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px', lineHeight: 1.3 }}>
                    {selectedInvoice.client_billing_address || 'Registered Corporate Office'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Billing Cycle
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                    {selectedInvoice.billing_period_start} to {selectedInvoice.billing_period_end}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                    Total Dispatches: <strong>{selectedInvoice.booking_count} Trips</strong>
                  </div>
                  {selectedInvoice.payment_reference && (
                    <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '4px', fontWeight: 600 }}>
                      UTR / Ref: {selectedInvoice.payment_reference} ({selectedInvoice.payment_mode})
                    </div>
                  )}
                </div>
              </div>

              {/* Trip Line Items Table */}
              <div style={{ marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left', background: '#f1f5f9' }}>
                      <th style={{ padding: '8px 10px', color: '#334155' }}>Booking Ref</th>
                      <th style={{ padding: '8px 10px', color: '#334155' }}>Passenger / Routing</th>
                      <th style={{ padding: '8px 10px', color: '#334155' }}>Type</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>Km</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>Base (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>Tolls (₹)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', color: '#334155' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.bookings_detail && selectedInvoice.bookings_detail.length > 0 ? (
                      selectedInvoice.bookings_detail.map((b) => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#0f172a' }}>
                            {b.booking_reference}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#1e293b' }}>
                            <strong>{b.passenger_name}</strong>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {b.pickup_location?.slice(0, 24)} ➔ {b.dropoff_location?.slice(0, 24)}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#475569' }}>
                            {b.booking_type_display}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                            {Number(b.distance_km || 0).toFixed(1)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                            ₹{Number(b.base_rate_inr || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                            ₹{Number(b.toll_parking_inr || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            ₹{Number(b.total_fare_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ padding: '14px', textAlign: 'center', color: '#64748b' }}>
                          Consolidated Monthly Retainer Invoiced Trips ({selectedInvoice.booking_count} Trips)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tax & Grand Total Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                <div style={{ width: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.84rem', color: '#475569' }}>
                    <span>Subtotal (Base + Extra KMs):</span>
                    <strong style={{ color: '#0f172a' }}>₹{Number(selectedInvoice.subtotal_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.84rem', color: '#475569' }}>
                    <span>Toll & Parking Reimbursements:</span>
                    <strong style={{ color: '#0f172a' }}>₹{Number(selectedInvoice.toll_reimbursements_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.84rem', color: '#475569' }}>
                    <span>CGST (2.5%):</span>
                    <strong style={{ color: '#0f172a' }}>₹{(Number(selectedInvoice.gst_inr) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.84rem', color: '#475569' }}>
                    <span>SGST (2.5%):</span>
                    <strong style={{ color: '#0f172a' }}>₹{(Number(selectedInvoice.gst_inr) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #0f172a', fontSize: '1.15rem', color: '#0f172a', fontWeight: 900 }}>
                    <span>Grand Total:</span>
                    <span>₹{Number(selectedInvoice.total_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {Number(selectedInvoice.amount_paid_inr) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.84rem', color: '#15803d' }}>
                      <span>Amount Received:</span>
                      <strong>-₹{Number(selectedInvoice.amount_paid_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '0.9rem', color: selectedInvoice.amount_due_inr > 0 ? '#b91c1c' : '#15803d', fontWeight: 800 }}>
                    <span>Balance Due:</span>
                    <span>₹{Number(selectedInvoice.amount_due_inr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details & Terms */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', fontSize: '0.78rem', color: '#64748b' }}>
                <div>
                  <strong style={{ color: '#0f172a' }}>Direct Bank Transfer Details:</strong><br />
                  Beneficiary Name: <strong>Metro Fleet Logistics Ltd</strong><br />
                  Bank Name: <strong>HDFC Bank Ltd</strong> • Branch: <strong>Panaji Main, Goa</strong><br />
                  Current A/C: <strong>50200088991122</strong> • IFSC Code: <strong>HDFC0000059</strong>
                </div>
                <div>
                  <strong style={{ color: '#0f172a' }}>Terms & Declaration:</strong><br />
                  • Certified that the particulars given above are true and correct.<br />
                  • GST Reverse Charge Mechanism (RCM) not applicable.<br />
                  • Interest @ 18% p.a. chargeable for payments delayed past terms.
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 3: RECORD PAYMENT */}
      {/* ========================================================= */}
      {showPaymentModal && selectedInvoice && createPortal(
        <div className="portal-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '28px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Record Corporate Payment
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  {selectedInvoice.invoice_number} • {selectedInvoice.client_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Payment Mode *
                </label>
                <select
                  className="select-field"
                  value={paymentForm.payment_mode}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}
                  style={{ width: '100%', borderRadius: '10px', padding: '10px' }}
                >
                  <option value="NEFT">NEFT National Electronic Funds</option>
                  <option value="RTGS">RTGS Real Time Gross Settlement</option>
                  <option value="CHEQUE">Corporate Account Payee Cheque</option>
                  <option value="UPI">Corporate UPI / Virtual Account</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Bank Transaction Reference (UTR / Cheque No.) *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. UTR-HDFC-99881234 or CHQ-041920"
                  value={paymentForm.payment_reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                  required
                  style={{ width: '100%', borderRadius: '10px', padding: '10px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  value={paymentForm.amount_paid_inr}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid_inr: e.target.value })}
                  required
                  style={{ width: '100%', borderRadius: '10px', padding: '10px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn-secondary"
                  style={{ padding: '9px 18px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="btn-primary"
                  style={{ padding: '9px 20px', borderRadius: '10px' }}
                >
                  {paymentSubmitting ? 'Recording...' : 'Reconcile & Mark Paid'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD CONTRACT PRICING CARD */}
      {/* ========================================================= */}
      {showPricingModal && createPortal(
        <div className="portal-modal-overlay" onClick={() => setShowPricingModal(false)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '28px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Add Contract Pricing Card
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Configure client contracted mobility tariffs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPricingModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreatePricingCard} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Corporate Client *
                </label>
                <select
                  className="select-field"
                  value={pricingForm.client}
                  onChange={(e) => setPricingForm({ ...pricingForm, client: e.target.value })}
                  required
                  style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Service Type *
                  </label>
                  <select
                    className="select-field"
                    value={pricingForm.service_type}
                    onChange={(e) => setPricingForm({ ...pricingForm, service_type: e.target.value })}
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  >
                    <option value="AIRPORT_TRANSFER">Airport Flight Transfer</option>
                    <option value="CORP_CHARTER">Executive Charter (8h/80km)</option>
                    <option value="EMPLOYEE_SHUTTLE">Employee Shuttle Roaster</option>
                    <option value="INTERCITY">Outstation Delegation</option>
                    <option value="POINT_TO_POINT">Point-to-Point City</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Vehicle Class *
                  </label>
                  <select
                    className="select-field"
                    value={pricingForm.vehicle_class}
                    onChange={(e) => setPricingForm({ ...pricingForm, vehicle_class: e.target.value })}
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  >
                    <option value="SEDAN">SEDAN (Dzire/Aura)</option>
                    <option value="PREMIUM_SEDAN">PREMIUM SEDAN (Ciaz/Camry)</option>
                    <option value="SUV">SUV (Innova Crysta)</option>
                    <option value="LUXURY_SUV">LUXURY SUV (Innova Hycross/Fortuner)</option>
                    <option value="EV">EV (Tigor/Nexon EV)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Base Fare (₹) *
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={pricingForm.base_rate_inr}
                    onChange={(e) => setPricingForm({ ...pricingForm, base_rate_inr: e.target.value })}
                    required
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Free KMs
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={pricingForm.included_km}
                    onChange={(e) => setPricingForm({ ...pricingForm, included_km: e.target.value })}
                    required
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Extra Rate (₹/km)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={pricingForm.extra_km_rate_inr}
                    onChange={(e) => setPricingForm({ ...pricingForm, extra_km_rate_inr: e.target.value })}
                    required
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Contract SLA Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP arrivals placard, packaged water, English speaking chauffeur"
                  className="input-field"
                  value={pricingForm.notes}
                  onChange={(e) => setPricingForm({ ...pricingForm, notes: e.target.value })}
                  style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowPricingModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pricingSubmitting}
                  className="btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '10px' }}
                >
                  {pricingSubmitting ? 'Saving...' : 'Save Rate Card'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL 5: AUTO-GENERATE CHAUFFEUR PAYOUTS */}
      {/* ========================================================= */}
      {showPayoutGenModal && createPortal(
        <div className="portal-modal-overlay" onClick={() => setShowPayoutGenModal(false)}>
          <div className="portal-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '28px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Calculate Chauffeur Payouts
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Aggregate completed trips & performance incentives
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutGenModal(false)}
                className="btn-secondary"
                style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleGeneratePayouts} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Period Start *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={payoutGenForm.period_start}
                    onChange={(e) => setPayoutGenForm({ ...payoutGenForm, period_start: e.target.value })}
                    required
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    Period End *
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={payoutGenForm.period_end}
                    onChange={(e) => setPayoutGenForm({ ...payoutGenForm, period_end: e.target.value })}
                    required
                    style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  Base Pay per Completed Trip (₹) *
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={payoutGenForm.base_pay_per_trip}
                  onChange={(e) => setPayoutGenForm({ ...payoutGenForm, base_pay_per_trip: e.target.value })}
                  required
                  style={{ width: '100%', borderRadius: '10px', padding: '9px' }}
                />
              </div>

              <div style={{ padding: '12px', background: 'rgba(248, 250, 252, 0.9)', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.78rem', color: '#475569' }}>
                Automates driver settlement calculations: multiplies base rate per trip, applies ₹500 high-performer tier bonus, and calculates total distance logged for every active driver.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowPayoutGenModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutGenSubmitting}
                  className="btn-primary"
                  style={{ padding: '8px 18px', borderRadius: '10px' }}
                >
                  {payoutGenSubmitting ? 'Calculating...' : 'Calculate & Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default BillingSettlements;
