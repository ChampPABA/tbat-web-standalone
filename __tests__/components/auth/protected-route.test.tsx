import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProtectedRoute } from '@/components/auth/protected-route'
import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn()
  })
}))

// Mock the AuthProvider
const mockUseAuth = jest.fn()
jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock window.location
const mockLocation = {
  pathname: '/test-path',
  href: 'http://localhost:3000/test-path'
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('ProtectedRoute', () => {
  const mockChildren = <div>Protected Content</div>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@medical.ac.th',
        thaiName: 'Test User',
        packageType: 'ADVANCED',
        isActive: true
      },
      isAuthenticated: true,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('shows authentication prompt when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('จำเป็นต้องเข้าสู่ระบบ')).toBeInTheDocument()
    expect(screen.getByText('หน้านี้สำหรับสมาชิกที่เข้าสู่ระบบแล้วเท่านั้น')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /เข้าสู่ระบบ/i })).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows loading state when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('กำลังตรวจสอบสถานะการเข้าสู่ระบบ...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('จำเป็นต้องเข้าสู่ระบบ')).not.toBeInTheDocument()
  })

  it('enforces package requirements when specified', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@medical.ac.th',
        thaiName: 'Test User',
        packageType: 'FREE',
        isActive: true
      },
      isAuthenticated: true,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute requiredPackage="ADVANCED">
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('จำเป็นต้องอัปเกรดแพ็คเกจ')).toBeInTheDocument()
    expect(screen.getByText('เนื้อหานี้สำหรับ แพ็คเกจขั้นสูง เท่านั้น')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /อัปเกรดแพ็คเกจ/i })).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('allows access when user has required package', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@medical.ac.th',
        thaiName: 'Test User',
        packageType: 'ADVANCED',
        isActive: true
      },
      isAuthenticated: true,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute requiredPackage="ADVANCED">
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('allows Free package users to access Free content', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@medical.ac.th',
        thaiName: 'Test User',
        packageType: 'FREE',
        isActive: true
      },
      isAuthenticated: true,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute requiredPackage="FREE">
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('allows Advanced package users to access Free content', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@medical.ac.th',
        thaiName: 'Test User',
        packageType: 'ADVANCED',
        isActive: true
      },
      isAuthenticated: true,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute requiredPackage="FREE">
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('displays custom fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    const customFallback = <div>Custom Auth Required</div>

    render(
      <ProtectedRoute fallback={customFallback}>
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('Custom Auth Required')).toBeInTheDocument()
    expect(screen.queryByText('จำเป็นต้องเข้าสู่ระบบ')).not.toBeInTheDocument()
  })

  it('uses TBAT design system styling', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    const card = screen.getByText('จำเป็นต้องเข้าสู่ระบบ').closest('div')
    expect(card).toHaveClass('text-[#0d7276]')

    const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i })
    expect(loginButton).toHaveClass('bg-gradient-to-r')
  })

  it('includes medical stethoscope icon', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    // Check for stethoscope icon (svg element)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('shows session expiry warning when session is about to expire', () => {
    const nearExpiry = {
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      timeRemaining: '4:30'
    }

    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@medical.ac.th',
        thaiName: 'Test User',
        packageType: 'ADVANCED',
        isActive: true
      },
      isAuthenticated: true,
      isLoading: false,
      sessionInfo: nearExpiry
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText(/เซสชันจะหมดอายุใน/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ต่ออายุเซสชัน/i })).toBeInTheDocument()
  })

  it('handles session renewal', async () => {
    const user = userEvent.setup()
    const nearExpiry = {
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      timeRemaining: '4:30'
    }

    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'test@medical.ac.th',
        thaiName: 'Test User',
        packageType: 'ADVANCED',
        isActive: true
      },
      isAuthenticated: true,
      isLoading: false,
      sessionInfo: nearExpiry
    })

    // Mock window.location.reload
    const mockReload = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { ...mockLocation, reload: mockReload },
      writable: true
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    const renewButton = screen.getByRole('button', { name: /ต่ออายุเซสชัน/i })
    await user.click(renewButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it('is mobile responsive', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    const container = screen.getByText('จำเป็นต้องเข้าสู่ระบบ').closest('div')

    // Check for responsive classes
    expect(container).toHaveClass('max-w-md')
  })

  it('provides accessibility features', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i })

    // Should have proper ARIA attributes
    expect(loginButton).toBeInstanceOf(HTMLButtonElement)
    expect(loginButton).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    const loginButton = screen.getByRole('button', { name: /เข้าสู่ระบบ/i })

    // Should be focusable
    await user.tab()
    expect(loginButton).toHaveFocus()
  })

  it('handles error states gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null,
      error: 'Session expired'
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('จำเป็นต้องเข้าสู่ระบบ')).toBeInTheDocument()
    // Should still show login prompt even with error
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects when showInlinePrompt is false', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    // Mock mounted state
    jest.spyOn(require('react'), 'useState')
      .mockImplementationOnce(() => [true, jest.fn()]) // mounted = true

    render(
      <ProtectedRoute showInlinePrompt={false}>
        {mockChildren}
      </ProtectedRoute>
    )

    // Should not show inline prompt
    expect(screen.queryByText('จำเป็นต้องเข้าสู่ระบบ')).not.toBeInTheDocument()
  })

  it('shows current path in authentication prompt', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    expect(screen.getByText('/test-path')).toBeInTheDocument()
  })

  it('handles back to home button', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionInfo: null
    })

    // Mock window.location.href assignment
    let mockHref = 'http://localhost:3000/test-path'
    Object.defineProperty(window, 'location', {
      value: {
        ...mockLocation,
        get href() { return mockHref },
        set href(url) { mockHref = url }
      },
      writable: true
    })

    render(
      <ProtectedRoute>
        {mockChildren}
      </ProtectedRoute>
    )

    const backButton = screen.getByRole('button', { name: /กลับหน้าหลัก/i })
    await user.click(backButton)

    expect(mockHref).toBe('/')
  })
})