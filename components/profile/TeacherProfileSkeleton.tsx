import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  Shield,
  Lock,
  Pencil,
  Sparkles,
} from "lucide-react";

import { SectionCard } from "./SectionCard";

interface TeacherProfileSkeletonProps {
  backLabel?: string;
}

export function TeacherProfileSkeleton({
  backLabel = "กลับสู่ระบบ",
}: TeacherProfileSkeletonProps) {
  return (
    <div
      aria-label="กำลังโหลดข้อมูลโปรไฟล์"
      aria-live="polite"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      role="status"
    >
      {/* ── Top Bar / Breadcrumb ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-center text-gray-400"
            title={backLabel}
          >
            <ChevronLeft size={20} />
          </div>
          <div className="space-y-1.5">
            <div className="h-6 sm:h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-3.5 sm:h-4 w-52 sm:w-64 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Quick Edit Button Skeleton */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-200/80 animate-pulse text-transparent text-xs sm:text-sm font-semibold select-none">
          <Pencil size={15} />
          <span>แก้ไขข้อมูล</span>
        </div>
      </div>

      {/* ── Hero Profile Identity Card Skeleton ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4d6c5f] via-[#5d7c6f] to-[#365f4f] p-6 sm:p-8 text-white shadow-md">
        {/* Background decorative geometry */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-10 -bottom-16 w-48 h-48 rounded-full bg-black/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar & Identity Skeleton */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-inner shrink-0">
                <Sparkles className="text-white/60 animate-pulse" size={28} />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400/70 border-2 border-[#5d7c6f] shadow-xs flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="h-6 sm:h-7 w-44 sm:w-56 bg-white/25 rounded-lg animate-pulse" />
                <div className="h-6 w-32 bg-white/20 rounded-full animate-pulse" />
              </div>

              <div className="flex items-center gap-2">
                <Mail className="shrink-0 text-white/50" size={14} />
                <div className="h-3.5 sm:h-4 w-44 sm:w-56 bg-white/20 rounded-md animate-pulse" />
              </div>

              <div className="flex items-center gap-2">
                <Phone className="shrink-0 text-white/50" size={14} />
                <div className="h-3.5 sm:h-4 w-32 sm:w-40 bg-white/20 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: ข้อมูลส่วนตัว Skeleton */}
          <SectionCard
            icon={<User size={18} />}
            iconBgColor="bg-[#5d7c6f]/10"
            iconColor="text-[#5d7c6f]"
            subtitle="ชื่อ นามสกุล และคำนำหน้าชื่อ"
            title="ข้อมูลส่วนตัว"
          >
            <div className="space-y-3">
              {/* คำนำหน้าชื่อ */}
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <User className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    คำนำหน้าชื่อ
                  </span>
                </div>
                <div className="h-4 w-14 bg-gray-200 rounded-md animate-pulse" />
              </div>

              {/* ชื่อจริง */}
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <User className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    ชื่อจริง
                  </span>
                </div>
                <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse" />
              </div>

              {/* นามสกุล */}
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <User className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    นามสกุล
                  </span>
                </div>
                <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          </SectionCard>

          {/* Section 2: ข้อมูลติดต่อ Skeleton */}
          <SectionCard
            icon={<Phone size={18} />}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            subtitle="ช่องทางติดต่อสำหรับการทำงานและประสานงานค่าย"
            title="ข้อมูลติดต่อ"
          >
            <div className="space-y-3">
              {/* เบอร์โทรศัพท์ */}
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    เบอร์โทรศัพท์
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-10 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>

              {/* อีเมลติดต่อ */}
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    อีเมลติดต่อ
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-44 bg-gray-200 rounded-md animate-pulse" />
                  <div className="w-7 h-7 rounded-lg bg-gray-200 animate-pulse" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Section 3: สิทธิ์และความปลอดภัย Skeleton */}
          <SectionCard
            icon={<Shield size={18} />}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            subtitle="ข้อมูลบัญชีผู้ใช้งานในระบบ"
            title="สิทธิ์และความปลอดภัย"
          >
            <div className="space-y-4">
              {/* Role Box Skeleton */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    สิทธิ์การใช้งาน (Role)
                  </span>
                  <div className="h-5 w-16 rounded-full bg-purple-100/80 animate-pulse" />
                </div>
                <div className="h-3.5 w-full bg-gray-200/80 rounded animate-pulse" />
              </div>

              {/* Email login Box Skeleton */}
              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="text-gray-400" size={14} />
                  <span className="text-xs text-gray-500">อีเมลล็อกอิน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-32 bg-gray-200 rounded-md animate-pulse" />
                  <div className="w-6 h-6 rounded-md bg-gray-200 animate-pulse" />
                </div>
              </div>

              {/* Readonly info notice Skeleton */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2.5">
                <Lock className="text-amber-600 shrink-0 mt-0.5" size={14} />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-full bg-amber-200/60 rounded animate-pulse" />
                  <div className="h-3 w-4/5 bg-amber-200/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
