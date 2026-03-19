"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  School,
  GraduationCap,
  Tent,
  MapPin,
  CalendarDays,
  Shirt,
} from "lucide-react";
import { ParentNavbar } from "@/components/ParentNavbar";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Teacher {
  prefix_name: string | null;
  firstname: string;
  lastname: string;
}

interface ClassroomInfo {
  classroom_id: number;
  grade: string;
  academic_years_years_id: number;
  classroom_types: { name: string };
  classroom_teacher: { teacher: Teacher }[];
}

interface Camp {
  camp_id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  img_camp_url: string;
}

interface Enrollment {
  enrolled_at: string;
  shirt_size: string | null;
  camp: Camp;
}

interface Student {
  students_id: number;
  prefix_name: string | null;
  firstname: string;
  lastname: string;
  classroom_students: { classroom: ClassroomInfo }[];
  student_enrollment: Enrollment[];
}

// ─── Helper ─────────────────────────────────────────────────────────────────
const gradeLabel: Record<string, string> = {
  Level_1: "ม.1",
  Level_2: "ม.2",
  Level_3: "ม.3",
  Level_4: "ม.4",
  Level_5: "ม.5",
  Level_6: "ม.6",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ParentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/parent/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.student) setStudent(data.student);
        else setError("ไม่สามารถโหลดข้อมูลได้");
      })
      .catch(() => setError("เกิดข้อผิดพลาด"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/parent/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-[#f5f0e7] flex items-center justify-center">
        <p className="text-red-500">{error || "ไม่พบข้อมูล"}</p>
      </div>
    );
  }

  const classroom = student.classroom_students[0]?.classroom;
  const teachers = classroom?.classroom_teacher?.map((ct) => ct.teacher) ?? [];
  const enrollments = student.student_enrollment ?? [];

  return (
    <div className="min-h-screen bg-[#f5f0e7]">
      <ParentNavbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Welcome Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-[#5d7c6f] font-medium mb-1">ยินดีต้อนรับผู้ปกครองของ</p>
          <h1 className="text-2xl font-bold text-gray-800">
            {student.prefix_name ?? ""}{student.firstname} {student.lastname}
          </h1>
          <p className="text-gray-400 text-sm mt-1">รหัสนักเรียน: {student.students_id}</p>
        </div>

        {/* ข้อมูลห้องเรียน */}
        {classroom ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <School size={18} className="text-[#5d7c6f]" /> ข้อมูลห้องเรียน
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-[#f5f0e7] rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">ชั้น</p>
                <p className="font-bold text-[#5d7c6f] text-lg">
                  {gradeLabel[classroom.grade] ?? classroom.grade}
                </p>
              </div>
              <div className="bg-[#f5f0e7] rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">ห้อง</p>
                <p className="font-bold text-[#5d7c6f] text-lg">
                  {classroom.classroom_types.name}
                </p>
              </div>
              <div className="bg-[#f5f0e7] rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-400 mb-1">ปีการศึกษา</p>
                <p className="font-bold text-[#5d7c6f] text-lg">
                  {classroom.academic_years_years_id}
                </p>
              </div>
            </div>

            {/* ครูประจำชั้น */}
            {teachers.length > 0 && (
              <div className="mt-5">
                <p className="text-sm text-gray-500 font-medium mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-[#5d7c6f]" /> ครูประจำชั้น
                </p>
                <div className="flex flex-wrap gap-2">
                  {teachers.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-[#eaf1ee] text-[#3d6357] text-sm rounded-full border border-[#c5ddd5]"
                    >
                      {t.prefix_name ?? ""}{t.firstname} {t.lastname}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-gray-400 text-sm">
            ยังไม่มีข้อมูลห้องเรียน
          </div>
        )}

        {/* ค่ายที่เข้าร่วม */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Tent size={18} className="text-[#5d7c6f]" /> ค่ายที่เข้าร่วม
            <span className="ml-auto text-xs font-normal bg-[#eaf1ee] text-[#3d6357] px-2 py-0.5 rounded-full">
              {enrollments.length} ค่าย
            </span>
          </h2>

          {enrollments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">
              ยังไม่ได้เข้าร่วมค่ายใด
            </p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((en, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#c5ddd5] transition-colors bg-gray-50/50"
                >
                  {/* Camp image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-[#eaf1ee]">
                    {en.camp.img_camp_url ? (
                      <Image
                        src={en.camp.img_camp_url}
                        alt={en.camp.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#5d7c6f]">
                        <Tent size={28} />
                      </div>
                    )}
                  </div>

                  {/* Camp info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm leading-snug">
                        {en.camp.name}
                      </p>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          en.camp.status === "OPEN"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}
                      >
                        {en.camp.status === "OPEN" ? "เปิดอยู่" : "ปิดแล้ว"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <MapPin size={11} /> {en.camp.location}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <CalendarDays size={11} />{" "}
                      {formatDate(en.camp.start_date)} – {formatDate(en.camp.end_date)}
                    </p>
                    {en.shirt_size && (
                      <p className="text-xs text-[#5d7c6f] mt-0.5 flex items-center gap-1">
                        <Shirt size={11} /> ขนาดเสื้อ: {en.shirt_size}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
