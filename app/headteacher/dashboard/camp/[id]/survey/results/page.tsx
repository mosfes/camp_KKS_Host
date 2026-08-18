"use client";

import { useParams, useRouter } from "next/navigation";

import SurveyResultsModal from "../../../SurveyResultsModal";

export default function SurveyResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);

  const goBack = () => router.push("/headteacher/dashboard");

  return (
    <SurveyResultsModal isOpen pageMode campId={campId} onClose={goBack} />
  );
}
