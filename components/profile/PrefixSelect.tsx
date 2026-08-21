"use client";

import { useState, useId } from "react";

interface PrefixSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
}

const DEFAULT_TEACHER_PREFIXES = [
  "นาย",
  "นาง",
  "นางสาว",
  "ครู",
  "อาจารย์",
  "ว่าที่ ร.ต.",
  "ดร.",
];

export function PrefixSelect({
  label = "คำนำหน้า",
  value,
  onChange,
  options = DEFAULT_TEACHER_PREFIXES,
  placeholder = "เลือกหรือพิมพ์คำนำหน้า",
  disabled = false,
}: PrefixSelectProps) {
  const inputId = useId();
  const [isCustom, setIsCustom] = useState(
    () => !!value && !options.includes(value),
  );

  const handleSelectOption = (option: string) => {
    setIsCustom(false);
    onChange(option);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
  };

  return (
    <div className="space-y-1.5">
      <span className="block text-xs font-semibold text-gray-700">{label}</span>

      {/* Quick Select Pill Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = value === opt && !isCustom;

          return (
            <button
              key={opt}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#5d7c6f] text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200/60"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={disabled}
              type="button"
              onClick={() => handleSelectOption(opt)}
            >
              {opt}
            </button>
          );
        })}
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isCustom
              ? "bg-[#5d7c6f] text-white shadow-xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-dashed border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={disabled}
          type="button"
          onClick={handleCustomClick}
        >
          อื่นๆ...
        </button>
      </div>

      {/* Custom input if chosen or if value doesn't match standard list */}
      {isCustom && (
        <div className="pt-1">
          <input
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-[#5d7c6f] focus:ring-3 focus:ring-[#5d7c6f]/15 transition-all"
            disabled={disabled}
            id={inputId}
            placeholder={placeholder}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
