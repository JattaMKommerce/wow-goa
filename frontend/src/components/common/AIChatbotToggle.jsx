import React, { useState, useEffect } from 'react';
import chatbotAvatar from '../../assets/luzia-avatar-icon.webp';
import { getAIChatbotSettings, toggleAIChatbot } from '../../services/api';
import { Sparkles, Bot } from 'lucide-react';

/**
 * AIChatbotToggle Component
 * 
 * Requirements:
 * 1. Layout: Avatar (circular 48-56px) | 2-line Text & Description | Toggle switch (ON/OFF)
 * 2. Full row is clickable area
 * 3. Two visual states:
 *    - OFF: Avatar grayed out/low opacity, toggle gray, text muted, light neutral bg
 *    - ON: Avatar full color/glowing, toggle green/active, dark/bright text, highlighted bg
 * 4. Styling: 16px padding all sides, 12px border radius, smooth 300ms transitions, subtle hover
 * 5. Instant optimistic visual feedback + async persistence to database
 */
export default function AIChatbotToggle({
  label = 'Enable AI Chatbot',
  description = 'Auto-create leads from inquiries',
  initialState = true,
  onChange = null,
  persistToDb = true,
  className = '',
  style = {}
}) {
  const [enabled, setEnabled] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Sync initial state from backend database on mount
  useEffect(() => {
    let isMounted = true;
    if (persistToDb) {
      getAIChatbotSettings()
        .then(res => {
          if (isMounted && res && typeof res.ai_chatbot_enabled !== 'undefined') {
            setEnabled(Boolean(res.ai_chatbot_enabled));
          }
        })
        .catch(err => {
          console.warn('Could not fetch AI chatbot settings from DB:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [persistToDb]);

  // Handle toggle action (full row click)
  const handleToggle = async (e) => {
    if (e) e.preventDefault();
    const nextState = !enabled;

    // 1. Instant optimistic visual feedback (zero delay)
    setEnabled(nextState);

    // 2. Notify parent callback if supplied
    if (typeof onChange === 'function') {
      onChange(nextState);
    }

    // 3. Dispatch global event for other components (e.g. Floating widget)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ai_chatbot_toggled', { detail: { enabled: nextState } })
      );
    }

    // 4. Save state to backend database asynchronously
    if (persistToDb) {
      setIsLoading(true);
      try {
        await toggleAIChatbot(nextState);
      } catch (err) {
        console.error('Failed to save AI chatbot status to database:', err);
        // Rollback state if server rejects the save
        setEnabled(!nextState);
        if (typeof onChange === 'function') {
          onChange(!nextState);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Keyboard accessibility (Space or Enter to toggle)
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      role="switch"
      aria-checked={enabled}
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`ai-chatbot-toggle-card d-flex align-items-center justify-content-between ${className}`}
      style={{
        padding: '10px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        // Dynamic visual states based on requirements
        background: enabled
          ? (isHovered ? 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)')
          : (isHovered ? '#f1f5f9' : '#f8fafc'),
        border: enabled
          ? '1.5px solid #86efac'
          : '1.5px solid #e2e8f0',
        boxShadow: enabled
          ? (isHovered ? '0 8px 24px rgba(16, 185, 129, 0.16)' : '0 4px 14px rgba(16, 185, 129, 0.08)')
          : (isHovered ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none'),
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        ...style
      }}
    >
      {/* ─── LEFT: AVATAR (CIRCULAR, 42px) ─── */}
      <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
        <div
          className="position-relative flex-shrink-0 rounded-circle d-flex align-items-center justify-content-center"
          style={{
            width: '42px',
            height: '42px',
            background: 'radial-gradient(circle at center, #ffffff 40%, #f1f5f9 100%)',
            borderRadius: '50%',
            overflow: 'hidden',
            transition: 'all 300ms ease',
            border: enabled ? '2.5px solid #10b981' : '2.5px solid #cbd5e1',
            boxShadow: enabled ? '0 0 14px rgba(16, 185, 129, 0.45)' : 'none',
            filter: enabled ? 'none' : 'grayscale(100%)',
            opacity: enabled ? 1 : 0.45
          }}
        >
          <img
            src={chatbotAvatar}
            alt="AI Chatbot"
            style={{
              width: '88%',
              height: '88%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.15))'
            }}
          />

          {/* Status Dot */}
          <span
            className="position-absolute rounded-circle"
            style={{
              width: '11px',
              height: '11px',
              bottom: '1px',
              right: '1px',
              border: '2px solid #ffffff',
              background: enabled ? '#10b981' : '#94a3b8',
              transition: 'background 300ms ease',
              boxShadow: enabled ? '0 0 6px #10b981' : 'none'
            }}
          />
        </div>

        {/* ─── MIDDLE: TEXT LABEL + DESCRIPTION (2 LINES) ─── */}
        <div className="d-flex flex-column" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span
              className="fw-bold text-truncate"
              style={{
                fontSize: '15px',
                letterSpacing: '-0.2px',
                color: enabled ? '#0f172a' : '#64748b',
                transition: 'color 300ms ease'
              }}
            >
              {label}
            </span>

            {/* Visual State Indicator Badge */}
            <span
              className="badge rounded-pill d-inline-flex align-items-center gap-1"
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '3px 8px',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                transition: 'all 300ms ease',
                background: enabled ? '#dcfce7' : '#e2e8f0',
                color: enabled ? '#15803d' : '#64748b',
                border: enabled ? '1px solid #bbf7d0' : '1px solid #cbd5e1'
              }}
            >
              {enabled ? (
                <>
                  <Sparkles size={10} style={{ color: '#16a34a' }} />
                  <span>Active</span>
                </>
              ) : (
                <span>Off</span>
              )}
            </span>
          </div>

          <span
            className="text-truncate mt-0.5"
            style={{
              fontSize: '12.5px',
              color: enabled ? '#475569' : '#94a3b8',
              transition: 'color 300ms ease',
              lineHeight: '1.35'
            }}
          >
            {description}
          </span>
        </div>
      </div>

      {/* ─── RIGHT: TOGGLE SWITCH (STANDARD ON/OFF) ─── */}
      <div
        className="ms-3 flex-shrink-0 d-flex align-items-center position-relative"
        style={{
          width: '48px',
          height: '26px',
          borderRadius: '9999px',
          background: enabled ? '#10b981' : '#cbd5e1',
          transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms ease',
          boxShadow: enabled ? '0 2px 8px rgba(16, 185, 129, 0.35)' : 'none'
        }}
      >
        <span
          className="rounded-circle d-block"
          style={{
            width: '20px',
            height: '20px',
            background: '#ffffff',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.25)',
            transform: enabled ? 'translateX(25px)' : 'translateX(3px)',
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
    </div>
  );
}
