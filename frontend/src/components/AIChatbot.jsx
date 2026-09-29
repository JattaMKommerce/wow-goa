import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Send, Mic, Volume2, VolumeX, Sparkles, AlertCircle,
  Compass, Hotel, Car, Users, Calendar, ArrowRight, CheckCircle2, ShieldCheck
} from 'lucide-react';
import chatbotAvatar from '../assets/aichatbot.webp';
import chatbotAnimationVideo from '../assets/chatbot-animation.mp4';
import { chatWithAI, createAiLead, updateAiLeadChat, getAIChatbotSettings } from '../services/api';

const aiMessages = [
  "Plan Your Goa Trip",
  "Need Help? Ask Luzia",
  "Let's Explore Goa",
  "Welcome to Goa! 🌴"
];

const CRAFT_SUGGESTIONS = [
  'Plan trip for 4 people',
  'I want an SUV',
  '5-star beach resort',
  'Include Scuba Diving'
];

const DEFAULT_SUGGESTIONS = [
  '🏨 Best Beach Resorts',
  '🚙 Rent a Thar / SUV',
  '🛵 Rent a Bike / Scooter',
  '🌴 4-Day Tour Packages',
  '🤿 Scuba & Water Sports',
  '🤖 Craft My Trip with AI'
];

export default function AIChatbot() {
  const [isChatbotEnabled, setIsChatbotEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [leadId, setLeadId] = useState(null);
  const [aiLeadId, setAiLeadId] = useState(null);
  const [activeContext, setActiveContext] = useState(null);
  const [activeProposal, setActiveProposal] = useState(null);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);
  const [chatMode, setChatMode] = useState('normal');

  const avatarVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const chatWindowRef = useRef(null);
  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus helper to ensure cursor is ALWAYS in the input box
  const focusInput = useCallback(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 60);
  }, []);

  // Clear stale session on fresh browser load so every page refresh is a clean new chatbot session
  useEffect(() => {
    try {
      sessionStorage.removeItem('tg_lead_submitted_session');
      sessionStorage.removeItem('tg_lead_id');
      sessionStorage.removeItem('tg_ai_lead_id');
      localStorage.removeItem('tg_customer_lead');
    } catch (e) { }
  }, []);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadError, setLeadError] = useState('');
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
  const pendingQueryRef = useRef('');

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);
  const lastSpokenMsgRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const isStartingMicRef = useRef(false);
  const pendingVoiceTranscriptRef = useRef(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  // Helper to verify if customer name and 10-digit phone have already been captured for this session
  const checkContactCollected = useCallback(() => {
    try {
      const sessionDone = sessionStorage.getItem('tg_lead_submitted_session') === 'true';
      const cleanP = (leadPhone || '').replace(/\D/g, '').slice(-10);
      if (sessionDone && leadName?.trim() && cleanP.length === 10) {
        return true;
      }
    } catch (e) { }
    return false;
  }, [leadName, leadPhone]);

  // Open chatbot window
  const handleOpenChat = useCallback((extraOptions = {}) => {
    setIsOpen(true);
    const isCraftMode = extraOptions?.mode === 'craft_my_trip';
    if (isCraftMode) {
      setChatMode('craft_my_trip');
      setActiveContext(prev => ({ ...(prev || {}), mode: 'craft_my_trip' }));
      if (!checkContactCollected()) {
        setShowLeadForm(true);
      }
      setMessages(prev => {
        if (prev.length === 0) {
          return [{
            role: 'assistant',
            content: "Olá! I’m **Luzia** 🌴 Let's craft your dream Goa trip together!\n\nAre you looking for accommodation, a self-drive vehicle, experiences, or a complete Goa holiday?"
          }];
        }
        return prev;
      });
    }
  }, [checkContactCollected]);

  // Listen to open_ai_chat event (including Craft My Trip mode)
  useEffect(() => {
    const handleOpenAIChat = (e) => {
      const isCraftMode = e?.detail?.mode === 'craft_my_trip';
      handleOpenChat(isCraftMode ? { mode: 'craft_my_trip' } : {});
    };
    window.addEventListener('open_ai_chat', handleOpenAIChat);
    return () => window.removeEventListener('open_ai_chat', handleOpenAIChat);
  }, [handleOpenChat]);

  // Global navigation helper & listener for Luzia chatbot buttons & links
  useEffect(() => {
    const handleSophiaNav = (e) => {
      const tab = e?.detail?.tab;
      const itemId = e?.detail?.itemId;
      const itemType = e?.detail?.itemType;
      const itemName = e?.detail?.itemName ? decodeURIComponent(e.detail.itemName) : '';
      const explicitUrl = e?.detail?.targetUrl;

      if (tab || explicitUrl) {
        // Close chatbot
        setIsOpen(false);

        const tabMap = {
          bikes: 'bikes',
          cars: 'cars',
          hotels: 'hotels',
          activities: 'activities',
          packages: 'packages',
          flights: 'flights',
          selfdrive: 'selfdrive',
          'self-drive': 'selfdrive',
          craft: 'craftmytrip',
          craftmytrip: 'craftmytrip',
          'custom-trip': 'custom-trip'
        };
        const resolvedTab = tabMap[tab] || tab || 'cars';
        const targetPath = '/' + (resolvedTab === 'craftmytrip' ? 'craft' : (resolvedTab === 'self-drive' ? 'selfdrive' : resolvedTab));
        const finalUrl = explicitUrl || (targetPath + (itemId ? `?id=${encodeURIComponent(itemId)}` : ''));

        const curPath = window.location.pathname.toLowerCase();
        const isPortal = curPath.startsWith('/superadmin') || curPath.startsWith('/super-admin') ||
                         curPath.startsWith('/admin') || curPath.startsWith('/vendor') ||
                         curPath.startsWith('/hotel-vendor') || curPath.startsWith('/flight-vendor') ||
                         curPath.startsWith('/subadmin') || curPath.startsWith('/sub-admin') ||
                         curPath.startsWith('/customer') || curPath.startsWith('/b2b') ||
                         curPath.startsWith('/driver') || curPath.startsWith('/portal');

        if (isPortal) {
          window.location.href = finalUrl;
          return;
        }

        // Fire navigation event to App.jsx to switch tab and open the requested item
        window.dispatchEvent(new CustomEvent('sophia_switch_tab', {
          detail: { tab: resolvedTab, itemId, itemType, itemName, targetUrl: finalUrl }
        }));

        try {
          window.history.pushState({}, '', finalUrl);
        } catch (_) {}
      }
    };

    window.sophiaNavigate = (tab, itemId, itemType, encodedName, targetUrl) => {
      let itemName = '';
      try { itemName = encodedName ? decodeURIComponent(encodedName) : ''; } catch (_) {}
      handleSophiaNav({ detail: { tab, itemId, itemType, itemName, targetUrl } });
    };

    window.addEventListener('sophia_nav', handleSophiaNav);
    return () => {
      window.removeEventListener('sophia_nav', handleSophiaNav);
      delete window.sophiaNavigate;
    };
  }, []);

  // Listen to sophia_send_msg event - fired when customer clicks in-chat action buttons like [Get Price for My Dates]
  useEffect(() => {
    const handleSophiaSendMsg = (e) => {
      const text = e?.detail?.text;
      if (text) {
        handleSendMessage(null, text);
      }
    };
    window.addEventListener('sophia_send_msg', handleSophiaSendMsg);
    return () => window.removeEventListener('sophia_send_msg', handleSophiaSendMsg);
  }, [messages, activeContext, isLoading]);

  // Sync AI Chatbot enabled state from database
  useEffect(() => {
    let isMounted = true;
    getAIChatbotSettings()
      .then(res => {
        if (isMounted && res && typeof res.ai_chatbot_enabled !== 'undefined') {
          setIsChatbotEnabled(Boolean(res.ai_chatbot_enabled));
        }
      })
      .catch(() => { });

    const handleToggleEvent = (e) => {
      if (e?.detail && typeof e.detail.enabled !== 'undefined') {
        setIsChatbotEnabled(Boolean(e.detail.enabled));
      }
    };
    window.addEventListener('ai_chatbot_toggled', handleToggleEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('ai_chatbot_toggled', handleToggleEvent);
    };
  }, []);

  // Load available browser voices for TTS
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) setAvailableVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Real-time canvas processing to strip black background into true transparency
  useEffect(() => {
    const video = avatarVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const renderCurrentFrame = () => {
      if (video.readyState >= 2) {
        if (video.videoWidth && canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;
        const l = data.length / 4;
        const cw = canvas.width;
        const ch = canvas.height;

        for (let i = 0; i < l; i++) {
          const idx = i * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const px = i % cw;
          const py = (i / cw) | 0;

          if (px < cw * 0.055 || px > cw * 0.93 || py < ch * 0.04 || (px > cw * 0.77 && py > ch * 0.64)) {
            data[idx + 3] = 0;
            continue;
          }

          const normX = px / cw;
          const normY = py / ch;
          const isEyeZone = (normY >= 0.20 && normY <= 0.42 && normX >= 0.43 && normX <= 0.59);

          if (isEyeZone) {
            data[idx + 3] = 255;
          } else {
            const maxChannel = Math.max(r, g, b);
            if (maxChannel < 28) {
              data[idx + 3] = 0;
            } else if (maxChannel < 45) {
              data[idx + 3] = Math.floor(((maxChannel - 28) / 17) * 255);
            }
          }
        }
        ctx.putImageData(frame, 0, 0);
      }
    };

    const drawFrame = () => {
      renderCurrentFrame();
      animId = requestAnimationFrame(drawFrame);
    };

    const handleImmediateRedraw = () => {
      renderCurrentFrame();
    };

    video.addEventListener('play', handleImmediateRedraw);
    video.addEventListener('seeking', handleImmediateRedraw);
    video.addEventListener('seeked', handleImmediateRedraw);
    video.addEventListener('timeupdate', handleImmediateRedraw);
    video.addEventListener('loadeddata', handleImmediateRedraw);

    video.play().catch(() => { });
    animId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animId);
      video.removeEventListener('play', handleImmediateRedraw);
      video.removeEventListener('seeking', handleImmediateRedraw);
      video.removeEventListener('seeked', handleImmediateRedraw);
      video.removeEventListener('timeupdate', handleImmediateRedraw);
      video.removeEventListener('loadeddata', handleImmediateRedraw);
    };
  }, []);

  // Cycling speech pill text every 4 seconds
  useEffect(() => {
    if (isOpen) return;
    const intervalId = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % aiMessages.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Scroll to bottom when messages or proposal change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, activeProposal]);

  // Initial welcome message if chat opened fresh
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Olá! I’m Luzia. Are you looking for accommodation, a self-drive vehicle, experiences, or a complete Goa holiday?"
      }]);
    }
  }, [isOpen]);

  // Auto-focus input whenever chat window opens and lead form is not showing
  useEffect(() => {
    if (isOpen && !showLeadForm) {
      focusInput();
    }
  }, [isOpen, showLeadForm, focusInput]);

  // Keep cursor focused automatically when response finishes loading
  useEffect(() => {
    if (!isLoading && isOpen && !showLeadForm) {
      focusInput();
    }
  }, [isLoading, isOpen, showLeadForm, focusInput]);

  // ─── SCROLL ISOLATION FOR CHATBOT ─────────────────────────────────────────
  // When user interacts or scrolls inside the chatbot, the website/background behind it must NOT scroll.
  useEffect(() => {
    const windowEl = chatWindowRef.current;
    if (!windowEl || !isOpen) return;

    // 1. Wheel Event Interceptor with passive: false
    const handleWheel = (e) => {
      const bodyEl = chatBodyRef.current;
      if (!bodyEl) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Check if wheel event target is inside horizontal suggestions bar
      const suggestionsEl = e.target.closest?.('.ai-chatbot-suggestions') || e.target.closest?.('.custom-scrollbar');
      if (suggestionsEl) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          // Horizontal scrolling inside suggestions chip track
          const { scrollLeft, scrollWidth, clientWidth } = suggestionsEl;
          const atLeft = scrollLeft <= 0 && e.deltaX < 0;
          const atRight = scrollLeft + clientWidth >= scrollWidth - 1 && e.deltaX > 0;
          if (atLeft || atRight) {
            e.preventDefault();
          }
        } else {
          // Vertical mousewheel over suggestions: forward scroll to message body and stop background page scroll
          e.preventDefault();
          bodyEl.scrollTop += e.deltaY;
        }
        e.stopPropagation();
        return;
      }

      // Check if wheel event originated inside the scrollable message body
      const isInsideBody = bodyEl.contains(e.target);
      if (isInsideBody) {
        const { scrollTop, scrollHeight, clientHeight } = bodyEl;
        const isScrollable = scrollHeight > clientHeight;

        if (!isScrollable) {
          // If messages don't overflow, prevent background page from scrolling
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        const delta = e.deltaY;
        const atTop = scrollTop <= 0 && delta < 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && delta > 0;

        if (atTop || atBottom) {
          // Boundary reached inside chat messages: prevent scroll chaining to underlying website
          e.preventDefault();
        }
        // Stop event from bubbling to parent document
        e.stopPropagation();
        return;
      }

      // Wheel event is over header, footer, lead form, or borders:
      // Completely prevent background page scrolling, and forward delta to messages body
      e.preventDefault();
      e.stopPropagation();
      bodyEl.scrollTop += e.deltaY;
    };

    // 2. Touch Event Interceptor for mobile & touchscreen devices
    let touchStartY = 0;
    let touchStartX = 0;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const bodyEl = chatBodyRef.current;
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = touchStartY - currentY;
      const deltaX = touchStartX - currentX;

      const suggestionsEl = e.target.closest?.('.ai-chatbot-suggestions') || e.target.closest?.('.custom-scrollbar');
      if (suggestionsEl && Math.abs(deltaX) > Math.abs(deltaY)) {
        const { scrollLeft, scrollWidth, clientWidth } = suggestionsEl;
        const atLeft = scrollLeft <= 0 && deltaX < 0;
        const atRight = scrollLeft + clientWidth >= scrollWidth - 1 && deltaX > 0;
        if (atLeft || atRight) {
          e.preventDefault();
        }
        return;
      }

      if (!bodyEl || !bodyEl.contains(e.target)) {
        // Dragging over header, footer, etc.: lock background
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = bodyEl;
      const isScrollable = scrollHeight > clientHeight;
      if (!isScrollable) {
        e.preventDefault();
        return;
      }

      const atTop = scrollTop <= 0 && deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && deltaY > 0;
      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    // 3. Keyboard scroll isolation (PageUp, PageDown, Arrows, Space)
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select';
      const bodyEl = chatBodyRef.current;
      if (!bodyEl) return;

      if (['PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'PageUp') bodyEl.scrollTop -= bodyEl.clientHeight * 0.8;
        if (e.key === 'PageDown') bodyEl.scrollTop += bodyEl.clientHeight * 0.8;
        if (e.key === 'Home') bodyEl.scrollTop = 0;
        if (e.key === 'End') bodyEl.scrollTop = bodyEl.scrollHeight;
        return;
      }

      if (!isInput && ['ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') bodyEl.scrollTop -= 40;
        if (e.key === 'ArrowDown') bodyEl.scrollTop += 40;
        if (e.key === ' ') bodyEl.scrollTop += 120;
      }
    };

    windowEl.addEventListener('wheel', handleWheel, { passive: false });
    windowEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    windowEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    windowEl.addEventListener('keydown', handleKeyDown);

    return () => {
      windowEl.removeEventListener('wheel', handleWheel);
      windowEl.removeEventListener('touchstart', handleTouchStart);
      windowEl.removeEventListener('touchmove', handleTouchMove);
      windowEl.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Tiered Natural Female Voice Selection
  const getBestFemaleEnglishVoice = (voices) => {
    if (!voices || voices.length === 0) return null;
    const isEnglish = (v) => (v.lang || '').toLowerCase().startsWith('en');
    const isIndian = (v) => (v.lang || '').toLowerCase().includes('in') || (v.name || '').toLowerCase().includes('india');
    const isFemale = (v) => {
      const n = (v.name || '').toLowerCase();
      if (/\b(male|david|mark|george|ravi|guy)\b/i.test(n)) return false;
      return /\b(female|heera|neerja|veena|aditi|priya|sonia|libby|jenny|samantha|victoria|karen|serena|zira|fiona|ava)\b/i.test(n);
    };

    const enVoices = voices.filter(isEnglish);
    const tier1 = enVoices.find(v => isIndian(v) && isFemale(v));
    if (tier1) return tier1;
    const tier2 = enVoices.find(isFemale);
    if (tier2) return tier2;
    return enVoices[0] || voices[0];
  };

  const cleanTextForSpeech = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/•/g, '')
      .replace(/[*_~`#]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const speakText = (rawText) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    const clean = cleanTextForSpeech(rawText);
    if (!clean) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(clean);
      activeUtteranceRef.current = utterance;
      utterance.lang = 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voicesToUse = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const best = getBestFemaleEnglishVoice(voicesToUse);
      if (best) utterance.voice = best;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  };

  // Speak latest assistant reply
  useEffect(() => {
    if (!isOpen || isMuted || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      speakText(lastMsg.content);
    }
  }, [messages, isOpen, isMuted]);

  // Cancel speech on close
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopListening();
    }
  }, [isOpen]);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      if (next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  // Voice Input (Speech-to-Text)
  const startListening = () => {
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. Please type your message.");
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    if (isStartingMicRef.current) return;

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setVoiceError(null);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
      recognitionRef.current = null;
    }

    try {
      isStartingMicRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isStartingMicRef.current = false;
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        isStartingMicRef.current = false;
        setIsListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          handleSendMessage(null, transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        isStartingMicRef.current = false;
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceError("Microphone access denied. Please check browser permissions.");
        } else if (event.error !== 'no-speech') {
          setVoiceError("Could not capture speech. Please try speaking again.");
        }
        setTimeout(() => setVoiceError(null), 4000);
      };

      recognition.onend = () => {
        isStartingMicRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      isStartingMicRef.current = false;
      setIsListening(false);
    }
  };

  const stopListening = () => {
    isStartingMicRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Resilient Client-Side Sync to IAMKRATU (Leads Force - Completely Invisible)
  const syncToKratuClient = useCallback((action, data = {}) => {
    try {
      const kratuUrl = 'https://iamkratu.ai/customer-chat/?key=00b78eecd5bb542952945c6e8c8560db';
      const form = new URLSearchParams();
      form.append('action', action);
      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined && val !== null) {
          form.append(key, String(val));
        }
      }
      fetch(kratuUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      }).catch(() => { });

      // Invisible iframe form dispatch to ensure lead lands in IAMKRATU without affecting UI
      let hiddenFrame = document.getElementById('kratu_bg_frame');
      if (!hiddenFrame) {
        hiddenFrame = document.createElement('iframe');
        hiddenFrame.id = 'kratu_bg_frame';
        hiddenFrame.name = 'kratu_bg_frame';
        hiddenFrame.style.display = 'none';
        hiddenFrame.style.width = '0px';
        hiddenFrame.style.height = '0px';
        hiddenFrame.style.border = 'none';
        document.body.appendChild(hiddenFrame);
      }

      const syncForm = document.createElement('form');
      syncForm.method = 'POST';
      syncForm.action = kratuUrl;
      syncForm.target = 'kratu_bg_frame';
      syncForm.style.display = 'none';

      const actInput = document.createElement('input');
      actInput.type = 'hidden';
      actInput.name = 'action';
      actInput.value = action;
      syncForm.appendChild(actInput);

      for (const [key, val] of Object.entries(data)) {
        if (val !== undefined && val !== null) {
          const inp = document.createElement('input');
          inp.type = 'hidden';
          inp.name = key;
          inp.value = String(val);
          syncForm.appendChild(inp);
        }
      }
      document.body.appendChild(syncForm);
      syncForm.submit();
      setTimeout(() => {
        try { syncForm.remove(); } catch (e) { }
      }, 2000);
    } catch (e) {
      // Non-blocking
    }
  }, []);

  // Lead Submission
  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadError('');
    const cleanName = (leadName || '').trim();
    let cleanPhone = (leadPhone || '').replace(/\D/g, '');
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

    if (!cleanName) {
      setLeadError('Please enter your name.');
      return;
    }
    if (!/^\d{10}$/.test(cleanPhone)) {
      setLeadError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const preTyped = pendingQueryRef.current || (input ? input.trim() : '');
    setLeadName(cleanName);
    setLeadPhone(cleanPhone);
    setShowLeadForm(false);
    setHasSubmittedLead(true);
    try {
      sessionStorage.setItem('tg_lead_submitted_session', 'true');
    } catch (e) { }

    let activeLId = null;
    let activeAiId = null;

    try {
      const res = await createAiLead(cleanName, cleanPhone, preTyped || 'Chat initiated via IAMKRATU AI');
      if (res && res.success) {
        activeLId = res.lead_id || res.id;
        activeAiId = res.id;
        if (activeLId) {
          setLeadId(activeLId);
          try { sessionStorage.setItem('tg_lead_id', activeLId); } catch (e) { }
        }
        if (activeAiId) {
          setAiLeadId(activeAiId);
          try { sessionStorage.setItem('tg_ai_lead_id', activeAiId); } catch (e) { }
        }
        window.dispatchEvent(new CustomEvent('realtime-lead-created', { detail: { lead_id: activeLId, ai_lead_id: activeAiId, name: cleanName, phone: cleanPhone } }));
        window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync', { detail: { type: 'lead', lead_id: activeLId } }));
      }
    } catch (err) {
      console.error('Lead submit failed:', err);
    }

    // Direct Browser Sync to IAMKRATU (reliable across local network / firewall blocks)
    const kratuSess = 'sess_' + (activeAiId || activeLId || ('lead_' + Date.now())).replace(/[^a-zA-Z0-9_]/g, '_');
    syncToKratuClient('save_lead', {
      name: cleanName,
      phone: cleanPhone,
      session_id: kratuSess
    });
    if (preTyped) {
      syncToKratuClient('send_chat', {
        message: preTyped,
        session_id: kratuSess,
        user_name: cleanName,
        user_phone: cleanPhone
      });
    }

    pendingQueryRef.current = '';
    setInput('');
    focusInput();
    if (preTyped) {
      handleSendMessage(null, preTyped, activeLId, activeAiId);
    } else {
      setMessages([{
        role: 'assistant',
        content: `Olá ${cleanName}! I’m **Luzia**. Are you looking for accommodation, a self-drive vehicle, experiences, or a complete Goa holiday?`
      }]);
    }
  };

  // Message Handler
  const handleSendMessage = async (e, directText = null, overrideLeadId = null, overrideAiLeadId = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = typeof directText === 'string' ? directText : input;
    if (!textToSend.trim() || isLoading) return;

    // Contact Collection Gate: Enforce minimal Name & Mobile collection before processing recommendations
    if (!checkContactCollected()) {
      pendingQueryRef.current = textToSend.trim();
      setShowLeadForm(true);
      return;
    }

    const effLeadId = overrideLeadId || leadId;
    const effAiLeadId = overrideAiLeadId || aiLeadId;

    // Direct Browser Sync message to IAMKRATU
    const kratuSess = 'sess_' + (effAiLeadId || effLeadId || 'lead_guest').replace(/[^a-zA-Z0-9_]/g, '_');
    syncToKratuClient('send_chat', {
      message: textToSend.trim(),
      session_id: kratuSess,
      user_name: leadName || 'Customer',
      user_phone: leadPhone || ''
    });

    stopListening();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    // Check if user clicked "Craft My Trip with AI 🤖" suggestion
    if (textToSend.includes('Craft My Trip with AI') || textToSend.toLowerCase().includes('craft my trip')) {
      setActiveContext(prev => ({ ...(prev || {}), mode: 'craft_my_trip' }));
    }

    // Direct booking / confirmation click from suggestion chip: "Book [Name] →" or "Confirm & Book →"
    if ((textToSend.startsWith('Book ') || textToSend.startsWith('Confirm & Book') || textToSend.startsWith('View ')) && textToSend.endsWith('→')) {
      const activeItId = activeContext?.booking_preview?.item_id || activeContext?.active_item_id;
      const activeItType = activeContext?.booking_preview?.item_type || activeContext?.active_item_type;
      const activeItName = activeContext?.booking_preview?.item_name || activeContext?.active_item_name;
      if (activeItId || activeItName) {
        const tab = activeItType === 'car' ? 'cars' : (activeItType === 'hotel' ? 'hotels' : (activeItType === 'activity' ? 'activities' : (activeItType === 'package' ? 'packages' : 'bikes')));
        const targetUrl = `/${tab}?id=${encodeURIComponent(activeItId || '')}`;
        if (typeof window !== 'undefined' && window.sophiaNavigate) {
          window.sophiaNavigate(tab, String(activeItId || ''), activeItType, activeItName, targetUrl);
        } else {
          setIsOpen(false);
          window.location.href = targetUrl;
        }
        return;
      }
    }

    // Detect service category switch (e.g. user was on hotel and now mentions vehicles/cars/bikes)
    const textLower = textToSend.toLowerCase();
    const curType = activeContext?.booking_preview?.item_type || activeContext?.active_item_type;
    const isSwitchingToVehicle = /\b(vehicles?|cars?|thars?|suvs?|bikes?|scooters?|activa|two\s*wheelers?)\b/i.test(textLower) && curType === 'hotel';
    const isSwitchingToHotel = /\b(hotels?|resorts?|stays?|rooms?|villas?)\b/i.test(textLower) && (curType === 'car' || curType === 'bike' || curType === 'vehicle');
    const isSwitchingToActivity = /\b(activities|sightseeing|scuba|watersports?|cruises?)\b/i.test(textLower) && curType && curType !== 'activity' && curType !== 'sightseeing';
    const isResettingCategory = /\b(other|another|different|change|switch)\s+(cars?|bikes?|hotels?|resorts?|vehicles?|stays?)\b/i.test(textLower);

    let effectiveContext = activeContext;
    if (isSwitchingToVehicle || isSwitchingToHotel || isSwitchingToActivity || isResettingCategory) {
      effectiveContext = {
        ...(activeContext || {}),
        active_item_id: null,
        active_item_name: null,
        booking_preview: null,
        active_item_type: null
      };
      setActiveContext(effectiveContext);
    }

    const userMsg = { role: 'user', content: textToSend.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let currentLeadId = effLeadId;
    let currentAiLeadId = effAiLeadId;
    const cleanP = (leadPhone || '').replace(/\D/g, '').slice(-10);

    // Auto-create lead in CRM if contact info exists but leadId is not yet assigned
    if (!currentLeadId && cleanP.length === 10) {
      try {
        const autoLeadRes = await createAiLead(leadName || 'Customer', cleanP, textToSend.trim());
        if (autoLeadRes && autoLeadRes.success) {
          currentLeadId = autoLeadRes.lead_id || autoLeadRes.id;
          currentAiLeadId = autoLeadRes.id;
          if (currentLeadId) {
            setLeadId(currentLeadId);
            try { sessionStorage.setItem('tg_lead_id', currentLeadId); } catch (e) { }
          }
          if (currentAiLeadId) {
            setAiLeadId(currentAiLeadId);
            try { sessionStorage.setItem('tg_ai_lead_id', currentAiLeadId); } catch (e) { }
          }
          window.dispatchEvent(new CustomEvent('realtime-lead-created', { detail: { lead_id: currentLeadId, ai_lead_id: currentAiLeadId } }));
          window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync', { detail: { type: 'lead', lead_id: currentLeadId } }));
        }
      } catch (e) { }
    }

    if (currentLeadId) {
      updateAiLeadChat(currentLeadId, newMessages, currentAiLeadId).catch(() => { });
    }

    try {
      const aiRes = await chatWithAI(newMessages, effectiveContext, {
        lead_id: currentLeadId,
        ai_lead_id: currentAiLeadId,
        customer_name: leadName || '',
        customer_phone: cleanP || ''
      });
      const replyText = typeof aiRes === 'string' ? aiRes : (aiRes?.reply || '');

      if (aiRes && aiRes.lead_id && !currentLeadId) {
        currentLeadId = aiRes.lead_id;
        setLeadId(aiRes.lead_id);
        try { sessionStorage.setItem('tg_lead_id', aiRes.lead_id); } catch (e) { }
      }
      if (aiRes && aiRes.ai_lead_id && !currentAiLeadId) {
        currentAiLeadId = aiRes.ai_lead_id;
        setAiLeadId(aiRes.ai_lead_id);
        try { sessionStorage.setItem('tg_ai_lead_id', aiRes.ai_lead_id); } catch (e) { }
      }

      if (aiRes && aiRes.context) {
        // Always preserve the last known craft_proposal in context so backend can rebuild it on next turn
        const incomingProposal = aiRes.craft_proposal || aiRes.context?.craft_proposal || activeContext?.craft_proposal;
        setActiveContext({ ...aiRes.context, craft_proposal: incomingProposal });
      }

      // Show review card only when backend returns a real proposal (after car/hotel/activity selection)
      // When browsing options (craft_proposal is null), hide the card to keep UI clean
      if (aiRes && aiRes.craft_proposal) {
        setActiveProposal(aiRes.craft_proposal);
      } else {
        setActiveProposal(null);
      }

      const updatedMessages = [...newMessages, { role: 'assistant', content: replyText }];
      setMessages(updatedMessages);

      if (currentLeadId) {
        updateAiLeadChat(currentLeadId, updatedMessages, currentAiLeadId).catch(() => { });
      }
      window.dispatchEvent(new CustomEvent('realtime-lead-created', { detail: { lead_id: currentLeadId, ai_lead_id: currentAiLeadId } }));
      window.dispatchEvent(new CustomEvent('tripgalileo-notification-sync', { detail: { type: 'lead', lead_id: currentLeadId } }));
    } catch (err) {
      const errorMessages = [...newMessages, {
        role: 'assistant',
        content: "I'm having trouble connecting to my system right now. Please try again in a moment!"
      }];
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  // ─── DRAFT HANDOFF: REVIEW TRIP IN BUILDER ─────────────────────────────────
  const handleReviewTripInBuilder = () => {
    if (!activeProposal) return;

    // Rule 9: Manual Draft Protection
    try {
      const existingDraftStr = sessionStorage.getItem('tg_craft_draft');
      if (existingDraftStr) {
        const d = JSON.parse(existingDraftStr);
        const hasExistingPlan = Boolean(d.selectedVehicle || d.selectedHotel || (d.selectedActivities && d.selectedActivities.length > 0) || d.selectedFlight);
        if (hasExistingPlan) {
          setShowConfirmReplace(true);
          return;
        }
      }
    } catch (e) { }

    executeDraftHandoff(activeProposal);
  };

  const executeDraftHandoff = (proposal) => {
    // Write validated proposal to sessionStorage.tg_craft_draft matching exact state contract
    const craftDraft = {
      step: 5,
      selectedVehicle: proposal.vehicle || null,
      memberCount: proposal.memberCount || 1,
      selectedHotel: proposal.hotel || null,
      selectedActivities: proposal.activities || [],
      withFlight: false,
      selectedFlight: null,
      pickupDate: proposal.pickup_date,
      dropDate: proposal.drop_date
    };

    try {
      sessionStorage.setItem('tg_craft_draft', JSON.stringify(craftDraft));
    } catch (e) { }

    // Dispatch craft_draft_updated event for instant Step 5 hydration
    window.dispatchEvent(new CustomEvent('craft_draft_updated', { detail: craftDraft }));

    setIsOpen(false);
    setShowConfirmReplace(false);

    // If on portal or not on /craft route, navigate smoothly
    const curP = window.location.pathname.toLowerCase();
    if (curP.startsWith('/superadmin') || curP.startsWith('/super-admin') || curP.startsWith('/admin') || curP.startsWith('/vendor') || curP.startsWith('/portal')) {
      window.location.href = '/craft';
    } else if (!curP.startsWith('/craft')) {
      window.history.pushState(null, '', '/craft');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleKeepCurrentTrip = () => {
    setShowConfirmReplace(false);
    setIsOpen(false);
    const curP = window.location.pathname.toLowerCase();
    if (curP.startsWith('/superadmin') || curP.startsWith('/super-admin') || curP.startsWith('/admin') || curP.startsWith('/vendor') || curP.startsWith('/portal')) {
      window.location.href = '/craft';
    } else if (!curP.startsWith('/craft')) {
      window.history.pushState(null, '', '/craft');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const isCraftModeActive = activeContext?.mode === 'craft_my_trip' || Boolean(activeProposal) || Boolean(activeContext?.craft_proposal);
  let suggestions = DEFAULT_SUGGESTIONS;
  if (isCraftModeActive) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    if (lastMsg.includes('category of car') || lastMsg.includes('available vehicles') || lastMsg.includes('Luxury Cars & Premium') || lastMsg.includes('SUVs & 4x4') || lastMsg.includes('7-Seater')) {
      // Browsing car categories - show category chips
      if (lastMsg.includes('Luxury Cars & Premium') || lastMsg.includes('DEFENDAR')) {
        suggestions = ['DEFENDAR', 'Toyota Fortuner'];
      } else if (lastMsg.includes('SUVs & 4x4') || lastMsg.includes('Mahindra Thar')) {
        suggestions = ['Mahindra Thar', 'Hyundai Creta'];
      } else if (lastMsg.includes('7-Seater') || lastMsg.includes('Ertiga')) {
        suggestions = ['Maruti Suzuki Ertiga'];
      } else {
        suggestions = ['💎 Luxury Cars', '🚙 SUVs / Thar', '🚐 7-Seater Ertiga', '🚗 Swift'];
      }
    } else if (lastMsg.includes('category of stay') || lastMsg.includes('star rating') || lastMsg.includes('5-Star Luxury') || lastMsg.includes('4-Star Beachfront') || lastMsg.includes('3-Star')) {
      // Browsing hotel star categories
      if (lastMsg.includes('5-Star Luxury') || lastMsg.includes('Taj Exotica')) {
        suggestions = ['Taj Exotica Resort & Spa'];
      } else if (lastMsg.includes('4-Star Beachfront') || lastMsg.includes('Candolim')) {
        suggestions = ['The Grand Candolim'];
      } else if (lastMsg.includes('3-Star') || lastMsg.includes('Casa Baga')) {
        suggestions = ['Casa Baga Boutique Resort'];
      } else {
        suggestions = ['5-Star Luxury', '4-Star Beachfront', '3-Star Budget'];
      }
    } else if (lastMsg.includes('experiences would you like') || lastMsg.includes('options by category') || lastMsg.includes('Water Sports') || lastMsg.includes('Heritage Tours')) {
      // Browsing activities
      suggestions = ['🤿 Scuba Diving', '🪂 Parasailing', '🏛️ Heritage Tour', '🏖️ North Goa Tour'];
    } else if (activeProposal) {
      // Proposal card is showing - offer modification options
      suggestions = ['Change the car', 'Change hotel', 'Change activities', 'Review My Trip'];
    } else if (activeContext?.craft_proposal) {
      // No card showing but we have a proposal in context (browsing mode) - keep modification chips
      suggestions = ['Change the car', 'Change hotel', 'Change activities'];
    } else {
      suggestions = CRAFT_SUGGESTIONS;
    }
  } else {
    // Normal mode: dynamic chips for active item
    if (activeContext?.booking_preview) {
      const itName = activeContext.booking_preview.item_name || activeContext.active_item_name || 'Now';
      suggestions = [`Book ${itName} →`, 'Change dates', 'Explore Hotels', 'Rent a Car', 'Rent a Bike'];
    } else if (activeContext?.active_item_name) {
      suggestions = [`Book ${activeContext.active_item_name} →`, 'Tomorrow for 3 days', 'This Weekend', 'Oct 25 to Oct 28'];
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]?.content || '';
      const lastMsgLower = lastMsg.toLowerCase();
      if (lastMsgLower.includes('dates') || lastMsgLower.includes('when are you planning') || lastMsgLower.includes('travel dates')) {
        suggestions = ['Tomorrow for 3 days', 'This Weekend', 'Oct 25 to Oct 28'];
      } else if (lastMsgLower.includes('vehicle') || lastMsgLower.includes('car or a bike')) {
        suggestions = ['Browse Cars', 'Browse Bikes', 'Mahindra Thar 4x4', 'Honda Activa 6G'];
      } else if (lastMsgLower.includes('hotel') || lastMsgLower.includes('resort') || lastMsgLower.includes('stay') || lastMsgLower.includes('room')) {
        suggestions = ['Casa Baga Boutique Resort', 'The Grand Candolim', 'Taj Exotica Resort', 'Tomorrow for 3 days', 'This Weekend'];
      } else if (lastMsgLower.includes('bike') || lastMsgLower.includes('scooter')) {
        suggestions = ['Royal Enfield Hunter 350', 'Honda Activa 6G', 'Royal Enfield Classic 350', 'Browse Bikes'];
      } else if (lastMsgLower.includes('car') || lastMsgLower.includes('thar') || lastMsgLower.includes('suv')) {
        suggestions = ['Mahindra Thar 4x4', 'Maruti Suzuki Ertiga', 'Hyundai Creta', 'Browse Cars'];
      } else if (lastMsgLower.includes('scuba') || lastMsgLower.includes('activity') || lastMsgLower.includes('watersport')) {
        suggestions = ['Scuba Diving Experience', 'Dudhsagar Waterfall Tour', 'Mandovi Sunset Cruise', 'Explore Activities'];
      }
    }
  }

  if (!isChatbotEnabled) return null;

  return (
    <>
      {/* ─── FLOATING AI ASSISTANT ROBOT TRIGGER ──────────────────────── */}
      <video
        ref={avatarVideoRef}
        src={chatbotAnimationVideo}
        id="ai-hidden-video"
        autoPlay
        loop
        muted
        playsInline
        style={{ display: 'none' }}
      />

      <div
        onClick={() => handleOpenChat()}
        role="button"
        tabIndex={0}
        aria-label="Open Luzia AI Assistant"
        className={`sophia-floating-trigger ai-floating-trigger ${isOpen ? 'is-hidden' : 'is-visible'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenChat();
          }
        }}
      >
        {/* Left Speech Bubble / Pill Badge */}
        <div className="sophia-speech-pill ai-speech-pill">
          <span className="sophia-status-dot ai-status-indicator" />
          <span
            className="sophia-speech-text"
            style={{
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '15px',
              opacity: fade ? 1 : 0,
              transition: 'opacity 0.35s ease-in-out',
              whiteSpace: 'nowrap'
            }}
          >
            {aiMessages[msgIndex]}
          </span>
        </div>

        {/* Floating Robot Avatar Wrapper with Centered Round Aura & Canvas */}
        <div className="sophia-avatar-wrapper ai-avatar-wrapper">
          <canvas
            ref={canvasRef}
            id="ai-avatar-canvas"
            width="1280"
            height="720"
          />
        </div>
      </div>

      <style>{`
        /* 1. Main Floating Trigger Container */
        .sophia-floating-trigger,
        .ai-floating-trigger {
          position: fixed;
          bottom: 12px;
          right: -6px;
          z-index: 1045;
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          background: transparent !important;
          -webkit-tap-highlight-color: transparent;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        }
        .sophia-floating-trigger.is-hidden,
        .ai-floating-trigger.is-hidden {
          transform: scale(0);
          opacity: 0;
          pointer-events: none;
        }
        .sophia-floating-trigger.is-visible,
        .ai-floating-trigger.is-visible {
          transform: scale(1);
          opacity: 1;
          pointer-events: auto;
        }
        .sophia-floating-trigger:hover,
        .ai-floating-trigger:hover {
          transform: scale(1.03);
        }
        .sophia-floating-trigger:active,
        .ai-floating-trigger:active {
          transform: scale(0.97);
        }

        /* 2. Overlapping Speech Pill Badge */
        .sophia-speech-pill,
        .ai-speech-pill {
          position: relative;
          z-index: 1;
          margin-right: -32px;
          padding: 11px 24px;
          background: #ffffff;
          border: 1.5px solid rgba(0, 168, 255, 0.25);
          box-shadow: 0 10px 25px rgba(0, 140, 255, 0.12), 0 4px 6px rgba(0, 0, 0, 0.03);
          border-radius: 9999px;
          color: #0f172a !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 15.5px;
          font-weight: 700;
          letter-spacing: -0.2px;
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          transition: all 0.3s ease;
          animation: sophiaPillFloat 3.8s ease-in-out infinite;
        }
        @keyframes sophiaPillFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .sophia-speech-text {
          color: #0f172a !important;
          font-weight: 700 !important;
          font-size: 15.5px !important;
          letter-spacing: -0.2px;
        }
        .sophia-floating-trigger:hover .sophia-speech-pill,
        .ai-floating-trigger:hover .sophia-speech-pill {
          box-shadow: 0 14px 30px rgba(0, 140, 255, 0.2), 0 6px 10px rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 168, 255, 0.4);
        }

        /* 3. Glowing Green Status Indicator Dot */
        .sophia-status-dot,
        .ai-status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          animation: dot-pulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes dot-pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* 4. Large Avatar Container */
        .sophia-avatar-wrapper,
        .ai-avatar-wrapper {
          position: relative;
          z-index: 10;
          width: 210px;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible !important;
          background: transparent !important;
          border: none !important;
          animation: sophiaAntiGravityFloat 3.8s ease-in-out infinite;
        }
        @keyframes sophiaAntiGravityFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        /* Centered Blue Aura Glow behind character */
        .sophia-avatar-wrapper::before,
        .ai-avatar-wrapper::before {
          content: '';
          position: absolute;
          top: 52%;
          left: 51%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 195, 255, 0.45) 0%, rgba(0, 140, 255, 0.12) 55%, transparent 75%);
          filter: blur(22px);
          z-index: 0;
          pointer-events: none;
        }

        /* 5. Canvas Display Resolution */
        #ai-avatar-canvas {
          -webkit-mask-image: linear-gradient(to bottom, black 72%, rgba(0, 0, 0, 0.85) 86%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 72%, rgba(0, 0, 0, 0.85) 86%, transparent 100%);
          width: 210px;
          height: auto;
          z-index: 10;
          position: relative;
          pointer-events: none;
          display: block;
        }

        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @keyframes mic-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.15); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .listening-pulse {
          animation: mic-pulse 1.4s infinite;
        }

        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

        /* Chatbot Scroll Isolation & Smooth Touch */
        .ai-chatbot-window {
          overscroll-behavior: contain !important;
          overscroll-behavior-y: contain !important;
          touch-action: pan-y;
          isolation: isolate;
        }
        .ai-chatbot-body {
          overscroll-behavior: contain !important;
          overscroll-behavior-y: contain !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
        }
        .ai-chatbot-suggestions {
          overscroll-behavior-x: contain !important;
          overscroll-behavior-y: contain !important;
          touch-action: pan-x;
          -webkit-overflow-scrolling: touch;
        }

        /* Luzia Custom Input Styling & Subtle Focus States (Requirement 4) */
        .luzia-form-control {
          border: 1.5px solid #e2e8f0 !important;
          color: #1e293b !important;
          background-color: #ffffff !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .luzia-form-control:focus {
          border-color: #FF6B35 !important;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.18) !important;
          outline: none !important;
        }
        .luzia-input-group {
          border: 1.5px solid #e2e8f0;
          background-color: #ffffff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .luzia-input-group:focus-within {
          border-color: #FF6B35 !important;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.18) !important;
        }
        .luzia-input-group input:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .luzia-cta-btn {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .luzia-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(255, 107, 53, 0.35) !important;
        }
        .luzia-cta-btn:active {
          transform: translateY(0);
        }
        .luzia-hdr-btn:hover {
          background: rgba(255, 255, 255, 0.35) !important;
        }

        /* Desktop & Tablet Chatbot Window (min-width: 601px) */
        @media (min-width: 601px) {
          .ai-chatbot-window {
            width: 395px !important;
            max-width: calc(100vw - 32px) !important;
            height: min(605px, calc(100dvh - 36px), calc(100vh - 36px)) !important;
            max-height: calc(100dvh - 36px) !important;
            right: 24px !important;
            border-radius: 22px !important;
          }
          .ai-chatbot-window.is-open {
            bottom: 24px !important;
          }
        }

        /* Mobile Chatbot Window (max-width: 600px) */
        @media (max-width: 600px) {
          .ai-chatbot-window {
            bottom: -720px !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: min(620px, 92dvh, 92vh) !important;
            max-height: 94dvh !important;
            border-top-left-radius: 20px !important;
            border-top-right-radius: 20px !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          .ai-chatbot-window.is-open {
            bottom: 0 !important;
          }
          .sophia-floating-trigger,
          .ai-floating-trigger {
            bottom: 8px;
            right: -8px;
          }
          .sophia-speech-pill,
          .ai-speech-pill {
            font-size: 13px;
            padding: 8px 16px;
            margin-right: -22px;
          }
          .sophia-avatar-wrapper,
          .ai-avatar-wrapper {
            width: 145px;
          }
          #ai-avatar-canvas {
            width: 145px;
          }
          .sophia-avatar-wrapper::before,
          .ai-avatar-wrapper::before {
            width: 140px;
            height: 140px;
          }
        }
      `}</style>

      {/* ─── CHATBOT WINDOW ───────────────────────────────────────────── */}
      <div
        ref={chatWindowRef}
        className={`ai-chatbot-window position-fixed shadow-2xl rounded-4 overflow-hidden transition-all bg-white d-flex flex-column ${isOpen ? 'is-open' : 'is-closed'}`}
        style={{
          bottom: isOpen ? '24px' : '-660px',
          right: '24px',
          width: '395px',
          height: 'min(605px, calc(100dvh - 36px), calc(100vh - 36px))',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100dvh - 36px)',
          zIndex: 1050,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08)',
          borderRadius: '22px',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          isolation: 'isolate'
        }}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2.5"
          style={{
            background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)',
            color: 'white',
            borderTopLeftRadius: '22px',
            borderTopRightRadius: '22px',
            flexShrink: 0
          }}
        >
          <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0 }}>
            <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm overflow-hidden flex-shrink-0" style={{ width: '38px', height: '38px' }}>
              <img src={chatbotAvatar} alt="Luzia AI" style={{ width: '92%', height: '92%', objectFit: 'contain' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                <h6 className="mb-0 fw-bold text-white text-truncate" style={{ fontSize: '15px', lineHeight: '1.2' }}>Luzia</h6>
                <span className="badge bg-white text-dark rounded-pill px-2 py-0.5 shadow-xs" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2px' }}>AI Travel Expert</span>
              </div>
              <small style={{ opacity: 0.95, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', flexShrink: 0 }}></span>
                <span className="text-truncate">Online | WOW GOA Assistant</span>
              </small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-1.5 flex-shrink-0 ms-2">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Unmute Luzia's Voice" : "Mute Luzia's Voice"}
              aria-label={isMuted ? "Unmute Luzia's Voice" : "Mute Luzia's Voice"}
              className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center luzia-hdr-btn"
              style={{ width: '32px', height: '32px', background: isMuted ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)', color: 'white', border: 'none', backdropFilter: 'blur(4px)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
              className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center luzia-hdr-btn"
              style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', backdropFilter: 'blur(4px)', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── SINGLE SOPHIA: Native chat for all modes ─── */}
        <>
          {/* Chat Body */}
          <div
            ref={chatBodyRef}
            className="ai-chatbot-body flex-grow-1 p-3 overflow-auto"
            style={{
              background: '#f8fafc',
              position: 'relative',
              overscrollBehavior: 'contain',
              overscrollBehaviorY: 'contain',
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {showLeadForm ? (
              <div className="d-flex flex-column gap-3 w-100 py-1">
                {/* 1. Friendly Luzia Greeting Message Bubble */}
                <div className="d-flex align-items-start gap-2.5">
                  <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-xs flex-shrink-0 border" style={{ width: '34px', height: '34px', overflow: 'hidden' }}>
                    <img src={chatbotAvatar} alt="Luzia AI" style={{ width: '92%', height: '92%', objectFit: 'contain' }} />
                  </div>
                  <div
                    className="p-3 bg-white text-dark border rounded-4 shadow-xs"
                    style={{
                      borderBottomLeftRadius: '4px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      maxWidth: '88%',
                      color: '#1e293b'
                    }}
                  >
                    <div className="fw-semibold mb-1">Hi there! 👋</div>
                    <div>I'm <strong>Luzia</strong>, your AI Travel Expert.</div>
                    <div>Let's plan your perfect Goa trip! 🌴</div>
                  </div>
                </div>

                {/* 2. Lead Capture Form Card */}
                <div
                  className="bg-white p-3.5 rounded-4 shadow-sm w-100 border text-center"
                  style={{
                    borderColor: '#e2e8f0',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                    style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,159,28,0.18))' }}
                  >
                    <Sparkles size={20} style={{ color: '#FF6B35' }} />
                  </div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '15px' }}>Let's Plan Your Goa Trip! 🌴</h6>
                  <p className="text-muted mb-3" style={{ fontSize: '12px', lineHeight: '1.45' }}>
                    Enter your details to unlock instant live recommendations, dates &amp; booking access.
                  </p>

                  <form onSubmit={handleLeadSubmit}>
                    <div className="mb-2.5 text-start">
                      <label htmlFor="luzia-lead-name" className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '11.5px' }}>
                        Your Name
                      </label>
                      <input
                        id="luzia-lead-name"
                        type="text"
                        className="form-control luzia-form-control rounded-3 px-3"
                        placeholder="e.g. Rahul Sharma"
                        value={leadName}
                        onChange={e => { setLeadName(e.target.value); if (leadError) setLeadError(''); }}
                        style={{ height: '42px', fontSize: '13px' }}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="mb-3 text-start">
                      <label htmlFor="luzia-lead-phone" className="form-label text-secondary fw-semibold mb-1" style={{ fontSize: '11.5px' }}>
                        Mobile / WhatsApp Number
                      </label>
                      <div className="input-group luzia-input-group rounded-3 overflow-hidden" style={{ height: '42px' }}>
                        <span className="input-group-text bg-light text-muted border-0 fw-bold px-3" style={{ fontSize: '12.5px' }}>+91</span>
                        <input
                          id="luzia-lead-phone"
                          type="tel"
                          className="form-control border-0 shadow-none px-2.5"
                          placeholder="10-digit number"
                          maxLength={10}
                          value={leadPhone}
                          onChange={e => {
                            setLeadPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                            if (leadError) setLeadError('');
                          }}
                          style={{ fontSize: '13px', height: '100%' }}
                          required
                        />
                      </div>
                    </div>

                    {leadError && (
                      <div className="alert alert-danger py-1.5 px-2.5 mb-2.5 d-flex align-items-center gap-1.5 border-0 rounded-3 text-start" style={{ fontSize: '11.5px', background: '#fef2f2', color: '#b91c1c' }}>
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>{leadError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      id="btn-luzia-get-recommendations"
                      className="btn w-100 rounded-pill fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2 luzia-cta-btn"
                      style={{
                        height: '44px',
                        background: 'linear-gradient(135deg, #FF6B35 0%, #FF9F1C 100%)',
                        border: 'none',
                        fontSize: '13.5px',
                        boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Get Recommendations</span>
                      <ArrowRight size={16} />
                    </button>
                  </form>

                  <div className="mt-2.5 text-muted d-flex align-items-center justify-content-center gap-1.5" style={{ fontSize: '11px' }}>
                    <ShieldCheck size={13} className="text-muted" />
                    <span>Privacy guaranteed. Zero spam.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`d-flex flex-column ${msg.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                    <div
                      className={`p-3 rounded-4 shadow-xs ${msg.role === 'user' ? 'text-white' : 'bg-white text-dark border'}`}
                      style={{
                        maxWidth: '88%',
                        background: msg.role === 'user' ? '#0B192C' : 'white',
                        borderBottomRightRadius: msg.role === 'user' ? '4px' : '18px',
                        borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '18px',
                        fontSize: '13.5px',
                        lineHeight: '1.55',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: typeof msg.content === 'string'
                          ? msg.content
                            // Bold: **text** → <strong>text</strong>
                            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                            // Inline italic: *text* → <em>text</em>
                            .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
                            // Markdown links: [text](/path?id=...&type=...) → styled clickable buttons with item metadata
                            .replace(
                              /\[([^\]]+)\]\(\/(bikes|cars|hotels|activities|packages|flights|selfdrive|self-drive|craft|custom-trip)([^\)]*)\)/g,
                              (match, text, tab, query) => {
                                let itemId = '';
                                let itemType = '';
                                if (query) {
                                  const idM = query.match(/[?&]id=([^&]+)/);
                                  if (idM) itemId = idM[1];
                                  const typeM = query.match(/[?&]type=([^&]+)/);
                                  if (typeM) itemType = typeM[1];
                                }
                                if (!itemId && activeContext?.active_item_id) itemId = String(activeContext.active_item_id);
                                if (!itemType && activeContext?.active_item_type) itemType = String(activeContext.active_item_type);
                                const itemName = activeContext?.active_item_name || '';
                                const safeEncodedName = encodeURIComponent(itemName || '').replace(/'/g, '%27');
                                const targetUrl = `/${tab}${query || (itemId ? `?id=${encodeURIComponent(itemId)}` : '')}`;
                                return `<a href="${targetUrl}" onclick="window.sophiaNavigate('${tab}','${itemId}','${itemType}','${safeEncodedName}','${targetUrl}');return false;" style="display:inline-block;margin-top:6px;padding:7px 16px;background:linear-gradient(135deg,#FF6B35,#FF9F1C);color:#fff;border-radius:20px;text-decoration:none;font-weight:700;font-size:12.5px;box-shadow:0 3px 10px rgba(255,107,53,0.3);cursor:pointer;">${text}</a>`;
                              }
                            )
                            // Action link: [Get Price for My Dates](#get-price)
                            .replace(
                              /\[([^\]]+)\]\(#get-price\)/g,
                              (match, text) => {
                                return `<a href="#" onclick="window.dispatchEvent(new CustomEvent('sophia_send_msg',{detail:{text:'Get Price for My Dates'}}));return false;" style="display:inline-block;margin-top:6px;padding:7px 16px;background:#ffffff;color:#FF6B35;border:1.5px solid #FF6B35;border-radius:20px;text-decoration:none;font-weight:700;font-size:12.5px;cursor:pointer;transition:all 0.2s;">${text}</a>`;
                              }
                            )
                            // Generic internal markdown links [Text](/some-path) -> styled redirect button
                            .replace(
                              /\[([^\]]+)\]\((\/[^)]+)\)/g,
                              (match, text, url) => {
                                const cleanUrl = url.trim();
                                return `<a href="${cleanUrl}" onclick="window.location.href='${cleanUrl}';return false;" style="display:inline-block;margin-top:6px;padding:7px 16px;background:linear-gradient(135deg,#FF6B35,#FF9F1C);color:#fff;border-radius:20px;text-decoration:none;font-weight:700;font-size:12.5px;box-shadow:0 3px 10px rgba(255,107,53,0.3);cursor:pointer;">${text}</a>`;
                              }
                            )
                            // Generic external markdown links
                            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#FF6B35;font-weight:600;text-decoration:underline;">$1</a>')
                          : msg.content
                      }}
                    />
                  </div>
                ))}

                {/* ─── SOPHIA SINGLE-ITEM BOOKING SUMMARY CARD ──────────────── */}
                {activeContext?.booking_preview && !activeProposal && (
                  <div
                    className="card border-0 shadow-sm rounded-4 overflow-hidden my-2 align-self-stretch animate-fade-in"
                    style={{ background: '#ffffff', border: '1.5px solid #fed7aa', boxShadow: '0 8px 24px rgba(255, 107, 53, 0.12)' }}
                  >
                    <div className="p-3" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', color: 'white' }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <Sparkles size={18} />
                          <div>
                            <div className="fw-bold" style={{ fontSize: '14px' }}>Booking Summary</div>
                            <small style={{ color: '#fff7ed', fontSize: '11px' }}>
                              {activeContext.booking_preview.item_type === 'bike' ? 'Two-Wheeler Rental' : (activeContext.booking_preview.item_type === 'car' ? 'Self-Drive Car' : (activeContext.booking_preview.item_type === 'hotel' ? 'Hotel Stay' : 'Activity Experience'))}
                            </small>
                          </div>
                        </div>
                        <span className="badge bg-white text-dark fw-bold px-2 py-1 rounded-pill shadow-xs" style={{ fontSize: '11px' }}>
                          {activeContext.booking_preview.item_type === 'bike' || activeContext.booking_preview.item_type === 'car'
                            ? `${activeContext.booking_preview.days || 1} ${activeContext.booking_preview.days === 1 ? 'Rental Day' : 'Rental Days'}`
                            : (activeContext.booking_preview.duration || `${activeContext.booking_preview.days || 1} Days`)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3" style={{ fontSize: '12px', color: '#334155' }}>
                      {/* Item Name */}
                      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                        <span className="text-muted d-flex align-items-center gap-1.5">
                          {activeContext.booking_preview.item_type === 'bike' ? '🏍️ Bike:' : (activeContext.booking_preview.item_type === 'car' ? <><Car size={13} /> Vehicle:</> : (activeContext.booking_preview.item_type === 'hotel' ? <><Hotel size={13} /> Hotel:</> : <><Compass size={13} /> Activity:</>))}
                        </span>
                        <span className="text-dark fw-bold">{activeContext.booking_preview.item_name}</span>
                      </div>

                      {/* Dates */}
                      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                        <span className="text-muted d-flex align-items-center gap-1.5"><Calendar size={13} /> {activeContext.booking_preview.item_type === 'bike' || activeContext.booking_preview.item_type === 'car' ? 'Rental Dates:' : 'Dates:'}</span>
                        <span className="text-dark fw-semibold">{activeContext.booking_preview.travel_dates || `${activeContext.booking_preview.pickup_date} to ${activeContext.booking_preview.drop_date}`}</span>
                      </div>

                      {/* Estimated Total */}
                      <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-3" style={{ background: '#fff7ed', border: '1px dashed #fdba74' }}>
                        <div>
                          <span className="fw-semibold text-dark d-block" style={{ fontSize: '12px' }}>Total Amount:</span>
                          <small className="text-muted" style={{ fontSize: '10px' }}>Pay 25% token to reserve, rest on delivery</small>
                        </div>
                        <span className="fw-bold" style={{ fontSize: '16px', color: '#c2410c' }}>
                          ₹{Number(activeContext.booking_preview.estimated_total || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Confirm & Book Button */}
                      <button
                        type="button"
                        id="btn-confirm-and-book"
                        onClick={() => {
                          const bp = activeContext.booking_preview;
                          const tab = bp.item_type === 'bike' ? 'bikes' : (bp.item_type === 'car' ? 'cars' : (bp.item_type === 'hotel' ? 'hotels' : 'activities'));
                          const targetUrl = `/${tab}?id=${encodeURIComponent(bp.item_id || '')}`;
                          if (typeof window !== 'undefined' && window.sophiaNavigate) {
                            window.sophiaNavigate(tab, String(bp.item_id || ''), bp.item_type, bp.item_name, targetUrl);
                          } else {
                            setIsOpen(false);
                            window.location.href = targetUrl;
                          }
                        }}
                        className="btn w-100 fw-bold text-white shadow-sm py-2.5 rounded-pill d-flex align-items-center justify-content-center gap-2 hover-scale transition-all"
                        style={{
                          background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)',
                          border: 'none',
                          fontSize: '13px',
                          boxShadow: '0 4px 14px rgba(255, 107, 53, 0.35)',
                          cursor: 'pointer'
                        }}
                      >
                        <span>Confirm & Book {activeContext.booking_preview.item_name}</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── SOPHIA TRIP PROPOSAL CARD ──────────────────────────── */}
                {activeProposal && (
                  <div
                    className="card border-0 shadow-sm rounded-4 overflow-hidden my-2 align-self-stretch animate-fade-in"
                    style={{ background: '#ffffff', border: '1.5px solid #fed7aa', boxShadow: '0 8px 24px rgba(255, 107, 53, 0.12)' }}
                  >
                    <div className="p-3" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)', color: 'white' }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <Sparkles size={18} />
                          <div>
                            <div className="fw-bold" style={{ fontSize: '14px' }}>Sophia's Trip Proposal</div>
                            <small style={{ color: '#fff7ed', fontSize: '11px' }}>Custom Goa Vacation</small>
                          </div>
                        </div>
                        <span className="badge bg-white text-dark fw-bold px-2 py-1 rounded-pill shadow-xs" style={{ fontSize: '11px' }}>
                          {activeProposal.days || 3} Days
                        </span>
                      </div>
                    </div>

                    <div className="p-3" style={{ fontSize: '12px', color: '#334155' }}>
                      {/* Dates & Travellers */}
                      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                        <span className="text-muted d-flex align-items-center gap-1.5"><Calendar size={13} /> Dates:</span>
                        <span className="text-dark fw-semibold">{activeProposal.pickup_date} to {activeProposal.drop_date}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                        <span className="text-muted d-flex align-items-center gap-1.5"><Users size={13} /> Travellers:</span>
                        <span className="text-dark fw-semibold">{activeProposal.memberCount || 2} Adults</span>
                      </div>

                      {/* Vehicle */}
                      {activeProposal.vehicle && (
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                          <span className="text-muted d-flex align-items-center gap-1.5"><Car size={13} /> Vehicle:</span>
                          <div className="text-end">
                            <span className="text-dark fw-bold d-block">{activeProposal.vehicle.name}</span>
                            <small className="text-muted">{activeProposal.vehicle.seating ? `${activeProposal.vehicle.seating} • ` : ''}₹{Number(activeProposal.vehicle.price).toLocaleString('en-IN')}/day</small>
                          </div>
                        </div>
                      )}

                      {/* Hotel */}
                      {activeProposal.hotel && (
                        <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                          <span className="text-muted d-flex align-items-center gap-1.5"><Hotel size={13} /> Stay:</span>
                          <div className="text-end">
                            <span className="text-dark fw-bold d-block">{activeProposal.hotel.name}</span>
                            <small className="text-muted">{activeProposal.hotel.stars ? `${activeProposal.hotel.stars}★ • ` : ''}₹{Number(activeProposal.hotel.price).toLocaleString('en-IN')}/night</small>
                          </div>
                        </div>
                      )}

                      {/* Sightseeing & Activities */}
                      {activeProposal.activities && activeProposal.activities.length > 0 && (
                        <div className="pb-2 mb-2 border-bottom">
                          <span className="text-muted d-flex align-items-center gap-1.5 mb-1"><Compass size={13} /> Experiences ({activeProposal.activities.length}):</span>
                          <div className="d-flex flex-column gap-1 ps-2">
                            {activeProposal.activities.map((a, i) => (
                              <div key={i} className="d-flex align-items-center justify-content-between" style={{ fontSize: '11px' }}>
                                <span className="text-dark text-truncate" style={{ maxWidth: '210px' }}>• {a.title || a.name}</span>
                                <span className="text-muted">₹{Number(a.price).toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Estimated Preview */}
                      <div className="d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-3" style={{ background: '#fff7ed', border: '1px dashed #fdba74' }}>
                        <div>
                          <span className="fw-semibold text-dark d-block" style={{ fontSize: '12px' }}>Estimated Total:</span>
                          <small className="text-muted" style={{ fontSize: '10px' }}>Final pricing calculated with GST in builder</small>
                        </div>
                        <span className="fw-bold" style={{ fontSize: '16px', color: '#c2410c' }}>
                          ₹{Number(activeProposal.estimated_total || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Manual Draft Protection Confirmation Box */}
                      {showConfirmReplace ? (
                        <div className="p-2.5 rounded-3 mb-2 bg-light border">
                          <div className="d-flex align-items-center gap-1.5 text-warning mb-1">
                            <AlertCircle size={15} />
                            <strong className="text-dark" style={{ fontSize: '11.5px' }}>Trip Already in Progress</strong>
                          </div>
                          <p className="text-muted mb-2" style={{ fontSize: '11px' }}>
                            You already have a trip in progress in Craft My Trip. Do you want to replace it with Sophia's plan?
                          </p>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary flex-grow-1 rounded-pill py-1 fw-bold"
                              style={{ fontSize: '11px' }}
                              onClick={handleKeepCurrentTrip}
                            >
                              Keep Current Trip
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm text-white flex-grow-1 rounded-pill py-1 fw-bold"
                              style={{ background: '#059669', border: 'none', fontSize: '11px' }}
                              onClick={() => executeDraftHandoff(activeProposal)}
                            >
                              Replace With Sophia's
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id="btn-review-trip-in-builder"
                          onClick={handleReviewTripInBuilder}
                          className="btn w-100 fw-bold text-white shadow-sm py-2.5 rounded-pill d-flex align-items-center justify-content-center gap-2 hover-scale transition-all"
                          style={{
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            border: 'none',
                            fontSize: '13px',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                            cursor: 'pointer'
                          }}
                        >
                          <span>Review My Trip in Builder</span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="align-self-start p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-2" style={{ borderBottomLeftRadius: '4px' }}>
                    <div className="typing-dot bg-secondary rounded-circle" style={{ width: '6px', height: '6px', animation: 'typing 1.4s infinite ease-in-out both' }}></div>
                    <div className="typing-dot bg-secondary rounded-circle" style={{ width: '6px', height: '6px', animation: 'typing 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></div>
                    <div className="typing-dot bg-secondary rounded-circle" style={{ width: '6px', height: '6px', animation: 'typing 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {!showLeadForm && (
            <div className="p-3 bg-white border-top">
              {voiceError && (
                <div className="alert alert-warning py-1 px-2 mb-2 d-flex align-items-center gap-1.5 border-0 shadow-xs" style={{ fontSize: '11px', background: '#fffbeb', color: '#b45309' }}>
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{voiceError}</span>
                </div>
              )}
              {/* Suggestion Chips */}
              <div
                className="ai-chatbot-suggestions d-flex gap-2 overflow-auto pb-2 mb-2 custom-scrollbar"
                style={{
                  overscrollBehaviorX: 'contain',
                  overscrollBehaviorY: 'contain',
                  touchAction: 'pan-x',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      handleSendMessage(null, s);
                      focusInput();
                    }}
                    className="btn btn-sm rounded-pill fw-bold text-nowrap"
                    style={{ fontSize: '11.5px', border: '1px solid #FF6B35', color: '#FF6B35', background: 'transparent' }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Input form */}
              <form onSubmit={handleSendMessage} className="d-flex align-items-center gap-2 p-1 rounded-pill border" style={{ background: isListening ? '#fef2f2' : '#f1f5f9', borderColor: isListening ? '#ef4444' : '#e2e8f0', transition: 'all 0.25s' }}>
                <button
                  type="button"
                  onClick={startListening}
                  title={isListening ? "Listening... Click to stop" : "Speak to Luzia with your voice"}
                  className={`btn rounded-circle d-flex align-items-center justify-content-center p-0 ${isListening ? 'listening-pulse' : ''}`}
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    background: isListening ? '#ef4444' : 'transparent',
                    color: isListening ? 'white' : '#FF6B35',
                    border: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <Mic size={18} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control border-0 bg-transparent shadow-none px-2"
                  placeholder={isListening ? "Listening... Speak now 🎙️" : "Ask Luzia or craft your trip..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  readOnly={isLoading}
                  autoFocus
                  style={{ fontSize: '13px' }}
                />
                <button
                  id="ai-submit"
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="btn rounded-circle d-flex align-items-center justify-content-center p-0"
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    background: 'linear-gradient(135deg, #FF6B35, #FF9F1C)',
                    color: 'white',
                    border: 'none',
                    cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </>
      </div>
    </>
  );
}
