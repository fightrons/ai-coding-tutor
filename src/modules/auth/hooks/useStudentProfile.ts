import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'
import type { Tables, TablesUpdate } from '@/shared/types/database'
import { useAuth } from './useAuth'

type StudentProfile = Tables<'student_profiles'>
type StudentProfileUpdate = TablesUpdate<'student_profiles'>

interface ProfileState {
  profile: StudentProfile | null
  loading: boolean
  error: string | null
}

export function useStudentProfile() {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    async function fetchProfile() {
      // No user after auth loaded = not authenticated
      if (!user) {
        setState({ profile: null, loading: false, error: null })
        return
      }

      logger.log('Fetching profile for user:', user.id)

      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (error) {
        logger.error('Profile fetch error:', error)
        setState({ profile: null, loading: false, error: error.message })
        return
      }

      // No profile yet - user needs to complete onboarding
      if (!data) {
        logger.log('No profile found for user, needs onboarding')
        setState({ profile: null, loading: false, error: null })
        return
      }

      logger.log('Profile fetched:', data)
      setState({ profile: data, loading: false, error: null })
    }

    fetchProfile()
  }, [user, authLoading])

  const updateProfile = useCallback(async (updates: StudentProfileUpdate) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('student_profiles')
      .update(updates)
      .eq('auth_user_id', user.id)

    if (error) {
      return { error: error.message }
    }

    // Refetch profile
    const { data } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    setState(prev => ({ ...prev, profile: data }))
    return { error: null }
  }, [user])

  const isOnboardingComplete = Boolean(
    state.profile
    && state.profile.learning_goal
    && state.profile.prior_experience
  )

  return {
    profile: state.profile,
    loading: state.loading || authLoading,
    error: state.error,
    updateProfile,
    isOnboardingComplete,
  }
}
