"use client";

import { MedicalConditionSelector } from "./MedicalConditionSelector";

const COMMON_FOOD_ALLERGIES = [
  "อาหารทะเล",
  "ถั่วลิสง",
  "นมวัว",
  "ไข่ไก่",
] as const;

interface FoodAllergySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  id?: string;
  className?: string;
}

export function FoodAllergySelector(props: FoodAllergySelectorProps) {
  return (
    <MedicalConditionSelector
      {...props}
      groupLabel="เลือกข้อมูลการแพ้อาหาร เลือกได้หลายอย่าง"
      noneLabel="ไม่แพ้อาหาร"
      options={COMMON_FOOD_ALLERGIES}
      otherFieldLabel="ระบุอาหารที่แพ้เพิ่มเติม"
      otherPlaceholder="เช่น กุ้ง ปู หรืออาหารชนิดอื่น"
    />
  );
}
