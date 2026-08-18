"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import CreateSurveyModal from "../../CreateSurveyModal";
import SurveyResultsModal from "../../SurveyResultsModal";

export default function SurveyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);
  const [survey, setSurvey] = useState<any>(null);
  const [teacherId, setTeacherId] = useState(0);
  const [isEditSurveyModalOpen, setIsEditSurveyModalOpen] = useState(false);
  const [surveyVersion, setSurveyVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(`/api/surveys?campId=${campId}`).then((response) =>
        response.ok ? response.json() : null,
      ),
      fetch(`/api/camps/${campId}?view=survey`).then((response) =>
        response.ok ? response.json() : null,
      ),
    ])
      .then(([surveyData, campData]) => {
        if (cancelled) return;
        setSurvey(surveyData && !surveyData.error ? surveyData : null);
        setTeacherId(campData?.created_by_teacher_id ?? 0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [campId, surveyVersion]);

  const goBack = () => router.push("/headteacher/dashboard");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f2]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6b857a] border-t-transparent" />
      </div>
    );
  }

  if (survey) {
    return (
      <>
        <SurveyResultsModal
          key={surveyVersion}
          campId={campId}
          isOpen
          pageMode
          onClose={goBack}
          onEdit={() => setIsEditSurveyModalOpen(true)}
        />
        <CreateSurveyModal
          campId={campId}
          initialData={survey}
          isOpen={isEditSurveyModalOpen}
          teacherId={teacherId}
          onClose={() => setIsEditSurveyModalOpen(false)}
          onSurveyCreated={() => {
            setIsEditSurveyModalOpen(false);
            setSurveyVersion((version) => version + 1);
          }}
        />
      </>
    );
  }

  return (
    <CreateSurveyModal
      campId={campId}
      isOpen
      pageMode
      teacherId={teacherId}
      onClose={goBack}
      onSurveyCreated={goBack}
    />
  );
}
