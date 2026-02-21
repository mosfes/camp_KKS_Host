"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export default function AutoLogout({ email }: { email: string }) {
  const { signOut } = useClerk();

  useEffect(() => {
    alert(`อีเมล ${email} ไม่ได้ลงทะเบียนในระบบ โปรดติดต่อผู้ดูแลระบบ`);

    signOut({ redirectUrl: "/" });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-xl font-bold text-red-500">ไม่พบข้อมูลผู้ใช้งาน</h1>
      <p className="mt-2 text-gray-600">กำลังออกจากระบบอัตโนมัติ...</p>
    </div>
  );
}
