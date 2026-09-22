import { memo } from 'react'

function sanitizeStreamingMarkdown(text) {
  if (!text) return ''
  const boldMatches = text.match(/\*\*/g)
  if (boldMatches && boldMatches.length % 2 !== 0) {
    return text + '**'
  }
  return text
}

function renderInline(text) {
  if (!text) return null
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)

  return tokens.map((token, index) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      )
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      return (
        <em key={index} className="italic text-slate-600 dark:text-slate-300">
          {token.slice(1, -1)}
        </em>
      )
    }
    return token
  })
}

export const FormattedMessage = memo(function FormattedMessage({ content = '' }) {
  if (!content) return null

  const safeContent = sanitizeStreamingMarkdown(content)
  const paragraphs = safeContent.split('\n\n')

  return (
    <div className="space-y-2 text-[13px] sm:text-sm leading-relaxed text-slate-800 dark:text-slate-100">
      {paragraphs.map((paragraph, pIndex) => {
        const rawLines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean)
        const isList = rawLines.length > 0 && rawLines.every((l) => l.startsWith('•') || l.startsWith('-'))

        if (isList) {
          return (
            <ul key={pIndex} className="my-1 space-y-1 list-none pl-0.5">
              {rawLines.map((line, lIndex) => {
                const itemContent = line.replace(/^[•\-]\s*/, '')
                return (
                  <li key={lIndex} className="flex items-start gap-2">
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
                      aria-hidden="true"
                    />
                    <span className="flex-1 leading-relaxed">{renderInline(itemContent)}</span>
                  </li>
                )
              })}
            </ul>
          )
        }

        return (
          <p key={pIndex} className="leading-relaxed">
            {rawLines.map((line, lIndex) => (
              <span key={lIndex}>
                {lIndex > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
})
