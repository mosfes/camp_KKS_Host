"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { ArrowLeft, Plus, Target } from "lucide-react";

import CreateBaseModal from "../../CreateBaseModal";

export default function BasesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);
  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCamp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/camps/${campId}?view=bases`);
      if (response.ok) setCamp(await response.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCamp();
  }, [campId]);

  return (
    <div className="min-h-screen bg-[#f5f5f2] px-4 pb-24 pt-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900"
          onClick={() => router.push("/headteacher/dashboard")}
          type="button"
        >
          <ArrowLeft size={14} /> กลับไปยังหน้าหลัก
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-2">
            <Target className="shrink-0 text-[#6b857a]" size={20} />
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">
                ฐานกิจกรรม
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                จัดการฐานกิจกรรมและภารกิจของค่าย
              </p>
            </div>
          </div>

          {camp?.isOwner && (
            <Button
              className="w-fit bg-[#6b857a] font-medium text-white"
              startContent={<Plus size={18} />}
              onPress={() => setIsCreateOpen(true)}
            >
              สร้างฐานกิจกรรม
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6b857a] border-t-transparent" />
          </div>
        ) : camp?.station?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {camp.station.map((station: any) => (
              <button
                key={station.station_id}
                className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-[#6b857a] hover:bg-[#f0f4f2]"
                onClick={() =>
                  router.push(
                    `/headteacher/dashboard/camp/${campId}/base/${station.station_id}`,
                  )
                }
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0f4f2] text-[#6b857a]">
                  <Target size={24} />
                </div>
                <h2 className="font-semibold text-gray-900">{station.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {station.description || "ไม่มีคำอธิบาย"}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white py-24 text-center shadow-sm">
            <Target className="mx-auto mb-4 text-gray-300" size={42} />
            <p className="text-gray-500">ยังไม่ได้สร้างฐานกิจกรรม</p>
          </div>
        )}
      </div>

      <CreateBaseModal
        campId={campId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
