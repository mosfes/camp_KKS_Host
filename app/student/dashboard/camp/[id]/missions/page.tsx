
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { ChevronLeft, ChevronRight, Target, ClipboardList } from "lucide-react";
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

    const fetchCamp = async () => {
        try {
            const res = await fetch("/api/student/camps");
            if (res.ok) {
                const data = await res.json();
                const found = data.find((c: any) => c.id === Number(id));
                if (found) {
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
    }

    useEffect(() => {
        fetchCamp();
    }, [id]);

    if (loading) return <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">กำลังโหลด...</div>;
    if (!camp) return <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">ไม่พบค่าย</div>;

    // Derived Metrics
    // For demo, let's mock some progress if the user wants to see the UI "in action"
    // But initially it should be 0.
    const totalMissions = camp.station?.reduce((acc: number, s: any) => acc + (s.mission?.length || 0), 0) || 0;
    const completedOverall = camp.missionResults?.filter((r: any) => r.status === 'completed').length || 0;
    const overallProgress = totalMissions > 0 ? Math.round((completedOverall / totalMissions) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#F5F1E8]">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-50">
                <Button
                    isIconOnly
                    variant="light"
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} className="text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-lg font-bold text-[#2d3748]">ภารกิจค่าย</h1>
                    <p className="text-sm text-gray-500">{camp.title}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* Overall Progress Card */}
                <div className="bg-[#EBE7DD] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-[#2d3748] mb-4">ความคืบหน้าโดยรวม</h2>

                    <div className="flex justify-between items-end mb-2">
                        <span className="text-4xl font-bold text-[#2d3748]">{overallProgress}%</span>
                        <span className="text-sm text-gray-500 mb-1">{completedOverall}/{totalMissions} ภารกิจ</span>
                    </div>

                    <Progress
                        value={overallProgress}
                        className="h-3 bg-white/50"
                        classNames={{
                            indicator: "bg-[#5d7c6f]"
                        }}
                    />
                </div>

                <h3 className="text-gray-600 font-medium">เลือกฐานกิจกรรม</h3>

                {/* Stations List */}
                <div className="space-y-4">
                    {camp.station?.map((station: any) => {
                        const stationMissions = station.mission || [];
                        const completedInStation = stationMissions.filter((m: any) =>
                            camp.missionResults?.some((r: any) => r.mission_mission_id === m.mission_id && r.status === 'completed')
                        ).length;
                        const progress = stationMissions.length > 0 ? Math.round((completedInStation / stationMissions.length) * 100) : 0;
                        const completed = completedInStation;

                        return (
                            <div
                                key={station.station_id}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-transparent hover:border-[#5d7c6f] transition-all cursor-pointer group"
                                onClick={() => router.push(`/student/dashboard/camp/${id}/missions/${station.station_id}`)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                        <Target className="text-[#5d7c6f]" size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-800 group-hover:text-[#5d7c6f] transition-colors">
                                                {station.name}
                                            </h4>
                                            <span className="bg-[#EBE7DD] text-[#5a4a3a] text-xs font-bold px-2 py-1 rounded-full">
                                                {completed}/{mCount}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{station.description || "ทำภารกิจในฐานนี้ให้สำเร็จ"}</p>

                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <Progress
                                                    value={progress}
                                                    className="h-2"
                                                    classNames={{
                                                        indicator: "bg-[#5d7c6f]",
                                                        track: "bg-gray-100"
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">{progress}% สำเร็จ</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300 group-hover:text-[#5d7c6f]" />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Satisfaction Evaluation */}
                <div className="bg-white p-6 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#d4c5b0]/20 flex items-center justify-center text-[#8c7b65]">
                            <ClipboardList size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-gray-800">แบบประเมินความพึงพอใจ</h4>
                                <span className="border border-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
                                    รอดำเนินการ
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">แชร์ประสบการณ์การเข้าค่ายของคุณ</p>
                        </div>
                        <ChevronRight className="text-gray-300" />
                    </div>
                </div>

            </div>
        </div>
    );
}
