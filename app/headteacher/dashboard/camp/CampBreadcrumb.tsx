"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface CampBreadcrumbProps {
  campId?: number | string;
  campName?: string | null;
  currentPage?: string;
  items?: BreadcrumbItem[];
  className?: string;
}

export default function CampBreadcrumb({
  className = "",
}: CampBreadcrumbProps) {
  const router = useRouter();

  return (
    <button
      aria-label="กลับหน้าค่ายที่เกี่ยวข้อง"
      className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-gray-600 transition-colors hover:text-[#5d7c6f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b857a] ${className}`}
      type="button"
      onClick={() => router.push("/headteacher/dashboard?tab=camp")}
    >
      <ArrowLeft size={14} />
      <span>กลับหน้าหลัก</span>
    </button>
  );
}
