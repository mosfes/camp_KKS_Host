"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableBadgeProps {
  text: string;
  copyValue?: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}

export function CopyableBadge({
  text,
  copyValue,
  label,
  className = "",
  iconOnly = false,
}: CopyableBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const toCopy = copyValue || text;

    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");

      textarea.value = toCopy;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer active:scale-95 ${
        copied
          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
          : "bg-gray-100/90 text-gray-700 hover:bg-gray-200 border border-gray-200/80"
      } ${className}`}
      title={copied ? "คัดลอกแล้ว!" : `คัดลอก${label ? ` ${label}` : ""}`}
      type="button"
      onClick={handleCopy}
    >
      {!iconOnly && <span>{text}</span>}
      {copied ? (
        <Check className="text-emerald-600 shrink-0" size={13} />
      ) : (
        <Copy
          className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0"
          size={13}
        />
      )}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap pointer-events-none z-20">
          คัดลอกแล้ว!
        </span>
      )}
    </button>
  );
}
