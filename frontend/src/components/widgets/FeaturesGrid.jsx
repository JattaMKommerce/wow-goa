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
      className="py-5 my-4 rounded-4 shadow-lg overflow-hidden position-relative" 
      style={{ 
        background: 'linear-gradient(135deg, #0B192C 0%, #112239 100%)', 
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#FFFFFF',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div className="container">
        <div className="section-header text-center mb-5">
          <div 
            className="text-warning fw-bold text-uppercase d-inline-block px-3 py-1 rounded-pill mb-2" 
            style={{ 
              letterSpacing: '1.5px', 
              fontSize: '0.78rem',
              background: 'rgba(255, 179, 71, 0.12)',
              border: '1px solid rgba(255, 179, 71, 0.25)'
            }}
          >
            Our Guarantee
          </div>
          <h2 className="section-title fw-bold text-white mt-1 mb-2" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
            {config?.heading || 'Why Choose Us?'}
          </h2>
          <div className="mx-auto mb-3" style={{ width: '48px', height: '3px', background: '#FF6333', borderRadius: '2px' }}></div>
          <p className="mt-2 mx-auto" style={{ color: '#E2E8F0', maxWidth: '600px', fontSize: '0.98rem', lineHeight: '1.6' }}>
            {config?.subtext || 'We deliver excellence across all our services'}
          </p>
        </div>

        <div className="row g-4">
          {features.map((f, i) => (
            <div key={i} className="col-md-6 col-lg-3">
              <div 
                className="text-center p-4 rounded-4 h-100 d-flex flex-column align-items-center justify-content-start" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.12)', 
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 99, 51, 0.4)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <div 
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: 'rgba(255, 99, 51, 0.15)', 
                    color: '#FF6333',
                    border: '1px solid rgba(255, 99, 51, 0.25)'
                  }}
                >
                  {f.icon}
                </div>
                <h5 className="fw-bold mb-2 text-white" style={{ fontSize: '1.15rem', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                  {f.title}
                </h5>
                <p className="mb-0" style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: '1.55' }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
