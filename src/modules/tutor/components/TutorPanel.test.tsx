import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TutorPanel } from './TutorPanel'
import type { TutorMessage } from '../types'

// Mock child components
vi.mock('./MessageList', () => ({
  MessageList: ({ messages, isLoading }: { messages: TutorMessage[]; isLoading: boolean }) => (
    <div data-testid="message-list" data-messages={messages.length} data-loading={isLoading}>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
      {isLoading && <div>Loading...</div>}
    </div>
  ),
}))

vi.mock('./MessageInput', () => ({
  MessageInput: ({ onSend, disabled }: { onSend: (msg: string) => void; disabled: boolean }) => (
    <div data-testid="message-input" data-disabled={disabled}>
      <button onClick={() => onSend('test message')} disabled={disabled}>
        Send
      </button>
    </div>
  ),
}))

describe('TutorPanel', () => {
  const mockOnClose = vi.fn()
  const mockOnSendMessage = vi.fn()

  const createMessage = (overrides = {}): TutorMessage => ({
    id: 'msg-1',
    role: 'student',
    content: 'Hello',
    messageType: 'question',
    createdAt: new Date(),
    ...overrides,
  })

  const defaultProps = {
    messages: [] as TutorMessage[],
    isOpen: true,
    isLoading: false,
    onClose: mockOnClose,
    onSendMessage: mockOnSendMessage,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibility', () => {
    it('renders panel element when open', () => {
      render(<TutorPanel {...defaultProps} isOpen={true} />)

      // Panel should contain the tutor name when open
      expect(screen.getByText('Anu')).toBeInTheDocument()
    })

    it('renders panel element when not open', () => {
      render(<TutorPanel {...defaultProps} isOpen={false} />)

      // Panel structure still exists but is collapsed
      expect(screen.getByRole('button', { name: 'Close tutor panel' })).toBeInTheDocument()
    })

    it('has different classes based on isOpen', () => {
      const { rerender } = render(<TutorPanel {...defaultProps} isOpen={true} />)

      // Get the parent container that has the width class
      const openPanel = screen.getByRole('button', { name: 'Close tutor panel' }).closest('div')?.parentElement
      expect(openPanel?.className).toContain('w-[350px]')

      rerender(<TutorPanel {...defaultProps} isOpen={false} />)

      const closedPanel = screen.getByRole('button', { name: 'Close tutor panel' }).closest('div')?.parentElement
      expect(closedPanel?.className).toContain('w-0')
      expect(closedPanel?.className).toContain('overflow-hidden')
    })
  })

  describe('header', () => {
    it('displays tutor name', () => {
      render(<TutorPanel {...defaultProps} />)

      expect(screen.getByText('Anu')).toBeInTheDocument()
    })

    it('displays tutor tagline', () => {
      render(<TutorPanel {...defaultProps} />)

      expect(screen.getByText('Your coding companion')).toBeInTheDocument()
    })

    it('has close button with aria-label', () => {
      render(<TutorPanel {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Close tutor panel' })).toBeInTheDocument()
    })

    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup()
      render(<TutorPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Close tutor panel' }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('message list', () => {
    it('passes messages to MessageList', () => {
      const messages = [
        createMessage({ id: 'msg-1', content: 'Hello' }),
        createMessage({ id: 'msg-2', content: 'Hi there!', role: 'tutor' }),
      ]

      render(<TutorPanel {...defaultProps} messages={messages} />)

      const messageList = screen.getByTestId('message-list')
      expect(messageList).toHaveAttribute('data-messages', '2')
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('passes isLoading to MessageList', () => {
      render(<TutorPanel {...defaultProps} isLoading={true} />)

      const messageList = screen.getByTestId('message-list')
      expect(messageList).toHaveAttribute('data-loading', 'true')
    })

    it('shows loading state in MessageList', () => {
      render(<TutorPanel {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('message input', () => {
    it('renders MessageInput component', () => {
      render(<TutorPanel {...defaultProps} />)

      expect(screen.getByTestId('message-input')).toBeInTheDocument()
    })

    it('calls onSendMessage when input sends message', async () => {
      const user = userEvent.setup()
      render(<TutorPanel {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Send' }))

      expect(mockOnSendMessage).toHaveBeenCalledWith('test message')
    })

    it('disables input when loading', () => {
      render(<TutorPanel {...defaultProps} isLoading={true} />)

      const input = screen.getByTestId('message-input')
      expect(input).toHaveAttribute('data-disabled', 'true')
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    })

    it('enables input when not loading', () => {
      render(<TutorPanel {...defaultProps} isLoading={false} />)

      const input = screen.getByTestId('message-input')
      expect(input).toHaveAttribute('data-disabled', 'false')
      expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled()
    })
  })

  describe('layout structure', () => {
    it('has expected styling classes', () => {
      render(<TutorPanel {...defaultProps} />)

      const panel = screen.getByRole('button', { name: 'Close tutor panel' }).closest('div')?.parentElement
      expect(panel?.className).toContain('border-l')
      expect(panel?.className).toContain('flex-col')
    })
  })
})
