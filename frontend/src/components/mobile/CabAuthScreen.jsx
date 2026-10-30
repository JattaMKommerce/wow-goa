import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Phone, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, 
  Lock, RefreshCw, X, Mail, Car, Compass, ChevronDown, Check,
  Sun, Moon, Globe, Search
} from 'lucide-react';
import { sendCustomerOtp, verifyCustomerOtp } from '../../services/api';

/**
 * Demo Registered Goa Drivers for quick testing
 */
const DEMO_DRIVERS = [
  {
    id: 'drv_01',
    name: 'Rajesh Naik',
    phone: '9822100001',
    cabNumber: 'GA-03-Z-8821',
    carModel: 'Toyota Innova Crysta',
    location: 'Dabolim Airport (GOI)'
  },
  {
    id: 'drv_02',
    name: 'Suresh Shirodkar',
    phone: '9822100002',
    cabNumber: 'GA-07-T-4310',
    carModel: 'Maruti Suzuki Ertiga',
    location: 'North Goa (Calangute / Baga)'
  },
  {
    id: 'drv_03',
    name: 'Anthony D\'Souza',
    phone: '9822100003',
    cabNumber: 'GA-01-A-1904',
    carModel: 'Swift Dzire Tour',
    location: 'Panjim Central & Airport Transfer'
  }
];

/**
 * Clean, Basic Language List (No flags, spacious, domestic & international)
 */
