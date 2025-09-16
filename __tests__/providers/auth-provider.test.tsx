import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/providers/auth-provider'
import '@testing-library/jest-dom'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Test component to access auth context
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout, refreshSession, completePasswordReset } = useAuth()

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No User'}</div>
      <button onClick={() => login({ email: 'test@medical.ac.th', password: 'password' })}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => refreshSession()}>Refresh Session</button>
      <button onClick={() => completePasswordReset('test-token', 'newPassword123!')}>Complete Password Reset</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockFetch.mockClear()
  })

  it('provides initial unauthenticated state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('restores session on mount when session exists', async () => {
    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        timeRemaining: '30:00'
      })
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser))
  })

  it('handles login successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session check (no session)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    // Mock login API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        timeRemaining: '30:00'
      })
    })

    const loginButton = screen.getByText('Login')

    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@medical.ac.th',
        password: 'password'
      })
    })
  })

  it('handles login failure', async () => {
    // Mock initial session check (no session)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })

    // Mock failed login
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' })
    })

    const loginButton = screen.getByText('Login')

    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })

  it('handles logout', async () => {
    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session with authenticated user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        timeRemaining: '30:00'
      })
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    // Mock logout API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' })
    })

    const logoutButton = screen.getByText('Logout')
    await act(async () => {
      logoutButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('No User')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tbat_session')
  })

  it('handles session refresh', async () => {
    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session with authenticated user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        timeRemaining: '30:00'
      })
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    // Mock session refresh
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timeRemaining: '60:00'
      })
    })

    const refreshButton = screen.getByText('Refresh Session')
    await act(async () => {
      refreshButton.click()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include'
    })
  })

  it('handles network errors gracefully', async () => {
    // Mock network error on initial session check
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
  })

  it('handles remember me functionality', async () => {
    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session check (no session)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    function TestComponentWithRememberMe() {
      const { login } = useAuth()

      return (
        <button onClick={() => login({ email: 'test@medical.ac.th', password: 'password', rememberMe: true })}>
          Login With Remember Me
        </button>
      )
    }

    render(
      <AuthProvider>
        <TestComponentWithRememberMe />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Login With Remember Me')).toBeInTheDocument()
    })

    // Mock successful login with remember me
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        timeRemaining: '7 days'
      })
    })

    const loginButton = screen.getByText('Login With Remember Me')

    await act(async () => {
      loginButton.click()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@medical.ac.th',
        password: 'password',
        rememberMe: true
      })
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tbat_session', expect.any(String))
  })

  it('provides loading state during authentication', async () => {
    // Mock slow initial session check
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: false,
        status: 401
      }), 100))
    )

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Should show loading initially
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading')
    })
  })

  it('clears session data on logout API failure', async () => {
    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session with authenticated user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        timeRemaining: '30:00'
      })
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    // Mock failed logout API call
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const logoutButton = screen.getByText('Logout')
    await act(async () => {
      logoutButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    })

    // Should still clear state even if API call fails
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tbat_session')
  })

  it('automatically logs out on session refresh failure', async () => {
    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session with authenticated user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        timeRemaining: '30:00'
      })
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    // Mock failed session refresh
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    })

    // Mock logout call that will be triggered automatically
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out' })
    })

    const refreshButton = screen.getByText('Refresh Session')
    await act(async () => {
      refreshButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    })
  })

  it('updates session timer when session info changes', async () => {
    jest.useFakeTimers()

    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session with authenticated user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        timeRemaining: '5:00'
      })
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    // Timer should be running
    expect(setInterval).toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('clears session timer on logout', async () => {
    jest.useFakeTimers()

    const mockUser = {
      id: '1',
      email: 'test@medical.ac.th',
      thaiName: 'Test User',
      packageType: 'ADVANCED',
      isActive: true
    }

    // Mock initial session with authenticated user
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: mockUser,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        timeRemaining: '30:00'
      })
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated')
    })

    // Mock logout API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Logged out successfully' })
    })

    const logoutButton = screen.getByText('Logout')
    await act(async () => {
      logoutButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated')
    })

    // Timer should be cleared
    expect(clearInterval).toHaveBeenCalled()

    jest.useRealTimers()
  })

  // TEST-002: Password reset integration tests for AuthProvider.completePasswordReset
  describe('Password Reset Integration', () => {
    function PasswordResetTestComponent() {
      const { completePasswordReset } = useAuth()
      const [result, setResult] = React.useState<{ success: boolean; error?: string } | null>(null)

      const handlePasswordReset = async (token: string, password: string) => {
        const result = await completePasswordReset(token, password)
        setResult(result)
      }

      return (
        <div>
          <button onClick={() => handlePasswordReset('valid-token', 'newPassword123!')}>
            Reset Password Valid
          </button>
          <button onClick={() => handlePasswordReset('expired-token', 'newPassword123!')}>
            Reset Password Expired
          </button>
          <button onClick={() => handlePasswordReset('invalid-token', 'newPassword123!')}>
            Reset Password Invalid
          </button>
          <div data-testid="reset-result">
            {result ? JSON.stringify(result) : 'No Result'}
          </div>
        </div>
      )
    }

    beforeEach(() => {
      jest.clearAllMocks()
      mockFetch.mockClear()
    })

    it('successfully completes password reset with valid token', async () => {
      // Mock successful password reset API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Password reset successfully',
          user: {
            id: '1',
            email: 'user@example.com',
            thaiName: 'Test User'
          }
        })
      })

      render(
        <AuthProvider>
          <PasswordResetTestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password Valid')
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reset-result')).toHaveTextContent(
          JSON.stringify({ success: true })
        )
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'valid-token',
          newPassword: 'newPassword123!'
        }),
      })
    })

    it('handles expired token error correctly', async () => {
      // Mock expired token API response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Reset token has expired. Please request a new password reset.',
        })
      })

      render(
        <AuthProvider>
          <PasswordResetTestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password Expired')
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reset-result')).toHaveTextContent(
          JSON.stringify({
            success: false,
            error: 'Reset token has expired. Please request a new password reset.'
          })
        )
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'expired-token',
          newPassword: 'newPassword123!'
        }),
      })
    })

    it('handles invalid token error correctly', async () => {
      // Mock invalid token API response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Invalid or expired reset token',
        })
      })

      render(
        <AuthProvider>
          <PasswordResetTestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password Invalid')
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reset-result')).toHaveTextContent(
          JSON.stringify({
            success: false,
            error: 'Invalid or expired reset token'
          })
        )
      })
    })

    it('handles network errors during password reset', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(
        <AuthProvider>
          <PasswordResetTestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password Valid')
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reset-result')).toHaveTextContent(
          JSON.stringify({
            success: false,
            error: 'Network error. Please try again.'
          })
        )
      })
    })

    it('handles server errors during password reset', async () => {
      // Mock server error (500)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error',
        })
      })

      render(
        <AuthProvider>
          <PasswordResetTestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password Valid')
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reset-result')).toHaveTextContent(
          JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        )
      })
    })

    it('handles malformed API response gracefully', async () => {
      // Mock malformed response (no JSON)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      render(
        <AuthProvider>
          <PasswordResetTestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password Valid')
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reset-result')).toHaveTextContent(
          JSON.stringify({
            success: false,
            error: 'An unexpected error occurred. Please try again.'
          })
        )
      })
    })

    it('integrates with password reset page workflow', async () => {
      // Mock successful password reset that returns user data
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        thaiName: 'Test User',
        packageType: 'FREE',
        isActive: true
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Password reset successfully',
          user: mockUser
        })
      })

      render(
        <AuthProvider>
          <PasswordResetTestComponent />
        </AuthProvider>
      )

      const resetButton = screen.getByText('Reset Password Valid')
      await act(async () => {
        resetButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('reset-result')).toHaveTextContent(
          JSON.stringify({ success: true })
        )
      })

      // Verify API call includes proper headers and payload structure
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: 'valid-token',
          newPassword: 'newPassword123!'
        }),
      })
    })
  })
})