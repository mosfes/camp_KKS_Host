"use client";

import { useParams, useRouter } from "next/navigation";

import PrePostTestModal from "../../PrePostTestModal";

export default function ScoreComparisonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  return (
    <PrePostTestModal
      isOpen
      pageMode
      campId={campId}
      onClose={() => router.push("/headteacher/dashboard")}
    />
  );
}
