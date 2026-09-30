import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCw, Plus,
  CheckCircle, Clock, AlertTriangle, TrendingUp, Receipt, ShieldCheck,
  Search, Filter, ExternalLink, ArrowRight, Info, Zap
} from 'lucide-react';
import { fetchB2BWallet, rechargeB2BWallet } from '../../services/api';
import B2BModalPortal from '../../components/b2b/B2BModalPortal';

export default function B2BWalletTab({ partnerUser, onWalletUpdated }) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [filterFlow, setFilterFlow] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Recharge Modal State
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('50000');
  const [rechargeMethod, setRechargeMethod] = useState('UPI');
  const [referenceId, setReferenceId] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeMessage, setRechargeMessage] = useState({ type: '', text: '' });

  // Ref to prevent circular re-render loops from callback changes
  const onWalletUpdatedRef = useRef(onWalletUpdated);
  useEffect(() => {
    onWalletUpdatedRef.current = onWalletUpdated;
  }, [onWalletUpdated]);

  const loadWallet = useCallback(async (isSilent = false) => {
    if (!partnerUser?.id) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetchB2BWallet(partnerUser.id);
      if (res && res.success) {
        setWalletData(res);
        if (onWalletUpdatedRef.current && res.wallet_balance !== undefined) {
          onWalletUpdatedRef.current(res.wallet_balance);
        }
      }
    } catch (err) {
      console.warn('Failed to load wallet data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [partnerUser?.id]);

  useEffect(() => {
    loadWallet();
  }, [partnerUser?.id]);

  const handleQuickAddTestFunds = async () => {
    if (!partnerUser?.id) return;
    setRefreshing(true);
    try {
      const idempotencyKey = `quick_test_${partnerUser.id}_${Date.now()}`;
      const payload = {
        partner_id: partnerUser.id,
        b2b_partner_id: partnerUser.id,
        amount: 50000,
        payment_method: 'Admin Test Credit',
        payment_gateway_ref: `TEST-${Date.now().toString().slice(-6)}`,
        idempotency_key: idempotencyKey
      };
      const res = await rechargeB2BWallet(payload);
      if (res && res.success) {
        if (res.wallet_balance !== undefined) {
          setWalletData(prev => ({
            ...(prev || {}),
            wallet_balance: parseFloat(res.wallet_balance)
          }));
          if (onWalletUpdatedRef.current) {
            onWalletUpdatedRef.current(parseFloat(res.wallet_balance));
          }
        }
        await loadWallet(true);
      } else {
        alert(res?.error || 'Failed to add test funds. Please check server.');
      }
    } catch (err) {
      console.warn('Quick recharge error:', err);
      alert('Error adding test funds: ' + (err.message || 'Server error'));
    } finally {
      setRefreshing(false);
    }
  };

  const handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(rechargeAmount);
    if (!amountNum || amountNum <= 0) {
      setRechargeMessage({ type: 'danger', text: 'Please enter a valid recharge amount greater than ₹0.' });
      return;
    }

    setRechargeLoading(true);
    setRechargeMessage({ type: '', text: '' });

    const idempotencyKey = `rec_${partnerUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const payload = {
        partner_id: partnerUser.id,
        b2b_partner_id: partnerUser.id,
        amount: amountNum,
        payment_method: rechargeMethod,
        payment_gateway_ref: referenceId || `TXN-${Date.now().toString().slice(-6)}`,
        idempotency_key: idempotencyKey
      };

      const res = await rechargeB2BWallet(payload);
      if (res && res.success) {
        setRechargeMessage({ type: 'success', text: res.message || 'Wallet recharged successfully!' });
        setTimeout(() => {
          setIsRechargeModalOpen(false);
          setRechargeMessage({ type: '', text: '' });
          setReferenceId('');
          loadWallet(true);
        }, 1200);
      } else {
        setRechargeMessage({ type: 'danger', text: res?.error || 'Failed to process recharge. Please try again.' });
      }
    } catch (err) {
      setRechargeMessage({ type: 'danger', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setRechargeLoading(false);
    }
  };

  const balance = walletData ? walletData.wallet_balance : parseFloat(partnerUser?.wallet_balance || 0);
  const creditLimit = walletData ? walletData.credit_limit : parseFloat(partnerUser?.credit_limit || 0);
  const transactions = walletData?.transactions || [];
  const stats = walletData?.stats || { total_credited: 0, total_debited: 0, total_refunded: 0 };

  const filteredTransactions = transactions.filter(tx => {
    if (filterFlow !== 'ALL' && tx.flow_type !== filterFlow) return false;
    if (filterType !== 'ALL' && tx.transaction_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = tx.id?.toLowerCase().includes(q);
      const matchBooking = tx.booking_id?.toLowerCase().includes(q);
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchRef = tx.payment_gateway_ref?.toLowerCase().includes(q);
      return matchId || matchBooking || matchDesc || matchRef;
    }
    return true;
  });

  return (
    <div className="animate-fade-in pb-5">
      {/* Header Bar */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-dark text-warning text-xxs fw-bold px-2 py-0.5 rounded-pill">
              PREPAID FINANCIAL LEDGER
            </span>
            <span className="badge bg-success bg-opacity-10 text-success text-xxs fw-bold px-2 py-0.5 rounded-pill d-flex align-items-center gap-1">
              <ShieldCheck size={11} /> 100% Secure & Atomic
            </span>
          </div>
          <h4 className="fw-bold mb-1 font-heading text-dark">Agent Prepaid Wallet</h4>
          <p className="text-muted text-xs mb-0">
            Instant booking debit, verified gateway recharge, automated refund credits & audited transaction ledger.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={handleQuickAddTestFunds}
            disabled={refreshing}
            className="btn btn-sm btn-outline-warning text-dark rounded-pill px-3 d-flex align-items-center gap-1.5 text-xs fw-bold shadow-xs"
            title="Instant +₹50,000 Test Balance Top-up"
            style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
          >
            <Zap size={13} className="text-warning fill-warning" />
            <span>+₹50,000 Test Funds</span>
          </button>
          <button
            onClick={() => loadWallet(true)}
            disabled={refreshing}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1.5 text-xs fw-semibold"
            title="Refresh Wallet Balance & Transactions"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-warning' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setIsRechargeModalOpen(true)}
            className="btn btn-sm btn-warning text-dark rounded-pill px-3.5 py-1.5 d-flex align-items-center gap-1.5 text-xs fw-bold shadow-sm"
          >
            <Plus size={15} />
            <span>Add Funds</span>
          </button>
        </div>
      </div>

      {/* Primary Balance Cards */}
      <div className="row g-3 mb-4">
        {/* Main Available Balance Card */}
        <div className="col-12 col-md-6 col-lg-4">
          <div 
            className="card border-0 rounded-4 p-4 text-white shadow-sm position-relative overflow-hidden h-100"
            style={{ background: 'linear-gradient(135deg, #0D1B2E 0%, #162E4C 100%)' }}
          >
            <div className="position-absolute end-0 top-0 p-3 opacity-10">
              <Wallet size={100} />
            </div>
            <div className="position-relative z-1">
              <span className="text-white-50 text-xxs fw-bold text-uppercase tracking-wider d-block mb-1">
                Available Wallet Balance
              </span>
              <h2 className="fw-bold mb-2 font-heading text-warning">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <div className="d-flex align-items-center justify-content-between pt-2 border-top border-white border-opacity-10 text-xs">
                <span className="text-white-50">Agency:</span>
                <span className="fw-semibold text-white">{partnerUser?.company_name || partnerUser?.name}</span>
              </div>
              <div className="d-flex align-items-center justify-content-between pt-1 text-xs">
                <span className="text-white-50">Account Status:</span>
                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 text-3xs rounded-pill">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Limit / Purchasing Power */}
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card border-0 rounded-4 p-4 shadow-sm bg-white h-100 border">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted text-xxs fw-bold text-uppercase tracking-wider">
                Total Purchasing Power
              </span>
              <span className="p-2 rounded-3 bg-light text-primary">
                <CreditCard size={18} />
              </span>
            </div>
            <h3 className="fw-bold mb-2 font-heading text-dark">
              ₹{(balance + creditLimit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <div className="pt-2 border-top text-xs d-flex justify-content-between text-muted">
              <span>Prepaid Balance:</span>
              <strong className="text-dark">₹{balance.toLocaleString('en-IN')}</strong>
            </div>
            <div className="pt-1 text-xs d-flex justify-content-between text-muted">
              <span>Authorized Credit Limit:</span>
              <strong className="text-dark">₹{creditLimit.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Financial Flow Metrics */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 rounded-4 p-4 shadow-sm bg-white h-100 border d-flex flex-column justify-content-between">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted text-xxs fw-bold text-uppercase tracking-wider">
                Lifetime Account Activity
              </span>
              <span className="p-2 rounded-3 bg-light text-success">
                <TrendingUp size={18} />
              </span>
            </div>
            <div className="space-y-2">
              <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light text-xs mb-1.5">
                <span className="d-flex align-items-center gap-1.5 text-muted">
                  <ArrowUpRight size={14} className="text-success" /> Total Recharged
                </span>
                <strong className="text-success">+₹{(stats.total_credited || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light text-xs mb-1.5">
                <span className="d-flex align-items-center gap-1.5 text-muted">
                  <ArrowDownLeft size={14} className="text-danger" /> Total Bookings Spent
                </span>
                <strong className="text-danger">-₹{(stats.total_debited || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light text-xs">
                <span className="d-flex align-items-center gap-1.5 text-muted">
                  <Receipt size={14} className="text-primary" /> Total Refunded
                </span>
                <strong className="text-primary">+₹{(stats.total_refunded || 0).toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Section */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="p-4 border-bottom bg-light d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h6 className="fw-bold mb-1 text-dark text-xs text-uppercase tracking-wider font-heading d-flex align-items-center gap-2">
              <Receipt size={16} className="text-warning" /> Wallet Transaction Statement
            </h6>
            <p className="text-muted text-xxs mb-0">Complete audit trail of debits, credits, recharges, and refunds</p>
          </div>

          {/* Filters */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="position-relative">
              <Search size={13} className="position-absolute start-0 top-50 translate-middle-y ms-2.5 text-muted" />
              <input
                type="text"
                placeholder="Search Txn, Booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control form-control-sm ps-4 pe-2 py-1 text-xs rounded-pill"
                style={{ width: '190px' }}
              />
            </div>

            {/* Flow Filter */}
            <select
              value={filterFlow}
              onChange={(e) => setFilterFlow(e.target.value)}
              className="form-select form-select-sm text-xs rounded-pill py-1"
              style={{ width: '110px' }}
            >
              <option value="ALL">All Flows</option>
              <option value="CREDIT">Credits (+)</option>
              <option value="DEBIT">Debits (-)</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="form-select form-select-sm text-xs rounded-pill py-1"
              style={{ width: '130px' }}
            >
              <option value="ALL">All Types</option>
              <option value="RECHARGE">Recharges</option>
              <option value="BOOKING_DEBIT">Bookings</option>
              <option value="REFUND_CREDIT">Refunds</option>
              <option value="ADMIN_ADJUSTMENT">Adjustments</option>
            </select>
          </div>
        </div>

        {/* Statement Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-xs">
            <thead className="table-light text-xxs text-uppercase text-muted">
              <tr>
                <th className="ps-4">Date & Time</th>
                <th>Transaction ID / Ref</th>
                <th>Type & Flow</th>
                <th>Description</th>
                <th>Payment Method</th>
                <th className="text-end">Amount</th>
                <th className="text-end">Balance (Before → After)</th>
                <th className="text-center pe-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-warning me-2" />
                    Loading wallet statement...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <Receipt size={32} className="text-muted opacity-25 d-block mx-auto mb-2" />
                    <span>No wallet transactions match your filter criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isCredit = tx.flow_type === 'CREDIT';
                  return (
                    <tr key={tx.id}>
                      <td className="ps-4 text-nowrap text-muted">
                        <span className="d-block text-dark fw-semibold">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                        <span className="text-xxs">
                          {tx.created_at ? new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>
                      <td>
                        <strong className="text-dark d-block font-monospace text-xxs">{tx.id}</strong>
                        {tx.booking_id && (
                          <span className="badge bg-light text-dark text-3xs border">
                            Booking: {tx.booking_id}
                          </span>
                        )}
                        {tx.payment_gateway_ref && tx.payment_gateway_ref !== tx.booking_id && (
                          <span className="text-muted text-3xs d-block text-truncate" style={{ maxWidth: '140px' }}>
                            Ref: {tx.payment_gateway_ref}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isCredit ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} text-xxs fw-bold px-2 py-0.5 rounded-pill d-inline-flex align-items-center gap-1`}>
                          {isCredit ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                          {tx.transaction_type?.replace('_', ' ') || tx.flow_type}
                        </span>
                      </td>
                      <td className="text-dark" style={{ maxWidth: '240px' }}>
                        <span className="text-truncate d-block" title={tx.description}>
                          {tx.description || 'Prepaid Wallet Activity'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border text-3xs">
                          {tx.payment_method || 'Prepaid Wallet'}
                        </span>
                      </td>
                      <td className={`text-end fw-bold fs-6 ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : '-'}₹{parseFloat(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-end text-nowrap text-muted text-xxs">
                        <span>₹{parseFloat(tx.balance_before || 0).toLocaleString('en-IN')}</span>
                        <ArrowRight size={10} className="mx-1 text-muted opacity-50" />
                        <strong className="text-dark">₹{parseFloat(tx.balance_after || 0).toLocaleString('en-IN')}</strong>
                      </td>
                      <td className="text-center pe-4">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 text-3xs px-2 py-0.5 rounded-pill">
                          {tx.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instant Recharge Modal */}
      <B2BModalPortal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        ariaLabel="Recharge Agent Wallet Modal"
      >
        {isRechargeModalOpen && (
          <div className="modal-dialog modal-dialog-centered w-100 my-0" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-bottom py-3 px-4 bg-light">
                <div className="d-flex align-items-center gap-2">
                  <span className="p-2 rounded-3 bg-warning text-dark">
                    <Plus size={16} />
                  </span>
                  <div>
                    <h6 className="modal-title fw-bold text-dark font-heading text-sm mb-0">Recharge Agent Wallet</h6>
                    <p className="text-muted text-xxs mb-0">Direct instant wallet top-up for agency bookings</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsRechargeModalOpen(false)}
                />
              </div>

              <form onSubmit={handleRechargeSubmit}>
                <div className="modal-body p-4">
                  {rechargeMessage.text && (
                    <div className={`alert alert-${rechargeMessage.type} py-2 px-3 rounded-3 text-xs mb-3 d-flex align-items-center gap-2`}>
                      {rechargeMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                      <span>{rechargeMessage.text}</span>
                    </div>
                  )}

                  {/* Current Balance Banner */}
                  <div className="p-3 rounded-3 bg-light border mb-3.5 d-flex align-items-center justify-content-between">
                    <div>
                      <span className="text-muted text-xxs d-block">Current Available Balance</span>
                      <strong className="text-dark fs-6">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <span className="badge bg-warning text-dark text-xxs fw-bold px-2 py-1 rounded-pill">
                      Instant Credit
                    </span>
                  </div>

                  {/* Quick Amount Presets */}
                  <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1.5">
                    Select Quick Amount
                  </label>
                  <div className="row g-2 mb-3">
                    {['5000', '10000', '25000', '50000'].map(amt => (
                      <div key={amt} className="col-3">
                        <button
                          type="button"
                          onClick={() => setRechargeAmount(amt)}
                          className={`btn btn-sm w-100 py-2 rounded-3 text-xs fw-bold border ${
                            rechargeAmount === amt ? 'btn-dark text-warning border-dark shadow-xs' : 'btn-light text-dark'
                          }`}
                        >
                          ₹{parseInt(amt).toLocaleString('en-IN')}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="mb-3">
                    <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">
                      Or Enter Custom Amount (₹) *
                    </label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white fw-bold">₹</span>
                      <input
                        type="number"
                        min="500"
                        step="100"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="form-control form-control-sm text-sm fw-bold"
                        placeholder="e.g. 15000"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Gateway / Method */}
                  <div className="mb-3">
                    <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1.5">
                      Select Payment Gateway / Method
                    </label>
                    <div className="row g-2">
                      <div className="col-4">
                        <div 
                          onClick={() => setRechargeMethod('UPI')}
                          className={`p-2.5 rounded-3 border text-center cursor-pointer ${
                            rechargeMethod === 'UPI' ? 'border-primary bg-primary bg-opacity-10 text-primary fw-bold' : 'bg-white text-muted'
                          }`}
                        >
                          <span className="d-block text-xs">UPI Instant</span>
                          <span className="text-3xs text-muted">GPay / PhonePe</span>
                        </div>
                      </div>
                      <div className="col-4">
                        <div 
                          onClick={() => setRechargeMethod('Bank Transfer')}
                          className={`p-2.5 rounded-3 border text-center cursor-pointer ${
                            rechargeMethod === 'Bank Transfer' ? 'border-primary bg-primary bg-opacity-10 text-primary fw-bold' : 'bg-white text-muted'
                          }`}
                        >
                          <span className="d-block text-xs">Bank Transfer</span>
                          <span className="text-3xs text-muted">NEFT / RTGS</span>
                        </div>
                      </div>
                      <div className="col-4">
                        <div 
                          onClick={() => setRechargeMethod('Razorpay')}
                          className={`p-2.5 rounded-3 border text-center cursor-pointer ${
                            rechargeMethod === 'Razorpay' ? 'border-primary bg-primary bg-opacity-10 text-primary fw-bold' : 'bg-white text-muted'
                          }`}
                        >
                          <span className="d-block text-xs">Card / NetBanking</span>
                          <span className="text-3xs text-muted">Razorpay Gateway</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gateway Instructions Display */}
                  {rechargeMethod === 'UPI' && (
                    <div className="p-3 rounded-3 bg-light border mb-3 text-xs">
                      <strong className="d-block text-dark mb-1">UPI ID: tripgalileo@upi</strong>
                      <span className="text-muted text-xxs">Pay using any UPI App (Google Pay, PhonePe, Paytm). Enter UTR / Txn Reference below.</span>
                    </div>
                  )}

                  {rechargeMethod === 'Bank Transfer' && (
                    <div className="p-3 rounded-3 bg-light border mb-3 text-xs">
                      <strong className="d-block text-dark mb-0.5">Bank: HDFC Bank | Branch: Goa Main</strong>
                      <span className="text-muted text-xxs d-block">Account No: 1234567890 | IFSC: HDFC0001234</span>
                    </div>
                  )}

                  {/* UTR / Reference ID */}
                  <div className="mb-2">
                    <label className="form-label text-xxs fw-bold text-muted text-uppercase mb-1">
                      UTR / Payment Reference ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder="e.g. UTR12345678 or Txn Ref"
                      className="form-control form-control-sm"
                    />
                  </div>
                </div>

                <div className="modal-footer border-top py-2.5 px-4 bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-xs"
                    onClick={() => setIsRechargeModalOpen(false)}
                    disabled={rechargeLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rechargeLoading}
                    className="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-4 text-xs d-flex align-items-center gap-1.5 shadow-sm"
                  >
                    {rechargeLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        <span>Processing Top-Up...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Credit ₹{parseFloat(rechargeAmount || 0).toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </B2BModalPortal>
    </div>
  );
}
