"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import {
  MapPin,
  Calendar,
  Flag,
  CheckCircle2,
  History,
  Sparkles,
  AlertCircle,
  Camera,
  Phone,
  Clock,
  Users,
  Bus,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  BANGKOK_TIME_ZONE,
  getBangkokDateKey,
  getBangkokDaysUntil,
  isBangkokDateBefore,
} from "@/lib/bangkok-date";
import { uploadStudentProfileImage } from "@/lib/student-profile-upload";
import { toThumbnail } from "@/lib/cloudinary-url";

// Utility to format date (with optional range)
const formatDate = (start: string, end?: string) => {
  if (!start) return "";
  const s = new Date(start).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: BANGKOK_TIME_ZONE,
  });

  if (!end || start === end) return s;
  const e = new Date(end).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: BANGKOK_TIME_ZONE,
  });

  return `${s} - ${e}`;
};

const formatBusCheckedAt = (value?: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BANGKOK_TIME_ZONE,
  });
};

const getBusSeatSideLabel = (label: string, seatIndex?: number | null) => {
  const seatLetter = label.trim().charAt(0).toUpperCase();

  if (seatLetter === "A" || seatLetter === "D") return "ติดหน้าต่าง";
  if (seatLetter === "B" || seatLetter === "C") return "ทางเดิน";

  return seatIndex === 0 || seatIndex === 3 ? "ติดหน้าต่าง" : "ทางเดิน";
};

const formatBusSeat = (assignment: any) => {
  const position = assignment?.student?.position;

  if (!position) return "ยังไม่ได้จัด";

  const floorLabel =
    assignment.bus?.floorCount > 1 && position.floorNumber
      ? `${
          position.floorNumber === 1
            ? "ชั้นล่าง"
            : position.floorNumber === 2
              ? "ชั้นบน"
              : `ชั้น ${position.floorNumber}`
        } · `
      : "";

  return `${floorLabel}${position.label} · ${getBusSeatSideLabel(position.label, position.seatIndex)}`;
};

