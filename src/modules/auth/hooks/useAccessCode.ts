import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'
import type { Tables } from '@/shared/types/database'
import {
  generateAccessCode,
  generateDisplayName,
  pickRandomAvatar,
  normalizeAccessCode,
  isValidAccessCodeFormat,
} from '../lib/access-code'

const ACCESS_CODE_KEY = 'tutor_access_code'

type StudentProfile = Tables<'student_profiles'>

interface AccessCodeState {
  accessCode: string | null
  profile: StudentProfile | null
  loading: boolean
  error: string | null
}

export function useAccessCode() {
  const [state, setState] = useState<AccessCodeState>({
    accessCode: null,
    profile: null,
    loading: true,
    error: null,
  })

  // Validate and load profile from access code
  const validateAndLoadProfile = useCallback(async (code: string): Promise<boolean> => {
    const normalized = normalizeAccessCode(code)

    if (!isValidAccessCodeFormat(normalized)) {
      setState({ accessCode: null, profile: null, loading: false, error: null })
      return false
    }

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('access_code', normalized)
      .single()

    if (error || !data) {
      logger.log('Access code validation failed:', error?.message)
      setState({ accessCode: null, profile: null, loading: false, error: null })
      return false
    }

    // Update last_active_at (column added by migration 003)
    // Using type assertion since column may not exist in generated types yet
    await supabase
      .from('student_profiles')
      .update({ last_active_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', data.id)

    localStorage.setItem(ACCESS_CODE_KEY, normalized)
    setState({ accessCode: normalized, profile: data, loading: false, error: null })
    return true
  }, [])

  // Load and validate access code from localStorage on mount
  useEffect(() => {
    async function initFromStorage() {
      const storedCode = localStorage.getItem(ACCESS_CODE_KEY)

      if (!storedCode) {
        setState({ accessCode: null, profile: null, loading: false, error: null })
        return
      }

      logger.log('Found stored access code, validating...')
      const valid = await validateAndLoadProfile(storedCode)

      if (!valid) {
        logger.log('Stored access code invalid, clearing')
        localStorage.removeItem(ACCESS_CODE_KEY)
      }
    }

    initFromStorage()
  }, [validateAndLoadProfile])

  const createProfile = useCallback(async (): Promise<{
    accessCode: string | null
    error: string | null
  }> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Try up to 5 times for unique code (collision is rare but possible)
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateAccessCode()
        const displayName = generateDisplayName()
        const avatar = pickRandomAvatar()

        logger.log('Creating anonymous profile with code:', code)

        // Generate UUID (with fallback for non-secure contexts)
        const uuid = typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = Math.random() * 16 | 0
              const v = c === 'x' ? r : (r & 0x3 | 0x8)
              return v.toString(16)
            })

        const { data, error } = await supabase
          .from('student_profiles')
          .insert({
            id: uuid,
            access_code: code,
            display_name: displayName,
            avatar_emoji: avatar,
            // auth_user_id is null for anonymous profiles
          })
          .select()
          .single()

        if (error) {
          // Unique constraint violation - retry with new code
          if (error.code === '23505') {
            logger.log('Code collision, retrying...')
            continue
          }
          logger.error('Profile creation failed:', error)
          setState(prev => ({ ...prev, loading: false, error: error.message }))
          return { accessCode: null, error: error.message }
        }

        localStorage.setItem(ACCESS_CODE_KEY, code)
        setState({ accessCode: code, profile: data, loading: false, error: null })
        return { accessCode: code, error: null }
      }

      const errorMsg = 'Failed to generate unique access code after 5 attempts'
      setState(prev => ({ ...prev, loading: false, error: errorMsg }))
      return { accessCode: null, error: errorMsg }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create profile'
      logger.error('Profile creation exception:', err)
      setState(prev => ({ ...prev, loading: false, error: errorMsg }))
      return { accessCode: null, error: errorMsg }
    }
  }, [])

  const validateCode = useCallback(async (code: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true }))
    const valid = await validateAndLoadProfile(code)
    return valid
  }, [validateAndLoadProfile])

  const clearAccessCode = useCallback(() => {
    localStorage.removeItem(ACCESS_CODE_KEY)
    setState({ accessCode: null, profile: null, loading: false, error: null })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.accessCode) return

    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('access_code', state.accessCode)
      .single()

    if (data) {
      setState(prev => ({ ...prev, profile: data }))
    }
  }, [state.accessCode])

  return {
    accessCode: state.accessCode,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    createProfile,
    validateCode,
    clearAccessCode,
    refreshProfile,
    hasAccessCode: Boolean(state.accessCode),
  }
}
