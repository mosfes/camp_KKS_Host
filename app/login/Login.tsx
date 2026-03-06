"use client";

import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Link } from "@heroui/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInSide() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("กรุณากรอก Email");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      // Login สำเร็จ → ไปหน้า dashboard ตามบทบาท
      const role = data.teacher?.role;
      if (role === "HEAD_TEACHER") {
        router.push("/headteacher/dashboard");
      } else {
        router.push("/headteacher/dashboard");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f0e7] flex flex-col items-center justify-center px-4">
      {/* Logo + Title */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image
            alt="EduCamp Logo"
            className="rounded-full bg-[#6b7f73]"
            height={72}
            src="/images/login.png"
            width={72}
          />
        </div>
        <h1 className="text-2xl text-gray-700 font-semibold">EduCamp</h1>
      </div>

      {/* Card */}
      <Card
        className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-lg"
      >
        <CardBody className="p-8 space-y-5">
          <div>
            <h2 className="text-xl text-gray-600 font-semibold">ยินดีต้อนรับ</h2>
            <p className="text-gray-500 text-sm">เข้าสู่ระบบเพื่อจัดการค่าย</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-gray-500 text-sm mb-2">อีเมล</p>
              <Input
                label="อีเมล"
                size="sm"
                type="email"
                value={email}
                onValueChange={(v) => { setEmail(v); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            className="w-full rounded-full bg-[#5d7c6f] text-white border border-[#5d7c6f] transition-colors hover:bg-white hover:text-[#5d7c6f] hover:border-[#5d7c6f]"
            color="primary"
            isLoading={loading}
            onPress={handleLogin}
          >
            เข้าสู่ระบบ
          </Button>

          <p className="text-center text-sm text-gray-500">
            ยังไม่มีบัญชี?{" "}
            <Link className="font-medium text-[#5d7c6f] hover:text-primary" href="#">
              ติดต่อแอดมิน
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
