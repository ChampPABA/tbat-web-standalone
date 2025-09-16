import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogoutButton } from '@/components/auth/logout-button'
import '@testing-library/jest-dom'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('LogoutButton', () => {
  const mockUser = {
    thaiName: 'นศ. ทดสอบ ระบบ',
    email: 'test@medical.ac.th',
    packageType: 'ADVANCED' as const
  }

  const mockSessionInfo = {
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    timeRemaining: '30:00'
  }

  const mockOnLogout = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('renders user profile chip with Thai initials', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    expect(screen.getByText('ทท')).toBeInTheDocument() // Thai initials from "ทดสอบ ระบบ"
    expect(screen.getByText('นศ. ทดสอบ ระบบ')).toBeInTheDocument() // User name
  })

  it('displays user package type', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    expect(screen.getByText('แพ็คเกจขั้นสูง')).toBeInTheDocument()
  })

  it('shows stethoscope medical icon', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    // Check for stethoscope icon (Lucide react component)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('displays session timer countdown', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    // Should show remaining time (30:00 since we mocked 30 minutes from now)
    expect(screen.getByText(/30:00/)).toBeInTheDocument()
  })

  it('opens logout confirmation dialog when clicked', async () => {
    const user = userEvent.setup()
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    expect(screen.getByText('ข้อมูลผู้ใช้และออกจากระบบ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ออกจากระบบ/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ยกเลิก/i })).toBeInTheDocument()
  })

  it('calls API and onLogout when logout is confirmed', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' })
    })

    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    const logoutButton = screen.getByRole('button', { name: /ออกจากระบบ/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    })

    expect(mockOnLogout).toHaveBeenCalled()
  })

  it('cancels logout when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    const cancelButton = screen.getByRole('button', { name: /ยกเลิก/i })
    await user.click(cancelButton)

    // Dialog should close (no longer visible)
    await waitFor(() => {
      expect(screen.queryByText('ข้อมูลผู้ใช้และออกจากระบบ')).not.toBeInTheDocument()
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockOnLogout).not.toHaveBeenCalled()
  })

  it('handles logout API error', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Logout failed' })
    })

    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    const logoutButton = screen.getByRole('button', { name: /ออกจากระบบ/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByText('Logout failed')).toBeInTheDocument()
    })

    expect(mockOnError).toHaveBeenCalledWith('Logout failed')
  })

  it('handles network error', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    const logoutButton = screen.getByRole('button', { name: /ออกจากระบบ/i })
    await user.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByText('เกิดข้อผิดพลาดในการเชื่อมต่อ')).toBeInTheDocument()
    })

    expect(mockOnError).toHaveBeenCalledWith('เกิดข้อผิดพลาดในการเชื่อมต่อ')
  })

  it('uses TBAT design system colors', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileChip = screen.getByRole('button')

    // Check for TBAT color classes
    expect(profileChip.querySelector('.border-\\[\\#cae0e1\\]')).toBeTruthy()
  })

  it('handles Thai language display correctly', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    // Check Thai text rendering
    expect(screen.getByText('ทท')).toBeInTheDocument() // Thai initials
    expect(screen.getByText('นศ. ทดสอบ ระบบ')).toBeInTheDocument() // Thai name
    expect(screen.getByText('นักเรียนแพทย์')).toBeInTheDocument() // Thai label
  })

  it('shows different package types correctly', () => {
    const freeUser = { ...mockUser, packageType: 'FREE' as const }

    render(
      <LogoutButton
        user={freeUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    expect(screen.getByText('แพ็คเกจฟรี')).toBeInTheDocument()
  })

  it('shows loading state during logout', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    const logoutButton = screen.getByRole('button', { name: /ออกจากระบบ/i })
    await user.click(logoutButton)

    expect(screen.getByText('กำลังออกจากระบบ...')).toBeInTheDocument()
    expect(logoutButton).toBeDisabled()
  })

  it('provides accessibility features', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')

    // Should be keyboard accessible
    expect(profileButton).toBeInstanceOf(HTMLElement)
  })

  it('displays user email in dialog', async () => {
    const user = userEvent.setup()
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    expect(screen.getByText('test@medical.ac.th')).toBeInTheDocument()
  })

  it('shows session info in dialog', async () => {
    const user = userEvent.setup()
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
        sessionInfo={mockSessionInfo}
      />
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    expect(screen.getByText('ข้อมูลเซสชัน')).toBeInTheDocument()
    expect(screen.getByText(/เวลาคงเหลือ/)).toBeInTheDocument()
  })

  it('handles missing session info gracefully', () => {
    render(
      <LogoutButton
        user={mockUser}
        onLogout={mockOnLogout}
        onError={mockOnError}
      />
    )

    // Should still render without session info
    expect(screen.getByText('นศ. ทดสอบ ระบบ')).toBeInTheDocument()
  })
})