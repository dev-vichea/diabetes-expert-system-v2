import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import axios from 'axios'
import api, { clearAuthStorage, setAuthTokens } from '../api/client'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { clearAssessmentSession, getDiagnosisResultStorageKey } from './diagnosis-result-storage'
import { translate } from './i18n'
import { getVisibleNavItems } from './nav-config'

const patient = { id: 1, name: 'Test Patient', email: 'test@example.com', roles: ['patient'], permissions: ['care_plan.view_own'] }
const originalAdapter = api.defaults.adapter

beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); api.defaults.adapter = originalAdapter; vi.restoreAllMocks() })

function Identity() {
  const { user } = useAuth()
  return <span>{user?.name || 'Signed out'}</span>
}

it('clears the rendered session when API authentication expires', async () => {
  setAuthTokens('test-access', 'test-refresh')
  localStorage.setItem('user', JSON.stringify(patient))
  vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: patient } })
  render(<AuthProvider><Identity /></AuthProvider>)
  expect(screen.getByText(patient.name)).toBeTruthy()
  await act(async () => clearAuthStorage())
  expect(screen.getByText('Signed out')).toBeTruthy()
})

it('clearing user 1 assessment does not erase user 11 or 21', () => {
  for (const id of [1, 11, 21]) localStorage.setItem(getDiagnosisResultStorageKey({ id }), '{}')
  clearAssessmentSession({ id: 1 })
  expect(localStorage.getItem(getDiagnosisResultStorageKey({ id: 1 }))).toBeNull()
  expect(localStorage.getItem(getDiagnosisResultStorageKey({ id: 11 }))).toBe('{}')
  expect(localStorage.getItem(getDiagnosisResultStorageKey({ id: 21 }))).toBe('{}')
})

describe('care-plan navigation', () => {
  it.each(['admin', 'doctor', 'custom'])('hides patient-only access for %s even with a legacy grant', (role) => {
    expect(getVisibleNavItems({ ...patient, roles: [role] }).some((item) => item.to === '/care-plan')).toBe(false)
  })
  it('shows the patient care plan only with its permission', () => {
    expect(getVisibleNavItems(patient).some((item) => item.to === '/care-plan')).toBe(true)
    expect(getVisibleNavItems({ ...patient, permissions: [] }).some((item) => item.to === '/care-plan')).toBe(false)
  })
})

it('coalesces expired API requests into one refresh and retries both', async () => {
  setAuthTokens('expired-test-access', 'test-refresh')
  const refresh = vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, data: {
    access_token: 'fresh-test-access', refresh_token: 'rotated-test-refresh',
  } } })
  api.defaults.adapter = async (config) => {
    if (!config._retry) throw { config, response: { status: 401 } }
    expect(config.headers.Authorization).toBe('Bearer fresh-test-access')
    return { data: { success: true }, status: 200, config, headers: {} }
  }
  await Promise.all([api.get('/one'), api.get('/two')])
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(refresh.mock.calls[0][2].timeout).toBeGreaterThan(0)
})

it('does not refresh a failed Google sign-in', async () => {
  setAuthTokens('test-access', 'test-refresh')
  const refresh = vi.spyOn(axios, 'post')
  api.defaults.adapter = async (config) => { throw { config, response: { status: 401 } } }
  await expect(api.post('/auth/google', { credential: 'invalid-test-value' })).rejects.toMatchObject({ response: { status: 401 } })
  expect(refresh).not.toHaveBeenCalled()
})

it('uses custom-role translation fallbacks in both languages', () => {
  for (const language of ['en', 'km']) {
    expect(translate(language, 'roles.browser_reader', { defaultValue: 'Browser Reader' })).toBe('Browser Reader')
  }
})
