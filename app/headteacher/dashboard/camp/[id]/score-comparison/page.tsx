"use client";

import { useParams, useRouter } from "next/navigation";

import PrePostTestModal from "../../PrePostTestModal";

export default function ScoreComparisonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  return (
    <PrePostTestModal
      campId={campId}
      isOpen
      pageMode
      onClose={() => router.push("/headteacher/dashboard")}
    />
  );
}
