import {
  ChevronLeft,
  User,
  Heart,
  CalendarDays,
  Phone,
  GraduationCap,
  Sparkles,
  Pencil,
  Hash,
  Mail,
  Info,
} from "lucide-react";

import { SectionCard } from "./SectionCard";

export function StudentProfileSkeleton() {
  return (
    <div
      aria-label="กำลังโหลดข้อมูลโปรไฟล์นักเรียน"
      aria-live="polite"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      role="status"
    >
      {/* ── Header / Breadcrumb Skeleton ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-center text-gray-400">
            <ChevronLeft size={20} />
          </div>
          <div className="space-y-1.5">
            <div className="h-6 sm:h-7 w-36 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-3.5 sm:h-4 w-60 sm:w-72 bg-gray-100 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Edit button skeleton */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-200/80 animate-pulse text-transparent text-xs sm:text-sm font-semibold select-none">
          <Pencil size={15} />
          <span>แก้ไขข้อมูล</span>
        </div>
      </div>

      {/* ── Hero Profile Identity Card Skeleton ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#4d6c5f] via-[#5d7c6f] to-[#365f4f] p-6 sm:p-8 text-white shadow-md">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-10 -bottom-16 w-48 h-48 rounded-full bg-black/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar & Identity */}
          <div className="flex items-center gap-4 sm:gap-6">
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
                <div className="h-5 w-20 bg-white/20 rounded-full animate-pulse" />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Mail className="shrink-0 text-white/50" size={13} />
                  <div className="h-3.5 sm:h-4 w-36 sm:w-48 bg-white/20 rounded-md animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="shrink-0 text-white/50" size={13} />
                  <div className="h-3.5 sm:h-4 w-28 bg-white/20 rounded-md animate-pulse" />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Phone className="shrink-0 text-white/50" size={12} />
                <div className="h-3.5 sm:h-4 w-32 bg-white/20 rounded-md animate-pulse" />
              </div>
            </div>
          </div>

          {/* Student ID badge skeleton */}
          <div className="pt-2 sm:pt-0">
            <div className="h-8 w-36 rounded-xl bg-black/15 backdrop-blur-md border border-white/10 animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: ข้อมูลสุขภาพ */}
          <SectionCard
            icon={<Heart size={18} />}
            iconBgColor="bg-[#5d7c6f]/10"
            iconColor="text-[#5d7c6f]"
            subtitle="ข้อมูลโรคประจำตัวและการแพ้อาหารหรือยา"
            title="ข้อมูลสุขภาพ"
          >
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Heart className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    โรคประจำตัว
                  </span>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Heart className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    การแพ้อาหาร / ยา
                  </span>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          </SectionCard>

          {/* Section 2: ข้อมูลส่วนตัว */}
          <SectionCard
            icon={<User size={18} />}
            iconBgColor="bg-[#5d7c6f]/10"
            iconColor="text-[#5d7c6f]"
            subtitle="ชื่อ นามสกุล และชื่อเล่นสำหรับเรียกในค่าย"
            title="ข้อมูลส่วนตัว"
          >
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <User className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    ชื่อ-นามสกุล
                  </span>
                </div>
                <div className="h-4 w-36 bg-gray-200 rounded-md animate-pulse" />
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    ชื่อเล่น
                  </span>
                </div>
                <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" />
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CalendarDays className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    วัน/เดือน/ปีเกิด
                  </span>
                </div>
                <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          </SectionCard>

          {/* Section 3: ข้อมูลติดต่อและฉุกเฉิน */}
          <SectionCard
            icon={<Phone size={18} />}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            subtitle="สำหรับติดต่อสื่อสารและแจ้งเหตุฉุกเฉินระหว่างจัดค่าย"
            title="ข้อมูลติดต่อและเบอร์โทรฉุกเฉิน"
          >
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    เบอร์โทรนักเรียน
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-10 bg-gray-200 rounded-md animate-pulse" />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="text-gray-400 shrink-0" size={15} />
                  <span className="text-xs text-gray-500 font-medium">
                    เบอร์โทรผู้ปกครอง (ฉุกเฉิน)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-16 bg-blue-100 rounded-md animate-pulse" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {/* Section 4: ข้อมูลการเรียน */}
          <SectionCard
            icon={<GraduationCap size={18} />}
            iconBgColor="bg-teal-50"
            iconColor="text-teal-600"
            subtitle="ห้องเรียนและครูประจำชั้น"
            title="ข้อมูลการเรียนและชั้นเรียน"
          >
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">
                    ห้องเรียน
                  </span>
                  <div className="h-5 w-24 bg-emerald-100/80 rounded-full animate-pulse" />
                </div>
                <div className="h-3.5 w-3/4 bg-gray-200/80 rounded animate-pulse" />
              </div>

              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="text-gray-400" size={14} />
                  <span className="text-xs text-gray-500">รหัสนักเรียน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-16 bg-gray-200 rounded-md animate-pulse" />
                  <div className="w-6 h-6 rounded-md bg-gray-200 animate-pulse" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="text-gray-400" size={14} />
                  <span className="text-xs text-gray-500">อีเมลนักเรียน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-32 bg-gray-200 rounded-md animate-pulse" />
                  <div className="w-6 h-6 rounded-md bg-gray-200 animate-pulse" />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2">
                <Info className="text-blue-600 shrink-0 mt-0.5" size={14} />
                <div className="h-3 w-full bg-blue-200/60 rounded animate-pulse" />
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
