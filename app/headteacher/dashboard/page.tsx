"use client";

import { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    Input,
} from "@heroui/react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import StatsCard from "./StatsCard";
import { MapPin, Calendar, ChevronRight, ImageOff, Tent, GraduationCap, Users, TrendingUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import CreateCampModal from "./CreateCampModal";
import SelectProjectTypeModal from "./SelectProjectTypeModal";


/* ---------- Default SVG Component ---------- */
function DefaultCampImage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#f1ede6] text-[#9c9488]">
            <ImageOff size={48} />
            <span className="mt-2 text-sm">ไม่มีรูปภาพ</span>
        </div>
    );
}

// ... imports
import { useStatusModal } from "@/components/StatusModalProvider";

export default function StudentDashboard() {
    const { showSuccess, showError, showConfirm } = useStatusModal();
    const router = useRouter();
    const [camps, setCamps] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalCamps: 0,
        activeCamps: 0,
        totalStudents: 0,
        totalEnrollments: 0,
        totalTeachers: 0,
        avgEnrollment: 0,
    });
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState("overview");
    const [isSelectTypeOpen, setIsSelectTypeOpen] = useState(false);
    const [isCreateCampOpen, setIsCreateCampOpen] = useState(false);
    const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
    const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null);

    const fetchCamps = async () => {
        try {
            const response = await fetch("/api/camps");
            const data = await response.json();

            // Map API data to UI structure
            const formattedCamps = data.map((camp: any) => {
                // Determine status label
                let statusLabel = "ยังไม่เริ่ม";
                const now = new Date();
                const start = new Date(camp.start_date);
                const end = new Date(camp.end_date);

                if (now > end) {
                    statusLabel = "เสร็จสิ้น";
                } else if (now >= start && now <= end) {
                    statusLabel = "กำลังจัด";
                }

                return {
                    id: camp.camp_id,
                    title: camp.name,
                    description: camp.description,
                    status: statusLabel,
                    location: camp.location,
                    startDate: start.toLocaleDateString('en-GB'),
                    endDate: end.toLocaleDateString('en-GB'),
                    enrolled: camp._count?.student_enrollment || 0,
                    capacity: 0, // Capacity not in current API response, defaulting to 0 or hidden
                    image: camp.camp_img_url || null,
                };
            });

            setCamps(formattedCamps);
        } catch (error) {
            console.error("Failed to fetch camps:", error);
            showError("Error", "Failed to load camps");
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/camps/stats");
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        }
    };

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            await Promise.all([fetchCamps(), fetchStats()]);
            setLoading(false);
        };
        initData();
    }, []);

    const openCreateCampFlow = () => {
        setIsSelectTypeOpen(true);
    };

    const handleProjectTypeSelect = (type: string, templateData: any) => {
        setSelectedProjectType(type);
        setSelectedTemplateData(templateData);
        setIsSelectTypeOpen(false);
        setIsCreateCampOpen(true);
    };

    const handleDeleteCamp = (campId: number, campName: string) => {
        showConfirm(
            "ลบค่าย",
            `คุณต้องการลบค่าย "${campName}" ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`,
            async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`/api/camps/${campId}`, {
                        method: 'DELETE',
                    });

                    const result = await response.json();

                    if (response.ok) {
                        showSuccess('สำเร็จ', 'ลบค่ายสำเร็จ!');
                        await fetchCamps();
                        await fetchStats();
                    } else {
                        showError('ผลการดำเนินงาน', `ลบค่ายไม่สำเร็จ: ${result.error}`);
                    }
                } catch (error) {
                    console.error('Error deleting camp:', error);
                    showError('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบค่าย');
                } finally {
                    setLoading(false);
                }
            },
            "ลบ"
        );
    };

    // ...

    const handleCreateCampSubmit = async (data: any) => {
        try {
            console.log("Data being sent:", data); // Debug: ดูข้อมูลที่ส่งไป

            // ส่งข้อมูลไปยัง API เพื่อสร้างค่ายใหม่
            const response = await fetch('/api/camps', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    location: data.location,
                    campStartDate: data.campStartDate,
                    campEndDate: data.campEndDate,
                    registrationStartDate: data.registrationStartDate,
                    registrationEndDate: data.registrationEndDate,
                    shirtStartDate: data.shirtStartDate,
                    shirtEndDate: data.shirtEndDate,
                    description: data.description || '',
                    hasShirt: data.hasShirt,
                    classroom_ids: data.classroom_ids, // ส่ง array ของ classroom IDs
                    projectType: selectedProjectType,
                    gradeLevel: data.gradeLevel,
                    classroomType: data.classroomType,
                    dailySchedule: data.dailySchedule,
                    saveAsTemplate: data.saveAsTemplate,
                    templateName: data.templateName
                }),
            });

            const result = await response.json();
            console.log("API Response:", result); // Debug: ดู response จาก API

            if (response.ok) {
                console.log("Camp created successfully");
                showSuccess('สำเร็จ', 'สร้างค่ายสำเร็จ!');
                // Refresh camps list
                await fetchCamps();
                await fetchStats();
            } else {
                console.error("Failed to create camp:", result.error);
                showError('ล้มเหลว', `สร้างค่ายไม่สำเร็จ: ${result.error}`);
            }
        } catch (error) {
            console.error("Error creating camp:", error);
            showError('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสร้างค่าย');
        } finally {
            setIsCreateCampOpen(false);
            setSelectedProjectType(null);
        }
    };

    const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
        "กำลังจัด": {
            bg: "bg-[#5d7c6f]",
            text: "text-white",
        },
        "ยังไม่เริ่ม": {
            bg: "bg-[#d4c5b0]",
            text: "text-[#5a4a3a]",
        },
        "เสร็จสิ้น": {
            bg: "bg-gray-200",
            text: "text-gray-600",
        },
    };

    const [campStatusFilter, setCampStatusFilter] = useState("all");
    const filteredMyCamps =
        campStatusFilter === "all"
            ? camps
            : camps.filter((camp) => camp.status === campStatusFilter);

    return (
        <div className="min-h-screen bg-[#F5F1E8]">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-[#2d3748]">
                        ยินดีต้อนรับ, ครูหัวหน้าค่าย!
                    </h1>
                    <p className="text-lg text-gray-500">
                        จัดการค่ายและติดตามการเรียนรู้ของนักเรียน
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6 w-full">
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={setSelectedTab}
                        size="lg"
                        classNames={{
                            base: "w-full",
                            tabList:
                                "w-full bg-[#EBE7DD] rounded-full p-1 flex overflow-x-auto md:overflow-visible scrollbar-hide",
                            tab:
                                "flex-1 px-6 py-3 whitespace-nowrap flex-shrink-0 md:flex-1 justify-center",
                            cursor: "rounded-full",
                            tabContent: "font-semibold text-center",
                        }}
                    >
                        <Tab key="overview" title="ภาพรวม" />
                        <Tab key="camp" title="ค่ายที่สร้าง" />
                        <Tab key="user" title="ผู้ใช้" />
                    </Tabs>
                </div>

                {/* Cards */}
                {selectedTab === "overview" && (
                    <div className="w-full">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500">กำลังโหลดข้อมูลสถิติ...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full">
                                <div className="grid grid-cols-2 grid-rows-2 lg:gap-6 md:gap-4 gap-3">
                                    <StatsCard
                                        title="ค่ายทั้งหมด"
                                        value={stats.totalCamps}
                                        subtitle={`${stats.activeCamps} กำลังจัด`}
                                        icon={Tent}
                                    />

                                    <StatsCard
                                        title="นักเรียนทั้งหมด"
                                        value={stats.totalStudents}
                                        subtitle={`${stats.totalEnrollments} การลงทะเบียน`}
                                        icon={GraduationCap}
                                    />

                                    <StatsCard
                                        title="ครูทั้งหมด"
                                        value={stats.totalTeachers}
                                        subtitle="1 หัวหน้าค่าย"
                                        icon={Users}
                                    />

                                    <StatsCard
                                        title="เฉลี่ยการลงทะเบียน"
                                        value={stats.avgEnrollment}
                                        subtitle="คนต่อค่าย"
                                        icon={TrendingUp}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedTab === "camp" && (
                    <div className="space-y-6">
                        {/* ===== Header Bar ===== */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#f6f2ea] rounded-2xl px-6 py-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#2d3748]">ค่ายของฉัน</h2>
                                <p className="text-sm text-gray-500">
                                    จัดการและดูแลค่ายกิจกรรมการเรียนรู้ของคุณ
                                </p>
                            </div>

                            <Button
                                className="bg-[#6b857a] text-white rounded-full px-5"
                                startContent={<span className="text-xl">+</span>}
                                onPress={openCreateCampFlow}
                            >
                                สร้างค่ายใหม่
                            </Button>
                        </div>

                        {/* ===== FILTER ===== */}
                        <div className="flex gap-2">
                            {["all", "กำลังจัด", "ยังไม่เริ่ม", "เสร็จสิ้น"].map((status) => {
                                const isActive = campStatusFilter === status;
                                const base = "rounded-full px-4 border text-sm";
                                const active = "bg-[#6b857a] text-white";
                                const inactive = "bg-white text-gray-600";

                                return (
                                    <Button
                                        key={status}
                                        size="sm"
                                        onPress={() => setCampStatusFilter(status)}
                                        className={`${base} ${isActive ? active : inactive}`}
                                    >
                                        {status === "all" ? "ทั้งหมด" : status}
                                    </Button>
                                );
                            })}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="w-16 h-16 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500">กำลังโหลดข้อมูลค่าย...</p>
                                </div>
                            </div>
                        ) : filteredMyCamps.length === 0 ? (
                            <div className="w-full py-20 text-center text-gray-500">
                                ยังไม่มีค่ายในขณะนี้
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {filteredMyCamps.map((camp) => (
                                    <Card
                                        key={camp.id}
                                        className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white relative group"
                                    >
                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCamp(camp.id, camp.title);
                                            }}
                                            className="absolute top-2 right-2 z-10 p-2  bg-[#5d7c6f] text-white rounded-full opacity-60 group-hover:opacity-100 transition-opacity hover:bg-[#5d7c6f] shadow-lg hover:text-red-500"
                                            title="ลบค่าย">
                                            <Trash2 size={16} />
                                        </button>

                                        {/* Image / SVG (hidden on mobile) */}
                                        <div
                                            className="relative h-48 overflow-hidden hidden sm:block cursor-pointer"
                                            onClick={() => router.push(`/headteacher/dashboard/camp/${camp.id}`)}
                                        >
                                            {camp.image ? (
                                                <img
                                                    src={camp.image}
                                                    alt={camp.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <DefaultCampImage />
                                            )}
                                        </div>

                                        <CardBody className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-2xl font-bold mb-2 text-[#2d3748]">
                                                        {camp.title}
                                                    </h3>
                                                    <p className="mb-4 text-[#718096]">
                                                        {camp.description}
                                                    </p>
                                                </div>
                                                <Chip
                                                    variant="shadow"
                                                    className={`
                                                        ${STATUS_STYLES[camp.status]?.bg ?? "bg-gray-100"}
                                                        ${STATUS_STYLES[camp.status]?.text ?? "text-gray-600"}
                                                    `}
                                                >
                                                    {camp.status}
                                                </Chip>
                                            </div>

                                            {/* Location */}
                                            <div className="flex items-center gap-2 mb-2 text-[#718096]">
                                                <MapPin size={20} />
                                                <span>{camp.location}</span>
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center gap-2 mb-4 text-[#718096]">
                                                <Calendar size={20} />
                                                <span>
                                                    {camp.startDate} - {camp.endDate}
                                                </span>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex justify-between items-center pt-4 border-t border-[#e2e8f0]">
                                                <span className="text-[#718096]">
                                                    ลงทะเบียนแล้ว {camp.enrolled}/{camp.capacity}
                                                </span>
                                                <Button
                                                    endContent={<ChevronRight size={20} />}
                                                    className="bg-transparent text-[#718096] font-semibold hover:opacity-70"
                                                    onPress={() => router.push(`headteacher/dashboard/camp/${camp.id}`)}
                                                >
                                                    ดูรายละเอียด
                                                </Button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <SelectProjectTypeModal
                isOpen={isSelectTypeOpen}
                onClose={() => setIsSelectTypeOpen(false)}
                onSelect={handleProjectTypeSelect}
            />

            <CreateCampModal
                isOpen={isCreateCampOpen}
                onClose={() => {
                    setIsCreateCampOpen(false);
                    setSelectedProjectType(null);
                    setSelectedTemplateData(null);
                }}
                onSubmit={handleCreateCampSubmit}
                projectType={selectedProjectType}
                templateData={selectedTemplateData}
                isLoading={loading}
            />
        </div>
    );
}