"use client";

import { TeacherProfileView } from "@/components/profile/TeacherProfileView";

export default function AdminProfilePage() {
  return (
    <TeacherProfileView
      backUrl="/admin_add_user"
      backLabel="กลับสู่หน้าจัดการระบบ"
    />
  );
}
