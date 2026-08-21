"use client";

import { useParams, useRouter } from "next/navigation";

import AttendanceModal from "../../AttendanceModal";

export default function AttendancePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  return (
    <AttendanceModal
      isOpen
      pageMode
      campId={campId}
      onClose={() => router.push("/headteacher/dashboard")}
    />
  );
}
