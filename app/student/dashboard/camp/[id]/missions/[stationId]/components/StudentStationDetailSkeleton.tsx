import { ChevronLeft } from "lucide-react";

export default function StudentStationDetailSkeleton() {
  return (
    <div
      aria-label="กำลังโหลดภารกิจในฐาน"
      aria-live="polite"
      className="min-h-screen bg-[#f5f5f2] pb-12"
      role="status"
    >
      {/* Station Header Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center gap-4">
          <div className="w-8 h-8 flex items-center justify-center text-gray-400">
            <ChevronLeft size={24} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-6 sm:h-7 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3.5 sm:h-4 w-36 sm:w-48 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        {/* Mission Cards Skeleton */}
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl border-2 border-transparent shadow-sm flex items-center gap-4"
          >
            {/* Circle Status Icon Skeleton */}
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <div className="w-7 h-7 rounded-full border-2 border-gray-200 animate-pulse" />
            </div>

            {/* Mission Content Skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
