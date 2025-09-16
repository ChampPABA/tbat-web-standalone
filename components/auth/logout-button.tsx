'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Stethoscope, LogOut, User, Clock, Shield, Loader2, AlertTriangle } from 'lucide-react'

interface LogoutButtonProps {
  user: {
    thaiName: string
    email: string
    packageType?: 'FREE' | 'ADVANCED'
    lastLoginAt?: string
  }
  onLogout?: () => void
  onError?: (error: string) => void
  sessionInfo?: {
    expiresAt?: string
    timeRemaining?: string
  }
}

export function LogoutButton({ user, onLogout, onError, sessionInfo }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Clear any local storage or session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tbat_session')
          sessionStorage.clear()
        }

        onLogout?.()
        setIsOpen(false)

        // Redirect to home page
        window.location.href = '/'
      } else {
        const result = await response.json()
        const errorMsg = result.error || 'ไม่สามารถออกจากระบบได้'
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

  // Get Thai initials from name
  const getThaiInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0)
    }
    return parts[0].substring(0, 2)
  }

  // Format package type
  const getPackageTypeDisplay = (packageType: string) => {
    switch (packageType) {
      case 'FREE':
        return { label: 'แพ็คเกจฟรี', color: 'bg-gray-100 text-gray-700 border-gray-300' }
      case 'ADVANCED':
        return { label: 'แพ็คเกจขั้นสูง', color: 'bg-gradient-to-r from-[#0d7276] to-[#529a9d] text-white' }
      default:
        return { label: 'แพ็คเกจฟรี', color: 'bg-gray-100 text-gray-700 border-gray-300' }
    }
  }

  const packageDisplay = getPackageTypeDisplay(user.packageType || 'FREE')

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer group">
          {/* Medical Student Profile Chip */}
          <div className="flex items-center gap-2 p-2 rounded-xl border-2 border-[#cae0e1] hover:border-[#0d7276] transition-all duration-200 hover:shadow-md bg-white">
            <Avatar className="w-8 h-8 border-2 border-[#0d7276]">
              <AvatarFallback className="bg-gradient-to-r from-[#0d7276] to-[#529a9d] text-white font-semibold text-sm">
                {getThaiInitials(user.thaiName)}
              </AvatarFallback>
            </Avatar>

            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-3 h-3 text-[#0d7276]" />
                  <span className="text-sm font-semibold text-[#0d7276]">
                    {user.thaiName}
                  </span>
                </div>
                <span className="text-xs text-[#529a9d]">นักเรียนแพทย์</span>
              </div>

              <Badge
                variant="outline"
                className={`text-xs py-0 px-2 ${packageDisplay.color}`}
              >
                {packageDisplay.label}
              </Badge>
            </div>

            {/* Mobile-only initials */}
            <div className="sm:hidden">
              <Badge
                variant="outline"
                className="text-xs py-0 px-1 border-[#0d7276] text-[#0d7276]"
              >
                นศ
              </Badge>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md w-[95%] mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0d7276]">
            <User className="w-5 h-5" />
            ข้อมูลผู้ใช้และออกจากระบบ
          </DialogTitle>
          <DialogDescription className="text-[#529a9d]">
            ตรวจสอบข้อมูลของคุณและจัดการเซสชัน
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info Card */}
          <div className="bg-gradient-to-br from-[#cae0e1] to-[#fdfefe] p-4 rounded-lg border border-[#90bfc0]">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12 border-2 border-[#0d7276]">
                <AvatarFallback className="bg-gradient-to-r from-[#0d7276] to-[#529a9d] text-white font-semibold">
                  {getThaiInitials(user.thaiName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className="w-4 h-4 text-[#0d7276]" />
                  <span className="font-semibold text-[#0d7276]">{user.thaiName}</span>
                </div>
                <p className="text-sm text-[#529a9d]">{user.email}</p>
                <Badge
                  variant="outline"
                  className={`text-xs mt-1 ${packageDisplay.color}`}
                >
                  {packageDisplay.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Session Info */}
          {sessionInfo && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">ข้อมูลเซสชัน</span>
              </div>
              {sessionInfo.timeRemaining && (
                <p className="text-sm text-blue-700">
                  เวลาคงเหลือ: <strong>{sessionInfo.timeRemaining}</strong>
                </p>
              )}
              {sessionInfo.expiresAt && (
                <p className="text-xs text-blue-600 mt-1">
                  หมดอายุ: {new Date(sessionInfo.expiresAt).toLocaleString('th-TH')}
                </p>
              )}
            </div>
          )}

          {/* Security Warning */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-yellow-800">ความปลอดภัย</span>
                <p className="text-xs text-yellow-700 mt-1">
                  การออกจากระบบจะล้างข้อมูลเซสชันทั้งหมด หากคุณใช้คอมพิวเตอร์ส่วนกลาง กรุณาออกจากระบบทุกครั้ง
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1 border-[#90bfc0] text-[#529a9d] hover:bg-[#cae0e1]"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังออกจากระบบ...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}