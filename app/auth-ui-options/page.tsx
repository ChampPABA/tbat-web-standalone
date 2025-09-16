'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Stethoscope, LogOut, User, ChevronDown, X, Eye, MousePointer, Smartphone, Layout, Zap } from 'lucide-react'

export default function AuthUIOptionsPage() {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [selectionRationale, setSelectionRationale] = useState<string>('')
  const [additionalRequirements, setAdditionalRequirements] = useState<string>('')

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option)
  }

  const handleSubmitSelection = () => {
    const selectionData = {
      selectedOption,
      selectionRationale,
      additionalRequirements,
      timestamp: new Date().toISOString(),
      reviewer: 'Product Owner'
    }

    console.log('Design Selection:', selectionData)
    alert(`ตัวเลือก ${selectedOption} ได้รับการเลือกแล้ว!\n\nกรุณาบันทึกข้อมูลการเลือกใน Dev Agent Record ของ Story 2.4.1`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfefe] via-[#cae0e1] to-[#90bfc0] font-thai">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Stethoscope className="h-8 w-8 text-[#0d7276]" />
            <h1 className="text-4xl font-bold text-[#0d7276]">
              TBAT Authentication UI Options
            </h1>
          </div>
          <p className="text-lg text-[#529a9d] max-w-3xl mx-auto">
            เลือกรูปแบบการออกแบบ UI สำหรับระบบยืนยันตัวตนที่เหมาะสมที่สุดสำหรับแพลตฟอร์ม TBAT Mock Exam
          </p>
          <Badge variant="outline" className="mt-4 text-[#0d7276] border-[#0d7276]">
            🚨 การพัฒนาต้องหยุดรอการเลือกจากผู้มีส่วนได้ส่วนเสีย
          </Badge>
        </div>

        {/* Design Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">

          {/* Option A: Modal-Centered Traditional */}
          <DesignOptionCard
            option="A"
            title="Modal-Centered Traditional"
            subtitle="แบบดั้งเดิม - โมดัลกลางหน้าจอ"
            selected={selectedOption === 'A'}
            onSelect={() => handleOptionSelect('A')}
            preview={<OptionAPreview />}
            description={[
              "โมดัลเข้าสู่ระบบแบบกลางหน้าจอ",
              "ปุ่มออกจากระบบแบบเมนูดรอปดาวน์",
              "แสดงข้อความต้อนรับในส่วนหัว",
              "การเปลี่ยนเส้นทางเมื่อเข้าหน้าที่ต้องล็อกอิน"
            ]}
          />

          {/* Option B: Slide-In Panel Modern */}
          <DesignOptionCard
            option="B"
            title="Slide-In Panel Modern"
            subtitle="สไตล์โมเดิร์น - แผงเลื่อนจากขวา"
            selected={selectedOption === 'B'}
            onSelect={() => handleOptionSelect('B')}
            preview={<OptionBPreview />}
            description={[
              "แผงเลื่อนจากด้านขวา (320px)",
              "ปุ่มไอคอนพร้อมการยืนยัน",
              "วงกลมอวตารพร้อมเมนูดรอปดาวน์",
              "การแจ้งยืนยันตัวตนภายในเนื้อหา"
            ]}
          />

          {/* Option C: Bottom Sheet Mobile-First */}
          <DesignOptionCard
            option="C"
            title="Bottom Sheet Mobile-First"
            subtitle="มือถือเป็นหลัก - แผ่นจากด้านล่าง"
            selected={selectedOption === 'C'}
            onSelect={() => handleOptionSelect('C')}
            preview={<OptionCPreview />}
            description={[
              "แผ่นจากด้านล่าง (มือถือ) / โมดัลกลาง (คอมพิวเตอร์)",
              "ท่าทางสไลด์ + ปุ่มยืนยัน",
              "ชิปโปรไฟล์พร้อมไอคอนหูฟัง",
              "แผ่นยืนยันตัวตนพร้อมตัวบ่งชี้ความคืบหน้า"
            ]}
          />

          {/* Option D: Inline Form Seamless */}
          <DesignOptionCard
            option="D"
            title="Inline Form Seamless"
            subtitle="แบบไร้รอยต่อ - ไม่มีโมดัล"
            selected={selectedOption === 'D'}
            onSelect={() => handleOptionSelect('D')}
            preview={<OptionDPreview />}
            description={[
              "การเปลี่ยนหน้าไปยังหน้าล็อกอินแยก",
              "ปุ่มออกจากระบบในเมนูผู้ใช้",
              "ส่วนหัวพร้อมตัวนับเวลาเซสชัน",
              "ฟอร์มแทนที่เนื้อหาในหน้า"
            ]}
          />

          {/* Option E: Floating Action Minimalist */}
          <DesignOptionCard
            option="E"
            title="Floating Action Minimalist"
            subtitle="มินิมอลสม - ปุ่มลอยน้ำ"
            selected={selectedOption === 'E'}
            onSelect={() => handleOptionSelect('E')}
            preview={<OptionEPreview />}
            description={[
              "ฟอร์มลอยน้ำขนาดเล็ก (280px)",
              "ปุ่มลอยน้ำแตะเดียวพร้อมแอนิเมชัน",
              "ป้ายโปรไฟล์ลอยน้ำแบบมินิมอล",
              "การแจ้งแบบลอยน้ำเมื่อจำเป็น"
            ]}
          />
        </div>

        {/* Selection Form */}
        {selectedOption && (
          <Card className="max-w-2xl mx-auto border-2 border-[#0d7276] shadow-xl animate-fade-in">
            <CardHeader className="bg-gradient-to-r from-[#0d7276] to-[#529a9d] text-white">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                การบันทึกการเลือก UI Design - ตัวเลือก {selectedOption}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-4 bg-[#cae0e1] rounded-lg">
                  <p className="text-[#0d7276] font-semibold text-center">
                    คุณได้เลือก: <Badge className="bg-[#0d7276] text-white ml-2">ตัวเลือก {selectedOption}</Badge>
                  </p>
                </div>

                <div>
                  <Label htmlFor="rationale" className="text-[#0d7276] font-medium">
                    เหตุผลในการเลือก *
                  </Label>
                  <textarea
                    id="rationale"
                    value={selectionRationale}
                    onChange={(e) => setSelectionRationale(e.target.value)}
                    className="w-full mt-2 p-3 border-2 border-[#90bfc0] rounded-lg focus:border-[#0d7276] font-thai"
                    rows={4}
                    placeholder="กรุณาระบุเหตุผลในการเลือก UI design นี้..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="additional" className="text-[#0d7276] font-medium">
                    ความต้องการเพิ่มเติม
                  </Label>
                  <textarea
                    id="additional"
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    className="w-full mt-2 p-3 border-2 border-[#90bfc0] rounded-lg focus:border-[#0d7276] font-thai"
                    rows={3}
                    placeholder="ความต้องการเพิ่มเติมหรือการปรับแต่ง (ถ้ามี)..."
                  />
                </div>

                <Button
                  onClick={handleSubmitSelection}
                  disabled={!selectionRationale.trim()}
                  className="w-full bg-gradient-to-r from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83] text-white py-3 text-lg font-semibold btn-hover-effect"
                >
                  ยืนยันการเลือก UI Design
                </Button>

                <div className="text-sm text-[#529a9d] text-center">
                  <p>📝 หลังจากยืนยันแล้ว กรุณาบันทึกข้อมูลใน <strong>Dev Agent Record</strong> ของ Story 2.4.1</p>
                  <p className="mt-1">🚨 <strong>การพัฒนาจะหยุดชั่วคราว</strong> จนกว่าจะได้รับการอนุมัติ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Design Option Card Component
function DesignOptionCard({
  option,
  title,
  subtitle,
  selected,
  onSelect,
  preview,
  description
}: {
  option: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
  preview: React.ReactNode;
  description: string[];
}) {
  return (
    <Card className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
      selected ? 'border-2 border-[#0d7276] shadow-xl ring-2 ring-[#0d7276] ring-opacity-30' : 'border-[#90bfc0] hover:border-[#529a9d]'
    }`}
    onClick={onSelect}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant={selected ? "default" : "outline"}
            className={selected ? "bg-[#0d7276] text-white" : "border-[#529a9d] text-[#529a9d]"}
          >
            ตัวเลือก {option}
          </Badge>
          {selected && <div className="w-4 h-4 bg-[#0d7276] rounded-full animate-pulse-soft" />}
        </div>
        <CardTitle className="text-xl text-[#0d7276]">{title}</CardTitle>
        <p className="text-sm text-[#529a9d]">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div className="bg-gradient-to-br from-[#fdfefe] to-[#cae0e1] p-4 rounded-lg border border-[#90bfc0]">
          {preview}
        </div>

        {/* Description */}
        <ul className="text-sm space-y-1">
          {description.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-[#0d7276]">
              <span className="text-[#529a9d] mt-1">•</span>
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// Preview Components for each option with working shadcn components
function OptionAPreview() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#0d7276]">📱 Desktop & Mobile</span>
        <Avatar className="w-6 h-6">
          <AvatarFallback className="bg-[#0d7276] text-white text-xs">AB</AvatarFallback>
        </Avatar>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full bg-[#0d7276] hover:bg-[#0a5f63] text-white">
            <Eye className="w-3 h-3 mr-1" />
            ดูตัวอย่าง Modal แบบดั้งเดิม
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[#0d7276] flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              เข้าสู่ระบบ TBAT
            </DialogTitle>
            <DialogDescription className="text-[#529a9d]">
              กรุณาใส่ข้อมูลเพื่อเข้าสู่ระบบสอบ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" placeholder="student@example.com" className="border-[#90bfc0] focus:border-[#0d7276]" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" type="password" className="border-[#90bfc0] focus:border-[#0d7276]" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-[#90bfc0] text-[#529a9d]">ยกเลิก</Button>
            </DialogClose>
            <Button className="bg-[#0d7276] hover:bg-[#0a5f63]">เข้าสู่ระบบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="text-xs text-[#529a9d] text-center">✨ โมดัลกลางหน้าจอแบบคลาสสิก</p>
    </div>
  )
}

function OptionBPreview() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#0d7276]">💻 Modern Slide Panel</span>
        <Avatar className="w-6 h-6">
          <AvatarFallback className="bg-gradient-to-r from-[#0d7276] to-[#529a9d] text-white text-xs">นศ</AvatarFallback>
        </Avatar>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button size="sm" className="w-full bg-gradient-to-r from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83] text-white">
            <MousePointer className="w-3 h-3 mr-1" />
            ดูตัวอย่าง Panel แบบโมเดิร์น
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[320px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-[#0d7276] flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              เข้าสู่ระบบ TBAT
            </SheetTitle>
            <SheetDescription className="text-[#529a9d]">
              ระบบยืนยันตัวตนสำหรับนักเรียนแพทย์
            </SheetDescription>
          </SheetHeader>
          <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
            <div className="grid gap-3">
              <Label htmlFor="sheet-email">อีเมล</Label>
              <Input id="sheet-email" placeholder="student@medical.ac.th" className="border-[#90bfc0] focus:border-[#0d7276]" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="sheet-password">รหัสผ่าน</Label>
              <Input id="sheet-password" type="password" className="border-[#90bfc0] focus:border-[#0d7276]" />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remember" className="accent-[#0d7276]" />
              <Label htmlFor="remember" className="text-sm">จดจำการเข้าสู่ระบบ</Label>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button variant="outline" className="border-[#90bfc0] text-[#529a9d]">ยกเลิก</Button>
            </SheetClose>
            <Button className="bg-gradient-to-r from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83]">
              เข้าสู่ระบบ
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <p className="text-xs text-[#529a9d] text-center">🚀 แผงเลื่อนจากขวาแบบโมเดิร์น</p>
    </div>
  )
}

function OptionCPreview() {
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#0d7276]">📱 Mobile-First Design</span>
        <div className="flex items-center gap-1">
          <Stethoscope className="w-3 h-3 text-[#0d7276]" />
          <Badge variant="outline" className="text-xs py-0 px-1 border-[#0d7276] text-[#0d7276]">นิสิต</Badge>
        </div>
      </div>

      <Button
        size="sm"
        className="w-full bg-gradient-to-t from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83] text-white"
        onClick={() => setMobileLoginOpen(!mobileLoginOpen)}
      >
        <Smartphone className="w-3 h-3 mr-1" />
        ดูตัวอย่าง Bottom Sheet มือถือ
      </Button>

      {mobileLoginOpen && (
        <div className="bg-white border-2 border-[#cae0e1] rounded-t-2xl p-4 space-y-4 animate-slide-up">
          <div className="flex justify-center">
            <div className="w-8 h-1 bg-[#90bfc0] rounded-full"></div>
          </div>
          <div className="text-center">
            <h3 className="text-[#0d7276] font-semibold flex items-center justify-center gap-2">
              <Stethoscope className="w-4 h-4" />
              เข้าสู่ระบบ TBAT
            </h3>
          </div>
          <div className="space-y-3">
            <Input placeholder="อีเมล" className="border-[#90bfc0] focus:border-[#0d7276]" />
            <Input type="password" placeholder="รหัสผ่าน" className="border-[#90bfc0] focus:border-[#0d7276]" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMobileLoginOpen(false)} className="flex-1 border-[#90bfc0] text-[#529a9d]">
              ยกเลิก
            </Button>
            <Button className="flex-1 bg-[#0d7276] hover:bg-[#0a5f63]">
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>
      )}
      <p className="text-xs text-[#529a9d] text-center">📱 Bottom sheet สำหรับมือถือ</p>
    </div>
  )
}

function OptionDPreview() {
  const [showInlinePage, setShowInlinePage] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#0d7276]">🔗 Seamless Integration</span>
        <div className="flex items-center gap-1">
          <span className="text-[#529a9d]">⏱ 29:45</span>
          <Avatar className="w-5 h-5">
            <AvatarFallback className="bg-[#cae0e1] text-[#0d7276] text-xs">?</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Button
        size="sm"
        className="w-full bg-[#0d7276] hover:bg-[#0a5f63] text-white"
        onClick={() => setShowInlinePage(!showInlinePage)}
      >
        <Layout className="w-3 h-3 mr-1" />
        ดูตัวอย่าง Inline Form แบบไร้รอยต่อ
      </Button>

      {showInlinePage && (
        <Card className="border-[#90bfc0] animate-fade-in">
          <CardHeader className="text-center pb-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Stethoscope className="w-5 h-5 text-[#0d7276]" />
              <CardTitle className="text-lg text-[#0d7276]">TBAT Mock Exam</CardTitle>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#529a9d]">กรุณาเข้าสู่ระบบ</span>
              <Badge variant="secondary" className="bg-[#cae0e1] text-[#0d7276]">เซสชัน: 29:45</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="อีเมลนิสิตแพทย์" className="border-[#90bfc0] focus:border-[#0d7276]" />
            <Input type="password" placeholder="รหัสผ่าน" className="border-[#90bfc0] focus:border-[#0d7276]" />
            <Button className="w-full bg-[#0d7276] hover:bg-[#0a5f63]">
              เข้าสู่ระบบและเริ่มสอบ
            </Button>
          </CardContent>
        </Card>
      )}
      <p className="text-xs text-[#529a9d] text-center">📄 หน้าเว็บแบบไร้รอยต่อ</p>
    </div>
  )
}

function OptionEPreview() {
  const [showFloatingLogin, setShowFloatingLogin] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#0d7276]">⚡ Minimalist Float</span>
        <Badge
          variant="outline"
          className="border-[#0d7276] text-[#0d7276] rounded-full w-6 h-6 p-0 flex items-center justify-center text-xs cursor-pointer hover:bg-[#cae0e1]"
        >
          นศ
        </Badge>
      </div>

      <div className="relative">
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-[#0d7276] to-[#529a9d] hover:from-[#0a5f63] hover:to-[#457f83] text-white"
          onClick={() => setShowFloatingLogin(!showFloatingLogin)}
        >
          <Zap className="w-3 h-3 mr-1" />
          ดูตัวอย่าง Floating Form มินิมอล
        </Button>

        {showFloatingLogin && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white border-2 border-[#0d7276] rounded-lg shadow-xl p-4 z-10 animate-fade-in">
            <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l-2 border-t-2 border-[#0d7276] transform rotate-45"></div>

            <div className="text-center mb-3">
              <div className="flex items-center justify-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#0d7276]" />
                <span className="text-sm font-semibold text-[#0d7276]">TBAT Login</span>
              </div>
            </div>

            <div className="space-y-2">
              <Input placeholder="อีเมล" size={2} className="h-8 border-[#90bfc0] focus:border-[#0d7276] text-sm" />
              <Input type="password" placeholder="รหัสผ่าน" size={2} className="h-8 border-[#90bfc0] focus:border-[#0d7276] text-sm" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFloatingLogin(false)}
                  className="flex-1 h-7 text-xs border-[#90bfc0] text-[#529a9d]"
                >
                  ยกเลิก
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-7 text-xs bg-[#0d7276] hover:bg-[#0a5f63]"
                >
                  เข้า
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-[#529a9d] text-center">💫 ฟอร์มลอยแบบมินิมอล</p>
    </div>
  )
}