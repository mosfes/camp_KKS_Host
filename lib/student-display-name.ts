const PREFIX_ALIASES: Record<string, string> = {
  "ด.ช.": "ด.ช.",
  ดช: "ด.ช.",
  เด็กชาย: "ด.ช.",
  "ด.ญ.": "ด.ญ.",
  ดญ: "ด.ญ.",
  เด็กหญิง: "ด.ญ.",
  "น.ส.": "น.ส.",
  นส: "น.ส.",
  นางสาว: "น.ส.",
  นาย: "นาย",
  นาง: "นาง",
};

export function normalizeStudentPrefix(prefix: string | null | undefined) {
  const value = prefix?.trim() || "";

  return PREFIX_ALIASES[value] || value;
}

export function formatStudentName(student: {
  prefix_name?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}) {
  const prefix = normalizeStudentPrefix(student.prefix_name);
  const firstname = student.firstname?.trim() || "";
  const lastname = student.lastname?.trim() || "";

  return `${prefix}${firstname} ${lastname}`.trim();
}
