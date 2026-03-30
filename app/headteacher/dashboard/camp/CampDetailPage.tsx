"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
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
  Settings,
  ClipboardList,
  Star,
  Users,
  GraduationCap,
} from "lucide-react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import EditCampModal from "./EditCampModal";
import CreateBaseModal from "./CreateBaseModal";
import EditBaseModal from "./EditBaseModal";
import CreateSurveyModal from "./CreateSurveyModal";
import SurveyResultsModal from "./SurveyResultsModal";
import TrackingModal from "./TrackingModal";
import ShirtTrackingModal from "./ShirtTrackingModal";

import { useStatusModal } from "@/components/StatusModalProvider";
import { toast } from "react-hot-toast";

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
  start_shirt_date?: string;
  end_shirt_date?: string;
  img_shirt_url?: string;
  img_camp_url?: string;
  daily_schedule: any;
  status: string;
  plan_type?: any;
  camp_classroom?: any[];
  _count?: {
    student_enrollment: number;
  };
  plan_type_name?: string;
  station?: any[];
  isOwner?: boolean;
  isHomeroomTeacher?: boolean;
  created_by_teacher_id?: number;
}

export default function CampDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const campId = params?.id;
  const isEdit = searchParams.get("edit");

  const [camp, setCamp] = useState<CampDetail | null>(null);
  const { showError, showSuccess, showConfirm, setIsLoading } = useStatusModal();
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateBaseModalOpen, setIsCreateBaseModalOpen] = useState(false);
  const [isEditBaseModalOpen, setIsEditBaseModalOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Survey state
  const [survey, setSurvey] = useState<any>(null);
  const [isCreateSurveyModalOpen, setIsCreateSurveyModalOpen] = useState(false);
  const [isEditSurveyModalOpen, setIsEditSurveyModalOpen] = useState(false);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [isSurveyResultsModalOpen, setIsSurveyResultsModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isShirtModalOpen, setIsShirtModalOpen] = useState(false);

  useEffect(() => {
    if (campId) {
      fetchCampDetail();
      fetchSurvey();
    }
    if (isEdit === "true") {
      setIsEditModalOpen(true);
      // Clean up the URL to remove the query param so it doesn't re-trigger on refresh
      router.replace(`/headteacher/dashboard/camp/${campId}`);
    }
  }, [campId, isEdit]);

  const fetchSurvey = async () => {
    setSurveyLoading(true);
    try {
      const res = await fetch(`/api/surveys?campId=${campId}`);
      if (!res.ok) {
        setSurvey(null);
        return;
      }
      const data = await res.json();
      // data may be `null` if the survey is not found but returns 200
      setSurvey(data && !data.error ? data : null);
    } catch (err) {
      console.error("Error fetching survey:", err);
    } finally {
      setSurveyLoading(false);
    }
  };

  const handleDeleteSurvey = () => {
    showConfirm(
      "ยืนยันการลบ",
      "คุณแน่ใจหรือไม่ว่าต้องการลบแบบสอบถามนี้? ข้อมูลคำตอบทั้งหมดจะถูกลบด้วย",
      async () => {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/surveys?campId=${campId}`, { method: "DELETE" });
          if (!res.ok) throw new Error();
          showSuccess("สำเร็จ", "ลบแบบสอบถามเรียบร้อยแล้ว");
          setSurvey(null);
        } catch {
          showError("ข้อผิดพลาด", "ไม่สามารถลบแบบสอบถามได้");
        } finally {
          setIsLoading(false);
        }
      },
      "ลบแบบสอบถาม"
    );
  };

  const fetchCampDetail = async () => {
    // ... existing fetch logic
    try {
      setLoading(true);
      const response = await fetch(`/api/camps/${campId}`);
      const data = await response.json();

      // ... (keep existing data processing logic) ...

      // ดึง grade_level และ plan_type จาก camp_classroom
      const gradesSet = new Set<string>();
      let planTypeName = "MSEC"; // default

      if (data.camp_classroom && data.camp_classroom.length > 0) {
        data.camp_classroom.forEach((cc: any) => {
          if (cc.classroom?.grade) {
            gradesSet.add(cc.classroom.grade);
          }
        });

        const firstClassroom = data.camp_classroom[0].classroom;
        if (firstClassroom) {
          planTypeName = firstClassroom.classroom_types?.name || "MSEC";
        }
      }

      // ถ้าไม่มีจาก classroom ให้ลองดูจาก plan_type
      if ((!planTypeName || planTypeName === "MSEC") && data.plan_type) {
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

      data.grade_level = Array.from(gradesSet).join(",");
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

  const handleDeleteBase = (baseId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    showConfirm(
      "ยืนยันการลบ",
      "คุณแน่ใจหรือไม่ว่าต้องการลบฐานกิจกรรมนี้? ข้อมูลภารกิจทั้งหมดในฐานนี้จะถูกลบไปด้วย",
      async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/stations/${baseId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete base");
          }

          showSuccess("สำเร็จ", "ลบฐานกิจกรรมเรียบร้อยแล้ว");
          fetchCampDetail();
        } catch (error) {
          console.error("Error deleting base:", error);
          showError("ข้อผิดพลาด", "ไม่สามารถลบฐานกิจกรรมได้");
        } finally {
          setIsLoading(false);
        }
      },
      "ลบฐานกิจกรรม",
    );
  };

  const handleDeleteCamp = () => {
    showConfirm(
      "ยืนยันการลบค่าย",
      "คุณแน่ใจหรือไม่ว่าต้องการลบค่ายนี้? ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบและไม่สามารถกู้คืนได้",
      async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/camps/${campId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete camp");
          }

          showSuccess("สำเร็จ", "ลบค่ายเรียบร้อยแล้ว");
          router.push("/headteacher/dashboard");
        } catch (error) {
          console.error("Error deleting camp:", error);
          showError("ข้อผิดพลาด", "ไม่สามารถลบค่ายได้");
        } finally {
          setIsLoading(false);
        }
      },
      "ลบค่าย"
    );
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      setIsEditing(true);

      let img_shirt_url = formData.shirtImage || "";
      let img_camp_url = formData.campImage || "";

      // Upload new shirt images if files were picked
      let finalShirtUrls: (string | null)[] = [];
      try {
        const parsed = JSON.parse(formData.shirtImages ? JSON.stringify(formData.shirtImages) : "[]");
        finalShirtUrls = Array.isArray(parsed) ? parsed.filter((url: any) => url != null) : [formData.shirtImages];
      } catch (e) {
        finalShirtUrls = [formData.shirtImages];
      }

      if (formData.shirtImageFiles && Array.isArray(formData.shirtImageFiles)) {
        for (let i = 0; i < formData.shirtImageFiles.length; i++) {
          const file = formData.shirtImageFiles[i];
          if (file) {
            try {
              const uploadForm = new FormData();
              uploadForm.append("file", file);
              const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                finalShirtUrls[i] = uploadData.url;
              }
            } catch (uploadErr) {
              console.error("Error during shirt upload:", uploadErr);
            }
          }
        }
      }
      img_shirt_url = JSON.stringify(finalShirtUrls);

      // Upload new camp image if a file was picked
      if (formData.campImageFile) {
        try {
          const uploadForm = new FormData();
          uploadForm.append("file", formData.campImageFile);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            img_camp_url = uploadData.url;
          } else {
            showError("อัปโหลดรูปล้มเหลว", "ไม่สามารถอัปโหลดรูปปกค่ายได้");
          }
        } catch (uploadErr) {
          console.error("Error during camp image upload:", uploadErr);
        }
      }

      const response = await fetch(`/api/camps/${campId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          img_shirt_url,
          img_camp_url,
        }),
      });

      if (!response.ok) throw new Error("Failed to update camp");

      await fetchCampDetail();
      setIsEditModalOpen(false);
      showSuccess("สำเร็จ", "อัปเดตข้อมูลค่ายเรียบร้อยแล้ว");
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
            <div className="flex-1">
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


            <div className="flex items-center gap-3 ml-4">
              {/* ซ่อนปุ่มแก้ไขถ้าไม่ใช่เจ้าของค่าย */}
              {camp.isOwner && (
                <>
                  <Button
                    className="bg-[#E84A5F] text-white hidden sm:flex hover:bg-[#FF847C] transition-colors shadow-sm"
                    startContent={<Trash2 size={18} />}
                    onPress={handleDeleteCamp}
                  >
                    ลบค่าย
                  </Button>
                  <Button
                    className="bg-[#6b857a] text-white hidden sm:flex"
                    startContent={<Settings size={18} />}
                    onPress={() => setIsEditModalOpen(true)}
                  >
                    แก้ไขข้อมูลค่าย
                  </Button>
                </>
              )}
            </div>
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
                <div className="flex items-center gap-2 mb-2 font-medium text-gray-500">
                  <GraduationCap size={16} />
                  <span>ระดับชั้นที่เปิดรับ</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {camp.grade_level ? (
                    camp.grade_level.split(",").map((grade: string) => (
                      <Chip
                        key={grade}
                        className="bg-[#f0f4f2] text-[#5d7c6f] border border-[#d1e0d9]"
                        size="sm"
                        variant="flat"
                      >
                        {grade.replace("Level_", "ม.")}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-gray-400">ไม่ได้ระบุ</span>
                  )}
                </div>
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
              {/* Camp Cover Image */}
              {camp.img_camp_url && (
                <div className="flex-shrink-0">
                  <img
                    alt="Camp cover"
                    className="h-24 w-36 object-cover rounded-xl shadow-sm border border-gray-200"
                    src={camp.img_camp_url}
                  />
                </div>
              )}
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
                  <div className="text-sm">
                    <p className="text-gray-500">ช่วงเวลาจองเสื้อ</p>
                    <p className="font-medium text-gray-900">
                      {camp.start_shirt_date && camp.end_shirt_date
                        ? `${formatDate(camp.start_shirt_date)} - ${formatDate(camp.end_shirt_date)}`
                        : "ไม่มีข้อมูล"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-sm mb-2">ตัวอย่างเสื้อ</p>
                    {(() => {
                      let shirtUrls: string[] = [];
                      if (camp.img_shirt_url) {
                        try {
                          const parsed = JSON.parse(camp.img_shirt_url);
                          shirtUrls = Array.isArray(parsed) ? parsed.filter((url) => url != null) : [camp.img_shirt_url];
                        } catch (e) {
                          shirtUrls = [camp.img_shirt_url];
                        }
                      }

                      if (shirtUrls.length > 0) {
                        return (
                          <div className={`grid gap-2 ${shirtUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                            {shirtUrls.map((url, idx) => (
                              <img
                                key={idx}
                                alt={`Shirt sample ${idx + 1}`}
                                className="w-full h-32 object-contain bg-gray-50 rounded-lg border border-gray-100"
                                src={url}
                              />
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="aspect-square bg-gray-100 rounded-lg" />
                          <div className="aspect-square bg-gray-100 rounded-lg" />
                          <div className="aspect-square bg-gray-100 rounded-lg" />
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
              {(camp.isOwner || camp.isHomeroomTeacher) && (
                <Button
                  className="mt-3 w-full bg-orange-100 text-orange-700 font-medium hover:bg-orange-200"
                  onPress={() => setIsShirtModalOpen(true)}
                >
                  ดูรายการจองเสื้อ
                </Button>
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
              {camp.isOwner && (
                <>
                  <Button
                    className="w-full justify-start bg-transparent hover:bg-gray-100 text-gray-700"
                    startContent={<Plus size={18} />}
                    onPress={() => setIsCreateBaseModalOpen(true)}
                  >
                    สร้างฐานกิจกรรม
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent hover:bg-gray-100 text-gray-700"
                    startContent={<ClipboardList size={18} />}
                    isDisabled={survey !== null}
                    onPress={() => setIsCreateSurveyModalOpen(true)}
                  >
                    สร้างแบบสอบถาม
                  </Button>
                </>
              )}

              {camp.isOwner && (
                <Button
                  className="w-full justify-start bg-transparent hover:bg-gray-100 text-gray-700"
                  startContent={<FileText size={18} />}
                  onPress={() => setIsSurveyResultsModalOpen(true)}
                >
                  ดูผลการประเมิน
                </Button>
              )}

              <Button
                className="w-full justify-start bg-transparent hover:bg-gray-100 text-gray-700"
                startContent={<Target size={18} />}
                onPress={() => setIsTrackingModalOpen(true)}
              >
                ติดตามนักเรียน
              </Button>

              {camp.isOwner && (
                <Button
                  className="w-full justify-start bg-transparent hover:bg-gray-100 text-gray-700"
                  startContent={<Award size={18} />}
                >
                  สร้างประกาศนียบัตร
                </Button>
              )}

              <Button
                className="w-full justify-start bg-transparent hover:bg-gray-100 text-gray-700"
                startContent={<Users size={18} />}
                onPress={() => router.push(`/headteacher/dashboard/camp/${campId}/students`)}
              >
                ดูข้อมูลนักเรียน
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

            {camp.isOwner && (
              <Button
                className="bg-[#6b857a] text-white"
                startContent={<Plus size={18} />}
                onPress={() => setIsCreateBaseModalOpen(true)}
              >
                สร้างฐานกิจกรรม
              </Button>
            )}
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
                    {/* ซ่อนปุ่มแก้ไข/ลบฐาน ถ้าไม่ใช่เจ้าของ */}
                    {camp.isOwner && (
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
                          className="text-[#E84A5F] opacity-70 hover:opacity-100 hover:bg-[#E84A5F]/10 hover:text-[#FF847C]"
                          size="sm"
                          variant="light"
                          onClick={(e) => handleDeleteBase(station.station_id, e)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    )}
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
                  <Target className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 mb-4">ยังไม่ได้สร้างฐานกิจกรรม</p>
                {camp.isOwner && (
                  <Button
                    className="bg-[#6b857a] text-white"
                    size="lg"
                    startContent={<Plus size={18} />}
                    onPress={() => setIsCreateBaseModalOpen(true)}
                  >
                    เริ่มสร้างฐานกิจกรรม
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Survey Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">แบบสอบถาม</h3>
              <p className="text-sm text-gray-500">
                นักเรียนต้องทำแบบสอบถามก่อนดาวน์โหลดประกาศนียบัตร
              </p>
            </div>
            {camp.isOwner && !survey && (
              <Button
                className="bg-[#6b857a] text-white"
                startContent={<Plus size={18} />}
                onPress={() => setIsCreateSurveyModalOpen(true)}
              >
                สร้างแบบสอบถาม
              </Button>
            )}
          </div>

          {surveyLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : survey ? (
            <div className="w-full">
              <div
                className="p-4 rounded-xl border-2 border-gray-100 hover:border-[#6b857a] hover:bg-[#6b857a]/5 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 bg-white rounded-lg border border-gray-100 group-hover:border-[#6b857a]/20">
                    <ClipboardList className="text-[#6b857a]" size={24} />
                  </div>
                  {camp.isOwner && (
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        className="text-gray-400 hover:text-blue-500"
                        size="sm"
                        variant="light"
                        onClick={() => setIsEditSurveyModalOpen(true)}
                      >
                        <Pencil size={18} />
                      </Button>
                      <Button
                        isIconOnly
                        className="text-[#E84A5F] opacity-70 hover:opacity-100 hover:bg-[#E84A5F]/10 hover:text-[#FF847C]"
                        size="sm"
                        variant="light"
                        onClick={handleDeleteSurvey}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {survey.title}
                </h4>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {survey.description || "ไม่มีคำอธิบาย"}
                </p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <ClipboardList size={14} />
                    <span>{survey.survey_question?.length || 0} คำถาม</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users size={14} />
                    <span>{survey._count?.survey_response || 0} คนตอบแล้ว</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="text-gray-400" size={32} />
                </div>
                <p className="text-gray-500 mb-4">ยังไม่ได้สร้างแบบสอบถาม</p>
                {camp.isOwner && (
                  <Button
                    className="bg-[#6b857a] text-white"
                    size="lg"
                    startContent={<Plus size={18} />}
                    onPress={() => setIsCreateSurveyModalOpen(true)}
                  >
                    เริ่มสร้างแบบสอบถาม
                  </Button>
                )}
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

      <CreateSurveyModal
        campId={Number(campId)}
        teacherId={camp?.created_by_teacher_id || 0}
        isOpen={isCreateSurveyModalOpen}
        onClose={() => setIsCreateSurveyModalOpen(false)}
        onSurveyCreated={fetchSurvey}
      />

      <CreateSurveyModal
        campId={Number(campId)}
        teacherId={camp?.created_by_teacher_id || 0}
        isOpen={isEditSurveyModalOpen}
        onClose={() => setIsEditSurveyModalOpen(false)}
        onSurveyCreated={fetchSurvey}
        initialData={survey}
      />

      <SurveyResultsModal
        isOpen={isSurveyResultsModalOpen}
        onClose={() => setIsSurveyResultsModalOpen(false)}
        campId={Number(campId)}
      />

      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        campId={Number(campId)}
        campName={camp?.name || ""}
      />

      {camp && (
        <ShirtTrackingModal
          isOpen={isShirtModalOpen}
          onClose={() => setIsShirtModalOpen(false)}
          campId={camp.camp_id}
          campName={camp.name}
        />
      )}
    </div>
  );
}
