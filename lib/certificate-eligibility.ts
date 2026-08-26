export function normalizeCertificateMissionPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 100;

  return Math.min(100, Math.max(0, Math.round(percent)));
}

export function getRequiredMissionCount(
  totalMissions: number,
  percent: number,
): number {
  const safeTotal = Math.max(0, Math.floor(totalMissions));
  const safePercent = normalizeCertificateMissionPercent(percent);

  return Math.floor((safeTotal * safePercent) / 100);
}

export function getCertificateEligibility({
  totalMissions,
  completedMissionIds,
  missionPercent,
  requireSurvey,
  hasSurveyResponse,
  hasIssuedCertificate = false,
}: {
  totalMissions: number;
  completedMissionIds: Iterable<number>;
  missionPercent: number;
  requireSurvey: boolean;
  hasSurveyResponse: boolean;
  hasIssuedCertificate?: boolean;
}) {
  const requiredMissions = getRequiredMissionCount(
    totalMissions,
    missionPercent,
  );
  const completedMissions = Math.min(
    Math.max(0, totalMissions),
    new Set(completedMissionIds).size,
  );
  const missionRequirementMet = completedMissions >= requiredMissions;
  const surveyRequirementMet = !requireSurvey || hasSurveyResponse;

  return {
    completedMissions,
    requiredMissions,
    missionRequirementMet,
    surveyRequirementMet,
    eligible:
      hasIssuedCertificate || (missionRequirementMet && surveyRequirementMet),
  };
}
