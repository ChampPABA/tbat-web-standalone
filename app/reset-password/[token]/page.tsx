"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";

interface ResetPasswordPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const router = useRouter();
  const { completePasswordReset } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Extract token from async params
  useEffect(() => {
    const getToken = async () => {
      const resolvedParams = await params;
      setToken(resolvedParams.token);
    };
    getToken();
  }, [params]);

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      return; // Wait for token to be loaded
    }

    // Token format validation (basic check)
    if (token.length < 10) {
      setError("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง");
      setTokenValid(false);
      return;
    }

    setTokenValid(true);
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  const validatePasswords = (): boolean => {
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("กรุณากรอกรหัสผ่านให้ครบถ้วน");
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return false;
    }

    const hasLetter = /[a-zA-Z]/.test(formData.newPassword);
    const hasNumber = /[0-9]/.test(formData.newPassword);

    if (!hasLetter || !hasNumber) {
      setError("รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลข");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await completePasswordReset(token!, formData.newPassword);

      if (result.success) {
        setSuccess(true);
        toast.success("รีเซ็ตรหัสผ่านสำเร็จ", {
          description: "กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...",
        });
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/?login=true');
        }, 3000);
      } else {
        const errorMessage = result.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
        setError(errorMessage);
        toast.error("รีเซ็ตรหัสผ่านไม่สำเร็จ", {
          description: errorMessage,
        });
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const networkError = "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง";
      setError(networkError);
      toast.error("เชื่อมต่อไม่สำเร็จ", {
        description: networkError,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-tbat-primary" />
          <p className="text-gray-600">กำลังตรวจสอบลิงก์...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">ลิงก์ไม่ถูกต้อง</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              ลิงก์รีเซ็ตรหัสผ่านนี้ไม่ถูกต้องหรือหมดอายุแล้ว
            </p>
            <div className="space-y-2">
              <Link href="/?forgot=true">
                <Button className="w-full" variant="default">
                  ขอลิンก์รีเซ็ตใหม่
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  กลับหน้าหลัก
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">รีเซ็ตรหัสผ่านสำเร็จ</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              รหัสผ่านของคุณได้ถูกเปลี่ยนแล้ว
            </p>
            <p className="text-sm text-gray-500">
              กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-tbat-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Back to homepage link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-tbat-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            กลับหน้าหลัก
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-tbat-primary">
              รีเซ็ตรหัสผ่าน
            </CardTitle>
            <p className="text-gray-600 mt-2">
              กรุณากำหนดรหัสผ่านใหม่ของคุณ
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  รหัสผ่านใหม่ *
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="กรอกรหัสผ่านใหม่"
                    className="pr-10"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  ยืนยันรหัสผ่าน *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="pr-10"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <p className="font-medium mb-1">รหัสผ่านต้องมี:</p>
                <ul className="space-y-1">
                  <li>• อย่างน้อย 8 ตัวอักษร</li>
                  <li>• ตัวอักษรภาษาอังกฤษอย่างน้อย 1 ตัว</li>
                  <li>• ตัวเลขอย่างน้อย 1 ตัว</li>
                  <li>• สามารถซ้ำกับรหัสผ่านเดิมได้</li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-tbat-primary hover:bg-tbat-secondary"
                disabled={isSubmitting || !formData.newPassword || !formData.confirmPassword}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    กำลังเปลี่ยนรหัสผ่าน...
                  </div>
                ) : (
                  "เปลี่ยนรหัสผ่าน"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <div className="text-center text-sm text-gray-500">
          <p>
            หากพบปัญหา{" "}
            <Link href="/contact" className="text-tbat-primary hover:underline">
              ติดต่อเรา
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}