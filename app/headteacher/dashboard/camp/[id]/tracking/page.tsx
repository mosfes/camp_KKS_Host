"use client";

import { useParams, useRouter } from "next/navigation";

import TrackingModal from "../../TrackingModal";

export default function TrackingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  return (
    <TrackingModal
      isOpen
      pageMode
      campId={campId}
      campName=""
      view="progress"
      onClose={() => router.push("/headteacher/dashboard")}
    />
  );
}
