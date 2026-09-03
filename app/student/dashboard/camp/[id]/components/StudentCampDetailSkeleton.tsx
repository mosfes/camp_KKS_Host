import {
  ChevronLeft,
  FileText,
  Calendar,
  MapPin,
  Users,
  LayoutDashboard,
  Shirt,
  CalendarDays,
  Bus,
  ChevronDown,
} from "lucide-react";

export default function StudentCampDetailSkeleton() {
  return (
    <div
      aria-label="กำลังโหลดรายละเอียดค่าย"
      aria-live="polite"
      className="min-h-screen bg-[#F5F5F3] pb-28 lg:pb-16"
      role="status"
    >
      {/* Cover Image / Hero Skeleton */}
      <div className="h-64 sm:h-80 lg:h-96 bg-gray-300 relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        <div className="absolute top-6 left-6 z-20">
          <div className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-xl border border-white/40 shadow-sm flex items-center justify-center text-gray-500">
            <ChevronLeft size={24} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Main Info Card Skeleton */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 sm:p-8">
              <div className="mb-6 space-y-4">
                {/* Status Badges Skeleton */}
                <div className="flex flex-wrap gap-2">
                  <div className="h-7 w-28 rounded-full bg-emerald-100/70 animate-pulse" />
                  <div className="h-7 w-24 rounded-full bg-gray-200 animate-pulse" />
                </div>

                {/* Title Skeleton */}
                <div className="space-y-2">
                  <div className="h-7 sm:h-8 w-4/5 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-7 sm:h-8 w-2/3 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>

              {/* Description Section Skeleton */}
              <div className="mb-8 space-y-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="text-[#5d7c6f]/60" size={20} />
                  <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2 pl-1">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              {/* Detailed Info Cards (Dates & Location) Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div className="flex items-center gap-3.5 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-xs flex items-center justify-center shrink-0 border border-gray-100 text-[#5d7c6f]">
                    <Calendar size={18} />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="h-2.5 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3.5 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-xs flex items-center justify-center shrink-0 border border-gray-100 text-[#5d7c6f]">
                    <MapPin size={18} />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="h-2.5 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Registration Count & Progress Skeleton */}
              <div className="mt-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <Users className="text-[#5d7c6f]/60" size={16} />
                    <span>จำนวนผู้ลงทะเบียน</span>
                  </div>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full animate-pulse" />
              </div>

              {/* Mobile Quick Links (Schedule & Bus) Skeleton */}
              <div className="lg:hidden mt-6 space-y-3">
                <div className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#5d7c6f]/5 border border-[#5d7c6f]/15">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 bg-[#5d7c6f]/20 rounded-xl flex items-center justify-center shrink-0 text-[#5d7c6f]">
                      <CalendarDays size={18} />
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Progress Section Skeleton */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="text-[#5d7c6f]" size={18} />
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-14 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Shirt Reservation Section Skeleton */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-gray-200/80 space-y-4">
              <div className="flex items-center gap-2.5">
                <Shirt className="text-[#5d7c6f]" size={20} />
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="bg-gray-50/80 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-100 space-y-2">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Desktop Sidebar Column (4 cols) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
            {/* Main Action Box Skeleton */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  การเข้าร่วมค่าย
                </span>
                <div className="h-4 w-20 bg-emerald-100 rounded-full animate-pulse" />
              </div>

              <div className="space-y-3">
                {/* Attendance Button Skeleton */}
                <div className="h-11 w-full rounded-xl bg-gray-200 animate-pulse" />
                {/* Mission Button Skeleton */}
                <div className="h-11 w-full rounded-xl bg-[#5d7c6f]/30 animate-pulse" />
                {/* Survey Button Skeleton */}
                <div className="h-11 w-full rounded-xl bg-gray-200 animate-pulse" />
              </div>
            </div>

            {/* Quick Navigation Cards on Desktop Skeleton */}
            <div className="space-y-3">
              <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#e8f0ee] text-[#3d6357] rounded-xl flex items-center justify-center shrink-0">
                    <CalendarDays size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200/80 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#e8f0ee] text-[#3d6357] rounded-xl flex items-center justify-center shrink-0">
                    <Bus size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Menu Skeleton (Hidden on Desktop) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100/80 bg-white/90 px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-2xl shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="relative max-w-xl mx-auto rounded-2xl border border-gray-100 bg-white p-3 shadow-sm space-y-3">
          {/* Header of mobile menu */}
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e8f0ee] text-[#3d6357] flex items-center justify-center shrink-0">
                <LayoutDashboard size={17} />
              </div>
              <span className="text-sm font-black text-gray-800">
                เมนูการทำค่าย
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#5d7c6f]">
              <span>พับเมนู</span>
              <ChevronDown className="rotate-180" size={18} />
            </div>
          </div>

          {/* Buttons row */}
          <div className="space-y-2.5">
            <div className="h-11 w-full rounded-xl bg-gray-200 animate-pulse" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 rounded-xl bg-[#5d7c6f]/30 animate-pulse" />
              <div className="h-12 rounded-xl bg-[#FFECC9]/80 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
