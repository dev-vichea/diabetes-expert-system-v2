import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, GraduationCap, Pill, Stethoscope } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

// ── Ultra-Premium Medical White Tokens (healthcare blue family — legacy key names kept)
const C = {
  bg:         '#f4f7f9', // Slightly cooler, premium medical off-white
  teal:       '#1f76e8',
  tealLight:  '#2f8cff',
  tealBright: '#0ea5e9',
  blue:       '#3b82f6',
  purple:     '#8b5cf6',
  sky:        '#0ea5e9',
  text:       '#0f172a',
  textMid:    '#334155',
  textSoft:   '#64748b',
  textFaint:  'rgba(71, 85, 105, 0.5)',
  gold:       '#d97706',
  goldBg:     'rgba(245, 158, 11, 0.1)',
  goldBorder: 'rgba(245, 158, 11, 0.3)',
  green:      '#10b981',
  
  // Glassmorphism specific
  glassBg:      'rgba(255, 255, 255, 0.65)',
  glassBorder:  'rgba(255, 255, 255, 0.9)',
  glassShadow:  '0 8px 32px rgba(31, 118, 232, 0.06)',
}

const BRAND_LOGO_SRC = '/images/logo.png'

export function LandingPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { t }     = useLanguage()
  const canvasRef = useRef(null)
  const pageRef   = useRef(null)
  const fullText  = t('landing.title')

  // ── Animation States
  const [typedText, setTypedText] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [visibleBadges, setVisibleBadges] = useState(0)
  const [showCTA, setShowCTA] = useState(false)
  const [showTeam, setShowTeam] = useState(false)

  /* ── Particle Canvas (Background Network) ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const PARTICLE_COUNT = 60
    const MAX_DIST = 140
    let W, H, particles, raf

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    const createParticle = () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 1,
      a: Math.random() * 0.3 + 0.1 // More subtle dots for cleaner medical feel
    })

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(47, 140, 255, ${p.a})`; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(47, 140, 255, ${(1 - dist / MAX_DIST) * 0.12})`; ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }

    resize(); particles = Array.from({ length: PARTICLE_COUNT }, createParticle); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  /* ── Typewriter & Sequence Orchestration ── */
  useEffect(() => {
    let charIndex = 0
    
    // Smooth orchestration timeline
    const startTimer = setTimeout(() => {
      const typeInterval = setInterval(() => {
        charIndex++
        setTypedText(fullText.slice(0, charIndex))
        if (charIndex >= fullText.length) {
          clearInterval(typeInterval)
          
          setTimeout(() => setShowSubtitle(true), 300)
          
          setTimeout(() => {
            let count = 0
            const badgeReveal = setInterval(() => {
              count++
              setVisibleBadges(count)
              if (count >= 3) {
                clearInterval(badgeReveal)
                setTimeout(() => setShowCTA(true), 400)
                setTimeout(() => setShowTeam(true), 800)
              }
            }, 200) // Fast snappy badges
          }, 700)
        }
      }, 70) // Smooth typing speed
    }, 800)

    return () => clearTimeout(startTimer)
  }, [fullText])

  const handleStart = () => {
    if (pageRef.current) pageRef.current.style.opacity = '0'
    const target = user ? '/dashboard' : '/login'
    setTimeout(() => navigate(target), 600)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: C.bg, overflowY: 'auto', overflowX: 'hidden', fontFamily: 'var(--font-latin-sans)' }}>

      {/* ── Abstract Blurred Ambient Backgrounds (Modern Touch) ── */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none', animation: 'floatSlow 20s ease-in-out infinite alternate' }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none', animation: 'floatSlow 25s ease-in-out infinite alternate-reverse' }} />
      <div style={{ position: 'fixed', top: '30%', left: '40%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none', animation: 'floatSlow 18s ease-in-out infinite' }} />

      {/* Grid Pattern overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(15,118,110,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,118,110,0.02) 1px, transparent 1px)',
        backgroundSize: '32px 32px', opacity: 0.8
      }} />

      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

      <main ref={pageRef} style={{ position: 'relative', zIndex: 3, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem 6rem', textAlign: 'center', transition: 'opacity 0.6s ease' }}>
        
        {/* ── 1. Hero Logo ── */}
        <div style={{ position: 'relative', width: 104, height: 104, marginBottom: '2.5rem', animation: 'lpFadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>

          {/* Rotating AI Ring */}
          <svg style={{ position: 'absolute', inset: -14, width: 132, height: 132, animation: 'spinSlow 15s linear infinite' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke={C.tealLight} strokeWidth="1" strokeDasharray="4 8" opacity="0.4" />
            <circle cx="50" cy="5" r="2" fill={C.teal} />
            <circle cx="95" cy="50" r="1.5" fill={C.sky} />
            <circle cx="5" cy="50" r="1.5" fill={C.blue} />
          </svg>

          <img
            src={BRAND_LOGO_SRC}
            alt={t('landing.logoAlt')}
            style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* ── 2. Animated Gradient Title ── */}
        <h1 style={{ 
          fontFamily: 'var(--font-latin-display)', fontSize: 'clamp(2rem, 5.5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em',
          marginBottom: '1rem', minHeight: '1.2em', position: 'relative'
        }}>
          <span className="gradient-text">
            {typedText}
          </span>
          <span style={{ 
            display: 'inline-block', width: 4, height: '0.85em', backgroundColor: C.tealLight, 
            marginLeft: 8, verticalAlign: 'middle', borderRadius: 4, boxShadow: '0 0 10px rgba(20,184,166,0.5)',
            animation: 'lpBlink 0.9s infinite step-end', opacity: typedText.length === fullText.length ? 0 : 1
          }} />
        </h1>

        {/* Subtitle */}
        <p className="landing-subtitle" style={{ maxWidth: 620, fontSize: '1.15rem', color: C.textMid, lineHeight: '1.6', fontWeight: 300, opacity: showSubtitle ? 1 : 0, transform: `translateY(${showSubtitle ? 0 : 15}px)`, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)', marginBottom: '3rem' }}>
          {t('landing.subtitle')}
        </p>

        {/* ── 3. Glassmorphism Badges ── */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3.5rem' }}>
          {[
            { icon: Stethoscope, text: t('landing.badges.aiDiagnosis') },
            { icon: Activity, text: t('landing.badges.riskAnalysis') },
            { icon: Pill, text: t('landing.badges.treatmentPlan') }
          ].map((b, i) => {
            const Icon = b.icon
            return (
              <div key={i} className="glass-badge" style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 1.4rem', borderRadius: '50px', 
                background: C.glassBg, border: `1px solid ${C.glassBorder}`, 
                boxShadow: C.glassShadow, backdropFilter: 'blur(12px)',
                color: C.teal, fontWeight: 600, fontSize: '0.95rem',
                opacity: visibleBadges > i ? 1 : 0, transform: `translateY(${visibleBadges > i ? 0 : 20}px) scale(${visibleBadges > i ? 1 : 0.95})`, 
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <Icon className="h-4 w-4" style={{ color: C.teal }} />
                {b.text}
              </div>
            )
          })}
        </div>

        {/* ── 4. Premium CTA Button ── */}
        <div style={{ opacity: showCTA ? 1 : 0, transform: `translateY(${showCTA ? 0 : 20}px)`, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <button onClick={handleStart} className="premium-btn">
            {t('landing.cta')}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="btn-arrow">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* ── 5. Elevated Team Cards ── */}
        <div style={{ marginTop: '5rem', opacity: showTeam ? 1 : 0, transform: `translateY(${showTeam ? 0 : 20}px)`, transition: 'all 1s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${C.tealBorder})` }} />
            <p style={{ fontSize: '0.7rem', letterSpacing: '3px', color: C.textSoft, textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>{t('landing.developedBy')}</p>
            <div style={{ height: 1, width: 40, background: `linear-gradient(to left, transparent, ${C.tealBorder})` }} />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
            {[
              { name: t('landing.team.saoKuntisa'), c: C.tealLight },
              { name: t('landing.team.chhengVichea'), c: C.blue },
              { name: t('landing.team.saryDanish'), c: C.purple },
              { name: t('landing.team.chanChungchay'), c: C.sky }
            ].map((m, i) => (
              <div key={i} className="team-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <div className="avatar-glass" style={{
                  width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.3))`,
                  border: `2px solid rgba(255,255,255,1)`, color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-latin-display)', boxShadow: `0 8px 24px ${m.c}1A`, backdropFilter: 'blur(8px)',
                  position: 'relative', zIndex: 2
                }}>
                  {m.name[0]}
                </div>
                <span className="team-name" style={{ fontSize: '0.8rem', color: C.textMid, fontWeight: 500, padding: '0.3rem 0.8rem', background: C.glassBg, borderRadius: '20px', border: `1px solid ${C.glassBorder}`, backdropFilter: 'blur(4px)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>{m.name}</span>
              </div>
            ))}
          </div>
          
          <div className="prof-badge" style={{ 
            padding: '0.6rem 1.8rem', borderRadius: '50px', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
            border: `1px solid ${C.glassBorder}`, color: C.gold, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            backdropFilter: 'blur(10px)', boxShadow: `0 8px 24px ${C.goldBg}`
          }}>
            <GraduationCap className="h-4 w-4" style={{ color: C.gold }} />
            <span style={{ color: C.textSoft }}>{t('landing.supervisedBy')}</span>
            <b style={{ fontFamily: 'var(--font-latin-display)', fontWeight: 700 }}>{t('landing.supervisorName')}</b>
          </div>
        </div>
      </main>

      <footer style={{ position: 'fixed', bottom: '1.5rem', width: '100%', textAlign: 'center', fontSize: '0.75rem', color: C.textFaint, fontWeight: 500, zIndex: 3 }}>
        <p>{t('landing.footerVersion')}  <span style={{ margin: '0 0.5rem', color: C.tealBorder }}>|</span>  {t('landing.footerUniversity')}  <span style={{ margin: '0 0.5rem', color: C.tealBorder }}>—</span>  {t('landing.footerCity')}</p>
      </footer>

      {/* ── CSS Animations & Hover FX ── */}
      <style>{`
        @keyframes lpFadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
        @keyframes floatSlow { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, 30px); } }
        @keyframes gradientFlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes lpBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* Premium Text Gradient */
        .gradient-text {
          background: linear-gradient(135deg, #0f172a 0%, #175bb7 50%, #0284c7 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: gradientFlow 8s ease infinite;
        }

        /* Glass Badge Hover */
        .glass-badge:hover {
          transform: translateY(-3px) scale(1.02) !important;
          background: rgba(255,255,255,0.9) !important;
          box-shadow: 0 12px 40px rgba(15,118,110,0.12) !important;
        }

        /* Premium Button */
        .premium-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1.1rem 2.8rem;
          border-radius: 50px;
          background: linear-gradient(135deg, #1f76e8, #2f8cff);
          color: #fff;
          border: none;
          font-family: var(--font-latin-display);
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(15,118,110,0.3), inset 0 2px 0 rgba(255,255,255,0.2);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          position: relative;
        }
        .premium-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.6s ease;
        }
        .premium-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(15,118,110,0.4), inset 0 2px 0 rgba(255,255,255,0.3);
        }
        .premium-btn:hover::before { left: 100%; }
        .btn-arrow { transition: transform 0.3s ease; }
        .premium-btn:hover .btn-arrow { transform: translateX(5px); }

        /* Team Card Hover */
        .team-card { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); cursor: default; }
        .team-card:hover { transform: translateY(-5px); }
        .team-card:hover .avatar-glass { 
          background: #fff !important; 
          box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important; 
          transform: scale(1.05);
        }
        .prof-badge { transition: all 0.3s ease; cursor: default; }
        .prof-badge:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(245,158,11,0.15) !important; background: rgba(255,255,255,0.95) !important; }
      `}</style>
    </div>
  )
}
