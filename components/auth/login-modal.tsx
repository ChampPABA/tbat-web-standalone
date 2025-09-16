'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// Inline SVG icons to reduce bundle size
const EyeIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);
const ArrowLeftIcon = () => (
  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const Loader2Icon = () => (
  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="m100 50.5908C100 78.2051 77.6142 100.591 50 100.591 22.3858 100.591 0 78.2051 0 50.5908 0 22.9766 22.3858 0.59082 50 0.59082 77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094 72.5987 91.5094 90.9186 73.1895 90.9186 50.5908 90.9186 27.9921 72.5987 9.67226 50 9.67226 27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"></path>
  </svg>
);
const AlertCircleIcon = () => (
  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const StethoscopeIcon = () => (
  <svg className="h-12 w-12 text-[#0d7276] transform rotate-12" strokeWidth={1.8} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);
import { useAuth } from '@/providers/auth-provider'
import dynamic from 'next/dynamic'

// Dynamically import heavy UI components
const Card = dynamic(() => import('@/components/ui/card').then(mod => ({ default: mod.Card })), {
  loading: () => <div className="bg-white rounded-lg shadow-sm animate-pulse h-96" />
})
const CardContent = dynamic(() => import('@/components/ui/card').then(mod => ({ default: mod.CardContent })))
const CardHeader = dynamic(() => import('@/components/ui/card').then(mod => ({ default: mod.CardHeader })))
const CardTitle = dynamic(() => import('@/components/ui/card').then(mod => ({ default: mod.CardTitle })))
const Badge = dynamic(() => import('@/components/ui/badge').then(mod => ({ default: mod.Badge })))

// Import Dialog components directly to fix accessibility warning
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'


interface LoginModalProps {
  trigger?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (user: any) => void
  onError?: (error: string) => void
}

export function LoginModal({ trigger, isOpen: controlledIsOpen, onOpenChange, onSuccess, onError }: LoginModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const { login } = useAuth()

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = onOpenChange || setInternalIsOpen
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login({
        email: loginData.email,
        password: loginData.password,
        rememberMe: loginData.rememberMe
      })

      if (result.success) {
        setSuccess('เข้าสู่ระบบสำเร็จ!')
        onSuccess?.(loginData) // Pass login data for success callback
        setTimeout(() => {
          setIsOpen(false)
          resetForms()
        }, 1000)
      } else {
        // Enhanced error handling for rate limiting and account lockout
        let errorMsg = result.error || 'เข้าสู่ระบบไม่สำเร็จ'

        // Handle specific backend error responses
        if (result.errorType === 'RATE_LIMIT') {
          errorMsg = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่'
        } else if (result.errorType === 'ACCOUNT_LOCKED') {
          errorMsg = 'บัญชีถูกล็อกเนื่องจากรหัสผ่านผิด 5 ครั้ง กรุณารอ 30 นาทีแล้วลองใหม่'
        } else if (result.errorType === 'INVALID_CREDENTIALS') {
          errorMsg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        }

        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      let errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'

      // Network error handling with retry suggestion
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMsg = 'เชื่อมต่อเครือข่ายไม่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่'
      }

      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      })

      const result = await response.json()

      if (response.ok) {
        setForgotSuccess(true)
        setSuccess('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว')
      } else {
        // Enhanced error handling for forgot password rate limiting
        let errorMsg = 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้'

        if (response.status === 429) {
          errorMsg = 'ส่งคำขอรีเซ็ตรหัสผ่านมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่'
        } else if (result.error) {
          errorMsg = result.error
        }

        setError(errorMsg)
      }
    } catch (err) {
      let errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'

      // Network error handling
      if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMsg = 'เชื่อมต่อเครือข่ายไม่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่'
      }

      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForms = () => {
    setLoginData({ email: '', password: '', rememberMe: false })
    setForgotEmail('')
    setError('')
    setSuccess('')
    setShowForgotPassword(false)
    setForgotSuccess(false)
    setShowPassword(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForms()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}

      <DialogContent
        className="sm:max-w-md w-[95%] mx-auto p-0 gap-0 bg-white border-none shadow-none"
        // Custom overlay that's solid instead of transparent
        onOpenAutoFocus={(e) => {
          // Add solid overlay style
          const overlay = document.querySelector('[data-radix-dialog-overlay]') as HTMLElement;
          if (overlay) {
            overlay.style.backgroundColor = '#111827'; // solid gray-900
            overlay.style.opacity = '1';
          }
        }}
      >
        <DialogTitle className="sr-only">
          {!showForgotPassword ? 'เข้าสู่ระบบ TBAT Mock Exam' : 'รีเซ็ตรหัสผ่าน TBAT'}
        </DialogTitle>
        {/* Mobile-First Bottom Sheet Design */}
        <Card className="w-full border-2 border-[#0d7276] shadow-xl rounded-t-3xl sm:rounded-2xl bg-white animate-slide-up">
          <CardHeader className="text-center space-y-4 p-6 pb-2">
            {/* TBAT Stethoscope Logo Header */}
            <div className="flex justify-center items-center space-x-3 mb-2">
              <div className="relative">
                <StethoscopeIcon />
                <div className="absolute inset-0 h-12 w-12 bg-gradient-to-br from-[#529a9d]/10 to-[#0d7276]/5 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-[#0d7276] font-sans">
                  TBAT
                </CardTitle>
                <p className="text-xs text-[#529a9d] font-medium">
                  Mock Exam @Chiang Mai
                </p>
              </div>
            </div>


            {!showForgotPassword ? (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  เข้าสู่ระบบ
                </h3>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  รีเซ็ตรหัสผ่าน
                </h3>
                <p className="text-sm text-gray-600">
                  กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="px-6 pb-6 space-y-6">
            {!showForgotPassword ? (
              <>
                {/* Login Form */}
                <div className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        อีเมล
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="กรอกอีเมลของคุณ"
                        className="border-[#90bfc0] focus:border-[#0d7276] focus:ring-[#529a9d]"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({...prev, email: e.target.value}))}
                        required
                      />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          รหัสผ่าน
                        </Label>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="กรอกรหัสผ่านของคุณ"
                          className="border-[#90bfc0] focus:border-[#0d7276] focus:ring-[#529a9d] pr-12"
                          value={loginData.password}
                          onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#0d7276] transition-colors"
                        >
                          {showPassword ? (
                            <EyeOffIcon />
                          ) : (
                            <EyeIcon />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-[#90bfc0] text-[#0d7276] focus:ring-[#529a9d]"
                          checked={loginData.rememberMe}
                          onChange={(e) => setLoginData(prev => ({...prev, rememberMe: e.target.checked}))}
                        />
                        <span className="text-sm text-gray-600">จดจำฉันไว้</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-[#0d7276] hover:text-[#529a9d] font-medium hover:underline transition-colors"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <AlertCircleIcon />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Success Message */}
                    {success && (
                      <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                        <div className="h-4 w-4 flex-shrink-0 rounded-full bg-green-500 flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                        <span>{success}</span>
                      </div>
                    )}

                    {/* Login Button */}
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#0d7276] hover:bg-[#0a5f63] text-white py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2Icon />
                          <span>กำลังเข้าสู่ระบบ...</span>
                        </div>
                      ) : (
                        'เข้าสู่ระบบ'
                      )}
                    </Button>
                  </form>
                </div>

                {/* Registration Link */}
                <div className="text-center pt-4 border-t border-[#cae0e1]">
                  <p className="text-sm text-gray-600">
                    ยังไม่มีบัญชี?{' '}
                    <a
                      href="/register"
                      className="text-[#0d7276] hover:text-[#529a9d] font-semibold hover:underline transition-colors"
                    >
                      สมัครสมาชิก
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Forgot Password Form */}
                <div className="space-y-4">
                  {!forgotSuccess ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email" className="text-sm font-medium text-gray-700">
                          อีเมล
                        </Label>
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="กรอกอีเมลที่ใช้ในการสมัคร"
                          className="border-[#90bfc0] focus:border-[#0d7276] focus:ring-[#529a9d]"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                        />
                      </div>

                      {error && (
                        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                          <AlertCircleIcon />
                          <span>{error}</span>
                        </div>
                      )}

                      {success && (
                        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                          <div className="h-4 w-4 flex-shrink-0 rounded-full bg-green-500 flex items-center justify-center">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                          </div>
                          <span>{success}</span>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#0d7276] hover:bg-[#0a5f63] text-white py-3 rounded-xl font-semibold transition-all duration-200"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <Loader2Icon />
                            <span>กำลังส่งอีเมล...</span>
                          </div>
                        ) : (
                          'ส่งลิงก์รีเซ็ตรหัสผ่าน'
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center space-y-4 py-4">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-gray-800">ส่งอีเมลแล้ว</h4>
                        <p className="text-sm text-gray-600">
                          หากอีเมลของคุณมีอยู่ในระบบ เราจะทำการส่งลิงก์รีเซ็ตรหัสผ่านไปให้ที่อีเมลดังกล่าว
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full border-[#90bfc0] text-[#0d7276] hover:bg-[#cae0e1] mt-4"
                  >
                    <ArrowLeftIcon />
                    กลับไปหน้าเข้าสู่ระบบ
                  </Button>
                </div>
              </>
            )}

            {/* Close Button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                ยกเลิก
              </Button>
            </DialogClose>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}