import { notFound } from "next/navigation";

import StudentMissionDetailPage from "../../../StudentMissionDetailPage";

export default async function StudentTrackingDetailRoute({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;
  const campId = Number(id);
  const parsedStudentId = Number(studentId);

  if (
    !Number.isInteger(campId) ||
    campId <= 0 ||
    !Number.isInteger(parsedStudentId) ||
    parsedStudentId <= 0
  ) {
    notFound();
  }

  return (
    <StudentMissionDetailPage campId={campId} studentId={parsedStudentId} />
  );
}
