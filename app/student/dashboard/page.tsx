"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { MapPin, Calendar, Flag, Shirt, CheckCircle2, History, Sparkles, AlertCircle, UserCircle2, Phone, Clock } from "lucide-react";
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
    async function fetchData() {
      try {
        const [campsRes, studentRes, profileRes] = await Promise.all([
          fetch("/api/student/camps"),
          fetch("/api/auth/student/me"),
          fetch("/api/student/profile")
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
          if (!profile.birthday || !profile.tel || profile.chronic_disease === null || profile.food_allergy === null) {
            setProfileData({
              chronic_disease: profile.chronic_disease || "",
              food_allergy: profile.food_allergy || "",
              birthday: profile.birthday ? profile.birthday.split('T')[0] : "",
              student_tel: profile.tel || "",
              parent_tel: (profile.parents && profile.parents.length > 0 ? profile.parents[0].tel : ""),
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
      const aIsUpcoming = a.startRegisDate ? new Date(a.startRegisDate) > currentDate : false;
      const bIsUpcoming = b.startRegisDate ? new Date(b.startRegisDate) > currentDate : false;
      if (aIsUpcoming && !bIsUpcoming) return 1;
      if (!aIsUpcoming && bIsUpcoming) return -1;
      return 0;
    });
  const myCamps = camps.filter((c: any) => c.isRegistered && !c.isEnded);
  let endedCamps = camps.filter((c: any) => c.isEnded && c.isRegistered);

  if (selectedYear !== "all") {
    endedCamps = endedCamps.filter((c: any) => c.academicYear?.toString() === selectedYear);
  }

  const uniqueYears = Array.from(new Set(camps.map((c: any) => c.academicYear).filter(Boolean)))
    .sort((a: any, b: any) => b - a);

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
        <div className="bg-[#5d7c6f] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              สวัสดีน้อง{student?.firstname || "ๆ"} <Sparkles className="text-white" size={24} />
            </h1>
            <p className="opacity-90 mb-4">ยินดีต้อนรับเข้าสู่ระบบ KKS Camp </p>

            {/* Student Info Badges */}
            {student && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="13" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>
                  <span>รหัสนักเรียน:</span> {student.students_id}
                </span>

                {student.classroom?.grade_label && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                    ชั้น {student.classroom.grade_label}
                  </span>
                )}
                {student.classroom?.class_name && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                    ห้อง {student.classroom.class_name}
                  </span>
                )}
                {student.classroom?.homeroom_teacher && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span className="truncate">ครูประจำชั้น: {student.classroom.homeroom_teacher}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <Flag size={120} />
          </div>
        </div>

        <Tabs
          aria-label="Camp Options"
          classNames={{
            tabList: "gap-3 sm:gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto overflow-y-hidden scrollbar-hide",
            cursor: "w-full bg-[#5d7c6f]",
            tab: "max-w-fit px-0 h-12",
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
                <span className="text-sm sm:text-base font-bold">ค่ายที่เปิดรับสมัคร</span>
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
                  <CampCard key={camp.id} camp={camp} navigatingTo={navigatingTo} onPress={() => goToCamp(camp.id)} />
                ))
              )}
            </div>
          </Tab>

          {/* ----- Tab 2: My Camps ----- */}
          <Tab 
            key="mycamps" 
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">ค่ายของฉัน</span>
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
                  <CampCard key={camp.id} camp={camp} navigatingTo={navigatingTo} onPress={() => goToCamp(camp.id)} />
                ))
              )}
            </div>
          </Tab>

          {/* ----- Tab 3: Ended ----- */}
          <Tab
            key="ended"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">ประวัติค่าย</span>
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
                  <p>{selectedYear === "all" ? "ยังไม่มีประวัติค่ายที่เข้าร่วม" : `ไม่มีค่ายในปีการศึกษา ${(parseInt(selectedYear) + 543).toString()}`}</p>
                </div>
              ) : (
                endedCamps.map((camp: any) => (
                  <CampCard key={camp.id} camp={camp} navigatingTo={navigatingTo} onPress={() => goToCamp(camp.id)} isEnded />
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
  const isUpcomingRegis = regisStart && now < regisStart && !isEnded && !camp.isRegistered;

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
      isPressable={navigatingTo === null && !isUpcomingRegis}
      className={`border-none shadow-sm transition-shadow bg-white relative ${
        navigatingTo === camp.id ? "opacity-60" : ""
      } ${
        isEnded ? "opacity-80 hover:opacity-100" : "hover:shadow-md"
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
            <img src={camp.img_camp_url} alt={camp.title} className={`w-full h-full object-cover ${isEnded ? "opacity-80" : ""}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Flag className="text-[#5d7c6f]/20" size={40} />
            </div>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-start gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-base sm:text-lg text-gray-800 line-clamp-2 leading-snug">
              {camp.title}
            </h3>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#5d7c6f]" />
              <span className="text-gray-400">สถานที่:</span>
              <span className="text-gray-700 line-clamp-1">{camp.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#5d7c6f]" />
              <span className="text-gray-400">วันลงทะเบียน:</span>
              <span className="text-gray-700">{formatDate(camp.startRegisDate, camp.endRegisDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#5d7c6f]" />
              <span className="text-gray-400">วันเริ่มค่าย:</span>
              <span className="text-gray-700">{formatDate(camp.rawStartDate, camp.rawEndDate)}</span>
            </div>
          </div>
          <div className="w-full bg-[#5d7c6f] text-white font-medium py-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity text-sm">
            {isEnded ? "ดูรายละเอียด" : "ดูรายละเอียดค่าย"}
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
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
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
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - (i + 5)).toString());

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.chronic_disease.trim()) errors.chronic_disease = "กรุณากรอกข้อมูลโรคประจำตัว";
    if (!form.food_allergy.trim()) errors.food_allergy = "กรุณากรอกข้อมูลการแพ้อาหาร/ยา";
    if (!form.birthday) {
      errors.birthday = "กรุณาเลือกวันเกิดให้ครบถ้วน";
    } else {
       const parts = form.birthday.split('-');
       if (parts.length !== 3 || parts.some(p => !p)) errors.birthday = "กรุณาเลือกวันเกิดให้ครบถ้วน";
    }
    
    /* ไม่บังคับเบอร์โทรสำหรับนักเรียน */
    /*
    if (!form.parent_tel.trim()) {
      errors.parent_tel = "กรุณากรอกเบอร์โทรศัพท์";
    } else {
      const digits = form.parent_tel.replace(/\D/g, "");
      if (digits.length !== 10) errors.parent_tel = "เบอร์โทรต้องเป็น 10 หลัก";
    }
    */
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

  const updateBirthday = (type: 'day' | 'month' | 'year', value: string) => {
    const parts = form.birthday ? form.birthday.split('-') : ["", "", ""];
    if (type === 'year') parts[0] = value;
    if (type === 'month') parts[1] = value;
    if (type === 'day') parts[2] = value;
    setForm({ ...form, birthday: parts.join('-') });
  };

  const bdayParts = form.birthday ? form.birthday.split('-') : ["", "", ""];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-auto">
        <div className="bg-[#5d7c6f] px-6 pt-8 pb-6 text-white text-center">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">มาทำความรู้จักกันอีกนิด</h2>
              <p className="text-sm opacity-80 decoration-dotted">รบกวนอัปเดตข้อมูลเพื่อความสะดวกในการดูแล</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-[#5d7c6f]" />
              </div>
              <p className="font-bold text-gray-800 text-lg">บันทึกข้อมูลสำเร็จ!</p>
              <p className="text-sm text-gray-500">ยินดีที่ได้รู้จักนะ กำลังพาเข้าสู่ระบบ...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="bg-[#5d7c6f]/10 p-3 rounded-xl border border-[#5d7c6f]/20 text-center">
                  <p className="text-xs text-[#3d6357] leading-relaxed">
                    หากไม่มีข้อมูลส่วนไหน สามารถพิมพ์คำว่า <span className="font-bold">"ไม่มี"</span> ได้เลย
                  </p>
               </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  โรคประจำตัว <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.chronic_disease}
                  onChange={(e) => setForm((f: any) => ({ ...f, chronic_disease: e.target.value }))}
                  placeholder="เช่น หอบหืด, ภูมิแพ้"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                    ${ fieldError.chronic_disease
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
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
                  type="text"
                  value={form.food_allergy}
                  onChange={(e) => setForm((f: any) => ({ ...f, food_allergy: e.target.value }))}
                  placeholder="เช่น อาหารทะเล, ไข่ไก่"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                    ${ fieldError.food_allergy
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
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
                      value={bdayParts[2] || ""}
                      onChange={(e) => updateBirthday('day', e.target.value)}
                      className="px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#5d7c6f]"
                   >
                      <option value="">วันที่</option>
                      {days.map(d => <option key={d} value={d}>{parseInt(d)}</option>)}
                   </select>
                   <select
                      value={bdayParts[1] || ""}
                      onChange={(e) => updateBirthday('month', e.target.value)}
                      className="px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#5d7c6f]"
                   >
                      <option value="">เดือน</option>
                      {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                   </select>
                   <select
                      value={bdayParts[0] || ""}
                      onChange={(e) => updateBirthday('year', e.target.value)}
                      className="px-2 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#5d7c6f]"
                   >
                      <option value="">ปี(พ.ศ.)</option>
                      {years.map(y => <option key={y} value={y}>{parseInt(y) + 543}</option>)}
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
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.student_tel}
                    onChange={(e) => setForm((f: any) => ({ ...f, student_tel: e.target.value }))}
                    placeholder="0xxxxxxxxx"
                    maxLength={10}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                      ${ fieldError.student_tel
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                      }`}
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
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.parent_tel}
                    onChange={(e) => setForm((f: any) => ({ ...f, parent_tel: e.target.value }))}
                    placeholder="0xxxxxxxxx"
                    maxLength={10}
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all
                      ${ fieldError.parent_tel
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                      }`}
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
                  value={form.remark}
                  onChange={(e) => setForm((f: any) => ({ ...f, remark: e.target.value }))}
                  placeholder="ข้อมูลอื่นที่ต้องการแจ้งครู..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none transition-all focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20 resize-none"
                />
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
                className="w-full bg-[#5d7c6f] hover:bg-[#4a6659] text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md"
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
