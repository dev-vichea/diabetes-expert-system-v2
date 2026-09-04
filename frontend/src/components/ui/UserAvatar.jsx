import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export const AVATAR_GRADIENTS = [
  'from-cyan-500 to-sky-600',
  'from-violet-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-fuchsia-500 to-purple-600',
]

export function getAvatarGradient(name = '') {
  let hash = 0
  const str = String(name || '')
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) % 997
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

export function getInitials(name = '', fallback = 'U') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return fallback
  if (parts.length === 1) {
    return parts[0].length >= 2 ? parts[0].slice(0, 2).toUpperCase() : parts[0].toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const SIZE_CONFIGS = {
  xs: {
    container: 'h-6 w-6',
    text: 'text-[10px] font-bold',
    badge: 'h-2 w-2',
  },
  sm: {
    container: 'h-8 w-8',
    text: 'text-xs font-bold',
    badge: 'h-2.5 w-2.5',
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-xs font-bold',
    badge: 'h-3 w-3',
  },
  lg: {
    container: 'h-12 w-12',
    text: 'text-sm font-bold',
    badge: 'h-3.5 w-3.5',
  },
  xl: {
    container: 'h-16 w-16',
    text: 'text-lg font-bold',
    badge: 'h-4 w-4',
  },
  '2xl': {
    container: 'h-20 w-20',
    text: 'text-2xl font-bold',
    badge: 'h-5 w-5',
  },
}

export function UserAvatar({
  name = '',
  src,
  size = 'md',
  gradient,
  status,
  alt,
  className,
  imageClassName,
  children,
  ...props
}) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [src])

  const initials = children || getInitials(name)
  const bgGradient = gradient || getAvatarGradient(name)
  const sizeConfig = SIZE_CONFIGS[size] || SIZE_CONFIGS.md

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full select-none',
        sizeConfig.container,
        className
      )}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || name || 'User avatar'}
          onError={() => setImgError(true)}
          className={cn(
            'h-full w-full rounded-full object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10',
            imageClassName
          )}
        />
      ) : (
        <span
          className={cn(
            'inline-flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm transition-transform',
            bgGradient,
            sizeConfig.text
          )}
        >
          {initials}
        </span>
      )}

      {status !== undefined && status !== null && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white shadow-sm dark:border-slate-900',
            sizeConfig.badge,
            status === true || status === 'online' || status === 'active'
              ? 'bg-emerald-500'
              : 'bg-slate-400 dark:bg-slate-500'
          )}
        />
      )}
    </div>
  )
}
