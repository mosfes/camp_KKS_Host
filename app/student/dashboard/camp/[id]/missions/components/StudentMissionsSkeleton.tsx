import { ChevronLeft, ChevronRight } from "lucide-react";

export default function StudentMissionsSkeleton() {
  return (
    <div
      aria-label="กำลังโหลดภารกิจค่าย"
      aria-live="polite"
      className="min-h-screen bg-[#f5f5f2] pb-12"
      role="status"
    >
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center text-gray-400">
            <ChevronLeft size={24} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-6 sm:h-7 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-3.5 sm:h-4 w-40 sm:w-56 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Overall Progress Card Skeleton */}
        <div className="bg-[#EEEADF] rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="h-6 w-44 bg-[#2D3648]/20 rounded animate-pulse" />
            <div className="h-7 w-32 bg-white/60 rounded-full animate-pulse" />
          </div>

          <div className="flex justify-between items-end mb-2.5">
            <div className="h-10 sm:h-12 w-20 bg-[#2D3648]/20 rounded-lg animate-pulse" />
          </div>

          <div className="w-full h-3.5 bg-gray-300/50 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-[#5D7C6F]/40 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-5 w-36 bg-gray-300/70 rounded animate-pulse px-1" />

          {/* Stations Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((index) => (
              <div
                key={index}
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-200/80 flex items-center gap-4"
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-[#F0FAF5] flex items-center justify-center shrink-0 border border-[#5D7C6F]/15 animate-pulse">
                  <div className="w-8 h-8 rounded-full border-2 border-[#5D7C6F]/20 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#5D7C6F]/30" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4.5 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3.5 w-44 bg-gray-200 rounded animate-pulse" />

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" />
                    <div className="h-3.5 w-14 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>

                <ChevronRight className="text-gray-200 shrink-0" size={24} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
