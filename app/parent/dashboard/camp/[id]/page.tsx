"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { ChevronLeft, Target, CheckCircle2, Circle } from "lucide-react";
import { ParentNavbar } from "@/components/ParentNavbar";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Mission {
  mission_id: number;
  title: string;
  type: string;
}

interface Station {
  station_id: number;
  name: string;
  description: string | null;
  mission: Mission[];
}

interface MissionResult {
  status: string;
  mission: {
    mission_id: number;
  };
}

interface Enrollment {
  student_enrollment_id: number;
  camp: {
    camp_id: number;
    name: string;
    station: Station[];
  };
  mission_result: MissionResult[];
}

interface Student {
  firstname: string;
  lastname: string;
  student_enrollment: Enrollment[];
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ParentCampProgressPage() {
  const params = useParams();
  const router = useRouter();
  const campId = Number(params.id);

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/parent/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.student) setStudent(data.student);
        else setError("ไม่สามารถโหลดข้อมูลได้");
      })
      .catch(() => setError("เกิดข้อผิดพลาด"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center">
        <p className="text-red-500">{error || "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  const enrollment = student.student_enrollment.find(
    (en) => en.camp.camp_id === campId
  );

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-500 mb-4">ไม่พบข้อมูลความคืบหน้าของค่ายนี้</p>
          <Button 
            className="bg-[#5d7c6f] text-white"
            onPress={() => router.push("/parent/dashboard")}
          >
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  const { camp, mission_result: results } = enrollment;
  
  // Calculate Overall Progress
  const totalMissions = camp.station?.reduce((acc, s) => acc + (s.mission?.length || 0), 0) || 0;
  const completedMissions = results?.filter(r => r.status === "completed").length || 0;
  const overallProgress = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f5f0e7]">
      <ParentNavbar />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="flat"
            radius="lg"
            className="bg-white text-gray-700 shadow-sm border border-gray-100"
            onPress={() => router.push("/parent/dashboard")}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="min-w-0">
            <p className="text-[11px] text-[#5d7c6f] font-bold uppercase tracking-wider mb-0.5">Camp Progress Report</p>
            <h1 className="text-xl font-bold text-gray-800 truncate leading-tight">{camp.name}</h1>
          </div>
        </div>

        {/* Overall Progress Summary Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#5d7c6f]/5 rounded-bl-full -mr-8 -mt-8" />
          
          <div className="relative z-10">
            <h2 className="text-sm font-semibold text-gray-500 mb-5 flex items-center gap-2">
              สรุปผลความคืบหน้าของ {student.firstname}
            </h2>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
              <div>
                <span className="text-5xl font-black text-[#3d6357] tracking-tight">{overallProgress}%</span>
                <p className="text-xs text-gray-400 mt-2 font-medium">ภาพรวมภารกิจทั้งหมด</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 flex-1 max-w-xs">
                <div className="bg-[#f5f0e7] rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 mb-1">สำเร็จแล้ว</p>
                  <p className="font-bold text-[#5d7c6f] text-lg">{completedMissions}</p>
                </div>
                <div className="bg-[#f5f0e7] rounded-2xl p-3 text-center">
                  <p className="text-[10px] text-gray-400 mb-1">ทั้งหมด</p>
                  <p className="font-bold text-[#5d7c6f] text-lg">{totalMissions}</p>
                </div>
              </div>
            </div>

            <Progress
              value={overallProgress}
              className="h-4"
              classNames={{
                indicator: "bg-[#5d7c6f]",
                track: "bg-gray-100",
              }}
            />
          </div>
        </div>

        {/* Stations and Missions Details */}
        <div className="space-y-4 pb-12">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 px-1">
            <Target size={16} className="text-[#5d7c6f]" /> รายละเอียดรายฐานที่เข้าเรียน
          </h3>

          {camp.station?.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 text-sm border border-dashed border-gray-200">
              ยังไม่มีข้อมูลภารกิจในค่ายนี้
            </div>
          ) : (
            camp.station.map((station) => {
              const stationMissions = station.mission || [];
              const completedInStation = stationMissions.filter(m => 
                results?.some(r => r.mission.mission_id === m.mission_id && r.status === "completed")
              ).length;
              const stationProgress = stationMissions.length > 0
                ? Math.round((completedInStation / stationMissions.length) * 100)
                : 0;

              return (
                <div key={station.station_id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
                  {/* Station Header */}
                  <div className="p-5 flex items-center gap-4 bg-gray-50/20">
                    <div className="w-12 h-12 rounded-2xl bg-[#5d7c6f]/10 flex items-center justify-center text-[#5d7c6f] shrink-0">
                      <Target size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-gray-800 text-base truncate">{station.name}</h4>
                        <span className="text-xs font-black text-[#5d7c6f]">{stationProgress}%</span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium truncate">
                        {completedInStation} จาก {stationMissions.length} ภารกิจเสร็จสิ้น
                      </p>
                    </div>
                  </div>

                  {/* Stations Mission Grid/List */}
                  <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stationMissions.length === 0 ? (
                      <div className="col-span-full py-2 text-center text-xs text-gray-400">
                        ไม่มีภารกิจย่อย
                      </div>
                    ) : (
                      stationMissions.map((mission) => {
                        const isCompleted = results?.some(
                          r => r.mission.mission_id === mission.mission_id && r.status === "completed"
                        );

                        return (
                          <div 
                            key={mission.mission_id} 
                            className={`p-3 rounded-2xl border flex items-center gap-3 transition-all duration-200 ${
                              isCompleted 
                                ? "bg-green-50/30 border-green-100" 
                                : "bg-white border-gray-100"
                            }`}
                          >
                            <div className={`shrink-0 ${isCompleted ? "text-green-500" : "text-gray-200"}`}>
                              {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isCompleted ? "text-[#3d6357]" : "text-gray-400"}`}>
                                {mission.title}
                              </p>
                              <p className="text-[10px] text-gray-400 font-medium">{isCompleted ? "เสร็จเรียบร้อย" : "ยังไม่ได้ทำ"}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Visual progress line at the very bottom */}
                  <div className="h-1 w-full bg-gray-50">
                    <div
                      className="h-full bg-[#5d7c6f] transition-all duration-700 ease-out"
                      style={{ width: `${stationProgress}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
