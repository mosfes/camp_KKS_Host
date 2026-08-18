"use client";

import { useParams, useRouter } from "next/navigation";

import ShirtTrackingModal from "../../ShirtTrackingModal";

export default function ShirtsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  return (
    <ShirtTrackingModal
      campId={campId}
      campName=""
      isOpen
      pageMode
      onClose={() => router.push("/headteacher/dashboard")}
    />
  );
}
