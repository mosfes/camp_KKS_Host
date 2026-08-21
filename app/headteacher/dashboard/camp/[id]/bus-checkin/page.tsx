"use client";

import { useParams, useRouter } from "next/navigation";

import BusManagementModal from "../../BusManagementModal";

export default function BusCheckinPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  return (
    <BusManagementModal
      isOpen
      pageMode
      campId={campId}
      onClose={() => router.push("/headteacher/dashboard")}
    />
  );
}
