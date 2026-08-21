"use client";

import { ReactNode } from "react";

interface SectionCardProps {
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  icon,
  iconBgColor = "bg-[#5d7c6f]/10",
  iconColor = "text-[#5d7c6f]",
  title,
  subtitle,
  badge,
  action,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor}`}
          >
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
