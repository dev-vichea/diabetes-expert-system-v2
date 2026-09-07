import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Baby,
  Bandage,
  BatteryLow,
  BookOpen,
  Bug,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Contrast,
  Dna,
  Droplets,
  Eye,
  FileSpreadsheet,
  FlaskConical,
  GlassWater,
  GraduationCap,
  Hand,
  HeartPulse,
  Info,
  Layers,
  Microscope,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TrendingDown,
  X,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'
import {
  DIABETES_TYPES,
  SYMPTOM_CATEGORIES,
  SYMPTOMS_DIRECTORY,
} from '@/data/diabetes-guide-data'

const ICON_MAP = {
  Droplets,
  GlassWater,
  Activity,
  TrendingDown,
  BatteryLow,
  Eye,
  Hand,
  Bandage,
  Bug,
  Contrast,
  Baby,
  AlertTriangle,
  FlaskConical,
  HeartPulse,
}

export function DiabetesGuidePage() {
  const { t, isKhmer } = useLanguage()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('types') // 'types' | 'symptoms'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSymptom, setActiveSymptom] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Filter symptoms by category and search text
  const filteredSymptoms = useMemo(() => {
    return SYMPTOMS_DIRECTORY.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const name = (item.name || '').toLowerCase()
        const nameKm = (item.nameKm || '').toLowerCase()
        const med = (item.medicalTerm || '').toLowerCase()
        const summary = (item.shortSummary || '').toLowerCase()
        const summaryKm = (item.shortSummaryKm || '').toLowerCase()
        return (
          name.includes(q) ||
          nameKm.includes(q) ||
          med.includes(q) ||
          summary.includes(q) ||
          summaryKm.includes(q)
        )
      }
      return true
    })
  }, [selectedCategory, searchQuery])

  // Handle ESC key and lock body scroll when symptom dialog is open
  useEffect(() => {
    if (!activeSymptom) return undefined

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActiveSymptom(null)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeSymptom])

  // Reset image loading and error states when inspecting a different symptom
  useEffect(() => {
    setImageLoaded(false)
    setImageError(false)
  }, [activeSymptom?.key])

  const openSymptomByKey = (key) => {
    const found = SYMPTOMS_DIRECTORY.find((s) => s.key === key)
    if (found) {
      setActiveSymptom(found)
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Top Hero Banner ── */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-10 text-white shadow-xl border border-slate-800/80">
        {/* Background 3D Clinical Graphic & Gradient Overlays */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/images/guide-hero-bg.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-right opacity-70 dark:opacity-80 transition-opacity"
          />
          {/* Horizontal fade: solid dark on the left for maximum text readability, revealing glowing DNA/molecules on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 via-50% to-transparent" />
          {/* Vertical subtle vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <GraduationCap className="h-3.5 w-3.5 text-sky-300" />
            <span>{t('diabetesGuide.badge', 'Clinical Knowledge Hub')}</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {t('diabetesGuide.title', 'Diabetes & Symptoms Guide')}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            {t(
              'diabetesGuide.subtitle',
              'Learn how diabetes types differ, explore how symptoms arise in the body, and know when to seek clinical care.'
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs border border-white/10">
              <Dna className="h-4 w-4 text-primary-300" />
              <span>
                {t('diabetesGuide.typeCount', '{{count}} clinical classifications', {
                  count: DIABETES_TYPES.length,
                })}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xs border border-white/10">
              <ClipboardList className="h-4 w-4 text-emerald-300" />
              <span>
                {t('diabetesGuide.symptomCount', '{{count}} symptoms cataloged', {
                  count: SYMPTOMS_DIRECTORY.length,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Search Bar in Hero ── */}
        <div className="relative z-10 mt-8 max-w-2xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (activeTab !== 'symptoms') setActiveTab('symptoms')
              }}
              placeholder={t(
                'diabetesGuide.searchPlaceholder',
                'Search symptoms, medical terms (e.g. Polydipsia), or keywords...'
              )}
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-3.5 pl-11 pr-10 text-sm text-white placeholder-slate-400 backdrop-blur-md transition-all focus:border-sky-400 focus:bg-white/15 focus:outline-hidden focus:ring-2 focus:ring-sky-400/40"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 rounded-full p-1 text-slate-400 hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Tab Switcher ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('types')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm',
              activeTab === 'types'
                ? 'bg-white text-primary-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <Dna className="h-4 w-4" />
            <span>{t('diabetesGuide.tabs.types', 'Types of Diabetes')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('symptoms')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm',
              activeTab === 'symptoms'
                ? 'bg-white text-primary-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            <Activity className="h-4 w-4" />
            <span>{t('diabetesGuide.tabs.symptoms', 'Symptoms Directory')}</span>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-700 dark:bg-primary-900/60 dark:text-primary-300">
              {SYMPTOMS_DIRECTORY.length}
            </span>
          </button>
        </div>

        <Link
          to="/diagnosis"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.99]"
        >
          <Microscope className="h-4 w-4" />
          <span>{t('assessment.interview.startSelfCheck', 'Start Assessment')}</span>
        </Link>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TAB 1: TYPES OF DIABETES
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'types' && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t(
              'diabetesGuide.typesIntro',
              'The primary clinical classifications recognized by international guidelines (ADA, WHO).'
            )}
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            {DIABETES_TYPES.map((type) => (
              <article
                key={type.id}
                className="flex flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40"
              >
                {/* Header Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold', type.accentBg, type.accentText, 'border', type.accentBorder)}>
                      {isKhmer ? type.badgeKm : type.badge}
                    </span>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {isKhmer ? type.nameKm : type.name}
                    </h2>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {type.code}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {isKhmer ? type.descriptionKm : type.description}
                </p>

                {/* Onset & Reversibility */}
                <div className="mt-4 grid gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-xs dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <strong className="font-bold text-slate-900 dark:text-slate-100">
                      {t('diabetesGuide.card.onset', 'Onset Pattern')}:
                    </strong>{' '}
                    <span className="text-slate-600 dark:text-slate-300">
                      {isKhmer ? type.onsetKm : type.onset}
                    </span>
                  </div>
                  <div>
                    <strong className="font-bold text-slate-900 dark:text-slate-100">
                      {t('diabetesGuide.card.reversibility', 'Clinical Outcome')}:
                    </strong>{' '}
                    <span className="text-slate-600 dark:text-slate-300">
                      {isKhmer ? type.reversibilityKm : type.reversibility}
                    </span>
                  </div>
                </div>

                {/* Biomarkers Table */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('diabetesGuide.card.biomarkers', 'Diagnostic Biomarkers')}
                  </h3>
                  <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 dark:divide-slate-800 dark:border-slate-800 text-xs">
                    {type.biomarkers.map((bio, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5">
                        <span className="font-medium text-slate-600 dark:text-slate-400">{bio.label}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-200">{bio.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Associated Symptoms Tags */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('diabetesGuide.card.associatedSymptoms', 'Associated Symptoms')}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {type.associatedSymptoms.map((symKey) => {
                      const sym = SYMPTOMS_DIRECTORY.find((s) => s.key === symKey)
                      if (!sym) return null
                      return (
                        <button
                          key={symKey}
                          type="button"
                          onClick={() => openSymptomByKey(symKey)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-600 dark:hover:text-primary-300"
                        >
                          <span>{isKhmer ? sym.nameKm : sym.name}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Management Strategies */}
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('diabetesGuide.card.management', 'Clinical Management')}
                  </h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {(isKhmer ? type.managementKm : type.management).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 2: SYMPTOMS DIRECTORY
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'symptoms' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t(
                'diabetesGuide.symptomsIntro',
                'Explore common and critical signs of hyperglycemia and metabolic distress.'
              )}
            </p>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {SYMPTOM_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                  )}
                >
                  {isKhmer ? cat.labelKm : cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms Grid */}
          {filteredSymptoms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
              <Search className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                {t('diabetesGuide.emptySearch', 'No symptoms matched your search.')}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('common.tryAdjustingFilters', 'Try adjusting your search terms or category filter.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t('diabetesGuide.clearSearch', 'Clear search')}</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSymptoms.map((symptom) => {
                const IconComponent = ICON_MAP[symptom.iconName] || Activity
                return (
                  <article
                    key={symptom.key}
                    onClick={() => setActiveSymptom(symptom)}
                    className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-primary-600"
                  >
                    <div>
                      {/* Icon & Urgency Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border transition-colors', symptom.accentColor)}>
                          <IconComponent className="h-5 w-5" />
                        </div>

                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-bold',
                            symptom.urgency === 'urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : symptom.urgency === 'review'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          )}
                        >
                          {isKhmer ? symptom.urgencyLabelKm : symptom.urgencyLabel}
                        </span>
                      </div>

                      {/* Title & Medical Term */}
                      <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-300 transition-colors">
                        {isKhmer ? symptom.nameKm : symptom.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-primary-600 dark:text-sky-300 font-semibold">
                        <Sparkles className="h-3 w-3" />
                        <span>{symptom.medicalTerm}</span>
                      </div>

                      {/* Short summary */}
                      <p className="mt-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                        {isKhmer ? symptom.shortSummaryKm : symptom.shortSummary}
                      </p>
                    </div>

                    {/* Footer Link */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-primary-600 dark:border-slate-800/80 dark:text-primary-400">
                      <span>{t('diabetesGuide.card.clickDetails', 'View full details')}</span>
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          INTERACTIVE SYMPTOM DETAIL MODAL (PORTAL)
         ────────────────────────────────────────────────────────── */}
      {activeSymptom &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in-0 duration-200"
            onClick={() => setActiveSymptom(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-950 animate-in zoom-in-95 duration-150"
            >
              {/* Optional Top Hero Image Banner (Optimized: On-demand, Lazy, Shimmer Skeleton) */}
              {activeSymptom.image && !imageError && (
                <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  {/* Shimmer skeleton placeholder */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
                  )}

                  <img
                    src={activeSymptom.image}
                    alt={isKhmer ? activeSymptom.nameKm : activeSymptom.name}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    className={cn(
                      'h-full w-full object-cover transition-opacity duration-300',
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Top Accent Header */}
              <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 dark:border-slate-800/80 dark:bg-slate-900/40">
                {/* Meta Row: Badges & Close Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category badge */}
                    {(() => {
                      const catObj = SYMPTOM_CATEGORIES.find((c) => c.id === activeSymptom.category)
                      const catLabel = isKhmer ? catObj?.labelKm : catObj?.label
                      return (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                          <span>{catLabel || activeSymptom.category}</span>
                        </span>
                      )
                    })()}

                    {/* Medical / Scientific Term */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950/70 dark:text-primary-300">
                      <Sparkles className="h-3 w-3" />
                      <span>{activeSymptom.medicalTerm}</span>
                    </span>

                    {/* Urgency Badge */}
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-bold',
                        activeSymptom.urgency === 'urgent'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : activeSymptom.urgency === 'review'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      )}
                    >
                      {isKhmer ? activeSymptom.urgencyLabelKm : activeSymptom.urgencyLabel}
                    </span>
                  </div>

                  {/* Accessible Circular Close Button */}
                  <button
                    type="button"
                    onClick={() => setActiveSymptom(null)}
                    aria-label={t('common.close', 'Close')}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-2xs transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Symptom Title & Icon Row */}
                <div className="mt-4 flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-xs',
                      activeSymptom.accentColor
                    )}
                  >
                    {(() => {
                      const IconComp = ICON_MAP[activeSymptom.iconName] || Activity
                      return <IconComp className="h-7 w-7" />
                    })()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                      {isKhmer ? activeSymptom.nameKm : activeSymptom.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {isKhmer ? activeSymptom.shortSummaryKm : activeSymptom.shortSummary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body Content (Clean linear layout) */}
              <div className="overflow-y-auto p-6 space-y-6 text-sm">
                {/* Biological Mechanism Box */}
                <div className="rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-50/70 to-sky-50/50 p-5 dark:border-primary-900/50 dark:bg-primary-950/30">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-300">
                    <Dna className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <span>{t('diabetesGuide.modal.whyItHappens', 'Why It Happens (Biological Mechanism)')}</span>
                  </div>
                  <p className="mt-2.5 leading-relaxed text-slate-700 dark:text-slate-200">
                    {isKhmer ? activeSymptom.physiologyKm : activeSymptom.physiology}
                  </p>
                </div>

                {/* Associated Types */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('diabetesGuide.modal.associatedTypes', 'Associated Diabetes Types')}
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeSymptom.types.map((typeLabel, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-500" />
                        <span>{typeLabel}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Self-Care & Prevention Tips */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('diabetesGuide.modal.careTips', 'Self-Care & Prevention Advice')}
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {(isKhmer ? activeSymptom.careTipsKm : activeSymptom.careTips).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Red Flag Warning Alert */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    <ShieldAlert className="h-4 w-4" />
                    <span>{t('diabetesGuide.modal.redFlags', 'When to Seek Immediate Care')}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-rose-900 dark:text-rose-200">
                    {isKhmer ? activeSymptom.redFlagsKm : activeSymptom.redFlags}
                  </p>
                </div>
              </div>

              {/* Modal Footer CTA */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
                <button
                  type="button"
                  onClick={() => setActiveSymptom(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  {t('diabetesGuide.modal.close', 'Close')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSymptom(null)
                    navigate('/diagnosis')
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.99]"
                >
                  <Microscope className="h-4 w-4" />
                  <span>{t('diabetesGuide.modal.takeAssessment', 'Check Your Symptoms in Assessment')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
