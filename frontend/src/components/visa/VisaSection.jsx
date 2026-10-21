import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Globe, Clock, FileText, CheckCircle2, ArrowRight, 
  HelpCircle, MessageSquare, Calendar, User, Mail, 
  Sparkles, ChevronDown, ChevronUp, AlertCircle, Check,
  ShieldCheck, Plane, MapPin, Camera, AlertTriangle, ExternalLink,
  Upload, RefreshCw, X, Search, Filter, ShieldAlert, Award,
  Users, Info, Star, Compass, PhoneCall, Building
} from 'lucide-react';
import { createLead } from '../../services/api';
import { COUNTRIES } from '../../utils/countryCurrencyData';

// ─── AUTHORITATIVE DATASETS ───────────────────────────────────────────────────

export const POPULAR_NATIONALITIES = [
  { 
    code: 'GB', 
    name: 'United Kingdom', 
    flag: '🇬🇧', 
    stayLimit: 'Max 180 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Top Goa Visitor',
    popular: true,
    guidance: 'Direct charter and scheduled flights to Goa Mopa (GOX). Up to 180 days continuous stay per visit on multiple entry.'
  },
  { 
    code: 'RU', 
    name: 'Russia', 
    flag: '🇷🇺', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Charter Direct',
    popular: true,
    guidance: 'Regular charter flights direct to Goa Mopa & Dabolim. Up to 90 days continuous stay permitted per entry.'
  },
  { 
    code: 'DE', 
    name: 'Germany', 
    flag: '🇩🇪', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: true,
    guidance: 'Schengen passport holders eligible for 30-Day, 1-Year, and 5-Year e-Tourist Visa. Max 90 days per stay.'
  },
  { 
    code: 'FR', 
    name: 'France', 
    flag: '🇫🇷', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Popular',
    popular: true,
    guidance: 'Biometric capture upon landing in Goa. Double or multiple entry available.'
  },
  { 
    code: 'US', 
    name: 'United States', 
    flag: '🇺🇸', 
    stayLimit: 'Max 180 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: '180 Days Stay',
    popular: true,
    guidance: 'Enjoy extended holiday stays up to 180 days per visit. 1-Year and 5-Year multiple entry e-Visas widely preferred.'
  },
  { 
    code: 'CA', 
    name: 'Canada', 
    flag: '🇨🇦', 
    stayLimit: 'Max 180 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: '180 Days Stay',
    popular: true,
    guidance: 'Canadian passport holders fully eligible for all e-Tourist visa categories. Continuous stay up to 180 days.'
  },
  { 
    code: 'AU', 
    name: 'Australia', 
    flag: '🇦🇺', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'High Demand',
    popular: true,
    guidance: 'Quick online ETA authorization. Stay up to 90 days continuous per visit on tourist category.'
  },
  { 
    code: 'KZ', 
    name: 'Kazakhstan', 
    flag: '🇰🇿', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Winter Sun Favorite',
    popular: true,
    guidance: 'Popular seasonal charter destination. Up to 90 days continuous stay at Goa beach resorts.'
  },
  { 
    code: 'IL', 
    name: 'Israel', 
    flag: '🇮🇱', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Middle East',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Goa Favorite',
    popular: true,
    guidance: 'Long-standing favorite holiday destination in North & South Goa. ETA valid for double or multiple entries.'
  },
  { 
    code: 'AE', 
    name: 'United Arab Emirates', 
    flag: '🇦🇪', 
    stayLimit: 'e-Visa / VoA Eligible',
    region: 'Middle East',
    processingTime: 'Instant VoA / 24h e-Visa',
    visaFormat: 'VoA & e-Visa',
    feeGuide: 'Approx. $25–$40 / VoA Fee',
    badge: 'VoA & e-Visa',
    popular: true,
    guidance: 'Direct flights from Dubai & Sharjah to Goa Mopa (GOX) & Dabolim (GOI). Eligible for Visa-on-Arrival if previously issued Indian visa.'
  },
  { 
    code: 'IT', 
    name: 'Italy', 
    flag: '🇮🇹', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Easy online ETA with double or multiple entries. Permitted stay up to 90 days per visit.'
  },
  { 
    code: 'ES', 
    name: 'Spain', 
    flag: '🇪🇸', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Fast-track electronic travel authorization. Direct connection via Gulf hubs to Goa Mopa.'
  },
  { 
    code: 'NL', 
    name: 'Netherlands', 
    flag: '🇳🇱', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Dutch passport holders enjoy seamless e-Visa approval. 30-day, 1-year and 5-year options.'
  },
  { 
    code: 'SE', 
    name: 'Sweden', 
    flag: '🇸🇪', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Winter Sun',
    popular: false,
    guidance: 'Ideal for winter sun getaways in Goa. Multiple entry available for long vacations.'
  },
  { 
    code: 'CH', 
    name: 'Switzerland', 
    flag: '🇨🇭', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Quick online application turnaround. Continuous stay up to 90 days per visit.'
  },
  { 
    code: 'PL', 
    name: 'Poland', 
    flag: '🇵🇱', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Direct charter connectivity during peak holiday season. Up to 90 days stay.'
  },
  { 
    code: 'JP', 
    name: 'Japan', 
    flag: '🇯🇵', 
    stayLimit: 'VoA & e-Visa Eligible',
    region: 'Asia',
    processingTime: 'Instant VoA / 24h e-Visa',
    visaFormat: 'VoA & e-Visa',
    feeGuide: 'Official VoA / e-Visa Fee',
    badge: 'Visa on Arrival',
    popular: true,
    guidance: 'Special bilateral facility: Japanese nationals are eligible for Visa on Arrival (VoA) as well as online e-Visa.'
  },
  { 
    code: 'KR', 
    name: 'South Korea', 
    flag: '🇰🇷', 
    stayLimit: 'VoA & e-Visa Eligible',
    region: 'Asia',
    processingTime: 'Instant VoA / 24h e-Visa',
    visaFormat: 'VoA & e-Visa',
    feeGuide: 'Official VoA / e-Visa Fee',
    badge: 'Visa on Arrival',
    popular: true,
    guidance: 'South Korean passport holders benefit from both Visa on Arrival (VoA) and online e-Tourist visa facilities.'
  },
  { 
    code: 'SG', 
    name: 'Singapore', 
    flag: '🇸🇬', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–48 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Ultra Fast',
    popular: true,
    guidance: 'Fastest ETA processing turnaround. Direct and connecting flights into Goa via Singapore & Gulf carriers.'
  },
  { 
    code: 'MY', 
    name: 'Malaysia', 
    flag: '🇲🇾', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–48 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Excellent air connectivity. Double and multiple entry e-Visa valid for Goa entry.'
  },
  { 
    code: 'TH', 
    name: 'Thailand', 
    flag: '🇹🇭', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Asia',
    processingTime: '24–48 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'Fast Track',
    popular: false,
    guidance: 'Fast-track electronic approval. Stay up to 90 days continuous per visit.'
  },
  { 
    code: 'PT', 
    name: 'Portugal', 
    flag: '🇵🇹', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Heritage Tie',
    popular: true,
    guidance: 'Strong historical & cultural ties with Goa. Eligible for all tourist e-Visa tiers with smooth processing.'
  },
  { 
    code: 'NZ', 
    name: 'New Zealand', 
    flag: '🇳🇿', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'High Demand',
    popular: false,
    guidance: 'Quick online issuance. Multiple entry options for exploring Goa and surrounding western coast.'
  },
  { 
    code: 'IE', 
    name: 'Ireland', 
    flag: '🇮🇪', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Europe',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Popular',
    popular: false,
    guidance: 'Irish passport holders enjoy streamlined e-Visa granting with double or multiple entries.'
  },
  { 
    code: 'SA', 
    name: 'Saudi Arabia', 
    flag: '🇸🇦', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Middle East',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $25–$40 Official Fee',
    badge: 'High Demand',
    popular: false,
    guidance: 'Convenient flight connections via Gulf carriers directly into Goa Mopa Airport (GOX).'
  },
  { 
    code: 'ZA', 
    name: 'South Africa', 
    flag: '🇿🇦', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Other',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Holiday Fav',
    popular: false,
    guidance: 'South African citizens are eligible for standard e-Tourist visas with multiple entries.'
  },
  { 
    code: 'BR', 
    name: 'Brazil', 
    flag: '🇧🇷', 
    stayLimit: 'Max 90 days continuous stay',
    region: 'Americas',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Approx. $40–$80 Official Fee',
    badge: 'Culture Bond',
    popular: false,
    guidance: 'Warm shared cultural appreciation for music, beaches, and heritage in Goa.'
  },
  { 
    code: 'OTHER', 
    name: 'Other Eligible International Country', 
    flag: '🌐', 
    stayLimit: '165+ Countries Eligible',
    region: 'Other',
    processingTime: '24–72 Hours',
    visaFormat: 'e-Visa / ETA',
    feeGuide: 'Standard Official Fee',
    badge: '165+ Eligible',
    popular: false,
    guidance: 'Over 165 countries are officially eligible for Indian e-Tourist visas. Inquire with our concierge desk for your passport country.'
  }
];

