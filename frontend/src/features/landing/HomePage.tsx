import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Landmark,
  FileScan,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  ArrowRight,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Calculator,
  UserCheck,
  ExternalLink,
  Shield,
  Search,
  BookOpen,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  FileCheck2,
  Scale,
  RefreshCw,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Carousel State & Slides (Auto-cycles every 5 seconds)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const carouselSlides = [
    {
      id: 1,
      image: '/banners/slide1.jpg',
      tag: 'AICTE STATUTORY REPOSITORY',
      title: 'Institutional Security Deposit Portal',
      subtitle: 'Official tripartite repository managing Fixed Deposit Receipts & joint bank lien endorsements.',
      btnText: 'Sign In to Portal',
      btnLink: '/login',
    },
    {
      id: 2,
      image: '/banners/slide2.jpg',
      tag: 'AI OCR SCRUTINY DESK',
      title: 'Automated Bank Lien Verification',
      subtitle: 'Instant OCR document extraction, scheduled bank verification, and tripartite audit scrutiny.',
      btnText: 'Explore Scrutiny Desk',
      btnLink: '/login',
    },
    {
      id: 3,
      image: '/banners/slide3.jpg',
      tag: 'MATURITY RADAR',
      title: 'Real-Time FDR Maturity Monitoring',
      subtitle: 'Automated 90, 60 & 30-day countdown alerts, timely rollovers, and instant electronic NOC on closure.',
      btnText: 'Calculate Deposit Norms',
      btnLink: '#calculator',
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, carouselSlides.length]);

  // Quick Calculator State
  const [calcInstType, setCalcInstType] = useState('ENGG_UG');
  const [calcIntake, setCalcIntake] = useState('300');

  const calculateNorm = () => {
    const intake = parseInt(calcIntake, 10) || 0;
    if (calcInstType === 'ENGG_UG') {
      return intake > 300 ? '₹ 1,00,00,000 (1.00 Crore)' : '₹ 50,00,000 (50 Lakhs)';
    } else if (calcInstType === 'MGMT_PG') {
      return intake > 180 ? '₹ 35,00,000 (35 Lakhs)' : '₹ 25,00,000 (25 Lakhs)';
    } else if (calcInstType === 'PHARM_UG') {
      return intake > 100 ? '₹ 40,00,000 (40 Lakhs)' : '₹ 25,00,000 (25 Lakhs)';
    } else if (calcInstType === 'ARCH_UG') {
      return '₹ 35,00,000 (35 Lakhs)';
    } else {
      return '₹ 25,00,000 (25 Lakhs)';
    }
  };

  const handleRoleLogin = (email: string) => {
    navigate('/login', { state: { prefilledEmail: email } });
  };

  const faqs = [
    {
      q: 'Why must the FDR be pledged in Joint Name with Member Secretary, AICTE?',
      a: 'Under Clause 4.2 of the AICTE Approval Process Handbook (APH), technical institutions are mandated to maintain a statutory security deposit in joint name with the Member Secretary, AICTE or Regional Officer. This guarantees financial solvency, adherence to faculty salaries, student welfare safeguards, and institutional commitment without unilateral premature liquidation.',
    },
    {
      q: 'Can institutions pledge FDRs with Co-operative or Rural Regional Banks?',
      a: 'No. AICTE statutory guidelines strictly permit Fixed Deposit Receipts (FDR) issued only by Scheduled Commercial Banks (Public Sector Banks and approved Private Scheduled Commercial Banks) with valid SFMS / bank lien endorsement confirmation.',
    },
    {
      q: 'How does the automated AI-OCR Document Scrutiny work?',
      a: 'When an institution uploads an FDR certificate and bank lien endorsement letter, the built-in OCR intelligence extracts the Bank Name, FDR Serial Number, Deposit Amount, Date of Issue, Maturity Date, and checks for the mandatory joint signatory endorsement, comparing them directly against AICTE master norms.',
    },
    {
      q: 'What occurs during the 30 / 60 / 90 Days Maturity Countdown?',
      a: 'The portal continuously monitors deposit tenure. Automated multi-channel alerts (SMS, email, portal task queue) are triggered 90, 60, and 30 days before maturity, enabling the institution to submit rollover renewal receipts before any compliance lapse or penalty occurs.',
    },
    {
      q: 'How is the Security Deposit released when an institution or course closes?',
      a: 'Upon formal approval of institutional closure or program discontinuation, a Release Request is submitted. Following AICTE Audit reconciliation, student clearance verification, and Regional Director digital sign-off, a formal Lien Revocation Letter & AICTE Discharge Certificate are dispatched to the bank.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Official National Tricolor Ribbon */}
      <div className="w-full h-1 flex shadow-xs">
        <div className="w-1/3 bg-[#ff9933]"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-[#138808]"></div>
      </div>

      {/* 2. Top Sovereign Ministry Strip (Ultra-Minimal Light Theme) */}
      <div className="bg-slate-50 text-slate-500 text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto flex justify-between items-center whitespace-nowrap">
          <div className="flex items-center space-x-2">
            {/* SVG Indian Flag */}
            <svg className="w-4 h-2.5 rounded-2xs shadow-2xs shrink-0" viewBox="0 0 900 600">
              <rect width="900" height="200" fill="#FF9933" />
              <rect y="200" width="900" height="200" fill="#FFFFFF" />
              <rect y="400" width="900" height="200" fill="#138808" />
              <circle cx="450" cy="300" r="75" fill="none" stroke="#000080" strokeWidth="15" />
            </svg>
            <span className="font-bold text-slate-800 tracking-wide">Government of India</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 hidden sm:inline">Ministry of Education</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-600">AICTE Statutory Portal • Live System</span>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Bar (Proper Enterprise / GovTech Header) */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-4">
          {/* Official Emblem & Portal Branding */}
          <Link to="/" className="flex items-center space-x-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Landmark className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex flex-col whitespace-nowrap">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-slate-900 text-base sm:text-lg tracking-tight">AICTE</span>
                <span className="text-slate-300 font-light">|</span>
                <span className="font-bold text-indigo-600 text-base sm:text-lg tracking-tight">FDR PORTAL</span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium tracking-tight mt-1">
                Security Deposit Management System
              </span>
            </div>
          </Link>

          {/* Clean Desktop Navigation Menu (Guaranteed Single-Line Alignment) */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 whitespace-nowrap text-xs xl:text-sm font-semibold text-slate-600">
            <a
              href="#overview"
              className="whitespace-nowrap px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Overview
            </a>
            <a
              href="#modules"
              className="whitespace-nowrap px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              className="whitespace-nowrap px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Workflow
            </a>
            <a
              href="#calculator"
              className="whitespace-nowrap px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Norms Calculator
            </a>
            <a
              href="#roles"
              className="whitespace-nowrap px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              Role Access
            </a>
            <a
              href="#faq"
              className="whitespace-nowrap px-3 py-1.5 rounded-lg hover:text-indigo-600 hover:bg-slate-50 transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-2.5 shrink-0 whitespace-nowrap">
            <Link
              to="/login"
              className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 shadow-2xs"
            >
              Demo Access
            </Link>
            <Link
              to="/login"
              className="whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 flex items-center gap-1.5 hover:shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 space-y-3 shadow-lg">
            <a
              href="#overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 border-b border-slate-100"
            >
              Overview
            </a>
            <a
              href="#modules"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 border-b border-slate-100"
            >
              Capabilities
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 border-b border-slate-100"
            >
              Workflow
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-indigo-600 border-b border-slate-100"
            >
              Norms Calculator
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 border-b border-slate-100"
            >
              Role Access
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              FAQ
            </a>
            <div className="pt-3 flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign In to Central Portal
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 4. FULL-SIZE BACKGROUND IMAGE CAROUSEL WITH PROMINENT HEADER */}
      <section
        className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-slate-950 flex items-center justify-center border-b border-slate-200"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Full-width Background Slides */}
        {carouselSlides.map((slide, index) => {
          const isActive = currentSlide === index;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Full-size Background Image */}
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />

              {/* Crisp Gradient Overlay for High Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/45" />

              {/* Centered Banner Header & Content Card */}
              <div className="relative z-20 w-full h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
                <div className="max-w-4xl space-y-4">
                  {/* Category Pill Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-amber-300 text-xs font-bold tracking-wider shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{slide.tag}</span>
                  </div>

                  {/* Proper Large, Bold Header for the Banner */}
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] leading-tight">
                    {slide.title}
                  </h1>

                  {/* Clean Sub-header Description */}
                  <p className="text-slate-200 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-medium leading-relaxed">
                    {slide.subtitle}
                  </p>

                  {/* Prominent Action CTA Buttons */}
                  <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      to={slide.btnLink}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-xl shadow-black/50 hover:scale-105 gap-2 text-sm"
                    >
                      <Lock className="w-4 h-4 text-slate-950" />
                      {slide.btnText}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#overview"
                      className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 transition-all text-sm hover:scale-105"
                    >
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel Arrow Controls */}
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1))
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/25 transition-transform hover:scale-110 shadow-lg"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/25 transition-transform hover:scale-110 shadow-lg"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots Pagination */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
          {carouselSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-300 rounded-full ${
                currentSlide === idx
                  ? 'w-7 h-2 bg-amber-400'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Quick Demo Access Bar (Right under banner) */}
    

      {/* 5. LIVE STATS COUNTER STRIP (Clean Light Theme) */}
      <section className="bg-white py-9 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-indigo-600">
                1,280+
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
                Institutions Onboarded
              </p>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-emerald-600">
                ₹ 485+ Cr
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
                Joint FDR Security Corpus
              </p>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-600">
                99.8%
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
                AI OCR Tripartite Accuracy
              </p>
            </div>
            <div className="pt-3 md:pt-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-amber-600">
                &lt; 48 Hrs
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
                Avg. Regional Desk Scrutiny
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OVERVIEW & STATUTORY MANDATE */}
      <section id="overview" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
              <BookOpen className="w-3.5 h-3.5" />
              STATUTORY BACKGROUND &amp; PURPOSE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why Technical Institutions Pledge Security Deposits with AICTE
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Under Section 10 of the AICTE Act 1987, technical institutions seeking statutory
              approval or extension of approval (EoA) must deposit and maintain a Fixed Deposit
              Receipt (FDR) in joint name with AICTE as a statutory security reserve.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-5 font-bold">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Joint Bank Lien Mandate</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The FDR is held jointly with the <em>Member Secretary, AICTE</em> or Regional
                Officer. The bank places an irrevocable lien, preventing premature unilateral
                withdrawal by any individual party.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Student &amp; Faculty Safeguard</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Acts as a sovereign financial guarantee to secure staff salaries, academic
                commitments, laboratory maintenance, and student tuition refunds in the event of
                institutional distress.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-5 font-bold">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Rollover &amp; Release</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Replaces thousands of manual physical FDR ledgers across regional offices with
                proactive maturity reminders, digital renewals, and instant electronic NOC on
                closure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CORE CAPABILITIES (WHAT CAN BE DONE) */}
      <section id="modules" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5" />
              WHAT THIS APPLICATION ENABLES
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Comprehensive Security Deposit Lifecycle System
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Explore the end-to-end digital capabilities designed for Colleges, AICTE Scrutiny
              Officers, Regional Directors, and Statutory Auditors.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {/* Capability 1 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <FileScan className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                1. AI-Powered OCR Document Intelligence
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Institutions upload scanned FDR receipts. The embedded OCR engine parses Serial
                Number, Principal, Bank IFSC, ROI, Tenure, and compares against submitted data with
                instant discrepancy flagging.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                2. Bank Lien Verification Pipeline
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Validates tripartite bank endorsement letters. Confirms lien marked in favor of the
                Regional Officer, AICTE, with premature withdrawal prohibition clauses.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                3. 30 / 60 / 90 Days Maturity Countdown
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Prevents unrenewed deposits with an automated notification engine. Colleges receive
                timely alerts to upload fresh renewed FDR certificates before statutory expiry.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                4. Multi-Tier Governance &amp; Approvals
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Desk Scrutiny Officer verifies compliance checklist ➔ Senior Scrutiny Officer audits
                high-value deposits ➔ Regional Director executes final digital sign-off.
              </p>
            </div>

            {/* Capability 5 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                5. Norms Deficit Calculation Engine
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Computes mandatory deposit amount against approved student intake across
                disciplines. Instantly identifies and alerts colleges of any shortfall or deficit.
              </p>
            </div>

            {/* Capability 6 */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                6. Security Deposit Release &amp; NOC
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When a program closes or completes its statutory period, an online release request
                triggers institutional audit, generating an official AICTE Bank Lien Revocation
                Letter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HOW IT WORKS: END-TO-END WORKFLOW */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              STEP-BY-STEP PROCESS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How the Deposit Lifecycle Operates
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              From initial college onboarding to statutory release, experience a seamless five-phase
              digital workflow.
            </p>
          </div>

          <div className="mt-16 relative">
            {/* Connecting line for desktop */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 -translate-y-1/2 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 ring-4 ring-indigo-50">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Onboard College</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Register institution profile with AICTE Permanent ID, AISHE code, and intake
                  capacity.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 ring-4 ring-indigo-50">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Compute Norms</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Engine determines mandated FDR amount per program and flags deposit requirements.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 ring-4 ring-indigo-50">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Pledge &amp; AI-OCR</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Institution pledges joint FDR with Member Secretary and uploads certificate for
                  AI extraction.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 ring-4 ring-indigo-50">
                  4
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">AICTE Scrutiny</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Verification officer audits bank lien checklist; Regional Director digitally signs
                  approval.
                </p>
              </div>

              {/* Step 5 */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg mb-4 ring-4 ring-emerald-50">
                  5
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Monitor / Release</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Continuous maturity tracking with auto-renewal alerts or formal NOC release on
                  closure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. INTERACTIVE DEPOSIT NORMS ESTIMATOR / QUICK CALCULATOR */}
      <section id="calculator" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-bold border border-indigo-700/50">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                INSTITUTIONAL NORMS CALCULATOR
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Estimate Mandatory Security Deposit Under AICTE Norms
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Institutions can estimate their mandatory joint fixed deposit commitment based on
                discipline and approved intake capacity as outlined in the AICTE Approval Process
                Handbook.
              </p>
              <div className="pt-2 text-xs text-slate-400 space-y-1">
                <p>• Engineering &amp; Technology: ₹ 35 Lakhs to ₹ 1.00 Crore</p>
                <p>• Management &amp; MBA / PGDM: ₹ 25 Lakhs to ₹ 35 Lakhs</p>
                <p>• Pharmacy &amp; Architecture: ₹ 25 Lakhs to ₹ 40 Lakhs</p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-800/90 rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 uppercase">
                      Select Program Discipline
                    </label>
                    <select
                      value={calcInstType}
                      onChange={(e) => setCalcInstType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ENGG_UG">Engineering &amp; Technology (UG)</option>
                      <option value="MGMT_PG">Management (MBA / PGDM)</option>
                      <option value="PHARM_UG">Pharmacy (B.Pharm)</option>
                      <option value="ARCH_UG">Architecture &amp; Town Planning</option>
                      <option value="MCA_PG">Computer Applications (MCA)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 uppercase">
                      Approved Student Intake
                    </label>
                    <select
                      value={calcIntake}
                      onChange={(e) => setCalcIntake(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="120">Up to 120 Students</option>
                      <option value="240">Up to 240 Students</option>
                      <option value="300">Up to 300 Students</option>
                      <option value="600">300 to 600+ Students</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">
                      Mandated Security Deposit Pledged in Joint Name:
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1">
                      {calculateNorm()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Statutory Tenure: Minimum 5 to 8 Years with Auto-Renewal
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    Register Deposit Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. ROLE-BASED LOGIN GATEWAYS */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              <UserCheck className="w-3.5 h-3.5" />
              DIRECT ACCESS GATEWAYS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Select Your Portal Login Access
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Authorized personnel and technical institutions can access their dedicated workbench
              below:
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: College Admin */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase text-blue-700 tracking-wider mb-1">
                  Institutional Login
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Technical Colleges</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  For Deans, Principals, and College Finance Officers to register FDRs, monitor
                  deficits, and request renewals.
                </p>
              </div>
              <button
                onClick={() => handleRoleLogin('dean.ceg@annauniv.edu')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
              >
                College Login <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Scrutiny Officer */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase text-indigo-700 tracking-wider mb-1">
                  AICTE Regional Desk
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Scrutiny Officers</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  For first-level verification officers to scrutinize FDR instruments, bank lien
                  letters, and flag discrepancies.
                </p>
              </div>
              <button
                onClick={() => handleRoleLogin('ramesh.kumar@aicte-india.org')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
              >
                Scrutiny Login <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3: Approving Director */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                  <Scale className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase text-purple-700 tracking-wider mb-1">
                  Executive Approval
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Regional Director</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  For Regional Directors and Approving Authorities to review audited files and grant
                  digital sign-off.
                </p>
              </div>
              <button
                onClick={() => handleRoleLogin('director.approvals@aicte-india.org')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
              >
                Director Login <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 4: Central Admin / Auditor */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500 hover:shadow-lg transition-all group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-1">
                  Central Governance
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">Central IT &amp; Audit</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  For Central IT Super Admins, Statutory Financial Auditors, and Bank nodal
                  representatives.
                </p>
              </div>
              <button
                onClick={() => handleRoleLogin('admin@gmail.com')}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors flex items-center justify-center gap-1.5"
              >
                Admin Login <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 11. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="text-center space-y-4 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
              <HelpCircle className="w-3.5 h-3.5" />
              STATUTORY CLARIFICATIONS &amp; HELPDESK
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm">
              Answers regarding AICTE Fixed Deposit Norms, Bank Liens, and Statutory Procedures.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-500 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. GOVERNMENT-GRADE FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Landmark className="w-4 h-4 text-amber-300" />
                </div>
                <span className="font-extrabold text-white text-base">AICTE FDR PORTAL</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                National Statutory Security Deposit &amp; Fixed Deposit Lifecycle Management
                Ecosystem for approved technical institutions across India.
              </p>
              <div className="pt-2 text-slate-500 text-[11px]">
                Under the Ministry of Education, Govt. of India.
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
                Quick Navigation
              </h5>
              <ul className="space-y-2">
                <li>
                  <a href="#overview" className="hover:text-white transition-colors">
                    Statutory Mandate
                  </a>
                </li>
                <li>
                  <a href="#modules" className="hover:text-white transition-colors">
                    System Capabilities
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    FDR Lifecycle Workflow
                  </a>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-white transition-colors">
                    Norms Estimator
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors text-amber-400 font-medium">
                    Portal Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
                Statutory Guidelines
              </h5>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.aicte-india.org"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    AICTE Official Portal <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <span className="text-slate-500">Approval Process Handbook (APH)</span>
                </li>
                <li>
                  <span className="text-slate-500">Scheduled Commercial Banks Norms</span>
                </li>
                <li>
                  <span className="text-slate-500">Joint Lien Endorsement Formats</span>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
                AICTE Headquarters
              </h5>
              <div className="flex items-start space-x-2 text-slate-400">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Nelson Mandela Marg, Vasant Kunj, New Delhi, Delhi 110070
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>fdr-portal@aicte-india.org</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Helpdesk: 011-29581000 / 1050</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              © {new Date().getFullYear()} All India Council for Technical Education (AICTE). All
              Rights Reserved.
            </div>
            <div className="flex items-center space-x-4">
              <span>National Informatics Standards Compliant</span>
              <span>•</span>
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
