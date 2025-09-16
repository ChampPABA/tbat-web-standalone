"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, School, Phone, CreditCard, Package } from 'lucide-react';

interface User {
  id: string;
  email: string;
  thaiName: string;
  nationalId: string;
  phone: string;
  school: string;
  packageType: "FREE" | "ADVANCED";
  pdpaConsent: boolean;
}

interface RegistrationInfoProps {
  user: User;
}

export default function RegistrationInfo({ user }: RegistrationInfoProps) {
  const getPackageTypeLabel = (packageType: "FREE" | "ADVANCED") => {
    return packageType === "FREE" ? "Free" : "Advanced";
  };

  const getPaymentStatusLabel = (packageType: "FREE" | "ADVANCED") => {
    return packageType === "FREE" ? "ไม่ต้องชำระ" : "ชำระแล้ว";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          ข้อมูลการลงทะเบียน
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">ชื่อ-นามสกุล</label>
              <p className="text-gray-900 font-medium">{user.thaiName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">เลขประจำตัวประชาชน</label>
              <p className="text-gray-900 font-mono">{user.nationalId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">หมายเลขโทรศัพท์</label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <p className="text-gray-900">{user.phone}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">โรงเรียน</label>
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-gray-500" />
                <p className="text-gray-900">{user.school}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">แพ็กเกจ</label>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <Badge variant={user.packageType === "ADVANCED" ? "default" : "secondary"}>
                  {getPackageTypeLabel(user.packageType)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">สถานะการชำระเงิน</label>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                <Badge variant={user.packageType === "ADVANCED" ? "default" : "outline"}>
                  {getPaymentStatusLabel(user.packageType)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}