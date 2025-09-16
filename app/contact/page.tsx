import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-3xl font-bold text-blue-600">TBAT</span>
              <span className="text-2xl font-light text-gray-600 ml-2">Mock Exam</span>
            </Link>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">ติดต่อเรา</h1>
            <p className="text-xl text-gray-600">สนามสอบ TBAT จำลองที่เชียงใหม่ จัดโดย ASPECT</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📞 ช่องทางการติดต่อ</h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Line Official</h3>
                    <p className="text-blue-600 font-semibold">@aimmed.official</p>
                    <p className="text-sm text-gray-600">แชทได้ 24/7 ตอบเร็วที่สุด</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
                  <span className="text-2xl">📞</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">โทรศัพท์</h3>
                    <p className="text-blue-600 font-semibold">099-378-8111</p>
                    <p className="text-sm text-gray-600">เวลาทำการ 09:00-18:00 น.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-orange-50 rounded-lg">
                  <span className="text-2xl">📧</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">อีเมล</h3>
                    <p className="text-blue-600 font-semibold">aspect.educationcenter@gmail.com</p>
                    <p className="text-sm text-gray-600">สำหรับข้อมูลทั่วไป</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 ข้อมูลการสอบ</h2>

              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">📅 วันที่สอบ</h3>
                  <p className="text-gray-800 font-semibold">วันเสาร์ที่ 27 กันยายน 2568</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">⏰ เวลาสอบ</h3>
                  <p className="text-gray-800">รอบเช้า: 09:00-12:00 น.</p>
                  <p className="text-gray-800">รอบบ่าย: 13:00-16:00 น.</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">🎯 จำนวนผู้สอบ</h3>
                  <p className="text-gray-800">จำกัดรอบละไม่เกิน 300 ท่าน</p>
                </div>

                <div className="text-center mt-8">
                  <p className="text-lg font-semibold text-blue-600">ASPECT Education Center</p>
                  <p className="text-gray-600">เชียงใหม่, ประเทศไทย</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">พร้อมสมัครแล้วหรือยัง?</h2>
              <p className="text-lg mb-6">สมัครตอนนี้เพื่อรับส่วนลดพิเศษ!</p>
              <Link
                href="/register"
                className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                สมัครเลย
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
