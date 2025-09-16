'use client'

import React, { useState } from 'react'
import { LoginModal } from '@/components/auth/login-modal'
import { LogoutButton } from '@/components/auth/logout-button'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AuthProvider, useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// Use dynamic imports for icons to reduce bundle size
import dynamic from 'next/dynamic'

const Stethoscope = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Stethoscope })), { ssr: false })
const TestTube = dynamic(() => import('lucide-react').then(mod => ({ default: mod.TestTube })), { ssr: false })
const Users = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), { ssr: false })
const ShieldCheck = dynamic(() => import('lucide-react').then(mod => ({ default: mod.ShieldCheck })), { ssr: false })
const Smartphone = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Smartphone })), { ssr: false })
const Clock = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), { ssr: false })
const Eye = dynamic(() => import('lucide-react').then(mod => ({ default: mod.Eye })), { ssr: false })
const EyeOff = dynamic(() => import('lucide-react').then(mod => ({ default: mod.EyeOff })), { ssr: false })

// Demo content component
function AuthDemoContent() {
  const { user, isAuthenticated, sessionInfo, isLoading } = useAuth()
  const [showProtectedContent, setShowProtectedContent] = useState(false)
  const [showAdvancedContent, setShowAdvancedContent] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d7276] mx-auto mb-4"></div>
          <p className="text-[#529a9d]">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfefe] via-[#cae0e1] to-[#90bfc0] font-thai">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Stethoscope className="h-8 w-8 text-[#0d7276]" />
            <h1 className="text-4xl font-bold text-[#0d7276]">
              TBAT Authentication System Demo
            </h1>
          </div>
          <p className="text-lg text-[#529a9d]">
            ทดสอบระบบยืนยันตัวตนแบบ Bottom Sheet Mobile-First (Option C)
          </p>
          <Badge variant="outline" className="mt-2 text-[#0d7276] border-[#0d7276]">
            🚀 พร้อม Forgot Password & Session Management
          </Badge>
        </div>

        {/* Authentication Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-[#0d7276] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0d7276]">
                <ShieldCheck className="w-5 h-5" />
                สถานะการยืนยันตัวตน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-800 font-semibold">❌ ยังไม่ได้เข้าสู่ระบบ</p>
                    <p className="text-red-600 text-sm mt-1">กรุณาเข้าสู่ระบบเพื่อทดสอบฟีเจอร์</p>
                  </div>
                  <LoginModal
                    trigger={
                      <Button className="w-full bg-gradient-to-r from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83] text-white py-3">
                        <Stethoscope className="w-4 h-4 mr-2" />
                        เข้าสู่ระบบ TBAT (Option C Design)
                      </Button>
                    }
                    onSuccess={(user) => {
                      console.log('Login successful:', user)
                    }}
                    onError={(error) => {
                      console.error('Login error:', error)
                    }}
                  />
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-green-800 font-semibold">✅ เข้าสู่ระบบแล้ว</p>
                    <p className="text-green-600 text-sm mt-1">ยินดีต้อนรับ {user?.thaiName}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#0d7276]">ชื่อ:</span>
                      <span className="text-sm text-[#529a9d]">{user?.thaiName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#0d7276]">อีเมล:</span>
                      <span className="text-sm text-[#529a9d]">{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#0d7276]">แพ็คเกจ:</span>
                      <Badge
                        variant="outline"
                        className={user?.packageType === 'ADVANCED'
                          ? "bg-gradient-to-r from-[#0d7276] to-[#529a9d] text-white"
                          : "border-gray-300 text-gray-600"
                        }
                      >
                        {user?.packageType === 'ADVANCED' ? 'แพ็คเกจขั้นสูง' : 'แพ็คเกจฟรี'}
                      </Badge>
                    </div>
                    {sessionInfo?.timeRemaining && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#0d7276]">เวลาคงเหลือ:</span>
                        <Badge variant="outline" className="border-blue-300 text-blue-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {sessionInfo.timeRemaining}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <LogoutButton
                    user={{
                      thaiName: user?.thaiName || '',
                      email: user?.email || '',
                      packageType: user?.packageType || 'FREE',
                      lastLoginAt: user?.lastLoginAt
                    }}
                    sessionInfo={sessionInfo || undefined}
                    onLogout={() => {
                      console.log('Logout successful')
                    }}
                    onError={(error) => {
                      console.error('Logout error:', error)
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Design Features */}
          <Card className="border-2 border-[#529a9d] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#529a9d]">
                <Smartphone className="w-5 h-5" />
                Option C Design Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">Bottom Sheet Mobile-First Design</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">Swipe Indicator & Handle Bar</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">Forgot Password Integration</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">Medical Stethoscope Icon</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">Thai Language Support</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">TBAT Color Palette</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">Profile Chip with Initials</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-500 font-bold">✅</span>
                  <span className="text-sm text-[#0d7276]">Session Timer & Auto-logout</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protected Content Tests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Basic Protected Content */}
          <Card className="border-2 border-[#90bfc0] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#0d7276]">
                <TestTube className="w-5 h-5" />
                ทดสอบ Protected Route (ต้องล็อกอิน)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowProtectedContent(!showProtectedContent)}
                  variant="outline"
                  className="border-[#90bfc0] text-[#529a9d] hover:bg-[#cae0e1]"
                >
                  {showProtectedContent ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      ซ่อน
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      แสดง
                    </>
                  )}
                </Button>
              </div>

              {showProtectedContent && (
                <ProtectedRoute requireAuth={true}>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">🎉 เนื้อหาสำหรับสมาชิก</h3>
                    <p className="text-green-700 text-sm">
                      ขอแสดงความยินดี! คุณสามารถเข้าถึงเนื้อหาที่ต้องการการยืนยันตัวตนได้แล้ว
                    </p>
                    <div className="mt-2 p-2 bg-white rounded border-2 border-green-300">
                      <p className="text-xs text-green-600">
                        📊 นี่คือตัวอย่างข้อมูลที่ป้องกันไว้ เช่น คะแนนสอบ หรือเนื้อหาสำหรับสมาชิก
                      </p>
                    </div>
                  </div>
                </ProtectedRoute>
              )}
            </CardContent>
          </Card>

          {/* Advanced Package Content */}
          <Card className="border-2 border-[#529a9d] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#529a9d]">
                <Users className="w-5 h-5" />
                ทดสอบ Package Requirement (Advanced Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAdvancedContent(!showAdvancedContent)}
                  variant="outline"
                  className="border-[#529a9d] text-[#529a9d] hover:bg-[#cae0e1]"
                >
                  {showAdvancedContent ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      ซ่อน
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      แสดง
                    </>
                  )}
                </Button>
              </div>

              {showAdvancedContent && (
                <ProtectedRoute
                  requireAuth={true}
                  requiredPackage="ADVANCED"
                  showInlinePrompt={true}
                >
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">🏥 เนื้อหาพิเศษสำหรับแพ็คเกจขั้นสูง</h3>
                    <p className="text-blue-700 text-sm">
                      นี่คือเนื้อหาที่มีเฉพาะสำหรับผู้ใช้แพ็คเกจขั้นสูงเท่านั้น
                    </p>
                    <ul className="text-blue-600 text-xs mt-2 space-y-1">
                      <li>• การวิเคราะห์ผลคะแนนแบบละเอียด</li>
                      <li>• เข้าถึงข้อสอบทั้ง 3 วิชา (ชีวะ เคมี ฟิสิกส์)</li>
                      <li>• ดาวน์โหลดไฟล์ PDF เฉลย</li>
                      <li>• แนะนำการปรับปรุงตัวเฉพาะบุคคล</li>
                    </ul>
                  </div>
                </ProtectedRoute>
              )}
            </CardContent>
          </Card>
        </div>

        {/* API Integration Status */}
        <Card className="border-2 border-[#0d7276] shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0d7276]">
              <TestTube className="w-5 h-5" />
              การเชื่อมต่อ API (Story 2.4 Integration)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                <div className="text-green-600 font-bold text-sm">POST /api/auth/signin</div>
                <div className="text-green-500 text-xs mt-1">✅ ผสานแล้ว</div>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                <div className="text-green-600 font-bold text-sm">POST /api/auth/signout</div>
                <div className="text-green-500 text-xs mt-1">✅ ผสานแล้ว</div>
              </div>
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-center">
                <div className="text-green-600 font-bold text-sm">POST /api/auth/forgot-password</div>
                <div className="text-green-500 text-xs mt-1">✅ ผสานแล้ว</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>📋 ความพร้อม:</strong> ระบบยืนยันตัวตนพร้อมใช้งาน รองรับ JWT session management,
                account lockout protection, และ rate limiting ตาม Story 2.4
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main page with provider
export default function AuthDemoPage() {
  return (
    <AuthProvider>
      <AuthDemoContent />
    </AuthProvider>
  )
}