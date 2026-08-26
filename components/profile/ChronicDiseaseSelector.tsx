"use client";

import { MedicalConditionSelector } from "./MedicalConditionSelector";

const COMMON_CHRONIC_DISEASES = [
  "โรคหอบหืด",
  "โรคภูมิแพ้",
  "โรคลมชัก",
  "โรคโลหิตจาง (G6PD)",
] as const;

interface ChronicDiseaseSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  className?: string;
}

export function ChronicDiseaseSelector(props: ChronicDiseaseSelectorProps) {
  return (
    <MedicalConditionSelector
      {...props}
      groupLabel="เลือกข้อมูลโรคประจำตัว เลือกได้หลายอย่าง"
      noneLabel="ไม่มีโรคประจำตัว"
      options={COMMON_CHRONIC_DISEASES}
      otherFieldLabel="ระบุโรคประจำตัวเพิ่มเติม"
      otherPlaceholder="เช่น เบาหวาน โรคหัวใจ หรือโรคอื่น"
    />
  );
}
