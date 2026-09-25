import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Stethoscope,
  ArrowRight,
  Shield,
  Award,
  Check,
  Building2,
  HeartPulse,
  HeartHandshake,
  Sparkles,
  Calendar,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { CambodiaFlag, UsFlag } from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

const BRAND_LOGO_SRC = '/images/logo.png'
const HERO_DOCTOR_SRC = '/images/hero-doctor.png'
const ABOUT_DOCTOR_SRC = '/images/about-doctor.png'

export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const pageRef = useRef(null)

  // Carousel slide index (default slide 1)
  const [activeSlide, setActiveSlide] = useState(1)
  const [scrolled, setScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langMenuRef = useRef(null)

  // Track scroll position for navbar background blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close language menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStart = () => {
    if (pageRef.current) pageRef.current.style.opacity = '0'
    const target = user ? '/dashboard' : '/login'
    setTimeout(() => navigate(target), 400)
  }

  const handleGuide = () => {
    navigate('/guide')
  }

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Hero carousel contents based on active slide
  const heroContent = [
    {
      id: 1,
      tag: t('landing.heroTag') || 'Norton University · Clinical Decision Support',
      headline: t('landing.heroHeadline') || 'Empowering Lives through Transformative Healthcare',
      subtitle:
        t('landing.heroSubtitle') ||
        'Our mission is to empower lives, fostering wellness through innovative medical practices, cutting-edge technology, and a dedicated team of healthcare professionals.',
      doctorName: t('landing.heroBadges.assistantTitle') || 'Dr. Emily Turner',
      doctorRole: t('landing.heroBadges.assistantRole') || 'Cardiologist',
      badge1: t('landing.heroBadges.doctors') || '38+ Experienced Doctors',
      badge2: t('landing.heroBadges.achievements') || '20+ Medical Achievements',
    },
    {
      id: 2,
      tag: 'Evidence-Based Medicine · ADA 2024 Guidelines',
      headline: 'Early Detection for Long-term Metabolic Vitality',
      subtitle:
        'Combining clinical biomarker evaluation, fasting plasma glucose stratification, and personalized lifestyle intervention algorithms.',
      doctorName: 'Prof. Sek Sokcheat',
      doctorRole: 'Clinical Supervisor & Research Lead',
      badge1: '98.4% Diagnostic Precision',
      badge2: 'ADA & WHO Aligned',
    },
    {
      id: 3,
      tag: 'Department of Health Informatics · Phnom Penh',
      headline: 'Precision Risk Assessment & Care Planning',
      subtitle:
        'Rule-based inference engines designed specifically for outpatient screening and patient-centered dietary guidance.',
      doctorName: 'Clinical AI Specialist',
      doctorRole: 'Endocrinology Decision Engine',
      badge1: '100% Rule Inference Safety',
      badge2: 'Continuous Clinical Audit',
    },
  ]

  const currentHero = heroContent.find((c) => c.id === activeSlide) || heroContent[0]

  return (
    <div className="lp-container" ref={pageRef}>
      {/* ════════════════ TOP NAVBAR ════════════════ */}
      <header className={`lp-navbar ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          {/* Brand Logo & Name (Removed background box from logo) */}
          <a href="#hero" className="lp-brand" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>
            <div className="lp-brand__logo-wrap">
              <img src={BRAND_LOGO_SRC} alt={t('landing.logoAlt') || 'Medical Logo'} className="lp-brand__logo" />
            </div>
            <div className="lp-brand__text">
              <span className="lp-brand__name">{t('landing.title') || 'Medical'}</span>
              <span className="lp-brand__sub">{t('landing.footerUniversity') || 'Norton University'}</span>
            </div>
          </a>

          {/* Nav Links */}
          <nav className="lp-nav-links">
            <button type="button" onClick={() => scrollToSection('hero')} className="lp-nav-link active">
              {t('landing.nav.home') || 'Home'}
            </button>
            <button type="button" onClick={() => scrollToSection('about')} className="lp-nav-link">
              {t('landing.nav.about') || 'About Us'}
            </button>
            <button type="button" onClick={() => scrollToSection('services')} className="lp-nav-link">
              {t('landing.nav.services') || 'Services'}
            </button>
            <button type="button" onClick={handleGuide} className="lp-nav-link">
              {t('landing.nav.articles') || 'Articles'}
            </button>
            <button type="button" onClick={() => scrollToSection('footer')} className="lp-nav-link">
              {t('landing.nav.contact') || 'Contact'}
            </button>
          </nav>

          {/* Right Action: Dashboard-style Language Switcher + Make Assessment CTA */}
          <div className="lp-nav-actions">
            {/* Language Switcher dropdown like dashboard */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="inline-flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-white/80 hover:text-slate-900 border border-slate-200/80 bg-white/60 backdrop-blur-xs outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-2xs cursor-pointer"
                aria-label="Switch Language"
                title="Switch Language"
              >
                {language === 'km' ? <CambodiaFlag /> : <UsFlag />}
                <span className="font-semibold">{language === 'km' ? 'KM' : 'EN'}</span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en')
                      setLangMenuOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                      language === 'en'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <UsFlag />
                      <span>English</span>
                    </div>
                    {language === 'en' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('km')
                      setLangMenuOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                      language === 'km'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <CambodiaFlag />
                      <span>ភាសាខ្មែរ</span>
                    </div>
                    {language === 'km' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                </div>
              )}
            </div>

            <button type="button" onClick={handleStart} className="lp-nav-cta">
              <span>{t('landing.nav.getStarted') || 'Get Started'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════ PAGE 1: HERO SECTION ════════════════ */}
      <section id="hero" className="lp-hero-section">
        {/* Soft luminous ambient radial glow */}
        <div className="lp-hero-glow" />

        {/* Decorative ECG pulse waveform in the background behind doctor */}
        <div className="lp-hero-ecg-wrap">
          <svg viewBox="0 0 1000 400" fill="none" className="lp-ecg-svg">
            <path
              d="M0,200 L300,200 L350,200 L380,180 L400,250 L430,90 L460,310 L490,160 L515,220 L535,200 L1000,200"
              stroke="#9ecdfb"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            />
          </svg>
        </div>

        <div className="lp-hero-inner">
          {/* Left Column: Vertically centered headline & CTAs */}
          <div className="lp-hero-content">
            <div className="lp-pill-badge">
              <span className="lp-pill-dot" />
              <span>{currentHero.tag}</span>
            </div>

            <h1 className="lp-hero-title">{currentHero.headline}</h1>

            <p className="lp-hero-subtitle">{currentHero.subtitle}</p>

            <div className="lp-hero-buttons">
              <button type="button" onClick={handleStart} className="lp-btn-primary">
                <span>{t('landing.cta') || 'Make Assessment'}</span>
                <ArrowRight size={17} />
              </button>

              <button type="button" onClick={handleGuide} className="lp-btn-secondary">
                <MessageSquare size={16} />
                <span>{t('landing.chatWithUs') || 'Chat with Us'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Large prominent doctor cutout anchored to bottom */}
          <div className="lp-hero-visual-wrap">
            <div className="lp-hero-doctor-container">
              {/* Doctor Cutout Image (Significantly larger, fills from bottom) */}
              <img
                src={HERO_DOCTOR_SRC}
                alt={currentHero.doctorName}
                className="lp-doctor-image"
              />

              {/* Floating Badge 1 (Top Left): Experienced Doctors */}
              <div className="lp-float-badge lp-float-badge--top-left">
                <div className="lp-float-badge__icon-wrap lp-float-badge__icon--green">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="lp-float-badge__text">{currentHero.badge1}</span>
              </div>

              {/* Floating Badge 2 (Top Right): Medical Achievements */}
              <div className="lp-float-badge lp-float-badge--top-right">
                <div className="lp-float-badge__icon-wrap lp-float-badge__icon--gold">
                  <Award size={16} />
                </div>
                <span className="lp-float-badge__text">{currentHero.badge2}</span>
              </div>

              {/* Floating Card (Bottom Left): Doctor Profile Card */}
              <div className="lp-doctor-profile-card">
                <div className="lp-doctor-profile-avatar">
                  <img
                    src={HERO_DOCTOR_SRC}
                    alt={currentHero.doctorName}
                    className="lp-avatar-thumb"
                  />
                  <span className="lp-avatar-status" />
                </div>
                <div className="lp-doctor-profile-info">
                  <div className="lp-doctor-profile-name">{currentHero.doctorName}</div>
                  <div className="lp-doctor-profile-role">{currentHero.doctorRole}</div>
                  <button
                    type="button"
                    onClick={handleStart}
                    className="lp-doctor-profile-action"
                  >
                    <span>{t('landing.cta') || 'Make Assessment'}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Carousel Indicators (1, 2, 3) */}
              <div className="lp-carousel-dots">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveSlide(num)}
                    className={`lp-carousel-dot ${activeSlide === num ? 'is-active' : ''}`}
                    aria-label={`Slide ${num}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ PAGE 2: ABOUT US SECTION ════════════════ */}
      <section id="about" className="lp-about-section">
        <div className="lp-about-inner">
          {/* Header Title with Horizontal Accent */}
          <div className="lp-about-header">
            <div className="lp-section-title-wrap">
              <h2 className="lp-section-title">{t('landing.about.title') || 'About Us'}</h2>
              <div className="lp-section-title-line" />
            </div>

            {/* Highlighted Quote in Large Italic Typography */}
            <blockquote className="lp-about-quote">
              <span className="lp-quote-mark lp-quote-mark--open">“</span>
              {t('landing.about.quote') ||
                'Leading healthcare institution dedicated to providing exceptional medical services and personalized care.'}
              <span className="lp-quote-mark lp-quote-mark--close">”</span>
            </blockquote>
          </div>

          {/* Split 2-Column: Doctor Portrait with Layered Background vs Vision & Missions */}
          <div className="lp-about-content">
            {/* Left: Layered geometric angled photo frame */}
            <div className="lp-about-visual">
              <div className="lp-about-backdrop lp-about-backdrop--1" />
              <div className="lp-about-backdrop lp-about-backdrop--2" />
              <div className="lp-about-photo-frame">
                <img
                  src={ABOUT_DOCTOR_SRC}
                  alt="Clinical Practitioner"
                  className="lp-about-photo"
                />
              </div>
            </div>

            {/* Right: Vision and Missions */}
            <div className="lp-about-text">
              {/* Vision */}
              <div className="lp-about-block">
                <h3 className="lp-about-subtitle">{t('landing.about.visionTitle') || 'Vision'}</h3>
                <p className="lp-about-paragraph">
                  <span className="lp-accent-dash">—</span>
                  {t('landing.about.visionDesc') ||
                    'To be the premier healthcare provider, recognized for our excellence in medical care, patient-centered approach, and commitment to advancing healthcare services, ultimately improving the health and well-being of our community.'}
                </p>
              </div>

              {/* Missions */}
              <div className="lp-about-block">
                <h3 className="lp-about-subtitle">{t('landing.about.missionsTitle') || 'Missions'}</h3>
                <ul className="lp-missions-list">
                  <li className="lp-mission-item">
                    <span className="lp-accent-dash">—</span>
                    <span>
                      {t('landing.about.mission1') ||
                        'Provide exceptional and comprehensive healthcare services'}
                    </span>
                  </li>
                  <li className="lp-mission-item">
                    <span className="lp-accent-dash">—</span>
                    <span>
                      {t('landing.about.mission2') ||
                        'Prioritize patient-centered care and satisfaction'}
                    </span>
                  </li>
                  <li className="lp-mission-item">
                    <span className="lp-accent-dash">—</span>
                    <span>
                      {t('landing.about.mission3') ||
                        'Foster a culture of continuous learning and innovation'}
                    </span>
                  </li>
                  <li className="lp-mission-item">
                    <span className="lp-accent-dash">—</span>
                    <span>
                      {t('landing.about.mission4') ||
                        'Cultivate strong partnerships and collaborations'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="lp-about-actions">
                <button type="button" onClick={handleGuide} className="lp-link-more">
                  <span>{t('landing.about.learnMore') || 'Learn More'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ PAGE 3: OUR SERVICES SECTION ════════════════ */}
      <section id="services" className="lp-services-section">
        <div className="lp-services-inner">
          {/* Eyebrow & Headline */}
          <div className="lp-services-header">
            <div className="lp-eyebrow">
              <span>{t('landing.services.eyebrow') || 'Our Services'}</span>
              <div className="lp-eyebrow-line" />
            </div>
            <h2 className="lp-services-title">
              {t('landing.services.heading') ||
                'Comprehensive Healthcare Solutions for Your Well-being'}
            </h2>
          </div>

          {/* 4 Cards Grid */}
          <div className="lp-services-grid">
            {/* Card 1: Primary Care */}
            <div className="lp-service-card">
              <div className="lp-service-card__icon-wrap">
                <Stethoscope size={24} />
              </div>
              <h3 className="lp-service-card__title">
                {t('landing.services.card1Title') || 'Primary Care'}
              </h3>
              <p className="lp-service-card__desc">
                {t('landing.services.card1Desc') ||
                  'Receive personalized and comprehensive primary healthcare services.'}
              </p>
              <button type="button" onClick={handleStart} className="lp-service-card__link">
                <span>{t('landing.services.learnMore') || 'Learn More'}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Card 2: Specialized Medical Services (Highlighted Active Card with Shadow & Border) */}
            <div className="lp-service-card lp-service-card--featured">
              <div className="lp-service-card__badge-tag">
                <Sparkles size={12} />
                <span>Featured</span>
              </div>
              <div className="lp-service-card__icon-wrap lp-service-card__icon-wrap--featured">
                <Building2 size={24} />
              </div>
              <h3 className="lp-service-card__title">
                {t('landing.services.card2Title') || 'Specialized Medical Services'}
              </h3>
              <p className="lp-service-card__desc">
                {t('landing.services.card2Desc') ||
                  'Access a wide range of specialized medical services tailored to meet your specific needs.'}
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="lp-service-card__link lp-service-card__link--featured"
              >
                <span>{t('landing.services.learnMore') || 'Learn More'}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Card 3: Diagnostic Imaging */}
            <div className="lp-service-card">
              <div className="lp-service-card__icon-wrap">
                <HeartPulse size={24} />
              </div>
              <h3 className="lp-service-card__title">
                {t('landing.services.card3Title') || 'Diagnostic Imaging'}
              </h3>
              <p className="lp-service-card__desc">
                {t('landing.services.card3Desc') ||
                  'Utilize state-of-the-art accurate and timely diagnostic imaging technology.'}
              </p>
              <button type="button" onClick={handleGuide} className="lp-service-card__link">
                <span>{t('landing.services.learnMore') || 'Learn More'}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Card 4: Rehabilitation Services */}
            <div className="lp-service-card">
              <div className="lp-service-card__icon-wrap">
                <HeartHandshake size={24} />
              </div>
              <h3 className="lp-service-card__title">
                {t('landing.services.card4Title') || 'Rehabilitation Services'}
              </h3>
              <p className="lp-service-card__desc">
                {t('landing.services.card4Desc') ||
                  'Regain mobility and functionality with our comprehensive rehabilitation services.'}
              </p>
              <button type="button" onClick={handleGuide} className="lp-service-card__link">
                <span>{t('landing.services.learnMore') || 'Learn More'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ TRUST & STATS STRIP ════════════════ */}
      <section className="lp-stats-strip">
        <div className="lp-stats-inner">
          <div className="lp-stat-box">
            <div className="lp-stat-val">{t('landing.stats.stat1Number') || '38+'}</div>
            <div className="lp-stat-lbl">{t('landing.stats.stat1Label') || 'Experienced Doctors'}</div>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-box">
            <div className="lp-stat-val">{t('landing.stats.stat2Number') || '20+'}</div>
            <div className="lp-stat-lbl">{t('landing.stats.stat2Label') || 'Medical Achievements'}</div>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-box">
            <div className="lp-stat-val">{t('landing.stats.stat3Number') || '98.4%'}</div>
            <div className="lp-stat-lbl">{t('landing.stats.stat3Label') || 'Diagnostic Precision'}</div>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-box">
            <div className="lp-stat-val">{t('landing.stats.stat4Number') || '100%'}</div>
            <div className="lp-stat-lbl">{t('landing.stats.stat4Label') || 'Evidence-Based Rules'}</div>
          </div>
        </div>
      </section>

      {/* ════════════════ RICH FOOTER SECTION ════════════════ */}
      <footer id="footer" className="lp-footer-section">
        <div className="lp-footer-inner">
          <div className="lp-footer-grid">
            {/* Col 1: System info & Norton University */}
            <div className="lp-footer-col lp-footer-col--brand">
              <div className="lp-footer-logo-row">
                <img src={BRAND_LOGO_SRC} alt="Logo" className="lp-footer-logo" />
                <span className="lp-footer-brand-title">{t('landing.title')}</span>
              </div>
              <p className="lp-footer-tagline">
                {t('landing.footer.desc') ||
                  'An intelligent clinical decision support system for early detection, risk assessment, and personalized diabetes management.'}
              </p>
              <div className="lp-footer-institution">
                <Shield size={14} className="text-blue-500" />
                <span>
                  {t('landing.footerUniversity') || 'Norton University'} · {t('landing.footerCity') || 'Phnom Penh'}
                </span>
              </div>
            </div>

            {/* Col 2: Services / Modules */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">{t('landing.footer.col1Title') || 'Clinical Services'}</h4>
              <ul className="lp-footer-links">
                <li>
                  <button type="button" onClick={handleStart}>
                    {t('landing.services.card1Title') || 'Primary Care Screening'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={handleStart}>
                    {t('landing.services.card2Title') || 'Specialized Risk Stratification'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={handleGuide}>
                    {t('landing.services.card3Title') || 'Diagnostic Imaging & Labs'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={handleGuide}>
                    {t('landing.services.card4Title') || 'Rehabilitation & Nutrition'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Clinical Standards */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">{t('landing.footer.col2Title') || 'Clinical Standards'}</h4>
              <ul className="lp-footer-links">
                <li>
                  <span className="lp-footer-static-item">ADA 2024 Standards of Care</span>
                </li>
                <li>
                  <span className="lp-footer-static-item">WHO Diabetes Diagnostic Criteria</span>
                </li>
                <li>
                  <span className="lp-footer-static-item">Fasting Plasma Glucose (FPG)</span>
                </li>
                <li>
                  <span className="lp-footer-static-item">HbA1c & Glycemic Thresholds</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Institutional & Team */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-heading">{t('landing.footer.col3Title') || 'Institution & Team'}</h4>
              <ul className="lp-footer-links">
                <li>
                  <span className="lp-footer-static-item">
                    {t('landing.supervisedBy')}: <strong>{t('landing.supervisorName')}</strong>
                  </span>
                </li>
                <li>
                  <span className="lp-footer-static-item">
                    {t('landing.developedBy')}: {t('landing.team.saoKuntisa')}, {t('landing.team.chhengVichea')}
                  </span>
                </li>
                <li>
                  <span className="lp-footer-static-item">
                    {t('landing.team.saryDanish')}, {t('landing.team.chanChungchay')}
                  </span>
                </li>
                <li>
                  <span className="lp-footer-static-item">
                    Department of Computer Science
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & legal links */}
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">
              © {new Date().getFullYear()} {t('landing.title')}. {t('landing.footer.allRights') || 'All rights reserved.'}{' '}
              <span className="lp-footer-badge">{t('landing.footerVersion') || 'v2.0'}</span>
            </div>
            <div className="lp-footer-legal">
              <button type="button" onClick={handleGuide}>
                {t('landing.footer.privacy') || 'Privacy Policy'}
              </button>
              <span>·</span>
              <button type="button" onClick={handleGuide}>
                {t('landing.footer.terms') || 'Terms of Clinical Use'}
              </button>
              <span>·</span>
              <button type="button" onClick={handleGuide}>
                {t('landing.footer.disclaimer') || 'Clinical Disclaimer'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════════════ SCOPED CSS STYLING ════════════════ */}
      <style>{`
        /* ── Base Container ── */
        .lp-container {
          min-height: 100vh;
          background: #ffffff;
          color: #1e293b;
          font-family: var(--font-latin-sans);
          overflow-x: hidden;
          transition: opacity 0.4s ease;
        }

        /* ── Top Navbar (Transparent background by default, frosted glass on scroll) ── */
        .lp-navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 72px;
          z-index: 100;
          background: transparent;
          border-bottom: 1px solid transparent;
          transition: all 0.3s ease;
        }
        .lp-navbar.is-scrolled {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
        }
        .lp-nav-inner {
          max-width: 1320px;
          margin: 0 auto;
          height: 100%;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        /* Brand Logo: Clean transparent container with no background box */
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }
        .lp-brand__logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          box-shadow: none;
        }
        .lp-brand__logo {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }
        .lp-brand__text {
          display: flex;
          flex-direction: column;
        }
        .lp-brand__name {
          font-family: var(--font-latin-display);
          font-weight: 700;
          font-size: 1.1rem;
          color: #0f172a;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .lp-brand__sub {
          font-size: 0.72rem;
          color: #0369a1;
          font-weight: 600;
        }

        /* Nav links */
        .lp-nav-links {
          display: flex;
          align-items: center;
          gap: 2.2rem;
        }
        .lp-nav-link {
          background: none;
          border: none;
          font-family: var(--font-latin-sans);
          font-size: 0.94rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          padding: 0.5rem 0.2rem;
          position: relative;
          transition: color 0.2s ease;
        }
        .lp-nav-link:hover {
          color: #0284c7;
        }
        .lp-nav-link.active {
          color: #0284c7;
          font-weight: 600;
        }

        /* Actions */
        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .lp-nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.4rem;
          border-radius: 999px;
          background: #0284c7;
          border: 1px solid #0284c7;
          color: #ffffff;
          font-family: var(--font-latin-sans);
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(2, 132, 199, 0.28);
          transition: all 0.25s ease;
        }
        .lp-nav-cta:hover {
          background: #0369a1;
          border-color: #0369a1;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.38);
        }

        /* ── HERO SECTION ── */
        .lp-hero-section {
          position: relative;
          padding-top: 72px;
          padding-bottom: 0;
          background:
            radial-gradient(circle at 74% 42%, rgba(255, 255, 255, 0.95) 0%, rgba(214, 238, 255, 0.55) 45%, transparent 72%),
            radial-gradient(circle at 10% 20%, rgba(225, 243, 255, 0.8) 0%, transparent 45%),
            linear-gradient(135deg, #cce4fc 0%, #ddf0fd 45%, #ecf6fe 100%);
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        /* Soft background radial glow */
        .lp-hero-glow {
          position: absolute;
          top: 15%;
          right: 8%;
          width: 580px;
          height: 580px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(206, 233, 255, 0.45) 50%, transparent 75%);
          pointer-events: none;
          z-index: 0;
        }

        /* Decorative ECG Pulse Waveform behind Doctor */
        .lp-hero-ecg-wrap {
          position: absolute;
          top: 36%;
          left: 30%;
          right: 0;
          transform: translateY(-50%);
          pointer-events: none;
          z-index: 0;
          opacity: 0.6;
        }
        .lp-ecg-svg {
          width: 100%;
          height: 280px;
        }

        /* Main Inner Grid: Align-items flex-end for doctor, center for text */
        .lp-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1320px;
          width: 100%;
          margin: 0 auto;
          padding: 0 2rem 0;
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 2.5rem;
          min-height: calc(100vh - 72px);
          align-items: flex-end;
        }

        /* Left Hero Content: Vertically Centered in available space */
        .lp-hero-content {
          align-self: center;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 3rem 0 5rem;
          max-width: 580px;
        }
        .lp-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(186, 218, 248, 0.9);
          color: #0369a1;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          width: fit-content;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.08);
        }
        .lp-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0284c7;
        }
        .lp-hero-title {
          font-family: var(--font-latin-display);
          font-size: clamp(2.6rem, 4.3vw, 4rem);
          font-weight: 800;
          color: #0f172a;
          line-height: 1.14;
          letter-spacing: -0.035em;
          margin: 0;
        }
        .lp-hero-subtitle {
          font-size: 1.08rem;
          color: #475569;
          line-height: 1.75;
          margin: 0;
          max-width: 500px;
          font-weight: 400;
        }

        /* Buttons */
        .lp-hero-buttons {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.95rem 2.2rem;
          border-radius: 999px;
          background: #0284c7;
          border: none;
          color: #ffffff;
          font-family: var(--font-latin-sans);
          font-weight: 600;
          font-size: 0.96rem;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(2, 132, 199, 0.32);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-btn-primary:hover {
          background: #0369a1;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(2, 132, 199, 0.42);
        }
        .lp-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.95rem 2.2rem;
          border-radius: 999px;
          background: #ffffff;
          border: 1.5px solid rgba(186, 218, 248, 0.9);
          color: #334155;
          font-family: var(--font-latin-sans);
          font-weight: 600;
          font-size: 0.96rem;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: all 0.25s ease;
        }
        .lp-btn-secondary:hover {
          border-color: #0284c7;
          color: #0284c7;
          background: #f8fafc;
        }

        /* Right Hero Visual: Large Doctor Cutout anchored to bottom */
        .lp-hero-visual-wrap {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          position: relative;
          height: 100%;
        }
        .lp-hero-doctor-container {
          position: relative;
          width: 100%;
          max-width: 600px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .lp-doctor-image {
          width: auto;
          height: 84vh;
          max-height: 800px;
          min-height: 560px;
          max-width: 580px;
          object-fit: contain;
          object-position: bottom center;
          display: block;
          filter: drop-shadow(0 18px 36px rgba(14, 116, 144, 0.16));
          margin-bottom: 0;
        }

        /* Floating Badges */
        .lp-float-badge {
          position: absolute;
          z-index: 10;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.65rem 1.25rem;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.1);
          border: 1px solid rgba(226, 232, 240, 0.95);
          animation: lp-float-soft 4s ease-in-out infinite;
        }
        .lp-float-badge--top-left {
          top: 22%;
          left: -40px;
          animation-delay: 0s;
        }
        .lp-float-badge--top-right {
          top: 45%;
          right: -30px;
          animation-delay: 1.5s;
        }
        .lp-float-badge__icon-wrap {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-float-badge__icon--green {
          background: #dcfce7;
          color: #16a34a;
        }
        .lp-float-badge__icon--gold {
          background: #fef3c7;
          color: #d97706;
        }
        .lp-float-badge__text {
          font-size: 0.86rem;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
        }

        /* Floating Doctor Profile Card (Bottom Left) */
        .lp-doctor-profile-card {
          position: absolute;
          bottom: 75px;
          left: -60px;
          z-index: 12;
          background: #ffffff;
          padding: 1rem 1.35rem;
          border-radius: 20px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.13);
          border: 1px solid rgba(226, 232, 240, 0.95);
          display: flex;
          align-items: center;
          gap: 0.9rem;
          animation: lp-float-soft 4.5s ease-in-out infinite 0.75s;
        }
        .lp-doctor-profile-avatar {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          overflow: hidden;
          background: #e0f2fe;
          flex-shrink: 0;
        }
        .lp-avatar-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .lp-avatar-status {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          background: #22c55e;
          border: 2px solid #ffffff;
          border-radius: 50%;
        }
        .lp-doctor-profile-info {
          display: flex;
          flex-direction: column;
          gap: 0.12rem;
        }
        .lp-doctor-profile-name {
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }
        .lp-doctor-profile-role {
          font-size: 0.76rem;
          color: #64748b;
          margin-bottom: 0.2rem;
        }
        .lp-doctor-profile-action {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          padding: 0;
          color: #0284c7;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: gap 0.2s ease;
        }
        .lp-doctor-profile-action:hover {
          gap: 0.45rem;
          color: #0369a1;
        }

        /* Carousel dots */
        .lp-carousel-dots {
          position: absolute;
          bottom: 22px;
          left: 54%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .lp-carousel-dot {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid rgba(186, 218, 248, 0.9);
          background: #ffffff;
          color: #0369a1;
          font-size: 0.72rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(2, 132, 199, 0.12);
          transition: all 0.2s ease;
        }
        .lp-carousel-dot:hover {
          border-color: #0284c7;
          color: #0284c7;
        }
        .lp-carousel-dot.is-active {
          background: #0284c7;
          border-color: #0284c7;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
        }

        @keyframes lp-float-soft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        /* ── ABOUT US SECTION ── */
        .lp-about-section {
          padding: 6rem 1.5rem;
          background: #ffffff;
          position: relative;
        }
        .lp-about-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        /* About Header */
        .lp-about-header {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .lp-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }
        .lp-section-title {
          font-family: var(--font-latin-display);
          font-size: 1.4rem;
          font-weight: 700;
          color: #0284c7;
          margin: 0;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }
        .lp-section-title-line {
          width: 110px;
          height: 2px;
          background: #0284c7;
          opacity: 0.6;
          border-radius: 999px;
        }
        .lp-about-quote {
          font-family: var(--font-latin-display);
          font-size: clamp(1.4rem, 2.5vw, 2.1rem);
          font-style: italic;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.35;
          margin: 0;
          position: relative;
          padding-left: 1.25rem;
        }
        .lp-quote-mark {
          color: #0284c7;
          font-size: 1.5em;
          line-height: 0;
          vertical-align: -0.2em;
          opacity: 0.45;
        }
        .lp-quote-mark--open { margin-right: 0.1em; }
        .lp-quote-mark--close { margin-left: 0.1em; }

        /* About Content Split */
        .lp-about-content {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 4.5rem;
          align-items: center;
        }

        /* Left: Layered Doctor Photo */
        .lp-about-visual {
          position: relative;
          max-width: 400px;
          margin: 0 auto;
          width: 100%;
        }
        .lp-about-backdrop {
          position: absolute;
          border-radius: 28px;
          pointer-events: none;
        }
        .lp-about-backdrop--1 {
          inset: -12px;
          background: #bae6fd;
          transform: rotate(-5deg);
          opacity: 0.65;
          z-index: 1;
        }
        .lp-about-backdrop--2 {
          inset: -6px;
          background: #e0f2fe;
          transform: rotate(3deg);
          opacity: 0.8;
          z-index: 2;
        }
        .lp-about-photo-frame {
          position: relative;
          z-index: 3;
          width: 100%;
          aspect-ratio: 3/4;
          border-radius: 26px;
          overflow: hidden;
          background: linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
          border: 3px solid #ffffff;
        }
        .lp-about-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Right: Vision & Missions */
        .lp-about-text {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .lp-about-block {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .lp-about-subtitle {
          font-family: var(--font-latin-display);
          font-size: 1.35rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .lp-about-paragraph {
          font-size: 0.98rem;
          color: #475569;
          line-height: 1.7;
          margin: 0;
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
        }
        .lp-accent-dash {
          color: #0284c7;
          font-weight: 700;
          font-size: 1.1rem;
          line-height: 1.3;
          flex-shrink: 0;
        }
        .lp-missions-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .lp-mission-item {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.6;
        }
        .lp-about-actions {
          margin-top: 0.5rem;
        }
        .lp-link-more {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: #0284c7;
          font-family: var(--font-latin-sans);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: gap 0.2s ease;
        }
        .lp-link-more:hover {
          gap: 0.75rem;
          color: #0369a1;
        }

        /* ── OUR SERVICES SECTION ── */
        .lp-services-section {
          padding: 6rem 1.5rem;
          background: #f8fafc;
          position: relative;
        }
        .lp-services-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3.5rem;
        }

        .lp-services-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.85rem;
        }
        .lp-eyebrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0284c7;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .lp-eyebrow-line {
          width: 32px;
          height: 2px;
          background: #0284c7;
          border-radius: 999px;
        }
        .lp-services-title {
          font-family: var(--font-latin-display);
          font-size: clamp(1.75rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          max-width: 700px;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }

        /* 4 Cards Grid */
        .lp-services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        .lp-service-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 2rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border: 1px solid #e2e8f0;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-service-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
          border-color: #cbd5e1;
        }

        /* Highlighted Featured Card */
        .lp-service-card--featured {
          background: #ffffff;
          border: 1.5px solid #0284c7;
          box-shadow: 0 16px 36px rgba(2, 132, 199, 0.12);
          transform: translateY(-6px);
        }
        .lp-service-card--featured:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 42px rgba(2, 132, 199, 0.18);
        }
        .lp-service-card__badge-tag {
          position: absolute;
          top: -11px;
          right: 20px;
          background: #0284c7;
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          letter-spacing: 0.03em;
        }

        .lp-service-card__icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: #e0f2fe;
          color: #0284c7;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }
        .lp-service-card__icon-wrap--featured {
          background: #0284c7;
          color: #ffffff;
        }
        .lp-service-card:hover .lp-service-card__icon-wrap {
          transform: scale(1.08);
        }

        .lp-service-card__title {
          font-family: var(--font-latin-display);
          font-size: 1.12rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.3;
        }
        .lp-service-card__desc {
          font-size: 0.88rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
          flex: 1;
        }
        .lp-service-card__link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          border: none;
          padding: 0;
          font-size: 0.84rem;
          font-weight: 600;
          color: #0284c7;
          cursor: pointer;
          transition: gap 0.2s ease;
        }
        .lp-service-card__link:hover {
          gap: 0.65rem;
          color: #0369a1;
        }
        .lp-service-card__link--featured {
          font-weight: 700;
        }

        /* ── STATS STRIP ── */
        .lp-stats-strip {
          background: #0f172a;
          color: #ffffff;
          padding: 3rem 1.5rem;
        }
        .lp-stats-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-around;
          flex-wrap: wrap;
          gap: 2rem;
        }
        .lp-stat-box {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .lp-stat-val {
          font-family: var(--font-latin-display);
          font-size: 2.3rem;
          font-weight: 800;
          color: #38bdf8;
          line-height: 1;
        }
        .lp-stat-lbl {
          font-size: 0.84rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .lp-stat-divider {
          width: 1px;
          height: 38px;
          background: rgba(255, 255, 255, 0.12);
        }

        /* ── FOOTER SECTION ── */
        .lp-footer-section {
          background: #090e17;
          color: #94a3b8;
          padding: 4.5rem 1.5rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .lp-footer-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }
        .lp-footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
          gap: 3rem;
        }

        .lp-footer-col--brand {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }
        .lp-footer-logo-row {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .lp-footer-logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
          filter: brightness(1.2);
        }
        .lp-footer-brand-title {
          font-family: var(--font-latin-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
        }
        .lp-footer-tagline {
          font-size: 0.85rem;
          line-height: 1.65;
          color: #94a3b8;
          margin: 0;
        }
        .lp-footer-institution {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.78rem;
          color: #cbd5e1;
        }

        .lp-footer-heading {
          font-family: var(--font-latin-display);
          font-size: 0.92rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 1.15rem 0;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .lp-footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .lp-footer-links button {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.84rem;
          color: #94a3b8;
          cursor: pointer;
          text-align: left;
          transition: color 0.2s ease;
        }
        .lp-footer-links button:hover {
          color: #38bdf8;
        }
        .lp-footer-static-item {
          font-size: 0.84rem;
          color: #94a3b8;
          line-height: 1.5;
        }
        .lp-footer-static-item strong {
          color: #f1f5f9;
        }

        /* Bottom Bar */
        .lp-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.8rem;
          color: #64748b;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .lp-footer-badge {
          display: inline-block;
          margin-left: 0.5rem;
          padding: 0.15rem 0.45rem;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .lp-footer-legal {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .lp-footer-legal button {
          background: none;
          border: none;
          padding: 0;
          color: #64748b;
          font-size: 0.8rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .lp-footer-legal button:hover {
          color: #cbd5e1;
        }

        /* ── RESPONSIVE ADAPTATIONS ── */
        @media (max-width: 1180px) {
          .lp-hero-inner {
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }
          .lp-doctor-image {
            height: 72vh;
            max-height: 640px;
          }
          .lp-float-badge--top-left {
            left: -15px;
          }
          .lp-float-badge--top-right {
            right: -15px;
          }
          .lp-doctor-profile-card {
            left: -20px;
          }
        }

        @media (max-width: 1024px) {
          .lp-hero-section {
            min-height: auto;
            padding-bottom: 0;
          }
          .lp-hero-inner {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 2rem;
            min-height: auto;
          }
          .lp-hero-content {
            align-items: center;
            padding: 3rem 0 1rem;
            margin: 0 auto;
          }
          .lp-hero-subtitle {
            max-width: 100%;
          }
          .lp-hero-buttons {
            justify-content: center;
          }
          .lp-hero-visual-wrap {
            order: 1;
          }
          .lp-doctor-image {
            height: auto;
            max-height: 520px;
            width: 80%;
          }

          .lp-about-content {
            grid-template-columns: 1fr;
            gap: 3rem;
          }
          .lp-services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .lp-footer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .lp-nav-links {
            display: none;
          }
          .lp-hero-title {
            font-size: 2.1rem;
          }
          .lp-about-quote {
            font-size: 1.3rem;
          }
          .lp-services-grid {
            grid-template-columns: 1fr;
          }
          .lp-service-card--featured {
            transform: none;
          }
          .lp-stats-inner {
            flex-direction: column;
            gap: 1.5rem;
          }
          .lp-stat-divider {
            display: none;
          }
          .lp-footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .lp-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
          .lp-float-badge--top-left {
            left: 0;
            top: 10%;
          }
          .lp-float-badge--top-right {
            right: 0;
            top: 35%;
          }
          .lp-doctor-profile-card {
            left: 10px;
            bottom: 30px;
          }
          .lp-doctor-image {
            max-height: 420px;
          }
        }
      `}</style>
    </div>
  )
}
