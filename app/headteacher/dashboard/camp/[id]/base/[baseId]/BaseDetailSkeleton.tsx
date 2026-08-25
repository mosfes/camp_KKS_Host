export function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
    />
  );
}

export default function BaseDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="กำลังโหลดข้อมูลฐานกิจกรรม"
      className="min-h-screen bg-[#f5f5f2]"
      role="status"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Base Title & Description Skeleton */}
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-2">
            <SkeletonBlock className="h-7 w-48 rounded-lg" />
            <SkeletonBlock className="h-4 w-72 rounded-md" />
          </div>
        </div>

        {/* Missions Section Skeleton */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-6 w-6 rounded-md" />
              <SkeletonBlock className="h-6 w-20 rounded-md" />
            </div>
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
          </div>

          {/* Mission Cards Skeleton */}
          <div className="space-y-4">
            {/* Card 1: Photo submission skeleton */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-2 space-y-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <SkeletonBlock className="h-5 w-44 rounded-md" />
                  <SkeletonBlock className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex gap-1 shrink-0">
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                </div>
              </div>
              <SkeletonBlock className="h-4 w-60 rounded" />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <SkeletonBlock className="h-6 w-32 rounded-full" />
              </div>
              <div className="mt-2 bg-[#6b857a]/5 p-2.5 rounded-lg border border-[#6b857a]/10 w-full">
                <SkeletonBlock className="h-4 w-1/3 rounded" />
              </div>
            </div>

            {/* Card 2: Video submission skeleton */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-2 space-y-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <SkeletonBlock className="h-5 w-52 rounded-md" />
                  <SkeletonBlock className="h-5 w-28 rounded-full" />
                </div>
                <div className="flex gap-1 shrink-0">
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                </div>
              </div>
              <SkeletonBlock className="h-4 w-72 rounded" />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <SkeletonBlock className="h-6 w-32 rounded-full" />
              </div>
            </div>

            {/* Card 3: Multiple choice quiz skeleton */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-2 space-y-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <SkeletonBlock className="h-5 w-36 rounded-md" />
                  <SkeletonBlock className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex gap-1 shrink-0">
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                  <SkeletonBlock className="h-8 w-8 rounded-lg" />
                </div>
              </div>
              <SkeletonBlock className="h-4 w-48 rounded" />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <SkeletonBlock className="h-6 w-32 rounded-full" />
              </div>
              <div className="mt-2 space-y-1.5 w-full">
                <div className="bg-[#6b857a]/5 p-2.5 rounded-lg border border-[#6b857a]/10 w-full">
                  <SkeletonBlock className="h-4 w-1/4 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
