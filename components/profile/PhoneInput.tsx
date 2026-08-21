"use client";

import { Phone, AlertCircle, CheckCircle2, X } from "lucide-react";

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

// Formats a raw 10-digit phone string to 0XX-XXX-XXXX
export function formatPhoneNumber(digits: string): string {
  const clean = digits.replace(/\D/g, "").slice(0, 10);

  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;

  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
}

export function PhoneInput({
  label,
  value,
  onChange,
  placeholder = "08X-XXX-XXXX",
  error,
  helperText,
  required = false,
  disabled = false,
}: PhoneInputProps) {
  const rawDigits = (value || "").replace(/\D/g, "");
  const formattedValue = formatPhoneNumber(rawDigits);
  const isValidLength = rawDigits.length === 10;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digitsOnly = input.replace(/\D/g, "").slice(0, 10);

    onChange(digitsOnly);
  };

  const handleClear = () => {
    if (!disabled) {
      onChange("");
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {rawDigits.length > 0 && !disabled && (
          <span
            className={`text-[11px] font-mono ${
              isValidLength ? "text-emerald-600 font-medium" : "text-amber-600"
            }`}
          >
            {rawDigits.length}/10 หลัก
          </span>
        )}
      </div>

      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-gray-400 pointer-events-none">
          <Phone size={15} />
        </span>

        <input
          autoComplete="tel"
          className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-mono tracking-wide transition-all outline-none ${
            disabled
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : error
                ? "bg-rose-50/50 border-rose-300 text-gray-800 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/15"
                : isValidLength
                  ? "bg-emerald-50/20 border-emerald-300 text-gray-800 focus:border-[#5d7c6f] focus:ring-3 focus:ring-[#5d7c6f]/15"
                  : "bg-white border-gray-200 text-gray-800 focus:border-[#5d7c6f] focus:ring-3 focus:ring-[#5d7c6f]/15"
          }`}
          disabled={disabled}
          inputMode="numeric"
          placeholder={placeholder}
          type="tel"
          value={formattedValue}
          onChange={handleChange}
        />

        <div className="absolute right-3 flex items-center gap-1">
          {rawDigits.length > 0 && !disabled && (
            <button
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="ล้างข้อความ"
              type="button"
              onClick={handleClear}
            >
              <X size={13} />
            </button>
          )}
          {isValidLength && !error && (
            <CheckCircle2 className="text-emerald-500" size={16} />
          )}
        </div>
      </div>

      {error ? (
        <p className="text-rose-600 text-xs flex items-center gap-1 mt-1">
          <AlertCircle className="shrink-0" size={12} />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-gray-400 text-[11px]">{helperText}</p>
      ) : null}
    </div>
  );
}