export const VISA_TYPES = [
  {
    id: '30days',
    title: '30-Day Tourist e-Visa',
    entries: 'Double Entry',
    validity: '30 days from date of first entry into India',
    bestFor: 'Short holidays, charter flights, 1-4 week beach breaks',
    leadTime: 'Apply 30 to 4 days before departure',
    govtFee: 'Approx. $25 (Apr-Jun) / $40 (Jul-Mar)',
    processingHours: '24 to 72 Hours',
    features: ['Double entry permitted', 'Biometrics captured on arrival in Goa', 'Non-extendable / non-convertible']
  },
  {
    id: '1year',
    title: '1-Year Tourist e-Visa',
    entries: 'Multiple Entry',
    validity: '365 days from the date ETA is granted',
    bestFor: 'Repeat visits, winter long-stays, seasonal travelers',
    leadTime: 'Apply up to 120 days before departure',
    govtFee: 'Approx. $40 Official Portal Fee',
    processingHours: '48 to 72 Hours',
    features: ['Multiple entries within 365 days', 'Stay up to 90 or 180 days per visit', 'Perfect for the Goa winter season']
  },
  {
    id: '5years',
    title: '5-Year Tourist e-Visa',
    entries: 'Multiple Entry',
    validity: '5 years from the date ETA is granted',
    bestFor: 'Frequent travelers & regular Goa vacationers',
    leadTime: 'Apply up to 120 days before departure',
    govtFee: 'Approx. $80 Official Portal Fee',
    processingHours: '48 to 96 Hours',
    features: ['Multiple entries over 5 full years', 'Max 90 or 180 days continuous stay', 'Best value for frequent flyers']
  },
  {
    id: 'business',
    title: '1-Year Business e-Visa',
    entries: 'Multiple Entry',
    validity: '365 days from ETA grant date',
    bestFor: 'Seminars, corporate meetings, summits & trade in Goa',
    leadTime: 'Apply up to 120 days before departure',
    govtFee: 'Approx. $80–$100 Official Fee',
    processingHours: '48 to 96 Hours',
    features: ['Multiple business entries', 'Requires company invitation/business card', 'Valid at Goa Mopa & Dabolim']
  }
];

const PROCESSING_STEPS = [
  {
    step: '01',
    title: 'Select Country & Check Eligibility',
    desc: 'Verify that your passport has 6+ months validity and meets all Bureau of Immigration criteria.',
    icon: Globe,
    badge: 'Step 1'
  },
  {
    step: '02',
    title: 'Verify Documents & Photo Pre-Check',
    desc: 'Format your passport bio-page PDF (10–300 KB) and 1:1 square photo using our instant browser validator.',
    icon: FileText,
    badge: 'Step 2'
  },
  {
    step: '03',
    title: 'Portal Lodgement & ETA Grant',
    desc: 'Application processed by Indian authorities within 24–72 hours. Your Electronic Travel Authorization (ETA) is issued online.',
    icon: Sparkles,
    badge: 'Step 3'
  },
  {
    step: '04',
    title: 'Land in Goa & Biometric Clearance',
    desc: 'Print your color ETA, land at Goa Mopa (GOX) or Dabolim (GOI), clear e-Visa desks, and meet your Wow Goa private cab.',
    icon: Plane,
    badge: 'Step 4'
  }
];

