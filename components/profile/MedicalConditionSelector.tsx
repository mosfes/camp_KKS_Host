"use client";

import { Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

interface MedicalConditionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  noneLabel: string;
  groupLabel: string;
  otherFieldLabel: string;
  otherPlaceholder: string;
  error?: string;
  id?: string;
  className?: string;
}

const NONE_VALUE = "ไม่มี";

const parseValue = (value: string, options: readonly string[]) => {
  const normalized = value.trim();

  if (!normalized || normalized === NONE_VALUE) {
    return {
      hasNone: normalized === NONE_VALUE,
      selected: [] as string[],
      other: "",
    };
  }

  const parts = value.split(/[,，]/).filter((part) => part.trim());
  const selected = options.filter((option) =>
    parts.some((part) => part.trim() === option),
  );
  const other = parts
    .filter((part) => !options.includes(part.trim()))
    .map((part) => part.trimStart())
    .join(", ");

  return { hasNone: false, selected, other };
};

const composeValue = (selected: string[], other: string) => {
  if (!other.trim()) return selected.join(", ");

  return selected.length ? `${selected.join(", ")}, ${other}` : other;
};

export function MedicalConditionSelector({
  value,
  onChange,
  options,
  noneLabel,
  groupLabel,
  otherFieldLabel,
  otherPlaceholder,
  error,
  id,
  className = "",
}: MedicalConditionSelectorProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const otherInputRef = useRef<HTMLInputElement>(null);
  const parsed = parseValue(value, options);
  const [showOther, setShowOther] = useState(Boolean(parsed.other));

  useEffect(() => {
    if (parsed.other) setShowOther(true);
    if (parsed.hasNone) setShowOther(false);
  }, [parsed.hasNone, parsed.other]);

  const chooseNone = () => {
    setShowOther(false);
    onChange(NONE_VALUE);
  };

  const toggleOption = (option: string) => {
    const nextSelected = parsed.selected.includes(option)
      ? parsed.selected.filter((item) => item !== option)
      : [...parsed.selected, option];

    onChange(composeValue(nextSelected, parsed.other));
  };

  const toggleOther = () => {
    if (showOther) {
      setShowOther(false);
      onChange(composeValue(parsed.selected, ""));

      return;
    }

    setShowOther(true);
    if (parsed.hasNone) onChange("");
    window.requestAnimationFrame(() => otherInputRef.current?.focus());
  };

  const optionClass = (selected: boolean) =>
    `flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
      selected
        ? "border-[#5d7c6f] bg-[#5d7c6f]/10 text-[#40594f]"
        : "border-gray-200 bg-white text-gray-700 hover:border-[#5d7c6f]/50 hover:bg-[#5d7c6f]/5"
    }`;

  const checkmark = (selected: boolean) => (
    <span
      aria-hidden="true"
      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
        selected
          ? "border-[#5d7c6f] bg-[#5d7c6f] text-white"
          : "border-gray-300 bg-white"
      }`}
    >
      {selected && <Check size={12} strokeWidth={3} />}
    </span>
  );

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div
        aria-label={groupLabel}
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="group"
      >
        <button
          aria-pressed={parsed.hasNone}
          className={optionClass(parsed.hasNone)}
          id={inputId}
          type="button"
          onClick={chooseNone}
        >
          {checkmark(parsed.hasNone)}
          {noneLabel}
        </button>

        {options.map((option) => {
          const selected = parsed.selected.includes(option);

          return (
            <button
              key={option}
              aria-pressed={selected}
              className={optionClass(selected)}
              type="button"
              onClick={() => toggleOption(option)}
            >
              {checkmark(selected)}
              {option}
            </button>
          );
        })}

        <button
          aria-controls={`${inputId}-other`}
          aria-expanded={showOther}
          aria-pressed={showOther}
          className={optionClass(showOther)}
          type="button"
          onClick={toggleOther}
        >
          {checkmark(showOther)}
          อื่นๆ
        </button>
      </div>

      <p className="text-[11px] text-gray-500">
        เลือกได้มากกว่า 1 อย่าง หากไม่มีในรายการให้เลือก “อื่นๆ”
      </p>

      {showOther && (
        <div className="space-y-1">
          <label
            className="block text-xs font-medium text-gray-700"
            htmlFor={`${inputId}-other`}
          >
            {otherFieldLabel}
          </label>
          <input
            ref={otherInputRef}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-800 outline-none transition-all ${
              error
                ? "border-rose-300 bg-rose-50/40 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                : "border-gray-200 bg-white focus:border-[#5d7c6f] focus:ring-3 focus:ring-[#5d7c6f]/15"
            }`}
            id={`${inputId}-other`}
            maxLength={Math.max(
              1,
              255 -
                composeValue(parsed.selected, "").length -
                (parsed.selected.length ? 2 : 0),
            )}
            placeholder={otherPlaceholder}
            type="text"
            value={parsed.other}
            onChange={(event) =>
              onChange(composeValue(parsed.selected, event.target.value))
            }
          />
        </div>
      )}
    </div>
  );
}
