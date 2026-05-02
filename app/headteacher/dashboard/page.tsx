"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import useSWR from "swr";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/react";
import { Pagination } from "@heroui/pagination";
import {
  MapPin,
  Calendar,
  ChevronRight,
  ImageOff,
  Tent,
  GraduationCap,
  Users,
  Trash2,
  Pencil,
  Smile,
  ClipboardCheck,
  Star,
  HeartPulse,
  ShieldAlert,
  Info,
  Search,
  Sparkles,
  Flag,
} from "lucide-react";
import { useRouter } from "next/navigation";

import StatsCard from "./StatsCard";
import CreateCampModal from "./CreateCampModal";
import SelectProjectTypeModal from "./SelectProjectTypeModal";
import EditCampModal from "./camp/EditCampModal";
import EnrollmentModal from "./EnrollmentModal";
import HomeroomStudentModal from "./HomeroomStudentModal";

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

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (res.status === 401) throw new Error("Unauthorized");

    return res.json();
  });

function DashboardContent() {
  const { showSuccess, showError, showConfirm, setIsLoading } =
    useStatusModal();
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
  const { data: rawCamps, mutate: mutateCamps } = useSWR("/api/camps", fetcher);
  const { data: statsData, mutate: mutateStats } = useSWR(
    "/api/camps/stats",
    fetcher,
  );
  const { data: teacherInfo } = useSWR("/api/auth/me", fetcher);
  const { data: dbAcademicYears } = useSWR("/api/academic_years", fetcher);
  const { data: homeroomData, isLoading: loadingHomeroom } = useSWR(
    "/api/teacher/homeroom",
    fetcher,
  );

  const stats = statsData || {
    totalCamps: 0,
    activeCamps: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    totalTeachers: 0,
    avgEnrollment: 0,
    avgSatisfaction: 0,
    avgScore: 0,
    surveyResponseRate: 0,
  };

  const loading = !rawCamps || !statsData || !teacherInfo || !dbAcademicYears;
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get("tab") || "camp";
  const [isSelectTypeOpen, setIsSelectTypeOpen] = useState(false);
  const [isCreateCampOpen, setIsCreateCampOpen] = useState(false);
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(
    null,
  );
  const [selectedTemplateData, setSelectedTemplateData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampData, setEditingCampData] = useState<any>(null);
  const [isEditFetching, setIsEditFetching] = useState(false);

  // Enrollment Modal State
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentCampId, setEnrollmentCampId] = useState<number | null>(null);
  const [enrollmentCampName, setEnrollmentCampName] = useState("");

  // Homeroom State
  const [homeroomSearch, setHomeroomSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [homeroomFilter, setHomeroomFilter] = useState("all");
  const [homeroomPage, setHomeroomPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setHomeroomPage(1);
  }, [homeroomSearch, homeroomFilter]);

  const allHomeroomStudents =
    homeroomData?.students?.filter((s: any) => {
      const searchLower = homeroomSearch.toLowerCase();
      const fullName =
        `${s.prefix || ""}${s.firstname} ${s.lastname}`.toLowerCase();
      const matchesSearch =
        s.id.toString().includes(searchLower) || fullName.includes(searchLower);

      let matchesFilter = true;

      if (homeroomFilter === "allergy") {
        matchesFilter =
          s.foodAllergy && s.foodAllergy !== "-" && s.foodAllergy !== "ไม่มี";
      } else if (homeroomFilter === "disease") {
        matchesFilter =
          s.chronicDisease &&
          s.chronicDisease !== "-" &&
          s.chronicDisease !== "ไม่มี";
      } else if (homeroomFilter === "remark") {
        matchesFilter = s.remark && s.remark !== "-" && s.remark !== "ไม่มี";
      }

      return matchesSearch && matchesFilter;
    }) || [];

  const homeroomTotalPages =
    Math.ceil(allHomeroomStudents.length / itemsPerPage) || 1;
  const filteredHomeroomStudents = allHomeroomStudents.slice(
    (homeroomPage - 1) * itemsPerPage,
    homeroomPage * itemsPerPage,
  );

  const pathname = usePathname();

  // Reset navigatingTo เมื่อ pathname กลับมาที่หน้า dashboard (เช่น กด Back จากหน้าค่าย)
  useEffect(() => {
    if (pathname === "/headteacher/dashboard") {
      setNavigatingTo(null);
    }
  }, [pathname]);

  const goToCampDetail = (campId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(campId);
    router.push(`/headteacher/dashboard/camp/${campId}`);
  };

  const camps = useMemo(() => {
    if (!rawCamps) return [];

    return rawCamps.map((camp: any) => {
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
        startDate: start.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        endDate: end.toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        enrolled: camp._count?.student_enrollment || 0,
        totalStudents: (camp.camp_classroom || []).reduce(
          (sum: number, cc: any) =>
            sum + (cc.classroom?._count?.classroom_students ?? 0),
          0,
        ),
        image: camp.img_camp_url || null,
        isOwner: camp.isOwner,
        ownerName: camp.created_by
          ? `${camp.created_by.firstname} ${camp.created_by.lastname}`.trim()
          : "",
        grades: camp.grades || [],
        gradeDisplay: camp.gradeDisplay || "",
        academicYear: camp.academicYear || "",
      };
    });
  }, [rawCamps]);

  // Handled by SWR

  useEffect(() => {
    if (dbAcademicYears) {
      const activeYear = dbAcademicYears.find(
        (y: any) =>
          y.status === "แอคทีฟ" ||
          y.status === "Active" ||
          y.status === "ใช้งาน",
      );

      if (activeYear) {
        setCampAcademicYearFilter(activeYear.year.toString());
      }
    }
  }, [dbAcademicYears]);

  // Tab is now driven by URL searchParams via sidebar navigation

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
          setIsLoading(true);
          const response = await fetch(`/api/camps/${campId}`, {
            method: "DELETE",
          });

          const result = await response.json();

          if (response.ok) {
            showSuccess("สำเร็จ", "ลบค่ายสำเร็จ!");
            mutateCamps();
            mutateStats();
          } else {
            showError("ผลการดำเนินงาน", `ลบค่ายไม่สำเร็จ: ${result.error}`);
          }
        } catch (error) {
          console.error("Error deleting camp:", error);
          showError("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการลบค่าย");
        } finally {
          setIsLoading(false);
        }
      },
      "ลบ",
    );
  };

  // ...

  const handleCreateCampSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      console.log("Data being sent:", data); // Debug: ดูข้อมูลที่ส่งไป

      let img_camp_url = "";

      // Upload camp image to Cloudinary if it exists
      if (data.campImageFile) {
        try {
          const compressedFile = await compressImage(data.campImageFile);
          const formData = new FormData();

          formData.append("file", compressedFile);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();

            img_camp_url = uploadData.url;
            console.log("Uploaded camp image:", img_camp_url);
          } else {
            console.error("Failed to upload camp image");
            showError(
              "อัปโหลดรูปล้มเหลว",
              "ไม่สามารถอัปโหลดรูปภาพหน้าปกค่ายได้ แต่จะดำเนินการสร้างค่ายต่อ",
            );
          }
        } catch (uploadErr) {
          console.error("Error during upload:", uploadErr);
          showError(
            "อัปโหลดรูปล้มเหลว",
            "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพหน้าปกค่าย",
          );
        }
      }

      // Upload shirt images (up to 3) to Cloudinary
      const shirtUrls: string[] = [];

      if (data.shirtImageFiles && Array.isArray(data.shirtImageFiles)) {
        for (const file of data.shirtImageFiles) {
          if (file) {
            try {
              const compressedFile = await compressImage(file);
              const formData = new FormData();

              formData.append("file", compressedFile);
              const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });

              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();

                shirtUrls.push(uploadData.url);
              }
            } catch (uploadErr) {
              console.error("Error uploading shirt image:", uploadErr);
            }
          }
        }
      }
      const img_shirt_url = JSON.stringify(shirtUrls);

      // ส่งข้อมูลไปยัง API เพื่อสร้างค่ายใหม่
      const response = await fetch("/api/camps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          description: data.description || "",
          hasShirt: data.hasShirt,
          classroom_ids: data.classroom_ids,
          projectType: selectedProjectType,
          gradeLevel: data.gradeLevel,
          classroomType: data.classroomType,
          dailySchedule: data.dailySchedule,
          saveAsTemplate: data.saveAsTemplate,
          templateName: data.templateName,
          img_shirt_url: img_shirt_url,
          img_camp_url: img_camp_url,
        }),
      });

      const result = await response.json();

      console.log("API Response:", result); // Debug: ดู response จาก API

      if (response.ok) {
        console.log("Camp created successfully");
        showSuccess("สำเร็จ", "สร้างค่ายสำเร็จ!");
        mutateCamps();
        mutateStats();
        setIsCreateCampOpen(false); // Close modal on success
        setSelectedProjectType(null);
      } else {
        console.error("Failed to create camp:", result.error);
        showError("ล้มเหลว", `สร้างค่ายไม่สำเร็จ: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating camp:", error);
      showError("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการสร้างค่าย");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCampClick = async (campId: number) => {
    try {
      setIsEditFetching(true);
      const response = await fetch(`/api/camps/${campId}`);

      if (!response.ok) throw new Error("Failed to fetch camp data");
      const data = await response.json();

      setEditingCampData(data);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching camp for edit:", error);
      showError("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลค่ายเพื่อแก้ไขได้");
    } finally {
      setIsEditFetching(false);
    }
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);

      let img_shirt_url = formData.shirtImage || "";
      let img_camp_url = formData.campImage || "";

      // Upload new shirt images if files were picked
      let finalShirtUrls: (string | null)[] = [];

      try {
        const parsed = JSON.parse(
          formData.shirtImages ? JSON.stringify(formData.shirtImages) : "[]",
        );

        finalShirtUrls = Array.isArray(parsed)
          ? parsed
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
          }
        } catch (uploadErr) {
          console.error("Error during camp image upload:", uploadErr);
        }
      }

      const response = await fetch(`/api/camps/${editingCampData.camp_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          img_shirt_url,
          img_camp_url,
        }),
      });

      if (!response.ok) {
        const result = await response.json();

        throw new Error(result.error || "Failed to edit camp");
      }

      showSuccess("สำเร็จ", "อัปเดตข้อมูลค่ายเรียบร้อยแล้ว");
      setIsEditModalOpen(false);
      setEditingCampData(null);
      mutateCamps();
    } catch (error: any) {
      console.error("Error editing camp:", error);
      showError("ข้อผิดพลาด", error.message || "ไม่สามารถอัปเดตข้อมูลค่ายได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
    กำลังจัด: {
      bg: "bg-[#5d7c6f]",
      text: "text-white",
    },
    ยังไม่เริ่ม: {
      bg: "bg-[#d4c5b0]",
      text: "text-[#5a4a3a]",
    },
    เสร็จสิ้น: {
      bg: "bg-gray-200",
      text: "text-gray-600",
    },
  };

  const [campStatusFilter, setCampStatusFilter] = useState("all");
  const [campRoleFilter, setCampRoleFilter] = useState("all"); // "all", "owner", "related"
  const [campAcademicYearFilter, setCampAcademicYearFilter] = useState("all");

  const filteredMyCamps = camps.filter((camp: any) => {
    if (campStatusFilter !== "all" && camp.status !== campStatusFilter)
      return false;
    if (campRoleFilter === "owner" && !camp.isOwner) return false;
    if (campRoleFilter === "related" && camp.isOwner) return false;
    if (
      campAcademicYearFilter !== "all" &&
      String(camp.academicYear) !== String(campAcademicYearFilter)
    )
      return false;

    return true;
  });

  return (
    <div className="bg-[#f5f5f2] min-h-full">
      {/* Edit-fetch loading overlay */}
      {isEditFetching && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-[#6b857a]/20 border-t-[#6b857a] animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-[#2d3748] text-base">
                กำลังโหลดข้อมูลค่าย
              </p>
              <p className="text-sm text-gray-400 mt-0.5">กรุณารอสักครู่...</p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Greeting Card (Student Style) */}
        <div className="bg-[#5d7c6f] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden mb-8">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
              สวัสดีคุณครู{teacherInfo?.firstname || "หัวหน้าค่าย"}{" "}
              <Sparkles className="text-white" size={28} />
            </h1>
            <p className="opacity-90 mb-6 text-sm sm:text-base">
              ยินดีต้อนรับเข้าสู่ระบบ KKS Camp | จัดการค่ายและติดตามการเรียนรู้ของนักเรียน
            </p>

            <div className="flex flex-wrap gap-2">
              {teacherInfo?.classroomName && (
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/10">
                  <Users size={14} />
                  <span>ประจำชั้น:</span> {teacherInfo.classroomName}
                </span>
              )}
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/10">
                <Tent size={14} />
                <span>สถานะ:</span> {teacherInfo?.classroomName ? "ครูประจำชั้น" : "ครูทั่วไป"}
              </span>
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/10">
                <Calendar size={14} />
                <span>ปีการศึกษา:</span> {new Date().getFullYear() + 543}
              </span>
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <Flag size={160} />
          </div>
        </div>

        {/* Cards */}
        {selectedTab === "overview" && (
          <div className="w-full">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">กำลังโหลดข้อมูลสถิติ...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full">
                <div className="grid grid-cols-2 grid-rows-2 lg:gap-6 md:gap-4 gap-3">
                  <StatsCard
                    icon={Tent}
                    subtitle={`${stats.activeCamps} กำลังจัด`}
                    title="ค่ายทั้งหมด"
                    value={stats.totalCamps}
                  />

                  <StatsCard
                    icon={Star}
                    subtitle="จากแบบประเมินทั้งหมด"
                    title="คะแนนค่ายเฉลี่ย"
                    value={`${stats.avgScore || 0} / 5`}
                  />

                  <StatsCard
                    icon={Smile}
                    subtitle="จากแบบสำรวจความพึงพอใจ"
                    title="ความพึงพอใจเฉลี่ย"
                    value={`${stats.avgSatisfaction}%`}
                  />

                  <StatsCard
                    icon={ClipboardCheck}
                    subtitle="สัดส่วนผู้ทำแบบสำรวจ"
                    title="อัตราการตอบกลับ"
                    value={`${stats.surveyResponseRate}%`}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Homeroom Tab */}
        {selectedTab === "homeroom" && (
          <div className="w-full space-y-6">
            {!homeroomData?.hasHomeroom ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Info className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  ไม่พบข้อมูลชั้นเรียนประจำ
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  คุณยังไม่ได้ถูกกำหนดให้เป็นครูประจำชั้นของห้องใดๆ ในระบบ
                  หากต้องการตรวจสอบข้อมูล กรุณาติดต่อผู้ดูแลระบบ (Admin)
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#5d7c6f] border border-[#4a6358] rounded-2xl px-6 py-5 shadow-sm">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="text-emerald-100" size={24} />
                      นักเรียนประจำชั้น {homeroomData.classroomName}
                    </h2>
                    <p className="text-sm text-emerald-50/80 mt-1">
                      มีนักเรียนทั้งหมด {homeroomData.students?.length || 0} คน
                    </p>
                  </div>

                  {/* Special Care summary box */}
                  <div className="bg-[#f5f5f2] backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <HeartPulse className="text-rose-500" size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        ต้องการดูแลเป็นพิเศษ
                      </p>
                      <p className="text-lg font-bold text-rose-600">
                        {homeroomData.students?.filter(
                          (s: any) => s.isSpecialCare,
                        ).length || 0}{" "}
                        คน
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 w-full">
                    <h3 className="text-xl font-semibold text-gray-900 w-full sm:w-auto">
                      รายชื่อนักเรียน
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="w-[200px]">
                        <Select
                          aria-label="ตัวกรอง"
                          className="w-full"
                          classNames={{
                            trigger:
                              "bg-white border border-gray-100 text-gray-700 font-medium h-10",
                          }}
                          placeholder="ตัวกรองทั้งหมด"
                          selectedKeys={[homeroomFilter]}
                          size="sm"
                          onChange={(e) => setHomeroomFilter(e.target.value)}
                        >
                          <SelectItem key="all" textValue="แสดงทั้งหมด">
                            แสดงทั้งหมด
                          </SelectItem>
                          <SelectItem key="allergy" textValue="แพ้อาหาร">
                            แพ้อาหาร
                          </SelectItem>
                          <SelectItem key="disease" textValue="โรคประจำตัว">
                            โรคประจำตัว
                          </SelectItem>
                          <SelectItem key="remark" textValue="หมายเหตุอื่นๆ">
                            หมายเหตุอื่นๆ
                          </SelectItem>
                        </Select>
                      </div>
                      <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          className="block w-full pl-10 pr-3 h-10 border border-gray-100 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#6b857a] focus:border-[#6b857a] transition-colors text-sm"
                          placeholder="ค้นหาชื่อ, นามสกุล หรือเลขประจำตัว..."
                          type="text"
                          value={homeroomSearch}
                          onChange={(e) => setHomeroomSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-100">
                          <th className="p-4 font-semibold rounded-tl-lg">
                            รหัสนักเรียน
                          </th>
                          <th className="p-4 font-semibold">ชื่อ-นามสกุล</th>
                          <th className="p-4 font-semibold">โรคประจำตัว</th>
                          <th className="p-4 font-semibold">อาหารที่แพ้</th>
                          <th className="p-4 font-semibold rounded-tr-lg w-1/4">
                            หมายเหตุ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingHomeroom ? (
                          <tr>
                            <td
                              className="p-8 text-center text-gray-400"
                              colSpan={5}
                            >
                              กำลังโหลดข้อมูล...
                            </td>
                          </tr>
                        ) : filteredHomeroomStudents.length === 0 ? (
                          <tr>
                            <td
                              className="p-12 text-center text-gray-400"
                              colSpan={5}
                            >
                              {homeroomSearch
                                ? "ไม่พบนักเรียนที่ค้นหา"
                                : "ยังไม่มีนักเรียนในห้องนี้"}
                            </td>
                          </tr>
                        ) : (
                          filteredHomeroomStudents.map((student: any) => (
                            <tr
                              key={student.id}
                              className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${student.isSpecialCare ? "bg-rose-50/20" : ""}`}
                              onClick={() => setSelectedStudent(student)}
                            >
                              <td className="p-4 text-sm text-gray-900 font-medium">
                                {student.id}
                              </td>
                              <td className="p-4 text-gray-900">
                                <div className="flex items-center gap-2">
                                  <span>
                                    {student.prefix}
                                    {student.firstname} {student.lastname}
                                  </span>
                                  {student.isSpecialCare && (
                                    <span title="ต้องการดูแลเป็นพิเศษ">
                                      <ShieldAlert
                                        className="text-rose-500"
                                        size={14}
                                      />
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                {student.chronicDisease &&
                                student.chronicDisease !== "-" &&
                                student.chronicDisease !== "ไม่มี" ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    {student.chronicDisease}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                {student.foodAllergy &&
                                student.foodAllergy !== "-" &&
                                student.foodAllergy !== "ไม่มี" ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                    {student.foodAllergy}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                {student.remark &&
                                student.remark !== "-" &&
                                student.remark !== "ไม่มี" ? (
                                  <span className="text-sm text-blue-700 font-medium">
                                    {student.remark}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {!loadingHomeroom && homeroomTotalPages > 1 && (
                    <div className="flex justify-center items-center mt-6">
                      <Pagination
                        isCompact
                        showControls
                        classNames={{
                          cursor: "bg-[#5d7c6f] text-white font-bold",
                        }}
                        color="default"
                        page={homeroomPage}
                        total={homeroomTotalPages}
                        onChange={setHomeroomPage}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {selectedTab === "camp" && (
          <div className="space-y-6">
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
            <div className="grid grid-cols-3 sm:flex sm:flex-row sm:justify-end gap-2 w-full mt-4 sm:mt-0">
              {/* Academic Year Filter */}
              <div className="col-span-1 sm:w-[180px] sm:min-w-[180px]">
                <Select
                  aria-label="Select Academic Year"
                  className="w-full"
                  classNames={{
                    trigger:
                      "bg-white border border-gray-100 text-gray-700 font-medium",
                  }}
                  placeholder="ปีการศึกษา"
                  selectedKeys={[campAcademicYearFilter]}
                  size="sm"
                  onChange={(e) => setCampAcademicYearFilter(e.target.value)}
                >
                  {[{ year: "all" }, ...(dbAcademicYears || [])].map((item) => (
                    <SelectItem
                      key={String(item.year)}
                      textValue={
                        item.year === "all"
                          ? "ปีการศึกษา: ทั้งหมด"
                          : `ปีการศึกษา: ${(parseInt(item.year) + 543).toString()}`
                      }
                    >
                      {item.year === "all"
                        ? "ทั้งหมด"
                        : `${parseInt(item.year) + 543}`}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Status Filter */}
              <div className="col-span-1 sm:w-[160px] sm:min-w-[160px]">
                <Select
                  aria-label="สถานะ"
                  className="w-full"
                  classNames={{
                    trigger:
                      "bg-white border border-gray-100 text-gray-700 font-medium",
                  }}
                  placeholder="สถานะ"
                  selectedKeys={[campStatusFilter]}
                  size="sm"
                  onChange={(e) => setCampStatusFilter(e.target.value)}
                >
                  <SelectItem key="all" textValue="สถานะ: ทั้งหมด">
                    สถานะ: ทั้งหมด
                  </SelectItem>
                  <SelectItem key="กำลังจัด" textValue="สถานะ: กำลังจัด">
                    กำลังจัด
                  </SelectItem>
                  <SelectItem key="ยังไม่เริ่ม" textValue="สถานะ: ยังไม่เริ่ม">
                    ยังไม่เริ่ม
                  </SelectItem>
                  <SelectItem key="เสร็จสิ้น" textValue="สถานะ: เสร็จสิ้น">
                    เสร็จสิ้น
                  </SelectItem>
                </Select>
              </div>

              {/* Role Filter (Dropdown) */}
              <div className="col-span-1 sm:w-[210px] sm:min-w-[210px]">
                <Select
                  aria-label="ประเภท"
                  className="w-full"
                  classNames={{
                    trigger:
                      "bg-white border border-gray-100 text-gray-700 font-medium",
                  }}
                  placeholder="ประเภท"
                  selectedKeys={[campRoleFilter]}
                  size="sm"
                  onChange={(e) => setCampRoleFilter(e.target.value)}
                >
                  <SelectItem key="all" textValue="ประเภท: ทั้งหมด">
                    ประเภท: ทั้งหมด
                  </SelectItem>
                  <SelectItem key="owner" textValue="ประเภท: ค่ายที่สร้าง">
                    ค่ายที่สร้าง
                  </SelectItem>
                  <SelectItem
                    key="related"
                    textValue="ประเภท: ค่ายที่เกี่ยวข้อง"
                  >
                    ค่ายที่เกี่ยวข้อง
                  </SelectItem>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">กำลังโหลดข้อมูลค่าย...</p>
                </div>
              </div>
            ) : filteredMyCamps.length === 0 ? (
              <div className="w-full py-20 text-center text-gray-500">
                ยังไม่มีค่ายในขณะนี้
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredMyCamps.map((camp: any) => (
                  <div
                    key={camp.id}
                    className="cursor-pointer"
                    onClick={() => goToCampDetail(camp.id)}
                  >
                    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white relative group h-full">
                      {/* Image */}
                      <div
                        className={`relative h-48 overflow-hidden ${navigatingTo === camp.id ? "opacity-60" : ""}`}
                      >
                        {navigatingTo === camp.id && (
                          <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/40">
                            <div className="w-8 h-8 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {camp.isOwner && (
                          <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                            <button
                              className="p-2 bg-[#5d7c6f] text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#4a6358] shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={loading || isSubmitting}
                              title="แก้ไขค่าย"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (loading || isSubmitting) return;
                                handleEditCampClick(camp.id);
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="p-2 bg-[#E84A5F] text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF847C] shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={loading}
                              title="ลบค่าย"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (loading) return;
                                handleDeleteCamp(camp.id, camp.title);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        {camp.image ? (
                          <img
                            alt={camp.title}
                            className="w-full h-full object-cover"
                            src={camp.image}
                          />
                        ) : (
                          <DefaultCampImage />
                        )}
                      </div>

                      <CardBody className="p-4 sm:p-6 flex flex-col">
                        {/* Status + Owner row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Chip
                            className={`
                              ${STATUS_STYLES[camp.status]?.bg ?? "bg-gray-100"}
                              ${STATUS_STYLES[camp.status]?.text ?? "text-gray-600"}
                            `}
                            size="sm"
                            variant="shadow"
                          >
                            {camp.status}
                          </Chip>
                          {camp.isOwner ? (
                            <span
                              className="inline-block max-w-[160px] truncate text-xs px-2 py-0.5 rounded-full bg-[#e8f0ee] text-[#3d6357] border border-[#b8d0c8]"
                              title={`เจ้าของค่าย: ${camp.ownerName}`}
                            >
                              เจ้าของ: {camp.ownerName}
                            </span>
                          ) : camp.ownerName ? (
                            <span
                              className="inline-block max-w-[160px] truncate text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                              title={`ผู้สร้าง: ${camp.ownerName}`}
                            >
                              เจ้าของ: {camp.ownerName}
                            </span>
                          ) : null}
                        </div>
                        <div className="mb-3">
                          <h3 className="text-base sm:text-lg font-bold mb-1 text-[#2d3748] leading-snug line-clamp-2">
                            {camp.title}
                          </h3>
                          <p className="mb-1 text-[#718096] text-sm line-clamp-2 leading-relaxed">
                            {camp.description}
                          </p>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 mb-1.5 text-[#718096] text-sm">
                          <MapPin className="flex-shrink-0" size={16} />
                          <span className="truncate" title={camp.location}>
                            {camp.location}
                          </span>
                        </div>

                        {/* Grades */}
                        {camp.gradeDisplay && (
                          <div className="flex items-start gap-2 mb-2 text-[#718096] text-sm">
                            <GraduationCap
                              className="flex-shrink-0 mt-0.5"
                              size={16}
                            />
                            <span
                              className="line-clamp-1"
                              title={`ระดับชั้น: ${camp.gradeDisplay}`}
                            >
                              ระดับชั้น: {camp.gradeDisplay}
                            </span>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 mb-3 text-[#718096] text-sm">
                          <Calendar className="flex-shrink-0" size={16} />
                          <span className="truncate">
                            {camp.startDate} - {camp.endDate}
                          </span>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-[#e2e8f0] mt-auto">
                          <span className="text-[#718096] text-sm">
                            ลงทะเบียนแล้ว {camp.enrolled}/{camp.totalStudents} คน
                          </span>
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              className="bg-transparent text-[#5d7c6f] font-semibold hover:opacity-70"
                              endContent={
                                navigatingTo === camp.id ? null : (
                                  <ChevronRight size={20} />
                                )
                              }
                              isDisabled={navigatingTo !== null}
                              isLoading={navigatingTo === camp.id}
                              onPress={() => goToCampDetail(camp.id)}
                            >
                              ดูรายละเอียด
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
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
        isLoading={isSubmitting}
        isOpen={isCreateCampOpen}
        projectType={selectedProjectType}
        templateData={selectedTemplateData}
        onClose={() => {
          setIsCreateCampOpen(false);
          setSelectedProjectType(null);
          setSelectedTemplateData(null);
        }}
        onSubmit={handleCreateCampSubmit}
      />

      <EnrollmentModal
        campId={enrollmentCampId ?? 0}
        campName={enrollmentCampName}
        isOpen={isEnrollmentModalOpen}
        onClose={() => setIsEnrollmentModalOpen(false)}
      />

      <EditCampModal
        campData={editingCampData}
        isLoading={isSubmitting}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCampData(null);
        }}
        onSubmit={handleEditSubmit}
      />

      <HomeroomStudentModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f2]">
          <div className="w-16 h-16 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
