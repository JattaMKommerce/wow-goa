import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Phone, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, 
  Sparkles, Lock, RefreshCw, X, User, Mail, Car, Compass, ChevronDown, Check,
  Sun, Moon, Globe, MapPin, Award, Search
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
 * Comprehensive Language List for Domestic & International Goa Tourists
 */
const ALL_LANGUAGES = [
  // ── Goa Local & Domestic Tourists ──
  { id: 'en', label: 'English', native: 'English', flag: '🇬🇧', region: 'Global / Tourist Default' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'India National' },
  { id: 'kok', label: 'Konkani', native: 'कोंकणी', flag: '🌴', region: 'Goa Official Language' },
  { id: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳', region: 'Maharashtra / Goa' },
  { id: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', region: 'Gujarat (High Goa Visitors)' },
  { id: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳', region: 'West Bengal' },
  { id: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', region: 'Tamil Nadu' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', region: 'Andhra Pradesh & Telangana' },
  { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'Karnataka (Neighboring Goa)' },
  { id: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', region: 'Kerala' },
  { id: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'Punjab / North India' },
  { id: 'ur', label: 'Urdu', native: 'اردو', flag: '🇮🇳', region: 'India' },
  { id: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳', region: 'Odisha' },
  { id: 'as', label: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳', region: 'Assam / Northeast' },

  // ── International Tourists in Goa ──
  { id: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺', region: 'Morjim, Arambol & Ashwem' },
  { id: 'he', label: 'Hebrew', native: 'עִבְרִית', flag: '🇮🇱', region: 'Anjuna, Vagator & Chapora' },
  { id: 'pt', label: 'Portuguese', native: 'Português', flag: '🇵🇹', region: 'Goa Heritage & Europe' },
  { id: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪', region: 'Germany, Austria & Switzerland' },
  { id: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', region: 'France & Europe' },
  { id: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'Spain & Latin America' },
  { id: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹', region: 'Italy & Europe' },
  { id: 'ar', label: 'Arabic', native: 'العربية', flag: '🇦🇪', region: 'Middle East & Gulf Tourists' },
  { id: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵', region: 'Japan' },
  { id: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷', region: 'South Korea' },
  { id: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳', region: 'China & East Asia' }
];

/**
 * Multi-Language UI Strings for All Supported Languages
 */
const I18N = {
  en: {
    chooseLang: 'Choose Language',
    selectLangSub: 'Select your preferred language',
    searchPlaceholder: 'Search language (e.g. Russian, Hindi, Konkani)...',
    confirm: 'Confirm',
    continue: 'Continue',
    getMoving: 'Get moving with WOW GOA',
    enterOtp: 'Enter OTP',
    resendIn: 'Resend OTP in',
    change: 'Change',
    skip: 'Skip',
    passenger: 'Passenger / Rider',
    driver: 'Driver Partner',
    phonePlaceholder: 'Mobile number or Email',
    namePlaceholder: 'Passenger Name (e.g. Jenny)',
    terms: 'By continuing, you agree to the terms of service and privacy policy',
    instantDemo: 'Instant Demo Code:',
    autoFill: 'Auto-Fill',
    clarityTitle: 'CLARITY & HONEST FARES',
    clarityDesc: "Fair pricing, crystal clear. Zero hidden surge fees across Goa airport transfers and beach shuttles. Transparency is our guarantee.",
    chauffeursTitle: 'VERIFIED LOCAL DRIVERS',
    chauffeursDesc: 'Travel safely with polite, background-verified tourist chauffeurs who know every beach, airport terminal, and scenic highway detour.',
    choiceTitle: 'CABS & SELF DRIVE IN ONE APP',
    choiceDesc: 'Book point-to-point chauffeur cabs or rent Thar 4x4, Creta, Swift & Activa scooters with door-step delivery & unlimited kilometers.',
    dutyLogin: 'Chauffeur Duty Login',
    dutyDesc: 'Enter your registered driver phone number to start duty.'
  },
  hi: {
    chooseLang: 'भाषा चुनें',
    selectLangSub: 'अपनी पसंदीदा भाषा चुनें',
    searchPlaceholder: 'भाषा खोजें (उदा. हिन्दी, English)...',
    confirm: 'पुष्टि करें',
    continue: 'आगे बढ़ें',
    getMoving: 'WOW GOA के साथ यात्रा शुरू करें',
    enterOtp: 'OTP दर्ज करें',
    resendIn: 'पुनः OTP भेजें',
    change: 'बदलें',
    skip: 'छोड़ें',
    passenger: 'यात्री (Passenger)',
    driver: 'ड्राइवर पार्टनर',
    phonePlaceholder: 'मोबाइल नंबर या ईमेल',
    namePlaceholder: 'यात्री का नाम (उदा. Jenny)',
    terms: 'जारी रखकर, आप सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं',
    instantDemo: 'डेमो कोड:',
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
    getMoving: 'WOW GOA सयत प्रवास सुरू करात',
    enterOtp: 'OTP घालात',
    resendIn: 'परत धाडात',
    change: 'बदलात',
    skip: 'सोडात',
    passenger: 'प्रवासी (Rider)',
    driver: 'ड्रायव्हर पार्टनर',
    phonePlaceholder: 'मोबाईल नंबर वा ईमेल',
    namePlaceholder: 'प्रवाशाचें नांव (उदा. Jenny)',
    terms: 'फुडें वचून, तुमी सेवा अटी आनी गोपनीयता धोरणाक मान्यताय दितात',
    instantDemo: 'डेमो कोड:',
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
    selectLangSub: 'Выберите предпочтительный язык',
    searchPlaceholder: 'Поиск языка (напр. Русский, English)...',
    confirm: 'Подтвердить',
    continue: 'Продолжить',
    getMoving: 'Поехали с WOW GOA',
    enterOtp: 'Введите код из SMS',
    resendIn: 'Повторный код через',
    change: 'Изменить',
    skip: 'Пропустить',
    passenger: 'Пассажир',
    driver: 'Водитель-партнер',
    phonePlaceholder: 'Номер телефона или Email',
    namePlaceholder: 'Имя пассажира (напр. Jenny)',
    terms: 'Продолжая, вы соглашаетесь с условиями обслуживания и политикой конфиденциальности',
    instantDemo: 'Демо-код:',
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
    getMoving: 'WOW GOA सह प्रवास सुरू करा',
    enterOtp: 'OTP प्रविष्ट करा',
    resendIn: 'पुन्हा पाठवा',
    change: 'बदला',
    skip: 'वगळा',
    passenger: 'प्रवासी (Rider)',
    driver: 'चालक भागीदार',
    phonePlaceholder: 'मोबाइल क्रमांक किंवा ईमेल',
    namePlaceholder: 'प्रवाशाचे नाव (उदा. Jenny)',
    terms: 'पुढे चालू ठेवून, आपण सेवा अटी आणि गोपनीयता धोरणास सहमती दर्शवता',
    instantDemo: 'डेमो कोड:',
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
    getMoving: 'WOW GOA સાથે મુસાફરી શરૂ કરો',
    enterOtp: 'OTP દાખલ કરો',
    resendIn: 'ફરી મોકલો',
    change: 'બદલો',
    skip: 'છોડો',
    passenger: 'મુસાફર (Passenger)',
    driver: 'ડ્રાઈવર પાર્ટનર',
    phonePlaceholder: 'મોબાઇલ નંબર અથવા ઇમેઇલ',
    namePlaceholder: 'મુસાફરનું નામ (દા.ત. Jenny)',
    terms: 'ચાલુ રાખીને, તમે સેવાની શરતો અને ગોપનીયતા નીતિ સાથે સંમત થાઓ છો',
    instantDemo: 'ડેમો કોડ:',
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
    getMoving: 'Viaje com WOW GOA',
    enterOtp: 'Introduzir código OTP',
    resendIn: 'Reenviar em',
    change: 'Alterar',
    skip: 'Pular',
    passenger: 'Passageiro',
    driver: 'Motorista Parceiro',
    phonePlaceholder: 'Número de telefone ou Email',
    namePlaceholder: 'Nome do passageiro (ex. Jenny)',
    terms: 'Ao continuar, você concorda com os termos de serviço e política de privacidade',
    instantDemo: 'Código Demo:',
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
    selectLangSub: 'Wählen Sie Ihre bevorzugte Sprache',
    searchPlaceholder: 'Sprache suchen (z. B. Deutsch, English)...',
    confirm: 'Bestätigen',
    continue: 'Weiter',
    getMoving: 'Unterwegs mit WOW GOA',
    enterOtp: 'OTP-Code eingeben',
    resendIn: 'Erneut senden in',
    change: 'Ändern',
    skip: 'Überspringen',
    passenger: 'Fahrgast',
    driver: 'Fahrer-Partner',
    phonePlaceholder: 'Handynummer oder E-Mail',
    namePlaceholder: 'Name des Fahrgasts (z. B. Jenny)',
    terms: 'Wenn Sie fortfahren, stimmen Sie den Nutzungsbedingungen und der Datenschutzerklärung zu',
    instantDemo: 'Demo-Code:',
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
    getMoving: 'En route avec WOW GOA',
    enterOtp: 'Entrer le code OTP',
    resendIn: 'Renvoyer dans',
    change: 'Modifier',
    skip: 'Passer',
    passenger: 'Passager',
    driver: 'Chauffeur Partenaire',
    phonePlaceholder: 'Numéro de téléphone ou Email',
    namePlaceholder: 'Nom du passager (ex. Jenny)',
    terms: 'En continuant, vous acceptez les conditions de service et la politique de confidentialité',
    instantDemo: 'Code Démo:',
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
    getMoving: 'Muévete con WOW GOA',
    enterOtp: 'Introducir código OTP',
    resendIn: 'Reenviar en',
    change: 'Cambiar',
    skip: 'Omitir',
    passenger: 'Pasajero',
    driver: 'Conductor Asociado',
    phonePlaceholder: 'Número de móvil o Correo',
    namePlaceholder: 'Nombre del pasajero (ej. Jenny)',
    terms: 'Al continuar, aceptas los términos de servicio y la política de privacidad',
    instantDemo: 'Código Demo:',
    autoFill: 'Autollenar',
    clarityTitle: 'TARIFAS CLARAS Y HONESTAS',
    clarityDesc: 'Precios justos sin cargos ocultos para traslados desde el aeropuerto y playas de Goa.',
    chauffeursTitle: 'CONDUCTORES LOCALES VERIFICADOS',
    chauffeursDesc: 'Viaja seguro con conductores verificados que conocen todo Goa.',
    choiceTitle: 'TAXIS Y ALQUILER EN UNA APP',
    choiceDesc: 'Reserva taxis con chofer o alquila Thar 4x4 y scooters sin límites.',
    dutyLogin: 'Acceso Conductor',
    dutyDesc: 'Introduce tu teléfono registrado.'
  },
  he: {
    chooseLang: 'בחר שפה',
    selectLangSub: 'בחר את השפה המועדפת עליך',
    searchPlaceholder: 'חיפוש שפה (לדוגמה עברית, English)...',
    confirm: 'אישור',
    continue: 'המשך',
    getMoving: 'מתחילים לנסוע עם WOW GOA',
    enterOtp: 'הזן קוד OTP',
    resendIn: 'שליחה חוזרת בעוד',
    change: 'שנה',
    skip: 'דלג',
    passenger: 'נוסע (Rider)',
    driver: 'נהג שותף',
    phonePlaceholder: 'מספר טלפון או אימייל',
    namePlaceholder: 'שם הנוסע (לדוגמה Jenny)',
    terms: 'בהמשך השימוש הינך מסכים לתנאי השירות ומדיניות הפרטיות',
    instantDemo: 'קוד הדגמה:',
    autoFill: 'מילוי אוטומטי',
    clarityTitle: 'מחירים ברורים והוגנים',
    clarityDesc: 'מחירים קבועים ללא תוספות נסתרות עבור נסיעות משדה התעופה וחופי גואה.',
    chauffeursTitle: 'נהגים מקומיים מאומתים',
    chauffeursDesc: 'נסיעה בטוחה עם נהגי גואה מוסמכים המכירים כל חוף ודרך נופית.',
    choiceTitle: 'מוניות והשכרת רכב באפליקציה אחת',
    choiceDesc: 'הזמן מונית עם נהג או השכר ג׳יפ תאר 4x4 וקטנועים בקלות.',
    dutyLogin: 'כניסת נהג',
    dutyDesc: 'הזן מספר טלפון כדי להתחיל משמרת.'
  },
  ar: {
    chooseLang: 'اختر اللغة',
    selectLangSub: 'حدد لغتك المفضلة',
    searchPlaceholder: 'ابحث عن لغة (مثال: العربية, English)...',
    confirm: 'تأكيد',
    continue: 'متابعة',
    getMoving: 'انطلق مع WOW GOA',
    enterOtp: 'أدخل رمز التحقق',
    resendIn: 'إعادة الإرسال خلال',
    change: 'تغيير',
    skip: 'تخطي',
    passenger: 'الراكب',
    driver: 'سائق شريك',
    phonePlaceholder: 'رقم الهاتف أو البريد',
    namePlaceholder: 'اسم الراكب (مثال Jenny)',
    terms: 'بالمتابعة فإنك توافق على شروط الخدمة وسياسة الخصوصية',
    instantDemo: 'رمز تجريبي:',
    autoFill: 'تعبئة تلقائية',
    clarityTitle: 'أسعار واضحة وموثوقة',
    clarityDesc: 'أسعار عادلة دون رسوم خفية لتنقلات مطار غوا والشواطئ.',
    chauffeursTitle: 'سائقون محليون معتمدون',
    chauffeursDesc: 'سافر بأمان مع سائقين موثوقين من أهل غوا.',
    choiceTitle: 'سيارات أجرة وتأجير في تطبيق واحد',
    choiceDesc: 'احجز تاكسي بسائق أو استأجر سيارات ثار 4x4 ودراجات.',
    dutyLogin: 'تسجيل دخول السائق',
    dutyDesc: 'أدخل رقم هاتفك لبدء الخدمة.'
  },
  bn: {
    chooseLang: 'ভাষা নির্বাচন করুন',
    selectLangSub: 'আপনার পছন্দের ভাষা নির্বাচন করুন',
    searchPlaceholder: 'ভাষা খুঁজুন (যেমন বাংলা, English)...',
    confirm: 'নিশ্চিত করুন',
    continue: 'এগিয়ে যান',
    getMoving: 'WOW GOA-এর সাথে যাত্রা শুরু করুন',
    enterOtp: 'OTP কোড লিখুন',
    resendIn: 'পুনরায় পাঠান',
    change: 'পরিবর্তন',
    skip: 'এড়িয়ে যান',
    passenger: 'যাত্রী',
    driver: 'চালক সঙ্গী',
    phonePlaceholder: 'মোবাইল নম্বর বা ইমেল',
    namePlaceholder: 'যাত্রীর নাম (যেমন Jenny)',
    terms: 'চালিয়ে গিয়ে, আপনি পরিষেবার শর্তাবলী এবং গোপনীয়তা নীতিতে সম্মত হচ্ছেন',
    instantDemo: 'ডেমো কোড:',
    autoFill: 'স্বয়ংক্রিয়ভাবে পূরণ',
    clarityTitle: 'স্বচ্ছ ও ন্যায্য ভাড়া',
    clarityDesc: 'গোয়ার বিমানবন্দর ও সমস্ত সৈকতের জন্য কোনও লুকানো চার্জ ছাড়া ন্যায্য ভাড়া।',
    chauffeursTitle: 'যাচাইকৃত স্থানীয় চালক',
    chauffeursDesc: 'বিশ্বস্ত গোয়ার স্থানীয় চালকদের সাথে নিরাপদ ভ্রমণ।',
    choiceTitle: 'ট্যাক্সি এবং সেলফ ড্রাইভ এক অ্যাপে',
    choiceDesc: 'ট্যাক্সি বুক করুন বা থার 4x4, সুইফ্ট এবং স্কুটার ভাড়া নিন।'
  },
  ta: {
    chooseLang: 'மொழியைத் தேர்ந்தெடுக்கவும்',
    selectLangSub: 'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
    searchPlaceholder: 'மொழியைத் தேடுங்கள் (எ.கா. தமிழ், English)...',
    confirm: 'உறுதிப்படுத்து',
    continue: 'தொடரவும்',
    getMoving: 'WOW GOA உடன் பயணிக்கவும்',
    enterOtp: 'OTP ஐ உள்ளிடவும்',
    resendIn: 'மீண்டும் அனுப்ப',
    change: 'மாற்று',
    skip: 'தவிர்',
    passenger: 'பயணி (Passenger)',
    driver: 'ஓட்டுநர் கூட்டாளர்',
    phonePlaceholder: 'மொபைல் எண் அல்லது மின்னஞ்சல்',
    namePlaceholder: 'பயணியின் பெயர் (எ.கா. Jenny)',
    terms: 'தொடர்வதன் மூலம், விதிமுறைகள் மற்றும் தனியுரிமைக் கொள்கையை ஏற்கிறீர்கள்',
    instantDemo: 'டெமோ குறியீடு:',
    autoFill: 'தானாக நிரப்பு',
    clarityTitle: 'வெளிப்படையான கட்டணம்',
    clarityDesc: 'கோவா விமான நிலையம் மற்றும் கடற்கரைகளுக்கு மறைமுக கட்டணங்கள் இல்லாத நியாயமான விலை.',
    chauffeursTitle: 'சரிபார்க்கப்பட்ட ஓட்டுநர்கள்',
    chauffeursDesc: 'கோவாவின் அனைத்து வழிகளையும் அறிந்த நம்பகமான ஓட்டுநர்களுடன் பாதுகாப்பான பயணம்.',
    choiceTitle: 'டாக்ஸி மற்றும் சுய ஓட்டுதல்',
    choiceDesc: 'டாக்ஸி முன்பதிவு செய்யுங்கள் அல்லது தார் 4x4 மற்றும் ஸ்கூட்டர்களை வாடகைக்கு எடுங்கள்.'
  },
  te: {
    chooseLang: 'భాషను ఎంచుకోండి',
    selectLangSub: 'మీకు కావలసిన భాషను ఎంచుకోండి',
    searchPlaceholder: 'భాషను శోధించండి (ఉదా. తెలుగు, English)...',
    confirm: 'నిర్ధారించండి',
    continue: 'కొనసాగించండి',
    getMoving: 'WOW GOAతో ప్రయాణం ప్రారంభించండి',
    enterOtp: 'OTP నమోదు చేయండి',
    resendIn: 'మళ్లీ పంపండి',
    change: 'మార్చండి',
    skip: 'వదిలేయండి',
    passenger: 'ప్రయాణీకుడు (Rider)',
    driver: 'డ్రైవర్ భాగస్వామి',
    phonePlaceholder: 'మొబైల్ నంబర్ లేదా ఇమెయిల్',
    namePlaceholder: 'ప్రయాణీకుడి పేరు (ఉదా. Jenny)',
    terms: 'కొనసాగడం ద్వారా, మీరు సేవా నిబంధనలు మరియు గోప్యతా విధానానికి అంగీకరిస్తున్నారు',
    instantDemo: 'డెమో కోড:',
    autoFill: 'ఆటో ఫిల్',
    clarityTitle: 'స్పష్టమైన మరియు న్యాయమైన ఛార్జీలు',
    clarityDesc: 'గోవా విమానాశ్రయం మరియు బీచ్‌లకు ఎలాంటి దాచిన ఛార్జీలు లేని సరసమైన ఛార్జీలు.',
    chauffeursTitle: 'ధృవీకరించబడిన స్థానిక డ్రైవర్లు',
    chauffeursDesc: 'గోవాలోని అన్ని మార్గాలు తెలిసిన విశ్వసనీయ డ్రైవర్లతో సురక్షిత ప్రయాణం.',
    choiceTitle: 'టాక్సీ మరియు సెల్ఫ్ డ్రైవ్ ఒకే యాప్‌లో',
    choiceDesc: 'టాక్సీ బుక్ చేయండి లేదా థార్ 4x4 మరియు స్కూటర్లను అద్దెకు తీసుకోండి.'
  },
  kn: {
    chooseLang: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    selectLangSub: 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    searchPlaceholder: 'ಭಾಷೆ ಹುಡುಕಿ (ಉದಾ. ಕನ್ನಡ, English)...',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    continue: 'ಮುಂದುವರಿಯಿರಿ',
    getMoving: 'WOW GOA ಜೊತೆಗೆ ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ',
    enterOtp: 'OTP ನಮೂದಿಸಿ',
    resendIn: 'ಮತ್ತೆ ಕಳುಹಿಸಿ',
    change: 'ಬದಲಾಯಿಸಿ',
    skip: 'ಬಿಟ್ಟುಬಿಡಿ',
    passenger: 'ಪ್ರಯಾಣಿಕ (Rider)',
    driver: 'ಚಾಲಕ ಪಾಲುದಾರ',
    phonePlaceholder: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್',
    namePlaceholder: 'ಪ್ರಯಾಣಿಕರ ಹೆಸರು (ಉದಾ. Jenny)',
    terms: 'ಮುಂದುವರಿಯುವ ಮೂಲಕ, ನೀವು ಸೇವಾ ನಿಯಮಗಳು ಮತ್ತು ಗೌಪ್ಯತಾ ನೀತಿಯನ್ನು ಒಪ್ಪುತ್ತೀರಿ',
    instantDemo: 'ಡೆಮೊ ಕೋಡ್:',
    autoFill: 'ಸ್ವಯಂ ಭರ್ತಿ',
    clarityTitle: 'ಪಾರದರ್ಶಕ ಮತ್ತು ಪ್ರಾಮಾಣಿಕ ದರಗಳು',
    clarityDesc: 'ಗೋವಾ ವಿಮಾನ ನಿಲ್ದಾಣ ಮತ್ತು ಬೀಚ್‌ಗಳಿಗೆ ಯಾವುದೇ ಗುಪ್ತ ಶುಲ್ಕಗಳಿಲ್ಲದ ಪ್ರಾಮಾಣಿಕ ದರಗಳು.',
    chauffeursTitle: 'ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳೀಯ ಚಾಲಕರು',
    chauffeursDesc: 'ಗೋವಾದ ಎಲ್ಲಾ ರಸ್ತೆಗಳನ್ನು ತಿಳಿದಿರುವ ವಿಶ್ವಾಸಾರ್ಹ ಚಾಲಕರೊಂದಿಗೆ ಸುರಕ್ಷಿತ ಪ್ರಯಾಣ.',
    choiceTitle: 'ಟ್ಯಾಕ್ಸಿ ಮತ್ತು ಸೆಲ್ಫ್ ಡ್ರೈವ್ ಒಂದೇ ಆ್ಯಪ್‌ನಲ್ಲಿ',
    choiceDesc: 'ಟ್ಯಾಕ್ಸಿ ಬುಕ್ ಮಾಡಿ ಅಥವಾ ಥಾರ್ 4x4 ಮತ್ತು ಸ್ಕೂಟರ್‌ಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ.'
  },
  ml: {
    chooseLang: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    selectLangSub: 'നിങ്ങളുടെ ഇഷ്ടപ്പെട്ട ഭാഷ തിരഞ്ഞെടുക്കുക',
    searchPlaceholder: 'ഭാഷ തിരയുക (ഉദാ. മലയാളം, English)...',
    confirm: 'സ്ഥിരീകരിക്കുക',
    continue: 'തുടരുക',
    getMoving: 'WOW GOA യോടൊപ്പം യാത്ര ചെയ്യൂ',
    enterOtp: 'OTP നൽകുക',
    resendIn: 'വീണ്ടും അയക്കുക',
    change: 'മാറ്റുക',
    skip: 'ഒഴിവാക്കുക',
    passenger: 'യാത്രക്കാരൻ',
    driver: 'ഡ്രൈവർ പങ്കാളി',
    phonePlaceholder: 'മൊബൈൽ നമ്പർ അല്ലെങ്കിൽ ഇമെയിൽ',
    namePlaceholder: 'യാത്രക്കാരന്റെ പേര് (ഉദാ. Jenny)',
    terms: 'തുടരുന്നതിലൂടെ, നിങ്ങൾ സേവന നിబంధനകളും സ്വകാര്യതാ നയവും അംഗീകരിക്കുന്നു',
    instantDemo: 'ഡെമോ കോഡ്:',
    autoFill: 'ഓട്ടോ ഫിൽ',
    clarityTitle: 'സുതാര്യവും ന്യായവുമായ നിരക്കുകൾ',
    clarityDesc: 'ഗോവ വിമാനത്താവളത്തിലേക്കും ബീച്ചുകളിലേക്കും മറഞ്ഞിരിക്കുന്ന നിരക്കുകളില്ലാത്ത ന്യായമായ നിരക്കുകൾ.',
    chauffeursTitle: 'പരിശോധിച്ചുറപ്പിച്ച പ്രാദേശിക ഡ്രൈവർമാർ',
    chauffeursDesc: 'ഗോവയിലെ എല്ലാ വഴികളും അറിയാവുന്ന വിശ്വസ്തരായ ഡ്രൈവർമാരോടൊപ്പം സുരക്ഷിത യാത്ര.',
    choiceTitle: 'ടാക്സിയും സെൽഫ് ഡ്രൈവും ഒരൊറ്റ ആപ്പിൽ',
    choiceDesc: 'ടാക്സി ബുക്ക് ചെയ്യുക അല്ലെങ്കിൽ താർ 4x4, സ്കൂട്ടറുകൾ വാടകയ്‌ക്കെടുക്കുക.'
  }
};

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

  // Dynamically filter languages based on tourist search query
  const filteredLanguages = useMemo(() => {
    const query = langSearch.trim().toLowerCase();
    if (!query) return ALL_LANGUAGES;
    return ALL_LANGUAGES.filter(lang => 
      lang.label.toLowerCase().includes(query) ||
      lang.native.toLowerCase().includes(query) ||
      lang.region.toLowerCase().includes(query) ||
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

  // Role: 'customer' (Passenger/Rider) | 'driver' (Chauffeur Partner)
  const [role, setRole] = useState('customer');

  // Auth method: 'phone' | 'email'
  const [authMethod, setAuthMethod] = useState('phone');
  
  // Passenger fields
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('Jenny'); // Default Jenny
  
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

  // Dynamic Onboarding Slides using selected language
  const onboardingSlides = [
    {
      id: 'clarity',
      badge: 'ZERO SURGE PROMISE',
      title: t.clarityTitle,
      description: t.clarityDesc,
      themeColor: '#FFB703'
    },
    {
      id: 'chauffeurs',
      badge: 'GOA TOURISM CERTIFIED',
      title: t.chauffeursTitle,
      description: t.chauffeursDesc,
      themeColor: '#10B981'
    },
    {
      id: 'choice',
      badge: 'ALL-IN-ONE MOBILITY',
      title: t.choiceTitle,
      description: t.choiceDesc,
      themeColor: '#3B82F6'
    }
  ];

  // Handle Onboarding Next
  const handleNextOnboarding = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      try {
        localStorage.setItem('wowgoa_onboarded_completed', 'true');
      } catch (e) {}
      setFlowStep('getmoving');
    }
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

    // Customer
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    if (authMethod === 'email') {
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setErrorMsg('Please enter a valid Gmail or Email address.');
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
        authMethod === 'phone' ? cleanPhone : '',
        authMethod === 'email' ? cleanEmail : ''
      );

      if (res && res.otp) {
        setGeneratedOtp(String(res.otp));
      }

      setInfoMsg(authMethod === 'email' 
        ? `4-digit code sent to ${cleanEmail}` 
        : `4-digit code sent to +91 ${cleanPhone}`);

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
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();

    try {
      let isSuccess = false;
      let returnedCust = null;

      if (enteredCode === generatedOtp || enteredCode === '1234' || enteredCode === '4821') {
        isSuccess = true;
      } else {
        const verifyRes = await verifyCustomerOtp(
          authMethod === 'phone' ? cleanPhone : '',
          authMethod === 'email' ? cleanEmail : '',
          enteredCode
        );
        if (verifyRes && verifyRes.success) {
          isSuccess = true;
          returnedCust = verifyRes.customer;
        }
      }

      if (isSuccess) {
        const userObj = {
          id: returnedCust?.id || (authMethod === 'email' ? `email_${Date.now()}` : `rider_${cleanPhone || 'jenny'}`),
          name: fullName.trim() || returnedCust?.name || (authMethod === 'email' ? cleanEmail.split('@')[0] : 'Jenny'),
          phone: cleanPhone ? `+91 ${cleanPhone.slice(-10)}` : (returnedCust?.phone || '+91 9876543210'),
          email: cleanEmail || returnedCust?.email || 'jenny@example.com',
          authMethod: authMethod === 'email' ? 'gmail_otp' : 'phone_otp',
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
          id: authMethod === 'email' ? `email_${Date.now()}` : `rider_${cleanPhone || 'jenny'}`,
          name: fullName.trim() || 'Jenny',
          phone: cleanPhone ? `+91 ${cleanPhone.slice(-10)}` : '+91 9876543210',
          email: cleanEmail || 'jenny@example.com',
          authMethod: authMethod === 'email' ? 'gmail_otp' : 'phone_otp',
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

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await sendCustomerOtp(
        authMethod === 'phone' ? cleanPhone : '',
        authMethod === 'email' ? cleanEmail : ''
      );
      if (res && res.otp) setGeneratedOtp(String(res.otp));
      setInfoMsg('New verification code dispatched.');
    } catch (e) {}
  };

  // Base background style
  const rootBg = isDark ? '#0F1216' : '#FFFFFF';
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

      {/* ── BACKGROUND WATERMARK: WOW GOA LOGO AT AN ACUTE ANGLE (LOGGH / FAINT) ── */}
      <div style={{
        position: 'absolute',
        top: '48%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-25deg)',
        width: '320px',
        maxWidth: '82vw',
        height: '320px',
        opacity: isDark ? 0.05 : 0.075,
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

            {/* Glowing Brand Title with Car Accent */}
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

          {/* Bottom Spinner / Loading Arc */}
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
          SCREEN 2: CHOOSE LANGUAGE (ALL LANGUAGES + TOURIST SEARCH BAR)
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
          {/* Top Header & Normal Theme Button */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  {t.chooseLang}
                </h1>
                <p style={{ fontSize: '12.5px', color: isDark ? '#94A3B8' : '#475569', margin: 0 }}>
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
                  gap: '5px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1.5px solid #475569' : '2px solid #0F172A',
                  borderRadius: '8px',
                  padding: '7px 11px',
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

            {/* 🔍 SEARCH BAR FOR TOURISTS (HIGH CONTRAST & VISIBLE) */}
            <div style={{ marginBottom: '12px', flexShrink: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isDark ? '#161B22' : '#FFFFFF',
                border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A', // Crisp visible border in light mode
                borderRadius: '14px',
                padding: '0 12px',
                boxShadow: isDark ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.06)'
              }}>
                <Search size={16} color={isDark ? "#FFB703" : "#0F172A"} />
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
                    padding: '11px 0',
                    fontSize: '13.5px',
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
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Language Count Hint */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              fontSize: '11px', 
              fontWeight: 700, 
              color: isDark ? '#8B949E' : '#64748B', 
              marginBottom: '8px',
              padding: '0 2px',
              flexShrink: 0
            }}>
              <span>{filteredLanguages.length} Languages Available</span>
              <span style={{ color: '#FFB703' }}>Tourist &amp; Local Friendly</span>
            </div>

            {/* Scrollable Language Selection List (25+ Languages) */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
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
                      padding: '12px 14px',
                      borderRadius: '13px',
                      background: isSelected 
                        ? (isDark ? '#FFFFFF' : '#0F172A') 
                        : (isDark ? '#161B22' : '#FFFFFF'),
                      border: isSelected 
                        ? (isDark ? '2px solid #FFFFFF' : '2.5px solid #0F172A') 
                        : (isDark ? '1.5px solid #30363D' : '2px solid #0F172A'), // Visible borders in light mode
                      color: isSelected 
                        ? (isDark ? '#0F172A' : '#FFFFFF') 
                        : (isDark ? '#E6EDF3' : '#0F172A'),
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      boxShadow: isDark ? 'none' : '0 2px 5px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 800 }}>
                            {lang.label}
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            opacity: isSelected ? 0.9 : 0.65,
                            fontWeight: 700
                          }}>
                            · {lang.native}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '10.5px', 
                          opacity: isSelected ? 0.8 : 0.55, 
                          fontWeight: 600,
                          marginTop: '1px'
                        }}>
                          {lang.region}
                        </div>
                      </div>
                    </div>

                    {/* Check Circle Icon */}
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
                  <p style={{ fontSize: '13px', margin: '0 0 6px', fontWeight: 700 }}>No language matching "{langSearch}"</p>
                  <button
                    type="button"
                    onClick={() => setLangSearch('')}
                    style={{
                      background: '#FFB703',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: '#000',
                      cursor: 'pointer'
                    }}
                  >
                    View All Languages
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Solid Yellow "Confirm" CTA Button */}
          <div style={{ marginTop: '12px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleConfirmLanguage}
              style={{
                width: '100%',
                background: '#FFB703',
                color: '#000000',
                border: isDark ? 'none' : '2px solid #0F172A',
                borderRadius: '16px',
                padding: '15px',
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
          SCREEN 3: ONBOARDING INTRO (Clarity / Trust / Carousel with Illustration)
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
          {/* Top Nav: Back & Skip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => {
                if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
                else setFlowStep('language');
              }}
              style={{
                background: isDark ? '#1E293B' : '#FFFFFF',
                border: isDark ? '1px solid #475569' : '2px solid #0F172A',
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

            {/* Active Language Badge */}
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
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 700,
                color: isDark ? '#FFB703' : '#0F172A',
                cursor: 'pointer'
              }}
            >
              <span>{activeLangObj.flag}</span>
              <span>{activeLangObj.label}</span>
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

          {/* Illustration Card (Modern Goa Cab Vector) */}
          <div style={{
            background: isDark ? '#161B22' : '#F8FAFC',
            border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
            borderRadius: '24px',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(15, 23, 42, 0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Scenic Vector Graphic */}
            <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Road / Curve */}
              <path d="M10 135 C 70 135, 110 110, 210 110" stroke={isDark ? "#30363D" : "#CBD5E1"} strokeWidth="4" strokeDasharray="6 6" />
              {/* Palm Tree Outline (Goa Vibe) */}
              <path d="M185 105 Q188 70 180 40 Q175 42 165 48 M180 40 Q192 35 205 45 M180 40 Q185 25 180 15" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              {/* Modern Goa Cab Body */}
              <rect x="35" y="70" width="130" height="42" rx="12" fill="#FFB703" />
              {/* Cab Roof */}
              <path d="M60 70 L75 44 L125 44 L145 70 Z" fill="#000000" opacity={isDark ? "0.9" : "0.85"} />
              {/* Windows */}
              <path d="M78 48 L100 48 L100 66 L68 66 Z" fill="#FFFFFF" opacity="0.8" />
              <path d="M104 48 L122 48 L138 66 L104 66 Z" fill="#FFFFFF" opacity="0.8" />
              {/* Wheels */}
              <circle cx="65" cy="112" r="13" fill="#1E293B" stroke="#FFB703" strokeWidth="3" />
              <circle cx="135" cy="112" r="13" fill="#1E293B" stroke="#FFB703" strokeWidth="3" />
              {/* Taxi Roof Light */}
              <rect x="92" y="38" width="22" height="7" rx="3" fill="#000000" stroke="#FFB703" strokeWidth="1.5" />
              {/* GPS Pin */}
              <g transform="translate(100, 5)">
                <circle cx="10" cy="10" r="9" fill="#EF4444" />
                <circle cx="10" cy="10" r="3.5" fill="#FFFFFF" />
              </g>
            </svg>

            {/* Slide Badge */}
            <div style={{
              marginTop: '12px',
              background: isDark ? 'rgba(255, 183, 3, 0.15)' : '#FEF3C7',
              border: isDark ? '1px solid rgba(255, 183, 3, 0.4)' : '1.5px solid #D97706',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '10.5px',
              fontWeight: 800,
              color: isDark ? '#FFB703' : '#B45309',
              letterSpacing: '0.6px',
              textTransform: 'uppercase'
            }}>
              {onboardingSlides[currentSlide].badge}
            </div>
          </div>

          {/* Slide Text Content in Active Language */}
          <div style={{ textAlign: 'center', padding: '16px 8px 8px' }}>
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

          {/* Dots Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-center', gap: '8px', margin: '12px 0 16px' }}>
            {onboardingSlides.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: currentSlide === idx ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentSlide === idx ? '#FFB703' : (isDark ? '#30363D' : '#CBD5E1'),
                  transition: 'all 0.25s ease'
                }}
              />
            ))}
          </div>

          {/* Bottom Solid Yellow "Continue" CTA */}
          <div>
            <button
              type="button"
              onClick={handleNextOnboarding}
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
              <span>{currentSlide === onboardingSlides.length - 1 ? t.confirm : t.continue}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN 4: GET MOVING / AUTH INPUT (Bottom Sheet Style in Selected Language)
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
              {/* Dynamic Tourist Language Switcher Pill */}
              <button
                type="button"
                onClick={() => setFlowStep('language')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1px solid #475569' : '2px solid #0F172A',
                  borderRadius: '20px',
                  padding: '6px 10px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>{activeLangObj.flag}</span>
                <span>{activeLangObj.id.toUpperCase()}</span>
                <Globe size={12} />
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
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1.5px solid #475569' : '2px solid #0F172A',
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

          {/* Hero Artwork Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 0',
            position: 'relative'
          }}>
            {/* Sleek Vector Car & Map Pin Scene */}
            <svg width="240" height="130" viewBox="0 0 240 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="80" y="8" width="80" height="110" rx="10" fill={isDark ? "#1E293B" : "#E2E8F0"} opacity="0.6" />
              <path d="M85 35 L120 50 L155 30" stroke="#FFB703" strokeWidth="2.5" strokeDasharray="3 3" />
              <circle cx="120" cy="50" r="12" fill="#3B82F6" />
              <circle cx="120" cy="50" r="5" fill="#FFFFFF" />
              
              <rect x="30" y="65" width="180" height="42" rx="12" fill="#1D4ED8" />
              <path d="M60 65 L80 40 L160 40 L185 65 Z" fill="#1E40AF" />
              <path d="M84 44 L118 44 L118 62 L70 62 Z" fill="#93C5FD" opacity="0.8" />
              <path d="M122 44 L154 44 L172 62 L122 62 Z" fill="#93C5FD" opacity="0.8" />
              <circle cx="65" cy="107" r="14" fill="#0F172A" stroke="#94A3B8" strokeWidth="3" />
              <circle cx="175" cy="107" r="14" fill="#0F172A" stroke="#94A3B8" strokeWidth="3" />
              <rect x="200" y="75" width="8" height="6" rx="2" fill="#FEF08A" />
            </svg>
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
              background: isDark ? '#0F1216' : '#F1F5F9',
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

            {/* Input Form */}
            <form onSubmit={handleSubmitInput}>
              {role === 'customer' ? (
                <div>
                  {/* Phone / Email Input with Gold Focus Border */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? '#0D1117' : '#FFFFFF',
                      border: isDark ? '2px solid #FFB703' : '2px solid #0F172A',
                      borderRadius: '14px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '13px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        borderRight: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #0F172A',
                        background: isDark ? '#161B22' : '#F1F5F9',
                        fontSize: '14px',
                        fontWeight: 900,
                        color: isDark ? '#FFB703' : '#0F172A'
                      }}>
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder={t.phonePlaceholder}
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, ''));
                          setErrorMsg('');
                        }}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          padding: '13px 12px',
                          fontSize: '16px',
                          fontWeight: 800,
                          color: isDark ? '#FFFFFF' : '#0F172A'
                        }}
                      />
                    </div>
                  </div>

                  {/* Passenger Name Input */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDark ? '#0D1117' : '#FFFFFF',
                      border: isDark ? '1.5px solid #30363D' : '2px solid #0F172A',
                      borderRadius: '12px',
                      padding: '0 12px'
                    }}>
                      <User size={15} color={isDark ? "#94A3B8" : "#475569"} />
                      <input
                        type="text"
                        placeholder={t.namePlaceholder}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        style={{
                          flex: 1,
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          padding: '10px 8px',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: isDark ? '#FFFFFF' : '#0F172A'
                        }}
                      />
                    </div>
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
                              : (isDark ? '#0D1117' : '#FFFFFF'),
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
                    background: isDark ? '#0D1117' : '#FFFFFF',
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
                disabled={isLoading || (role === 'driver' ? driverPhone.length < 10 : phone.length < 10)}
                style={{
                  width: '100%',
                  background: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) 
                    ? '#FFB703' 
                    : (isDark ? '#21262D' : '#E2E8F0'),
                  color: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) 
                    ? '#000000' 
                    : (isDark ? '#64748B' : '#94A3B8'),
                  border: isDark ? 'none' : '2px solid #0F172A',
                  borderRadius: '14px',
                  padding: '15px',
                  fontSize: '15.5px',
                  fontWeight: 900,
                  cursor: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: (role === 'driver' ? driverPhone.length >= 10 : phone.length >= 10) 
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
          SCREEN 5: ENTER OTP SCREEN (In Selected Language with Visible Borders)
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
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1px solid #475569' : '2px solid #0F172A',
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

              {/* Dynamic Tourist Language Switcher Pill */}
              <button
                type="button"
                onClick={() => setFlowStep('language')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1px solid #475569' : '2px solid #0F172A',
                  borderRadius: '20px',
                  padding: '6px 10px',
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <span>{activeLangObj.flag}</span>
                <span>{activeLangObj.id.toUpperCase()}</span>
                <Globe size={12} />
              </button>

              {/* Normal Dark / White Mode Button */}
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: isDark ? '1.5px solid #475569' : '2px solid #0F172A',
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

            {/* Title & Phone with "Change" Link (Translated) */}
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {t.enterOtp}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span style={{ fontSize: '16px' }}>🇮🇳</span>
              <span style={{ fontSize: '14.5px', fontWeight: 800, color: isDark ? '#E6EDF3' : '#0F172A' }}>
                {role === 'driver' ? `+91 ${driverPhone}` : `+91 ${phone || '9876543210'}`}
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

            {/* 1-Tap Demo OTP Helper */}
            <div style={{
              background: isDark ? '#161B22' : '#FFFBEB',
              border: isDark ? '1.5px solid rgba(255, 183, 3, 0.4)' : '2px solid #D97706',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: isDark ? '#8B949E' : '#78350F', display: 'block', fontWeight: 600 }}>
                  {t.instantDemo}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 900, color: isDark ? '#FFB703' : '#B45309', letterSpacing: '0.08em' }}>
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
        background: isDark ? '#484F58' : '#CBD5E1',
        margin: '8px auto 0',
        zIndex: 10
      }} />

    </div>
  );
}
