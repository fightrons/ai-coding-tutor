import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { EventName, EventData, EventCallback } from '@/shared/types/events'

interface EventBusContextType {
  subscribe: <T extends EventName>(
    event: T,
    callback: EventCallback<T>
  ) => () => void
  publish: <T extends EventName>(event: T, data: EventData<T>) => void
}

const EventBusContext = createContext<EventBusContextType | null>(null)

export function EventBusProvider({ children }: { children: ReactNode }) {
  const subscribers = useRef<Record<string, Array<(data: unknown) => void>>>({})

  const subscribe = useCallback(<T extends EventName>(
    event: T,
    callback: EventCallback<T>
  ) => {
    if (!subscribers.current[event]) {
      subscribers.current[event] = []
    }
    subscribers.current[event].push(callback as (data: unknown) => void)

    // Return unsubscribe function
    return () => {
      subscribers.current[event] = subscribers.current[event].filter(
        (cb) => cb !== callback
      )
    }
  }, [])

  const publish = useCallback(<T extends EventName>(event: T, data: EventData<T>) => {
    if (subscribers.current[event]) {
      subscribers.current[event].forEach((callback) => callback(data))
    }
  }, [])

  return (
    <EventBusContext.Provider value={{ subscribe, publish }}>
      {children}
    </EventBusContext.Provider>
  )
}

/**
 * Hook to get the publish function for emitting events
 */
export function usePublish() {
  const context = useContext(EventBusContext)
  if (!context) {
    throw new Error('usePublish must be used within an EventBusProvider')
  }
  return context.publish
}

/**
 * Hook to subscribe to an event
 * Automatically unsubscribes on unmount
 */
export function useSubscribe<T extends EventName>(
  event: T,
  callback: EventCallback<T>
) {
  const context = useContext(EventBusContext)
  if (!context) {
    throw new Error('useSubscribe must be used within an EventBusProvider')
  }

  useEffect(() => {
    const unsubscribe = context.subscribe(event, callback)
    return unsubscribe
  }, [context, event, callback])
}

/**
 * Hook to get both subscribe and publish functions
 */
export function useEventBus() {
  const context = useContext(EventBusContext)
  if (!context) {
    throw new Error('useEventBus must be used within an EventBusProvider')
  }
  return context
}
