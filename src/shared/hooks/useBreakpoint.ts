import { useState, useEffect } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
}

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop'
  if (window.matchMedia(BREAKPOINTS.mobile).matches) return 'mobile'
  if (window.matchMedia(BREAKPOINTS.tablet).matches) return 'tablet'
  return 'desktop'
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint)

  useEffect(() => {
    const queries = {
      mobile: window.matchMedia(BREAKPOINTS.mobile),
      tablet: window.matchMedia(BREAKPOINTS.tablet),
      desktop: window.matchMedia(BREAKPOINTS.desktop),
    }

    function handleChange() {
      setBreakpoint(getBreakpoint())
    }

    Object.values(queries).forEach((q) => q.addEventListener('change', handleChange))
    return () => {
      Object.values(queries).forEach((q) => q.removeEventListener('change', handleChange))
    }
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  }
}