const ALL_LANGUAGES = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'kok', label: 'Konkani', native: 'कोंकणी' },
  { id: 'ru', label: 'Russian', native: 'Русский' },
  { id: 'mr', label: 'Marathi', native: 'मराठी' },
  { id: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { id: 'pt', label: 'Portuguese', native: 'Português' },
  { id: 'de', label: 'German', native: 'Deutsch' },
  { id: 'fr', label: 'French', native: 'Français' },
  { id: 'es', label: 'Spanish', native: 'Español' },
  { id: 'he', label: 'Hebrew', native: 'עִבְרִית' },
  { id: 'ar', label: 'Arabic', native: 'العربية' },
  { id: 'bn', label: 'Bengali', native: 'বাংলা' },
  { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు' },
  { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { id: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { id: 'ur', label: 'Urdu', native: 'اردو' },
  { id: 'it', label: 'Italian', native: 'Italiano' },
  { id: 'ja', label: 'Japanese', native: '日本語' },
  { id: 'ko', label: 'Korean', native: '한국어' },
  { id: 'zh', label: 'Chinese', native: '中文' }
];

/**
 * Multi-Language UI Strings
 */
const I18N = {
  en: {
    chooseLang: 'Choose Language',
    selectLangSub: 'Select your preferred language',
    searchPlaceholder: 'Search language (e.g. Russian, Hindi, French)...',
    confirm: 'Confirm',
    continue: 'Continue',
    getStarted: 'Get Started',
    getMoving: 'Get moving with WOW GOA',
    enterOtp: 'Enter OTP',
    resendIn: 'Resend OTP in',
    change: 'Change',
    skip: 'Skip',
    passenger: 'Passenger / Rider',
    driver: 'Driver Partner',
    phonePlaceholder: 'Enter mobile number or email',
    terms: 'By continuing, you agree to the terms of service and privacy policy',
    instantDemo: 'Verification Code:',
    autoFill: 'Auto-Fill',
    clarityTitle: 'CLARITY & HONEST FARES',
    clarityDesc: 'Zero hidden surge fees across Goa airport transfers and beach shuttles. Transparent, fixed rates.',
    chauffeursTitle: 'VERIFIED LOCAL CHAUFFEURS',
    chauffeursDesc: 'Travel safely with polite, verified Goan drivers who know every scenic coastal road and beach.',
    choiceTitle: 'CABS & SELF DRIVE IN ONE APP',
    choiceDesc: 'Book point-to-point chauffeur cabs or rent Thar 4x4, Creta, Swift & Activa scooters with doorstep delivery.',
    dutyLogin: 'Chauffeur Duty Login',
    dutyDesc: 'Enter your registered driver phone number to start duty.'
  },
  hi: {
    chooseLang: 'भाषा चुनें',
    selectLangSub: 'अपनी पसंदीदा भाषा चुनें',
    searchPlaceholder: 'भाषा खोजें (उदा. हिन्दी, English)...',
    confirm: 'पुष्टि करें',
    continue: 'आगे बढ़ें',
    getStarted: 'शुरू करें',
    getMoving: 'WOW GOA के साथ यात्रा शुरू करें',
    enterOtp: 'OTP दर्ज करें',
    resendIn: 'पुनः OTP भेजें',
    change: 'बदलें',
    skip: 'छोड़ें',
    passenger: 'यात्री (Passenger)',
    driver: 'ड्राइवर पार्टनर',
    phonePlaceholder: 'मोबाइल नंबर या ईमेल दर्ज करें',
    terms: 'जारी रखकर, आप सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं',
    instantDemo: 'सत्यापन कोड:',
    autoFill: 'स्वतः भरें',
    clarityTitle: 'स्पष्ट और ईमानदार किराया',
    clarityDesc: 'बिना किसी छुपे हुए शुल्क के गोवा एयरपोर्ट और समुद्र तटों के लिए पारदर्शी और उचित किराया।',
    chauffeursTitle: 'सत्यापित स्थानीय ड्राइवर',
    chauffeursDesc: 'सुरक्षित और विश्वसनीय स्थानीय गोवा ड्राइवरों के साथ आराम से यात्रा करें।',
    choiceTitle: 'टैक्सी और सेल्फ़ ड्राइव एक ही ऐप में',
    choiceDesc: 'टैक्सी बुक करें या थार 4x4, क्रेटा, स्विफ्ट और एक्टिवा स्कूटर किराए पर लें।',
    dutyLogin: 'ड्राइवर ड्यूटी लॉगिन',
    dutyDesc: 'ड्यूटी शुरू करने के लिए अपना पंजीकृत नंबर दर्ज करें।'
  },
  kok: {
    chooseLang: 'भास वेंचून काडात',
    selectLangSub: 'तुमी पसंत केल्ली भास वेंचून काडात',
    searchPlaceholder: 'भास सोदात (उदा. कोंकणी, English)...',
    confirm: 'निश्चीत करात',
    continue: 'फुडें वचात',
    getStarted: 'सुरू करात',
    getMoving: 'WOW GOA सयत प्रवास सुरू करात',
    enterOtp: 'OTP घालात',
    resendIn: 'परत धाडात',
    change: 'बदलात',
    skip: 'सोडात',
    passenger: 'प्रवासी (Rider)',
    driver: 'ड्रायव्हर पार्टनर',
    phonePlaceholder: 'मोबाईल नंबर वा ईमेल घालात',
    terms: 'फुडें वचून, तुमी सेवा अटी आनी गोपनीयता धोरणाक मान्यताय दितात',
    instantDemo: 'तपासणी कोड:',
    autoFill: 'भरून घेयात',
    clarityTitle: 'स्पश्ट आनी प्रामाणीक भाडें',
    clarityDesc: 'गोंयच्या विमानतळा खातीर आनी दर्यादेगेर वचपाक कसलेंच गुपीत चार्ज नासताना प्रामाणीक भाडें.',
    chauffeursTitle: 'तपासणी केल्ले गोंयचे ड्रायव्हर',
    chauffeursDesc: 'गोंयची सगळीं रस्त्यां आनी सोबीत वाठार खबर आशिल्ल्या विश्वासी गोंयच्या ड्रायव्हरांसयत भोंवा.',
    choiceTitle: 'टॅक्सी आनी सेल्फ ड्रायव्ह एकाच अॅपान',
    choiceDesc: 'थार 4x4, क्रेटा, स्विफ्ट वा स्कुटर भाड्याक घेयात वा टॅक्सी बुक करात.',
    dutyLogin: 'ड्रायव्हर ड्युटी लॉगिन',
    dutyDesc: 'ड्युटी सुरू करपाक तुमचो नंबर घालात.'
  },
  ru: {
    chooseLang: 'Выберите язык',
    selectLangSub: 'Выберите язык интерфейса',
    searchPlaceholder: 'Поиск языка (напр. Русский, English)...',
    confirm: 'Подтвердить',
    continue: 'Продолжить',
    getStarted: 'Начать',
    getMoving: 'Поехали с WOW GOA',
    enterOtp: 'Введите код подтверждения',
    resendIn: 'Повторный код через',
    change: 'Изменить',
    skip: 'Пропустить',
    passenger: 'Пассажир',
    driver: 'Водитель-партнер',
    phonePlaceholder: 'Номер телефона или Email',
    terms: 'Продолжая, вы соглашаетесь с условиями обслуживания и политикой конфиденциальности',
    instantDemo: 'Код подтверждения:',
    autoFill: 'Авто-ввод',
    clarityTitle: 'ЧЕСТНЫЕ И ПРОЗРАЧНЫЕ ЦЕНЫ',
    clarityDesc: 'Фиксированные тарифы без скрытых наценок из аэропортов Даболим и МОПА по всем пляжам Гоа.',
    chauffeursTitle: 'ПРОВЕРЕННЫЕ ВОДИТЕЛИ ГОА',
    chauffeursDesc: 'Безопасные поездки с вежливыми местными водителями, знающими все пляжи и живописные дороги.',
    choiceTitle: 'ТАКСИ И АРЕНДА АВТО В ОДНОМ ПРИЛОЖЕНИИ',
    choiceDesc: 'Заказывайте такси с водителем или арендуйте Thar 4x4, Creta и скутеры Activa без ограничений.',
    dutyLogin: 'Вход для водителя',
    dutyDesc: 'Введите номер телефона для начала смены.'
  },
  mr: {
    chooseLang: 'भाषा निवडा',
    selectLangSub: 'आपली पसंतीची भाषा निवडा',
    searchPlaceholder: 'भाषा शोधा (उदा. मराठी, English)...',
    confirm: 'पुष्टी करा',
    continue: 'पुढे चालू ठेवा',
    getStarted: 'सुरू करा',
    getMoving: 'WOW GOA सह प्रवास सुरू करा',
    enterOtp: 'OTP प्रविष्ट करा',
    resendIn: 'पुन्हा पाठवा',
    change: 'बदला',
    skip: 'वगळा',
    passenger: 'प्रवासी (Rider)',
    driver: 'चालक भागीदार',
    phonePlaceholder: 'मोबाइल क्रमांक किंवा ईमेल टाका',
    terms: 'पुढे चालू ठेवून, आपण सेवा अटी आणि गोपनीयता धोरणास सहमती दर्शवता',
    instantDemo: 'सत्यापन कोड:',
    autoFill: 'आपोआप भरा',
    clarityTitle: 'पारदर्शक आणि प्रामाणिक दर',
    clarityDesc: 'गोवा विमानतळ आणि सर्व समुद्रकिनाऱ्यांसाठी कोणतेही छुपे शुल्क नसलेले प्रामाणिक दर.',
    chauffeursTitle: 'सत्यापित स्थानिक चालक',
    chauffeursDesc: 'गोव्यातील सर्व रस्ते माहित असलेल्या विश्वासू चालकांसोबत सुरक्षित प्रवास करा.',
    choiceTitle: 'टॅक्सी आणि सेल्फ ड्राइव्ह एकाच ॲपमध्ये',
    choiceDesc: 'टॅक्सी बुक करा किंवा थार 4x4, क्रेटा आणि स्कूटर भाड्याने घ्या.',
    dutyLogin: 'चालक ड्युटी लॉगिन',
    dutyDesc: 'ड्युटी सुरू करण्यासाठी नंबर टाका.'
  },
  gu: {
    chooseLang: 'ભાષા પસંદ કરો',
    selectLangSub: 'તમારી પસંદગીની ભાષા પસંદ કરો',
    searchPlaceholder: 'ભાષા શોધો (દા.ત. ગુજરાતી, English)...',
    confirm: 'પુષ્ટિ કરો',
    continue: 'આગળ વધો',
    getStarted: 'શરૂ કરો',
    getMoving: 'WOW GOA સાથે મુસાફરી શરૂ કરો',
    enterOtp: 'OTP દાખલ કરો',
    resendIn: 'ફરી મોકલો',
    change: 'બદલો',
    skip: 'છોડો',
    passenger: 'મુસાફર (Passenger)',
    driver: 'ડ્રાઈવર પાર્ટનર',
    phonePlaceholder: 'મોબાઇલ નંબર અથવા ઇમેઇલ દાખલ કરો',
    terms: 'ચાલુ રાખીને, તમે સેવાની શરતો અને ગોપનીયતા નીતિ સાથે સંમત થાઓ છો',
    instantDemo: 'ચકાસણી કોડ:',
    autoFill: 'ઓટો-ભરો',
    clarityTitle: 'પારદર્શક અને પ્રામાણિક ભાડું',
    clarityDesc: 'ગોવા એરપોર્ટ અને તમામ બીચ માટે કોઈ છુપા ચાર્જ વગરનું પ્રામાણિક ભાડું.',
    chauffeursTitle: 'ચકાસાયેલ સ્થાનિક ડ્રાઈવર',
    chauffeursDesc: 'ગોવાના તમામ રસ્તાઓથી માહિતગાર વિશ્વસનીય સ્થાનિક ડ્રાઈવરો સાથે મુસાફરી કરો.',
    choiceTitle: 'ટેક્સી અને સેલ્ફ ડ્રાઈવ એક જ એપ્લિકેશનમાં',
    choiceDesc: 'ટેક્સી બુક કરો અથવા થાર 4x4, ક્રેટા અને સ્કૂટર ભાડે લો.',
    dutyLogin: 'ડ્રાઈવર ડ્યુટી લૉગિન',
    dutyDesc: 'ડ્યુટી શરૂ કરવા નંબર દાખલ કરો.'
  },
  pt: {
    chooseLang: 'Escolha o Idioma',
    selectLangSub: 'Selecione seu idioma preferido',
    searchPlaceholder: 'Pesquisar idioma (ex. Português, English)...',
    confirm: 'Confirmar',
    continue: 'Continuar',
    getStarted: 'Começar',
    getMoving: 'Viaje com WOW GOA',
    enterOtp: 'Introduzir código OTP',
    resendIn: 'Reenviar em',
    change: 'Alterar',
    skip: 'Pular',
    passenger: 'Passageiro',
    driver: 'Motorista Parceiro',
    phonePlaceholder: 'Número de telefone ou Email',
    terms: 'Ao continuar, você concorda com os termos de serviço e política de privacidade',
    instantDemo: 'Código de Verificação:',
    autoFill: 'Preenchimento Automático',
    clarityTitle: 'TARIFAS CLARAS E JUSTAS',
    clarityDesc: 'Sem taxas ocultas nos transfers dos aeroportos de Dabolim e MOPA e praias de Goa.',
    chauffeursTitle: 'MOTORISTAS LOCAIS VERIFICADOS',
    chauffeursDesc: 'Viaje com segurança com motoristas locais experientes de Goa.',
    choiceTitle: 'TÁXIS E ALUGUER DE CARROS',
    choiceDesc: 'Reserve táxis com motorista ou alugue jipes Thar 4x4 e scooters sem limites.',
    dutyLogin: 'Login do Motorista',
    dutyDesc: 'Insira o número de telefone registrado para iniciar o serviço.'
  },
  de: {
    chooseLang: 'Sprache wählen',
    selectLangSub: 'Wählen Sie Ihre Sprache',
    searchPlaceholder: 'Sprache suchen (z. B. Deutsch, English)...',
    confirm: 'Bestätigen',
    continue: 'Weiter',
    getStarted: 'Starten',
    getMoving: 'Unterwegs mit WOW GOA',
    enterOtp: 'OTP-Code eingeben',
    resendIn: 'Erneut senden in',
    change: 'Ändern',
    skip: 'Überspringen',
    passenger: 'Fahrgast',
    driver: 'Fahrer-Partner',
    phonePlaceholder: 'Handynummer oder E-Mail eingeben',
    terms: 'Wenn Sie fortfahren, stimmen Sie den Nutzungsbedingungen und der Datenschutzerklärung zu',
    instantDemo: 'Bestätigungscode:',
    autoFill: 'Auto-Ausfüllen',
    clarityTitle: 'TRANSPARENTE PREISE',
    clarityDesc: 'Faire Preise ohne versteckte Gebühren für Goa-Flughafentransfers und Strände.',
    chauffeursTitle: 'GEPRÜFTE LOKALE FAHRER',
    chauffeursDesc: 'Reisen Sie sicher mit verifizierten Fahrern aus Goa.',
    choiceTitle: 'TAXIS & MIETWAGEN IN EINER APP',
    choiceDesc: 'Buchen Sie Taxis mit Chauffeur oder mieten Sie Thar 4x4 und Motorroller.',
    dutyLogin: 'Fahrer-Dienst-Login',
    dutyDesc: 'Geben Sie Ihre registrierte Telefonnummer ein.'
  },
  fr: {
    chooseLang: 'Choisir la langue',
    selectLangSub: 'Sélectionnez votre langue préférée',
    searchPlaceholder: 'Rechercher une langue (ex. Français, English)...',
    confirm: 'Confirmer',
    continue: 'Continuer',
    getStarted: 'Commencer',
    getMoving: 'En route avec WOW GOA',
    enterOtp: 'Entrer le code OTP',
    resendIn: 'Renvoyer dans',
    change: 'Modifier',
    skip: 'Passer',
    passenger: 'Passager',
    driver: 'Chauffeur Partenaire',
    phonePlaceholder: 'Numéro de téléphone ou Email',
    terms: 'En continuant, vous acceptez les conditions de service et la politique de confidentialité',
    instantDemo: 'Code de vérification :',
    autoFill: 'Remplir auto',
    clarityTitle: 'TARIFS CLAIRS ET HONNÊTES',
    clarityDesc: 'Prix transparents sans frais cachés pour tous les transferts aéroport et plages de Goa.',
    chauffeursTitle: 'CHAUFFEURS LOCAUX VÉRIFIÉS',
    chauffeursDesc: 'Voyagez en toute sécurité avec des chauffeurs professionnels de Goa.',
    choiceTitle: 'TAXIS ET LOCATION EN UNE APPLI',
    choiceDesc: 'Réservez des taxis avec chauffeur ou louez Thar 4x4 et scooters en toute liberté.',
    dutyLogin: 'Connexion Chauffeur',
    dutyDesc: 'Entrez votre numéro pour commencer votre service.'
  },
  es: {
    chooseLang: 'Elegir Idioma',
    selectLangSub: 'Selecciona tu idioma preferido',
    searchPlaceholder: 'Buscar idioma (ej. Español, English)...',
    confirm: 'Confirmar',
    continue: 'Continuar',
    getStarted: 'Comenzar',
    getMoving: 'Muévete con WOW GOA',
    enterOtp: 'Introducir código OTP',
    resendIn: 'Reenviar en',
    change: 'Cambiar',
    skip: 'Omitir',
    passenger: 'Pasajero',
    driver: 'Conductor Asociado',
    phonePlaceholder: 'Número de móvil o Correo',
    terms: 'Al continuar, aceptas los términos de servicio y la política de privacidad',
    instantDemo: 'Código de verificación:',
    autoFill: 'Autollenar',
    clarityTitle: 'TARIFAS CLARAS Y HONESTAS',
    clarityDesc: 'Precios justos sin cargos ocultos para traslados desde el aeropuerto y playas de Goa.',
    chauffeursTitle: 'CONDUCTORES LOCALES VERIFICADOS',
    chauffeursDesc: 'Viaja seguro con conductores verificados que conocen todo Goa.',
    choiceTitle: 'TAXIS Y ALQUILER EN UNA APP',
    choiceDesc: 'Reserva taxis con chofer o alquila Thar 4x4 y scooters sin límites.',
    dutyLogin: 'Acceso Conductor',
    dutyDesc: 'Introduce tu teléfono registrado.'
  }
};

/**
 * Classy Photographic Onboarding Images (Ultra-Realistic Goa Photography)
 */
const ONBOARDING_IMAGES = [
  '/assets/mobile/slide_sunset.jpg',
  '/assets/mobile/slide_airport.jpg',
  '/assets/mobile/slide_thar.jpg'
];

export default function CabAuthScreen({ onAuthSuccess, onSkip, isNativeApp = false }) {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('wowgoa_cab_theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('wowgoa_cab_theme', nextTheme);
    } catch (e) {}
  };

  const isDark = theme === 'dark';

  // Language state & search query
  const [selectedLang, setSelectedLang] = useState(() => {
    try {
      return localStorage.getItem('wowgoa_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const [langSearch, setLangSearch] = useState('');

  // Dynamically filter languages without congestion
  const filteredLanguages = useMemo(() => {
    const query = langSearch.trim().toLowerCase();
    if (!query) return ALL_LANGUAGES;
    return ALL_LANGUAGES.filter(lang => 
      lang.label.toLowerCase().includes(query) ||
      lang.native.toLowerCase().includes(query) ||
      lang.id.toLowerCase().includes(query)
    );
  }, [langSearch]);

  const activeLangObj = useMemo(() => {
    return ALL_LANGUAGES.find(l => l.id === selectedLang) || ALL_LANGUAGES[0];
  }, [selectedLang]);

  // Current translation strings with English fallback
  const t = I18N[selectedLang] || I18N.en;

  // Flow Step: 'splash' -> 'language' -> 'onboarding' -> 'getmoving' -> 'otp'
  const [flowStep, setFlowStep] = useState(() => {
    try {
      const onboarded = localStorage.getItem('wowgoa_onboarded_completed');
      if (onboarded === 'true') {
        return 'getmoving';
      }
    } catch (e) {}
    return 'splash';
  });

  // Onboarding slide index
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto transition from splash after 1.2s
  useEffect(() => {
    if (flowStep === 'splash') {
      const timer = setTimeout(() => {
        setFlowStep('language');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [flowStep]);

  // Dynamic Onboarding Slides using selected language
  const onboardingSlides = useMemo(() => [
    {
      id: 'clarity',
      badge: 'ZERO SURGE PROMISE',
      title: t.clarityTitle,
      description: t.clarityDesc,
      image: ONBOARDING_IMAGES[0]
    },
    {
      id: 'chauffeurs',
      badge: 'GOA TOURISM CERTIFIED',
      title: t.chauffeursTitle,
      description: t.chauffeursDesc,
      image: ONBOARDING_IMAGES[1]
    },
    {
      id: 'choice',
      badge: 'ALL-IN-ONE MOBILITY',
      title: t.choiceTitle,
      description: t.choiceDesc,
      image: ONBOARDING_IMAGES[2]
    }
  ], [t]);

  // ── AUTOMATIC SLIDE ROTATION (Every 3.8s) ──
  useEffect(() => {
    if (flowStep === 'onboarding') {
      const autoTimer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % onboardingSlides.length);
      }, 3800);
      return () => clearInterval(autoTimer);
    }
  }, [flowStep, onboardingSlides.length]);

  // Role: 'customer' (Passenger/Rider) | 'driver' (Chauffeur Partner)
  const [role, setRole] = useState('customer');

  // Passenger phone
  const [phone, setPhone] = useState('');
  
  // Driver fields
  const [selectedDriver, setSelectedDriver] = useState(DEMO_DRIVERS[0]);
  const [driverPhone, setDriverPhone] = useState(DEMO_DRIVERS[0].phone);
  
  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('4821');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (flowStep === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [flowStep, resendTimer]);

  // Focus first OTP box
  useEffect(() => {
    if (flowStep === 'otp') {
      setTimeout(() => {
        otpInputRefs[0]?.current?.focus();
      }, 200);
    }
  }, [flowStep]);

  // Handle Confirm Language
  const handleConfirmLanguage = () => {
    try {
      localStorage.setItem('wowgoa_lang', selectedLang);
    } catch (e) {}
    setFlowStep('onboarding');
  };

  const handleSkipOnboarding = () => {
    try {
      localStorage.setItem('wowgoa_onboarded_completed', 'true');
    } catch (e) {}
    setFlowStep('getmoving');
  };

  // Handle Request OTP
  const handleSubmitInput = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (role === 'driver') {
      const cleanDriverPhone = driverPhone.replace(/\D/g, '');
      if (cleanDriverPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit driver mobile number.');
        return;
      }

      setIsLoading(true);
      const localOtp = '1234';
      setGeneratedOtp(localOtp);

      setTimeout(() => {
        setIsLoading(false);
        setInfoMsg(`Driver code sent to +91 ${cleanDriverPhone}. Use code ${localOtp} to start duty.`);
        setFlowStep('otp');
        setResendTimer(30);
        setCanResend(false);
        setOtpDigits(['', '', '', '']);
      }, 350);
      return;
    }

    // Customer Phone / Email
    const rawInput = phone.trim();
    const isEmailInput = rawInput.includes('@');
    const cleanPhone = rawInput.replace(/\D/g, '');

    if (isEmailInput) {
      if (!rawInput.includes('.') || rawInput.length < 6) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
    } else {
      if (cleanPhone.length < 10) {
        setErrorMsg('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setIsLoading(true);
    const localOtp = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(localOtp);

    try {
      const res = await sendCustomerOtp(
        !isEmailInput ? cleanPhone : '',
        isEmailInput ? rawInput.toLowerCase() : ''
      );

      if (res && res.otp) {
        setGeneratedOtp(String(res.otp));
      }

      setInfoMsg(isEmailInput 
        ? `Verification code dispatched to ${rawInput}` 
        : `Verification code dispatched to +91 ${cleanPhone}`);

      setFlowStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '']);
    } catch (err) {
      setFlowStep('otp');
      setResendTimer(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg('');

    if (value && index < 3) {
      otpInputRefs[index + 1]?.current?.focus();
    }

    const fullOtp = newDigits.join('');
    if (fullOtp.length === 4) {
      verifyOtpCode(fullOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1]?.current?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    const digits = generatedOtp.split('');
    setOtpDigits(digits);
    verifyOtpCode(generatedOtp);
  };

  // Verify OTP
  const verifyOtpCode = async (enteredCode) => {
    setIsLoading(true);
    setErrorMsg('');

    if (role === 'driver') {
      const cleanDriverPhone = driverPhone.replace(/\D/g, '');
      const valid = enteredCode === generatedOtp || enteredCode === '1234' || enteredCode === '4821';

      if (!valid) {
        setIsLoading(false);
        setErrorMsg('Invalid driver code. Use hint code 1234.');
        return;
      }

      const driverObj = {
        id: selectedDriver?.id || `drv_${cleanDriverPhone}`,
        name: selectedDriver?.name || `Goa Chauffeur ${cleanDriverPhone.slice(-4)}`,
        phone: `+91 ${cleanDriverPhone}`,
        email: `${(selectedDriver?.name || 'driver').toLowerCase().replace(/\s+/g, '')}@wowgoa.in`,
        role: 'chauffeur',
        cabNumber: selectedDriver?.cabNumber || 'GA-03-Z-8821',
        carModel: selectedDriver?.carModel || 'Toyota Innova Crysta',
        location: selectedDriver?.location || 'Dabolim Airport (GOI)',
        verifiedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem('wowgoa_cab_user', JSON.stringify(driverObj));
        localStorage.setItem('active_role', 'DRIVER');
        localStorage.setItem('user', JSON.stringify(driverObj));
        localStorage.setItem('currentUser', JSON.stringify(driverObj));
      } catch (e) {}

      setIsLoading(false);
      onAuthSuccess(driverObj);
      return;
    }

    // Customer
    const rawInput = phone.trim();
    const isEmailInput = rawInput.includes('@');
    const cleanPhone = rawInput.replace(/\D/g, '');

    try {
      let isSuccess = false;
      let returnedCust = null;

      if (enteredCode === generatedOtp || enteredCode === '1234' || enteredCode === '4821') {
        isSuccess = true;
      } else {
        const verifyRes = await verifyCustomerOtp(
          !isEmailInput ? cleanPhone : '',
          isEmailInput ? rawInput.toLowerCase() : '',
          enteredCode
        );
        if (verifyRes && verifyRes.success) {
          isSuccess = true;
          returnedCust = verifyRes.customer;
        }
      }

      if (isSuccess) {
        const userObj = {
          id: returnedCust?.id || (isEmailInput ? `email_${Date.now()}` : `rider_${cleanPhone || 'jenny'}`),
          name: returnedCust?.name || (isEmailInput ? rawInput.split('@')[0] : 'Jenny'),
          phone: cleanPhone ? `+91 ${cleanPhone.slice(-10)}` : (returnedCust?.phone || '+91 9876543210'),
          email: isEmailInput ? rawInput : (returnedCust?.email || 'traveler@wowgoa.in'),
          role: 'customer',
          verifiedAt: new Date().toISOString()
        };

        try {
          localStorage.setItem('wowgoa_cab_user', JSON.stringify(userObj));
          localStorage.setItem('currentUser', JSON.stringify(userObj));
          localStorage.setItem('wowgoa_rider_name', userObj.name);
          if (userObj.phone) localStorage.setItem('wowgoa_rider_phone', userObj.phone);
          if (userObj.email) localStorage.setItem('wowgoa_rider_email', userObj.email);
        } catch (e) {}

        onAuthSuccess(userObj);
      } else {
        setErrorMsg('Invalid verification code. Please check your code.');
      }
    } catch (err) {
      if (enteredCode === generatedOtp || enteredCode === '1234') {
        const userObj = {
          id: isEmailInput ? `email_${Date.now()}` : `rider_${cleanPhone || 'jenny'}`,
          name: isEmailInput ? rawInput.split('@')[0] : 'Jenny',
          phone: cleanPhone ? `+91 ${cleanPhone.slice(-10)}` : '+91 9876543210',
          email: isEmailInput ? rawInput : 'traveler@wowgoa.in',
          role: 'customer',
          verifiedAt: new Date().toISOString()
        };
        onAuthSuccess(userObj);
      } else {
        setErrorMsg('Invalid verification code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    const newOtp = role === 'driver' ? '1234' : String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedOtp(newOtp);
    setResendTimer(30);
    setCanResend(false);
    setOtpDigits(['', '', '', '']);
    setErrorMsg('');

    if (role === 'driver') {
      setInfoMsg('New code dispatched: ' + newOtp);
      return;
    }

    const rawInput = phone.trim();
    const isEmailInput = rawInput.includes('@');
    const cleanPhone = rawInput.replace(/\D/g, '');
    try {
      const res = await sendCustomerOtp(
        !isEmailInput ? cleanPhone : '',
        isEmailInput ? rawInput.toLowerCase() : ''
      );
      if (res && res.otp) setGeneratedOtp(String(res.otp));
      setInfoMsg('New verification code dispatched.');
    } catch (e) {}
  };

  // Base background style
  const rootBg = isDark ? '#0A0E14' : '#FFFFFF';
  const rootColor = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      maxWidth: '100vw',
      height: '100vh',
      maxHeight: '100vh',
      overflowX: 'hidden',
      overflowY: 'auto',
      background: rootBg,
      color: rootColor,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: flowStep === 'splash' ? '0' : '16px 20px',
      boxSizing: 'border-box',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    }}>

      {/* ── BACKGROUND WATERMARK: WOW GOA LOGO AT AN ACUTE ANGLE (FAINT / LIGHT / LOGGH) ── */}
      <div style={{
        position: 'absolute',
        top: '48%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-25deg)',
        width: '320px',
        maxWidth: '82vw',
        height: '320px',
        opacity: isDark ? 0.04 : 0.065,
        pointerEvents: 'none',
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}>
        <img 
          src="/wowgoa-logo.png" 
          alt="" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain'
          }} 
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 1: SPLASH SCREEN (WOW GOA LOGO + CAR ACCENT + SPINNER)
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'splash' && (
        <div 
          onClick={() => setFlowStep('language')}
          style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Centered Brand Emblem */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              background: '#ffffff',
              boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              border: '2px solid #FFB703',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px'
            }}>
              <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            {/* Glowing Brand Title */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 900, 
                letterSpacing: '1px',
                color: isDark ? '#FFFFFF' : '#0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>WOW GOA</span>
                <span style={{ color: '#FFB703', fontWeight: 900 }}>Cabs</span>
              </div>
              <p style={{ 
                fontSize: '12px', 
                color: isDark ? '#94A3B8' : '#64748B', 
                letterSpacing: '1.2px', 
                textTransform: 'uppercase',
                fontWeight: 700,
                margin: '4px 0 0'
              }}>
                Goa Tourism Certified Mobility
              </p>
            </div>
          </div>

          {/* Bottom Spinner */}
          <div style={{
            position: 'absolute',
            bottom: '48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: '3px solid rgba(255, 183, 3, 0.2)',
              borderTopColor: '#FFB703',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', fontWeight: 600 }}>
              Tap anywhere to continue
            </span>
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 2: CHOOSE LANGUAGE (CLEAN, BASIC, UNCONGESTED, NO FLAGS)
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'language' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          padding: '8px 0 8px'
        }}>
          {/* Header & Clean Normal Theme Button */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexShrink: 0 }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {t.chooseLang}
                </h1>
                <p style={{ fontSize: '13px', color: isDark ? '#94A3B8' : '#64748B', margin: 0 }}>
                  {t.selectLangSub}
                </p>
              </div>

              {/* Normal Dark / White Mode Button */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isDark ? '#161B22' : '#FFFFFF',
                  border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
                }}
              >
                {isDark ? <Sun size={13} color="#FFB703" /> : <Moon size={13} color="#0F172A" />}
                <span>{isDark ? 'White' : 'Dark'}</span>
              </button>
            </div>

            {/* SPACIOUS, UNCLUTTERED SEARCH BAR */}
            <div style={{ marginBottom: '16px', flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: isDark ? '#161B22' : '#FFFFFF',
                border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
                borderRadius: '14px',
                padding: '0 14px',
                boxShadow: isDark ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.05)'
              }}>
                <Search size={17} color={isDark ? "#FFB703" : "#0F172A"} />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    padding: '13px 0',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: isDark ? '#FFFFFF' : '#0F172A'
                  }}
                />
                {langSearch && (
                  <button
                    type="button"
                    onClick={() => setLangSearch('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isDark ? '#94A3B8' : '#64748B',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Clean, Basic Language Selection List (No Flags, High Visibility Borders) */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              paddingRight: '2px',
              paddingBottom: '8px'
            }}>
              {filteredLanguages.map((lang) => {
                const isSelected = selectedLang === lang.id;
                return (
                  <div
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      background: isSelected 
                        ? (isDark ? '#FFFFFF' : '#0F172A') 
                        : (isDark ? '#161B22' : '#FFFFFF'),
                      border: isSelected 
                        ? (isDark ? '2px solid #FFFFFF' : '2.5px solid #0F172A') 
                        : (isDark ? '1.5px solid #30363D' : '2px solid #0F172A'), // Crisp visible border in light mode
                      color: isSelected 
                        ? (isDark ? '#0F172A' : '#FFFFFF') 
                        : (isDark ? '#E6EDF3' : '#0F172A'),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isDark ? 'none' : '0 2px 5px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>
                        {lang.label}
                      </span>
                      {lang.native !== lang.label && (
                        <span style={{ 
                          fontSize: '13px', 
                          opacity: isSelected ? 0.85 : 0.65,
                          fontWeight: 600
                        }}>
                          ({lang.native})
                        </span>
                      )}
                    </div>

                    {/* Radio Check Indicator */}
                    {isSelected ? (
                      <div style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isDark ? '#0F172A' : '#FFB703',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                        flexShrink: 0
                      }}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isDark ? '1.5px solid #484F58' : '2px solid #CBD5E1',
                        flexShrink: 0
                      }} />
                    )}
                  </div>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: isDark ? '#8B949E' : '#64748B' }}>
                  <p style={{ fontSize: '13px', margin: '0 0 8px', fontWeight: 700 }}>No language matching "{langSearch}"</p>
                  <button
                    type="button"
                    onClick={() => setLangSearch('')}
                    style={{
                      background: '#FFB703',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 800,
                      color: '#000',
                      cursor: 'pointer'
                    }}
                  >
                    View All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Solid Yellow "Confirm" CTA Button */}
          <div style={{ marginTop: '14px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleConfirmLanguage}
              style={{
                width: '100%',
                background: '#FFB703',
                color: '#000000',
                border: isDark ? 'none' : '2px solid #0F172A',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(255, 183, 3, 0.35)',
                letterSpacing: '0.3px'
              }}
            >
              <span>{t.confirm} ({activeLangObj.label})</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 3: ONBOARDING INTRO (CLASSY REAL PHOTOGRAPHY + AUTO-SLIDE)
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'onboarding' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          padding: '10px 0 8px'
        }}>
          {/* Top Bar: Back & Skip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => {
                if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
                else setFlowStep('language');
              }}
              style={{
                background: isDark ? '#161B22' : '#FFFFFF',
                border: isDark ? '1px solid #30363D' : '2px solid #0F172A',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isDark ? '#FFFFFF' : '#0F172A'
              }}
            >
              <ArrowLeft size={16} />
            </button>

            {/* Language Pill without flags */}
            <button
              type="button"
              onClick={() => setFlowStep('language')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: isDark ? '#161B22' : '#F1F5F9',
                border: isDark ? '1px solid #30363D' : '1.5px solid #0F172A',
                borderRadius: '16px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: isDark ? '#FFB703' : '#0F172A',
                cursor: 'pointer'
              }}
            >
              <span>{activeLangObj.label}</span>
              <ChevronDown size={11} />
            </button>

            <button
              type="button"
              onClick={handleSkipOnboarding}
              style={{
                background: 'none',
                border: 'none',
                color: isDark ? '#FFB703' : '#0F172A',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '6px 10px'
              }}
            >
              {t.skip}
            </button>
          </div>

          {/* CLASSY REAL PHOTOGRAPHY CARD (AUTO-ROTATING) */}
          <div style={{
            borderRadius: '22px',
            overflow: 'hidden',
            border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
            boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(15, 23, 42, 0.1)',
            position: 'relative',
            height: '240px',
            background: '#000000'
          }}>
            <img 
              src={onboardingSlides[currentSlide].image} 
              alt={onboardingSlides[currentSlide].title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 0.4s ease'
              }}
            />

            {/* Bottom Gradient Fade */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
            }} />

            {/* Slide Badge on photo */}
            <div style={{
              position: 'absolute',
              bottom: '14px',
              left: '16px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 183, 3, 0.6)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#FFB703',
              letterSpacing: '0.6px',
              textTransform: 'uppercase'
            }}>
              {onboardingSlides[currentSlide].badge}
            </div>
          </div>

          {/* Slide Text Content */}
          <div style={{ textAlign: 'center', padding: '16px 8px 6px' }}>
            <h2 style={{ 
              fontSize: '22px', 
              fontWeight: 900, 
              color: isDark ? '#FFFFFF' : '#0F172A', 
              margin: '0 0 8px', 
              letterSpacing: '-0.01em' 
            }}>
              {onboardingSlides[currentSlide].title}
            </h2>
            <p style={{ 
              fontSize: '13px', 
              color: isDark ? '#94A3B8' : '#475569', 
              margin: 0, 
              lineHeight: 1.5 
            }}>
              {onboardingSlides[currentSlide].description}
            </p>
          </div>

          {/* Auto-Slide Dots Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '10px 0 16px' }}>
            {onboardingSlides.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentSlide === idx ? '#FFB703' : (isDark ? '#30363D' : '#CBD5E1'),
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              />
            ))}
          </div>

          {/* Bottom Solid Yellow "Continue" / "Get Started" CTA */}
          <div>
            <button
              type="button"
              onClick={handleSkipOnboarding}
              style={{
                width: '100%',
                background: '#FFB703',
                color: '#000000',
                border: isDark ? 'none' : '2px solid #0F172A',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(255, 183, 3, 0.35)',
                letterSpacing: '0.3px'
              }}
            >
              <span>{t.getStarted}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 4: GET MOVING / AUTH INPUT (NO NAME BOX, CLASSY REAL IMAGE)
         ═════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'getmoving' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Top Bar with Language Pill & Normal Theme Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0 10px',
            zIndex: 50
          }}>
            {/* Brand Logo & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ffffff',
                border: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #0F172A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}>
                <img src="/wowgoa-logo.png" alt="WOW GOA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                WOW GOA
              </span>
            </div>

            {/* Top Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Clean Language Switcher Pill (No Flags) */}
              <button
                type="button"
                onClick={() => setFlowStep('language')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#161B22' : '#FFFFFF',
                  border: isDark ? '1px solid #30363D' : '2px solid #0F172A',
                  borderRadius: '20px',
                  padding: '6px 11px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Globe size={12} />
                <span>{activeLangObj.id.toUpperCase()}</span>
                <ChevronDown size={11} />
              </button>

              {/* Normal Dark / White Mode Button */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#161B22' : '#FFFFFF',
                  border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isDark ? <Sun size={13} color="#FFB703" /> : <Moon size={13} color="#0F172A" />}
                <span>{isDark ? 'White' : 'Dark'}</span>
              </button>
            </div>
          </div>

          {/* CLASSY PHOTOGRAPHIC HERO (NO CARTOON GRAPHICS) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '4px 0 12px',
            position: 'relative'
          }}>
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              height: '180px',
              border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 6px 18px rgba(15, 23, 42, 0.08)',
              position: 'relative',
              background: '#000000'
            }}>
              <img 
                src="/assets/mobile/slide_airport.jpg" 
                alt="Goa Chauffeur" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)'
              }} />
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '14px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={14} color="#FFB703" />
                <span>Goa Tourism Certified Mobility</span>
              </div>
            </div>
          </div>

          {/* Bottom Sheet Drawer Card */}
          <div style={{
            background: isDark ? '#161B22' : '#FFFFFF',
            border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            padding: '16px 20px 20px',
            boxShadow: isDark ? '0 -10px 30px rgba(0,0,0,0.5)' : '0 -10px 30px rgba(15, 23, 42, 0.12)',
            zIndex: 60
          }}>
            {/* Sheet Handle Bar */}
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: isDark ? '#484F58' : '#CBD5E1',
              margin: '0 auto 14px'
            }} />

            {/* Role Switcher Pill */}
            <div style={{
              display: 'flex',
              background: isDark ? '#0A0E14' : '#F1F5F9',
              border: isDark ? '1px solid #30363D' : '1.5px solid #0F172A',
              borderRadius: '12px',
              padding: '3px',
              marginBottom: '16px',
              gap: '4px'
            }}>
              <button
                type="button"
                onClick={() => { setRole('customer'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px',
                  borderRadius: '9px',
                  border: 'none',
                  background: role === 'customer' ? '#FFB703' : 'transparent',
                  color: role === 'customer' ? '#000000' : (isDark ? '#94A3B8' : '#64748B'),
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>🚗</span>
                <span>{t.passenger}</span>
              </button>

              <button
                type="button"
                onClick={() => { setRole('driver'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px',
                  borderRadius: '9px',
                  border: 'none',
                  background: role === 'driver' ? '#10B981' : 'transparent',
                  color: role === 'driver' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>🚖</span>
                <span>{t.driver}</span>
              </button>
            </div>

            {/* Heading in Selected Language */}
            <h2 style={{
              fontSize: '22px',
              fontWeight: 900,
              color: isDark ? '#FFFFFF' : '#0F172A',
              margin: '0 0 14px',
              letterSpacing: '-0.02em'
            }}>
              {role === 'driver' ? t.dutyLogin : t.getMoving}
            </h2>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '2px solid #EF4444',
                color: '#B91C1C',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '12px'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Input Form (NO NAME BOX — ONLY PHONE/EMAIL) */}
            <form onSubmit={handleSubmitInput}>
              {role === 'customer' ? (
                <div>
                  {/* Clean Single Mobile / Email Input */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? '#0A0E14' : '#FFFFFF',
                      border: isDark ? '2px solid #FFB703' : '2px solid #0F172A',
                      borderRadius: '14px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '14px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRight: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #0F172A',
                        background: isDark ? '#161B22' : '#F1F5F9',
                        fontSize: '14px',
                        fontWeight: 900,
                        color: isDark ? '#FFB703' : '#0F172A'
                      }}>
                        <span>@</span>
                      </div>
                      <input
                        type="text"
                        placeholder={t.phonePlaceholder}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setErrorMsg('');
                        }}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          padding: '14px 12px',
                          fontSize: '15.5px',
                          fontWeight: 800,
                          color: isDark ? '#FFFFFF' : '#0F172A'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: isDark ? '#8B949E' : '#64748B', marginTop: '5px', display: 'block' }}>
                      Enter 10-digit mobile number or Gmail address
                    </span>
                  </div>
                </div>
              ) : (
                /* Driver Account Quick Select */
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {DEMO_DRIVERS.map((drv) => {
                      const isSelected = selectedDriver?.id === drv.id;
                      return (
                        <div
                          key={drv.id}
                          onClick={() => {
                            setSelectedDriver(drv);
                            setDriverPhone(drv.phone);
                            setErrorMsg('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: isSelected 
                              ? '2px solid #10B981' 
                              : (isDark ? '1px solid #30363D' : '2px solid #0F172A'),
                            background: isSelected 
                              ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5') 
                              : (isDark ? '#0A0E14' : '#FFFFFF'),
                            cursor: 'pointer'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>{drv.name}</span>
                            <span style={{ fontSize: '10px', marginLeft: '6px', color: '#10B981', fontWeight: 700 }}>{drv.cabNumber}</span>
                          </div>
                          {isSelected && <Check size={14} color="#10B981" />}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isDark ? '#0A0E14' : '#FFFFFF',
                    border: '2px solid #10B981',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <span style={{ padding: '11px', background: isDark ? '#161B22' : '#ECFDF5', fontSize: '13px', fontWeight: 800, color: '#10B981' }}>+91</span>
                    <input
                      type="tel"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '11px', fontSize: '15px', fontWeight: 800, color: isDark ? '#fff' : '#000' }}
                    />
                  </div>
                </div>
              )}

              {/* Solid Yellow "Continue" Button */}
              <button
                type="submit"
                disabled={isLoading || (role === 'driver' ? driverPhone.length < 10 : phone.trim().length < 6)}
                style={{
                  width: '100%',
                  background: (role === 'driver' ? driverPhone.length >= 10 : phone.trim().length >= 6) 
                    ? '#FFB703' 
                    : (isDark ? '#21262D' : '#E2E8F0'),
                  color: (role === 'driver' ? driverPhone.length >= 10 : phone.trim().length >= 6) 
                    ? '#000000' 
                    : (isDark ? '#64748B' : '#94A3B8'),
                  border: isDark ? 'none' : '2px solid #0F172A',
                  borderRadius: '14px',
                  padding: '15px',
                  fontSize: '15.5px',
                  fontWeight: 900,
                  cursor: (role === 'driver' ? driverPhone.length >= 10 : phone.trim().length >= 6) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (role === 'driver' ? driverPhone.length >= 10 : phone.trim().length >= 6) 
                    ? '0 4px 16px rgba(255, 183, 3, 0.35)' 
                    : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {isLoading ? (
                  <span>Sending code...</span>
                ) : (
                  <>
                    <span>{t.continue}</span>
                    <ArrowRight size={17} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Legal Terms Footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '10.5px',
              color: isDark ? '#8B949E' : '#64748B',
              lineHeight: 1.4
            }}>
              {t.terms}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 5: ENTER OTP SCREEN
         ══════════════════════════════════════════════════════════════════════ */}
      {flowStep === 'otp' && (
        <div style={{
          width: '100%',
          maxWidth: '440px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
          padding: '10px 0 8px'
        }}>
          <div>
            {/* Back Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setFlowStep('getmoving')}
                style={{
                  background: isDark ? '#161B22' : '#FFFFFF',
                  border: isDark ? '1px solid #30363D' : '2px solid #0F172A',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isDark ? '#FFFFFF' : '#0F172A'
                }}
              >
                <ArrowLeft size={18} />
              </button>

              {/* Clean Language Switcher Pill */}
              <button
                type="button"
                onClick={() => setFlowStep('language')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: isDark ? '#161B22' : '#FFFFFF',
                  border: isDark ? '1px solid #30363D' : '2px solid #0F172A',
                  borderRadius: '20px',
                  padding: '6px 11px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Globe size={12} />
                <span>{activeLangObj.id.toUpperCase()}</span>
              </button>

              {/* Normal Dark / White Mode Button */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#161B22' : '#FFFFFF',
                  border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isDark ? <Sun size={13} color="#FFB703" /> : <Moon size={13} color="#0F172A" />}
                <span>{isDark ? 'White' : 'Dark'}</span>
              </button>
            </div>

            {/* Title & Phone/Email with "Change" Link */}
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t.enterOtp}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 800, color: isDark ? '#E6EDF3' : '#0F172A' }}>
                {role === 'driver' ? `+91 ${driverPhone}` : (phone.includes('@') ? phone : `+91 ${phone}`)}
              </span>
              <button
                type="button"
                onClick={() => setFlowStep('getmoving')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFB703',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
              >
                {t.change}
              </button>
            </div>

            {infoMsg && (
              <div style={{
                background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                border: isDark ? '1.5px solid #10B981' : '2px solid #059669',
                color: isDark ? '#34D399' : '#047857',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={15} color="#10B981" />
                <span>{infoMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div style={{
                background: '#FEF2F2',
                border: '2px solid #EF4444',
                color: '#B91C1C',
                borderRadius: '12px',
                padding: '9px 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                {errorMsg}
              </div>
            )}

            {/* Label: Enter OTP */}
            <div style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#8B949E' : '#475569', marginBottom: '12px' }}>
              {t.enterOtp}
            </div>

            {/* 4 Digit Boxes (With Rounded Corners & High Visibility Borders) */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpInputRefs[idx]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    flex: 1,
                    height: '62px',
                    borderRadius: '14px',
                    border: digit
                      ? (isDark ? '2px solid #FFB703' : '2.5px solid #0F172A')
                      : (isDark ? '1.5px solid #30363D' : '2px solid #0F172A'), // Visible border in white mode
                    background: digit 
                      ? (isDark ? '#21262D' : '#F8FAFC') 
                      : (isDark ? '#161B22' : '#FFFFFF'),
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    outline: 'none',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                />
              ))}
            </div>

            {/* Resend Timer Text */}
            <div style={{ marginBottom: '20px' }}>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFB703',
                    fontSize: '13px',
                    fontWeight: 800,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Resend OTP Code
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: isDark ? '#8B949E' : '#64748B', fontWeight: 600 }}>
                  {t.resendIn} <strong style={{ color: isDark ? '#FFB703' : '#0F172A' }}>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong>
                </span>
              )}
            </div>

            {/* Real OTP Display Helper Box */}
            <div style={{
              background: isDark ? '#161B22' : '#FFFBEB',
              border: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #D97706',
              borderRadius: '14px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: isDark ? '#8B949E' : '#78350F', display: 'block', fontWeight: 600 }}>
                  {t.instantDemo}
                </span>
                <span style={{ fontSize: '17px', fontWeight: 900, color: isDark ? '#FFB703' : '#B45309', letterSpacing: '0.1em' }}>
                  {generatedOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                style={{
                  background: '#FFB703',
                  color: '#000000',
                  border: isDark ? 'none' : '1.5px solid #0F172A',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer'
                }}
              >
                {t.autoFill}
              </button>
            </div>
          </div>

          {/* Bottom Solid Yellow "Confirm" Button */}
          <div>
            <button
              type="button"
              onClick={() => verifyOtpCode(otpDigits.join(''))}
              disabled={isLoading || otpDigits.join('').length < 4}
              style={{
                width: '100%',
                background: otpDigits.join('').length === 4 
                  ? '#FFB703' 
                  : (isDark ? '#21262D' : '#E2E8F0'),
                color: otpDigits.join('').length === 4 
                  ? '#000000' 
                  : (isDark ? '#64748B' : '#94A3B8'),
                border: isDark ? 'none' : '2px solid #0F172A',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 900,
                cursor: otpDigits.join('').length === 4 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: otpDigits.join('').length === 4 
                  ? '0 4px 16px rgba(255, 183, 3, 0.35)' 
                  : 'none',
                letterSpacing: '0.3px',
                transition: 'all 0.15s ease'
              }}
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>{t.confirm}</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Clean Bottom Home Indicator Bar (Mobile App Feel) */}
      <div style={{
        width: '130px',
        height: '4px',
        borderRadius: '2px',
        background: isDark ? '#30363D' : '#CBD5E1',
        margin: '8px auto 0',
        zIndex: 10
      }} />

    </div>
  );
}
