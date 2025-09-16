import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginModal } from '@/components/auth/login-modal'
import '@testing-library/jest-dom'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('LoginModal', () => {
  const mockOnSuccess = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('renders login trigger button when no trigger provided', () => {
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)
    expect(screen.getByRole('button', { name: /เข้าสู่ระบบ/i })).toBeInTheDocument()
  })

  it('renders custom trigger when provided', () => {
    const customTrigger = <button>Custom Login</button>
    render(
      <LoginModal
        trigger={customTrigger}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    )
    expect(screen.getByRole('button', { name: /custom login/i })).toBeInTheDocument()
  })

  it('opens modal when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    const trigger = screen.getByRole('button', { name: /เข้าสู่ระบบ/i })
    await user.click(trigger)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('เข้าสู่ระบบ TBAT')).toBeInTheDocument()
  })

  it('displays TBAT branding elements', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    expect(screen.getByText('ระบบสอบจำลอง TBAT สำหรับนักเรียนแพทย์')).toBeInTheDocument()
    // Check for stethoscope icon (via svg or data-testid if needed)
  })

  it('validates required email field', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    // Try to submit without email
    await user.type(passwordInput, 'testpassword')
    await user.click(submitButton)

    // HTML5 validation should prevent submission
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('validates required password field', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    // Try to submit without password
    await user.type(emailInput, 'test@medical.ac.th')
    await user.click(submitButton)

    // HTML5 validation should prevent submission
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('submits login form with correct API call', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 1, email: 'test@medical.ac.th', name: 'Test User' } })
    })

    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    await user.type(emailInput, 'test@medical.ac.th')
    await user.type(passwordInput, 'testpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@medical.ac.th',
          password: 'testpassword',
          rememberMe: false
        })
      })
    })
  })

  it('handles successful login', async () => {
    const user = userEvent.setup()
    const mockUser = { id: 1, email: 'test@medical.ac.th', name: 'Test User' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser })
    })

    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    await user.type(emailInput, 'test@medical.ac.th')
    await user.type(passwordInput, 'testpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('เข้าสู่ระบบสำเร็จ!')).toBeInTheDocument()
    })

    expect(mockOnSuccess).toHaveBeenCalledWith(mockUser)
  })

  it('handles login error', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    })

    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    await user.type(emailInput, 'test@medical.ac.th')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeInTheDocument()
    })

    expect(mockOnError).toHaveBeenCalledWith('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  })

  it('handles network error', async () => {
    const user = userEvent.setup()
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    await user.type(emailInput, 'test@medical.ac.th')
    await user.type(passwordInput, 'testpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('เกิดข้อผิดพลาดในการเชื่อมต่อ')).toBeInTheDocument()
    })

    expect(mockOnError).toHaveBeenCalledWith('เกิดข้อผิดพลาดในการเชื่อมต่อ')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '' }) // Eye icon button

    // Initially password type
    expect(passwordInput.type).toBe('password')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('text')

    await user.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('handles remember me checkbox', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: 1, email: 'test@medical.ac.th' } })
    })

    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i)
    const rememberCheckbox = screen.getByLabelText(/จดจำการเข้าสู่ระบบ/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    await user.type(emailInput, 'test@medical.ac.th')
    await user.type(passwordInput, 'testpassword')
    await user.click(rememberCheckbox)
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@medical.ac.th',
          password: 'testpassword',
          rememberMe: true
        })
      })
    })
  })

  it('shows forgot password form', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const forgotPasswordLink = screen.getByRole('button', { name: /ลืมรหัสผ่าน/i })
    await user.click(forgotPasswordLink)

    expect(screen.getByText('รีเซ็ตรหัสผ่าน')).toBeInTheDocument()
    expect(screen.getByText('กรุณากรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน')).toBeInTheDocument()
    expect(screen.getByLabelText(/อีเมลที่ใช้สมัครสมาชิก/i)).toBeInTheDocument()
  })

  it('submits forgot password request', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Reset email sent' })
    })

    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))
    await user.click(screen.getByRole('button', { name: /ลืมรหัสผ่าน/i }))

    const emailInput = screen.getByLabelText(/อีเมลที่ใช้สมัครสมาชิก/i)
    const submitButton = screen.getByRole('button', { name: /ส่งลิงก์รีเซ็ต/i })

    await user.type(emailInput, 'test@medical.ac.th')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@medical.ac.th' })
      })
    })

    expect(screen.getByText('ส่งลิงก์รีเซ็ตแล้ว!')).toBeInTheDocument()
  })

  it('goes back from forgot password form', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))
    await user.click(screen.getByRole('button', { name: /ลืมรหัสผ่าน/i }))

    const backButton = screen.getByRole('button', { name: /ย้อนกลับ/i })
    await user.click(backButton)

    expect(screen.getByText('เข้าสู่ระบบ TBAT')).toBeInTheDocument()
    expect(screen.getByLabelText(/อีเมล/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/รหัสผ่าน/i)).toBeInTheDocument()
  })

  it('shows loading state during login', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i)
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i)
    const submitButton = screen.getByRole('button', { name: /^เข้าสู่ระบบ$/ })

    await user.type(emailInput, 'test@medical.ac.th')
    await user.type(passwordInput, 'testpassword')
    await user.click(submitButton)

    expect(screen.getByText('กำลังเข้าสู่ระบบ...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('resets form when closed', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const emailInput = screen.getByLabelText(/อีเมล/i) as HTMLInputElement
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/i) as HTMLInputElement

    await user.type(emailInput, 'test@medical.ac.th')
    await user.type(passwordInput, 'testpassword')

    const cancelButton = screen.getByRole('button', { name: /ยกเลิก/i })
    await user.click(cancelButton)

    // Reopen modal
    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const newEmailInput = screen.getByLabelText(/อีเมล/i) as HTMLInputElement
    const newPasswordInput = screen.getByLabelText(/รหัสผ่าน/i) as HTMLInputElement

    expect(newEmailInput.value).toBe('')
    expect(newPasswordInput.value).toBe('')
  })

  it('uses TBAT design system colors', async () => {
    const user = userEvent.setup()
    render(<LoginModal onSuccess={mockOnSuccess} onError={mockOnError} />)

    await user.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }))

    const title = screen.getByText('เข้าสู่ระบบ TBAT')
    const subtitle = screen.getByText('ระบบสอบจำลอง TBAT สำหรับนักเรียนแพทย์')

    // Check that elements use TBAT color classes (test for presence of specific classes)
    expect(title).toHaveClass('text-[#0d7276]')
    expect(subtitle).toHaveClass('text-[#529a9d]')
  })
})