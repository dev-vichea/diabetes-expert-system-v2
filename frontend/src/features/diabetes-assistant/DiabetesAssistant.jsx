import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Copy,
  GripHorizontal,
  HeartPulse,
  Languages,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react'
import { ASSISTANT_COPY, DIABETES_QUESTIONS } from './diabetesQuestions'
import { FormattedMessage } from './FormattedMessage'
import { DrBot3D } from './DrBot3D'
import { useLanguage } from '@/contexts/LanguageContext'
import './DiabetesAssistant.css'

const STORAGE_KEY = 'diabetes-assistant-conversation:v4'
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
  ANSWERING: 'answering',
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

function createMessage(sender, text, options = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sender,
    text,
    translation: options.translation || null,
    isStreaming: Boolean(options.isStreaming),
  }
}

function createInitialConversation() {
  return {
    stage: CONVERSATION_STAGES.INTRO,
    messages: [
      createMessage('bot', ASSISTANT_COPY.welcome.en, {
        translation: ASSISTANT_COPY.welcome.km,
        isStreaming: false,
      }),
    ],
  }
}

function readStoredConversation() {
  if (typeof window === 'undefined') return createInitialConversation()

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY))
    const validStage = Object.values(CONVERSATION_STAGES).includes(stored?.stage)
    const validMessages =
      Array.isArray(stored?.messages) &&
      stored.messages.length > 0 &&
      stored.messages.every(
        (message) =>
          typeof message?.id === 'string' &&
          ['bot', 'user'].includes(message?.sender) &&
          typeof message?.text === 'string'
      )

    if (validStage && validMessages) {
      return {
        stage: stored.stage === CONVERSATION_STAGES.ANSWERING ? CONVERSATION_STAGES.TOPICS : stored.stage,
        messages: stored.messages.map((m) => {
          let translation = m.translation || null
          if (!translation && m.sender === 'bot') {
            const qMatch = DIABETES_QUESTIONS.find((q) => q.answer === m.text)
            if (qMatch) translation = qMatch.answerKm
            else if (m.text === ASSISTANT_COPY.welcome.en) translation = ASSISTANT_COPY.welcome.km
            else if (m.text === ASSISTANT_COPY.topicPrompt.en) translation = ASSISTANT_COPY.topicPrompt.km
            else if (m.text === ASSISTANT_COPY.followUp.en) translation = ASSISTANT_COPY.followUp.km
            else if (m.text === ASSISTANT_COPY.initialDecline.en) translation = ASSISTANT_COPY.initialDecline.km
            else if (m.text === ASSISTANT_COPY.finished.en) translation = ASSISTANT_COPY.finished.km
          }
          return { ...m, isStreaming: false, translation }
        }),
      }
    }
  } catch {
    // Malformed session store does not prevent opening.
  }

  return createInitialConversation()
}

/**
 * Typewriter writing animation for bot messages.
 */
function StreamingMessageContent({ text, isStreaming, onStreamingComplete, onScrollToBottom }) {
  const [displayedLength, setDisplayedLength] = useState(isStreaming ? 0 : text.length)
  const isDone = displayedLength >= text.length

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedLength(text.length)
      return
    }

    setDisplayedLength(0)
    // Snappy, natural pacing without being slow
    const stepSize = Math.max(1, Math.floor(text.length / 85))
    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = prev + stepSize
        if (next >= text.length) {
          clearInterval(interval)
          if (onStreamingComplete) onStreamingComplete()
          return text.length
        }
        if (onScrollToBottom) onScrollToBottom()
        return next
      })
    }, 16)

    return () => clearInterval(interval)
  }, [text, isStreaming, onStreamingComplete, onScrollToBottom])

  const handleClickToSkip = () => {
    if (!isDone) {
      setDisplayedLength(text.length)
      if (onStreamingComplete) onStreamingComplete()
    }
  }

  const visibleText = text.slice(0, displayedLength)

  return (
    <div
      onClick={handleClickToSkip}
      className={!isDone ? 'cursor-pointer select-none' : ''}
      title={!isDone ? 'Click to show full response' : undefined}
    >
      <FormattedMessage content={visibleText} />
      {!isDone && <span className="assistant-cursor" />}
    </div>
  )
}

