/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterPage from '../../app/register/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('Enhanced Registration Page', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  test('renders registration form with password fields', () => {
    render(<RegisterPage />)
    
    expect(screen.getByText('ลงทะเบียนสอบ Mock TBAT')).toBeInTheDocument()
    expect(screen.getByText('ข้อมูลส่วนตัว')).toBeInTheDocument()
  })

  test('shows password fields in step 1', () => {
    render(<RegisterPage />)
    
    expect(screen.getByLabelText(/รหัสผ่าน/)).toBeInTheDocument()
    expect(screen.getByLabelText(/ยืนยันรหัสผ่าน/)).toBeInTheDocument()
  })

  test('validates password requirements', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    // Fill in required fields first
    await user.type(screen.getByLabelText(/ชื่อ-นามสกุล/), 'Test User')
    await user.type(screen.getByLabelText(/อีเมล/), 'test@example.com')
    await user.type(screen.getByLabelText(/เบอร์โทรศัพท์/), '0812345678')
    await user.type(screen.getByLabelText(/Line ID/), '@testline')
    
    // Test invalid password (too short)
    await user.type(screen.getByLabelText(/รหัสผ่าน/), 'short')
    await user.type(screen.getByLabelText(/ยืนยันรหัสผ่าน/), 'short')
    
    // Select school and grade
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('มงฟอร์ตวิทยาลัย'))
    await user.click(screen.getByLabelText('ม.6'))
    
    // Try to submit
    await user.click(screen.getByText('ถัดไป'))
    
    // Should show password validation error
    await waitFor(() => {
      expect(screen.getByText(/รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข/)).toBeInTheDocument()
    })
  })

  test('validates password confirmation matching', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    // Fill in required fields first
    await user.type(screen.getByLabelText(/ชื่อ-นามสกุล/), 'Test User')
    await user.type(screen.getByLabelText(/อีเมล/), 'test@example.com')
    await user.type(screen.getByLabelText(/เบอร์โทรศัพท์/), '0812345678')
    await user.type(screen.getByLabelText(/Line ID/), '@testline')
    
    // Test password mismatch
    await user.type(screen.getByLabelText(/รหัสผ่าน/), 'password123')
    await user.type(screen.getByLabelText(/ยืนยันรหัสผ่าน/), 'different123')
    
    // Select school and grade
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('มงฟอร์ตวิทยาลัย'))
    await user.click(screen.getByLabelText('ม.6'))
    
    // Try to submit
    await user.click(screen.getByText('ถัดไป'))
    
    // Should show password mismatch error
    await waitFor(() => {
      expect(screen.getByText('รหัสผ่านไม่ตรงกัน')).toBeInTheDocument()
    })
  })

  test('password visibility toggle works', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    const passwordInput = screen.getByLabelText(/รหัสผ่าน/) as HTMLInputElement
    const toggleButtons = screen.getAllByRole('button')
    const passwordToggle = toggleButtons.find(btn => btn.querySelector('svg'))
    
    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')
    
    // Click toggle button
    if (passwordToggle) {
      await user.click(passwordToggle)
      expect(passwordInput.type).toBe('text')
    }
  })

  test('shows session selection in step 2', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    // Complete step 1 first
    await user.type(screen.getByLabelText(/ชื่อ-นามสกุล/), 'Test User')
    await user.type(screen.getByLabelText(/อีเมล/), 'test@example.com')
    await user.type(screen.getByLabelText(/เบอร์โทรศัพท์/), '0812345678')
    await user.type(screen.getByLabelText(/Line ID/), '@testline')
    await user.type(screen.getByLabelText(/รหัสผ่าน/), 'password123')
    await user.type(screen.getByLabelText(/ยืนยันรหัสผ่าน/), 'password123')
    
    // Select school and grade
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('มงฟอร์ตวิทยาลัย'))
    await user.click(screen.getByLabelText('ม.6'))
    
    // Submit step 1
    await user.click(screen.getByText('ถัดไป'))
    
    // Should now be on step 2
    await waitFor(() => {
      expect(screen.getByText('เลือกวิชาที่ต้องการทดลองสอบ')).toBeInTheDocument()
      expect(screen.getByText('เลือกช่วงเวลาสอบ')).toBeInTheDocument()
      expect(screen.getByText('🌅 เช้า')).toBeInTheDocument()
      expect(screen.getByText('☀️ บ่าย')).toBeInTheDocument()
    })
  })

  test('validates session time selection', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    // Complete step 1
    await user.type(screen.getByLabelText(/ชื่อ-นามสกุล/), 'Test User')
    await user.type(screen.getByLabelText(/อีเมล/), 'test@example.com')
    await user.type(screen.getByLabelText(/เบอร์โทรศัพท์/), '0812345678')
    await user.type(screen.getByLabelText(/Line ID/), '@testline')
    await user.type(screen.getByLabelText(/รหัสผ่าน/), 'password123')
    await user.type(screen.getByLabelText(/ยืนยันรหัสผ่าน/), 'password123')
    
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('มงฟอร์ตวิทยาลัย'))
    await user.click(screen.getByLabelText('ม.6'))
    await user.click(screen.getByText('ถัดไป'))
    
    // In step 2, select subject but not session time
    await waitFor(() => {
      expect(screen.getByText('Biology (ชีววิทยา)')).toBeInTheDocument()
    })
    
    await user.click(screen.getByLabelText('Biology (ชีววิทยา)'))
    
    // Try to submit without selecting session time
    await user.click(screen.getByText('ถัดไป'))
    
    // Should show session time validation error
    await waitFor(() => {
      expect(screen.getByText('กรุณาเลือกเวลาสอบ')).toBeInTheDocument()
    })
  })

  test('displays session time in confirmation step', async () => {
    const user = userEvent.setup()
    render(<RegisterPage />)
    
    // Complete step 1
    await user.type(screen.getByLabelText(/ชื่อ-นามสกุล/), 'Test User')
    await user.type(screen.getByLabelText(/อีเมล/), 'test@example.com')
    await user.type(screen.getByLabelText(/เบอร์โทรศัพท์/), '0812345678')
    await user.type(screen.getByLabelText(/Line ID/), '@testline')
    await user.type(screen.getByLabelText(/รหัสผ่าน/), 'password123')
    await user.type(screen.getByLabelText(/ยืนยันรหัสผ่าน/), 'password123')
    
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('มงฟอร์ตวิทยาลัย'))
    await user.click(screen.getByLabelText('ม.6'))
    await user.click(screen.getByText('ถัดไป'))
    
    // Complete step 2
    await waitFor(() => {
      expect(screen.getByText('Biology (ชีววิทยา)')).toBeInTheDocument()
    })
    
    await user.click(screen.getByLabelText('Biology (ชีววิทยา)'))
    await user.click(screen.getByLabelText('🌅 เช้า'))
    await user.click(screen.getByText('ถัดไป'))
    
    // Should show confirmation with session time
    await waitFor(() => {
      expect(screen.getByText('ยืนยันข้อมูลการลงทะเบียน')).toBeInTheDocument()
      expect(screen.getByText('🌅 เช้า 09:00 - 12:00 น.')).toBeInTheDocument()
    })
  })
})