"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  Flag,
  CheckCircle2,
  Ticket,
  Shirt,
  LayoutDashboard,
  ClipboardList,
  ImageOff,
  Users,
  FileText,
  CalendarCheck,
  CalendarDays,
  X,
  ScanLine,
  QrCode,
  KeyRound,
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

import TakeSurveyModal from "../TakeSurveyModal";

const QrScanner = dynamic(() => import("@/components/QrScanner"), {
  ssr: false,
});

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

function formatDate(dateString: string) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getDaysRemaining(endDate: string) {
  if (!endDate) return null;
  const end = new Date(endDate);

  end.setHours(0, 0, 0, 0);
  const now = new Date();

  now.setHours(0, 0, 0, 0);
  const diff = end.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24)); // Use round to avoid -0 issues

  return days >= 0 ? days : 0;
}

/** คืน true ถ้าวันนี้อยู่ในช่วงจองเสื้อ (ไม่ย้อนหลัง ไม่เกินวันหมดเขต) */
function isInShirtPeriod(startDate?: string, endDate?: string): boolean {
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  if (startDate) {
    const start = new Date(startDate);

    start.setHours(0, 0, 0, 0);
    if (today < start) return false;
  }
  if (endDate) {
    const end = new Date(endDate);

    end.setHours(0, 0, 0, 0);
    if (today > end) return false;
  }

  return true;
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

  // Survey State
  const [surveyData, setSurveyData] = useState<any>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Attendance State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceCheckedIn, setAttendanceCheckedIn] = useState(false);
  const [attendanceCheckedAt, setAttendanceCheckedAt] = useState<string | null>(
    null,
  );
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
    setQrScanActive(false);
    setQrScanResult(null);
    setQrScanMessage("");
    setShowPinInput(false);
    setPinInput("");
    setCameraError(null);
    qrProcessingRef.current = false;
    setIsAttendanceModalOpen(true);
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
        fetchCamp();
        fetchSurvey();
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

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  const startDate = camp.rawStartDate ? new Date(camp.rawStartDate) : null;

  if (startDate) startDate.setHours(0, 0, 0, 0);
  const campNotStarted = startDate && today < startDate;

  return (
    <div className="min-h-screen bg-[#FBF9F4] pb-64">
      {/* Hero Section */}
      <div className="h-72 sm:h-80 bg-gray-200 relative overflow-hidden">
        {camp.img_camp_url ? (
          <img
            alt={camp.title}
            className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
            src={camp.img_camp_url}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2d3748] to-[#1a202c] flex items-center justify-center text-white/20">
            <Flag size={80} className="animate-pulse" />
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        
        <div className="absolute top-6 left-4 z-20">
          <Button
            isIconOnly
            className="bg-white/90 backdrop-blur-xl text-gray-800 shadow-xl border border-white/20 rounded-2xl"
            variant="flat"
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} />
          </Button>
        </div>

        {/* Hero Title Overlay (Small Screens Only) */}
        <div className="absolute bottom-24 left-6 right-6 z-10 sm:hidden">
          <h1 className="text-white text-2xl font-black leading-tight drop-shadow-lg tracking-tight">
            {camp.title}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        {/* Main Info Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-7 mb-6 border border-white/50">
          <div className="hidden sm:block">
            <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight tracking-tight">
              {camp.title}
            </h1>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {camp.isRegistered && !camp.isEnded && (
              <span className="inline-flex items-center gap-1.5 bg-[#5d7c6f] text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg shadow-[#5d7c6f]/20">
                <CheckCircle2 size={13} /> ลงทะเบียนแล้ว
              </span>
            )}
            {camp.isEnded && (
              <span className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                <Flag size={13} /> ค่ายจบแล้ว
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-blue-100">
              <Users size={13} /> {camp.totalEnrolled}/{camp.totalCapacity} คน
            </span>
          </div>

          {/* Info Grid - Modern Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100 transition-colors hover:bg-white hover:border-[#5d7c6f]/30 group">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 group-hover:bg-[#5d7c6f] transition-all">
                <MapPin className="text-[#5d7c6f] group-hover:text-white" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">สถานที่</p>
                <p className="text-gray-900 font-bold truncate text-sm">{camp.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100 transition-colors hover:bg-white hover:border-[#5d7c6f]/30 group">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 group-hover:bg-[#5d7c6f] transition-all">
                <Calendar className="text-[#5d7c6f] group-hover:text-white" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">วันเริ่มค่าย</p>
                <p className="text-gray-900 font-bold text-sm">
                  {formatDate(camp.rawStartDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {camp.description && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-6 bg-[#5d7c6f] rounded-full" />
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">รายละเอียดค่าย</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium opacity-90">
                {camp.description}
              </p>
            </div>
          )}
        </div>

        {/* Schedule Button Card */}
        {camp.camp_daily_schedule && camp.camp_daily_schedule.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-4 mb-4">
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#edf4f1] hover:bg-[#dceee8] transition-colors group"
              onClick={() => setIsScheduleModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#5d7c6f] rounded-xl flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="text-white" size={18} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 text-sm">
                    ดูกำหนดการค่าย
                  </p>
                  <p className="text-xs text-gray-500">
                    {camp.camp_daily_schedule.length} วัน · กดเพื่อดูตารางเวลา
                  </p>
                </div>
              </div>
              <ChevronLeft
                className="text-gray-400 rotate-180 group-hover:translate-x-0.5 transition-transform"
                size={18}
              />
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 relative overflow-hidden">
          {!camp.isRegistered && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                <Flag size={24} />
              </div>
              <h3 className="font-bold text-[#2d3748] mb-1">
                {camp.isEnded
                  ? "ค่ายนี้จบลงแล้ว"
                  : "ลงทะเบียนเพื่อดูความคืบหน้า"}
              </h3>
              <p className="text-xs text-gray-500">
                {camp.isEnded
                  ? "คุณไม่ได้เข้าร่วมค่ายนี้ในระยะเวลาที่กำหนด"
                  : "คุณจะสามารถทำภารกิจได้หลังจากเข้าร่วมค่ายแล้ว"}
              </p>
            </div>
          )}
          <h2 className="text-lg font-bold text-gray-900 mb-4">ความคืบหน้า</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>ฐานที่ทำเสร็จ</span>
              </div>
              <span>0/{camp.station?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Flag size={16} />
                <span>ภารกิจทั้งหมด</span>
              </div>
              <span>{completedMissions} สำเร็จ</span>
            </div>
          </div>
        </div>

        {camp.isRegistered && camp.hasShirt && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shirt className="text-gray-600" size={20} />
                <h2 className="text-lg font-bold text-[#2d3748]">
                  จองเสื้อค่าย
                </h2>
              </div>
              <div className="flex gap-2">
                {isEditingShirt && (
                  <Button
                    className="text-gray-500 font-medium hover:bg-gray-100"
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
                    className="bg-gray-100 text-[#5C5C5C] font-medium"
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
              <div className="bg-gray-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100/50">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-[#5d7c6f] font-bold text-xl mb-2">
                  {shirtSize}
                </div>
                <p className="text-gray-700 text-sm font-medium">
                  จองเสื้อไซส์ {shirtSize} เรียบร้อยแล้ว
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {shirtPeriodActive
                    ? "แก้ไขได้ภายในกำหนดเวลา"
                    : "หมดเขตการแก้ไขแล้ว"}
                </p>
              </div>
            ) : !shirtSize && !shirtPeriodActive ? (
              <div className="bg-orange-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-orange-100/50">
                <p className="text-orange-600 text-sm font-medium">
                  หมดเขตการจองเสื้อแล้ว
                </p>
                <p className="text-[10px] text-orange-400 mt-0.5">
                  คุณไม่ได้ทำรายการในช่วงเวลาที่กำหนด
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-4">
                  กรุณาจองเสื้อค่ายของคุณก่อน {formatDate(camp.endShirtDate)}
                </p>
                {daysLeftToReserve !== null && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm flex items-center gap-2 mb-6">
                    <Clock size={16} />
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
                              className="bg-gray-100 rounded-xl overflow-hidden aspect-square border border-gray-200 shadow-sm relative group"
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
                                <span className="text-white text-sm font-medium">
                                  ดูรูปขนาดเต็ม
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="h-48 bg-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 font-medium">
                        <ImageOff className="mb-2 opacity-50" size={32} />
                        ไม่มีรูปตัวอย่างเสื้อ
                      </div>
                    );
                  })()}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกไซส์เสื้อของคุณ:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SHIRT_SIZES.map((size) => (
                      <button
                        key={size}
                        className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${selectedSize === size ? "bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"} ${!shirtPeriodActive ? "opacity-60 cursor-not-allowed" : ""}`}
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
                  className="mt-6 font-bold bg-[#5d7c6f] text-white"
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

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 p-6 pb-10 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto">
          {!camp.isRegistered ? (
            camp.isEnded ? (
              <Button
                fullWidth
                isDisabled
                className="bg-gray-100 text-gray-400 font-black text-lg h-14 rounded-2xl cursor-not-allowed border border-gray-200"
              >
                สิ้นสุดการรับสมัครแล้ว
              </Button>
            ) : (
              <Button
                fullWidth
                className="bg-gradient-to-r from-[#5d7c6f] to-[#3d5c50] text-white font-black text-lg h-14 rounded-2xl shadow-xl shadow-[#5d7c6f]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                isLoading={registering}
                onPress={handleRegister}
              >
                เข้าร่วมค่ายตอนนี้
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

                const certText =
                  hasPostTest && !isPostTestCompleted
                    ? "เกียรติบัตร (ต้องทำแบบทดสอบหลังเรียน)"
                    : "เกียรติบัตร (กำลังพัฒนา)";
                const certTextEnded =
                  hasPostTest && !isPostTestCompleted
                    ? "ดาวน์โหลดเกียรติบัตร (ต้องทำแบบทดสอบหลังเรียนก่อน)"
                    : "ดาวน์โหลดเกียรติบัตร (กำลังพัฒนา)";

                return (
                  <>
                    {/* Overlay เมื่อค่ายยังไม่เริ่ม */}
                    {campNotStarted && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 rounded-xl flex flex-col items-center justify-center gap-1">
                        <Clock className="text-gray-400" size={22} />
                        <p className="text-sm font-bold text-gray-600">
                          ยังไม่ถึงเวลาเริ่มค่าย
                        </p>
                        <p className="text-xs text-gray-400">
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
                            className="bg-[#5d7c6f] text-white font-bold text-lg h-12"
                            isLoading={navigating}
                            startContent={<LayoutDashboard size={20} />}
                            onPress={() => {
                              setNavigating(true);
                              router.push(
                                `/student/dashboard/camp/${id}/missions`,
                              );
                            }}
                          >
                            สรุปผลการทำภารกิจ
                          </Button>
                          <Button
                            fullWidth
                            isDisabled
                            className="bg-gray-100 text-gray-400 border border-gray-200 font-bold text-lg h-12 cursor-not-allowed opacity-80"
                            startContent={<Ticket size={20} />}
                          >
                            {certTextEnded}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            fullWidth
                            className="bg-[#5d7c6f] text-white font-bold text-lg h-12"
                            isDisabled={navigating || !!campNotStarted}
                            isLoading={navigating}
                            startContent={<LayoutDashboard size={20} />}
                            onPress={() => {
                              setNavigating(true);
                              router.push(
                                `/student/dashboard/camp/${id}/missions`,
                              );
                            }}
                          >
                            ไปยังหน้าภารกิจ
                          </Button>
                          <Button
                            fullWidth
                            className={`border font-medium ${surveyData && !surveyCompleted ? "bg-[#FFECC9] text-yellow-800 border-yellow-300" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                            isDisabled={!surveyData || surveyCompleted}
                            startContent={<ClipboardList size={18} />}
                            onPress={() => setIsSurveyModalOpen(true)}
                          >
                            {surveyCompleted
                              ? "ทำแบบประเมินเรียบร้อยแล้ว"
                              : "แบบประเมินความพึงพอใจ"}
                          </Button>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              isDisabled
                              className="bg-gray-100 text-gray-400 border-gray-200 font-medium cursor-not-allowed opacity-80"
                              startContent={<Ticket size={18} />}
                            >
                              {certText}
                            </Button>
                            <Button
                              className={`font-medium ${
                                attendanceCheckedIn
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-[#6b857a]/10 text-[#6b857a] border border-[#6b857a]/20 hover:bg-[#6b857a]/20"
                              }`}
                              isDisabled={!!campNotStarted}
                              startContent={
                                attendanceCheckedIn ? (
                                  <CheckCircle2 size={18} />
                                ) : (
                                  <QrCode size={18} />
                                )
                              }
                              onPress={openAttendanceModal}
                            >
                              {attendanceCheckedIn
                                ? "เช็คชื่อแล้ว"
                                : "เช็คชื่อ"}
                            </Button>
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
                    className="w-40 text-center text-gray-900 text-3xl font-black tracking-[0.35em] font-mono border-2 border-gray-200 focus:border-[#5d7c6f] rounded-xl py-3 outline-none transition-colors bg-gray-50 placeholder:text-gray-300"
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
    </div>
  );
}
