import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const en = JSON.parse(readFileSync(resolve(__dirname, '../src/locales/en.json'), 'utf8'))
const km = JSON.parse(readFileSync(resolve(__dirname, '../src/locales/km.json'), 'utf8'))

const missingInKm = []
const missingInEn = []
const typeMismatches = []

function walk(a, b, path) {
  const aIsObj = a && typeof a === 'object'
  const bIsObj = b && typeof b === 'object'
  if (aIsObj !== bIsObj) {
    typeMismatches.push(path || '(root)')
    return
  }
  if (aIsObj) {
    for (const k of Object.keys(a)) {
      const p = path ? `${path}.${k}` : k
      if (b[k] === undefined) missingInKm.push(p)
      else walk(a[k], b[k], p)
    }
    for (const k of Object.keys(b)) {
      const p = path ? `${path}.${k}` : k
      if (a[k] === undefined) missingInEn.push(p)
    }
  }
}

walk(en, km, '')
console.log('EN keys missing from KM:', missingInKm.length ? missingInKm : 'none ✓')
console.log('KM keys missing from EN:', missingInEn.length ? missingInEn : 'none ✓')
console.log('type mismatches:', typeMismatches.length ? typeMismatches : 'none ✓')