/**
 * Minimal, clean message bubbles with Copy and Translate actions.
 */
function ChatMessage({ message, onStreamingComplete, onScrollToBottom }) {
  const isUser = message.sender === 'user'
  const [copied, setCopied] = useState(false)
  const [isTranslated, setIsTranslated] = useState(false)

  const hasTranslation = Boolean(message.translation)
  const currentText = isTranslated && hasTranslation ? message.translation : message.text

  const handleCopy = (e) => {
    e.stopPropagation()
    const plain = currentText.replace(/\*\*/g, '').replace(/^[•\-]\s*/gm, '• ')
    navigator.clipboard.writeText(plain)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleToggleTranslate = (e) => {
    e.stopPropagation()
    setIsTranslated((prev) => !prev)
  }

  return (
    <div className={`flex items-end gap-2 duration-150 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 overflow-hidden p-0.5 mb-0.5"
          aria-hidden="true"
        >
          <img
            src="/images/dr-bot.png"
            alt="Dr. Bot"
            className="h-full w-full object-contain"
          />
        </span>
      )}

      <div className="max-w-[85%] sm:max-w-[80%]">
        <div
          className={[
            'relative px-3.5 py-2 sm:px-4 sm:py-2.5 text-left text-[13px] sm:text-sm leading-relaxed',
            isUser
              ? 'rounded-[18px] rounded-br-[4px] bg-[#007aff] dark:bg-blue-600 text-white font-normal'
              : 'rounded-[18px] rounded-bl-[4px] bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs',
          ].join(' ')}
        >
          {isUser ? (
            <div className="whitespace-pre-line text-white">{message.text}</div>
          ) : (
            <>
              <StreamingMessageContent
                text={currentText}
                isStreaming={message.isStreaming}
                onStreamingComplete={onStreamingComplete}
                onScrollToBottom={onScrollToBottom}
              />

              {/* Action Icons inside bubble */}
              {!message.isStreaming && (
                <div className="flex items-center justify-end gap-1 mt-1.5 -mb-0.5 select-none">
                  {hasTranslation && (
                    <button
                      type="button"
                      onClick={handleToggleTranslate}
                      className={[
                        'flex items-center justify-center h-6 w-6 rounded transition-colors',
                        isTranslated
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                          : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60',
                      ].join(' ')}
                      title={isTranslated ? 'Show English' : 'បកប្រែជាភាសាខ្មែរ (Translate to Khmer)'}
                      aria-label="Translate message"
                    >
                      <Languages className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center justify-center h-6 w-6 rounded text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                    title={copied ? 'Copied' : 'Copy message'}
                    aria-label="Copy message"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Minimal 3-dot typing bubble matching standard messaging apps.
 */
function AiTypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start duration-150">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 overflow-hidden p-0.5 mb-0.5"
        aria-hidden="true"
      >
        <img
          src="/images/dr-bot.png"
          alt="Dr. Bot"
          className="h-full w-full object-contain"
        />
      </span>

      <div className="rounded-[18px] rounded-bl-[4px] bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3.5 py-2.5 flex items-center gap-1 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
      </div>
    </div>
  )
}

/**
 * Minimal interactive buttons: matching height, clean spacing, aligned with chat.
 */
function ChatOptions({ stage, onChooseIntro, onChooseQuestion, onChooseFollowUp, onBack, disabled = false }) {
  const { language } = useLanguage()
  const isKhmer = language === 'km'

  if (stage === CONVERSATION_STAGES.INTRO || stage === CONVERSATION_STAGES.FOLLOW_UP) {
    const isIntro = stage === CONVERSATION_STAGES.INTRO
    const onSelect = isIntro ? onChooseIntro : onChooseFollowUp

    return (
      <div className="pl-9 animate-in fade-in duration-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(true)}
            className="h-9 min-w-[84px] px-4 rounded-full bg-[#007aff] hover:bg-blue-600 active:scale-95 text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Yes</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(false)}
            className="h-9 min-w-[84px] px-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
            <span>No</span>
          </button>
        </div>
      </div>
    )
  }

  if (stage === CONVERSATION_STAGES.TOPICS) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 p-3 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {isKhmer ? 'ប្រធានបទដែលបានណែនាំ' : 'Suggested Topics'}
          </span>
          <span className="text-[11px] text-slate-400">
            {DIABETES_QUESTIONS.length} {isKhmer ? 'ប្រធានបទ' : 'topics'}
          </span>
        </div>

        <div className="space-y-1">
          {DIABETES_QUESTIONS.map((item, index) => {
            const isUrgent = item.id === 'urgent-help'
            const questionTitle = isKhmer ? item.displayQuestionKm || item.displayQuestion : item.displayQuestion || item.question

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onChooseQuestion(item)}
                className="group flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {index + 1}
                  </span>
                  <span className="truncate font-normal">{questionTitle}</span>
                  {isUrgent && (
                    <span className="shrink-0 text-[10px] font-medium text-red-600 bg-red-50 dark:bg-red-950/50 px-1.5 py-0.5 rounded">
                      {isKhmer ? 'បន្ទាន់' : 'Urgent'}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className="mt-2 w-full py-1.5 text-center text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isKhmer ? 'ត្រឡប់ក្រោយ' : 'Back'}</span>
        </button>
      </div>
    )
  }

  return null
}

export function DiabetesAssistant() {
  const isDesktopViewport = typeof window !== 'undefined' && window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  const [isOpen, setIsOpen] = useState(false)
  const [conversation, setConversation] = useState(readStoredConversation)
  const [isAiTyping, setIsAiTyping] = useState(false)
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
  const pendingTimeoutsRef = useRef([])

  const scheduleTimeout = useCallback((fn, delay) => {
    const id = setTimeout(fn, delay)
    pendingTimeoutsRef.current.push(id)
    return id
  }, [])

  const clearAllTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach(clearTimeout)
    pendingTimeoutsRef.current = []
  }, [])

  useEffect(() => {
    return () => clearAllTimeouts()
  }, [clearAllTimeouts])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conversation))
    } catch {
      // Session storage persistence is best-effort.
    }
  }, [conversation])

  const scrollToBottom = useCallback(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [conversation, isOpen, isAiTyping, scrollToBottom])

  useEffect(() => {
    if (!isOpen) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') closeAssistant()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  useEffect(() => {
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
          window.innerHeight - rect.height - DESKTOP_EDGE_GAP
        )
        const x = side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP

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
          window.innerHeight - rect.height - DESKTOP_EDGE_GAP
        )
        const x = side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP

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

    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % MASCOT_GREETINGS.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [isOpen])

  function appendSingleMessage(msg) {
    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, msg],
    }))
  }

  function handleIntroChoice(hasQuestion) {
    clearAllTimeouts()
    if (hasQuestion) {
      appendSingleMessage(createMessage('user', 'Yes'))
      setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
      setIsAiTyping(true)

      scheduleTimeout(() => {
        setIsAiTyping(false)
        appendSingleMessage(
          createMessage('bot', ASSISTANT_COPY.topicPrompt.en, {
            translation: ASSISTANT_COPY.topicPrompt.km,
            isStreaming: true,
          })
        )
      }, 500)
      return
    }

    appendSingleMessage(createMessage('user', 'No'))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', ASSISTANT_COPY.initialDecline.en, {
          translation: ASSISTANT_COPY.initialDecline.km,
          isStreaming: true,
        })
      )
    }, 500)
  }

  function handleQuestion(question) {
    clearAllTimeouts()
    appendSingleMessage(createMessage('user', question.question))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', question.answer, {
          translation: question.answerKm,
          isStreaming: true,
        })
      )
    }, 550)
  }

  function handleFollowUp(wantsAnotherQuestion) {
    clearAllTimeouts()
    if (wantsAnotherQuestion) {
      appendSingleMessage(createMessage('user', 'Yes'))
      setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
      setIsAiTyping(true)

      scheduleTimeout(() => {
        setIsAiTyping(false)
        appendSingleMessage(
          createMessage('bot', ASSISTANT_COPY.topicPrompt.en, {
            translation: ASSISTANT_COPY.topicPrompt.km,
            isStreaming: true,
          })
        )
      }, 500)
      return
    }

    appendSingleMessage(createMessage('user', 'No'))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', ASSISTANT_COPY.finished.en, {
          translation: ASSISTANT_COPY.finished.km,
          isStreaming: true,
        })
      )
    }, 500)
  }

  function handleBack() {
    clearAllTimeouts()
    appendSingleMessage(createMessage('user', 'Back'))
    setConversation((prev) => ({ ...prev, stage: CONVERSATION_STAGES.ANSWERING }))
    setIsAiTyping(true)

    scheduleTimeout(() => {
      setIsAiTyping(false)
      appendSingleMessage(
        createMessage('bot', ASSISTANT_COPY.welcome.en, {
          translation: ASSISTANT_COPY.welcome.km,
          isStreaming: true,
        })
      )
    }, 400)
  }

  const handleStreamingComplete = useCallback(
    (messageIndex) => {
      setConversation((prev) => {
        const updatedMessages = prev.messages.map((m, idx) =>
          idx === messageIndex ? { ...m, isStreaming: false } : m
        )

        const currentMsg = prev.messages[messageIndex]
        let nextStage = prev.stage

        // If the answer to a topic just finished, trigger the follow-up prompt
        if (
          currentMsg &&
          currentMsg.sender === 'bot' &&
          DIABETES_QUESTIONS.some((q) => q.answer === currentMsg.text || q.answerKm === currentMsg.text)
        ) {
          scheduleTimeout(() => {
            setIsAiTyping(true)
            scheduleTimeout(() => {
              setIsAiTyping(false)
              appendSingleMessage(
                createMessage('bot', ASSISTANT_COPY.followUp.en, {
                  translation: ASSISTANT_COPY.followUp.km,
                  isStreaming: true,
                })
              )
            }, 450)
          }, 300)
          return { ...prev, messages: updatedMessages, stage: CONVERSATION_STAGES.ANSWERING }
        }

        if (
          currentMsg?.text === ASSISTANT_COPY.followUp.en ||
          currentMsg?.text === ASSISTANT_COPY.followUp.km
        ) {
          nextStage = CONVERSATION_STAGES.FOLLOW_UP
        } else if (
          currentMsg?.text === ASSISTANT_COPY.topicPrompt.en ||
          currentMsg?.text === ASSISTANT_COPY.topicPrompt.km
        ) {
          nextStage = CONVERSATION_STAGES.TOPICS
        } else if (
          currentMsg?.text === ASSISTANT_COPY.initialDecline.en ||
          currentMsg?.text === ASSISTANT_COPY.initialDecline.km ||
          currentMsg?.text === ASSISTANT_COPY.finished.en ||
          currentMsg?.text === ASSISTANT_COPY.finished.km
        ) {
          nextStage = CONVERSATION_STAGES.COMPLETE
        } else if (
          currentMsg?.text === ASSISTANT_COPY.welcome.en ||
          currentMsg?.text === ASSISTANT_COPY.welcome.km
        ) {
          nextStage = CONVERSATION_STAGES.INTRO
        }

        return {
          ...prev,
          messages: updatedMessages,
          stage: nextStage,
        }
      })
    },
    [scheduleTimeout]
  )

  function restartConversation() {
    clearAllTimeouts()
    setIsAiTyping(false)
    setConversation(createInitialConversation())
  }

  function closeAssistant() {
    clearAllTimeouts()
    setIsAiTyping(false)
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
        window.innerWidth - rect.width - DESKTOP_EDGE_GAP
      ),
      y: clamp(
        event.clientY - dragState.offsetY,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
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
      x: side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
      y: clamp(
        latestPosition.y,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
      ),
    }

    dragStateRef.current = null
    setIsDragging(false)
    setPanelPosition(snappedPosition)

    try {
      window.localStorage.setItem(
        PANEL_PLACEMENT_STORAGE_KEY,
        JSON.stringify({ side, y: snappedPosition.y })
      )
    } catch {
      // Local storage persistence is best-effort.
    }

    const trigger = triggerRef.current
    if (trigger) {
      const triggerRect = trigger.getBoundingClientRect()
      const storedTriggerPlacement = readStoredPlacement(TRIGGER_PLACEMENT_STORAGE_KEY)
      const triggerY = clamp(
        triggerPosition?.y ??
          storedTriggerPlacement?.y ??
          window.innerHeight - triggerRect.height - DESKTOP_EDGE_GAP,
        DESKTOP_EDGE_GAP,
        window.innerHeight - triggerRect.height - DESKTOP_EDGE_GAP
      )
      const syncedTriggerPosition = {
        x: side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - triggerRect.width - DESKTOP_EDGE_GAP,
        y: triggerY,
      }
      setTriggerPosition(syncedTriggerPosition)

      try {
        window.localStorage.setItem(
          TRIGGER_PLACEMENT_STORAGE_KEY,
          JSON.stringify({ side, y: syncedTriggerPosition.y })
        )
      } catch {
        // Placement persistence is optional.
      }
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture release is best-effort.
    }
  }

  function handleTriggerPointerDown(event) {
    if (!window.matchMedia(DESKTOP_MEDIA_QUERY).matches) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    triggerDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      latestPosition: { x: rect.left, y: rect.top },
      hasMoved: false,
    }
    setTriggerPosition({ x: rect.left, y: rect.top })
    setIsTriggerDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleTriggerPointerMove(event) {
    const dragState = triggerDragStateRef.current
    const trigger = triggerRef.current
    if (!dragState || !trigger || dragState.pointerId !== event.pointerId) return

    const moveDistance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY)
    if (moveDistance > 6) {
      dragState.hasMoved = true
    }

    const rect = trigger.getBoundingClientRect()
    const position = {
      x: clamp(
        event.clientX - dragState.offsetX,
        DESKTOP_EDGE_GAP,
        window.innerWidth - rect.width - DESKTOP_EDGE_GAP
      ),
      y: clamp(
        event.clientY - dragState.offsetY,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
      ),
    }

    dragState.latestPosition = position
    setTriggerPosition(position)
  }

  function finishTriggerDrag(event) {
    const dragState = triggerDragStateRef.current
    const trigger = triggerRef.current
    if (!dragState || !trigger || dragState.pointerId !== event.pointerId) return

    const rect = trigger.getBoundingClientRect()
    const latestPosition = dragState.latestPosition || { x: rect.left, y: rect.top }
    const side = latestPosition.x + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
    const snappedPosition = {
      x: side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - rect.width - DESKTOP_EDGE_GAP,
      y: clamp(
        latestPosition.y,
        DESKTOP_EDGE_GAP,
        window.innerHeight - rect.height - DESKTOP_EDGE_GAP
      ),
    }

    if (dragState.hasMoved) {
      lastTriggerDragAtRef.current = Date.now()
    }

    triggerDragStateRef.current = null
    setIsTriggerDragging(false)
    setTriggerPosition(snappedPosition)

    try {
      window.localStorage.setItem(
        TRIGGER_PLACEMENT_STORAGE_KEY,
        JSON.stringify({ side, y: snappedPosition.y })
      )
    } catch {
      // Local storage persistence is best-effort.
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture release is best-effort.
    }
  }

  function handleTriggerClick() {
    if (Date.now() - lastTriggerDragAtRef.current < 200) {
      return
    }

    if (!isOpen && isDesktopViewport) {
      const panel = panelRef.current
      const trigger = triggerRef.current

      if (panel && trigger) {
        const panelRect = panel.getBoundingClientRect()
        const triggerRect = trigger.getBoundingClientRect()
        const side = triggerRect.left + triggerRect.width / 2 < window.innerWidth / 2 ? 'left' : 'right'
        const defaultY = window.innerHeight - panelRect.height - DESKTOP_TRIGGER_GAP
        const storedPlacement = readStoredPlacement(PANEL_PLACEMENT_STORAGE_KEY)
        const y = clamp(
          storedPlacement?.y ?? defaultY,
          DESKTOP_EDGE_GAP,
          window.innerHeight - panelRect.height - DESKTOP_EDGE_GAP
        )
        const x = side === 'left' ? DESKTOP_EDGE_GAP : window.innerWidth - panelRect.width - DESKTOP_EDGE_GAP
        setPanelPosition({ x, y })
      }
    }

    setIsOpen((prev) => !prev)
  }

  const triggerIsOnLeft = Boolean(
    isDesktopViewport && triggerPosition && triggerPosition.x < window.innerWidth / 2
  )

  return (
    <div
      style={isDesktopViewport && triggerPosition ? { left: triggerPosition.x, top: triggerPosition.y } : undefined}
      className={[
        'fixed bottom-4 right-3 z-[70] transition-[left,top] ease-out sm:bottom-6 sm:right-6',
        triggerPosition ? 'md:bottom-auto md:right-auto' : '',
        isTriggerDragging ? 'duration-0' : 'duration-200',
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
          'fixed bottom-[7.75rem] right-3 flex h-[min(44rem,calc(100dvh-8.5rem))] max-h-[86dvh] w-[calc(100vw-1.5rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl transition-[opacity,transform,left,top] ease-out sm:w-[26rem] sm:max-w-[calc(100vw-3rem)] md:bottom-[7.75rem] md:right-6',
          panelPosition ? 'md:bottom-auto md:right-auto' : '',
          isDragging ? 'duration-0' : 'duration-200',
          isOpen
            ? 'visible translate-y-0 scale-100 opacity-100'
            : 'invisible pointer-events-none translate-y-2 scale-[0.98] opacity-0',
        ].join(' ')}
      >
        {/* Simple, flat header: solid blue, no gradient, no glow */}
        <header
          className="relative flex shrink-0 items-center justify-between gap-3 bg-[#007aff] dark:bg-blue-600 px-4 py-3 text-white md:cursor-grab md:select-none md:active:cursor-grabbing select-none"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          title="Drag to move the assistant"
        >
          <GripHorizontal className="pointer-events-none absolute left-1/2 top-1 hidden h-3.5 w-3.5 -translate-x-1/2 text-white/40 md:block" aria-hidden="true" />

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 p-1 overflow-hidden">
              <img
                src="/images/dr-bot.png"
                alt="Dr. Bot"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-white">
                {ASSISTANT_COPY.title}
              </h2>
              <p className="text-[11px] text-blue-100 font-normal">
                Patient education
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={restartConversation}
              className="flex h-7 items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium text-white/90 hover:bg-white/15 transition-colors"
              aria-label="Restart conversation"
              title="Restart conversation"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden min-[380px]:inline">Restart</span>
            </button>
            <button
              type="button"
              onClick={closeAssistant}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/90 hover:bg-white/15 transition-colors"
              aria-label="Close Diabetes Assistant"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Minimal clean chat scroll area */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className="assistant-chat-scroll flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-slate-50/50 dark:bg-slate-900/50 px-3.5 py-4 sm:p-4"
        >
          <div className="space-y-3">
            {conversation.messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                onStreamingComplete={() => handleStreamingComplete(index)}
                onScrollToBottom={scrollToBottom}
              />
            ))}

            {isAiTyping && <AiTypingIndicator />}
          </div>

          <div ref={messageEndRef} />

          {/* Quick choices / Questions */}
          {conversation.stage !== CONVERSATION_STAGES.COMPLETE && (
            <div className="mt-3.5">
              <ChatOptions
                stage={conversation.stage}
                disabled={isAiTyping}
                onChooseIntro={handleIntroChoice}
                onChooseQuestion={handleQuestion}
                onChooseFollowUp={handleFollowUp}
                onBack={handleBack}
              />
            </div>
          )}

          {/* Minimal disclaimer */}
          <footer className="mt-5 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 text-center">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Educational purposes only. Does not replace medical advice.</span>
          </footer>
        </div>
      </section>

      {/* Floating Mascot Trigger Button */}
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
          'assistant-mascot-button relative ml-auto flex h-[88px] w-[78px] touch-manipulation items-end justify-center border-0 bg-transparent p-0 transition-[opacity,transform] duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 dark:focus-visible:ring-blue-900 md:cursor-grab md:touch-none md:active:cursor-grabbing',
          isOpen ? 'invisible pointer-events-none scale-90 opacity-0' : 'visible scale-100 opacity-100',
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
            className={`assistant-mascot-bubble ${
              triggerIsOnLeft ? 'assistant-mascot-bubble--right' : 'assistant-mascot-bubble--left'
            }`}
            aria-hidden="true"
          >
            {MASCOT_GREETINGS[greetingIndex]}
          </span>
        )}

        <div className="relative flex h-[88px] w-[78px] items-center justify-center pointer-events-none">
          <DrBot3D className="h-full w-full" modelUrl="/3d/dr-bot.glb" />
        </div>
      </button>
    </div>
  )
}
