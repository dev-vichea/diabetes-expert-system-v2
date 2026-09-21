import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Bot, Check, ChevronRight, GraduationCap, GripHorizontal, HeartPulse, Lightbulb, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { ASSISTANT_COPY, DIABETES_QUESTIONS } from './diabetesQuestions'
import './DiabetesAssistant.css'

const STORAGE_KEY = 'diabetes-assistant-conversation:v1'
const PANEL_PLACEMENT_STORAGE_KEY = 'diabetes-assistant-placement:v1'
const TRIGGER_PLACEMENT_STORAGE_KEY = 'diabetes-assistant-trigger-placement:v1'
const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'
const DESKTOP_EDGE_GAP = 24
const DESKTOP_TRIGGER_GAP = 124
const MASCOT_GREETINGS = ['Hello! 👋', 'How can I help you?']

const CONVERSATION_STAGES = {
  INTRO: 'intro',
  TOPICS: 'topics',
  FOLLOW_UP: 'follow-up',
  COMPLETE: 'complete',
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function readStoredPlacement(storageKey) {
  if (typeof window === 'undefined') return null

  try {
    const placement = JSON.parse(window.localStorage.getItem(storageKey))
    if (['left', 'right'].includes(placement?.side) && Number.isFinite(placement?.y)) {
      return placement
    }
  } catch {
    // Default placement is used when local storage is unavailable or malformed.
  }

  return null
}

function createMessage(sender, text) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sender,
    text,
  }
}

function createInitialConversation() {
  return {
    stage: CONVERSATION_STAGES.INTRO,
    messages: [createMessage('bot', ASSISTANT_COPY.welcome)],
  }
}

function readStoredConversation() {
  if (typeof window === 'undefined') return createInitialConversation()

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY))
    const validStage = Object.values(CONVERSATION_STAGES).includes(stored?.stage)
    const validMessages =
      Array.isArray(stored?.messages)
      && stored.messages.length > 0
      && stored.messages.every(
        (message) =>
          typeof message?.id === 'string'
          && ['bot', 'user'].includes(message?.sender)
          && typeof message?.text === 'string',
      )

    if (validStage && validMessages) return stored
  } catch {
    // A malformed or unavailable session store should not prevent the assistant from opening.
  }

  return createInitialConversation()
}

