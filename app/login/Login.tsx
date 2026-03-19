"use client";

import Image from "next/image";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft } from "lucide-react";

export default function ParentLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/parent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push("/parent/dashboard");
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
      <Card className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-lg">
        <CardBody className="p-8 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#eaf1ee] flex items-center justify-center text-[#5d7c6f]">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-xl text-gray-600 font-semibold">เข้าสู่ระบบผู้ปกครอง</h2>
              <p className="text-gray-500 text-sm">ใช้รหัสนักเรียนของบุตรหลาน</p>
            </div>
          </div>

          {/* Username */}
          <div>
            <p className="text-gray-500 text-sm mb-2">ชื่อผู้ใช้ (รหัสนักเรียน)</p>
            <Input
              label="รหัสนักเรียน"
              size="sm"
              type="text"
              value={username}
              onValueChange={(v) => { setUsername(v); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Password */}
          <div>
            <p className="text-gray-500 text-sm mb-2">รหัสผ่าน</p>
            <Input
              label="รหัสผ่าน"
              size="sm"
              type="password"
              value={password}
              onValueChange={(v) => { setPassword(v); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            className="w-full rounded-full bg-[#5d7c6f] text-white border border-[#5d7c6f] transition-colors hover:bg-white hover:text-[#5d7c6f] hover:border-[#5d7c6f]"
            color="primary"
            isLoading={loading}
            onPress={handleLogin}
          >
            เข้าสู่ระบบ
          </Button>

          {/* Back to main */}
          <button
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-[#5d7c6f] transition-colors"
          >
            <ArrowLeft size={14} />
            กลับหน้าหลัก
          </button>
        </CardBody>
      </Card>
    </div>
  );
}
