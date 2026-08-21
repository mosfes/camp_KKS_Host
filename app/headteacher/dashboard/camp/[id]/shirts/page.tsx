"use client";

import { useParams, useRouter } from "next/navigation";

import ShirtTrackingModal from "../../ShirtTrackingModal";

export default function ShirtsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  return (
    <ShirtTrackingModal
      isOpen
      pageMode
      campId={campId}
      campName=""
      onClose={() => router.push("/headteacher/dashboard")}
    />
  );
}
