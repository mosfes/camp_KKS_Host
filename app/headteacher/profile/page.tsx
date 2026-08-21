"use client";

import { TeacherProfileView } from "@/components/profile/TeacherProfileView";

export default function HeadteacherProfilePage() {
  return (
    <TeacherProfileView
      backLabel="กลับสู่แดชบอร์ด"
      backUrl="/headteacher/dashboard"
    />
  );
}
