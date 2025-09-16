'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Stethoscope, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'

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
        const errorMsg = result.error || 'เข้าสู่ระบบไม่สำเร็จ'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
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
        setError(result.error || 'ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้')
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
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
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#0d7276] hover:bg-[#0a5f63] text-white">
            เข้าสู่ระบบ
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md w-[95%] mx-auto p-0 gap-0 bg-transparent border-none shadow-none">
        {/* Mobile-First Bottom Sheet Design */}
        <Card className="w-full border-2 border-[#0d7276] shadow-xl rounded-t-3xl sm:rounded-2xl bg-white animate-slide-up">
          {/* Handle bar for mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-[#90bfc0] rounded-full"></div>
          </div>

          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Stethoscope className="w-6 h-6 text-[#0d7276]" />
              <CardTitle className="text-xl text-[#0d7276] font-semibold">
                {showForgotPassword ? 'รีเซ็ตรหัสผ่าน' : 'เข้าสู่ระบบ TBAT'}
              </CardTitle>
            </div>
            <p className="text-sm text-[#529a9d]">
              {showForgotPassword
                ? 'กรุณากรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน'
                : 'ระบบสอบจำลอง TBAT สำหรับนักเรียนแพทย์'
              }
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {/* Login Form */}
            {!showForgotPassword && !forgotSuccess && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0d7276] font-medium">
                    อีเมล
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({...prev, email: e.target.value}))}
                    placeholder="student@medical.ac.th"
                    className="border-2 border-[#90bfc0] focus:border-[#0d7276] focus:ring-1 focus:ring-[#0d7276]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#0d7276] font-medium">
                    รหัสผ่าน
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
                      placeholder="กรุณากรอกรหัสผ่าน"
                      className="border-2 border-[#90bfc0] focus:border-[#0d7276] focus:ring-1 focus:ring-[#0d7276] pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-[#529a9d]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[#529a9d]" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={loginData.rememberMe}
                      onChange={(e) => setLoginData(prev => ({...prev, rememberMe: e.target.checked}))}
                      className="accent-[#0d7276] w-4 h-4 rounded"
                    />
                    <Label htmlFor="remember" className="text-sm text-[#529a9d] cursor-pointer">
                      จดจำการเข้าสู่ระบบ
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[#529a9d] hover:text-[#0d7276] p-0 h-auto"
                  >
                    ลืมรหัสผ่าน?
                  </Button>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-sm text-green-700">{success}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-2 border-[#90bfc0] text-[#529a9d] hover:bg-[#cae0e1]"
                      onClick={handleClose}
                    >
                      ยกเลิก
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isLoading || !loginData.email || !loginData.password}
                    className="flex-1 bg-gradient-to-r from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83] text-white"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลังเข้าสู่ระบบ...
                      </div>
                    ) : (
                      'เข้าสู่ระบบ'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword && !forgotSuccess && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-[#0d7276] font-medium">
                    อีเมลที่ใช้สมัครสมาชิก
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@medical.ac.th"
                    className="border-2 border-[#90bfc0] focus:border-[#0d7276] focus:ring-1 focus:ring-[#0d7276]"
                    required
                  />
                  <p className="text-xs text-[#529a9d]">
                    เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลนี้
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 border-2 border-[#90bfc0] text-[#529a9d] hover:bg-[#cae0e1]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    ย้อนกลับ
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !forgotEmail}
                    className="flex-1 bg-[#529a9d] hover:bg-[#457f83] text-white"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        กำลังส่ง...
                      </div>
                    ) : (
                      'ส่งลิงก์รีเซ็ต'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Forgot Password Success */}
            {forgotSuccess && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-l-2 border-b-2 border-white transform rotate-[-45deg] translate-y-[-1px]"></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-[#0d7276] mb-2">ส่งลิงก์รีเซ็ตแล้ว!</h3>
                  <p className="text-sm text-[#529a9d] mb-4">
                    เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง<br/>
                    <Badge variant="outline" className="border-[#0d7276] text-[#0d7276] mt-1">
                      {forgotEmail}
                    </Badge>
                  </p>
                  <p className="text-xs text-[#529a9d]">
                    กรุณาตรวจสอบอีเมล (รวมถึงโฟลเดอร์ spam) และคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน
                  </p>
                </div>
                <Button
                  onClick={handleClose}
                  className="w-full bg-[#0d7276] hover:bg-[#0a5f63] text-white"
                >
                  เข้าใจแล้ว
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}