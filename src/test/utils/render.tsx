import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'

interface WrapperProps {
  children: ReactNode
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  useMemoryRouter?: boolean
}

function DefaultWrapper({ children }: WrapperProps) {
  return <BrowserRouter>{children}</BrowserRouter>
}

function createMemoryWrapper(initialEntries: string[]) {
  return function MemoryWrapper({ children }: WrapperProps) {
    return (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    )
  }
}

export function renderWithRouter(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { initialEntries = ['/'], useMemoryRouter = false, ...renderOptions } = options

  const Wrapper = useMemoryRouter
    ? createMemoryWrapper(initialEntries)
    : DefaultWrapper

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
