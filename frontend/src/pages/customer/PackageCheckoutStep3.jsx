import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, ChevronRight, Calendar, Wallet, Crown, Gift } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function PackageCheckoutStep3({
  pkg,
  departureDate,
  returnDate,
  serverPriceData,
  paymentMode,
  setPaymentMode,
  walletBalance = 0,
  useWalletCashback = false,
  setUseWalletCashback = () => {},
  loyaltyInfo = null,
  isSubmitting = false,
  onBack,
  onCheckout
}) {
  if (!serverPriceData) return null;

  const rawTotal = serverPriceData.total_price;
  const customerTier = loyaltyInfo?.tier || loyaltyInfo?.current_tier || 'New Member';
  const isGold = customerTier === 'Gold';
  const isPlatinum = customerTier === 'Platinum';

  const isGoldEligible = isGold && rawTotal > 5000;
  const isPlatinumEligible = isPlatinum && rawTotal > 10000;

  let tierDiscount = 0;
  if (isGoldEligible) tierDiscount = 500;
  else if (isPlatinumEligible) tierDiscount = 1000;

  const total = Math.max(0, rawTotal - tierDiscount);
  const advancePercent = serverPriceData.advance_percentage || 25;
  const advance = Math.round((total * advancePercent) / 100);

  const maxWalletBenefit = Math.round(total * 0.10);
  const appliedWalletAmount = (useWalletCashback && walletBalance > 0) ? Math.min(walletBalance, maxWalletBenefit) : 0;
  const finalPayableTotal = Math.max(0, total - appliedWalletAmount);
  const finalPayableAdvance = Math.max(0, advance - appliedWalletAmount);
  const payableAmount = paymentMode === 'full' ? finalPayableTotal : finalPayableAdvance;
  const projectedCashback = Math.round(finalPayableTotal * 0.10);

  const handleCheckoutClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    onCheckout(e);
  };

  return (
    <div className="container py-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <button 
        type="button" 
        onClick={(e) => {
          if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
          }
          onBack(e);
        }} 
        className="btn btn-link text-dark text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 fw-bold"
      >
        <ArrowLeft size={18} /> Back to Traveller Details
      </button>

      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="mb-4">
            <h2 className="fw-extrabold text-dark mb-1">Review &amp; Pay</h2>
            <p className="text-muted small">You're almost there! Review your booking and choose a payment option.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-7">
               {/* Package Summary */}
               <div className="bg-white border rounded shadow-sm p-4 mb-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <CheckCircle2 size={18} className="text-success"/> Booking Summary
                  </h6>
                  <h5 className="fw-bold text-primary mb-1">{pkg.name}</h5>
                  <p className="text-muted small mb-2">{pkg.duration} • {pkg.destination || 'Goa'}</p>
                  
                  {(departureDate || returnDate) && (
                    <div className="d-flex align-items-center gap-1.5 small text-dark fw-bold mb-3 p-2 bg-light rounded border">
                      <Calendar size={14} className="text-danger" />
                      <span>Dates: {departureDate ? (formatDisplayDate ? formatDisplayDate(departureDate) : departureDate) : 'Flexible'} → {returnDate ? (formatDisplayDate ? formatDisplayDate(returnDate) : returnDate) : 'Flexible'}</span>
                    </div>
                  )}
                  
                  <div className="bg-light p-3 rounded small mb-3">
                     <span className="fw-bold d-block text-dark mb-1">Cancellation Policy:</span>
                     <span className="text-muted">{pkg.cancellation_policy || 'Strict: Non-refundable within 48 hours of travel.'}</span>
                  </div>

                  <div className="alert alert-success d-flex align-items-center gap-2 py-2 small mb-0">
                      <ShieldCheck size={16}/> Your booking is protected by TripGalileo Guarantee.
                  </div>
               </div>

               {/* Payment Options */}
               <div className="bg-white border rounded shadow-sm p-4">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                      <CreditCard size={18} className="text-primary"/> Select Payment Option
                  </h6>
                  
                  <div 
                    className={`border rounded p-3 mb-3 cursor-pointer transition-all ${paymentMode === 'full' ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                    onClick={() => setPaymentMode('full')}
                    style={{ cursor: 'pointer' }}
                  >
                     <div className="d-flex align-items-center gap-3">
                         <div className={`rounded-circle border d-flex align-items-center justify-content-center flex-shrink-0`} style={{width:'20px', height:'20px', borderColor: paymentMode === 'full' ? '#0d6efd' : '#ccc'}}>
                            {paymentMode === 'full' && <div className="bg-primary rounded-circle" style={{width:'10px', height:'10px'}}></div>}
                         </div>
                         <div className="flex-grow-1">
                             <div className="fw-bold d-flex justify-content-between">
                                 <span>Pay Full Amount</span>
                                 <span>₹{finalPayableTotal.toLocaleString('en-IN')}</span>
                             </div>
                             <div className="small text-muted mt-1">Pay the complete amount now and travel hassle-free.</div>
                         </div>
                     </div>
                  </div>

                  <div 
                    className={`border rounded p-3 cursor-pointer transition-all ${paymentMode === 'advance' ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                    onClick={() => setPaymentMode('advance')}
                    style={{ cursor: 'pointer' }}
                  >
                     <div className="d-flex align-items-center gap-3">
                         <div className={`rounded-circle border d-flex align-items-center justify-content-center flex-shrink-0`} style={{width:'20px', height:'20px', borderColor: paymentMode === 'advance' ? '#0d6efd' : '#ccc'}}>
                            {paymentMode === 'advance' && <div className="bg-primary rounded-circle" style={{width:'10px', height:'10px'}}></div>}
                         </div>
                         <div className="flex-grow-1">
                             <div className="fw-bold d-flex justify-content-between">
                                 <span>Pay To Hold ({advancePercent}%)</span>
                                 <span>₹{finalPayableAdvance.toLocaleString('en-IN')}</span>
                             </div>
                             <div className="small text-muted mt-1">Pay ₹{finalPayableAdvance.toLocaleString('en-IN')} now to confirm your booking. The remaining ₹{(total - advance).toLocaleString('en-IN')} must be paid before travel.</div>
                         </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="col-md-5">
               {/* Price Breakdown Sticky */}
               <div className="position-sticky" style={{top: '20px'}}>
                  <div className="bg-white border rounded shadow-sm p-4">
                     <h6 className="fw-bold mb-3 border-bottom pb-2">Price Breakdown</h6>
                     
                     <div className="d-flex justify-content-between mb-2 small">
                         <span className="text-muted">Total Package Cost</span>
                         <span className="fw-bold">₹{rawTotal.toLocaleString('en-IN')}</span>
                     </div>

                     {/* Loyalty Tier Recognition & Perks */}
                     {loyaltyInfo && customerTier !== 'New Member' && (
                       <div className="p-2 rounded-3 my-2 d-flex align-items-center justify-content-between" style={{
                         background: customerTier === 'Platinum' ? 'linear-gradient(135deg, #1e1b4b, #312e81)' :
                                     customerTier === 'Gold' ? 'linear-gradient(135deg, #78350f, #b45309)' :
                                     customerTier === 'Silver' ? 'linear-gradient(135deg, #334155, #475569)' :
                                     'linear-gradient(135deg, #7c2d12, #9a3412)',
                         color: '#fff',
                         fontSize: '12px'
                       }}>
                         <div className="d-flex align-items-center gap-1.5">
                           <Crown size={14} className="text-warning" />
                           <span className="fw-bold">{customerTier} Member</span>
                         </div>
                         {customerTier === 'Gold' && !isGoldEligible && (
                           <span className="badge bg-warning text-dark text-xxs">₹500 off on &gt;₹5k</span>
                         )}
                         {customerTier === 'Platinum' && !isPlatinumEligible && (
                           <span className="badge bg-light text-dark text-xxs">₹1,000 off on &gt;₹10k</span>
                         )}
                       </div>
                     )}

                     {isGoldEligible && (
                       <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e' }}>
                         🥇 <strong>Gold Privilege:</strong> -₹500 instant discount applied!
                       </div>
                     )}
                     {isPlatinumEligible && (
                       <div className="p-2 rounded-3 my-2 text-xs fw-semibold" style={{ background: '#f5f3ff', border: '1px solid #a855f7', color: '#581c87' }}>
                         💎 <strong>Platinum Privilege:</strong> -₹1,000 instant discount applied!
                       </div>
                     )}

                     {tierDiscount > 0 && (
                       <div className="d-flex justify-content-between mb-2 small text-warning fw-bold">
                         <span>Tier Privilege Discount</span>
                         <span>-₹{tierDiscount.toLocaleString('en-IN')}</span>
                       </div>
                     )}

                     {walletBalance > 0 && (
                       <div className="p-2.5 rounded-3 my-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                         <div className="d-flex align-items-center justify-content-between">
                           <div className="d-flex align-items-center gap-1.5">
                             <Wallet size={14} className="text-success" />
                             <div>
                               <div className="fw-bold text-dark text-xs">WOW GOA Wallet</div>
                               <div className="text-muted" style={{ fontSize: '10px' }}>Available: ₹{walletBalance.toLocaleString('en-IN')}</div>
                             </div>
                           </div>
                           <div className="form-check form-switch mb-0">
                             <input 
                               type="checkbox" 
                               className="form-check-input" 
                               id="usePkgWallet"
                               checked={useWalletCashback}
                               onChange={(e) => setUseWalletCashback(e.target.checked)}
                               style={{ cursor: 'pointer' }}
                             />
                             <label className="form-check-label text-xs fw-bold text-success" htmlFor="usePkgWallet">
                               Use ₹{Math.min(walletBalance, maxWalletBenefit).toLocaleString('en-IN')}
                             </label>
                           </div>
                         </div>
                       </div>
                     )}

                     {appliedWalletAmount > 0 && (
                       <div className="d-flex justify-content-between mb-2 small text-success fw-bold">
                         <span>Wallet Cashback Applied</span>
                         <span>-₹{appliedWalletAmount.toLocaleString('en-IN')}</span>
                       </div>
                     )}
                     
                     <hr className="my-3 text-muted"/>
                     
                     <div className="d-flex justify-content-between mb-3">
                         <span className="fw-bold fs-5 text-dark">Amount Payable</span>
                         <span className="fw-bold fs-5 text-primary">₹{payableAmount.toLocaleString('en-IN')}</span>
                     </div>

                     <button 
                        type="button" 
                        className="btn btn-primary w-100 py-3 rounded-pill fw-bold text-white shadow d-flex justify-content-between align-items-center px-4 mt-2" 
                        onClick={handleCheckoutClick}
                        disabled={isSubmitting}
                        style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', borderColor: '#FF6333', opacity: isSubmitting ? 0.75 : 1 }}
                      >
                          {isSubmitting ? (
                            <span className="d-flex align-items-center gap-2 w-100 justify-content-center">
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              <span>Processing Booking...</span>
                            </span>
                          ) : (
                            <>
                              <span>Confirm &amp; Pay ₹{payableAmount.toLocaleString('en-IN')}</span>
                              <ChevronRight size={18}/>
                            </>
                          )}
                      </button>

                     {/* 10% Cashback Earning Preview */}
                     <div className="mt-2.5 p-2 rounded-3 text-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                       <div className="text-xs fw-bold text-dark d-flex align-items-center justify-content-center gap-1">
                         <Gift size={13} className="text-warning" />
                         <span>10% Cashback You Will Earn: <strong className="text-success">₹{projectedCashback.toLocaleString('en-IN')}</strong></span>
                       </div>
                     </div>

                     <p className="text-center text-muted mt-3 mb-0" style={{fontSize: '11px'}}>By proceeding, you agree to our Terms &amp; Conditions.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
