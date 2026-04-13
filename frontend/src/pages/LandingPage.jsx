import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// ── Ultra-Premium Medical White Tokens
const C = {
  bg:         '#f4f7f9', // Slightly cooler, premium medical off-white
  teal:       '#0f766e',
  tealLight:  '#14b8a6',
  tealBright: '#06b6d4',
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
  glassShadow:  '0 8px 32px rgba(15, 118, 110, 0.06)',
}

export function LandingPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const canvasRef = useRef(null)
  const pageRef   = useRef(null)

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
        ctx.fillStyle = `rgba(20, 184, 166, ${p.a})`; ctx.fill()
      })
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(20, 184, 166, ${(1 - dist / MAX_DIST) * 0.12})`; ctx.stroke()
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
    const fullText = 'Diabetes Expert System'
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
  }, [])

  const handleStart = () => {
    if (pageRef.current) pageRef.current.style.opacity = '0'
    const target = user ? '/dashboard' : '/login'
    setTimeout(() => navigate(target), 600)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: C.bg, overflowY: 'auto', overflowX: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;800&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
      
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
        
        {/* ── 1. Breathing Hero Icon (AI Core) ── */}
        <div style={{ position: 'relative', width: 90, height: 90, marginBottom: '2.5rem', animation: 'lpFadeInDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          
          {/* Pulsing Backglow */}
          <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(20,184,166,0.3) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(8px)', animation: 'pulseGlow 3s ease-in-out infinite' }} />
          
          {/* Rotating AI Ring */}
          <svg style={{ position: 'absolute', inset: -14, width: 118, height: 118, animation: 'spinSlow 15s linear infinite' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke={C.tealLight} strokeWidth="1" strokeDasharray="4 8" opacity="0.4" />
            <circle cx="50" cy="5" r="2" fill={C.teal} />
            <circle cx="95" cy="50" r="1.5" fill={C.sky} />
            <circle cx="5" cy="50" r="1.5" fill={C.blue} />
          </svg>

          {/* Core Glass Icon */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))', border: `1.5px solid rgba(255,255,255,1)`,
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(15,118,110,0.12), inset 0 0 20px rgba(255,255,255,1)'
          }}>
            <svg viewBox="0 0 48 48" width={38} height={38} style={{ filter: 'drop-shadow(0 4px 6px rgba(20,184,166,0.3))' }}>
              <rect x="20" y="12" width="8" height="24" rx="3" fill="url(#tealGrad)" />
              <rect x="12" y="20" width="24" height="8" rx="3" fill="url(#tealGrad)" />
              <circle cx="24" cy="24" r="3" fill="#fff" />
              <defs>
                <linearGradient id="tealGrad" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor={C.tealLight} />
                  <stop offset="1" stopColor={C.teal} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* ── 2. Animated Gradient Title ── */}
        <h1 style={{ 
          fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2rem, 5.5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.02em',
          marginBottom: '1rem', minHeight: '1.2em', position: 'relative'
        }}>
          <span className="gradient-text">
            {typedText}
          </span>
          <span style={{ 
            display: 'inline-block', width: 4, height: '0.85em', backgroundColor: C.tealLight, 
            marginLeft: 8, verticalAlign: 'middle', borderRadius: 4, boxShadow: '0 0 10px rgba(20,184,166,0.5)',
            animation: 'lpBlink 0.9s infinite step-end', opacity: typedText.length === 'Diabetes Expert System'.length ? 0 : 1
          }} />
        </h1>

        {/* Subtitle */}
        <p style={{ maxWidth: 620, fontSize: '1.15rem', color: C.textMid, lineHeight: '1.6', fontWeight: 300, opacity: showSubtitle ? 1 : 0, transform: `translateY(${showSubtitle ? 0 : 15}px)`, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)', marginBottom: '3rem' }}>
          An intelligent clinical decision support system for early detection, risk assessment, and personalized diabetes management.
        </p>

        {/* ── 3. Glassmorphism Badges ── */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3.5rem' }}>
          {[
            { icon: '🩺', text: 'AI Diagnosis' }, 
            { icon: '📊', text: 'Risk Analysis' }, 
            { icon: '💊', text: 'Treatment Plan' }
          ].map((b, i) => (
            <div key={i} className="glass-badge" style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.4rem', borderRadius: '50px', 
              background: C.glassBg, border: `1px solid ${C.glassBorder}`, 
              boxShadow: C.glassShadow, backdropFilter: 'blur(12px)',
              color: C.teal, fontWeight: 600, fontSize: '0.95rem',
              opacity: visibleBadges > i ? 1 : 0, transform: `translateY(${visibleBadges > i ? 0 : 20}px) scale(${visibleBadges > i ? 1 : 0.95})`, 
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>

        {/* ── 4. Premium CTA Button ── */}
        <div style={{ opacity: showCTA ? 1 : 0, transform: `translateY(${showCTA ? 0 : 20}px)`, transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <button onClick={handleStart} className="premium-btn">
            Get Started
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
            <p style={{ fontSize: '0.7rem', letterSpacing: '3px', color: C.textSoft, textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>Developed by</p>
            <div style={{ height: 1, width: 40, background: `linear-gradient(to left, transparent, ${C.tealBorder})` }} />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
            {[
              { n: 'Sao Kuntisa', c: C.tealLight }, 
              { n: 'Chheng Vichea', c: C.blue }, 
              { n: 'Sary Danish', c: C.purple }, 
              { n: 'Chan Chungchay', c: C.sky }
            ].map((m, i) => (
              <div key={i} className="team-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <div className="avatar-glass" style={{
                  width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.3))`,
                  border: `2px solid rgba(255,255,255,1)`, color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontWeight: 800, fontSize: '1rem', fontFamily: "'Outfit', sans-serif", boxShadow: `0 8px 24px ${m.c}1A`, backdropFilter: 'blur(8px)',
                  position: 'relative', zIndex: 2
                }}>
                  {m.n[0]}
                </div>
                <span className="team-name" style={{ fontSize: '0.8rem', color: C.textMid, fontWeight: 500, padding: '0.3rem 0.8rem', background: C.glassBg, borderRadius: '20px', border: `1px solid ${C.glassBorder}`, backdropFilter: 'blur(4px)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>{m.n}</span>
              </div>
            ))}
          </div>
          
          <div className="prof-badge" style={{ 
            padding: '0.6rem 1.8rem', borderRadius: '50px', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
            border: `1px solid ${C.glassBorder}`, color: C.gold, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            backdropFilter: 'blur(10px)', boxShadow: `0 8px 24px ${C.goldBg}`
          }}>
            <span style={{ fontSize: '1.2rem', filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.2))' }}>👨‍🏫</span>
            <span style={{ color: C.textSoft }}>Supervised by</span>
            <b style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Prof. Sek Sokcheat</b>
          </div>
        </div>
      </main>

      <footer style={{ position: 'fixed', bottom: '1.5rem', width: '100%', textAlign: 'center', fontSize: '0.75rem', color: C.textFaint, fontWeight: 500, zIndex: 3 }}>
        <p>v1.0  <span style={{ margin: '0 0.5rem', color: C.tealBorder }}>|</span>  Norton University  <span style={{ margin: '0 0.5rem', color: C.tealBorder }}>—</span>  Phnom Penh</p>
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
          background: linear-gradient(135deg, #0f172a 0%, #0f766e 50%, #0284c7 100%);
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
          background: linear-gradient(135deg, #0f766e, #14b8a6);
          color: #fff;
          border: none;
          font-family: 'Outfit', sans-serif;
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
