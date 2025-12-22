import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useIdentity } from '@/modules/auth'
import type { TutorMessage, MessageRole, MessageType } from '../types'
import { toTutorMessage } from '../types'

interface TutorMessagesState {
  messages: TutorMessage[]
  loading: boolean
  error: string | null
}

export function useTutorMessages(lessonId: string | undefined) {
  const { profileId, loading: identityLoading } = useIdentity()
  const [state, setState] = useState<TutorMessagesState>({
    messages: [],
    loading: true,
    error: null,
  })

  const fetchMessages = useCallback(async () => {
    if (!profileId || !lessonId) {
      setState({ messages: [], loading: false, error: null })
      return
    }

    const { data, error } = await supabase
      .from('tutor_messages')
      .select('*')
      .eq('student_id', profileId)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })

    if (error) {
      setState({ messages: [], loading: false, error: error.message })
      return
    }

    const messages = (data || []).map(toTutorMessage)
    setState({ messages, loading: false, error: null })
  }, [profileId, lessonId])

  useEffect(() => {
    if (identityLoading) return
    void (async () => {
      await fetchMessages()
    })()
  }, [identityLoading, fetchMessages])

  const sendMessage = useCallback(
    async (
      content: string,
      role: MessageRole,
      messageType?: MessageType
    ): Promise<{ message: TutorMessage | null; error: string | null }> => {
      if (!profileId || !lessonId) {
        return { message: null, error: 'Not authenticated or no lesson selected' }
      }

      // Optimistic update
      const tempId = `temp-${Date.now()}`
      const tempMessage: TutorMessage = {
        id: tempId,
        role,
        content,
        messageType: messageType || null,
        createdAt: new Date(),
      }

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, tempMessage],
      }))

      // Insert into database
      const { data, error } = await supabase
        .from('tutor_messages')
        .insert({
          student_id: profileId,
          lesson_id: lessonId,
          role,
          content,
          message_type: messageType || null,
        })
        .select()
        .single()

      if (error) {
        // Rollback optimistic update
        setState((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== tempId),
          error: error.message,
        }))
        return { message: null, error: error.message }
      }

      // Replace temp message with real one
      const savedMessage = toTutorMessage(data)
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === tempId ? savedMessage : m
        ),
      }))

      return { message: savedMessage, error: null }
    },
    [profileId, lessonId]
  )

  const clearMessages = useCallback(async (): Promise<{ error: string | null }> => {
    if (!profileId || !lessonId) {
      return { error: 'Not authenticated or no lesson selected' }
    }

    const { error } = await supabase
      .from('tutor_messages')
      .delete()
      .eq('student_id', profileId)
      .eq('lesson_id', lessonId)

    if (error) {
      return { error: error.message }
    }

    setState((prev) => ({ ...prev, messages: [] }))
    return { error: null }
  }, [profileId, lessonId])

  return {
    messages: state.messages,
    loading: state.loading || identityLoading,
    error: state.error,
    sendMessage,
    clearMessages,
    refetch: fetchMessages,
  }
}