function ChatMessage({ message }) {
  const isUser = message.sender === 'user'

  return (
    <div className={`flex animate-in items-end gap-2.5 fade-in slide-in-from-bottom-1 duration-300 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-100 bg-white text-primary-600 shadow-[0_4px_12px_rgba(31,118,232,0.12)] dark:border-primary-900/70 dark:bg-slate-800 dark:text-primary-300"
          aria-hidden="true"
        >
          <Bot className="h-[18px] w-[18px]" />
        </span>
      )}
      <div className="max-w-[84%] sm:max-w-[82%]">
        <div
          className={[
            'whitespace-pre-line px-4 py-3 text-left text-[13px] leading-[1.6] shadow-sm sm:text-sm',
            isUser
              ? 'rounded-[20px] rounded-br-md bg-gradient-to-br from-primary-600 to-cyan-600 text-white shadow-[0_6px_18px_rgba(31,118,232,0.2)]'
              : 'rounded-[20px] rounded-bl-md border border-primary-100 bg-primary-50/90 text-slate-700 dark:border-primary-900/60 dark:bg-primary-950/35 dark:text-slate-100',
          ].join(' ')}
        >
          {message.text}
        </div>
      </div>
    </div>
  )
}

function ChatOptions({ stage, onChooseIntro, onChooseQuestion, onChooseFollowUp, onBack }) {
  const primaryChoiceClass =
    'inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-primary-600 to-cyan-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(31,118,232,0.2)] transition duration-200 hover:-translate-y-0.5 hover:from-primary-700 hover:to-cyan-700 hover:shadow-[0_8px_20px_rgba(31,118,232,0.25)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900'
  const secondaryChoiceClass =
    'inline-flex min-h-11 min-w-28 items-center justify-center gap-2 rounded-full border border-primary-300 bg-white px-6 py-2.5 text-sm font-bold text-primary-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary-400 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-primary-700 dark:bg-slate-800 dark:text-primary-200 dark:hover:bg-primary-950/40 dark:focus:ring-offset-slate-900'

  if (stage === CONVERSATION_STAGES.INTRO) {
    return (
      <div className="pl-11">
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={primaryChoiceClass} onClick={() => onChooseIntro(true)}>
            <Check className="h-4 w-4" />
            Yes
          </button>
          <button type="button" className={secondaryChoiceClass} onClick={() => onChooseIntro(false)}>
            <X className="h-4 w-4" />
            No
          </button>
        </div>
      </div>
    )
  }

  if (stage === CONVERSATION_STAGES.TOPICS) {
    return (
      <div className="rounded-[20px] border border-slate-200/90 bg-white p-3.5 shadow-[0_8px_28px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900 sm:p-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-300" aria-hidden="true">
              <Lightbulb className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white sm:text-[15px]">Suggested questions</h3>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">Choose a topic below</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-extrabold text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
            {DIABETES_QUESTIONS.length} topics
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {DIABETES_QUESTIONS.map((item, index) => {
            const isUrgent = item.id === 'urgent-help'

            return (
              <button
                key={item.id}
                type="button"
                className="group flex min-h-[54px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-semibold leading-[1.4] text-slate-700 transition duration-200 hover:-translate-y-px hover:border-cyan-300 hover:bg-cyan-50/60 hover:text-primary-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/35 dark:hover:text-cyan-100 dark:focus:ring-offset-slate-900"
                onClick={() => onChooseQuestion(item)}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold transition-colors ${isUrgent ? 'bg-rose-50 text-rose-600 group-hover:bg-white dark:bg-rose-950/50 dark:text-rose-300' : 'bg-primary-50 text-primary-700 group-hover:bg-white dark:bg-slate-700 dark:text-primary-200 dark:group-hover:bg-cyan-900/70'}`}>
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span>{item.displayQuestion || item.question}</span>
                  {isUrgent && (
                    <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                      Urgent
                    </span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-cyan-600" />
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="mt-2.5 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-transparent px-3 py-2 text-xs font-bold text-slate-500 transition duration-200 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          onClick={onBack}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      </div>
    )
  }

  if (stage === CONVERSATION_STAGES.FOLLOW_UP) {
    return (
      <div className="pl-11">
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className={primaryChoiceClass} onClick={() => onChooseFollowUp(true)}>
            <Check className="h-4 w-4" />
            Yes
          </button>
          <button type="button" className={secondaryChoiceClass} onClick={() => onChooseFollowUp(false)}>
            <X className="h-4 w-4" />
            No
          </button>
        </div>
      </div>
    )
  }

  return null
}

export function DiabetesAssistant() {
  const isDesktopViewport = typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(readStoredConversation)
  const [panelPosition, setPanelPosition] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [triggerPosition, setTriggerPosition] = useState(null)
  const [isTriggerDragging, setIsTriggerDragging] = useState(false)
  const [greetingIndex, setGreetingIndex] = useState(0)
  const messageEndRef = useRef(null)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const dragStateRef = useRef(null)
  const triggerDragStateRef = useRef(null)
  const lastTriggerDragAtRef = useRef(0)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversation))
    } catch {
      // The conversation still works in memory when session storage is unavailable.
    }
  }, [conversation])

  useEffect(() => {
    if (isOpen) {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [conversation, isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') closeAssistant()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    let frameId

    function placePanel() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
          dragStateRef.current = null
          setIsDragging(false)
          setPanelPosition(null)
          return
        }

        const panel = panelRef.current
        if (!panel) return

        const rect = panel.getBoundingClientRect()
        const storedPlacement = readStoredPlacement(PANEL_PLACEMENT_STORAGE_KEY)
        const side = storedPlacement?.side || 'right'
        const defaultY = window.innerHeight - rect.height - DESKTOP_TRIGGER_GAP
        const y = clamp(
          storedPlacement?.y ?? defaultY,
          DESKTOP_EDGE_GAP,
          window.innerHeight - rect.height - DESKTOP_EDGE_GAP,
        )
        const x = side === 'left'
          ? DESKTOP_EDGE_GAP
          : window.innerWidth - rect.width - DESKTOP_EDGE_GAP

        setPanelPosition({ x, y })
      })
    }

    placePanel()
    window.addEventListener('resize', placePanel)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', placePanel)
    }
  }, [isOpen])

  useEffect(() => {
    let frameId

    function placeTrigger() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) {
          triggerDragStateRef.current = null
          setIsTriggerDragging(false)
          setTriggerPosition(null)
          return
        }

        const trigger = triggerRef.current
        if (!trigger) return

        const rect = trigger.getBoundingClientRect()
        const storedPlacement = readStoredPlacement(TRIGGER_PLACEMENT_STORAGE_KEY)
        const side = storedPlacement?.side || 'right'
        const defaultY = window.innerHeight - rect.height - DESKTOP_EDGE_GAP
        const y = clamp(
          storedPlacement?.y ?? defaultY,
          DESKTOP_EDGE_GAP,
          window.innerHeight - rect.height - DESKTOP_EDGE_GAP,
        )
        const x = side === 'left'
          ? DESKTOP_EDGE_GAP
          : window.innerWidth - rect.width - DESKTOP_EDGE_GAP

        setTriggerPosition({ x, y })
      })
    }

    placeTrigger()
    window.addEventListener('resize', placeTrigger)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', placeTrigger)
    }
  }, [])

  useEffect(() => {
    if (isOpen) return undefined

    const intervalId = window.setInterval(() => {
      setGreetingIndex((current) => (current + 1) % MASCOT_GREETINGS.length)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [isOpen])

  function appendMessages(messages, stage) {
    setConversation((current) => ({
      stage,
      messages: [...current.messages, ...messages],
    }))
  }

  function handleIntroChoice(hasQuestion) {
    if (hasQuestion) {
      appendMessages(
        [createMessage('user', 'Yes'), createMessage('bot', ASSISTANT_COPY.topicPrompt)],
        CONVERSATION_STAGES.TOPICS,
      )
      return
    }

    appendMessages(
      [createMessage('user', 'No'), createMessage('bot', ASSISTANT_COPY.initialDecline)],
      CONVERSATION_STAGES.COMPLETE,
    )
  }

  function handleQuestion(question) {
    appendMessages(
      [
        createMessage('user', question.question),
        createMessage('bot', question.answer),
        createMessage('bot', ASSISTANT_COPY.followUp),
      ],
      CONVERSATION_STAGES.FOLLOW_UP,
    )
  }

  function handleFollowUp(wantsAnotherQuestion) {
    if (wantsAnotherQuestion) {
      appendMessages(
        [createMessage('user', 'Yes'), createMessage('bot', ASSISTANT_COPY.topicPrompt)],
        CONVERSATION_STAGES.TOPICS,
      )
      return
    }

    appendMessages(
      [createMessage('user', 'No'), createMessage('bot', ASSISTANT_COPY.finished)],
      CONVERSATION_STAGES.COMPLETE,
    )
  }

  function handleBack() {
    appendMessages(
      [createMessage('user', 'Back'), createMessage('bot', 'Do you have any questions about diabetes?')],
      CONVERSATION_STAGES.INTRO,
    )
  }

  function restartConversation() {
    setConversation(createInitialConversation())
  }

  function closeAssistant() {
    dragStateRef.current = null
    setIsDragging(false)
    setIsOpen(false)
    window.requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function handleDragStart(event) {
    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.target.closest('button')) return

    const panel = panelRef.current
    if (!panel) return

    const rect = panel.getBoundingClientRect()
    const position = { x: rect.left, y: rect.top }
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      latestPosition: position,
    }
    setPanelPosition(position)
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function handleDragMove(event) {
    const dragState = dragStateRef.current
    const panel = panelRef.current
    if (!dragState || !panel || dragState.pointerId !== event.pointerId) return

    const rect = panel.getBoundingClientRect()
    const position = {
      x: clamp(
        event.clientX - dragState.offsetX,
        DESKTOP_EDGE_GAP,
        window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
      ),
      y: clamp(
        event.clientY - dragState.offsetY,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP,
      ),
    }

    dragState.latestPosition = position
    setPanelPosition(position)
  }

  function finishDrag(event) {
    const dragState = dragStateRef.current
    const panel = panelRef.current
    if (!dragState || !panel || dragState.pointerId !== event.pointerId) return

    const rect = panel.getBoundingClientRect()
    const latestPosition = dragState.latestPosition || { x: rect.left, y: rect.top }
    const side = latestPosition.x + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
    const snappedPosition = {
      x: side === 'left'
        ? DESKTOP_EDGE_GAP
        : window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
      y: clamp(
        latestPosition.y,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP,
      ),
    }

    dragStateRef.current = null
    setIsDragging(false)
    setPanelPosition(snappedPosition)

    try {
      window.localStorage.setItem(
        PANEL_PLACEMENT_STORAGE_KEY,
        JSON.stringify({ side, y: snappedPosition.y }),
      )
    } catch {
      // Placement persistence is optional; dragging still works in memory.
    }

    const trigger = triggerRef.current
    if (trigger) {
      const triggerRect = trigger.getBoundingClientRect()
      const storedTriggerPlacement = readStoredPlacement(TRIGGER_PLACEMENT_STORAGE_KEY)
      const triggerY = clamp(
        triggerPosition?.y
          ?? storedTriggerPlacement?.y
          ?? window.innerHeight - triggerRect.height - DESKTOP_EDGE_GAP,
        DESKTOP_EDGE_GAP,
        window.innerHeight - triggerRect.height - DESKTOP_EDGE_GAP,
      )
      const syncedTriggerPosition = {
        x: side === 'left'
          ? DESKTOP_EDGE_GAP
          : window.innerWidth - triggerRect.width - DESKTOP_EDGE_GAP,
        y: triggerY,
      }

      setTriggerPosition(syncedTriggerPosition)
      try {
        window.localStorage.setItem(
          TRIGGER_PLACEMENT_STORAGE_KEY,
          JSON.stringify({ side, y: triggerY }),
        )
      } catch {
        // Placement persistence is optional; dragging still works in memory.
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleTriggerPointerDown(event) {
    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const position = { x: rect.left, y: rect.top }
    triggerDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      latestPosition: position,
      moved: false,
    }
    setTriggerPosition(position)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTriggerPointerMove(event) {
    const dragState = triggerDragStateRef.current
    const trigger = triggerRef.current
    if (!dragState || !trigger || dragState.pointerId !== event.pointerId) return

    const movement = Math.hypot(
      event.clientX - dragState.startX,
      event.clientY - dragState.startY,
    )
    if (!dragState.moved && movement < 5) return

    dragState.moved = true
    setIsTriggerDragging(true)

    const rect = trigger.getBoundingClientRect()
    const position = {
      x: clamp(
        event.clientX - dragState.offsetX,
        DESKTOP_EDGE_GAP,
        window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
      ),
      y: clamp(
        event.clientY - dragState.offsetY,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP,
      ),
    }

    dragState.latestPosition = position
    setTriggerPosition(position)
    event.preventDefault()
  }

  function finishTriggerDrag(event) {
    const dragState = triggerDragStateRef.current
    const trigger = triggerRef.current
    if (!dragState || !trigger || dragState.pointerId !== event.pointerId) return

    triggerDragStateRef.current = null
    setIsTriggerDragging(false)

    if (dragState.moved) {
      const rect = trigger.getBoundingClientRect()
      const side = dragState.latestPosition.x + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
      const snappedPosition = {
        x: side === 'left'
          ? DESKTOP_EDGE_GAP
          : window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
        y: clamp(
          dragState.latestPosition.y,
          DESKTOP_EDGE_GAP,
          window.innerHeight - rect.height - DESKTOP_EDGE_GAP,
        ),
      }

      lastTriggerDragAtRef.current = Date.now()
      setTriggerPosition(snappedPosition)

      try {
        window.localStorage.setItem(
          TRIGGER_PLACEMENT_STORAGE_KEY,
          JSON.stringify({ side, y: snappedPosition.y }),
        )
      } catch {
        // Placement persistence is optional; dragging still works in memory.
      }

      const panel = panelRef.current
      if (panel) {
        const panelRect = panel.getBoundingClientRect()
        const storedPanelPlacement = readStoredPlacement(PANEL_PLACEMENT_STORAGE_KEY)
        const panelY = clamp(
          panelPosition?.y
            ?? storedPanelPlacement?.y
            ?? window.innerHeight - panelRect.height - DESKTOP_TRIGGER_GAP,
          DESKTOP_EDGE_GAP,
          window.innerHeight - panelRect.height - DESKTOP_EDGE_GAP,
        )
        const syncedPanelPosition = {
          x: side === 'left'
            ? DESKTOP_EDGE_GAP
            : window.innerWidth - panelRect.width - DESKTOP_EDGE_GAP,
          y: panelY,
        }

        setPanelPosition(syncedPanelPosition)
        try {
          window.localStorage.setItem(
            PANEL_PLACEMENT_STORAGE_KEY,
            JSON.stringify({ side, y: panelY }),
          )
        } catch {
          // Placement persistence is optional; dragging still works in memory.
        }
      }
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleTriggerClick() {
    if (Date.now() - lastTriggerDragAtRef.current < 300) return
    setIsOpen((current) => !current)
  }

  const triggerIsOnLeft = Boolean(
    isDesktopViewport
    && triggerPosition
    && triggerPosition.x < window.innerWidth / 2,
  )

  return (
    <div
      style={isDesktopViewport && triggerPosition ? { left: triggerPosition.x, top: triggerPosition.y } : undefined}
      className={[
        'fixed bottom-4 right-3 z-[70] transition-[left,top] ease-out sm:bottom-6 sm:right-6',
        triggerPosition ? 'md:bottom-auto md:right-auto' : '',
        isTriggerDragging ? 'duration-0' : 'duration-300',
      ].join(' ')}
    >
      <section
        ref={panelRef}
        id="diabetes-assistant-panel"
        role="dialog"
        aria-label={ASSISTANT_COPY.title}
        aria-hidden={!isOpen}
        style={isDesktopViewport && panelPosition ? { left: panelPosition.x, top: panelPosition.y } : undefined}
        className={[
          'fixed bottom-[7.75rem] right-3 flex h-[min(46rem,calc(100dvh-8.5rem))] max-h-[86dvh] w-[calc(100vw-1.5rem)] origin-bottom-right flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_24px_70px_-22px_rgba(15,23,42,0.42)] transition-[opacity,transform,left,top] ease-out dark:border-slate-700 dark:bg-slate-900 sm:w-[29rem] sm:max-w-[calc(100vw-3rem)] md:bottom-[7.75rem] md:right-6',
          panelPosition ? 'md:bottom-auto md:right-auto' : '',
          isDragging ? 'duration-0' : 'duration-300',
          isOpen
            ? 'visible translate-y-0 scale-100 opacity-100'
            : 'invisible pointer-events-none translate-y-4 scale-[0.97] opacity-0',
        ].join(' ')}
      >
        <header
          className="relative flex shrink-0 items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-primary-700 via-primary-600 to-cyan-600 px-4 py-4 text-white sm:px-5 md:cursor-grab md:select-none md:active:cursor-grabbing"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          title="Drag to move the assistant"
        >
          <span className="pointer-events-none absolute -left-10 -top-16 h-36 w-52 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
          <span className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-cyan-200/15 blur-lg" aria-hidden="true" />
          <GripHorizontal className="pointer-events-none absolute left-1/2 top-0.5 hidden h-4 w-4 -translate-x-1/2 text-white/45 md:block" aria-hidden="true" />

          <div className="relative flex min-w-0 items-center gap-3">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary-600 shadow-[0_6px_18px_rgba(15,23,42,0.18)]" aria-hidden="true">
              <Bot className="h-6 w-6" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-400" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-extrabold tracking-[-0.01em] text-white sm:text-base">{ASSISTANT_COPY.title}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-blue-50/90">
                <GraduationCap className="h-3.5 w-3.5" />
                Patient education
              </p>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={restartConversation}
              className="flex min-h-9 items-center justify-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold text-white/95 transition duration-200 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80 sm:px-3 sm:text-xs"
              aria-label="Restart conversation"
              title="Restart conversation"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Restart</span>
            </button>
            <span className="h-6 w-px bg-white/30" aria-hidden="true" />
            <button
              type="button"
              onClick={closeAssistant}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/95 transition duration-200 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80"
              aria-label="Close Diabetes Assistant"
              title="Close"
            >
              <X className="h-[21px] w-[21px]" />
            </button>
          </div>
        </header>

        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="assistant-chat-scroll flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-gradient-to-b from-slate-50 via-white to-primary-50/40 px-3.5 py-4 dark:from-slate-950 dark:via-slate-950 dark:to-primary-950/20 sm:p-5"
        >
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
          <div ref={messageEndRef} />

          {conversation.stage !== CONVERSATION_STAGES.COMPLETE && (
            <div className="mt-5">
              <ChatOptions
                stage={conversation.stage}
                onChooseIntro={handleIntroChoice}
                onChooseQuestion={handleQuestion}
                onChooseFollowUp={handleFollowUp}
                onBack={handleBack}
              />
            </div>
          )}

          <footer className="mt-5 flex items-start gap-2.5 rounded-2xl border border-primary-100 bg-primary-50/80 px-3.5 py-3 text-[10px] font-medium leading-4 text-slate-500 dark:border-primary-900/50 dark:bg-primary-950/30 dark:text-slate-400 sm:text-[11px]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
            <span>This information is for educational purposes only and does not replace professional medical advice.</span>
          </footer>
        </div>
      </section>

      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onPointerDown={handleTriggerPointerDown}
        onPointerMove={handleTriggerPointerMove}
        onPointerUp={finishTriggerDrag}
        onPointerCancel={finishTriggerDrag}
        tabIndex={isOpen ? -1 : 0}
        className={[
          'assistant-mascot-button relative ml-auto flex h-[88px] w-[78px] touch-manipulation items-end justify-center border-0 bg-transparent p-0 transition-[opacity,transform] duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 dark:focus-visible:ring-primary-900 md:cursor-grab md:touch-none md:active:cursor-grabbing',
          isOpen
            ? 'invisible pointer-events-none scale-90 opacity-0'
            : 'visible scale-100 opacity-100',
          isTriggerDragging ? 'assistant-mascot-button--dragging' : '',
        ].join(' ')}
        aria-label={isOpen ? 'Close Diabetes Assistant' : 'Open Diabetes Assistant'}
        aria-expanded={isOpen}
        aria-controls="diabetes-assistant-panel"
        title={isOpen ? 'Close Diabetes Assistant' : 'Open Diabetes Assistant'}
      >
        {!isOpen && !isTriggerDragging && (
          <span
            key={greetingIndex}
            className={`assistant-mascot-bubble ${triggerIsOnLeft ? 'assistant-mascot-bubble--right' : 'assistant-mascot-bubble--left'}`}
            aria-hidden="true"
          >
            {MASCOT_GREETINGS[greetingIndex]}
          </span>
        )}

        <span className="assistant-mascot" aria-hidden="true">
          <span className="assistant-mascot__antenna">
            <span className="assistant-mascot__antenna-dot" />
          </span>
          <span className="assistant-mascot__head">
            <span className="assistant-mascot__face">
              <span className="assistant-mascot__eye assistant-mascot__eye--left" />
              <span className="assistant-mascot__eye assistant-mascot__eye--right" />
              <span className="assistant-mascot__mouth" />
            </span>
          </span>
          <span className="assistant-mascot__body">
            <HeartPulse className="assistant-mascot__heart" />
          </span>
          <span className="assistant-mascot__arm assistant-mascot__arm--left" />
          <span className="assistant-mascot__arm assistant-mascot__arm--right" />
          <span className="assistant-mascot__leg assistant-mascot__leg--left" />
          <span className="assistant-mascot__leg assistant-mascot__leg--right" />
          <span className="assistant-mascot__status" />
        </span>
      </button>
    </div>
  )
}