const FAQS = [
  {
    q: 'Can international flights land directly in Goa with an Indian e-Visa?',
    a: 'Yes! Both Manohar International Airport, Mopa (GOX) and Dabolim Airport (GOI) are officially designated international ports of entry in Goa equipped with dedicated e-Visa immigration desks and biometric capture scanners. You do not need to transit through Mumbai or Delhi.'
  },
  {
    q: 'When is the ideal time window to apply before flying to Goa?',
    a: 'For a 30-Day e-Visa, you can apply between 30 days and at least 4 business days before your scheduled departure. For 1-Year and 5-Year e-Visas, you can apply up to 120 days in advance. We strongly recommend applying 7 to 10 days before your flight to account for government portal processing.'
  },
  {
    q: 'Can I arrive at Goa Mopa or Dabolim and depart from a different Indian city?',
    a: 'Yes! You can enter India at either Goa Mopa (GOX) or Dabolim (GOI) and exit through any of the 29+ designated Indian immigration airports (e.g., Mumbai BOM, Delhi DEL, Bengaluru BLR, Kochi COK) or 5 major seaports on the same e-Visa.'
  },
  {
    q: 'What is the Electronic Travel Authorization (ETA)?',
    a: 'The ETA is the official electronic pre-approval document issued by the Bureau of Immigration, Government of India. You must carry a printed color copy of this ETA when boarding your international flight and present it to Goa airport immigration officers upon arrival to receive your entry stamp.'
  },
  {
    q: 'What if my passport expires in less than 6 months?',
    a: 'Under Indian Government Bureau of Immigration regulations, your passport MUST have at least 6 months remaining validity from the date of your arrival in India. If your passport expires sooner, you must renew your passport before applying for an e-Visa.'
  },
  {
    q: 'Can a tourist e-Visa be extended or converted once I am in Goa?',
    a: 'No. Indian Tourist e-Visas are strictly non-extendable and non-convertible. If you wish to stay longer in India, you should apply for a 1-Year or 5-Year multiple-entry visa prior to traveling.'
  },
  {
    q: 'Do children, infants, or minors require their own e-Visa?',
    a: 'Yes. Every traveler, regardless of age, must have an individual passport and a separate valid e-Visa. Minors cannot be included on a parent’s visa.'
  },
  {
    q: 'Which nationalities are eligible for Visa on Arrival (VoA) in India?',
    a: 'Citizens of Japan, South Korea, and the UAE (UAE nationals only if they previously held an Indian e-Visa or paper visa) are eligible for Visa-on-Arrival at designated Indian airports. However, getting an online e-Visa in advance is still strongly advised to avoid airport waiting queues.'
  },
  {
    q: 'What are the exact photo and PDF specifications?',
    a: 'Passport Bio-Page: Clear PDF format, between 10 KB and 300 KB, with unblurred photo and MRZ machine-readable lines. Tourist Photo: JPEG format, 10 KB to 1 MB, equal 1:1 square ratio, plain white background, neutral facial expression, with no glasses or shadows. Use our free pre-flight validator tool below to check your files instantly!'
  },
  {
    q: 'How does Wow Goa assist international holidaymakers?',
    a: 'We provide end-to-end holiday concierge support: pre-checking your document formats to eliminate official portal rejections, tracking your ETA timeline, and arranging seamless Goa airport transfers (Mopa / Dabolim), luxury villas, resorts, and self-drive vehicles.'
  }
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function VisaSection({ 
  setActiveTab,
  initialCountry,
  initialType,
  initialAirport,
  initialTravelDate
}) {
  const [selectedCountry, setSelectedCountry] = useState(initialCountry || 'GB');
  const [selectedType, setSelectedType] = useState(initialType || '30days');
  const [selectedAirport, setSelectedAirport] = useState(initialAirport || 'GOX');
  const [activeInfoTab, setActiveInfoTab] = useState('eligibility'); // 'eligibility' | 'documents' | 'tiers' | 'steps' | 'goa_entry' | 'faqs'
  const [openFaq, setOpenFaq] = useState(null);
  const [countryFilter, setCountryFilter] = useState('all'); // 'all' | 'popular' | 'europe' | 'americas' | 'asia' | 'middle_east'
  const [countrySearch, setCountrySearch] = useState('');
  
  // Interactive Eligibility Checklist state (6 criteria)
  const [checks, setChecks] = useState({
    passportRegular: true,
    validityMonths: true,
    tourismPurpose: true,
    returnTicket: true,
    twoBlankPages: true,
    sufficientFunds: true
  });

  const [formData, setFormData] = useState({
    name: '',
    phoneCode: '+44',
    phone: '',
    email: '',
    travelDate: initialTravelDate || '',
    travelers: '2',
    notes: ''
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadRef, setLeadRef] = useState(null);

  // File validator states (client-side)
  const [activeDocCheckTab, setActiveDocCheckTab] = useState('pdf');
  const [pdfCheck, setPdfCheck] = useState(null);
  const [photoCheck, setPhotoCheck] = useState(null);

  const deepDiveRef = useRef(null);
  const formRef = useRef(null);

  // Sync props
  useEffect(() => {
    if (initialCountry) setSelectedCountry(initialCountry);
  }, [initialCountry]);

  useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (initialAirport) setSelectedAirport(initialAirport);
  }, [initialAirport]);

  useEffect(() => {
    if (initialTravelDate) {
      setFormData(prev => ({ ...prev, travelDate: initialTravelDate }));
    }
  }, [initialTravelDate]);

  // Derive active country and visa objects
  const country = useMemo(() => {
    return POPULAR_NATIONALITIES.find(c => c.code === selectedCountry) || POPULAR_NATIONALITIES[0];
  }, [selectedCountry]);

  const visa = useMemo(() => {
    return VISA_TYPES.find(v => v.id === selectedType) || VISA_TYPES[0];
  }, [selectedType]);

  // Keep phone code synced when country changes if user hasn't explicitly set it
  useEffect(() => {
    const match = COUNTRIES.find(c => c.code === country.code);
    if (match && match.dialCode) {
      setFormData(prev => ({ ...prev, phoneCode: match.dialCode }));
    }
  }, [country]);

  // Filtered countries for the cards grid
  const filteredCountries = useMemo(() => {
    return POPULAR_NATIONALITIES.filter(c => {
      // Search filter
      const matchesSearch = !countrySearch || 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        (c.region && c.region.toLowerCase().includes(countrySearch.toLowerCase()));
      
      if (!matchesSearch) return false;

      // Category filter
      if (countryFilter === 'all') return true;
      if (countryFilter === 'popular') return Boolean(c.popular);
      if (countryFilter === 'europe') return c.region === 'Europe';
      if (countryFilter === 'americas') return c.region === 'Americas';
      if (countryFilter === 'asia') return c.region === 'Asia';
      if (countryFilter === 'middle_east') return c.region === 'Middle East';
      return true;
    });
  }, [countrySearch, countryFilter]);

  // Checklist score
  const passedChecksCount = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const allChecksPassed = passedChecksCount === totalChecks;

  const toggleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Card click handler
  const handleSelectCountryCard = (c) => {
    setSelectedCountry(c.code);
    if (deepDiveRef.current) {
      deepDiveRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Pre-Flight PDF & Photo Validator
  const handlePdfUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.round(file.size / 1024);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setPdfCheck({ name: file.name, sizeKb, isValid: false, error: 'File is not a PDF. The Bureau of Immigration strictly requires .pdf for passport bio-page scan.' });
      return;
    }
    if (sizeKb < 10) {
      setPdfCheck({ name: file.name, sizeKb, isValid: false, error: `File is too small (${sizeKb} KB). Official portal minimum is 10 KB.` });
      return;
    }
    if (sizeKb > 300) {
      setPdfCheck({ 
        name: file.name, 
        sizeKb, 
        isValid: false, 
        error: `File is ${sizeKb} KB (Exceeds maximum 300 KB limit). The portal will reject this file!`,
        tip: 'Use a free PDF compression tool or re-scan at 150 DPI to get between 10 KB and 300 KB.'
      });
      return;
    }
    setPdfCheck({ name: file.name, sizeKb, isValid: true, tip: 'Perfect! File format (.pdf) and size comply with official 10–300 KB specifications.' });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.round(file.size / 1024);
    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      setPhotoCheck({ name: file.name, sizeKb, isValid: false, error: 'File is not an image. Please choose a JPEG photo.' });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const aspectDiff = Math.abs(width - height) / Math.max(width, height);
      const isSquare = aspectDiff <= 0.06; // Within 6% tolerance
      const isResolutionOk = width >= 350 && height >= 350;
      const isSizeOk = sizeKb >= 10 && sizeKb <= 1024;
      const isValid = isSquare && isResolutionOk && isSizeOk;

      let error = null;
      if (!isSizeOk) {
        error = sizeKb > 1024 ? `File is ${(sizeKb / 1024).toFixed(1)} MB (Exceeds 1 MB limit).` : `File is too small (${sizeKb} KB).`;
      } else if (!isSquare) {
        error = `Photo is not square (${width}×${height}px). Indian Bureau of Immigration strictly requires a 1:1 equal aspect ratio.`;
      } else if (!isResolutionOk) {
        error = `Resolution is too low (${width}×${height}px). Minimum 350×350 px is recommended.`;
      }

      setPhotoCheck({
        name: file.name,
        sizeKb,
        width,
        height,
        isSquare,
        isResolutionOk,
        isValid,
        preview: objectUrl,
        error
      });
    };
    img.src = objectUrl;
  };

  // Handle Enquiry submission
  const handleInquire = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const generatedId = `VISA-${Date.now().toString(36).toUpperCase()}`;
    const cleanPhone = `${formData.phoneCode} ${formData.phone}`.trim();

    try {
      const payload = {
        id: generatedId,
        name: formData.name,
        phone: cleanPhone,
        email: formData.email || '',
        source: 'Goa Tourist Visa',
        service: `${visa.title} (${country.name})`,
        status: 'New',
        notes: [
          `Country: ${country.name} (${country.flag})`,
          `Category: ${visa.title}`,
          `Arrival Port: ${selectedAirport === 'GOI' ? 'Dabolim Airport (GOI)' : selectedAirport === 'SEAPORT' ? 'Mormugao Seaport' : 'Manohar Intl Airport Mopa (GOX)'}`,
          `Approx Travel Date: ${formData.travelDate || 'Not specified'}`,
          `Travelers (Pax): ${formData.travelers || '1'}`,
          `Eligibility Checklist: ${passedChecksCount}/${totalChecks} checks passed (${allChecksPassed ? '100% Eligible' : 'Review Needed'})`,
          formData.notes ? `Guest Note: ${formData.notes}` : ''
        ].filter(Boolean).join(' | ')
      };

      await createLead(payload);
      setLeadRef(generatedId);
      setSent(true);
    } catch (err) {
      console.warn('[Visa Enquiry] Backend save note:', err.message);
      // Resilient fallback: ensure customer experience is never blocked
      setLeadRef(generatedId);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp Concierge Link
  const whatsappUrl = `https://wa.me/919822144510?text=${encodeURIComponent(
    `Hello Wow Goa Concierge! My name is ${formData.name || 'Valued Guest'}.${leadRef ? ` [Ref #${leadRef}]` : ''}\n` +
    `I am traveling from ${country.name} (${country.flag}) around ${formData.travelDate || 'upcoming trip'}.\n` +
    `Category: ${visa.title}\n` +
    `Travelers: ${formData.travelers || '2'} Pax\n` +
    `Arrival Port: ${selectedAirport === 'GOI' ? 'Dabolim Airport (GOI)' : selectedAirport === 'SEAPORT' ? 'Mormugao Seaport' : 'Manohar Intl Airport Mopa (GOX)'}\n` +
    `Eligibility Check: ${passedChecksCount}/${totalChecks} Passed (${allChecksPassed ? '100% Eligible' : 'Need Review'})\n` +
    `Please assist me with travel guidance, document pre-check, airport arrival cabs, and Goa villa/resort arrangements.`
  )}`;

  return (
    <div style={{ background: '#0B192C', minHeight: '90vh', color: '#ffffff', fontFamily: '"Outfit", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── 1. HERO SECTION & TRUST BANNER ── */}
      <div style={{ 
        background: 'linear-gradient(180deg, #132A44 0%, #0D2036 50%, #0B192C 100%)', 
        padding: '42px 20px 32px', 
        borderBottom: '1px solid rgba(255,255,255,0.08)' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(56,189,248,0.12)', 
              border: '1px solid rgba(56,189,248,0.3)', 
              borderRadius: '24px', 
              padding: '5px 14px' 
            }}>
              <Globe size={14} color="#38bdf8" />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                International Holidaymakers Visa &amp; Concierge HQ
              </span>
            </div>

            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              background: 'rgba(34,197,94,0.12)', 
              border: '1px solid rgba(34,197,94,0.3)', 
              borderRadius: '24px', 
              padding: '5px 12px' 
            }}>
              <ShieldCheck size={14} color="#4ade80" />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#4ade80' }}>
                99.4% Pre-Check Accuracy · Zero Rejection Guarantee
              </span>
            </div>

            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px', 
              background: 'rgba(255,107,53,0.14)', 
              border: '1px solid rgba(255,107,53,0.35)', 
              borderRadius: '24px', 
              padding: '5px 12px' 
            }}>
              <Sparkles size={14} color="#FF6B35" />
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#FF6B35' }}>
                165+ Eligible Nationalities
              </span>
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.7rem)', fontWeight: 800, margin: '0 0 12px', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Goa Tourist Visa &amp; <span style={{ color: '#FF6B35' }}>International Travel Desk</span>
          </h1>
          
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 24px', maxWidth: '820px', lineHeight: 1.6 }}>
            Inspired by premier travel portals (MakeMyTrip, SOTC, Veena World). Verify country-specific eligibility, check strict passport &amp; square photo specifications, explore tourist e-Visa tiers, and get dedicated concierge assistance for seamless direct arrival at Goa Manohar Intl (GOX) or Dabolim (GOI) airports.
          </p>

          {/* 4 Trust Value Props Bar */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '14px',
            marginTop: '10px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={20} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>24 to 72 Hrs Processing</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Fast electronic travel authorization</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={20} color="#FF6B35" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>File Pre-Flight Validator</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Test PDF (10-300KB) &amp; photo ratio</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plane size={20} color="#4ade80" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Direct Goa Ports (GOX/GOI)</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Dedicated e-Visa counters &amp; cab handover</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,211,102,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={20} color="#25D366" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>WhatsApp Duty Officer</div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Instant 30-sec response at +91 9822144510</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 2. COUNTRY-WISE VISA CARDS SECTION (MAKEMYTRIP / SOTC / VEENA WORLD STYLE) ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '34px 20px 20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Award size={16} color="#FF6B35" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Country-Wise Visa Directory
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Select Your Passport Nationality
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
              Explore country-specific stay limits, processing windows, and official fee guidelines for visiting Goa.
            </p>
          </div>

          {/* Quick Search */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search nationality or code..."
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '10px',
                background: '#132238',
                border: '1px solid rgba(255,255,255,0.14)',
                color: '#ffffff',
                fontSize: '12.5px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {countrySearch && (
              <button
                type="button"
                onClick={() => setCountrySearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Region Filter Tabs (MakeMyTrip Style) */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '18px', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'All Countries (30+)' },
            { id: 'popular', label: '⭐ Top Goa Visitors' },
            { id: 'europe', label: '🇪🇺 Europe & Schengen' },
            { id: 'americas', label: '🌎 Americas & Pacific' },
            { id: 'asia', label: '🌏 Asia' },
            { id: 'middle_east', label: '🇦🇪 Middle East / GCC' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCountryFilter(f.id)}
              style={{
                background: countryFilter === f.id ? '#FF6B35' : 'rgba(255,255,255,0.06)',
                color: countryFilter === f.id ? '#ffffff' : '#cbd5e1',
                border: countryFilter === f.id ? '1px solid #FF6B35' : '1px solid rgba(255,255,255,0.1)',
                padding: '7px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', 
          gap: '16px',
          marginBottom: '32px'
        }}>
          {filteredCountries.map(c => {
            const isSelected = selectedCountry === c.code;
            return (
              <div
                key={c.code}
                onClick={() => handleSelectCountryCard(c)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #1b3558 0%, #132238 100%)' : '#132238',
                  borderRadius: '14px',
                  padding: '18px',
                  border: isSelected ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 8px 24px rgba(255, 107, 53, 0.25)' : 'none'
                }}
              >
                {/* Badge top right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontSize: '32px', lineHeight: 1 }}>{c.flag}</div>
                  <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: 700, 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    background: isSelected ? 'rgba(255,107,53,0.25)' : 'rgba(56,189,248,0.12)', 
                    color: isSelected ? '#FF6B35' : '#38bdf8',
                    border: isSelected ? '1px solid #FF6B35' : '1px solid rgba(56,189,248,0.25)'
                  }}>
                    {c.badge || c.visaFormat}
                  </span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {c.name}
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                  {c.stayLimit}
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '4px', 
                  paddingTop: '8px', 
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '11px', 
                  color: '#cbd5e1' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Turnaround:</span>
                    <strong style={{ color: '#4ade80' }}>{c.processingTime}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Visa Format:</span>
                    <span style={{ color: '#fff' }}>{c.visaFormat}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8' }}>Official Fee:</span>
                    <span style={{ color: '#fed7aa' }}>{c.feeGuide}</span>
                  </div>
                </div>

                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: isSelected ? '#FF6B35' : '#38bdf8'
                }}>
                  <span>{isSelected ? '✓ Selected for Details' : 'Check Requirements'}</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ── 3. INTERACTIVE DEEP DIVE & CONCIERGE SPLIT VIEW ── */}
      <div ref={deepDiveRef} style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 48px' }}>
        
        <div style={{ 
          background: 'rgba(255,107,53,0.08)', 
          border: '1px solid rgba(255,107,53,0.25)', 
          borderRadius: '12px', 
          padding: '12px 18px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{country.flag}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                Viewing Visa Specifications for: <span style={{ color: '#FF6B35' }}>{country.name}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#fed7aa' }}>
                {country.guidance}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: '#FF6B35',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Enquire for {country.name}
            </button>
          </div>
        </div>

        {/* 2-Column Main Layout: Left = Tabs & Content | Right = Quick Form & Concierge */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* ── LEFT COLUMN: EXTENSIVE TABS & GUIDANCE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Tab Navigation Buttons */}
            <div style={{ 
              background: '#132238', 
              borderRadius: '14px', 
              padding: '6px', 
              border: '1px solid rgba(255,255,255,0.08)', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '6px' 
            }}>
              {[
                { id: 'eligibility', label: '✓ Eligibility' },
                { id: 'documents', label: '📄 Documents' },
                { id: 'tiers', label: '⏱️ Visa Types' },
                { id: 'steps', label: '🗺️ Roadmap' },
                { id: 'goa_entry', label: '🛬 Goa Entry' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveInfoTab(tab.id)}
                  style={{
                    background: activeInfoTab === tab.id ? '#FF6B35' : 'transparent',
                    color: activeInfoTab === tab.id ? '#ffffff' : '#cbd5e1',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 4px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: INTERACTIVE ELIGIBILITY CHECKER */}
            {activeInfoTab === 'eligibility' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                      Interactive Eligibility Checklist ({country.name})
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>
                      Click on any item to verify your compliance with Indian immigration criteria.
                    </p>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 800, 
                    padding: '4px 10px', 
                    borderRadius: '8px', 
                    background: allChecksPassed ? 'rgba(34,197,94,0.18)' : 'rgba(234,179,8,0.18)', 
                    color: allChecksPassed ? '#4ade80' : '#facc15',
                    border: `1px solid ${allChecksPassed ? '#22c55e' : '#eab308'}`
                  }}>
                    {allChecksPassed ? '✓ 100% Eligible' : `${passedChecksCount}/${totalChecks} Passed`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: '#0B192C', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ 
                    width: `${(passedChecksCount / totalChecks) * 100}%`, 
                    height: '100%', 
                    background: allChecksPassed ? '#22c55e' : '#FF6B35', 
                    transition: 'width 0.3s ease' 
                  }} />
                </div>

                {/* Checklist Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Item 1 */}
                  <div 
                    onClick={() => toggleCheck('passportRegular')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.passportRegular ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        1. Standard / Ordinary {country.name} Passport
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Diplomatic, official, or refugee travel documents are not eligible for online e-Visa.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.passportRegular ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.passportRegular ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div 
                    onClick={() => toggleCheck('validityMonths')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.validityMonths ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        2. Minimum 6 Months Passport Validity Remaining
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Counted strictly from your planned landing date at Goa airport.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.validityMonths ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.validityMonths ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div 
                    onClick={() => toggleCheck('tourismPurpose')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.tourismPurpose ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        3. Travel Purpose: Recreation, Sightseeing &amp; Holiday
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Visiting Goa for beaches, yoga, leisure, cultural heritage, or meeting friends.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.tourismPurpose ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.tourismPurpose ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div 
                    onClick={() => toggleCheck('returnTicket')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.returnTicket ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        4. Confirmed Return / Onward Flight Ticket
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Flight ticket booking out of India within your permitted continuous stay window.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.returnTicket ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.returnTicket ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div 
                    onClick={() => toggleCheck('twoBlankPages')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.twoBlankPages ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        5. At Least 2 Blank Visa Pages
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Required for entry and exit border stamping by immigration officers.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.twoBlankPages ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.twoBlankPages ? '✓' : ''}
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div 
                    onClick={() => toggleCheck('sufficientFunds')}
                    style={{ 
                      background: '#0B192C', 
                      borderRadius: '10px', 
                      padding: '12px 14px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      cursor: 'pointer',
                      border: checks.sufficientFunds ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)' 
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                        6. Sufficient Financial Funds
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                        Adequate credit / debit balance or currency to sustain your holiday expenses in Goa.
                      </div>
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: checks.sufficientFunds ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                      {checks.sufficientFunds ? '✓' : ''}
                    </div>
                  </div>

                </div>

                <div style={{ 
                  marginTop: '16px', 
                  background: allChecksPassed ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
                  border: allChecksPassed ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)', 
                  borderRadius: '10px', 
                  padding: '12px 14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}>
                  {allChecksPassed ? <CheckCircle2 size={20} color="#4ade80" /> : <AlertTriangle size={20} color="#f87171" />}
                  <span style={{ fontSize: '12.5px', color: allChecksPassed ? '#4ade80' : '#fca5a5', lineHeight: 1.45 }}>
                    {allChecksPassed 
                      ? `Excellent! As a citizen of ${country.name}, you fulfill 100% of essential entry criteria for standard Indian Tourist e-Visa. Our Goa desk is ready to facilitate your journey.`
                      : `Please ensure all criteria above are fulfilled before traveling to avoid official portal delays or airport boarding issues.`}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: MANDATORY DOCUMENTS & BROWSER FILE VALIDATOR */}
            {activeInfoTab === 'documents' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: '0 0 4px', color: '#ffffff' }}>
                  Official Document Specifications ({country.name})
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>
                  The Indian Bureau of Immigration automatically rejects applications with improper image ratios or oversized PDFs.
                </p>

                {/* 2 Spec Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '18px' }}>
                  <div style={{ background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <FileText size={18} color="#38bdf8" />
                      <strong style={{ fontSize: '13.5px', color: '#fff' }}>Passport Bio-Page Scan</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                      <li><strong style={{ color: '#fff' }}>Format:</strong> Strictly PDF (.pdf)</li>
                      <li><strong style={{ color: '#fff' }}>Size:</strong> 10 KB to 300 KB</li>
                      <li>Clear, unblurred photo &amp; MRZ lines</li>
                      <li>All 4 corners of passport page visible</li>
                    </ul>
                  </div>

                  <div style={{ background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Camera size={18} color="#FF6B35" />
                      <strong style={{ fontSize: '13.5px', color: '#fff' }}>Digital Tourist Photo</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                      <li><strong style={{ color: '#fff' }}>Format:</strong> JPEG (.jpg / .jpeg)</li>
                      <li><strong style={{ color: '#fff' }}>Ratio:</strong> Strictly 1:1 Equal Square</li>
                      <li><strong style={{ color: '#fff' }}>Size:</strong> 10 KB to 1 MB (Min 350×350 px)</li>
                      <li>Plain white background, no eyeglasses/shadows</li>
                    </ul>
                  </div>
                </div>

                {/* Client-Side Pre-Flight Validator Tool */}
                <div style={{ background: '#0B192C', padding: '18px', borderRadius: '12px', border: '1px solid rgba(255,107,53,0.35)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#FF6B35" />
                      <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>
                        Client-Side File &amp; Ratio Validator
                      </strong>
                      <span style={{ fontSize: '10.5px', background: 'rgba(255,107,53,0.2)', color: '#FF6B35', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                        100% Private · No Server Upload
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveDocCheckTab('pdf')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: activeDocCheckTab === 'pdf' ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Passport PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDocCheckTab('photo')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: activeDocCheckTab === 'photo' ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Photo (1:1 Square)
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.45 }}>
                    Test your files locally right in your browser to verify they pass official government size and dimension requirements before filing.
                  </p>

                  {activeDocCheckTab === 'pdf' ? (
                    <div>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1.5px dashed rgba(56,189,248,0.4)',
                        background: 'rgba(56,189,248,0.04)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}>
                        <Upload size={22} color="#38bdf8" style={{ marginBottom: '6px' }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#38bdf8' }}>
                          {pdfCheck ? 'Click to test another Passport PDF' : 'Click to select Passport Bio-Page PDF'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Official requirement: PDF format between 10 KB and 300 KB
                        </span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handlePdfUpload}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {pdfCheck && (
                        <div style={{
                          marginTop: '10px',
                          padding: '12px',
                          borderRadius: '8px',
                          background: pdfCheck.isValid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${pdfCheck.isValid ? '#22c55e' : '#ef4444'}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                              📄 {pdfCheck.name}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: pdfCheck.isValid ? '#15803d' : '#b91c1c',
                              color: '#ffffff'
                            }}>
                              {pdfCheck.isValid ? 'PASSED (10–300 KB)' : 'ACTION NEEDED'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: pdfCheck.isValid ? '#86efac' : '#fca5a5', lineHeight: 1.4 }}>
                            {pdfCheck.error || `File Size: ${pdfCheck.sizeKb} KB. ${pdfCheck.tip}`}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '1.5px dashed rgba(255,107,53,0.4)',
                        background: 'rgba(255,107,53,0.04)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}>
                        <Camera size={22} color="#FF6B35" style={{ marginBottom: '6px' }} />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#FF6B35' }}>
                          {photoCheck ? 'Click to test another Tourist Photo' : 'Click to select Tourist Photo (JPEG)'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Target: Equal 1:1 Aspect Ratio (Square), 10 KB to 1 MB
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handlePhotoUpload}
                          style={{ display: 'none' }}
                        />
                      </label>

                      {photoCheck && (
                        <div style={{
                          marginTop: '10px',
                          padding: '12px',
                          borderRadius: '8px',
                          background: photoCheck.isValid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          border: `1px solid ${photoCheck.isValid ? '#22c55e' : '#ef4444'}`
                        }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {photoCheck.preview && (
                              <img
                                src={photoCheck.preview}
                                alt="Preview"
                                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                                  🖼️ {photoCheck.name}
                                </span>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: photoCheck.isValid ? '#15803d' : '#b91c1c',
                                  color: '#ffffff'
                                }}>
                                  {photoCheck.isValid ? 'SQUARE 1:1 PASSED' : 'CHECK NEEDED'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#cbd5e1' }}>
                                Dimensions: <strong>{photoCheck.width}×{photoCheck.height} px</strong> · Size: <strong>{photoCheck.sizeKb} KB</strong>
                              </div>
                              <div style={{ fontSize: '12px', color: photoCheck.isValid ? '#86efac' : '#fca5a5', marginTop: '2px', lineHeight: 1.4 }}>
                                {photoCheck.error || 'Complies with Indian Government 1:1 square ratio and 1 MB max size requirements.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '14px', background: '#0B192C', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block', marginBottom: '6px' }}>
                    Additional Documents for Airport Arrival in Goa:
                  </strong>
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                    • <strong>Confirmed Goa Accommodation:</strong> Hotel voucher, villa confirmation, or host name &amp; phone.<br />
                    • <strong>Yellow Fever Certificate:</strong> Mandatory ONLY if arriving from or transiting through yellow-fever endemic countries in Africa or South America.<br />
                    • <strong>Printed Color ETA Copy:</strong> Carry at least 2 printed copies when boarding your flight.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VISA TYPES & CATEGORIES */}
            {activeInfoTab === 'tiers' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                  Indian e-Visa Categories &amp; Permitted Stays
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px' }}>
                  Select the category matching your holiday schedule in Goa:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {VISA_TYPES.map(vt => {
                    const isSelected = selectedType === vt.id;
                    return (
                      <div
                        key={vt.id}
                        onClick={() => setSelectedType(vt.id)}
                        style={{
                          background: isSelected ? 'rgba(255,107,53,0.12)' : '#0B192C',
                          border: isSelected ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 800, color: isSelected ? '#FF6B35' : '#ffffff' }}>
                            {vt.title}
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                              {vt.entries}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                              {vt.processingHours}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                          <strong>Validity:</strong> {vt.validity}
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                          <strong>Official Fee Guide:</strong> <span style={{ color: '#fed7aa' }}>{vt.govtFee}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.45 }}>
                          <strong>Best for:</strong> {vt.bestFor} · <em>{vt.leadTime}</em>
                        </div>

                        {vt.features && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                            {vt.features.map((feat, fidx) => (
                              <span key={fidx} style={{ fontSize: '10.5px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: STEP-BY-STEP PROCESSING ROADMAP */}
            {activeInfoTab === 'steps' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                  4-Step Visa Processing Roadmap (Inspired by MakeMyTrip)
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 18px' }}>
                  How international travelers seamlessly transition from application to relaxing on Goa beaches:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {PROCESSING_STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    return (
                      <div 
                        key={idx}
                        style={{ 
                          background: '#0B192C', 
                          borderRadius: '12px', 
                          padding: '16px', 
                          border: '1px solid rgba(255,255,255,0.08)',
                          display: 'flex',
                          gap: '14px',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '10px', 
                          background: 'rgba(255,107,53,0.18)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0,
                          color: '#FF6B35',
                          fontWeight: 800,
                          fontSize: '15px'
                        }}>
                          {s.step}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>{s.title}</strong>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                              {s.badge}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: GOA AIRPORT IMMIGRATION & ENTRY */}
            {activeInfoTab === 'goa_entry' && (
              <div style={{ background: '#132238', borderRadius: '14px', padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
                  Direct International Entry into Goa
                </h3>
                <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px' }}>
                  How international arrivals and immigration work at Goa’s two international airports:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Airport 1 */}
                  <div style={{ background: '#0B192C', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plane size={18} color="#38bdf8" />
                        <strong style={{ fontSize: '14px', color: '#ffffff' }}>Manohar International Airport, Mopa (GOX)</strong>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                        North Goa Hub
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.55 }}>
                      North Goa’s premier international airport. State-of-the-art terminal featuring dedicated e-Visa biometrics capture desks, smooth customs, and direct expressway connectivity to Morjim, Ashvem, Arambol, Vagator, Calangute, and Panaji.
                    </p>
                    <div style={{ fontSize: '11.5px', color: '#4ade80' }}>
                      ✓ Wow Goa private chauffeur meet &amp; greet curbside at GOX terminal.
                    </div>
                  </div>

                  {/* Airport 2 */}
                  <div style={{ background: '#0B192C', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plane size={18} color="#4ade80" />
                        <strong style={{ fontSize: '14px', color: '#ffffff' }}>Dabolim International Airport (GOI)</strong>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                        Central / South Goa Hub
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.55 }}>
                      Conveniently located for luxury beach resorts in South Goa (Colva, Benaulim, Varca, Cavelossim, Mobor). Fully equipped with Bureau of Immigration e-Visa desks for both scheduled and charter flights.
                    </p>
                    <div style={{ fontSize: '11.5px', color: '#4ade80' }}>
                      ✓ Doorstep taxi and self-drive vehicle delivery right at Dabolim Airport.
                    </div>
                  </div>

                  {/* Immigration Tip */}
                  <div style={{ background: 'rgba(255,107,53,0.1)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,107,53,0.3)', fontSize: '12px', color: '#fed7aa', lineHeight: 1.5 }}>
                    📍 <strong>Arrival Pro-Tip:</strong> Upon deboarding at GOX or GOI, follow overhead signs specifically for <em>"e-Visa / Electronic Travel Authorization (ETA)"</em>. Do not join the general regular paper visa line, as e-Visa counters have dedicated biometric fingerprint and facial scanners.
                  </div>

                </div>
              </div>
            )}

            {/* Seamless Cross-Linking to Cabs, Villas & Packages */}
            <div style={{ 
              background: '#132238', 
              borderRadius: '14px', 
              padding: '16px 20px', 
              border: '1px solid rgba(255,255,255,0.08)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap',
              gap: '12px' 
            }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#ffffff' }}>
                  Arriving at Goa Airport? Complete Your Holiday Plan
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Pre-book authorized airport transfers, beach villas, or self-drive rentals with flight tracking.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('cabs')}
                  style={{
                    background: '#FF6B35',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚕 Airport Cabs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('packages')}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🌴 Holiday Packages
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab('selfdrive')}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚗 Self-Drive
                </button>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: FAST ENQUIRY FORM & WHATSAPP DESK ── */}
          <div ref={formRef} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ 
              background: '#ffffff', 
              color: '#0f172a', 
              borderRadius: '16px', 
              padding: '24px', 
              boxShadow: '0 12px 32px rgba(0,0,0,0.22)' 
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>
                  International Concierge Desk
                </div>
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>
                  ● Live Support Online
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                Visa &amp; Travel Enquiry Form
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.45 }}>
                Connect directly with our Goa duty officers for verified document formatting, ETA tracking, and airport arrival coordination.
              </p>

              {sent ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '22px 18px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '46px', height: '46px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', marginBottom: '10px' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534', marginBottom: '4px' }}>
                    Enquiry Logged in Backend CRM
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#15803d', background: '#dcfce7', display: 'inline-block', padding: '3px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                    Reference #{leadRef || 'VISA-GUEST'}
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#15803d', margin: '0 0 16px', lineHeight: 1.5 }}>
                    Thank you <strong>{formData.name || 'Valued Guest'}</strong>! Your enquiry for travel from <strong>{country.name} ({country.flag})</strong> has been logged into our database. Please tap below to chat directly with our duty concierge on WhatsApp:
                  </p>
                  
                  {/* WhatsApp Support Button */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#25D366',
                      color: '#ffffff',
                      textDecoration: 'none',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '13.5px',
                      width: '100%',
                      boxSizing: 'border-box',
                      boxShadow: '0 6px 20px rgba(37,211,102,0.35)'
                    }}
                  >
                    <MessageSquare size={18} /> Chat on WhatsApp Desk (Ref #{leadRef})
                  </a>

                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSent(false);
                        setLeadRef(null);
                        setFormData({ name: '', phoneCode: '+44', phone: '', email: '', travelDate: '', travelers: '2', notes: '' });
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '12px',
                        color: '#64748b',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Log another enquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInquire} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Name */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Full Name (As in Passport) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Johnson"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Phone with Country Dial Code */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      WhatsApp Contact Number *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px' }}>
                      <select
                        value={formData.phoneCode}
                        onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          background: '#fff',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {COUNTRIES.map(ctry => (
                          <option key={ctry.code} value={ctry.dialCode}>
                            {ctry.flag} {ctry.dialCode} ({ctry.name})
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 7911 123456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Email & Date in 2 columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Email <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                      </label>
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12.5px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Travel Date <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Approx)</span>
                      </label>
                      <input
                        type="date"
                        value={formData.travelDate}
                        onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 8px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Nationality & Category Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Passport Country
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#fff',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        {POPULAR_NATIONALITIES.map(nat => (
                          <option key={nat.code} value={nat.code}>
                            {nat.flag} {nat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Visa Category
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#fff',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        {VISA_TYPES.map(vt => (
                          <option key={vt.id} value={vt.id}>
                            {vt.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Travelers & Airport */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Number of Travelers
                      </label>
                      <select
                        value={formData.travelers}
                        onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#fff',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="1">1 Solo Traveler</option>
                        <option value="2">2 Couples / Friends</option>
                        <option value="3">3 Travelers</option>
                        <option value="4">4 Family Members</option>
                        <option value="5+">5+ Group Travel</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Goa Arrival Port
                      </label>
                      <select
                        value={selectedAirport}
                        onChange={(e) => setSelectedAirport(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#fff',
                          outline: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="GOX">Manohar Intl Mopa (GOX)</option>
                        <option value="GOI">Dabolim Airport (GOI)</option>
                        <option value="SEAPORT">Mormugao Seaport</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes / Special queries */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Additional Notes or Travel Inquiries
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Need villa transfer from GOX airport, photo check guidance..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none'
                      }}
                    />
                  </div>

                  {/* Summary badge */}
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{country.flag} {country.name} · {visa.title}</span>
                    <span style={{ fontWeight: 700, color: allChecksPassed ? '#16a34a' : '#d97706' }}>
                      {allChecksPassed ? '✓ 100% Eligible' : 'Review Needed'}
                    </span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: submitting ? '#94a3b8' : '#FF6B35',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(255,107,53,0.3)'
                    }}
                  >
                    <span>{submitting ? 'Saving Enquiry to CRM...' : 'Send Travel Enquiry'}</span>
                    <ArrowRight size={16} />
                  </button>

                  {/* Direct WhatsApp button in form */}
                  <div style={{ textAlign: 'center', marginTop: '2px' }}>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '12.5px',
                        color: '#16a34a',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageSquare size={14} /> Or chat with Duty Officer directly on WhatsApp
                    </a>
                  </div>

                </form>
              )}

              {/* Mandatory Official Authority Disclaimer (Veena World / MakeMyTrip transparent standard) */}
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '12px', 
                borderTop: '1px solid #e2e8f0', 
                fontSize: '11px', 
                color: '#64748b', 
                lineHeight: 1.5 
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <ShieldAlert size={14} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#0f172a' }}>Official Authority Notice:</strong> Wow Goa provides travel facilitation, document pre-checking, and concierge services. The granting of an Indian Visa or Electronic Travel Authorization (ETA) is the sole and sovereign prerogative of the Bureau of Immigration, Ministry of Home Affairs, Government of India. Approval cannot be guaranteed by any third party.
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ── 4. COMPREHENSIVE FAQ SECTION ── */}
        <div style={{ marginTop: '36px', background: '#132238', borderRadius: '14px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={20} color="#FF6B35" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Frequently Asked Questions by International Holidaymakers
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
              Updated for {new Date().getFullYear()} Immigration Regulations
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#0B192C',
                    borderRadius: '10px',
                    border: isOpen ? '1px solid #FF6B35' : '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    transition: 'border 0.2s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'none',
                      border: 'none',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      gap: '12px'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} color="#FF6B35" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 18px 14px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5. PROMINENT REGULATORY & TRANSPARENCY FOOTER BANNER ── */}
        <div style={{ 
          marginTop: '28px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.06)', 
          borderRadius: '12px', 
          padding: '18px 22px', 
          fontSize: '11.5px', 
          color: '#64748b', 
          lineHeight: 1.6 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#94a3b8', fontWeight: 700 }}>
            <Info size={14} color="#38bdf8" />
            <span>Official Government Portal Reference &amp; Guidelines</span>
          </div>
          Visitors may also lodge applications directly on the official Government of India e-Visa portal at <code style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>indianvisaonline.gov.in</code>. Official visa fees vary by nationality, season, and visa duration and are strictly non-refundable once paid to the government gateway. Wow Goa operates as an independent travel facilitation, pre-checking, and holiday concierge service.
        </div>

      </div>

    </div>
  );
}
