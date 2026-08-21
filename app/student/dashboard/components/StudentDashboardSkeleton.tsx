import { Sparkles, Bus, MapPin, Calendar } from "lucide-react";

export default function StudentDashboardSkeleton() {
  return (
    <div
      aria-label="กำลังโหลดข้อมูลหน้าหลัก"
      aria-live="polite"
      className="min-h-screen bg-[#f5f5f2]"
      role="status"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Greeting Card Skeleton */}
        <div className="relative bg-gradient-to-br from-[#5d7c6f] via-[#4d6a5f] to-[#365045] rounded-3xl p-6 sm:p-8 text-white shadow-lg overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
                  <Sparkles className="text-white/70 animate-pulse" size={24} />
                </div>
                <div className="space-y-2">
                  <div className="h-7 sm:h-8 w-44 sm:w-56 bg-white/25 rounded-lg animate-pulse" />
                  <div className="h-3.5 sm:h-4 w-48 sm:w-64 bg-white/20 rounded-md animate-pulse" />
                </div>
              </div>

              {/* Student Info Badges Skeleton */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="h-8 w-32 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 animate-pulse" />
                <div className="h-8 w-24 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 animate-pulse" />
                <div className="h-8 w-36 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 animate-pulse" />
              </div>
            </div>

            {/* Quick Status Stats on Desktop Skeleton */}
            <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shrink-0">
              <div className="text-center px-3 border-r border-white/20 space-y-1">
                <div className="h-7 w-8 bg-white/25 rounded-md mx-auto animate-pulse" />
                <div className="h-3 w-12 bg-white/20 rounded mx-auto animate-pulse" />
              </div>
              <div className="text-center px-3 border-r border-white/20 space-y-1">
                <div className="h-7 w-8 bg-white/25 rounded-md mx-auto animate-pulse" />
                <div className="h-3 w-14 bg-white/20 rounded mx-auto animate-pulse" />
              </div>
              <div className="text-center px-3 space-y-1">
                <div className="h-7 w-8 bg-white/25 rounded-md mx-auto animate-pulse" />
                <div className="h-3 w-12 bg-white/20 rounded mx-auto animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Transportation Section Skeleton */}
        <section aria-label="กำลังโหลดการเดินทาง" className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ee] text-[#3d6357]">
                <Bus size={18} />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-gray-300/80 rounded animate-pulse" />
                <div className="h-3 w-56 sm:w-72 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-9 rounded-xl bg-gray-200/70 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs">
              {/* Top Row: Camp & Bus Info + Status Badges */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="space-y-2 min-w-0">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-44 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-6 w-14 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-6 w-28 rounded-full bg-gray-200 animate-pulse" />
                </div>
              </div>

              {/* Bottom Row: Seat Info + Primary Action Button */}
              <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#e8f0ee] text-[#3d6357] flex items-center justify-center shrink-0">
                    <Bus size={16} />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="h-2.5 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-10 w-28 rounded-xl bg-gray-200 animate-pulse shrink-0" />
              </div>
            </div>
          </div>
        </section>

        {/* Camp Tabs & Grid Section Skeleton */}
        <div className="space-y-4">
          {/* Tabs Header Skeleton */}
          <div className="flex items-center gap-6 border-b border-gray-200/80 h-12 px-1">
            <div className="flex items-center gap-2 pb-3.5 border-b-2 border-[#5d7c6f] -mb-[1px]">
              <div className="h-4 w-28 bg-[#5d7c6f]/30 rounded animate-pulse" />
              <div className="h-4 w-5 rounded-full bg-[#5d7c6f]/20 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 pb-3.5">
              <div className="h-4 w-20 bg-gray-300/70 rounded animate-pulse" />
              <div className="h-4 w-5 rounded-full bg-gray-200 animate-pulse" />
            </div>
            <div className="pb-3.5">
              <div className="h-4 w-16 bg-gray-300/70 rounded animate-pulse" />
            </div>
          </div>

          {/* Camp Cards Grid Skeleton */}
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="border border-gray-200/70 shadow-sm bg-white rounded-2xl overflow-hidden flex flex-col h-full"
              >
                {/* Cover Image Skeleton */}
                <div className="w-full aspect-[16/9] bg-gray-200 relative animate-pulse">
                  <div className="absolute top-3 right-3 h-5 w-20 rounded-full bg-gray-300/80 animate-pulse" />
                </div>

                {/* Card Body Skeleton */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3 justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1.5 min-h-[2.75rem]">
                      <div className="h-4.5 w-11/12 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4.5 w-3/4 bg-gray-200 rounded animate-pulse" />
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#5d7c6f]/10 flex items-center justify-center shrink-0">
                          <MapPin className="text-[#5d7c6f]/40" size={12} />
                        </div>
                        <div className="h-3.5 w-3/5 bg-gray-200 rounded animate-pulse" />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#5d7c6f]/10 flex items-center justify-center shrink-0">
                          <Calendar className="text-[#5d7c6f]/40" size={12} />
                        </div>
                        <div className="h-3.5 w-1/2 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 mt-auto">
                    <div className="w-full h-10 rounded-xl bg-gray-200 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
