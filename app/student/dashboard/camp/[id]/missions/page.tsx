"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import { toast } from "react-hot-toast";

// Helper to calculate progress
function calculateProgress(station: any) {
  if (!station.mission || station.mission.length === 0) return 0;

  // Mock logic: assume some are completed for demo or use real data if available
  // Since we don't have mission_result populated yet, we'll return 0 or random for demo?
  // Let's return 0 for now as specified in "Not started" logic
  return 0; // Placeholder
}

function getMissionCount(station: any) {
  return station.mission?.length || 0;
}

export default function StudentMissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [camp, setCamp] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);

  const goToStation = (stationId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(stationId);
    router.push(`/student/dashboard/camp/${id}/missions/${stationId}`);
  };

  const fetchCamp = async () => {
    try {
      const [campRes, studentRes] = await Promise.all([
        fetch("/api/student/camps", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }),
        fetch("/api/auth/student/me")
      ]);

      if (studentRes.ok) {
        setStudent(await studentRes.json());
      }

      if (campRes.ok) {
        const data = await campRes.json();
        const found = data.find((c: any) => c.id === Number(id));

        if (found) {
          if (!found.isRegistered) {
            toast.error("กรุณาลงทะเบียนเข้าร่วมค่ายก่อนเข้าถึงหน้าภารกิจ");
            router.replace(`/student/dashboard/camp/${id}`);

            return;
          }
          // ตรวจสอบว่าค่ายเริ่มแล้วหรือยัง
          if (found.rawStartDate && new Date() < new Date(found.rawStartDate)) {
            toast.error("ค่ายยังไม่เริ่ม ไม่สามารถทำภารกิจได้");
            router.replace(`/student/dashboard/camp/${id}`);

            return;
          }
          setCamp(found);
        } else {
          toast.error("ไม่พบค่าย");
        }
      }
    } catch (error) {
      console.error("Failed to fetch camp", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCamp();
  }, [id]);

  if (loading)
    return (
      <div className="p-8 text-center bg-[#F5F2E9] min-h-screen flex items-center justify-center">
        <div className="text-gray-400 font-bold">กำลังโหลด...</div>
      </div>
    );
  if (!camp)
    return (
      <div className="p-8 text-center bg-[#F5F2E9] min-h-screen flex items-center justify-center">
        <div className="text-gray-400 font-bold">ไม่พบค่าย</div>
      </div>
    );

  // Derived Metrics
  // For demo, let's mock some progress if the user wants to see the UI "in action"
  // But initially it should be 0.
  const totalMissions =
    camp.station?.reduce(
      (acc: number, s: any) => acc + (s.mission?.length || 0),
      0,
    ) || 0;
  const completedOverall =
    camp.station?.reduce((acc: number, s: any) => {
      const stationMissions = s.mission || [];
      const completed = stationMissions.filter((m: any) =>
        camp.missionResults?.some(
          (r: any) =>
            r.mission_mission_id === m.mission_id && r.status === "completed",
        ),
      ).length;

      return acc + completed;
    }, 0) || 0;
  const overallProgress =
    totalMissions > 0
      ? Math.round((completedOverall / totalMissions) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#F5F2E9] pb-12">
      {/* Header */}
      <div className="bg-white px-4 py-6 flex items-center gap-4 border-b border-gray-100/50">
        <Button 
          isIconOnly 
          className="bg-transparent text-gray-400 hover:bg-gray-50 min-w-0 w-8 h-8"
          variant="light" 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#2D3648] leading-tight">ภารกิจค่าย</h1>
          <p className="text-[13px] text-gray-400 font-medium leading-tight line-clamp-2 mt-1">{camp.title}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Overall Progress Card */}
        <div className="bg-[#EEEADF] rounded-2xl p-8">
          <h3 className="text-[#2D3648] font-bold text-lg mb-8">ความคืบหน้าโดยรวม</h3>
          
          <div className="flex justify-between items-end mb-2">
            <div className="text-[56px] font-bold text-[#2D3648] leading-none">
              {overallProgress}%
            </div>
            <div className="text-[15px] font-bold text-gray-500 mb-1">
              {completedOverall}/{totalMissions} ภารกิจ
            </div>
          </div>

          <div className="w-full h-4 bg-gray-300/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5D7C6F] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[#2D3648] font-bold text-lg px-1">เลือกฐานกิจกรรม</h3>

          {/* Stations List */}
          <div className="space-y-4">
            {camp.station?.map((station: any) => {
              const stationMissions = station.mission || [];
              const completedInStation = stationMissions.filter((m: any) =>
                camp.missionResults?.some(
                  (r: any) =>
                    r.mission_mission_id === m.mission_id &&
                    r.status === "completed",
                ),
              ).length;
              const progress =
                stationMissions.length > 0
                  ? Math.round(
                      (completedInStation / stationMissions.length) * 100,
                    )
                  : 0;

              return (
                <div
                  key={station.station_id}
                  className={`bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-gray-200 transition-all duration-300 cursor-pointer flex items-center gap-4 group ${navigatingTo === station.station_id ? "opacity-60 pointer-events-none" : ""}`}
                  onClick={() => goToStation(station.station_id)}
                >
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-[#F0FAF5] flex items-center justify-center shrink-0">
                    <div className="w-10 h-10 rounded-full border-2 border-[#5D7C6F]/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#5D7C6F]/40 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#5D7C6F]" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-[#2D3648] text-lg truncate">
                        {station.name}
                      </h4>
                      <div className="bg-[#EEEADF] text-[#8C8471] text-[13px] font-bold px-3 py-1 rounded-full">
                        {completedInStation}/{stationMissions.length}
                      </div>
                    </div>
                    
                    <p className="text-[14px] text-gray-400 mb-4">
                      {station.description || "ทำภารกิจในฐานนี้ให้สำเร็จ"}
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#5D7C6F] rounded-full transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[13px] font-bold text-gray-400 whitespace-nowrap">
                        {progress}% สำเร็จ
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="text-gray-300 shrink-0" size={24} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
