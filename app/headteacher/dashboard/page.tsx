"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Select, SelectItem } from "@heroui/react";
import {
  MapPin,
  Calendar,
  ChevronRight,
  ImageOff,
  Tent,
  GraduationCap,
  Users,
  TrendingUp,
  Trash2,
  Pencil,
  Target,
  Layout,
  Smile,
  ClipboardCheck,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";

import StatsCard from "./StatsCard";
import CreateCampModal from "./CreateCampModal";
import SelectProjectTypeModal from "./SelectProjectTypeModal";
import EditCampModal from "./camp/EditCampModal";
import EnrollmentModal from "./EnrollmentModal";

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
  const { showSuccess, showError, showConfirm, setIsLoading } = useStatusModal();
  const router = useRouter();
  const [camps, setCamps] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCamps: 0,
    activeCamps: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    totalTeachers: 0,
    avgEnrollment: 0,
    avgSatisfaction: 0,
    avgScore: 0,
    surveyResponseRate: 0,
  });
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [dbAcademicYears, setDbAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
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

  // Enrollment Modal State
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentCampId, setEnrollmentCampId] = useState<number | null>(null);
  const [enrollmentCampName, setEnrollmentCampName] = useState("");

  const goToCampDetail = (campId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(campId);
    router.push(`/headteacher/dashboard/camp/${campId}`);
  };

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
          startDate: start.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }),
          endDate: end.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }),
          enrolled: camp._count?.student_enrollment || 0,
          totalStudents: (camp.camp_classroom || []).reduce((sum: number, cc: any) => sum + (cc.classroom?._count?.classroom_students ?? 0), 0),
          image: camp.img_camp_url || null,
          isOwner: camp.isOwner,
          ownerName: camp.created_by ? `${camp.created_by.firstname} ${camp.created_by.lastname}`.trim() : "",
          grades: camp.grades || [],
          gradeDisplay: camp.gradeDisplay || "",
          academicYear: camp.academicYear || "",
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

      if (response.status === 401) {
        router.push("/");   // Clerk login อยู่ที่ /
        return;
      }

      if (!response.ok) return;

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };


  const fetchTeacher = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        setTeacherInfo(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch teacher:", err);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch("/api/academic_years");
      if (res.ok) {
        const data = await res.json();
        setDbAcademicYears(data);
        const activeYear = data.find((y: any) => 
          y.status === "แอคทีฟ" || y.status === "Active" || y.status === "ใช้งาน"
        );
        if (activeYear) {
          setCampAcademicYearFilter(activeYear.year.toString());
        }
      }
    } catch (err) {
      console.error("Failed to fetch academic years:", err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchCamps(), fetchStats(), fetchTeacher(), fetchAcademicYears()]);
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
          setIsLoading(true);
          const response = await fetch(`/api/camps/${campId}`, {
            method: "DELETE",
          });

          const result = await response.json();

          if (response.ok) {
            showSuccess("สำเร็จ", "ลบค่ายสำเร็จ!");
            await fetchCamps();
            await fetchStats();
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
          const formData = new FormData();
          formData.append("file", data.campImageFile);

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
            showError("อัปโหลดรูปล้มเหลว", "ไม่สามารถอัปโหลดรูปภาพหน้าปกค่ายได้ แต่จะดำเนินการสร้างค่ายต่อ");
          }
        } catch (uploadErr) {
          console.error("Error during upload:", uploadErr);
          showError("อัปโหลดรูปล้มเหลว", "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพหน้าปกค่าย");
        }
      }

      // Upload shirt images (up to 3) to Cloudinary
      const shirtUrls: string[] = [];
      if (data.shirtImageFiles && Array.isArray(data.shirtImageFiles)) {
        for (const file of data.shirtImageFiles) {
          if (file) {
            try {
              const formData = new FormData();
              formData.append("file", file);
              const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
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
        // Refresh camps list
        await fetchCamps();
        await fetchStats();
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
      setIsLoading(true);
      const response = await fetch(`/api/camps/${campId}`);
      if (!response.ok) throw new Error("Failed to fetch camp data");
      const data = await response.json();
      setEditingCampData(data);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching camp for edit:", error);
      showError("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลค่ายเพื่อแก้ไขได้");
    } finally {
      setIsLoading(false);
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
        const parsed = JSON.parse(formData.shirtImages ? JSON.stringify(formData.shirtImages) : "[]");
        finalShirtUrls = Array.isArray(parsed) ? parsed : [formData.shirtImages];
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

      if (formData.campImageFile) {
        try {
          const uploadForm = new FormData();
          uploadForm.append("file", formData.campImageFile);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
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
      await fetchCamps();
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

  const filteredMyCamps = camps.filter((camp) => {
    if (campStatusFilter !== "all" && camp.status !== campStatusFilter) return false;
    if (campRoleFilter === "owner" && !camp.isOwner) return false;
    if (campRoleFilter === "related" && camp.isOwner) return false;
    if (campAcademicYearFilter !== "all" && String(camp.academicYear) !== String(campAcademicYearFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-[#2d3748]">
            ยินดีต้อนรับ, ครู{teacherInfo?.firstname || "หัวหน้าค่าย"}{teacherInfo?.classroomName ? ` ประจำชั้น ${teacherInfo.classroomName}` : ""}
          </h1>
          <p className="text-lg text-gray-500">
            จัดการค่ายและติดตามการเรียนรู้ของนักเรียน
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 w-full">
          <Tabs
            classNames={{
              base: "w-full",
              tabList:
                "w-full bg-[#EBE7DD] rounded-full p-1 flex overflow-x-auto md:overflow-visible scrollbar-hide",
              tab: "flex-1 px-6 py-3 whitespace-nowrap flex-shrink-0 md:flex-1 justify-center",
              cursor: "rounded-full",
              tabContent: "font-semibold text-center",
            }}
            selectedKey={selectedTab}
            size="lg"
            onSelectionChange={(key) => setSelectedTab(String(key))}
          >
            <Tab key="overview" title="ภาพรวม" />
            <Tab key="camp" title="ค่ายที่เกี่ยวข้อง" />
          </Tabs>
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
            <div className="flex flex-col sm:flex-row justify-end gap-2 w-full mt-4 sm:mt-0">
              {/* Academic Year Filter */}
              <div className="w-full sm:w-[180px] min-w-[180px]">
                <Select
                  aria-label="Select Academic Year"
                  placeholder="ปีการศึกษา: ทั้งหมด"
                  className="w-full"
                  size="sm"
                  selectedKeys={[campAcademicYearFilter]}
                  onChange={(e) => setCampAcademicYearFilter(e.target.value)}
                  classNames={{ trigger: "bg-white border border-gray-100 text-gray-700 font-medium" }}
                >
                  {[{year: "all"}, ...dbAcademicYears].map(item => (
                    <SelectItem 
                      key={String(item.year)} 
                      textValue={item.year === "all" ? "ปีการศึกษา: ทั้งหมด" : `ปีการศึกษา: ${(parseInt(item.year) + 543).toString()}`}
                    >
                      {item.year === "all" ? "ปีการศึกษา: ทั้งหมด" : `ปีการศึกษา: ${parseInt(item.year) + 543}`}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-[160px] min-w-[160px]">
                <Select
                  aria-label="สถานะ"
                  placeholder="สถานะ: ทั้งหมด"
                  className="w-full"
                  size="sm"
                  selectedKeys={[campStatusFilter]}
                  onChange={(e) => setCampStatusFilter(e.target.value)}
                  classNames={{ trigger: "bg-white border border-gray-100 text-gray-700 font-medium" }}
                >
                  <SelectItem key="all" textValue="สถานะ: ทั้งหมด">สถานะ: ทั้งหมด</SelectItem>
                  <SelectItem key="กำลังจัด" textValue="สถานะ: กำลังจัด">สถานะ: กำลังจัด</SelectItem>
                  <SelectItem key="ยังไม่เริ่ม" textValue="สถานะ: ยังไม่เริ่ม">สถานะ: ยังไม่เริ่ม</SelectItem>
                  <SelectItem key="เสร็จสิ้น" textValue="สถานะ: เสร็จสิ้น">สถานะ: เสร็จสิ้น</SelectItem>
                </Select>
              </div>

              {/* Role Filter (Dropdown) */}
              <div className="w-full sm:w-[210px] min-w-[210px]">
                <Select
                  aria-label="ประเภท"
                  placeholder="ประเภท: ทั้งหมด"
                  className="w-full"
                  size="sm"
                  selectedKeys={[campRoleFilter]}
                  onChange={(e) => setCampRoleFilter(e.target.value)}
                  classNames={{ trigger: "bg-white border border-gray-100 text-gray-700 font-medium" }}
                >
                  <SelectItem key="all" textValue="ประเภท: ทั้งหมด">ประเภท: ทั้งหมด</SelectItem>
                  <SelectItem key="owner" textValue="ประเภท: ค่ายที่สร้าง">ประเภท: ค่ายที่สร้าง</SelectItem>
                  <SelectItem key="related" textValue="ประเภท: ค่ายที่เกี่ยวข้อง">ประเภท: ค่ายที่เกี่ยวข้อง</SelectItem>
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
                {filteredMyCamps.map((camp) => (
                  <Card
                    key={camp.id}
                    className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white relative group"
                  >
                    {/* Image / SVG (hidden on mobile) */}
                    <div
                      className={`relative h-48 overflow-hidden hidden sm:block cursor-pointer ${navigatingTo === camp.id ? "opacity-60" : ""}`}
                      onClick={() => goToCampDetail(camp.id)}
                    >
                      {navigatingTo === camp.id && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/40">
                          <div className="w-8 h-8 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      {/* Action Buttons - เฉพาะเจ้าของค่าย */}
                      {camp.isOwner && (
                        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                          <button
                            className="p-2 bg-[#5d7c6f] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#4a6358] shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={loading || isSubmitting}
                            title="แก้ไขค่าย"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (loading || isSubmitting) return;
                              // Fetch full camp detail and open modal
                              handleEditCampClick(camp.id);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="p-2 bg-[#E84A5F] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FF847C] shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
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

                    <CardBody className="p-6 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2 text-[#2d3748]">
                            {camp.title}
                          </h3>
                          <p className="mb-4 text-[#718096]">
                            {camp.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Chip
                            className={`
                              ${STATUS_STYLES[camp.status]?.bg ?? "bg-gray-100"}
                              ${STATUS_STYLES[camp.status]?.text ?? "text-gray-600"}
                            `}
                            variant="shadow"
                          >
                            {camp.status}
                          </Chip>
                          {camp.isOwner ? (
                            <Chip
                              className="bg-[#e8f0ee] text-[#3d6357] border border-[#b8d0c8]"
                              size="sm"
                              variant="flat"
                            >
                              เจ้าของค่าย: {camp.ownerName}
                            </Chip>
                          ) : camp.ownerName ? (
                            <Chip
                              className="bg-gray-100 text-gray-600 border border-gray-200"
                              size="sm"
                              variant="flat"
                            >
                              ผู้สร้าง: {camp.ownerName}
                            </Chip>
                          ) : null}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 mb-2 text-[#718096]">
                        <MapPin size={20} className="flex-shrink-0" />
                        <span className="truncate" title={camp.location}>{camp.location}</span>
                      </div>

                      {/* Grades */}
                      {camp.gradeDisplay && (
                        <div className="flex items-start gap-2 mb-4 text-[#718096]">
                          <GraduationCap size={20} className="flex-shrink-0 mt-0.5" />
                          <span title={`ระดับชั้น: ${camp.gradeDisplay}`}>
                            ระดับชั้น: {camp.gradeDisplay}
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 mb-4 text-[#718096]">
                        <Calendar size={20} />
                        <span>
                          {camp.startDate} - {camp.endDate}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-center pt-4 border-t border-[#e2e8f0] mt-auto">
                        <span className="text-[#718096] text-sm">
                          ลงทะเบียนแล้ว {camp.enrolled}/{camp.totalStudents} คน
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            className="bg-transparent text-[#5d7c6f] font-semibold hover:opacity-70"
                            endContent={navigatingTo === camp.id ? null : <ChevronRight size={20} />}
                            isDisabled={navigatingTo !== null}
                            isLoading={navigatingTo === camp.id}
                            onPress={() => {
                              setEnrollmentCampId(camp.id);
                              setEnrollmentCampName(camp.title);
                              setIsEnrollmentModalOpen(true);
                            }}
                          >
                            ดูรายละเอียด
                          </Button>
                        </div>
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
        isOpen={isEnrollmentModalOpen}
        campId={enrollmentCampId ?? 0}
        campName={enrollmentCampName}
        onClose={() => setIsEnrollmentModalOpen(false)}
      />
    </div>
  );
}
