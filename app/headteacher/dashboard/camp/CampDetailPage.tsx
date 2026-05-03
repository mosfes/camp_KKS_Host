"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MapPin,
  Calendar,
  Clock,
  Shirt,
  Award,
  BarChart3,
  Plus,
  Target,
  Pencil,
  Trash2,
  ClipboardList,
  Users,
  GraduationCap,
  UserCheck,
  TrendingUp,
  BookOpen,
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
import AttendanceModal from "./AttendanceModal";
import PrePostTestModal from "./PrePostTestModal";

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
  grades?: string[];
  gradeDisplay?: string;
  gradeDisplayList?: { type: string; grades: string[] }[];
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
  total_eligible_students?: number;
  student_enrollment?: any[];
}

export default function CampDetailPage() {
  const router = useRouter();

  const compressImage = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return file;
    try {
      const imageCompression = (await import("browser-image-compression"))
        .default;

      return await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    } catch (e) {
      console.error("Compression error:", e);

      return file;
    }
  };
  const params = useParams();
  const searchParams = useSearchParams();
  const campId = params?.id;
  const isEdit = searchParams.get("edit");

  const [camp, setCamp] = useState<CampDetail | null>(null);
  const { showError, showSuccess, showConfirm, setIsLoading } =
    useStatusModal();
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateBaseModalOpen, setIsCreateBaseModalOpen] = useState(false);
  const [isEditBaseModalOpen, setIsEditBaseModalOpen] = useState(false);
  const [selectedBase, setSelectedBase] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [navigatingToBase, setNavigatingToBase] = useState<number | null>(null);

  // Survey state
  const [survey, setSurvey] = useState<any>(null);
  const [isCreateSurveyModalOpen, setIsCreateSurveyModalOpen] = useState(false);
  const [isEditSurveyModalOpen, setIsEditSurveyModalOpen] = useState(false);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [isSurveyResultsModalOpen, setIsSurveyResultsModalOpen] =
    useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isShirtModalOpen, setIsShirtModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isPrePostTestModalOpen, setIsPrePostTestModalOpen] = useState(false);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [shirtCount, setShirtCount] = useState<number | null>(null);
  const [isShirtOpen, setIsShirtOpen] = useState(true);
  const [isScheduleOpen, setIsScheduleOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const shirtImages = useMemo(() => {
    if (!camp?.img_shirt_url) return [];
    try {
      const parsed = JSON.parse(camp.img_shirt_url);

      return Array.isArray(parsed)
        ? parsed.filter((url: any) => url)
        : [camp.img_shirt_url];
    } catch (e) {
      return [camp.img_shirt_url];
    }
  }, [camp?.img_shirt_url]);

  useEffect(() => {
    window.scrollTo(0, 0); // เลื่อนขึ้นไปบนสุดทุกครั้งที่เข้าหน้าค่าย
    if (campId) {
      fetchCampDetail();
      fetchSurvey();
      fetchShirtCount();
    }
    if (isEdit === "true") {
      setIsEditModalOpen(true);
      // Clean up the URL to remove the query param so it doesn't re-trigger on refresh
      router.replace(`/headteacher/dashboard/camp/${campId}`);
    }
  }, [campId, isEdit]);

  const fetchShirtCount = async () => {
    try {
      const res = await fetch(`/api/camps/${campId}/shirts`);

      if (res.ok) {
        const data = await res.json();

        setShirtCount(data.totalShirts ?? 0);
      }
    } catch {
      setShirtCount(null);
    }
  };

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
          const res = await fetch(`/api/surveys?campId=${campId}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error();
          showSuccess("สำเร็จ", "ลบแบบสอบถามเรียบร้อยแล้ว");
          setSurvey(null);
        } catch {
          showError("ข้อผิดพลาด", "ไม่สามารถลบแบบสอบถามได้");
        } finally {
          setIsLoading(false);
        }
      },
      "ลบแบบสอบถาม",
    );
  };

  const fetchCampDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/camps/${campId}`);

      if (!response.ok) {
        console.error("Failed to fetch camp detail, status:", response.status);
        setCamp(null);
        return;
      }

      const data = await response.json();

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
    if (navigatingToBase !== null) return;
    setSelectedBase(base);
    setIsEditBaseModalOpen(true);
  };

  const handleDeleteBase = (baseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigatingToBase !== null) return;

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
      "ลบค่าย",
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
        const parsed = JSON.parse(
          formData.shirtImages ? JSON.stringify(formData.shirtImages) : "[]",
        );

        finalShirtUrls = Array.isArray(parsed)
          ? parsed.filter((url: any) => url != null)
          : [formData.shirtImages];
      } catch (e) {
        finalShirtUrls = [formData.shirtImages];
      }

      if (formData.shirtImageFiles && Array.isArray(formData.shirtImageFiles)) {
        for (let i = 0; i < formData.shirtImageFiles.length; i++) {
          const file = formData.shirtImageFiles[i];

          if (file) {
            try {
              const compressedFile = await compressImage(file);
              const uploadForm = new FormData();

              uploadForm.append("file", compressedFile);
              const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: uploadForm,
              });

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
          const compressedFile = await compressImage(formData.campImageFile);
          const uploadForm = new FormData();

          uploadForm.append("file", compressedFile);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadForm,
          });

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
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#f5f5f2]">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2 z-10">
        <button
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          onClick={() => router.push("/headteacher/dashboard")}
        >
          <ChevronLeft size={20} />
          <span className="font-medium">กลับไปยังหน้าหลัก</span>
        </button>

        <div
          className="relative w-full rounded-[2rem] overflow-hidden min-h-[260px] flex flex-col justify-end p-6 md:p-8 shadow-sm border border-gray-100"
          style={
            !camp.img_camp_url
              ? { background: "linear-gradient(to right, #6b857a, #8ea69b)" }
              : undefined
          }
        >
          {camp.img_camp_url && (
            <Image
              fill
              alt="Camp Cover"
              className="object-cover z-0"
              src={camp.img_camp_url}
            />
          )}
          {/* Dark overlay and Blur for readability */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px] z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-0" />

          <div className="relative z-10 w-full flex flex-col gap-3">
            {/* Status and ID */}
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-[#00C48C] text-white px-3 py-1 rounded-full text-xs font-semibold">
                {camp.status === "active"
                  ? "กำลังดำเนินการ"
                  : camp.status || "กำลังดำเนินการ"}
              </span>
              <span className="text-gray-300 text-sm font-medium">
                ID: {camp.camp_id}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {camp.name}
            </h1>

            {/* Bottom Row */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-gray-200 text-sm md:text-base font-medium">
                <div className="flex items-center gap-2">
                  <MapPin className="text-[#00C48C]" size={20} />
                  <span>{camp.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="text-[#00C48C]" size={20} />
                  <span>
                    {formatDate(camp.start_date)} – {formatDate(camp.end_date)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {camp.isOwner && (
                  <>
                    <Button
                      isIconOnly
                      className="bg-[#4a0d0d] text-white border border-[#ff847c]/10 hover:bg-[#5c1616] transition-colors h-11 w-11 rounded-xl"
                      onPress={handleDeleteCamp}
                    >
                      <Trash2 size={20} />
                    </Button>
                    <Button
                      className="bg-white text-[#1a3a32] font-bold hover:bg-gray-100 transition-colors h-11 px-6 rounded-xl shadow-sm"
                      startContent={
                        <Pencil className="text-[#1a3a32]" size={18} />
                      }
                      onPress={() => setIsEditModalOpen(true)}
                    >
                      แก้ไขค่าย
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ... existing detailed content ... */}
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Participants Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl font-bold text-[#6b857a] mb-0.5">
              {camp?.student_enrollment?.length ?? 0}
              <span className="text-xl text-gray-300 mx-1">/</span>
              <span className="text-xl text-gray-400">
                {camp?.total_eligible_students ?? 0}
              </span>
            </p>
            <p className="text-gray-400 text-[10px] font-medium mb-1">คน</p>
            <p className="text-[#1a3a32] font-semibold text-sm">ผู้เข้าร่วม</p>
          </div>

          {/* Shirt Reservations Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl font-bold text-[#6b857a] mb-0.5">
              {shirtCount ?? 0}
            </p>
            <p className="text-gray-400 text-[10px] font-medium mb-1">คน</p>
            <p className="text-[#1a3a32] font-semibold text-sm">จองเสื้อ</p>
          </div>

          {/* Activities Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl md:text-3xl font-bold text-[#6b857a] mb-0.5">
              {camp?.station?.length ?? 0}
            </p>
            <p className="text-gray-400 text-[10px] font-medium mb-1">ฐาน</p>
            <p className="text-[#1a3a32] font-semibold text-sm">กิจกรรม</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {camp.isOwner && (
              <button
                className="bg-white hover:bg-[#f0f4f2] border-gray-100 hover:border-[#6b857a] rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm cursor-pointer"
                onClick={() => setIsCreateBaseModalOpen(true)}
              >
                <div className="text-[#6b857a] group-hover:scale-110 transition-transform">
                  <Target size={32} />
                </div>
                <span className="font-semibold text-sm text-center text-gray-700">
                  สร้าง
                  <br />
                  ฐานกิจกรรม
                </span>
              </button>
            )}

            {camp.isOwner && (
              <button
                className={`rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm bg-white hover:bg-[#f0f4f2] border-gray-100 hover:border-[#6b857a] cursor-pointer`}
                onClick={() =>
                  survey !== null
                    ? setIsSurveyResultsModalOpen(true)
                    : setIsCreateSurveyModalOpen(true)
                }
              >
                <div
                  className={`text-[#6b857a] group-hover:scale-110 transition-transform`}
                >
                  {survey !== null ? (
                    <BarChart3 size={32} />
                  ) : (
                    <ClipboardList size={32} />
                  )}
                </div>
                <span
                  className={`font-semibold text-sm text-center text-gray-700`}
                >
                  {survey !== null ? (
                    <>
                      ดูผลการ
                      <br />
                      ตอบกลับ
                    </>
                  ) : (
                    <>
                      สร้าง
                      <br />
                      แบบสอบถาม
                    </>
                  )}
                </span>
              </button>
            )}

            {camp.isOwner && (
              <button
                className="bg-white hover:bg-[#f0f4f2] border-gray-100 hover:border-[#6b857a] rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm cursor-pointer"
                onClick={() => setIsSurveyResultsModalOpen(true)}
              >
                <div className="text-[#6b857a] group-hover:scale-110 transition-transform">
                  <BarChart3 size={32} />
                </div>
                <span className="font-semibold text-sm text-center text-gray-700">
                  ผลการ
                  <br />
                  ประเมิน
                </span>
              </button>
            )}

            {camp.isOwner && (
              <button
                className="bg-white hover:bg-[#f0f4f2] border-gray-100 hover:border-[#6b857a] rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm cursor-pointer"
                onClick={() => setIsPrePostTestModalOpen(true)}
              >
                <div className="text-[#6b857a] group-hover:scale-110 transition-transform">
                  <TrendingUp size={32} />
                </div>
                <span className="font-semibold text-sm text-center text-gray-700">
                  เปรียบเทียบ
                  <br />
                  คะแนน
                </span>
              </button>
            )}

            <button
              className="bg-white hover:bg-[#f0f4f2] border-gray-100 hover:border-[#6b857a] rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm cursor-pointer"
              onClick={() => setIsTrackingModalOpen(true)}
            >
              <div className="text-[#6b857a] group-hover:scale-110 transition-transform">
                <Users size={32} />
              </div>
              <span className="font-semibold text-sm text-center text-gray-700">
                ติดตาม
                <br />
                นักเรียน
              </span>
            </button>

            <button
              className="bg-white hover:bg-[#f0f4f2] border-gray-100 hover:border-[#6b857a] rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm cursor-pointer"
              onClick={() => setIsAttendanceModalOpen(true)}
            >
              <div className="text-[#6b857a] group-hover:scale-110 transition-transform">
                <UserCheck size={32} />
              </div>
              <span className="font-semibold text-sm text-center text-gray-700">
                เช็คชื่อ
                <br />
                นักเรียน
              </span>
            </button>

            {camp.isOwner && (
              <button
                disabled
                className="bg-gray-50 border-gray-100 rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm cursor-not-allowed opacity-70"
              >
                <div className="text-gray-300 transition-transform">
                  <Award size={32} />
                </div>
                <span className="font-semibold text-sm text-center text-gray-400">
                  ประกาศนียบัตร
                  <br />
                  (กำลังพัฒนา)
                </span>
              </button>
            )}

            <button
              className="bg-white hover:bg-[#f0f4f2] border-gray-100 hover:border-[#6b857a] rounded-2xl p-6 transition-all flex flex-col items-center justify-center gap-3 group border shadow-sm cursor-pointer"
              disabled={isStudentsLoading}
              onClick={() => {
                setIsStudentsLoading(true);
                router.push(`/headteacher/dashboard/camp/${campId}/students`);
              }}
            >
              <div className="text-[#6b857a] group-hover:scale-110 transition-transform flex items-center justify-center w-[32px] h-[32px]">
                {isStudentsLoading ? (
                  <div className="w-8 h-8 border-3 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <BookOpen size={32} />
                )}
              </div>
              <span className="font-semibold text-sm text-center text-gray-700">
                ข้อมูล
                <br />
                นักเรียน
              </span>
            </button>
          </div>
        </div>

        {/* Camp Information - Collapsible */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          {/* Header - clickable toggle */}
          <button
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => setIsInfoOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0f4f2] flex items-center justify-center flex-shrink-0">
                <MapPin className="text-[#6b857a]" size={18} />
              </div>
              <h3 className="font-semibold text-gray-900">ข้อมูลค่าย</h3>
            </div>
            <div className="text-gray-400 transition-transform duration-200">
              {isInfoOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {/* Collapsible Body */}
          {isInfoOpen && (
            <div className="border-t border-gray-100 px-6 py-5">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2 font-medium text-gray-500">
                      <GraduationCap size={16} />
                      <span>ระดับชั้นที่เปิดรับ</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {camp.grades && camp.grades.length > 0 ? (
                        camp.grades.map((grade: string) => (
                          <Chip
                            key={grade}
                            className="bg-[#f0f4f2] text-[#5d7c6f] border border-[#d1e0d9]"
                            size="sm"
                            variant="flat"
                          >
                            {grade}
                          </Chip>
                        ))
                      ) : camp.grade_level ? (
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

                  <div className="pt-2">
                    <p className="text-gray-500 mb-2 font-medium">
                      ประเภทห้องเรียน/แผนการเรียน
                    </p>
                    {camp.gradeDisplayList && camp.gradeDisplayList.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {camp.gradeDisplayList.map(
                          (item: { type: string; grades: string[] }) => (
                            <div
                              key={item.type}
                              className="flex flex-col sm:flex-row sm:items-center bg-white border border-[#e4ebe8] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="bg-[#f0f4f2] px-3 py-1.5 sm:py-2 border-b sm:border-b-0 sm:border-r border-[#e4ebe8]">
                                <span className="text-[#3d5248] font-semibold text-sm">
                                  {item.type}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 px-3 py-2">
                                {item.grades.map((g) => (
                                  <span
                                    key={g}
                                    className="bg-white text-[#6b857a] text-xs font-medium px-2 py-0.5 rounded-md border border-[#e4ebe8]"
                                  >
                                    {g}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="font-medium text-gray-900 leading-relaxed bg-gray-50 px-3 py-2 rounded-lg inline-block border border-gray-100">
                        {camp.gradeDisplay || camp.plan_type_name || "ไม่ได้ระบุ"}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-500 mb-1">ช่วงเวลาเปิดรับสมัคร</p>
                    <p className="font-medium text-gray-900">
                      {camp.start_regis_date
                        ? formatDate(camp.start_regis_date)
                        : "N/A"}{" "}
                      -{" "}
                      {camp.end_regis_date
                        ? formatDate(camp.end_regis_date)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shirt Reservations - Collapsible */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          {/* Header - clickable toggle */}
          <button
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => setIsShirtOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0f4f2] flex items-center justify-center flex-shrink-0">
                <Shirt className="text-[#6b857a]" size={18} />
              </div>
              <h3 className="font-semibold text-gray-900">
                การจองและจัดการเสื้อ
              </h3>
              {camp.has_shirt ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  เปิดรับจอง
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                  ปิดรับจอง
                </span>
              )}
            </div>
            <div className="text-gray-400 transition-transform duration-200">
              {isShirtOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
          </button>

          {/* Collapsible Body */}
          {isShirtOpen && (
            <div className="border-t border-gray-100 px-6 py-5">
              {camp.has_shirt ? (
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Status + Date */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1">
                        ช่วงเวลาจอง
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        {camp.start_shirt_date && camp.end_shirt_date
                          ? `${formatDate(camp.start_shirt_date)} – ${formatDate(camp.end_shirt_date)}`
                          : "ไม่มีข้อมูล"}
                      </p>
                    </div>

                    {/* Show Shirt Images */}
                    {shirtImages.length > 0 && (
                      <div className="pt-1">
                        <p className="text-xs font-medium text-gray-400 mb-2">
                          ตัวอย่างเสื้อ
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {shirtImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center cursor-pointer"
                              onClick={() => setSelectedImage(img)}
                            >
                              <Image
                                fill
                                alt={`Shirt ${idx + 1}`}
                                className="object-cover hover:scale-110 transition-transform duration-300"
                                src={img}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Count + Button */}
                  {(camp.isOwner || camp.isHomeroomTeacher) && (
                    <div className="flex-shrink-0 w-full md:w-56 bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-medium text-gray-500">
                            ยอดการจองทั้งหมด
                          </p>
                          <div className="w-8 h-8 bg-[#f0f4f2] rounded-lg flex items-center justify-center">
                            <Shirt className="text-[#6b857a]" size={16} />
                          </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-extrabold text-gray-900">
                            {shirtCount !== null ? shirtCount : "—"}
                          </p>
                          <span className="text-sm font-medium text-gray-500">
                            ตัว
                          </span>
                        </div>
                      </div>

                      <button
                        className="w-full mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-[#6b857a] bg-white border-2 border-[#6b857a] hover:bg-[#6b857a] hover:text-white rounded-xl py-2.5 px-4 transition-all"
                        onClick={() => setIsShirtModalOpen(true)}
                      >
                        ดูรายการทั้งหมด
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M9 5l7 7-7 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <svg
                    className="w-5 h-5 text-gray-300 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-gray-400">
                    ค่ายนี้ไม่ได้เปิดจองเสื้อ
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Complete Schedule - Collapsible */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          {/* Header - clickable toggle */}
          <button
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            onClick={() => setIsScheduleOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0f4f2] flex items-center justify-center flex-shrink-0">
                <Clock className="text-[#6b857a]" size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-left">
                  กำหนดการค่าย
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {camp.daily_schedule?.length || 0} วัน
              </span>
            </div>
            <div className="text-gray-400 transition-transform duration-200">
              {isScheduleOpen ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </div>
          </button>

          {/* Collapsible Body */}
          {isScheduleOpen && (
            <div className="border-t border-gray-100 px-6 py-5 space-y-6">
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
              {(!camp.daily_schedule || camp.daily_schedule.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  ไม่มีข้อมูลกำหนดการ
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bases Section - แสดงเฉพาะเจ้าของค่าย */}
        {camp.isOwner && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  ฐานกิจกรรม
                </h3>
                <p className="text-sm text-gray-500">
                  จัดการฐานกิจกรรมและภารกิจ
                </p>
              </div>

              {camp.isOwner && (
                <Button
                  className="bg-[#6b857a] text-white"
                  isDisabled={navigatingToBase !== null}
                  onPress={() => {
                    if (navigatingToBase !== null) return;
                    setIsCreateBaseModalOpen(true);
                  }}
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
                    onClick={() => {
                      if (navigatingToBase !== null) return;
                      setNavigatingToBase(station.station_id);
                      router.push(
                        `/headteacher/dashboard/camp/${campId}/base/${station.station_id}`,
                      );
                    }}
                  >
                    {navigatingToBase === station.station_id && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/60 rounded-xl">
                        <div className="w-8 h-8 border-3 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
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
                            isDisabled={navigatingToBase !== null}
                            size="sm"
                            variant="light"
                            onClick={(e) => handleEditBase(station, e)}
                          >
                            <Pencil size={18} />
                          </Button>
                          <Button
                            isIconOnly
                            className="text-[#E84A5F] opacity-70 hover:opacity-100 hover:bg-[#E84A5F]/10 hover:text-[#FF847C]"
                            isDisabled={navigatingToBase !== null}
                            size="sm"
                            variant="light"
                            onClick={(e) =>
                              handleDeleteBase(station.station_id, e)
                            }
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
        )}

        {/* Survey Section - แสดงเฉพาะเจ้าของค่าย */}
        {camp.isOwner && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mt-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  แบบสอบถาม
                </h3>
                <p className="text-sm text-gray-500">
                  นักเรียนต้องทำแบบสอบถามก่อนดาวน์โหลดประกาศนียบัตร
                </p>
              </div>
              {camp.isOwner && !survey && (
                <Button
                  className="bg-[#6b857a] text-white justify-center px-8 py-4 "
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
                  className="p-4 rounded-xl border-2 border-gray-100 hover:border-[#6b857a] hover:bg-[#6b857a]/5 transition-all group cursor-pointer"
                  onClick={() => setIsSurveyResultsModalOpen(true)}
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
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ClipboardList size={14} />
                        <span>{survey.survey_question?.length || 0} คำถาม</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#6b857a] font-medium">
                        <Users size={14} />
                        <span>
                          {survey._count?.survey_response || 0} การตอบกลับ
                        </span>
                      </div>
                    </div>
                    <Button
                      className="bg-indigo-50 text-indigo-600 font-medium"
                      size="sm"
                      startContent={<BarChart3 size={14} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSurveyResultsModalOpen(true);
                      }}
                    >
                      ดูผลประเมิน
                    </Button>
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
                      startContent={<Plus size={24} />}
                      onPress={() => setIsCreateSurveyModalOpen(true)}
                    >
                      เริ่มสร้างแบบสอบถาม
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
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
        isOpen={isCreateSurveyModalOpen}
        teacherId={camp?.created_by_teacher_id || 0}
        onClose={() => setIsCreateSurveyModalOpen(false)}
        onSurveyCreated={fetchSurvey}
      />

      <CreateSurveyModal
        campId={Number(campId)}
        initialData={survey}
        isOpen={isEditSurveyModalOpen}
        teacherId={camp?.created_by_teacher_id || 0}
        onClose={() => setIsEditSurveyModalOpen(false)}
        onSurveyCreated={fetchSurvey}
      />

      <SurveyResultsModal
        campId={Number(campId)}
        isOpen={isSurveyResultsModalOpen}
        onClose={() => setIsSurveyResultsModalOpen(false)}
      />

      <TrackingModal
        campId={Number(campId)}
        campName={camp?.name || ""}
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />

      {camp && (
        <ShirtTrackingModal
          campId={camp.camp_id}
          campName={camp.name}
          isOpen={isShirtModalOpen}
          onClose={() => setIsShirtModalOpen(false)}
        />
      )}

      {camp && (
        <AttendanceModal
          campId={camp.camp_id}
          campName={camp.name}
          isOpen={isAttendanceModalOpen}
          onClose={() => setIsAttendanceModalOpen(false)}
        />
      )}
      <PrePostTestModal
        campId={Number(campId)}
        isOpen={isPrePostTestModalOpen}
        onClose={() => setIsPrePostTestModalOpen(false)}
      />

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
              onClick={() => setSelectedImage(null)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <img
              alt="Expanded view"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              src={selectedImage}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