export default function StudentDashboard() {
  const router = useRouter();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [busAssignments, setBusAssignments] = useState<any[]>([]);
  const [refreshingBus, setRefreshingBus] = useState(false);
  const [boardingCampId, setBoardingCampId] = useState<number | null>(null);
  const [alightingCampId, setAlightingCampId] = useState<number | null>(null);
  const [pendingBoardingAssignment, setPendingBoardingAssignment] =
    useState<any>(null);
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    nickname: "",
    food_allergy: "",
    profile_image_url: null as string | null,
  });

  const goToCamp = (campId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(campId);
    router.push(`/student/dashboard/camp/${campId}`);
  };

  const goToBus = (campId: number) => {
    if (
      navigatingTo !== null ||
      boardingCampId !== null ||
      alightingCampId !== null
    )
      return;
    setNavigatingTo(campId);
    router.push(`/student/dashboard/camp/${campId}/bus`);
  };

  const refreshBusAssignments = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshingBus(true);

    try {
      const response = await fetch("/api/student/bus", { cache: "no-store" });

      if (!response.ok) throw new Error("โหลดสถานะรถไม่สำเร็จ");

      const busData = await response.json();

      setBusAssignments(
        Array.isArray(busData.assignments) ? busData.assignments : [],
      );

      if (showRefresh) toast.success("อัปเดตสถานะรถแล้ว");
    } catch {
      if (showRefresh) toast.error("ไม่สามารถอัปเดตสถานะรถได้");
    } finally {
      if (showRefresh) setRefreshingBus(false);
    }
  }, []);

  const confirmBusBoarding = async (assignment: any) => {
    if (
      boardingCampId !== null ||
      alightingCampId !== null ||
      navigatingTo !== null
    )
      return;

    setBoardingCampId(assignment.campId);

    try {
      const response = await fetch(
        `/api/student/camps/${assignment.campId}/bus/board`,
        { method: "POST" },
      );
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "เช็คชื่อขึ้นรถไม่สำเร็จ");

        return;
      }

      setBusAssignments((current) =>
        current.map((item) =>
          item.campId === assignment.campId
            ? {
                ...item,
                student: {
                  ...item.student,
                  status: "ON_BUS",
                  isOnBus: true,
                  lastBoardedAt: result.checkedAt || new Date().toISOString(),
                },
              }
            : item,
        ),
      );
      setPendingBoardingAssignment(null);
      toast.success(result.message || "เช็คชื่อขึ้นรถสำเร็จ");
    } catch {
      toast.error("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBoardingCampId(null);
    }
  };

  const requestBusBoarding = (assignment: any) => {
    if (
      boardingCampId !== null ||
      alightingCampId !== null ||
      navigatingTo !== null
    )
      return;
    setPendingBoardingAssignment(assignment);
  };

  const confirmBusAlighting = async (assignment: any) => {
    if (
      alightingCampId !== null ||
      boardingCampId !== null ||
      navigatingTo !== null ||
      assignment.bus?.status === "TRAVELING"
    )
      return;

    setAlightingCampId(assignment.campId);

    try {
      const response = await fetch(
        `/api/student/camps/${assignment.campId}/bus/alight`,
        { method: "POST" },
      );
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "บันทึกลงจากรถไม่สำเร็จ");

        return;
      }

      setBusAssignments((current) =>
        current.map((item) =>
          item.campId === assignment.campId
            ? {
                ...item,
                student: {
                  ...item.student,
                  status: "OFF_BUS",
                  isOnBus: false,
                },
              }
            : item,
        ),
      );
      toast.success(result.message || "บันทึกว่าลงจากรถแล้ว");
    } catch {
      toast.error("เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setAlightingCampId(null);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    async function fetchData() {
      try {
        // /api/auth/student/me คืนข้อมูลนักเรียน + classroom ครบ
        // ใช้เป็น source เดียว แทนการ fetch /api/student/profile แยก
        const [campsRes, studentRes, busRes] = await Promise.all([
          fetch("/api/student/camps"),
          fetch("/api/auth/student/me"),
          fetch("/api/student/bus", { cache: "no-store" }),
        ]);

        if (campsRes.ok) {
          setCamps(await campsRes.json());
        }
        if (studentRes.ok) {
          const studentData = await studentRes.json();

          setStudent(studentData);

          // ใช้ข้อมูลเดิมสำหรับ profile modal — ไม่ต้อง fetch ซ้ำ
          if (!studentData.nickname?.trim()) {
            setProfileData({
              nickname: studentData.nickname || "",
              food_allergy: studentData.food_allergy || "",
              profile_image_url: studentData.profile_image_url || null,
            });
            setShowProfileModal(true);
          }
        }
        if (busRes.ok) {
          const busData = await busRes.json();

          setBusAssignments(
            Array.isArray(busData.assignments) ? busData.assignments : [],
          );
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    // ป้องกัน request ซ้อน — ถ้า request ก่อนหน้ายังไม่เสร็จ ให้ข้ามรอบนี้ไป
    let isPolling = false;

    const poll = async () => {
      if (isPolling || document.visibilityState !== "visible") return;
      isPolling = true;
      try {
        await refreshBusAssignments();
      } finally {
        isPolling = false;
      }
    };

    const timer = window.setInterval(poll, 15000);

    // fetch ทันทีเมื่อ user กลับมาที่ tab (แทนที่จะรอ interval ถัดไป)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshBusAssignments]);

  const onProfileSaved = () => {
    setShowProfileModal(false);
  };

  const currentDate = new Date();
  const availableCamps = camps
    .filter((c: any) => !c.isRegistered && !c.hasEnrollment && !c.isEnded)
    .sort((a: any, b: any) => {
      const aIsUpcoming = a.startRegisDate
        ? isBangkokDateBefore(currentDate, a.startRegisDate)
        : false;
      const bIsUpcoming = b.startRegisDate
        ? isBangkokDateBefore(currentDate, b.startRegisDate)
        : false;

      if (aIsUpcoming && !bIsUpcoming) return 1;
      if (!aIsUpcoming && bIsUpcoming) return -1;

      return 0;
    });
  const myCamps = camps.filter(
    (c: any) => (c.isRegistered || c.hasEnrollment) && !c.isEnded,
  );
  let endedCamps = camps.filter(
    (c: any) => c.isEnded && (c.isRegistered || c.hasEnrollment || c.hasSurvey),
  );

  if (selectedYear !== "all") {
    endedCamps = endedCamps.filter(
      (c: any) => c.academicYear?.toString() === selectedYear,
    );
  }

  const defaultCampTab = availableCamps.length > 0 ? "available" : "mycamps";

  const uniqueYears = Array.from(
    new Set(camps.map((c: any) => c.academicYear).filter(Boolean)),
  ).sort((a: any, b: any) => b - a);

  if (loading)
    return (
      <div className="min-h-screen bg-[#f5f5f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f5f2]">
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
                <h1 className="text-2xl font-semibold tracking-tight">
                  สวัสดีน้อง{student?.firstname || "ๆ"}
                </h1>
                <p className="text-white text-sm font-normal flex items-center gap-1.5">
                  ยินดีต้อนรับเข้าสู่ KKS Camp{" "}
                  <Sparkles className="text-white animate-pulse" size={14} />
                </p>
              </div>
            </div>

            {/* Student Info Badges */}
            {student && (
              <div className="flex flex-wrap gap-2">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                  <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                    <History className="text-white" size={12} />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider">
                    รหัสนักเรียน:
                  </span>
                  <span className="text-sm font-medium">
                    {student.students_id}
                  </span>
                </div>

                {student.classroom?.grade_label && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                    <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                      <Flag className="text-white" size={12} />
                    </div>
                    <span className="text-sm font-medium">
                      {student.classroom.grade_label}/
                      {student.classroom.class_name}
                    </span>
                  </div>
                )}

                {student.classroom?.homeroom_teacher && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
                    <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Users className="text-white" size={12} />
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">
                      ครู{student.classroom.homeroom_teacher}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
            <Flag size={140} />
          </div>
        </div>

        {busAssignments.length > 0 && (
          <section aria-labelledby="student-transport-heading">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0ee] text-[#3d6357]">
                  <Bus size={18} />
                </div>
                <div>
                  <h2
                    className="text-sm font-semibold text-gray-900"
                    id="student-transport-heading"
                  >
                    การเดินทางของฉัน
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    ตรวจสอบสถานะรถและที่นั่ง พร้อมยืนยันขึ้นรถ/ลงจากรถ
                  </p>
                </div>
              </div>
              <button
                aria-label="รีเฟรชสถานะรถ"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#3d6357] transition hover:bg-[#e8f0ee] disabled:cursor-wait disabled:opacity-60"
                disabled={refreshingBus}
                title="รีเฟรชสถานะรถ"
                type="button"
                onClick={() => void refreshBusAssignments(true)}
              >
                <RefreshCw
                  className={refreshingBus ? "animate-spin" : undefined}
                  size={15}
                />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {busAssignments.map((assignment: any) => {
                const isOnBus = Boolean(assignment.student?.isOnBus);
                const isTraveling = assignment.bus?.status === "TRAVELING";
                const position = assignment.student?.position;
                const busStatusLabel = !assignment.configured
                  ? "รอจัดรถ"
                  : isTraveling
                    ? "กำลังเดินทาง"
                    : "รถจอด";
                const studentStatusLabel = !assignment.configured
                  ? "ยังไม่ได้จัดรถ"
                  : isOnBus
                    ? `อยู่บนรถแล้ว${assignment.student.lastBoardedAt ? ` · ${formatBusCheckedAt(assignment.student.lastBoardedAt)} น.` : ""}`
                    : position
                      ? "พร้อมเช็กชื่อ"
                      : "รอจัดที่นั่ง";

                return (
                  <article
                    key={assignment.campId}
                    className="w-full rounded-xl border border-[#d8e5de] bg-white p-3 text-left shadow-sm"
                  >
                    <button
                      aria-label={`เปิดการเดินทางของ ${assignment.campName}`}
                      className="block w-full rounded-lg text-left transition hover:bg-[#f7faf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d7c6f]/40"
                      disabled={
                        boardingCampId !== null ||
                        alightingCampId !== null ||
                        navigatingTo !== null
                      }
                      type="button"
                      onClick={() => goToBus(assignment.campId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-normal text-[#5d7c6f]">
                            {assignment.campName}
                          </p>
                          <h3 className="truncate text-sm font-semibold text-gray-900">
                            {assignment.configured
                              ? assignment.bus.name
                              : "รอข้อมูลรถจากครู"}
                          </h3>
                        </div>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                              isTraveling
                                ? "bg-amber-100 text-amber-700"
                                : assignment.configured
                                  ? "bg-[#e8f0ee] text-[#3d6357]"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {busStatusLabel}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                              isOnBus
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {studentStatusLabel}
                          </span>
                        </span>
                      </div>

                      {assignment.configured ? (
                        <div className="mt-2 rounded-lg bg-[#f7faf8] p-2">
                          <p className="text-[10px] text-gray-400">
                            ที่นั่งของคุณ
                          </p>
                          <p className="mt-0.5 truncate text-xs font-semibold text-gray-700">
                            {position
                              ? formatBusSeat(assignment)
                              : "ยังไม่ได้จัด"}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-gray-500">
                          กรุณาติดต่อครูผู้ดูแลเพื่อจัดรถและที่นั่ง
                        </p>
                      )}
                    </button>

                    {!isOnBus &&
                    assignment.configured &&
                    !isTraveling &&
                    position ? (
                      <div className="mt-2">
                        <button
                          aria-label={`ยืนยันขึ้นรถ ${assignment.bus.name}`}
                          className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#5d7c6f] px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#4f6d61] disabled:cursor-wait disabled:opacity-60"
                          disabled={
                            boardingCampId !== null ||
                            alightingCampId !== null ||
                            navigatingTo !== null
                          }
                          type="button"
                          onClick={() => requestBusBoarding(assignment)}
                        >
                          <CheckCircle2 size={14} />
                          {boardingCampId === assignment.campId
                            ? "กำลังยืนยัน..."
                            : "ยืนยันขึ้นรถ"}
                        </button>
                      </div>
                    ) : isOnBus && assignment.configured && !isTraveling ? (
                      <div className="mt-2">
                        <button
                          aria-label={`ลงจากรถ ${assignment.bus.name}`}
                          className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-100 px-3 text-[11px] font-semibold text-amber-800 shadow-sm transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={
                            isTraveling ||
                            alightingCampId !== null ||
                            boardingCampId !== null ||
                            navigatingTo !== null
                          }
                          type="button"
                          onClick={() => void confirmBusAlighting(assignment)}
                        >
                          <LogOut size={14} />
                          {alightingCampId === assignment.campId
                            ? "กำลังบันทึก..."
                            : "ลงจากรถ"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <Modal
          isDismissable={boardingCampId === null}
          isOpen={pendingBoardingAssignment !== null}
          placement="center"
          size="sm"
          onOpenChange={(open) => {
            if (!open && boardingCampId === null) {
              setPendingBoardingAssignment(null);
            }
          }}
        >
          <ModalContent>
            <ModalHeader className="text-base font-semibold text-gray-900">
              ยืนยันขึ้นรถ
            </ModalHeader>
            <ModalBody className="gap-3">
              {pendingBoardingAssignment && (
                <>
                  <div className="rounded-2xl bg-[#f1f7f4] p-4">
                    <p className="text-xs text-[#5d7c6f]">
                      {pendingBoardingAssignment.campName}
                    </p>
                    <p className="mt-1 text-base font-medium text-gray-900">
                      {pendingBoardingAssignment.bus.name}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      ที่นั่ง {formatBusSeat(pendingBoardingAssignment)}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-500">
                    เมื่อกดยืนยัน ระบบจะบันทึกว่าคุณอยู่บนรถคันนี้
                  </p>
                </>
              )}
            </ModalBody>
            <ModalFooter className="gap-2">
              <button
                className="min-h-10 flex-1 rounded-xl px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-60"
                disabled={boardingCampId !== null}
                type="button"
                onClick={() => setPendingBoardingAssignment(null)}
              >
                ยกเลิก
              </button>
              <button
                className="min-h-10 flex-1 rounded-xl bg-[#5d7c6f] px-3 text-sm font-semibold text-white transition hover:bg-[#4f6d61] disabled:cursor-wait disabled:opacity-60"
                disabled={boardingCampId !== null}
                type="button"
                onClick={() => {
                  if (pendingBoardingAssignment) {
                    void confirmBusBoarding(pendingBoardingAssignment);
                  }
                }}
              >
                {boardingCampId !== null ? "กำลังยืนยัน..." : "ยืนยันขึ้นรถ"}
              </button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Tabs
          aria-label="Camp Options"
          classNames={{
            tabList:
              "gap-0 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-[#5d7c6f]",
            tab: "flex-1 max-w-none px-2 h-12 justify-center",
            tabContent: "group-data-[selected=true]:text-[#5d7c6f] font-medium",
          }}
          color="primary"
          defaultSelectedKey={defaultCampTab}
          variant="underlined"
        >
          {/* ----- Tab 1: Available ----- */}
          <Tab
            key="available"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-medium">
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
                <span className="text-sm sm:text-base font-medium">
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
                <span className="text-sm sm:text-base font-medium">
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
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
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
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
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
    regisStart &&
    isBangkokDateBefore(now, regisStart) &&
    !isEnded &&
    !camp.isRegistered;

  let countdownText = "";

  if (isUpcomingRegis && regisStart) {
    const diffDays = getBangkokDaysUntil(regisStart, now);

    if (diffDays > 1) {
      countdownText = `อีก ${diffDays} วัน`;
    } else {
      countdownText = "เปิดรับสมัครวันนี้";
    }
  }

  return (
    <Card
      className={`border-none shadow-sm transition-all duration-300 bg-white relative overflow-hidden group ${
        navigatingTo === camp.id
          ? "scale-[0.98] opacity-60"
          : "hover:scale-[1.01] hover:shadow-xl"
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
          <h3 className="font-semibold text-xl mb-1 tracking-tight">
            ยังไม่เปิดรับสมัคร
          </h3>
          <p className="text-sm font-normal text-white/80">{countdownText}</p>
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
              src={toThumbnail(camp.img_camp_url)}
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
            <h3 className="font-semibold text-base sm:text-lg text-gray-800 line-clamp-2 leading-tight group-hover:text-[#5d7c6f] transition-colors">
              {camp.title}
            </h3>
            {isEnded && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md">
                ค่ายจบแล้ว
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1 text-[13px]">
            <div className="flex items-center gap-2.5 text-gray-600">
              <div className="w-7 h-7 rounded-lg bg-[#5d7c6f]/10 flex items-center justify-center shrink-0">
                <MapPin className="text-[#5d7c6f]" size={14} />
              </div>
              <span className="font-normal line-clamp-1">{camp.location}</span>
            </div>

            <div className="flex items-center gap-2.5 text-gray-600">
              <div className="w-7 h-7 rounded-lg bg-[#5d7c6f]/10 flex items-center justify-center shrink-0">
                <Calendar className="text-[#5d7c6f]" size={14} />
              </div>
              <span className="font-normal text-xs sm:text-[13px]">
                {formatDate(camp.rawStartDate, camp.rawEndDate)}
              </span>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <div className="w-full bg-[#5d7c6f] text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#5d7c6f]/20 group-hover:bg-[#4a6358] transition-all transform group-hover:-translate-y-0.5 active:translate-y-0 text-sm">
              <span>{isEnded ? "ดูย้อนหลัง" : "ดูรายละเอียดค่าย"}</span>
              <History className={isEnded ? "block" : "hidden"} size={16} />
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const currentYear = Number(getBangkokDateKey().slice(0, 4));
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

    if (!form.nickname?.trim())
      errors.nickname = "กรุณากรอกชื่อเล่นก่อนดำเนินการต่อ";
    if (!form.food_allergy?.trim())
      errors.food_allergy = "กรุณากรอกข้อมูลการแพ้อาหาร/ยา หรือกรอกว่าไม่มี";

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
        body: JSON.stringify({
          nickname: form.nickname?.trim() || null,
          food_allergy: form.food_allergy.trim(),
          ...(pendingImageUrl ? { profile_image_url: pendingImageUrl } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "เกิดข้อผิดพลาด");

        return;
      }
      if (previewImage) URL.revokeObjectURL(previewImage);
      setSuccess(true);
      setTimeout(() => onSaved(), 1200);
    } catch {
      setApiError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setApiError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");

      return;
    }

    const objectUrl = URL.createObjectURL(file);

    setPreviewImage(objectUrl);
    setApiError("");
    setUploadingImage(true);

    try {
      const imageCompression = (await import("browser-image-compression"))
        .default;
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
      const uploaded = await uploadStudentProfileImage(compressedFile);

      setPendingImageUrl(uploaded.url);
    } catch (error: any) {
      URL.revokeObjectURL(objectUrl);
      setPreviewImage(null);
      setApiError(error.message || "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploadingImage(false);
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
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">มาทำความรู้จักกันอีกนิด</h2>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="text-[#5d7c6f]" size={32} />
              </div>
              <p className="font-medium text-gray-800 text-lg">
                บันทึกข้อมูลสำเร็จ!
              </p>
              <p className="text-sm text-gray-500">
                ยินดีที่ได้รู้จักนะ กำลังพาเข้าสู่ระบบ...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="hidden">
                <div className="bg-[#5d7c6f]/10 p-3 rounded-xl border border-[#5d7c6f]/20 text-center">
                  <p className="text-xs text-[#3d6357] leading-relaxed">
                    หากไม่มีข้อมูลส่วนไหน สามารถพิมพ์คำว่า{" "}
                    <span className="font-medium">"ไม่มี"</span> ได้เลย
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="student-profile-image"
                >
                  รูปโปรไฟล์{" "}
                  <span className="text-xs text-gray-400">(ถ้ามี)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-[#5d7c6f]/10 border border-gray-200 flex items-center justify-center text-[#5d7c6f]">
                    {previewImage || form.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt="ตัวอย่างรูปโปรไฟล์"
                        className="w-full h-full object-cover"
                        src={previewImage || form.profile_image_url}
                      />
                    ) : (
                      <Camera size={22} />
                    )}
                  </div>
                  <label className="cursor-pointer px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    {uploadingImage ? "กำลังอัปโหลด..." : "เลือกรูปภาพ"}
                    <input
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingImage}
                      id="student-profile-image"
                      type="file"
                      onChange={handleImageChange}
                    />
                  </label>
                  <span className="text-xs text-gray-400">ข้ามได้</span>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="student-food-allergy"
                >
                  การแพ้อาหาร/ยา <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                    ${
                      fieldError.food_allergy
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
                  id="student-food-allergy"
                  placeholder="เช่น ไม่มี, อาหารทะเล, ไข่ไก่"
                  type="text"
                  value={form.food_allergy || ""}
                  onChange={(e) =>
                    setForm((f: any) => ({
                      ...f,
                      food_allergy: e.target.value,
                    }))
                  }
                />
                {fieldError.food_allergy && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldError.food_allergy}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor="student-nickname"
                >
                  ชื่อเล่น <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
                    ${
                      fieldError.nickname
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
                    }`}
                  id="student-nickname"
                  placeholder="กรอกชื่อเล่นที่อยากให้เพื่อน ๆ เรียก"
                  type="text"
                  maxLength={50}
                  value={form.nickname || ""}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, nickname: e.target.value }))
                  }
                />
                {fieldError.nickname && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldError.nickname}
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
                className="w-full bg-[#5d7c6f] hover:bg-[#4a6659] text-white font-medium py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-md"
                disabled={saving || uploadingImage}
                type="submit"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>บันทึกชื่อเล่น</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
