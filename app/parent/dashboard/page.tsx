"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import {
  MapPin,
  Calendar,
  Flag,
  Sparkles,
  History,
  GraduationCap,
  Phone,
  Mail,
  Users,
  UserCircle2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { ParentNavbar } from "@/components/ParentNavbar";

// ─── Types ──────────────────────────────────────────────────────────────
interface Teacher {
  prefix_name: string | null;
  firstname: string;
  lastname: string;
  tel: string;
  email: string;
}

interface ClassroomInfo {
  classroom_id: number;
  grade: string;
  academic_years_years_id: number;
  classroom_types: { name: string };
  teacher: Teacher | null;
  classroom_teacher: { teacher: Teacher }[];
}

interface Student {
  students_id: number;
  prefix_name: string | null;
  firstname: string;
  lastname: string;
  tel: string | null;
  classroom_students: { classroom: ClassroomInfo }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────
const gradeLabel: Record<string, string> = {
  Level_1: "ม.1",
  Level_2: "ม.2",
  Level_3: "ม.3",
  Level_4: "ม.4",
  Level_5: "ม.5",
  Level_6: "ม.6",
};

const formatDate = (start: string, end?: string) => {
  if (!start) return "";
  const s = new Date(start).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  if (!end || start === end) return s;
  const e = new Date(end).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${s} - ${e}`;
};

// ─── Component ──────────────────────────────────────────────────────────
interface ParentProfile {
  parents_id: number;
  firstname: string;
  lastname: string;
  tel: string;
}

export default function ParentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [hasParentProfile, setHasParentProfile] = useState<boolean>(true);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, campsRes] = await Promise.all([
          fetch("/api/auth/parent/me"),
          fetch("/api/parent/camps"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.student) {
            setStudent(meData.student);
            setHasParentProfile(meData.hasParentProfile);
            setParentProfile(meData.parentProfile ?? null);
            if (!meData.hasParentProfile) setShowProfileModal(true);
          } else {
            setError("ไม่สามารถโหลดข้อมูลได้");
          }
        } else {
          setError("ไม่สามารถโหลดข้อมูลได้");
        }

        if (campsRes.ok) {
          setCamps(await campsRes.json());
        }
      } catch {
        setError("เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const goToCamp = (campId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(campId);
    router.push(`/parent/dashboard/camp/${campId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <p className="text-red-500">{error || "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  // Classroom & Teachers
  const classroom = student.classroom_students[0]?.classroom;
  const primaryTeacher = classroom?.teacher ?? null;
  const secondaryTeachers =
    classroom?.classroom_teacher?.map((ct) => ct.teacher) ?? [];
  const teachers: Teacher[] = [
    ...(primaryTeacher ? [primaryTeacher] : []),
    ...secondaryTeachers,
  ];

  // Camp categories
  const myCamps = camps.filter((c: any) => c.isRegistered && !c.isEnded);
  let endedCamps = camps.filter((c: any) => c.isEnded && c.isRegistered);

  if (selectedYear !== "all") {
    endedCamps = endedCamps.filter(
      (c: any) => c.academicYear?.toString() === selectedYear
    );
  }

  const uniqueYears = Array.from(
    new Set(
      camps.map((c: any) => c.academicYear).filter(Boolean)
    )
  ).sort((a: any, b: any) => b - a);

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <ParentNavbar />

      {/* Profile Setup Modal (บังคับกรอกครั้งแรก) */}
      {showProfileModal && student && (
        <ProfileSetupModal
          studentName={`${student.firstname} ${student.lastname}`}
          studentId={student.students_id}
          initialTel={parentProfile?.tel || student.tel || ""}
          onSaved={(profile: ParentProfile) => {
            setParentProfile(profile);
            setHasParentProfile(true);
            setShowProfileModal(false);
          }}
        />
      )}

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* ──────── Greeting Card (same style as student) ──────── */}
        <div className="bg-[#5d7c6f] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              ยินดีต้อนรับผู้ปกครอง <Sparkles className="text-white" size={24} />
            </h1>
            <p className="opacity-90 mb-4">
              ของ{student.prefix_name ?? ""}
              {student.firstname} {student.lastname}
            </p>

            {/* Badges (same style as student) */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {/* Student ID Badge */}
              <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="13" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>
                <span className="hidden xs:inline">รหัสนักเรียน:</span>
                <span className="xs:hidden">ID:</span> {student.students_id}
              </span>

              {/* Grade Badge */}
              {classroom?.grade && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                  ชั้น {gradeLabel[classroom.grade] ?? classroom.grade}
                </span>
              )}

              {/* Classroom Badge */}
              {classroom?.classroom_types?.name && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                  ห้อง {classroom.classroom_types.name}
                </span>
              )}

              {/* Academic Year Badge */}
              {classroom?.academic_years_years_id && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                  <Calendar size={14} />
                  ปี {classroom.academic_years_years_id + 543}
                </span>
              )}


            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <Users size={120} />
          </div>
        </div>



