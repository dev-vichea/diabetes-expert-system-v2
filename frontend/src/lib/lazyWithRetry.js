import { lazy } from 'react'

const CHUNK_RELOAD_STORAGE_KEY = 'app_chunk_reload_attempted'

/**
 * Checks whether an error is caused by a missing/stale JavaScript module chunk
 * or a server responding with HTML instead of JS (e.g. after a new deployment/build).
 */
export function isChunkLoadError(error) {
  if (!error) return false
  const msg = String(error.message || error).toLowerCase()
  return (
    msg.includes('mime type') ||
    msg.includes('text/html') ||
    msg.includes('dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('failed to load module script') ||
    msg.includes('importing a module script failed') ||
    error.name === 'ChunkLoadError'
  )
}

/**
 * Wraps React.lazy with automated retry & single-reload resilience against
 * stale chunks / hash updates after new builds or deployments.
 *
 * @param {() => Promise<{ default: React.ComponentType<any> }>} importer
 */
export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const component = await importer()
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY)
      } catch (_) {}
      return component
    } catch (error) {
      if (isChunkLoadError(error)) {
        let hasAttempted = false
        try {
          hasAttempted = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === 'true'
        } catch (_) {}

        if (!hasAttempted) {
          try {
            sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, 'true')
          } catch (_) {}
          // Force fresh fetch of index.html and modern chunks
          window.location.reload()
          return new Promise(() => {}) // keep in suspense while reloading
        }
      }
      throw error
    }
  })
}
