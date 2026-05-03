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
  const [loading, setLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);

  const goToStation = (stationId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(stationId);
    router.push(`/student/dashboard/camp/${id}/missions/${stationId}`);
  };

  const fetchCamp = async () => {
    try {
      const res = await fetch("/api/student/camps", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (res.ok) {
        const data = await res.json();
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
    fetchCamp();
  }, [id]);

  if (loading)
    return (
      <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">
        กำลังโหลด...
      </div>
    );
  if (!camp)
    return (
      <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">ไม่พบค่าย</div>
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
    <div className="min-h-screen bg-[#FBF9F4] pb-12">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-50 border-b border-gray-100">
        <Button 
          isIconOnly 
          className="bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          variant="flat" 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-black text-gray-900 tracking-tight">ภารกิจค่าย</h1>
          <p className="text-xs text-gray-500 font-medium truncate opacity-70">{camp.title}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Overall Progress Card - Premium Glassmorphism */}
        <div className="relative bg-gradient-to-br from-[#5d7c6f] to-[#4a6358] rounded-[2.5rem] p-7 text-white shadow-2xl shadow-[#5d7c6f]/30 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6 opacity-90 uppercase tracking-[0.2em] text-[10px] font-black">
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                <Target size={8} />
              </div>
              ความคืบหน้าโดยรวม
            </div>

            <div className="flex justify-between items-baseline mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-6xl font-black tracking-tighter leading-none">
                  {overallProgress}
                </span>
                <span className="text-2xl font-bold opacity-60">%</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black leading-none mb-1">{completedOverall}</p>
                <p className="text-[10px] font-bold opacity-60 uppercase">จาก {totalMissions} ภารกิจ</p>
              </div>
            </div>

            <div className="relative w-full h-3 bg-black/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 shadow-inner">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-white/60 to-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-5 px-1">
            <h3 className="text-gray-900 font-black text-lg tracking-tight uppercase">ฐานกิจกรรม</h3>
            <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
              {camp.station?.length || 0} ฐาน
            </span>
          </div>

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
              const completed = completedInStation;

              return (
                <div
                  key={station.station_id}
                  className={`bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#5d7c6f]/30 transition-all duration-300 cursor-pointer group relative overflow-hidden ${navigatingTo === station.station_id ? "scale-[0.98] opacity-60 pointer-events-none" : ""}`}
                  onClick={() => goToStation(station.station_id)}
                >
                  {/* Background Decoration */}
                  <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-gray-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 pointer-events-none opacity-50" />
                  
                  {navigatingTo === station.station_id && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 backdrop-blur-sm rounded-[2rem]">
                      <div className="w-8 h-8 border-3 border-[#5d7c6f] border-t-transparent rounded-full animate-spin shadow-lg" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${progress === 100 ? "bg-green-100 shadow-green-100/50" : "bg-gray-50 group-hover:bg-[#5d7c6f] group-hover:shadow-[#5d7c6f]/20 shadow-lg"}`}>
                      <Target className={`transition-colors duration-300 ${progress === 100 ? "text-green-600" : "text-[#5d7c6f] group-hover:text-white"}`} size={28} strokeWidth={2.5} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-black text-gray-900 group-hover:text-[#5d7c6f] transition-colors truncate">
                          {station.name}
                        </h4>
                        {progress === 100 && (
                          <div className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                            สำเร็จแล้ว
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate">
                          {station.description || "เริ่มทำภารกิจในฐานนี้"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 bg-gray-50/50 p-2 px-3 rounded-xl border border-gray-100">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-[#5d7c6f] shadow-[0_0_8px_rgba(93,124,111,0.4)]"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-black min-w-[50px] text-right ${progress === 100 ? "text-green-600" : "text-gray-500"}`}>
                          {completed}/{stationMissions.length} เสร็จ
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-all group-hover:bg-[#5d7c6f]/10">
                      <ChevronRight className="text-gray-300 group-hover:text-[#5d7c6f]" size={20} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
