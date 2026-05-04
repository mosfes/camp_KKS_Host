"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Camera,
  X,
  QrCode,
  ScanLine,
  KeyRound,
} from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/QrScanner"), {
  ssr: false,
});

export default function StudentStationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id, stationId } = params;

  const [camp, setCamp] = useState<any>(null);
  const [station, setStation] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mission Execution State
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({}); // { questionId: value }
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQid, setUploadingQid] = useState<number | null>(null);

  // QR Scan State
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

  const fetchCamp = async () => {
    try {
      const [campRes, studentRes] = await Promise.all([
        fetch("/api/student/camps", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }),
        fetch("/api/auth/student/me")
      ]);

      if (studentRes.ok) {
        setStudent(await studentRes.json());
      }

      if (campRes.ok) {
        const data = await campRes.json();
        const foundCamp = data.find((c: any) => c.id === Number(id));

        if (foundCamp) {
          if (!foundCamp.isRegistered) {
            toast.error("กรุณาลงทะเบียนเข้าร่วมค่ายก่อนเข้าถึงหน้าภารกิจ");
            router.replace(`/student/dashboard/camp/${id}`);

            return;
          }
          // ตรวจสอบว่าค่ายเริ่มแล้วหรือยัง
          if (
            foundCamp.rawStartDate &&
            new Date() < new Date(foundCamp.rawStartDate)
          ) {
            toast.error("ค่ายยังไม่เริ่ม ไม่สามารถทำภารกิจได้");
            router.replace(`/student/dashboard/camp/${id}`);

            return;
          }
          setCamp(foundCamp);
          // Find Station
          // Note: Original endpoint structure puts 'stations' under camp with full nested data
          const foundStation = foundCamp.station?.find(
            (s: any) => s.station_id === Number(stationId),
          );

          if (foundStation) {
            setStation(foundStation);
          } else {
            toast.error("ไม่พบฐานกิจกรรม");
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
    window.scrollTo(0, 0); // เลื่อนขึ้นไปบนสุดทุกครั้งที่เข้าหน้าภารกิจ
    fetchCamp();
  }, [id, stationId]);

  const openMission = (mission: any) => {
    setSelectedMission(mission);

    // Reset QR state
    setQrScanActive(false);
    setQrScanResult(null);
    setQrScanMessage("");
    setShowPinInput(false);
    setPinInput("");
    setCameraError(null);
    qrProcessingRef.current = false;

    const existingResult = camp?.missionResults?.find(
      (r: any) => r.mission_mission_id === mission.mission_id,
    );
    const initialAnswers: any = {};

    if (existingResult && existingResult.mission_answer) {
      existingResult.mission_answer.forEach((ans: any) => {
        const qid = ans.mission_question_question_id;

        if (ans.answer_text && ans.answer_text.length > 0) {
          initialAnswers[qid] = ans.answer_text[0].answer_text;
        } else if (ans.answer_mcq && ans.answer_mcq.length > 0) {
          initialAnswers[qid] = ans.answer_mcq[0].question_text;
        } else if (ans.answer_photo && ans.answer_photo.length > 0) {
          initialAnswers[qid] = ans.answer_photo[0].img_url;
        }
      });
    }

    setAnswers(initialAnswers);
    onOpen();
  };

  const handleQrScan = async (payload: string) => {
    if (qrProcessingRef.current) return;
    qrProcessingRef.current = true;
    setQrScanActive(false); // Stop scanner

    try {
      const res = await fetch("/api/student/mission/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrPayload: payload }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setQrScanResult(data.alreadyCompleted ? "alreadyDone" : "success");
        setQrScanMessage(data.message);
        if (!data.alreadyCompleted) {
          await fetchCamp();
        }
      } else {
        setQrScanResult("error");
        setQrScanMessage(data.error || "QR Code ไม่ถูกต้อง");
        qrProcessingRef.current = false; // Allow retry
      }
    } catch {
      setQrScanResult("error");
      setQrScanMessage("เกิดข้อผิดพลาดในการแสกน");
      qrProcessingRef.current = false;
    }
  };

  const resetQrScan = () => {
    setQrScanResult(null);
    setQrScanMessage("");
    setPinInput("");
    qrProcessingRef.current = false;
    if (showPinInput) {
      // ถ้าอยู่ใน PIN mode ให้คงอยู่ใน PIN mode
    } else {
      requestCameraAndStartScan();
    }
  };

  const handlePinSubmit = async () => {
    if (!pinInput.trim() || !selectedMission) return;
    setPinSubmitting(true);
    try {
      const res = await fetch("/api/student/mission/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: pinInput.trim(),
          missionId: selectedMission.mission_id,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setQrScanResult(data.alreadyCompleted ? "alreadyDone" : "success");
        setQrScanMessage(data.message);
        if (!data.alreadyCompleted) await fetchCamp();
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
    setCameraError(null); // clear ก่อนลอง

    // ตรวจสอบว่า browser รองรับ camera API หรือไม่
    const isSecure =
      window.isSecureContext ||
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1";
    const hasMediaDevices = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );

    if (!isSecure) {
      setCameraError(
        "เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องบนการเชื่อมต่อ HTTP กรุณาใช้ HTTPS หรือกรอก PIN แทน",
      );
      setShowPinInput(true);

      return;
    }

    if (!hasMediaDevices) {
      setCameraError(
        "เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับการเข้าถึงกล้อง กรุณากรอก PIN แทน",
      );
      setShowPinInput(true);

      return;
    }

    // ลอง constraint จากเข้มไปหยาบ
    const constraints = [
      { video: { facingMode: { ideal: "environment" } } },
      { video: { facingMode: "user" } },
      { video: true },
    ];

    let lastError: any = null;

    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);

        stream.getTracks().forEach((track) => track.stop());
        setQrScanActive(true);

        return;
      } catch (err: any) {
        lastError = err;
        if (
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError"
        )
          break;
      }
    }

    // แสดงสาเหตุที่เฉพาะเจาะจง
    const isDenied =
      lastError?.name === "NotAllowedError" ||
      lastError?.name === "PermissionDeniedError";
    const isNotFound =
      lastError?.name === "NotFoundError" ||
      lastError?.name === "DevicesNotFoundError";

    if (isDenied) {
      setCameraError(
        'ไม่ได้รับอนุญาตเข้าถึงกล้อง กรุณากด "อนุญาต" ในการตั้งค่าเบราว์เซอร์ แล้วลองใหม่',
      );
      setQrScanResult("error");
      setQrScanMessage(
        "ไม่ได้รับอนุญาตเข้าถึงกล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์ หรือกรอก PIN แทน",
      );
    } else if (isNotFound) {
      setCameraError("ไม่พบกล้องในอุปกรณ์นี้ กรุณากรอก PIN แทน");
      setShowPinInput(true);
    } else {
      setCameraError("ไม่สามารถเปิดกล้องได้ กรุณากรอก PIN แทน");
      setShowPinInput(true);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers((prev: any) => ({ ...prev, [questionId]: value }));
  };

  const compressImage = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return file;
    try {
      const imageCompression = (await import("browser-image-compression"))
        .default;

      return await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/jpeg", // Always convert to JPEG for compatibility
      });
    } catch (e) {
      console.error("Compression error:", e);

      return file;
    }
  };

  const handleImageUpload = async (questionId: number, file: File) => {
    if (!file) return;

    // Check file size (20MB limit)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    if (file.size > MAX_FILE_SIZE) {
      toast.error("ขนาดไฟล์รูปภาพต้องไม่เกิน 20MB");

      return;
    }

    setUploadingQid(questionId);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();

      formData.append("file", compressedFile, file.name);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();

        handleAnswerChange(questionId, data.url);
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || errorData._error || "อัปโหลดล้มเหลว");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setUploadingQid(null);
    }
  };

  const submitMission = async () => {
    if (!selectedMission) return;
    setSubmitting(true);

    // Transform answers
    const payloadAnswers = Object.entries(answers).map(([qid, val]) => {
      // Determine type from mission questions
      const q = selectedMission.mission_question.find(
        (mq: any) => mq.question_id === Number(qid),
      );

      return {
        questionId: Number(qid),
        type: q?.question_type,
        value: val,
      };
    });

    const isDraft = selectedMission.mission_question.some(
      (q: any) =>
        !answers[q.question_id] || String(answers[q.question_id]).trim() === "",
    );

    try {
      const res = await fetch("/api/student/mission/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: Number(id),
          missionId: selectedMission.mission_id,
          answers: payloadAnswers,
          isDraft: isDraft,
        }),
      });

      if (res.ok) {
        toast.success(isDraft ? "บันทึกร่างสำเร็จ!" : "ส่งภารกิจสำเร็จ!");
        await fetchCamp(); // Refresh status
        onClose();
      } else {
        toast.error("ส่งภารกิจล้มเหลว");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการส่ง");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if mission is completed
  const isMissionCompleted = (missionId: number) => {
    if (!camp || !camp.missionResults) return false;

    // status='completed'
    return camp.missionResults.some(
      (r: any) =>
        r.mission_mission_id === missionId && r.status === "completed",
    );
  };

  const isPreTestCompleted = () => {
    if (!camp || !camp.station) return false;

    let preTestMissions: any[] = [];

    for (const s of camp.station) {
      if (!s.mission) continue;
      for (const m of s.mission) {
        if (m.type === "PRE_TEST") {
          preTestMissions.push(m);
        }
      }
    }

    if (preTestMissions.length === 0) return true;

    let allPreTestsCompleted = true;

    for (const m of preTestMissions) {
      const isCompleted = camp.missionResults?.some(
        (r: any) =>
          r.mission_mission_id === m.mission_id && r.status === "completed",
      );

      if (!isCompleted) {
        allPreTestsCompleted = false;
        break;
      }
    }

    return allPreTestsCompleted;
  };

  if (loading)
    return (
      <div className="p-8 text-center bg-[#F5F2E9] min-h-screen flex items-center justify-center">
        <div className="text-gray-400 font-bold">กำลังโหลด...</div>
      </div>
    );
  if (!station)
    return (
      <div className="p-8 text-center bg-[#F5F2E9] min-h-screen flex items-center justify-center">
        <div className="text-gray-400 font-bold">ไม่พบฐานกิจกรรม</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F5F2E9] pb-12">
      {/* Station Header */}
      <div className="bg-white px-4 py-6 flex items-center gap-4 border-b border-gray-100/50">
        <Button 
          isIconOnly 
          className="bg-transparent text-gray-400 hover:bg-gray-50 min-w-0 w-8 h-8"
          variant="light" 
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#2D3648] leading-tight">{station.name}</h1>
          <p className="text-[13px] text-gray-400 font-medium leading-tight line-clamp-2 mt-1">{camp.title}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {station.description && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-4">
             <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">เกี่ยวกับฐานนี้</h2>
              </div>
            <p className="text-gray-600 text-sm leading-relaxed font-medium">
              {station.description}
            </p>
          </div>
        )}

        {station.mission?.length === 0 && (
          <div className="text-center text-gray-400 py-16 bg-white/40 rounded-2xl border-2 border-dashed border-gray-100">
            <Circle className="mx-auto mb-3 opacity-20" size={48} />
            <p className="font-bold">ยังไม่มีภารกิจในฐานนี้</p>
          </div>
        )}

        <div className="space-y-4">
          {station.mission?.map((mission: any) => {
            const completed = isMissionCompleted(mission.mission_id);
            const isPostTest = mission.type === "POST_TEST";
            const canDoPostTest = isPreTestCompleted();
            const isLocked = isPostTest && !canDoPostTest && !completed;

            return (
              <div
                key={mission.mission_id}
                className={`
                  bg-white p-6 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 cursor-pointer
                  ${
                    isLocked
                      ? "opacity-60 grayscale border-gray-100"
                      : completed
                        ? "border-[#5D7C6F]/20 shadow-sm"
                        : "border-transparent shadow-sm hover:shadow-md"
                  }
                `}
                onClick={() => {
                  if (isLocked) {
                    toast.error(
                      "คุณต้องทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อน จึงจะทำแบบทดสอบหลังเรียนได้",
                    );
                    return;
                  }
                  openMission(mission);
                }}
              >
                <div className={`w-12 h-12 flex items-center justify-center shrink-0`}>
                  {completed ? (
                    <CheckCircle2 className="text-[#10B981]" size={28} />
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-bold text-[#2D3648] truncate`}>
                    {mission.title || "ภารกิจ"}
                    {mission.type === "PRE_TEST" && " (ก่อนเรียน)"}
                    {mission.type === "POST_TEST" && " (หลังเรียน)"}
                  </h3>
                  <p className="text-[14px] text-gray-400 font-medium">
                    {mission.description || "กดเพื่อทำภารกิจ"}
                  </p>
                </div>

                {completed && (
                  <div className="bg-[#E6F4EA] text-[#1E8E3E] text-[13px] font-bold px-3 py-1 rounded-full shrink-0">
                    สำเร็จ
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Execution Modal */}
      <Modal
        classNames={{
          base: "bg-white",
          header: "border-b border-gray-100",
          footer: "border-t border-gray-100",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={(open) => {
          if (!open) {
            setQrScanActive(false);
            setQrScanResult(null);
            qrProcessingRef.current = false;
          }
          if (open) {
            onOpen();
          } else {
            onClose();
          }
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-sm font-normal text-gray-600">
                  ทำภารกิจ
                </span>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedMission?.title}
                  {selectedMission?.type === "PRE_TEST" &&
                    !(selectedMission?.title || "").includes("ก่อนเรียน") &&
                    " (ก่อนเรียน)"}
                </h2>
              </ModalHeader>

              <ModalBody className="py-6 space-y-6">
                {/* Mission Description */}
                {selectedMission?.description && (
                  <div className="bg-blue-50/50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-blue-100/50">
                    <h4 className="font-bold text-[#5d7c6f] mb-1">
                      รายละเอียดภารกิจ:
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {selectedMission.description}
                    </p>
                  </div>
                )}

                {/* QR CODE SCANNING */}
                {selectedMission?.type === "QR_CODE_SCANNING" &&
                  (() => {
                    const currentResult = camp?.missionResults?.find(
                      (r: any) =>
                        r.mission_mission_id === selectedMission?.mission_id,
                    );
                    const isCompleted = currentResult?.status === "completed";

                    if (isCompleted) {
                      return (
                        <div className="flex flex-col items-center py-8 gap-3">
                          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2
                              className="text-green-500"
                              size={44}
                            />
                          </div>
                          <p className="text-lg font-bold text-green-700">
                            สแกนสำเร็จแล้ว!
                          </p>
                          <p className="text-sm text-gray-500">
                            คุณได้ทำภารกิจนี้เรียบร้อยแล้ว
                          </p>
                        </div>
                      );
                    }

                    if (qrScanResult === "success") {
                      return (
                        <div className="flex flex-col items-center py-8 gap-3">
                          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2
                              className="text-green-500"
                              size={44}
                            />
                          </div>
                          <p className="text-lg font-bold text-green-700">
                            สำเร็จ!
                          </p>
                          <p className="text-sm text-gray-600">
                            {qrScanMessage}
                          </p>
                        </div>
                      );
                    }

                    if (qrScanResult === "error") {
                      return (
                        <div className="flex flex-col items-center py-6 gap-4 w-full">
                          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
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
                                onPress={resetQrScan}
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
                      );
                    }

                    // PIN input mode
                    if (showPinInput) {
                      return (
                        <div className="flex flex-col items-center py-4 gap-5 w-full">
                          {/* Camera error banner */}
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
                            <p className="font-bold text-gray-900">
                              กรอกรหัส PIN
                            </p>
                            <p className="text-xs text-gray-600 text-center">
                              ขอรหัส PIN จากครูผู้สอนที่ฐาน
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
                              setPinInput(
                                e.target.value.replace(/\D/g, "").slice(0, 6),
                              )
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
                      );
                    }

                    // Scanner initial UI
                    return (
                      <div className="flex flex-col items-center gap-4">
                        {qrScanActive ? (
                          <div className="w-full max-w-sm mx-auto">
                            <QrScanner
                              active={qrScanActive}
                              onError={(err) => {
                                setQrScanResult("error");
                                setQrScanMessage(err);
                                setQrScanActive(false);
                              }}
                              onScan={handleQrScan}
                            />
                            <p className="text-center text-xs text-gray-600 mt-2">
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
                          <div className="flex flex-col items-center py-4 gap-4 w-full">
                            <div className="w-24 h-24 rounded-2xl bg-[#5d7c6f]/10 flex items-center justify-center">
                              <QrCode className="text-[#5d7c6f]" size={52} />
                            </div>
                            <p className="text-base text-gray-700 text-center">
                              กดปุ่มด้านล่างเพื่อเปิดกล้องแสกน
                              <br />
                              <span className="text-sm text-gray-600">
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
                              className="text-sm text-gray-600 underline underline-offset-2 hover:text-[#5d7c6f] transition-colors"
                              onClick={() => setShowPinInput(true)}
                            >
                              หรือกรอกรหัส PIN แทน
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* Questions (for non-QR missions) */}
                {selectedMission?.type !== "QR_CODE_SCANNING" && (
                  <div className="space-y-6">
                    {(() => {
                      const currentResult = camp?.missionResults?.find(
                        (r: any) =>
                          r.mission_mission_id === selectedMission?.mission_id,
                      );
                      const isSubmitted = currentResult?.status === "completed";

                      return selectedMission?.mission_question?.map(
                        (q: any, idx: number) => (
                          <div key={q.question_id} className="space-y-3">
                            <label className="block font-semibold text-gray-700 break-words leading-relaxed">
                              {idx + 1}. {q.question_text}
                            </label>

                            {q.question_type === "TEXT" && (
                              <Textarea
                                isReadOnly={isSubmitted}
                                minRows={3}
                                classNames={{
                                  input: "text-gray-900 font-medium",
                                }}
                                placeholder={
                                  isSubmitted ? "" : "พิมพ์คำตอบของคุณที่นี่..."
                                }
                                value={answers[q.question_id] || ""}
                                variant="bordered"
                                onValueChange={(val) =>
                                  handleAnswerChange(q.question_id, val)
                                }
                              />
                            )}

                            {q.question_type === "MCQ" && (
                              <div className="space-y-2">
                                {q.choices?.map((c: any, choiceIdx: number) => {
                                  const choiceLetter = String.fromCharCode(
                                    65 + choiceIdx,
                                  );

                                  return (
                                    <div
                                      key={c.choice_id}
                                      className={`
                                      p-3 rounded-lg border flex items-center gap-3 transition-colors
                                      ${
                                        answers[q.question_id] === choiceLetter
                                          ? "bg-[#5d7c6f] text-white border-[#5d7c6f]"
                                          : "bg-white text-gray-700 border-gray-200"
                                      }
                                    ${isSubmitted ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
                                  `}
                                      onClick={() =>
                                        !isSubmitted &&
                                        handleAnswerChange(
                                          q.question_id,
                                          choiceLetter,
                                        )
                                      }
                                    >
                                      <div
                                        className={`
                                        w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs
                                        ${answers[q.question_id] === choiceLetter ? "border-white" : "border-gray-400"}
                                    `}
                                      >
                                        {choiceLetter}
                                      </div>
                                      <span className="min-w-0 break-words">{c.choice_text}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {q.question_type === "PHOTO" && (
                              <div className="space-y-3">
                                {answers[q.question_id] ? (
                                  <div className="relative group w-full max-w-sm">
                                    <img
                                      alt="Uploaded"
                                      className="w-full h-48 object-cover rounded-xl border border-gray-200"
                                      src={answers[q.question_id]}
                                    />
                                    {!isSubmitted && (
                                      <button
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        onClick={() =>
                                          handleAnswerChange(q.question_id, "")
                                        }
                                      >
                                        <X size={16} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-3">
                                    <input
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      id={`file-${q.question_id}`}
                                      type="file"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];

                                        if (file)
                                          handleImageUpload(
                                            q.question_id,
                                            file,
                                          );
                                      }}
                                    />
                                    <div className="flex gap-3">
                                      <Button
                                        className="flex-1 bg-white border-2 border-dashed border-gray-300 hover:border-[#5d7c6f] hover:text-[#5d7c6f] py-4 h-auto rounded-xl transition-all flex flex-col gap-1"
                                        isDisabled={
                                          isSubmitted ||
                                          uploadingQid === q.question_id
                                        }
                                        isLoading={
                                          uploadingQid === q.question_id
                                        }
                                        onPress={() =>
                                          document
                                            .getElementById(
                                              `file-${q.question_id}`,
                                            )
                                            ?.click()
                                        }
                                      >
                                        {uploadingQid === q.question_id ? (
                                          <span className="text-sm font-semibold ml-2">
                                            กำลังอัปโหลด...
                                          </span>
                                        ) : (
                                          <div className="flex flex-col items-center gap-1">
                                            <Camera size={24} />
                                            <span className="text-sm font-semibold">
                                              ถ่ายรูป / เลือกรูป
                                            </span>
                                            <span className="text-[10px] text-gray-600 font-normal">
                                              ขนาดไฟล์รูปภาพสูงสุด 20MB
                                            </span>
                                          </div>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ),
                      );
                    })()}
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                {(() => {
                  const currentResult = camp?.missionResults?.find(
                    (r: any) =>
                      r.mission_mission_id === selectedMission?.mission_id,
                  );
                  const isSubmitted = currentResult?.status === "completed";
                  const isQr = selectedMission?.type === "QR_CODE_SCANNING";

                  // QR mission: only show close button
                  if (isQr) {
                    return (
                      <Button
                        className="bg-gray-100 text-gray-700"
                        onPress={onClose}
                      >
                        ปิดหน้าต่าง
                      </Button>
                    );
                  }

                  const allAnswered = selectedMission?.mission_question?.every(
                    (q: any) =>
                      answers[q.question_id] &&
                      String(answers[q.question_id]).trim() !== "",
                  );

                  return (
                    <>
                      <Button color="danger" variant="light" onPress={onClose}>
                        ปิดหน้าต่าง
                      </Button>
                      {!isSubmitted && (
                        <Button
                          className={`text-white font-bold ${allAnswered ? "bg-[#5d7c6f]" : "bg-gray-500 hover:bg-gray-600"}`}
                          isLoading={submitting}
                          onPress={submitMission}
                        >
                          {allAnswered ? "ส่งคำตอบ" : "บันทึกร่าง"}
                        </Button>
                      )}
                    </>
                  );
                })()}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
