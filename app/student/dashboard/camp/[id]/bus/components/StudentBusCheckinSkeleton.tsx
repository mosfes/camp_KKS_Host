import {
  ChevronLeft,
  RefreshCw,
  Bus,
  MapPin,
  LogOut,
  LayoutGrid,
} from "lucide-react";

export default function StudentBusCheckinSkeleton() {
  return (
    <div
      aria-label="กำลังโหลดข้อมูลรถ"
      aria-live="polite"
      className="min-h-screen bg-[#f5f5f2] pb-12"
      role="status"
    >
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-gray-400">
            <ChevronLeft size={24} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3.5 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-8 h-8 flex items-center justify-center text-[#5d7c6f]">
            <RefreshCw size={18} />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Hero Card Skeleton */}
        <section className="rounded-3xl bg-[#5d7c6f] p-6 text-white shadow-lg shadow-[#5d7c6f]/20 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/15 flex items-center justify-center animate-pulse">
              <Bus className="text-white/70" size={30} />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-16 bg-white/40 rounded animate-pulse" />
              <div className="h-6 w-48 sm:w-60 bg-white/30 rounded-lg animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-full bg-white/20 animate-pulse shrink-0" />
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <MapPin size={16} />
            <div className="h-4 w-28 bg-white/30 rounded animate-pulse" />
          </div>
        </section>

        {/* Action Bar Skeleton */}
        <section className="rounded-2xl border border-[#d8e5de] bg-[#f7faf8]/95 p-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e2eee7] text-[#365f4f]">
                <LogOut size={18} />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="h-3.5 w-16 bg-gray-300 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-9 w-24 rounded-xl bg-amber-100/80 animate-pulse shrink-0" />
          </div>
        </section>

        {/* Seat Card Skeleton */}
        <section className="rounded-3xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#e8f0ee] text-[#5d7c6f] flex items-center justify-center shrink-0">
              <MapPin size={22} />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-48 bg-gray-300/80 rounded animate-pulse" />
            </div>
          </div>
        </section>

        {/* Bus Seating Layout Skeleton */}
        <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f0ee] text-[#5d7c6f] shrink-0">
              <LayoutGrid size={22} />
            </div>
            <div className="h-4 w-28 bg-gray-300 rounded animate-pulse" />
          </div>

          <div className="mx-auto max-w-md rounded-2xl border border-[#d8e5de] bg-[#f7faf8] p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-16 bg-[#365f4f]/30 rounded animate-pulse" />
              <div className="h-3.5 w-20 bg-[#365f4f]/30 rounded animate-pulse" />
            </div>

            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((rowIndex) => (
                <div
                  key={rowIndex}
                  className="grid grid-cols-[1fr_1fr_0.3fr_1fr_1fr] gap-1"
                >
                  <div className="h-9 rounded-lg border border-gray-200 bg-white animate-pulse" />
                  <div className="h-9 rounded-lg border border-gray-200 bg-white animate-pulse" />
                  <div />
                  <div className="h-9 rounded-lg border border-gray-200 bg-white animate-pulse" />
                  <div className="h-9 rounded-lg border border-gray-200 bg-white animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