        {/* ──────── Camp Tabs (same style as student) ──────── */}
        <Tabs
          aria-label="Camp Options"
          classNames={{
            tabList:
              "gap-3 sm:gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto overflow-y-hidden scrollbar-hide",
            cursor: "w-full bg-[#5d7c6f]",
            tab: "max-w-fit px-0 h-12",
            tabContent:
              "group-data-[selected=true]:text-[#5d7c6f] font-bold",
          }}
          color="primary"
          variant="underlined"
        >
          {/* ── Tab 1: ค่ายของลูก ── */}
          <Tab
            key="mycamps"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">
                  ค่ายที่เข้าร่วม
                </span>
                {myCamps.length > 0 && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">
                    {myCamps.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="py-2 grid gap-4">
              {myCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p>ยังไม่ได้เข้าร่วมค่ายใดๆ</p>
                </div>
              ) : (
                myCamps.map((camp: any) => (
                  <CampCard
                    key={camp.id}
                    camp={camp}
                    navigatingTo={navigatingTo}
                    onPress={() => goToCamp(camp.id)}
                  />
                ))
              )}
            </div>
          </Tab>

          {/* ── Tab 2: ประวัติค่ายที่เข้าร่วม ── */}
          <Tab
            key="ended"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">
                  ประวัติค่าย
                </span>
                {endedCamps.length > 0 && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">
                    {endedCamps.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="py-2 grid gap-4">
              {uniqueYears.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  <button
                    onClick={() => setSelectedYear("all")}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      selectedYear === "all"
                        ? "bg-[#5d7c6f] text-white border-[#5d7c6f] shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#5d7c6f]/50 hover:text-[#5d7c6f]"
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  {uniqueYears.map((year: any) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year.toString())}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                        selectedYear === year.toString()
                          ? "bg-[#5d7c6f] text-white border-[#5d7c6f] shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-[#5d7c6f]/50 hover:text-[#5d7c6f]"
                      }`}
                    >
                      ปี {(year + 543).toString()}
                    </button>
                  ))}
                </div>
              )}

              {endedCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <History className="mx-auto mb-3 opacity-30" size={40} />
                  <p>
                    {selectedYear === "all"
                      ? "ยังไม่มีประวัติค่ายที่เข้าร่วม"
                      : `ไม่มีค่ายในปีการศึกษา ${(parseInt(selectedYear) + 543).toString()}`}
                  </p>
                </div>
              ) : (
                endedCamps.map((camp: any) => (
                  <CampCard
                    key={camp.id}
                    camp={camp}
                    navigatingTo={navigatingTo}
                    onPress={() => goToCamp(camp.id)}
                    isEnded
                  />
                ))
              )}
            </div>
          </Tab>

          {/* ── Tab 3: ครูประจำชั้น ── */}
          <Tab
            key="teacher"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <GraduationCap size={15} />
                <span className="text-sm sm:text-base font-bold">
                  ครูประจำชั้น
                </span>
              </div>
            }
          >
            <div className="py-4">
              {teachers.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <GraduationCap className="mx-auto mb-3 opacity-30" size={40} />
                  <p>ไม่พบข้อมูลครูประจำชั้น</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-500 px-1">ช่องทางติดต่อครูประจำชั้น</p>
                  {teachers.map((t, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#5d7c6f]/10 flex items-center justify-center text-[#5d7c6f]">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#3d6357] text-sm">
                            {t.prefix_name ?? ""}{t.firstname} {t.lastname}
                          </p>
                          <p className="text-[10px] text-gray-400">ครูประจำชั้น</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a
                          href={`tel:${t.tel}`}
                          className="flex items-center gap-3 bg-[#f5f0e7]/60 rounded-xl p-3 text-sm text-gray-700 hover:bg-[#5d7c6f]/10 transition-colors"
                        >
                          <Phone size={16} className="text-[#5d7c6f] shrink-0" />
                          <span>{t.tel || "-"}</span>
                        </a>
                        <a
                          href={`mailto:${t.email}`}
                          className="flex items-center gap-3 bg-[#f5f0e7]/60 rounded-xl p-3 text-sm text-gray-700 hover:bg-[#5d7c6f]/10 transition-colors"
                        >
                          <Mail size={16} className="text-[#5d7c6f] shrink-0" />
                          <span className="truncate">{t.email || "-"}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Camp Card Component (shared) ─────────────────────────────────────
function CampCard({
  camp,
  navigatingTo,
  onPress,
  isEnded = false,
}: {
  camp: any;
  navigatingTo: number | null;
  onPress: () => void;
  isEnded?: boolean;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const regisStart = camp.startRegisDate ? new Date(camp.startRegisDate) : null;
  const isUpcomingRegis = regisStart && now < regisStart && !isEnded && !camp.isRegistered;

  let countdownText = "";
  if (isUpcomingRegis && regisStart) {
    const diffTime = Math.abs(regisStart.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      countdownText = `อีก ${diffDays} วัน`;
    } else {
      countdownText = "เปิดรับสมัครเร็วๆ นี้";
    }
  }

  return (
    <Card
      isPressable={navigatingTo === null && !isUpcomingRegis}
      className={`border-none shadow-sm transition-shadow bg-white relative ${
        navigatingTo === camp.id ? "opacity-60" : ""
      } ${
        isEnded ? "opacity-80 hover:opacity-100 transition-opacity" : "hover:shadow-md"
      } ${isUpcomingRegis ? "cursor-not-allowed opacity-90" : ""}`}
      onPress={isUpcomingRegis ? undefined : onPress}
    >
      {isUpcomingRegis && (
        <div className="absolute inset-0 z-20 bg-gray-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white rounded-2xl">
          <div className="mb-3">
            <Clock size={28} className="text-white" />
          </div>
          <h3 className="font-bold text-lg mb-1">ยังไม่เปิดรับสมัคร</h3>
          <p className="text-sm opacity-90">{countdownText}</p>
        </div>
      )}

      {navigatingTo === camp.id && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-2xl">
          <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <CardBody className="p-0 flex flex-col sm:flex-row sm:h-48">
        <div className="w-full h-40 sm:w-48 sm:h-full md:w-56 bg-gray-100 flex-shrink-0 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
          {camp.img_camp_url ? (
            <img
              src={camp.img_camp_url}
              alt={camp.title}
              className={`w-full h-full object-cover ${isEnded ? "opacity-80" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Flag className="text-[#5d7c6f]/20" size={40} />
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-start gap-3">
          <div className="min-w-0">
            <h3
              className={`font-bold text-base sm:text-lg line-clamp-2 leading-snug ${
                isEnded ? "text-gray-700" : "text-gray-800"
              }`}
            >
              {camp.title}
            </h3>
          </div>

          <div className="flex flex-col gap-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#5d7c6f]" />
              <span className="text-gray-400">สถานที่:</span>
              <span className="text-gray-700 line-clamp-1">
                {camp.location}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#5d7c6f]" />
              <span className="text-gray-400">วันลงทะเบียน:</span>
              <span className="text-gray-700">
                {formatDate(camp.startRegisDate, camp.endRegisDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#5d7c6f]" />
              <span className="text-gray-400">วันเริ่มค่าย:</span>
              <span className="text-gray-700">
                {formatDate(camp.rawStartDate, camp.rawEndDate)}
              </span>
            </div>
          </div>

          <div className="w-full bg-[#5d7c6f] text-white font-medium py-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity text-sm">
            ดูความคืบหน้า
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
// ─── ProfileSetupModal ──────────────────────────────────────────────
function ProfileSetupModal({
  studentName,
  studentId,
  initialTel = "",
  onSaved,
}: {
  studentName: string;
  studentId: number;
  initialTel?: string;
  onSaved: (profile: ParentProfile) => void;
}) {
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    tel: initialTel,
  });
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.firstname.trim()) errors.firstname = "กรุณากรอกชื่อ";
    if (!form.lastname.trim()) errors.lastname = "กรุณากรอกนามสกุล";
    if (!form.tel.trim()) {
      errors.tel = "กรุณากรอกเบอร์โทร";
    } else {
      const digits = form.tel.replace(/\D/g, "");
      if (digits.length !== 10) errors.tel = "เบอร์โทรต้องเป็น 10 หลัก";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    const errors = validate();
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/parent/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setSuccess(true);
      setTimeout(() => onSaved(data.parent), 1200);
    } catch {
      setApiError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#5d7c6f] px-6 pt-8 pb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
              <UserCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">ยินดีต้อนรับ</h2>
              <p className="text-sm opacity-80">กรุณากรอกข้อมูลผู้ปกครอง</p>
            </div>
          </div>
          <div className="mt-3 bg-white/10 rounded-xl p-3 text-sm">
            <p className="opacity-80 text-xs mb-0.5">นักเรียน</p>
            <p className="font-semibold">{studentName}</p>
            <p className="text-xs opacity-70">รหัสนักเรียน: {studentId}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-[#5d7c6f]" />
              </div>
              <p className="font-bold text-gray-800">บันทึกข้อมูลสำเร็จ!</p>
              <p className="text-sm text-gray-500">กำลังพาไปยังหน้าหลัก...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">

              {/* Firstname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผู้ปกครอง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstname}
                  onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))}
                  placeholder="เช่น สมชาย"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                    ${ fieldError.firstname
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
                />
                {fieldError.firstname && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldError.firstname}
                  </p>
                )}
              </div>

              {/* Lastname */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  นามสกุลผู้ปกครอง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.lastname}
                  onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))}
                  placeholder="เช่น ใจดี"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                    ${ fieldError.lastname
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
                />
                {fieldError.lastname && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldError.lastname}
                  </p>
                )}
              </div>

              {/* Tel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.tel}
                    onChange={(e) => setForm((f) => ({ ...f, tel: e.target.value }))}
                    placeholder="0xxxxxxxxx"
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all
                      ${ fieldError.tel
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                      }`}
                  />
                </div>
                {fieldError.tel && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldError.tel}
                  </p>
                )}
              </div>

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#5d7c6f] hover:bg-[#4a6659] text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    บันทึกข้อมูล
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
