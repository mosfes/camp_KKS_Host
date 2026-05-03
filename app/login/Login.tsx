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
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
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
    <div className="min-h-screen w-full bg-[#fbf9f4] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#5d7c6f]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-[#3d5c50]/10 rounded-full blur-3xl pointer-events-none" />
      
      <Card className="w-full max-w-md rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-gray-200/50 relative z-10 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#5d7c6f] to-[#3d5c50]" />
        <CardBody className="p-8 space-y-5">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6 relative group">
              <div className="absolute inset-0 bg-[#5d7c6f]/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 scale-90" />
              <Image
                alt="KKS Camp Logo"
                className="relative z-10 transition-transform duration-500 group-hover:scale-110"
                height={120}
                src="/images/logoKKS.png"
                width={120}
              />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">KKS Camp</h1>
            <p className="text-[10px] font-black text-[#5d7c6f] uppercase tracking-[0.3em] mt-1 opacity-70">Experience Excellence</p>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#5d7c6f] shadow-lg shadow-[#5d7c6f]/20 flex items-center justify-center text-white shrink-0">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800 leading-none mb-1">
                ผู้ปกครอง
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                ระบบเข้าใช้งานสำหรับผู้ปกครอง
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                ชื่อผู้ใช้ (รหัสนักเรียน)
              </label>
              <Input
                classNames={{
                  inputWrapper: "h-12 bg-gray-50/50 border border-gray-100 focus-within:border-[#5d7c6f] transition-all rounded-xl shadow-inner",
                  input: "text-base font-bold text-gray-800 placeholder:text-gray-300",
                }}
                placeholder="กรอกรหัสนักเรียน"
                type="text"
                value={username}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                onValueChange={(v) => {
                  setUsername(v);
                  setError("");
                }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                รหัสผ่าน
              </label>
              <Input
                classNames={{
                  inputWrapper: "h-12 bg-gray-50/50 border border-gray-100 focus-within:border-[#5d7c6f] transition-all rounded-xl shadow-inner",
                  input: "text-base font-bold text-gray-800 placeholder:text-gray-300",
                }}
                placeholder="กรอกรหัสผ่าน"
                type="password"
                value={password}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                onValueChange={(v) => {
                  setPassword(v);
                  setError("");
                }}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="pt-2 space-y-4">
            <Button
              className="w-full h-14 rounded-2xl bg-[#5d7c6f] text-white font-black text-lg shadow-xl shadow-[#5d7c6f]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              isLoading={loading}
              onPress={handleLogin}
            >
              เข้าสู่ระบบ
            </Button>

            <button
              className="w-full flex items-center justify-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-[#5d7c6f] transition-colors"
              onClick={() => router.push("/")}
            >
              <ArrowLeft size={14} strokeWidth={3} />
              กลับสู่หน้าหลัก
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
