"use client";

import { ReactNode } from "react";

import { CopyableBadge } from "./CopyableBadge";

interface InfoItemProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  copyValue?: string;
  subValue?: string;
  badge?: ReactNode;
  className?: string;
}

export function InfoItem({
  label,
  value,
  icon,
  copyValue,
  subValue,
  badge,
  className = "",
}: InfoItemProps) {
  return (
    <div
      className={`py-3.5 px-4 rounded-xl bg-gray-50/70 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors hover:bg-gray-50 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
        {badge}
        <div className="text-sm font-semibold text-gray-800 break-all">
          {value || <span className="text-gray-400 font-normal">ไม่ระบุ</span>}
        </div>
        {subValue && (
          <span className="text-xs text-gray-400 font-normal">
            ({subValue})
          </span>
        )}
        {copyValue && (
          <CopyableBadge iconOnly copyValue={copyValue} label={label} text="" />
        )}
      </div>
    </div>
  );
}
