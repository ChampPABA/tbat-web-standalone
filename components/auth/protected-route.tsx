'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/auth-provider'
import { LoginModal } from './login-modal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stethoscope, Lock, ArrowRight, Loader2, ShieldAlert, Clock } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  redirectTo?: string
  requiredPackage?: 'FREE' | 'ADVANCED'
  fallback?: ReactNode
  showInlinePrompt?: boolean
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo = '/',
  requiredPackage,
  fallback,
  showInlinePrompt = true
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, sessionInfo } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle authentication redirects
  useEffect(() => {
    if (!mounted || isLoading) return

    if (requireAuth && !isAuthenticated) {
      if (!showInlinePrompt) {
        const currentPath = window.location.pathname
        const returnUrl = encodeURIComponent(currentPath)
        router.push(`${redirectTo}?returnUrl=${returnUrl}`)
      }
    }
  }, [mounted, isLoading, isAuthenticated, requireAuth, showInlinePrompt, redirectTo, router])

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfefe] via-[#cae0e1] to-[#90bfc0]">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0d7276]" />
              <p className="text-[#529a9d] font-thai">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (showInlinePrompt) {
      return (
        <AuthenticationPrompt
          currentPath={window.location.pathname}
          fallback={fallback}
        />
      )
    }
    return null // Will redirect via useEffect
  }

  // Check package requirement
  if (requiredPackage && user?.packageType !== requiredPackage) {
    return (
      <PackageUpgradePrompt
        currentPackage={user?.packageType}
        requiredPackage={requiredPackage}
        fallback={fallback}
      />
    )
  }

  // Show session warning if expiring soon
  const showSessionWarning = sessionInfo?.timeRemaining &&
    sessionInfo.timeRemaining.includes(':') &&
    parseInt(sessionInfo.timeRemaining.split(':')[0]) < 5

  return (
    <div className="relative">
      {showSessionWarning && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                เซสชันจะหมดอายุใน <strong>{sessionInfo.timeRemaining}</strong>
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              ต่ออายุเซสชัน
            </Button>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

// Authentication prompt component
function AuthenticationPrompt({
  currentPath,
  fallback
}: {
  currentPath: string
  fallback?: ReactNode
}) {
  const handleLoginSuccess = () => {
    // Refresh the page to show protected content
    window.location.reload()
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfefe] via-[#cae0e1] to-[#90bfc0] p-4">
      <Card className="w-full max-w-md border-2 border-[#0d7276] shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#0d7276] to-[#529a9d] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl text-[#0d7276] flex items-center justify-center gap-2">
            <Stethoscope className="w-5 h-5" />
            จำเป็นต้องเข้าสู่ระบบ
          </CardTitle>
          <p className="text-[#529a9d] mt-2">
            หน้านี้สำหรับสมาชิกที่เข้าสู่ระบบแล้วเท่านั้น
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#cae0e1] p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#0d7276]" />
              <span className="text-sm font-semibold text-[#0d7276]">เนื้อหาที่ได้รับการป้องกัน</span>
            </div>
            <p className="text-sm text-[#529a9d]">
              คุณกำลังพยายามเข้าถึงเนื้อหาที่ต้องมีการยืนยันตัวตน กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
            </p>
            {currentPath !== '/' && (
              <p className="text-xs text-[#529a9d] mt-2">
                หน้าปลายทาง: <code className="bg-white px-1 rounded">{currentPath}</code>
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1 border-[#90bfc0] text-[#529a9d] hover:bg-[#cae0e1]"
            >
              กลับหน้าหลัก
            </Button>
            <LoginModal
              trigger={
                <Button className="flex-1 bg-gradient-to-r from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83] text-white">
                  เข้าสู่ระบบ
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              }
              onSuccess={handleLoginSuccess}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Package upgrade prompt component
function PackageUpgradePrompt({
  currentPackage,
  requiredPackage,
  fallback
}: {
  currentPackage?: 'FREE' | 'ADVANCED'
  requiredPackage: 'FREE' | 'ADVANCED'
  fallback?: ReactNode
}) {
  if (fallback) {
    return <>{fallback}</>
  }

  const getPackageDisplay = (pkg: string) => {
    switch (pkg) {
      case 'FREE':
        return { label: 'แพ็คเกจฟรี', color: 'bg-gray-100 text-gray-700', icon: '📚' }
      case 'ADVANCED':
        return { label: 'แพ็คเกจขั้นสูง', color: 'bg-gradient-to-r from-[#0d7276] to-[#529a9d] text-white', icon: '🏥' }
      default:
        return { label: 'ไม่ทราบ', color: 'bg-gray-100 text-gray-700', icon: '❓' }
    }
  }

  const currentPkg = getPackageDisplay(currentPackage || 'FREE')
  const requiredPkg = getPackageDisplay(requiredPackage)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfefe] via-[#cae0e1] to-[#90bfc0] p-4">
      <Card className="w-full max-w-lg border-2 border-[#0d7276] shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-[#529a9d] to-[#0d7276] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">{requiredPkg.icon}</span>
          </div>
          <CardTitle className="text-xl text-[#0d7276]">
            จำเป็นต้องอัปเกรดแพ็คเกจ
          </CardTitle>
          <p className="text-[#529a9d] mt-2">
            เนื้อหานี้สำหรับ {requiredPkg.label} เท่านั้น
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Current Package */}
            <div className="text-center">
              <Badge variant="outline" className={`${currentPkg.color} mb-2`}>
                {currentPkg.label}
              </Badge>
              <p className="text-xs text-[#529a9d]">แพ็คเกจปัจจุบัน</p>
            </div>

            {/* Required Package */}
            <div className="text-center">
              <Badge variant="outline" className={`${requiredPkg.color} mb-2`}>
                {requiredPkg.label}
              </Badge>
              <p className="text-xs text-[#529a9d]">แพ็คเกจที่จำเป็น</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              <strong>💡 เคล็ดลับ:</strong> {requiredPkg.label} ให้คุณเข้าถึงเนื้อหาทั้ง 3 วิชา
              (ชีววิทยา เคมี ฟิสิกส์) พร้อมการวิเคราะห์ผลคะแนนแบบละเอียด
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1 border-[#90bfc0] text-[#529a9d] hover:bg-[#cae0e1]"
            >
              กลับหน้าหลัก
            </Button>
            <Button
              onClick={() => window.location.href = '/upgrade'}
              className="flex-1 bg-gradient-to-r from-[#529a9d] to-[#0d7276] hover:from-[#457f83] hover:to-[#0a5f63] text-white"
            >
              อัปเกรดแพ็คเกจ
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}