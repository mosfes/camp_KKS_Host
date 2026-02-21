"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  Shirt,
  FileText,
  Award,
  BarChart3,
  Plus,
  Target,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import EditCampModal from "./EditCampModal";
import CreateBaseModal from "./CreateBaseModal";
import EditBaseModal from "./EditBaseModal";

import { useStatusModal } from "@/components/StatusModalProvider";

interface TimeSlot {
  startTime: string;
  endTime: string;
  activity: string;
}

interface DaySchedule {
  day: number;
  timeSlots: TimeSlot[];
}

interface CampDetail {
  camp_id: number;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  start_regis_date: string;
  end_regis_date: string;
  description: string;
  grade_level: string;
  has_shirt: boolean;
  end_shirt_date?: string;
  shirt_image_url?: string;
  daily_schedule: any;
  status: string;
  plan_type?: any;
  camp_classroom?: any[];
  _count?: {
    student_enrollment: number;
  };
  plan_type_name?: string;
  station?: any[];
}

export default function CampDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campId = params?.id;

  const [camp, setCamp] = useState<CampDetail | null>(null);
  const { showError, showSuccess } = useStatusModal();
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateBaseModalOpen, setIsCreateBaseModalOpen] = useState(false);
  const [isEditBaseModalOpen, setIsEditBaseModalOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (campId) {
      fetchCampDetail();
    }
  }, [campId]);

  const fetchCampDetail = async () => {
    // ... existing fetch logic
    try {
      setLoading(true);
      const response = await fetch(`/api/camps/${campId}`);
      const data = await response.json();

      // ... (keep existing data processing logic) ...

      // ดึง grade_level และ plan_type จาก camp_classroom
      let gradeLevel = null;
      let planTypeName = "MSEC"; // default

      if (data.camp_classroom && data.camp_classroom.length > 0) {
        const classroom = data.camp_classroom[0].classroom;

        if (classroom) {
          gradeLevel = classroom.grade;
          planTypeName = classroom.type_classroom || "MSEC";
        }
      }

      // ถ้าไม่มีจาก classroom ให้ลองดูจาก plan_type
      if (!planTypeName && data.plan_type) {
        planTypeName = data.plan_type.name || "MSEC";
      }

      // ดึง daily_schedule จาก camp_daily_schedule
      let dailySchedule = [];

      if (data.camp_daily_schedule && data.camp_daily_schedule.length > 0) {
        dailySchedule = data.camp_daily_schedule
          .sort((a: any, b: any) => a.day - b.day)
          .map((schedule: any) => ({
            day: schedule.day,
            timeSlots: schedule.time_slots.map((slot: any) => ({
              startTime: slot.startTime || slot.start_time,
              endTime: slot.endTime || slot.end_time,
              activity: slot.activity,
            })),
          }));
      }

      data.grade_level = gradeLevel;
      data.plan_type_name = planTypeName;
      data.daily_schedule = dailySchedule;

      setCamp(data);
    } catch (error) {
      console.error("Error fetching camp detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBase = (base: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBase(base);
    setIsEditBaseModalOpen(true);
  };

  const handleDeleteBase = async (baseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this base?")) return;

    try {
      const response = await fetch(`/api/stations/${baseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete base");
      }

      showSuccess("Success", "Base deleted successfully");
      fetchCampDetail();
    } catch (error) {
      console.error("Error deleting base:", error);
      showError("Error", "Failed to delete base");
    }
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      setIsEditing(true);
      const response = await fetch(`/api/camps/${campId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update camp");
      }

      await fetchCampDetail();
      setIsEditModalOpen(false);
      showSuccess("Success", "Camp updated successfully");
    } catch (error) {
      console.error("Error updating camp:", error);
      showError("Error", "Failed to update camp");
    } finally {
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);

    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const formatTime = (time: string) => {
    // ... existing formatTime
    if (!time) return "";

    return time.slice(0, 5); // แสดงแค่ HH:MM
  };

  if (loading) {
    // ... existing loading state
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">กำลังโหลดข้อมูลค่าย...</p>
        </div>
      </div>
    );
  }

  if (!camp) {
    // ... existing not found state
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">ไม่พบข้อมูลค่าย</p>
          <Button
            className="mt-4 bg-[#6b857a] text-white"
            onPress={() => router.push("/headteacher/dashboard")}
          >
            กลับไปยังหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  // const totalActivities = ...

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <div className=" z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-3"
            onClick={() => router.push("/headteacher/dashboard")}
          >
            <ChevronLeft size={20} />
            <span className="font-medium">กลับไปยังหน้าหลัก</span>
          </button>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {camp.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin size={18} />
                  <span>{camp.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={18} />
                  <span>
                    {formatDate(camp.start_date)} - {formatDate(camp.end_date)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="bg-[#6b857a] text-white"
              startContent={<FileText size={18} />}
              onPress={() => setIsEditModalOpen(true)}
            >
              แก้ไขข้อมูลค่าย
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ... existing detailed content ... */}
        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Camp Information */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-[#6b857a]" size={20} />
              <h3 className="font-semibold text-gray-900">ข้อมูลค่าย</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">ระดับชั้น</p>
                <p className="font-medium text-gray-900">
                  {camp.grade_level?.replace("Level_", "ม.")}
                </p>
              </div>

              <div>
                <p className="text-gray-500">ประเภทห้องเรียน/แผนการเรียน</p>
                <p className="font-medium text-gray-900">
                  {camp.plan_type_name}
                </p>
              </div>

              <div>
                <p className="text-gray-500">ช่วงเวลาเปิดรับสมัคร</p>
                <p className="font-medium text-gray-900">
                  {camp.start_regis_date
                    ? formatDate(camp.start_regis_date)
                    : "N/A"}{" "}
                  -
                  {camp.end_regis_date
                    ? formatDate(camp.end_regis_date)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Shirt Reservations */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shirt className="text-[#6b857a]" size={20} />
              <h3 className="font-semibold text-gray-900">การจองเสื้อ</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">สถานะ</span>
                <Chip className="bg-green-100 text-green-700" size="sm">
                  {camp.has_shirt ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </Chip>
              </div>

              {camp.has_shirt && (
                <>
                  <div>
                    <p className="text-gray-500 text-sm">วันปิดจอง</p>
                    <p className="font-medium text-gray-900">
                      {camp.end_shirt_date
                        ? formatDate(camp.end_shirt_date)
                        : "ไม่มีข้อมูล"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm mb-2">ตัวอย่างเสื้อ</p>
                    {camp.shirt_image_url ? (
                      <img
                        alt="Shirt sample"
                        className="w-full h-32 object-contain bg-gray-50 rounded-lg"
                        src={camp.shirt_image_url}
                      />
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-square bg-gray-100 rounded-lg" />
                        <div className="aspect-square bg-gray-100 rounded-lg" />
                        <div className="aspect-square bg-gray-100 rounded-lg" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Camp Schedule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-[#6b857a]" size={20} />
              <h3 className="font-semibold text-gray-900">กำหนดการค่าย</h3>
            </div>

            <div className="space-y-3">
              {camp.daily_schedule
                ?.slice(0, 3)
                .map((day: any, index: number) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-900">
                      วันที่ {day.day}
                    </p>
                    <p className="text-xs text-gray-500">
                      มี {day.timeSlots.length} กิจกรรม
                    </p>
                  </div>
                ))}

              {camp.daily_schedule?.length > 3 && (
                <p className="text-xs text-gray-400 italic">
                  + อีก {camp.daily_schedule.length - 3} วัน
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">เมนูด่วน</h3>

            <div className="space-y-2">
              <Button
                className="w-full justify-start bg-transparent hover:bg-gray-50 text-gray-700"
                startContent={<Plus size={18} />}
              >
                สร้างฐานกิจกรรม
              </Button>

              <Button
                className="w-full justify-start bg-transparent hover:bg-gray-50 text-gray-700"
                startContent={<FileText size={18} />}
              >
                ดูผลการประเมิน
              </Button>

              <Button
                className="w-full justify-start bg-transparent hover:bg-gray-50 text-gray-700"
                startContent={<Award size={18} />}
              >
                ดูประกาศนียบัตร
              </Button>

              <Button
                className="w-full justify-start bg-transparent hover:bg-gray-50 text-gray-700"
                startContent={<BarChart3 size={18} />}
              >
                ดูสถิติ
              </Button>
            </div>
          </div>
        </div>

        {/* Complete Schedule */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-[#6b857a]" size={20} />
            <div>
              <h3 className="font-semibold text-gray-900">
                ตารางเวลากิจกรรมทั้งหมด
              </h3>
              <p className="text-sm text-gray-500">ลำดับกิจกรรมรายวัน</p>
            </div>
          </div>

          <div className="space-y-6">
            {camp.daily_schedule?.map((day: any, dayIndex: number) => (
              <div key={dayIndex}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-gray-700">
                    {day.day}
                  </div>
                  <h4 className="font-semibold text-gray-900">
                    วันที่ {day.day}
                  </h4>
                </div>

                <div className="space-y-3 ml-13">
                  {day.timeSlots.map((slot: any, slotIndex: number) => (
                    <div
                      key={slotIndex}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-gray-600 min-w-[120px]">
                        <Clock size={16} />
                        <span className="text-sm font-medium">
                          {formatTime(slot.startTime)} -{" "}
                          {formatTime(slot.endTime)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">
                          {slot.activity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bases Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                ฐานกิจกรรม
              </h3>
              <p className="text-sm text-gray-500">จัดการฐานกิจกรรมและภารกิจ</p>
            </div>

            <Button
              className="bg-[#6b857a] text-white"
              startContent={<Plus size={18} />}
              onPress={() => setIsCreateBaseModalOpen(true)}
            >
              สร้างฐานกิจกรรม
            </Button>
          </div>

          {camp.station && camp.station.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {camp.station.map((station: any) => (
                <div
                  key={station.station_id}
                  className="p-4 rounded-xl border-2 border-gray-100 hover:border-[#6b857a] hover:bg-[#6b857a]/5 transition-all cursor-pointer group"
                  onClick={() =>
                    router.push(
                      `/headteacher/dashboard/camp/${campId}/base/${station.station_id}`,
                    )
                  }
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-[#6b857a]/20">
                      <Target className="text-[#6b857a]" size={24} />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        className="text-gray-400 hover:text-blue-500"
                        size="sm"
                        variant="light"
                        onClick={(e) => handleEditBase(station, e)}
                      >
                        <Pencil size={18} />
                      </Button>
                      <Button
                        isIconOnly
                        className="text-gray-400 hover:text-red-500"
                        size="sm"
                        variant="light"
                        onClick={(e) => handleDeleteBase(station.station_id, e)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {station.name}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {station.description || "ไม่มีคำอธิบาย"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 mb-4">ยังไม่ได้สร้างฐานกิจกรรม</p>
                <Button
                  className="bg-[#6b857a] text-white"
                  size="lg"
                  startContent={<Plus size={18} />}
                  onPress={() => setIsCreateBaseModalOpen(true)}
                >
                  เริ่มสร้างฐานกิจกรรม
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditCampModal
        campData={camp}
        isLoading={isEditing}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <CreateBaseModal
        campId={Number(campId)}
        isOpen={isCreateBaseModalOpen}
        onClose={() => setIsCreateBaseModalOpen(false)}
      />

      <EditBaseModal
        baseData={selectedBase}
        isOpen={isEditBaseModalOpen}
        onClose={() => setIsEditBaseModalOpen(false)}
        onSuccess={fetchCampDetail}
      />
    </div>
  );
}
