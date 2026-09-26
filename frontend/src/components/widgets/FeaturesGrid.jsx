import React from 'react';
import { Shield, Clock, HeartHandshake, Map } from 'lucide-react';

export default function FeaturesGrid({ config }) {
  if (config && !config.visible) return null;

  const features = [
    { icon: <Shield size={32} />, title: 'Secure Bookings', desc: '100% secure payment processing with zero hidden fees' },
    { icon: <Clock size={32} />, title: '24/7 Support', desc: 'Round the clock customer assistance for peace of mind' },
    { icon: <HeartHandshake size={32} />, title: 'Trusted Partners', desc: 'Verified vendors for top-quality vehicles and hotels' },
    { icon: <Map size={32} />, title: 'Local Expertise', desc: 'Curated experiences by Goa travel experts' },
  ];

  return (
    <div 
      className="py-5 my-4 rounded-4 shadow-sm overflow-hidden" 
      style={{ 
        background: '#0D1B2E', 
        color: '#fff',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div className="container">
        <div className="section-header text-center mb-5">
          <div className="section-tagline text-warning fw-bold text-uppercase d-block mb-2" style={{ letterSpacing: '2px', fontSize: '0.85rem' }}>
            Our Guarantee
          </div>
          <h2 className="section-title fw-bold text-white" style={{ fontSize: '2rem' }}>
            {config?.heading || 'Why Choose Us?'}
          </h2>
          <p className="text-white-50 mt-3 mx-auto" style={{ maxWidth: '600px' }}>
            {config?.subtext || 'We deliver excellence across all our services'}
          </p>
        </div>

        <div className="row g-4">
          {features.map((f, i) => (
            <div key={i} className="col-md-6 col-lg-3">
              <div className="text-center p-4 rounded-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.3s' }}>
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '64px', height: '64px', background: 'rgba(255,99,51,0.1)', color: '#FF6333' }}>
                  {f.icon}
                </div>
                <h5 className="fw-bold mb-2">{f.title}</h5>
                <p className="text-white-50 mb-0" style={{ fontSize: '0.85rem' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
