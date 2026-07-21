"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
  Calendar,
  Clock,
  ChevronLeft,
  Flag,
  CheckCircle2,
  Award,
  Download,
  Lock,
  Shirt,
  LayoutDashboard,
  ClipboardList,
  ImageOff,
  Users,
  FileText,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  X,
  ScanLine,
  QrCode,
  KeyRound,
  Nfc,
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";
import CampLocationTracker from "@/components/camp-location/CampLocationTracker";

import TakeSurveyModal from "../TakeSurveyModal";
import {
  getBangkokDaysUntil,
  isBangkokDateBefore,
  isBangkokDateInRange,
} from "@/lib/bangkok-date";

const QrScanner = dynamic(() => import("@/components/QrScanner"), {
  ssr: false,
});

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

function formatDate(dateString: string) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysRemaining(endDate: string) {
  if (!endDate) return null;

  return getBangkokDaysUntil(endDate);
}

/** คืน true ถ้าวันนี้อยู่ในช่วงจองเสื้อ (ไม่ย้อนหลัง ไม่เกินวันหมดเขต) */
function isInShirtPeriod(startDate?: string, endDate?: string): boolean {
  return isBangkokDateInRange(startDate, endDate);
}

export default function StudentCampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [shirtSize, setShirtSize] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [savingShirt, setSavingShirt] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [isEditingShirt, setIsEditingShirt] = useState(false);
  const [isBottomMenuExpanded, setIsBottomMenuExpanded] = useState(true);

  // Survey State
  const [surveyData, setSurveyData] = useState<any>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Certificate Preview Modal State
  const [isCertPreviewModalOpen, setIsCertPreviewModalOpen] = useState(false);
  const [certImageLoading, setCertImageLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState<
    "pdf" | "png" | null
  >(null);

  // Shirt Selection Modal State (Auto-open after register)
  const [isShirtSelectionModalOpen, setIsShirtSelectionModalOpen] =
    useState(false);

  // Attendance State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceCheckedIn, setAttendanceCheckedIn] = useState(false);
  const [attendanceCheckedAt, setAttendanceCheckedAt] = useState<string | null>(
    null,
  );
  const [attendanceMethod, setAttendanceMethod] = useState<
    "QR" | "NFC" | null
  >(null);
  const [qrScanActive, setQrScanActive] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<
    "success" | "alreadyDone" | "error" | null
  >(null);
  const [qrScanMessage, setQrScanMessage] = useState("");
  const qrProcessingRef = useRef(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchCamp = async () => {
    try {
      const res = await fetch("/api/student/camps", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (res.ok) {
        const data = await res.json();
        const found = data.find((c: any) => c.id === Number(id));

        if (found) {
          setCamp(found);
          if (found.shirtSize) {
            setShirtSize(found.shirtSize);
            setSelectedSize(found.shirtSize);
          }
        } else {
          toast.error("ไม่พบค่าย");
        }
      }
    } catch (error) {
      console.error("Failed to fetch camp", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0); // เลื่อนขึ้นไปบนสุดทุกครั้งที่เข้าหน้าค่าย
    fetchCamp();
    fetchSurvey();
  }, [id]);

  useEffect(() => {
    if (camp?.isRegistered && id) {
      checkAttendanceStatus();
    }
  }, [camp?.isRegistered, id]);

  const fetchSurvey = async () => {
    try {
      const res = await fetch(`/api/student/surveys?campId=${id}`);

      if (res.ok) {
        const data = await res.json();

        if (data.survey) {
          setSurveyData(data.survey);
          setSurveyCompleted(data.isCompleted);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSurveyCompleted = () => {
    setSurveyCompleted(true);
  };

  const checkAttendanceStatus = async () => {
    try {
      const res = await fetch(`/api/student/attendance/checkin?campId=${id}`);

      if (res.ok) {
        const data = await res.json();

        setAttendanceCheckedIn(data.isCheckedIn);
        setAttendanceCheckedAt(data.checkedAt);
        setAttendanceMethod(data.method === "NFC" ? "NFC" : data.method);
      }
    } catch (err) {
      console.error("Failed to check attendance status", err);
    }
  };

  const handleQrScan = async (payload: string) => {
    if (qrProcessingRef.current) return;
    qrProcessingRef.current = true;
    setQrScanActive(false);
    setAttendanceLoading(true);
    try {
      const res = await fetch("/api/student/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPayload: payload }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setQrScanResult(data.alreadyCheckedIn ? "alreadyDone" : "success");
        setQrScanMessage(data.message);
        setAttendanceCheckedIn(true);
        setAttendanceCheckedAt(data.checkedAt);
      } else {
        setQrScanResult("error");
        setQrScanMessage(data.error || "QR Code ไม่ถูกต้อง");
        qrProcessingRef.current = false;
      }
    } catch {
      setQrScanResult("error");
      setQrScanMessage("เกิดข้อผิดพลาดในการแสกน");
      qrProcessingRef.current = false;
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (!pinInput.trim() || !id) return;
    setPinSubmitting(true);
    try {
      const res = await fetch("/api/student/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput.trim(), campId: Number(id) }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setQrScanResult(data.alreadyCheckedIn ? "alreadyDone" : "success");
        setQrScanMessage(data.message);
        setAttendanceCheckedIn(true);
        setAttendanceCheckedAt(data.checkedAt);
      } else {
        setQrScanResult("error");
        setQrScanMessage(data.error || "รหัส PIN ไม่ถูกต้อง");
      }
    } catch {
      setQrScanResult("error");
      setQrScanMessage("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setPinSubmitting(false);
    }
  };

  const requestCameraAndStartScan = async () => {
    setCameraError(null);
    const isSecure =
      window.isSecureContext ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";

    if (!isSecure) {
      setCameraError(
        "เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องบน HTTP กรุณาใช้ HTTPS หรือกรอก PIN แทน",
      );
      setShowPinInput(true);

      return;
    }
    const hasMedia = !!navigator.mediaDevices?.getUserMedia;

    if (!hasMedia) {
      setCameraError("อุปกรณ์นี้ไม่รองรับกล้อง กรุณากรอก PIN แทน");
      setShowPinInput(true);

      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      stream.getTracks().forEach((t) => t.stop());
      setQrScanActive(true);
    } catch (err: any) {
      const isDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError";

      if (isDenied) {
        setCameraError(
          "ไม่ได้รับอนุญาตเข้าถึงกล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์",
        );
        setQrScanResult("error");
        setQrScanMessage("ไม่ได้รับอนุญาตเข้าถึงกล้อง หรือกรอก PIN แทน");
      } else {
        setCameraError("ไม่สามารถเปิดกล้องได้ กรุณากรอก PIN แทน");
        setShowPinInput(true);
      }
    }
  };

  const openAttendanceModal = () => {
    if (attendanceMethod === "NFC" && !attendanceCheckedIn) {
      toast("รอบนี้ครูจะเช็คชื่อด้วยบัตร NFC กรุณานำบัตรไปแตะที่โทรศัพท์ครู");

      return;
    }

    setQrScanActive(false);
    setIsAttendanceModalOpen(true);
    if (!attendanceCheckedIn && !showPinInput) {
      setTimeout(() => {
        requestCameraAndStartScan();
      }, 500);
    }
  };

  const handleCertDownload = async (format: "pdf" | "png") => {
    if (downloadingFormat) return;
    setDownloadingFormat(format);

    try {
      const response = await fetch(
        `/api/camps/${id}/certificate?format=${format}&download=true`,
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("คุณดาวน์โหลดบ่อยเกินไป กรุณารอสักครู่ก่อนดาวน์โหลดใหม่");
        } else {
          toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดเกียรติบัตร");
        }
        setDownloadingFormat(null);

        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.style.display = "none";
      a.href = url;
      a.download = `certificate_${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Disable buttons for a few seconds to prevent spam
      setTimeout(() => {
        setDownloadingFormat(null);
      }, 3000);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด");
      setDownloadingFormat(null);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const res = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: Number(id) }),
      });

      if (res.ok) {
        toast.success("ลงทะเบียนสำเร็จ!");
        await fetchCamp();
        fetchSurvey();

        // ถ้าค่ายมีเสื้อ ให้เปิด Modal จองเสื้อทันที
        if (camp?.hasShirt) {
          setIsShirtSelectionModalOpen(true);
        }
      } else {
        toast.error("ลงทะเบียนล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setRegistering(false);
    }
  };

  const handleShirtUpdate = async (size: string) => {
    setSavingShirt(true);
    try {
      const res = await fetch("/api/student/enroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: Number(id), shirtSize: size }),
      });

      if (res.ok) {
        toast.success("อัปเดตไซส์เสื้อเรียบร้อย!");
        setShirtSize(size);
        setIsEditingShirt(false);
        setIsShirtSelectionModalOpen(false);
      } else {
        toast.error("ไม่สามารถอัปเดตไซส์เสื้อได้");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingShirt(false);
    }
  };

  if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (!camp) return <div className="p-8 text-center">ไม่พบค่าย</div>;

  const totalMissions =
    camp.station?.reduce(
      (acc: number, s: any) => acc + (s.mission?.length || 0),
      0,
    ) || 0;
  const completedMissions = 0;

  const daysLeftToReserve = getDaysRemaining(camp.endShirtDate);
  const daysUntilStart = getDaysRemaining(camp.rawStartDate);
  const shirtPeriodActive = isInShirtPeriod(
    camp.startShirtDate,
    camp.endShirtDate,
  );

  const startDate = camp.rawStartDate ? new Date(camp.rawStartDate) : null;
  const campNotStarted =
    startDate && isBangkokDateBefore(new Date(), startDate);
  const canShowAssignedSurvey = !camp.isRegistered && !!surveyData;

  return (
    <div
      className={`min-h-screen bg-[#F5F5F3] transition-[padding] duration-300 ${
        isBottomMenuExpanded ? "pb-72" : "pb-24"
      }`}
    >
      {/* Hero Section */}
      <div className="h-64 sm:h-72 bg-gray-200 relative overflow-hidden">
        {camp.img_camp_url ? (
          <img
            alt={camp.title}
            className="w-full h-full object-cover transition-transform duration-1000"
            src={camp.img_camp_url}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2d3748] to-[#1a202c] flex items-center justify-center text-white/20">
            <Flag className="animate-pulse" size={80} />
          </div>
        )}

        <div className="absolute top-6 left-6 z-20">
          <Button
            isIconOnly
            className="bg-gray-400/50 backdrop-blur-md text-gray-700 shadow-sm border border-white/20 rounded-xl"
            variant="flat"
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} />
          </Button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-0 -mt-16 relative z-20">
        {/* Main Info Card */}
        <div className="bg-white rounded-t-[2rem] shadow-xl shadow-gray-200/30 p-8 pb-10 border-x border-t border-gray-100/50">
          <div className="mb-6">
            <h1 className="text-[22px] sm:text-[26px] font-black text-[#1A202C] mb-5 leading-[1.2] tracking-tight">
              {camp.title}
            </h1>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              {camp.isRegistered && !camp.isEnded && (
                <span className="inline-flex items-center gap-1.5 bg-[#E6F4EA] text-[#1E8E3E] text-[13px] font-bold px-4 py-2 rounded-full">
                  <CheckCircle2 className="text-[#1E8E3E]" size={16} />{" "}
                  ลงทะเบียนแล้ว
                </span>
              )}
              {camp.isEnded && (
                <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[13px] font-bold px-4 py-2 rounded-full">
                  <Flag size={16} /> ค่ายจบแล้ว
                </span>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-gray-400" size={22} />
              <h2 className="text-base font-black text-gray-900">
                รายละเอียดค่าย
              </h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed font-medium opacity-90 pl-1">
              {camp.description}
            </p>
          </div>

          {/* Detailed Info Cards */}
          <div className="space-y-4">
            {/* Camp Dates */}
            <div className="flex items-center gap-4 bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100/50">
              <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                <Calendar className="text-[#5d7c6f]" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 mb-0.5">
                  วันจัดค่าย
                </p>
                <p className="text-[#1A202C] font-black text-base">
                  {formatDate(camp.rawStartDate)} –{" "}
                  {formatDate(camp.rawEndDate)}
                </p>
              </div>
            </div>

            {/* Registration Count & Progress */}
            <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-gray-100/50">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                  <Users className="text-[#5d7c6f]" size={20} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="text-base font-black text-gray-900">
                    จำนวนผู้ลงทะเบียน
                  </p>
                  <p className="text-base font-black text-[#5d7c6f]">
                    {camp.totalEnrolled} / {camp.totalCapacity} คน
                  </p>
                </div>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5d7c6f] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (camp.totalEnrolled / camp.totalCapacity) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Schedule Button Section */}
          {camp.camp_daily_schedule && camp.camp_daily_schedule.length > 0 && (
            <div className="mt-6">
              <button
                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[#5d7c6f]/5 hover:bg-[#5d7c6f]/10 transition-all group border border-[#5d7c6f]/10"
                onClick={() => setIsScheduleModalOpen(true)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#5d7c6f] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#5d7c6f]/20">
                    <CalendarDays className="text-white" size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-800 text-sm">
                      กำหนดการค่าย
                    </p>
                    <p className="text-xs text-gray-500 font-bold opacity-70">
                      {camp.camp_daily_schedule.length} วัน · กดเพื่อดูตารางเวลา
                    </p>
                  </div>
                </div>
                <ChevronLeft
                  className="text-[#5d7c6f] rotate-180 group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </button>
            </div>
          )}
        </div>

        <div className="mt-3">
          <CampLocationTracker campId={Number(id)} viewer="student" />
        </div>

        {/* Mission Progress Section (Only if registered) */}
        {camp.isRegistered && (
          <div className="mt-3 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <LayoutDashboard className="text-[#5d7c6f]" size={20} />
              ความคืบหน้าภารกิจ
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-[#5d7c6f]" size={16} />
                  <span>ฐานที่ทำเสร็จ</span>
                </div>
                <span>0/{camp.station?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <Flag className="text-[#5d7c6f]" size={16} />
                  <span>ภารกิจทั้งหมด</span>
                </div>
                <span>{completedMissions} สำเร็จ</span>
              </div>
            </div>
          </div>
        )}

        {camp.isRegistered && camp.hasShirt && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-3 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shirt className="text-[#5d7c6f]" size={22} />
                <h2 className="text-lg font-black text-gray-900">
                  จองเสื้อค่าย
                </h2>
              </div>
              <div className="flex gap-2">
                {isEditingShirt && (
                  <Button
                    className="text-gray-500 font-bold hover:bg-gray-100"
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setSelectedSize(shirtSize);
                      setIsEditingShirt(false);
                    }}
                  >
                    ยกเลิก
                  </Button>
                )}
                {shirtSize && shirtPeriodActive && !isEditingShirt && (
                  <Button
                    className="bg-gray-100 text-[#5d7c6f] font-bold"
                    size="sm"
                    variant="flat"
                    onPress={() => setIsEditingShirt(true)}
                  >
                    แก้ไขไซส์เสื้อ
                  </Button>
                )}
              </div>
            </div>

            {shirtSize && !isEditingShirt ? (
              <div className="bg-[#F8F9FA] rounded-xl p-5 flex flex-col items-center justify-center border border-gray-100">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#5d7c6f] font-black text-2xl mb-3 border border-gray-100">
                  {shirtSize}
                </div>
                <p className="text-gray-900 text-base font-black">
                  ไซส์ {shirtSize}
                </p>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  {shirtPeriodActive
                    ? "แก้ไขได้ภายในกำหนดเวลา"
                    : "หมดเขตการแก้ไขแล้ว"}
                </p>
              </div>
            ) : !shirtSize && !shirtPeriodActive ? (
              <div className="bg-orange-50 rounded-xl p-5 flex flex-col items-center justify-center border border-orange-100">
                <p className="text-orange-600 text-sm font-black">
                  หมดเขตการจองเสื้อแล้ว
                </p>
                <p className="text-xs text-orange-400 font-bold mt-1">
                  คุณไม่ได้ทำรายการในช่วงเวลาที่กำหนด
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-4 font-bold">
                  กรุณาจองเสื้อค่ายของคุณก่อน {formatDate(camp.endShirtDate)}
                </p>
                {daysLeftToReserve !== null && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-blue-700 text-sm flex items-center gap-2 mb-6 font-bold">
                    <Clock size={18} />
                    {daysLeftToReserve === 0
                      ? "วันนี้วันสุดท้ายของการจอง"
                      : `เหลือเวลาอีก ${daysLeftToReserve} วัน`}
                    <span className="text-blue-500 ml-auto text-xs">
                      หมดเขต: {formatDate(camp.endShirtDate)}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  {(() => {
                    let shirtUrls: string[] = [];

                    if (camp.img_shirt_url) {
                      try {
                        const parsed = JSON.parse(camp.img_shirt_url);

                        shirtUrls = Array.isArray(parsed)
                          ? parsed.filter(Boolean)
                          : [camp.img_shirt_url];
                      } catch (e) {
                        shirtUrls = [camp.img_shirt_url];
                      }
                    }
                    if (shirtUrls.length > 0) {
                      return (
                        <div
                          className={`grid gap-3 ${shirtUrls.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-2 md:grid-cols-3"}`}
                        >
                          {shirtUrls.map((url, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-100 rounded-2xl overflow-hidden aspect-square border border-gray-200 shadow-sm relative group"
                            >
                              <img
                                alt="Shirt"
                                className="w-full h-full object-cover"
                                src={url}
                              />
                              <div
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => setSelectedImage(url)}
                              >
                                <span className="text-white text-xs font-black">
                                  ดูรูปขนาดเต็ม
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 font-bold">
                        <ImageOff className="mb-2 opacity-30" size={32} />
                        ไม่มีรูปตัวอย่างเสื้อ
                      </div>
                    );
                  })()}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-black text-gray-700 mb-3">
                    เลือกไซส์เสื้อของคุณ:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SHIRT_SIZES.map((size) => (
                      <button
                        key={size}
                        className={`py-3 px-4 rounded-xl border text-sm font-black transition-all ${selectedSize === size ? "bg-[#5d7c6f] text-white border-[#5d7c6f] shadow-lg shadow-[#5d7c6f]/20" : "bg-white text-gray-700 border-gray-200 hover:border-[#5d7c6f]/50"} ${!shirtPeriodActive ? "opacity-60 cursor-not-allowed" : ""}`}
                        disabled={savingShirt || !shirtPeriodActive}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  fullWidth
                  className="mt-6 font-black bg-[#5d7c6f] text-white h-12 rounded-xl shadow-lg shadow-[#5d7c6f]/20"
                  isDisabled={!shirtPeriodActive || !selectedSize}
                  isLoading={savingShirt}
                  onPress={() => {
                    if (shirtSize === selectedSize) setIsEditingShirt(false);
                    else handleShirtUpdate(selectedSize);
                  }}
                >
                  {!shirtPeriodActive
                    ? "ไม่อยู่ในช่วงเวลาการจอง"
                    : shirtSize
                      ? shirtSize === selectedSize
                        ? "ยกเลิกการแก้ไข"
                        : "ยืนยันการแก้ไข"
                      : "ยืนยันการจองเสื้อ"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100/80 bg-white/90 px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-2xl shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="max-w-xl mx-auto rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <button
            aria-controls="camp-bottom-menu-content"
            aria-expanded={isBottomMenuExpanded}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5d7c6f]/40"
            type="button"
            onClick={() => setIsBottomMenuExpanded((expanded) => !expanded)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ee] text-[#3d6357]">
                <LayoutDashboard size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-gray-800">
                  เมนูการทำค่าย
                </span>
                {!isBottomMenuExpanded && (
                  <span className="block truncate text-[11px] font-medium text-gray-400">
                    แตะเพื่อแสดงภารกิจและเมนูอื่น ๆ
                  </span>
                )}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#5d7c6f]">
              {isBottomMenuExpanded ? "พับเมนู" : "กางเมนู"}
              <ChevronDown
                aria-hidden="true"
                className={`transition-transform duration-300 ${
                  isBottomMenuExpanded ? "rotate-180" : ""
                }`}
                size={18}
              />
            </span>
          </button>

          <div
            aria-hidden={!isBottomMenuExpanded}
            className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
              isBottomMenuExpanded
                ? "mt-3 grid-rows-[1fr] opacity-100"
                : "mt-0 grid-rows-[0fr] opacity-0"
            }`}
            id="camp-bottom-menu-content"
            inert={!isBottomMenuExpanded}
          >
            <div className="min-h-0 overflow-hidden">
              {!camp.isRegistered ? (
                canShowAssignedSurvey ? (
                  <div className="flex flex-col gap-2">
                    <Button
                      fullWidth
                      className={`font-black text-base h-12 rounded-xl border ${
                        surveyCompleted
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-[#FFECC9] text-yellow-800 border-yellow-300 shadow-xl shadow-yellow-200/40"
                      }`}
                      isDisabled={surveyCompleted}
                      startContent={
                        surveyCompleted ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <ClipboardList size={20} />
                        )
                      }
                      onPress={() => setIsSurveyModalOpen(true)}
                    >
                      {surveyCompleted ? "ประเมินแล้ว" : "ทำแบบประเมิน"}
                    </Button>
                    {camp.isEnded ? (
                      <p className="text-center text-xs font-semibold text-gray-400">
                        ค่ายจบแล้ว แต่คุณยังทำแบบประเมินของค่ายนี้ได้
                      </p>
                    ) : (
                      <Button
                        fullWidth
                        className="bg-[#5d7c6f] text-white font-bold text-sm h-11 rounded-xl shadow-md shadow-[#5d7c6f]/20"
                        isLoading={registering}
                        onPress={handleRegister}
                      >
                        เข้าร่วมค่าย
                      </Button>
                    )}
                  </div>
                ) : camp.isEnded ? (
                  <Button
                    fullWidth
                    isDisabled
                    className="bg-gray-100 text-gray-400 font-black text-base h-12 rounded-xl cursor-not-allowed border border-gray-200"
                  >
                    สิ้นสุดการรับสมัครแล้ว
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    className="bg-[#5d7c6f] text-white font-black text-base h-12 rounded-xl shadow-lg shadow-[#5d7c6f]/25 hover:scale-[1.01] active:scale-[0.98] transition-all"
                    isLoading={registering}
                    onPress={handleRegister}
                  >
                    เข้าร่วมค่าย
                  </Button>
                )
              ) : (
                <div className="relative">
                  {(() => {
                    const hasPostTest = camp?.station?.some((s: any) =>
                      s.mission?.some((m: any) => m.type === "POST_TEST"),
                    );
                    const isPostTestCompleted = camp?.station?.some((s: any) =>
                      s.mission?.some(
                        (m: any) =>
                          m.type === "POST_TEST" &&
                          camp.missionResults?.some(
                            (r: any) =>
                              r.mission_mission_id === m.mission_id &&
                              r.status === "completed",
                          ),
                      ),
                    );

                    const hasCertTemplate = !!camp?.img_certificate_url;

                    const requiredStations =
                      camp?.station?.filter(
                        (s: any) => s.is_required_for_cert,
                      ) || [];
                    const areRequiredStationsCompleted = requiredStations.every(
                      (station: any) => {
                        const stationMissions = station.mission || [];

                        if (stationMissions.length === 0) return true;
                        const completedMissions = stationMissions.filter(
                          (m: any) =>
                            camp.missionResults?.some(
                              (r: any) =>
                                r.mission_mission_id === m.mission_id &&
                                r.status === "completed",
                            ),
                        );

                        return (
                          completedMissions.length === stationMissions.length
                        );
                      },
                    );

                    const isSurveyRequiredAndNotCompleted =
                      surveyData?.is_required_for_cert && !surveyCompleted;
                    const canDownloadCert =
                      hasCertTemplate &&
                      !(hasPostTest && !isPostTestCompleted) &&
                      areRequiredStationsCompleted &&
                      !isSurveyRequiredAndNotCompleted;

                    const certLockReason = !hasCertTemplate
                      ? "ยังไม่มีเทมเพลตเกียรติบัตร"
                      : hasPostTest && !isPostTestCompleted
                        ? "ต้องทำ Post-Test ก่อน"
                        : !areRequiredStationsCompleted
                          ? "ต้องผ่านฐานที่บังคับก่อน"
                          : isSurveyRequiredAndNotCompleted
                            ? "ต้องทำแบบประเมินก่อน"
                            : null;

                    return (
                      <>
                        {/* Overlay เมื่อค่ายยังไม่เริ่ม */}
                        {campNotStarted && (
                          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] z-10 rounded-2xl flex flex-col items-center justify-center gap-1 border border-gray-100">
                            <Clock className="text-[#5d7c6f]" size={24} />
                            <p className="text-sm font-black text-gray-900">
                              ยังไม่ถึงเวลาเริ่มค่าย
                            </p>
                            <p className="text-xs text-gray-400 font-bold">
                              อีก {daysUntilStart} วัน · เริ่ม{" "}
                              {formatDate(camp.rawStartDate)}
                            </p>
                          </div>
                        )}
                        <div className="flex flex-col gap-3">
                          {camp.isEnded ? (
                            <>
                              <Button
                                fullWidth
                                className="bg-[#5d7c6f] text-white font-bold text-base h-12 rounded-xl shadow-md shadow-[#5d7c6f]/20"
                                isLoading={navigating}
                                startContent={<LayoutDashboard size={22} />}
                                onPress={() => {
                                  setNavigating(true);
                                  router.push(
                                    `/student/dashboard/camp/${id}/missions`,
                                  );
                                }}
                              >
                                สรุปผลการทำภารกิจ
                              </Button>
                              {surveyData && (
                                <Button
                                  fullWidth
                                  className={`h-11 rounded-xl font-bold text-sm border ${
                                    surveyCompleted
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-[#FFECC9] text-yellow-800 border-yellow-300 shadow-md shadow-yellow-200/30"
                                  }`}
                                  isDisabled={surveyCompleted}
                                  startContent={
                                    surveyCompleted ? (
                                      <CheckCircle2 size={18} />
                                    ) : (
                                      <ClipboardList size={18} />
                                    )
                                  }
                                  onPress={() => setIsSurveyModalOpen(true)}
                                >
                                  {surveyCompleted
                                    ? "ประเมินแล้ว"
                                    : "ทำแบบประเมิน"}
                                </Button>
                              )}
                              <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2.5">
                                <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-gray-400">
                                  <Award size={13} />
                                  <span>เกียรติบัตร</span>
                                </div>
                                {!canDownloadCert ? (
                                  <div className="flex flex-col gap-1.5">
                                    <Button
                                      fullWidth
                                      isDisabled
                                      className="font-bold text-sm h-10 rounded-xl bg-gray-50 text-gray-400 border border-gray-200 border-dashed"
                                      startContent={
                                        <Award
                                          size={18}
                                          className="opacity-40"
                                        />
                                      }
                                    >
                                      ดาวน์โหลดเกียรติบัตร
                                    </Button>
                                    {certLockReason && (
                                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
                                        <Lock size={11} />
                                        <span>{certLockReason}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Button
                                    fullWidth
                                    className="font-bold text-sm h-10 rounded-xl bg-slate-700 text-white shadow-sm shadow-slate-700/20 hover:bg-slate-800 active:scale-[0.98] transition-all"
                                    startContent={<Download size={18} />}
                                    onPress={() => {
                                      setCertImageLoading(true);
                                      setIsCertPreviewModalOpen(true);
                                    }}
                                  >
                                    ดาวน์โหลดเกียรติบัตร
                                  </Button>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <Button
                                fullWidth
                                className="bg-[#5d7c6f] text-white font-bold text-base h-12 rounded-xl shadow-md shadow-[#5d7c6f]/20"
                                isDisabled={navigating || !!campNotStarted}
                                isLoading={navigating}
                                startContent={<LayoutDashboard size={22} />}
                                onPress={() => {
                                  setNavigating(true);
                                  router.push(
                                    `/student/dashboard/camp/${id}/missions`,
                                  );
                                }}
                              >
                                ไปยังหน้าภารกิจ
                              </Button>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  fullWidth
                                  className={`h-10 rounded-xl font-bold text-sm border ${
                                    surveyData && !surveyCompleted
                                      ? "bg-[#FFECC9] text-yellow-800 border-yellow-300"
                                      : surveyCompleted
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-gray-50 text-gray-400 border-gray-200"
                                  }`}
                                  isDisabled={!surveyData || surveyCompleted}
                                  startContent={<ClipboardList size={16} />}
                                  onPress={() => setIsSurveyModalOpen(true)}
                                >
                                  {surveyCompleted
                                    ? "ประเมินแล้ว"
                                    : "แบบประเมิน"}
                                </Button>
                                <Button
                                  fullWidth
                                  className={`h-10 rounded-xl font-bold text-sm border ${
                                    attendanceCheckedIn
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-[#5d7c6f]/10 text-[#5d7c6f] border-[#5d7c6f]/30"
                                  }`}
                                  isDisabled={!!campNotStarted}
                                  startContent={
                                    attendanceCheckedIn ? (
                                      <CheckCircle2 size={16} />
                                    ) : attendanceMethod === "NFC" ? (
                                      <Nfc size={16} />
                                    ) : (
                                      <QrCode size={16} />
                                    )
                                  }
                                  onPress={openAttendanceModal}
                                >
                                  {attendanceCheckedIn
                                    ? "เช็คชื่อแล้ว"
                                    : attendanceMethod === "NFC"
                                      ? "แตะบัตรกับครู"
                                    : "เช็คชื่อ"}
                                </Button>
                              </div>

                              <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-2.5">
                                <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-gray-400">
                                  <Award size={13} />
                                  <span>เกียรติบัตร</span>
                                </div>
                                {!canDownloadCert ? (
                                  <div className="flex flex-col gap-1.5">
                                    <Button
                                      fullWidth
                                      isDisabled
                                      className="font-bold text-sm h-10 rounded-xl bg-gray-50 text-gray-400 border border-dashed border-gray-200"
                                      startContent={
                                        <Award
                                          size={18}
                                          className="opacity-40"
                                        />
                                      }
                                    >
                                      ดาวน์โหลดเกียรติบัตร
                                    </Button>
                                    {certLockReason && (
                                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
                                        <Lock size={11} />
                                        <span>{certLockReason}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <Button
                                    fullWidth
                                    className="font-bold text-sm h-10 rounded-xl bg-slate-700 text-white shadow-sm shadow-slate-700/20 hover:bg-slate-800 active:scale-[0.98] transition-all"
                                    startContent={<Download size={18} />}
                                    onPress={() => {
                                      setCertImageLoading(true);
                                      setIsCertPreviewModalOpen(true);
                                    }}
                                  >
                                    ดาวน์โหลดเกียรติบัตร
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TakeSurveyModal
        campId={Number(id)}
        isOpen={isSurveyModalOpen}
        survey={surveyData}
        onClose={() => setIsSurveyModalOpen(false)}
        onCompleted={handleSurveyCompleted}
      />

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-[#5d7c6f]" size={20} />
                <h2 className="text-lg font-bold text-gray-800">
                  กำหนดการค่าย
                </h2>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
                onClick={() => setIsScheduleModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-4 space-y-4">
              {camp.camp_daily_schedule.map((day: any, dayIdx: number) => (
                <div
                  key={day.daily_schedule_id ?? dayIdx}
                  className="rounded-2xl border border-gray-100 overflow-hidden"
                >
                  {/* Day Header */}
                  <div className="bg-[#5d7c6f] px-4 py-2.5 flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {day.day}
                    </div>
                    <span className="text-white font-semibold text-sm">
                      วันที่ {day.day}
                    </span>
                  </div>

                  {/* Time Slots */}
                  {day.time_slots && day.time_slots.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {day.time_slots.map((slot: any, slotIdx: number) => (
                        <div
                          key={slot.time_slot_id ?? slotIdx}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-1 text-[#5d7c6f] min-w-[110px] mt-0.5">
                            <Clock className="flex-shrink-0" size={13} />
                            <span className="text-xs font-mono font-semibold">
                              {slot.startTime?.slice(0, 5)} –{" "}
                              {slot.endTime?.slice(0, 5)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 flex-1 leading-relaxed">
                            {slot.activity}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 px-4 py-3">
                      ไม่มีกิจกรรม
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <Button
                fullWidth
                className="bg-[#5d7c6f] text-white font-semibold"
                onPress={() => setIsScheduleModalOpen(false)}
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <QrCode className="text-[#5d7c6f]" size={20} />
                <h2 className="text-lg font-bold text-gray-800">เช็คชื่อ</h2>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
                onClick={() => setIsAttendanceModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-6 flex flex-col items-center gap-5">
              {attendanceCheckedIn ? (
                // Already checked in
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-500" size={52} />
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    เช็คชื่อสำเร็จแล้ว!
                  </p>
                  {attendanceCheckedAt && (
                    <p className="text-sm text-gray-500">
                      เวลา:{" "}
                      {new Date(attendanceCheckedAt).toLocaleString("th-TH", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                </div>
              ) : qrScanResult === "success" ||
                qrScanResult === "alreadyDone" ? (
                // Just checked in successfully
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-green-500" size={52} />
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    {qrScanResult === "alreadyDone"
                      ? "เช็คชื่อไปแล้ว"
                      : "เช็คชื่อสำเร็จ!"}
                  </p>
                  <p className="text-sm text-gray-500">{qrScanMessage}</p>
                </div>
              ) : qrScanResult === "error" ? (
                // Error state
                <div className="flex flex-col items-center gap-4 w-full py-4">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                    <X className="text-red-400" size={40} />
                  </div>
                  <p className="text-base font-semibold text-red-600 text-center">
                    {qrScanMessage}
                  </p>
                  <div className="flex flex-col w-full gap-2">
                    {!showPinInput && (
                      <Button
                        className="w-full bg-[#5d7c6f] text-white font-semibold"
                        startContent={<ScanLine size={18} />}
                        onPress={() => {
                          setQrScanResult(null);
                          setQrScanMessage("");
                          qrProcessingRef.current = false;
                          requestCameraAndStartScan();
                        }}
                      >
                        ลองสแกนอีกครั้ง
                      </Button>
                    )}
                    <Button
                      className="w-full bg-gray-100 text-gray-700 font-medium"
                      variant="flat"
                      onPress={() => {
                        setQrScanResult(null);
                        setQrScanMessage("");
                        setPinInput("");
                        setShowPinInput(true);
                      }}
                    >
                      กรอกรหัส PIN แทน
                    </Button>
                  </div>
                </div>
              ) : showPinInput ? (
                // PIN input mode
                <div className="flex flex-col items-center gap-5 w-full">
                  {cameraError && (
                    <div className="w-full flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <span className="text-amber-500 text-lg shrink-0">
                        ⚠️
                      </span>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {cameraError}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-16 h-16 rounded-2xl bg-[#5d7c6f]/10 flex items-center justify-center mb-1 text-[#5d7c6f]">
                      <KeyRound size={32} strokeWidth={2.5} />
                    </div>
                    <p className="font-bold text-gray-800">กรอกรหัส PIN</p>
                    <p className="text-xs text-gray-400 text-center">
                      ขอรหัส PIN จากครูผู้ดูแลที่ค่าย
                    </p>
                  </div>
                  <input
                    className="w-60 pl-[0.35em] text-center text-gray-900 text-3xl font-black tracking-[0.35em] font-mono border-2 border-gray-200 focus:border-[#5d7c6f] rounded-xl py-3 outline-none transition-colors bg-gray-50 placeholder:text-gray-300"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]*"
                    placeholder="------"
                    type="text"
                    value={pinInput}
                    onChange={(e) =>
                      setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && pinInput.length === 6)
                        handlePinSubmit();
                    }}
                  />
                  <div className="flex flex-col w-full gap-2">
                    <Button
                      className="w-full bg-[#5d7c6f] text-white font-bold"
                      isDisabled={pinInput.length !== 6}
                      isLoading={pinSubmitting}
                      size="lg"
                      onPress={handlePinSubmit}
                    >
                      ยืนยันรหัส PIN
                    </Button>
                    <Button
                      className="w-full text-gray-500"
                      startContent={<ScanLine size={16} />}
                      variant="light"
                      onPress={() => {
                        setShowPinInput(false);
                        setPinInput("");
                      }}
                    >
                      กลับไปแสกน QR
                    </Button>
                  </div>
                </div>
              ) : qrScanActive ? (
                // QR Scanner active
                <div className="w-full max-w-sm mx-auto">
                  <QrScanner
                    active={qrScanActive}
                    onError={(err: string) => {
                      setQrScanResult("error");
                      setQrScanMessage(err);
                      setQrScanActive(false);
                    }}
                    onScan={handleQrScan}
                  />
                  <p className="text-center text-xs text-gray-400 mt-2">
                    จัดกล้องให้ตรง QR Code ของครู
                  </p>
                  <Button
                    className="w-full mt-3 bg-gray-100 text-gray-600"
                    variant="flat"
                    onPress={() => setQrScanActive(false)}
                  >
                    ยกเลิก
                  </Button>
                </div>
              ) : (
                // Initial state
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-24 h-24 rounded-2xl bg-[#5d7c6f]/10 flex items-center justify-center">
                    <QrCode className="text-[#5d7c6f]" size={52} />
                  </div>
                  <p className="text-base text-gray-600 text-center">
                    กดปุ่มด้านล่างเพื่อเปิดกล้องแสกน
                    <br />
                    <span className="text-sm text-gray-400">
                      QR Code ที่ครูแสดง
                    </span>
                  </p>
                  <Button
                    className="bg-[#5d7c6f] text-white font-bold px-8"
                    size="lg"
                    startContent={<ScanLine size={20} />}
                    onPress={requestCameraAndStartScan}
                  >
                    เปิดกล้องแสกน QR
                  </Button>
                  <button
                    className="text-sm text-gray-400 underline underline-offset-2 hover:text-[#5d7c6f] transition-colors"
                    onClick={() => setShowPinInput(true)}
                  >
                    หรือกรอกรหัส PIN แทน
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100">
              <Button
                fullWidth
                className="bg-gray-100 text-gray-700 font-semibold"
                onPress={() => setIsAttendanceModalOpen(false)}
              >
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview Modal */}
      {isCertPreviewModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A202C] rounded-xl flex items-center justify-center shadow-lg shadow-gray-900/20">
                  <Award className="text-white" size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    เกียรติบัตรของคุณ
                  </h2>
                  <p className="text-xs text-gray-500 font-bold">
                    สามารถดาวน์โหลดเก็บไว้เป็นไฟล์ PDF หรือ PNG
                  </p>
                </div>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
                onClick={() => setIsCertPreviewModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 flex flex-col items-center">
              <div className="w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner flex items-center justify-center min-h-[250px] relative p-2">
                <img
                  alt="Certificate Preview"
                  className={`w-full h-auto object-contain rounded-xl shadow-md transition-opacity duration-300 ${certImageLoading ? "opacity-0" : "opacity-100"}`}
                  src={`/api/camps/${id}/certificate?format=png&v=2`}
                  onLoad={() => setCertImageLoading(false)}
                />
                {certImageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/50 backdrop-blur-sm z-10">
                    <LoadingSpinner size="md" />
                    <p className="text-sm font-bold text-gray-500 animate-pulse">
                      กำลังสร้างเกียรติบัตร รอสักครู่....
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  fullWidth
                  className="font-bold text-base h-14 rounded-2xl bg-[#5d7c6f] text-white shadow-lg shadow-[#5d7c6f]/20"
                  isDisabled={!!downloadingFormat}
                  isLoading={downloadingFormat === "pdf"}
                  startContent={
                    downloadingFormat !== "pdf" && <FileText size={20} />
                  }
                  onPress={() => handleCertDownload("pdf")}
                >
                  โหลด PDF
                </Button>
                <Button
                  fullWidth
                  className="font-bold text-base h-14 rounded-2xl bg-[#1A202C] text-white shadow-lg shadow-gray-900/20"
                  isDisabled={!!downloadingFormat}
                  isLoading={downloadingFormat === "png"}
                  startContent={
                    downloadingFormat !== "png" && <Download size={20} />
                  }
                  onPress={() => handleCertDownload("png")}
                >
                  โหลด PNG
                </Button>
              </div>
              <button
                className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setIsCertPreviewModalOpen(false)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
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
      {/* Shirt Selection Modal (Auto-open after register) */}
      {isShirtSelectionModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-[#5d7c6f]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5d7c6f] rounded-xl flex items-center justify-center shadow-lg shadow-[#5d7c6f]/20">
                  <Shirt className="text-white" size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">
                    จองเสื้อค่ายของคุณ
                  </h2>
                  <p className="text-xs text-gray-500 font-bold">
                    เลือกไซส์เสื้อเพื่อยืนยันการเข้าร่วม
                  </p>
                </div>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500"
                onClick={() => setIsShirtSelectionModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 space-y-6">
              {/* Shirt Preview Images */}
              {(() => {
                let shirtUrls: string[] = [];

                if (camp?.img_shirt_url) {
                  try {
                    const parsed = JSON.parse(camp.img_shirt_url);

                    shirtUrls = Array.isArray(parsed)
                      ? parsed.filter(Boolean)
                      : [camp.img_shirt_url];
                  } catch {
                    shirtUrls = [camp.img_shirt_url];
                  }
                }

                if (shirtUrls.length > 0) {
                  return (
                    <div
                      className={`grid gap-3 ${shirtUrls.length === 1 ? "grid-cols-1 max-w-[200px] mx-auto" : "grid-cols-2"}`}
                    >
                      {shirtUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 rounded-2xl overflow-hidden aspect-square border border-gray-200 shadow-sm"
                        >
                          <img
                            alt="Shirt Preview"
                            className="w-full h-full object-cover"
                            src={url}
                          />
                        </div>
                      ))}
                    </div>
                  );
                }

                return null;
              })()}

              <div>
                <label className="block text-sm font-black text-gray-700 mb-4 text-center">
                  กรุณาเลือกไซส์เสื้อ:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {SHIRT_SIZES.map((size) => (
                    <button
                      key={size}
                      className={`py-4 px-2 rounded-2xl border-2 text-base font-black transition-all ${
                        selectedSize === size
                          ? "bg-[#5d7c6f] text-white border-[#5d7c6f] shadow-xl shadow-[#5d7c6f]/30 scale-105"
                          : "bg-white text-gray-700 border-gray-100 hover:border-[#5d7c6f]/30"
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarCheck className="text-blue-600" size={14} />
                </div>
                <p className="text-xs text-blue-700 font-bold leading-relaxed">
                  คุณสามารถแก้ไขไซส์เสื้อได้ในภายหลังที่หน้าข้อมูลค่าย
                  ภายในวันที่ {formatDate(camp?.endShirtDate)}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <Button
                fullWidth
                className="bg-[#5d7c6f] text-white font-black text-lg h-14 rounded-2xl shadow-xl shadow-[#5d7c6f]/30"
                isDisabled={!selectedSize}
                isLoading={savingShirt}
                onPress={() => handleShirtUpdate(selectedSize)}
              >
                ยืนยันการจองเสื้อ
              </Button>
              <button
                className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setIsShirtSelectionModalOpen(false)}
              >
                ไว้เลือกภายหลัง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
