"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import {
  MapPin,
  Calendar,
  Flag,
  CheckCircle2,
  History,
  Sparkles,
  AlertCircle,
  Phone,
  Clock,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Utility to format date (with optional range)
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

export default function StudentDashboard() {
  const router = useRouter();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    chronic_disease: "",
    food_allergy: "",
    birthday: "",
    parent_tel: "",
    student_tel: "",
    remark: "",
  });

  const goToCamp = (campId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(campId);
    router.push(`/student/dashboard/camp/${campId}`);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchData() {
      try {
        const [campsRes, studentRes, profileRes] = await Promise.all([
          fetch("/api/student/camps"),
          fetch("/api/auth/student/me"),
          fetch("/api/student/profile"),
        ]);

        if (campsRes.ok) {
          setCamps(await campsRes.json());
        }
        if (studentRes.ok) {
          setStudent(await studentRes.json());
        }
        if (profileRes.ok) {
          const profile = await profileRes.json();

          // Check if key information is missing
          if (
            !profile.birthday ||
            !profile.tel ||
            profile.chronic_disease === null ||
            profile.food_allergy === null
          ) {
            setProfileData({
              chronic_disease: profile.chronic_disease || "",
              food_allergy: profile.food_allergy || "",
              birthday: profile.birthday ? profile.birthday.split("T")[0] : "",
              student_tel: profile.tel || "",
              parent_tel:
                profile.parents && profile.parents.length > 0
                  ? profile.parents[0].tel
                  : "",
              remark: profile.remark || "",
            });
            setShowProfileModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const onProfileSaved = () => {
    setShowProfileModal(false);
  };

  const currentDate = new Date();
  const availableCamps = camps
    .filter((c: any) => !c.isRegistered && !c.isEnded)
    .sort((a: any, b: any) => {
      const aIsUpcoming = a.startRegisDate
        ? new Date(a.startRegisDate) > currentDate
        : false;
      const bIsUpcoming = b.startRegisDate
        ? new Date(b.startRegisDate) > currentDate
        : false;

      if (aIsUpcoming && !bIsUpcoming) return 1;
      if (!aIsUpcoming && bIsUpcoming) return -1;

      return 0;
    });
  const myCamps = camps.filter((c: any) => c.isRegistered && !c.isEnded);
  let endedCamps = camps.filter((c: any) => c.isEnded && c.isRegistered);

  if (selectedYear !== "all") {
    endedCamps = endedCamps.filter(
      (c: any) => c.academicYear?.toString() === selectedYear,
    );
  }

  const uniqueYears = Array.from(
    new Set(camps.map((c: any) => c.academicYear).filter(Boolean)),
  ).sort((a: any, b: any) => b - a);

  if (loading)
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Profile Completion Overlay */}
      {showProfileModal && (
        <StudentProfileSetupModal
          initialData={profileData}
          onSaved={onProfileSaved}
        />
      )}

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Greeting Card */}
        <div className="relative bg-gradient-to-br from-[#5d7c6f] to-[#3d5c50] rounded-[2rem] p-6 text-white shadow-xl overflow-hidden mb-8">
          {/* Decorative shapes */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Sparkles className="text-white animate-pulse" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">
                  สวัสดีน้อง{student?.firstname || "ๆ"}
                </h1>
                <p className="text-white text-sm font-medium flex items-center gap-1.5">
                  ยินดีต้อนรับเข้าสู่ KKS Camp <Sparkles size={14} className="text-white animate-pulse" />
                </p>
              </div>
            </div>

            {/* Student Info Badges */}
            {student && (
              <div className="flex flex-wrap gap-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                  <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                    <History size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider">รหัสนักเรียน:</span>
                  <span className="text-sm font-bold">{student.students_id}</span>
                </div>

                {student.classroom?.grade_label && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                    <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                      <Flag size={12} className="text-white" />
                    </div>
                    <span className="text-sm font-bold">{student.classroom.grade_label}/{student.classroom.class_name}</span>
                  </div>
                )}
                
                {student.classroom?.homeroom_teacher && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                    <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Users size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap">ครู{student.classroom.homeroom_teacher}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
            <Flag size={140} />
          </div>
        </div>

        <Tabs
          aria-label="Camp Options"
          classNames={{
            tabList:
              "gap-0 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-[#5d7c6f]",
            tab: "flex-1 max-w-none px-2 h-12 justify-center",
            tabContent: "group-data-[selected=true]:text-[#5d7c6f] font-bold",
          }}
          color="primary"
          variant="underlined"
        >
          {/* ----- Tab 1: Available ----- */}
          <Tab
            key="available"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">
                  ค่ายที่เปิดรับสมัคร
                </span>
                {availableCamps.length > 0 && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">
                    {availableCamps.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="py-2 grid gap-4">
              {availableCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p>ไม่มีค่ายที่เปิดรับสมัครในขณะนี้</p>
                </div>
              ) : (
                availableCamps.map((camp: any) => (
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

          {/* ----- Tab 2: My Camps ----- */}
          <Tab
            key="mycamps"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">
                  ค่ายของฉัน
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
                  <p>คุณยังไม่ได้ลงทะเบียนค่ายใดๆ</p>
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

          {/* ----- Tab 3: Ended ----- */}
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      selectedYear === "all"
                        ? "bg-[#5d7c6f] text-white border-[#5d7c6f] shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#5d7c6f]/50 hover:text-[#5d7c6f]"
                    }`}
                    onClick={() => setSelectedYear("all")}
                  >
                    ทั้งหมด
                  </button>
                  {uniqueYears.map((year: any) => (
                    <button
                      key={year}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                        selectedYear === year.toString()
                          ? "bg-[#5d7c6f] text-white border-[#5d7c6f] shadow-sm"
                          : "bg-white text-gray-500 border-gray-200 hover:border-[#5d7c6f]/50 hover:text-[#5d7c6f]"
                      }`}
                      onClick={() => setSelectedYear(year.toString())}
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
                    isEnded
                    camp={camp}
                    navigatingTo={navigatingTo}
                    onPress={() => goToCamp(camp.id)}
                  />
                ))
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

// ─── CampCard Component ──────────────────────────────────────────
function CampCard({ camp, navigatingTo, onPress, isEnded = false }: any) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);

    return () => clearInterval(timer);
  }, []);

  const regisStart = camp.startRegisDate ? new Date(camp.startRegisDate) : null;
  const isUpcomingRegis =
    regisStart && now < regisStart && !isEnded && !camp.isRegistered;

  let countdownText = "";

  if (isUpcomingRegis && regisStart) {
    const diffTime = Math.abs(regisStart.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      countdownText = `อีก ${diffDays} วัน`;
    } else {
      countdownText = "เปิดรับสมัครวันนี้";
    }
  }

  return (
    <Card
      className={`border-none shadow-sm transition-all duration-300 bg-white relative overflow-hidden group ${
        navigatingTo === camp.id ? "scale-[0.98] opacity-60" : "hover:scale-[1.01] hover:shadow-xl"
      } ${
        isEnded ? "grayscale-[0.5] opacity-80" : ""
      } ${isUpcomingRegis ? "cursor-not-allowed" : ""}`}
      isPressable={navigatingTo === null && !isUpcomingRegis}
      onPress={isUpcomingRegis ? undefined : onPress}
    >
      {isUpcomingRegis && (
        <div className="absolute inset-0 z-20 bg-gray-900/60 backdrop-blur-[3px] flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 ring-1 ring-white/30">
            <Clock className="text-white animate-pulse" size={28} />
          </div>
          <h3 className="font-extrabold text-xl mb-1 tracking-tight">ยังไม่เปิดรับสมัคร</h3>
          <p className="text-sm font-medium text-white/80">{countdownText}</p>
        </div>
      )}

      {navigatingTo === camp.id && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/40 backdrop-blur-sm">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin shadow-lg" />
        </div>
      )}
      
      <CardBody className="p-0 flex flex-col sm:flex-row h-auto sm:h-52">
        <div className="w-full h-48 sm:w-56 sm:h-full bg-gray-100 flex-shrink-0 relative overflow-hidden">
          {camp.img_camp_url ? (
            <img
              alt={camp.title}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isEnded ? "opacity-70" : ""}`}
              src={camp.img_camp_url}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
              <Flag className="text-[#5d7c6f]/20" size={48} />
            </div>
          )}
          
          {/* Overlay gradient on image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent sm:hidden" />
        </div>

        <div className="flex-1 p-4 flex flex-col gap-2">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base sm:text-lg text-gray-800 line-clamp-2 leading-tight group-hover:text-[#5d7c6f] transition-colors">
              {camp.title}
            </h3>
            {isEnded && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                ค่ายจบแล้ว
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1 text-[13px]">
            <div className="flex items-center gap-2.5 text-gray-600">
              <div className="w-7 h-7 rounded-lg bg-[#5d7c6f]/10 flex items-center justify-center shrink-0">
                <MapPin className="text-[#5d7c6f]" size={14} />
              </div>
              <span className="font-medium line-clamp-1">{camp.location}</span>
            </div>
            
            <div className="flex items-center gap-2.5 text-gray-600">
              <div className="w-7 h-7 rounded-lg bg-[#5d7c6f]/10 flex items-center justify-center shrink-0">
                <Calendar className="text-[#5d7c6f]" size={14} />
              </div>
              <span className="font-medium text-xs sm:text-[13px]">
                {formatDate(camp.rawStartDate, camp.rawEndDate)}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <div className="w-full bg-[#5d7c6f] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#5d7c6f]/20 group-hover:bg-[#4a6358] transition-all transform group-hover:-translate-y-0.5 active:translate-y-0 text-sm">
              <span>{isEnded ? "ดูย้อนหลัง" : "ดูรายละเอียดค่าย"}</span>
              <History size={16} className={isEnded ? "block" : "hidden"} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── StudentProfileSetupModal ──────────────────────────────────────
function StudentProfileSetupModal({
  initialData,
  onSaved,
}: {
  initialData: any;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const currentYear = new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
  const months = [
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - (i + 5)).toString(),
  );

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!form.chronic_disease.trim())
      errors.chronic_disease = "กรุณากรอกข้อมูลโรคประจำตัว";
    if (!form.food_allergy.trim())
      errors.food_allergy = "กรุณากรอกข้อมูลการแพ้อาหาร/ยา";
    if (!form.birthday) {
      errors.birthday = "กรุณาเลือกวันเกิดให้ครบถ้วน";
    } else {
      const parts = form.birthday.split("-");

      if (parts.length !== 3 || parts.some((p: any) => !p))
        errors.birthday = "กรุณาเลือกวันเกิดให้ครบถ้วน";
    }

    if (form.parent_tel.trim()) {
      const digits = form.parent_tel.replace(/\D/g, "");

      if (digits.length !== 10) errors.parent_tel = "เบอร์โทรต้องเป็น 10 หลัก";
    }
    if (form.student_tel.trim()) {
      const digits = form.student_tel.replace(/\D/g, "");

      if (digits.length !== 10) errors.student_tel = "เบอร์โทรต้องเป็น 10 หลัก";
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
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "เกิดข้อผิดพลาด");

        return;
      }
      setSuccess(true);
      setTimeout(() => onSaved(), 1200);
    } catch {
      setApiError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const updateBirthday = (type: "day" | "month" | "year", value: string) => {
    const parts = form.birthday ? form.birthday.split("-") : ["", "", ""];

    if (type === "year") parts[0] = value;
    if (type === "month") parts[1] = value;
    if (type === "day") parts[2] = value;
    setForm({ ...form, birthday: parts.join("-") });
  };

  const bdayParts = form.birthday ? form.birthday.split("-") : ["", "", ""];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto">
        <div className="bg-[#5d7c6f] px-6 pt-8 pb-6 text-white text-center">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">มาทำความรู้จักกันอีกนิด</h2>

            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="text-[#5d7c6f]" size={32} />
              </div>
              <p className="font-bold text-gray-800 text-lg">
                บันทึกข้อมูลสำเร็จ!
              </p>
              <p className="text-sm text-gray-500">
                ยินดีที่ได้รู้จักนะ กำลังพาเข้าสู่ระบบ...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="bg-[#5d7c6f]/10 p-3 rounded-xl border border-[#5d7c6f]/20 text-center">
                <p className="text-xs text-[#3d6357] leading-relaxed">
                  หากไม่มีข้อมูลส่วนไหน สามารถพิมพ์คำว่า{" "}
                  <span className="font-bold">"ไม่มี"</span> ได้เลย
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  โรคประจำตัว <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                    ${
                      fieldError.chronic_disease
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
                  placeholder="เช่น หอบหืด, ภูมิแพ้"
                  type="text"
                  value={form.chronic_disease}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      chronic_disease: e.target.value,
                    }))
                  }
                />
                {fieldError.chronic_disease && (
                  <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {fieldError.chronic_disease}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  การแพ้อาหาร/ยา <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                    ${
                      fieldError.food_allergy
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
                  placeholder="เช่น อาหารทะเล, ไข่ไก่"
                  type="text"
                  value={form.food_allergy}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      food_allergy: e.target.value,
                    }))
                  }
                />
                {fieldError.food_allergy && (
                  <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {fieldError.food_allergy}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  วัน/เดือน/ปีเกิด <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#5d7c6f]"
                    value={bdayParts[2] || ""}
                    onChange={(e) => updateBirthday("day", e.target.value)}
                  >
                    <option value="">วันที่</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {parseInt(d)}
                      </option>
                    ))}
                  </select>
                  <select
                    className="px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#5d7c6f]"
                    value={bdayParts[1] || ""}
                    onChange={(e) => updateBirthday("month", e.target.value)}
                  >
                    <option value="">เดือน</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#5d7c6f]"
                    value={bdayParts[0] || ""}
                    onChange={(e) => updateBirthday("year", e.target.value)}
                  >
                    <option value="">ปี(พ.ศ.)</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {parseInt(y) + 543}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldError.birthday && (
                  <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {fieldError.birthday}
                  </p>
                )}
              </div>

              {/* Phone Student */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  เบอร์โทรศัพท์นักเรียน
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                      ${
                        fieldError.student_tel
                          ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                      }`}
                    maxLength={10}
                    placeholder="0xxxxxxxxx"
                    type="tel"
                    value={form.student_tel}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        student_tel: e.target.value,
                      }))
                    }
                  />
                </div>
                {fieldError.student_tel && (
                  <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {fieldError.student_tel}
                  </p>
                )}
              </div>

              {/* Phone Parent */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ผู้ปกครอง
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                      ${
                        fieldError.parent_tel
                          ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                      }`}
                    maxLength={10}
                    placeholder="0xxxxxxxxx"
                    type="tel"
                    value={form.parent_tel}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        parent_tel: e.target.value,
                      }))
                    }
                  />
                </div>
                {fieldError.parent_tel && (
                  <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                    <AlertCircle size={10} /> {fieldError.parent_tel}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20 resize-none"
                  placeholder="ข้อมูลอื่นที่ต้องการแจ้งครู..."
                  rows={2}
                  value={form.remark}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, remark: e.target.value }))
                  }
                />
              </div>

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  {apiError}
                </div>
              )}

              <button
                className="w-full bg-[#5d7c6f] hover:bg-[#4a6659] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md"
                disabled={saving}
                type="submit"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>บันทึกข้อมูลส่วนตัว</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
