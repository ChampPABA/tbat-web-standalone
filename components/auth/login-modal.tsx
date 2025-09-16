'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
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

const Stethoscope = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Stethoscope })), {
  loading: () => <div className="w-6 h-6 bg-gray-200 animate-pulse rounded" />
})

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
                <Stethoscope
                  className="h-12 w-12 text-[#0d7276] transform rotate-12"
                  strokeWidth={1.8}
                />
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
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
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
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
                          <Loader2 className="h-4 w-4 animate-spin" />
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
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
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
                            <Loader2 className="h-4 w-4 animate-spin" />
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
                    <ArrowLeft className="h-4 w-4 mr-2" />
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