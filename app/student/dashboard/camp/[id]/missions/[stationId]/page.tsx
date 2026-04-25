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
import { ChevronLeft, CheckCircle2, Circle, Camera, Loader2, X, QrCode, ScanLine } from "lucide-react";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

export default function StudentStationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id, stationId } = params;

  const [camp, setCamp] = useState<any>(null);
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mission Execution State
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({}); // { questionId: value }
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQid, setUploadingQid] = useState<number | null>(null);

  // QR Scan State
  const [qrScanActive, setQrScanActive] = useState(false);
  const [qrScanResult, setQrScanResult] = useState<'success' | 'alreadyDone' | 'error' | null>(null);
  const [qrScanMessage, setQrScanMessage] = useState('');
  const qrProcessingRef = useRef(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const fetchCamp = async () => {
    try {
      const res = await fetch("/api/student/camps", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const foundCamp = data.find((c: any) => c.id === Number(id));

        if (foundCamp) {
          if (!foundCamp.isRegistered) {
            toast.error("กรุณาลงทะเบียนเข้าร่วมค่ายก่อนเข้าถึงหน้าภารกิจ");
            router.replace(`/student/dashboard/camp/${id}`);
            return;
          }
          // ตรวจสอบว่าค่ายเริ่มแล้วหรือยัง
          if (foundCamp.rawStartDate && new Date() < new Date(foundCamp.rawStartDate)) {
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
    fetchCamp();
  }, [id, stationId]);

  const openMission = (mission: any) => {
    setSelectedMission(mission);

    // Reset QR state
    setQrScanActive(false);
    setQrScanResult(null);
    setQrScanMessage('');
    setShowPinInput(false);
    setPinInput('');
    qrProcessingRef.current = false;
    
    const existingResult = camp?.missionResults?.find((r: any) => r.mission_mission_id === mission.mission_id);
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
      const res = await fetch('/api/student/mission/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload: payload }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setQrScanResult(data.alreadyCompleted ? 'alreadyDone' : 'success');
        setQrScanMessage(data.message);
        if (!data.alreadyCompleted) {
          await fetchCamp();
        }
      } else {
        setQrScanResult('error');
        setQrScanMessage(data.error || 'QR Code ไม่ถูกต้อง');
        qrProcessingRef.current = false; // Allow retry
      }
    } catch {
      setQrScanResult('error');
      setQrScanMessage('เกิดข้อผิดพลาดในการแสกน');
      qrProcessingRef.current = false;
    }
  };

  const resetQrScan = () => {
    setQrScanResult(null);
    setQrScanMessage('');
    setPinInput('');
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
      const res = await fetch('/api/student/mission/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim(), missionId: selectedMission.mission_id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQrScanResult(data.alreadyCompleted ? 'alreadyDone' : 'success');
        setQrScanMessage(data.message);
        if (!data.alreadyCompleted) await fetchCamp();
      } else {
        setQrScanResult('error');
        setQrScanMessage(data.error || 'รหัส PIN ไม่ถูกต้อง');
      }
    } catch {
      setQrScanResult('error');
      setQrScanMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setPinSubmitting(false);
    }
  };

  const requestCameraAndStartScan = async () => {
    // ลอง constraint จากเข้มไปหยาบ เพื่อรองรับทุกอุปกรณ์
    const constraints = [
      { video: { facingMode: { ideal: 'environment' } } }, // กล้องหลัง (preferred)
      { video: { facingMode: 'user' } },                   // กล้องหน้า (fallback)
      { video: true },                                      // ใดก็ได้ (last resort)
    ];

    let lastError: any = null;
    for (const constraint of constraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        // Permission ผ่านแล้ว — ปิด stream ทันที QrScanner จะเปิดเอง
        stream.getTracks().forEach(track => track.stop());
        setQrScanActive(true);
        return;
      } catch (err: any) {
        lastError = err;
        // ถ้าถูกปฏิเสธ permission ไม่ต้องลองต่อ
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') break;
        // ถ้าเป็น constraint ไม่รองรับ ลอง fallback ต่อไป
      }
    }

    // ทุก fallback ล้มเหลว
    const isDenied = lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError';
    setQrScanResult('error');
    setQrScanMessage(
      isDenied
        ? 'ไม่ได้รับอนุญาตเข้าถึงกล้อง กรุณาอนุญาตในการตั้งค่าเบราว์เซอร์แล้วลองใหม่'
        : 'ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบว่าอุปกรณ์มีกล้องและเบราว์เซอร์รองรับ'
    );
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers((prev: any) => ({ ...prev, [questionId]: value }));
  };

  const handleImageUpload = async (questionId: number, file: File) => {
    if (!file) return;
    setUploadingQid(questionId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        handleAnswerChange(questionId, data.url);
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      } else {
        toast.error("อัปโหลดล้มเหลว");
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
      (q: any) => !answers[q.question_id] || String(answers[q.question_id]).trim() === ""
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

    // Check if any result confirms completion for this mission
    // status='completed'
    return camp.missionResults.some(
      (r: any) =>
        r.mission_mission_id === missionId && r.status === "completed",
    );
  };

  if (loading)
    return (
      <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">
        กำลังโหลด...
      </div>
    );
  if (!station)
    return (
      <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">
        ไม่พบฐานกิจกรรม
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-50">
        <Button isIconOnly variant="light" onPress={() => router.back()}>
          <ChevronLeft className="text-gray-600" size={24} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-[#2d3748]">{station.name}</h1>
          <p className="text-sm text-gray-500">{camp.title}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <p className="text-gray-600 mb-6">{station.description}</p>

        {station.mission?.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            ยังไม่มีภารกิจในฐานนี้
          </div>
        )}

        {station.mission?.map((mission: any) => {
          const completed = isMissionCompleted(mission.mission_id);

          return (
            <div
              key={mission.mission_id}
              className={`
                                bg-white p-5 rounded-2xl shadow-sm border transition-all cursor-pointer
                                ${completed ? "border-green-200 bg-green-50 hover:border-green-300" : "border-transparent hover:border-[#5d7c6f]"}
                            `}
              onClick={() => openMission(mission)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 ${completed ? "text-green-600" : "text-gray-400"}`}
                  >
                    {completed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${completed ? "text-green-800" : "text-gray-800"}`}
                    >
                      {mission.title || "ภารกิจ"}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {mission.description}
                    </p>
                  </div>
                </div>
                {completed && (
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    สำเร็จ
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
          onOpenChange(open);
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-sm font-normal text-gray-500">ทำภารกิจ</span>
                <h2 className="text-xl font-bold">{selectedMission?.title}</h2>
              </ModalHeader>

              <ModalBody className="py-6 space-y-6">
                {/* Mission Description */}
                {selectedMission?.description && (
                  <div className="bg-blue-50/50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-blue-100/50">
                    <h4 className="font-bold text-[#5d7c6f] mb-1">รายละเอียดภารกิจ:</h4>
                    <p className="whitespace-pre-wrap">{selectedMission.description}</p>
                  </div>
                )}

                {/* QR CODE SCANNING */}
                {selectedMission?.type === 'QR_CODE_SCANNING' && (() => {
                  const currentResult = camp?.missionResults?.find((r: any) => r.mission_mission_id === selectedMission?.mission_id);
                  const isCompleted = currentResult?.status === 'completed';

                  if (isCompleted) {
                    return (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 size={44} className="text-green-500" />
                        </div>
                        <p className="text-lg font-bold text-green-700">สแกนสำเร็จแล้ว!</p>
                        <p className="text-sm text-gray-500">คุณได้ทำภารกิจนี้เรียบร้อยแล้ว</p>
                      </div>
                    );
                  }

                  if (qrScanResult === 'success') {
                    return (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 size={44} className="text-green-500" />
                        </div>
                        <p className="text-lg font-bold text-green-700">สำเร็จ!</p>
                        <p className="text-sm text-gray-600">{qrScanMessage}</p>
                      </div>
                    );
                  }

                  if (qrScanResult === 'error') {
                    return (
                      <div className="flex flex-col items-center py-6 gap-4 w-full">
                        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                          <X size={40} className="text-red-400" />
                        </div>
                        <p className="text-base font-semibold text-red-600 text-center">{qrScanMessage}</p>
                        <div className="flex flex-col w-full gap-2">
                          {!showPinInput && (
                            <Button
                              className="w-full bg-[#5d7c6f] text-white font-semibold"
                              onPress={resetQrScan}
                              startContent={<ScanLine size={18} />}
                            >
                              ลองสแกนอีกครั้ง
                            </Button>
                          )}
                          <Button
                            className="w-full bg-gray-100 text-gray-700 font-medium"
                            variant="flat"
                            onPress={() => { setQrScanResult(null); setQrScanMessage(''); setPinInput(''); setShowPinInput(true); }}
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
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-16 h-16 rounded-2xl bg-[#5d7c6f]/10 flex items-center justify-center mb-1">
                            <span className="text-3xl">🔢</span>
                          </div>
                          <p className="font-bold text-gray-800">กรอกรหัส PIN</p>
                          <p className="text-xs text-gray-400 text-center">ขอรหัส PIN จากครูผู้สอนที่ฐาน</p>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="000000"
                          className="w-40 text-center text-3xl font-black tracking-[0.35em] font-mono border-2 border-gray-200 focus:border-[#5d7c6f] rounded-xl py-3 outline-none transition-colors bg-gray-50"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onKeyDown={(e) => { if (e.key === 'Enter' && pinInput.length === 6) handlePinSubmit(); }}
                        />
                        <div className="flex flex-col w-full gap-2">
                          <Button
                            className="w-full bg-[#5d7c6f] text-white font-bold"
                            size="lg"
                            isDisabled={pinInput.length !== 6}
                            isLoading={pinSubmitting}
                            onPress={handlePinSubmit}
                          >
                            ยืนยันรหัส PIN
                          </Button>
                          <Button
                            className="w-full text-gray-500"
                            variant="light"
                            onPress={() => { setShowPinInput(false); setPinInput(''); }}
                            startContent={<ScanLine size={16} />}
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
                            onScan={handleQrScan}
                            onError={(err) => {
                              setQrScanResult('error');
                              setQrScanMessage(err);
                              setQrScanActive(false);
                            }}
                          />
                          <p className="text-center text-xs text-gray-400 mt-2">จัดกล้องให้ตรง QR Code ของครู</p>
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
                            <QrCode size={52} className="text-[#5d7c6f]" />
                          </div>
                          <p className="text-base text-gray-600 text-center">
                            กดปุ่มด้านล่างเพื่อเปิดกล้องแสกน<br/>
                            <span className="text-sm text-gray-400">QR Code ที่ครูแสดง</span>
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
                  );
                })()}

                {/* Questions (for non-QR missions) */}
                {selectedMission?.type !== 'QR_CODE_SCANNING' && (
                <div className="space-y-6">
                  {(() => {
                    const currentResult = camp?.missionResults?.find((r: any) => r.mission_mission_id === selectedMission?.mission_id);
                    const isSubmitted = currentResult?.status === "completed";
                    
                    return selectedMission?.mission_question?.map(
                      (q: any, idx: number) => (
                        <div key={q.question_id} className="space-y-3">
                          <label className="block font-semibold text-gray-700">
                            {idx + 1}. {q.question_text}
                          </label>

                          {q.question_type === "TEXT" && (
                            <Textarea
                              minRows={3}
                              placeholder={isSubmitted ? "" : "พิมพ์คำตอบของคุณที่นี่..."}
                              value={answers[q.question_id] || ""}
                              variant="bordered"
                              isReadOnly={isSubmitted}
                              onValueChange={(val) =>
                                handleAnswerChange(q.question_id, val)
                              }
                            />
                        )}

                        {q.question_type === "MCQ" && (
                          <div className="space-y-2">
                            {q.choices?.map((c: any, choiceIdx: number) => {
                              const choiceLetter = String.fromCharCode(65 + choiceIdx);
                              return (
                                <div
                                  key={c.choice_id}
                                  className={`
                                      p-3 rounded-lg border flex items-center gap-3 transition-colors
                                      ${answers[q.question_id] === choiceLetter
                                      ? "bg-[#5d7c6f] text-white border-[#5d7c6f]"
                                      : "bg-white text-gray-700 border-gray-200"
                                    }
                                    ${isSubmitted ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
                                  `}
                                  onClick={() =>
                                    !isSubmitted && handleAnswerChange(q.question_id, choiceLetter)
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
                                  <span>{c.choice_text}</span>
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
                                  src={answers[q.question_id]}
                                  alt="Uploaded"
                                  className="w-full h-48 object-cover rounded-xl border border-gray-200"
                                />
                                {!isSubmitted && (
                                  <button
                                    onClick={() => handleAnswerChange(q.question_id, "")}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3">
                                <input
                                  type="file"
                                  id={`file-${q.question_id}`}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(q.question_id, file);
                                  }}
                                />
                                <div className="flex gap-3">
                                  <Button
                                    isDisabled={isSubmitted || uploadingQid === q.question_id}
                                    onPress={() => document.getElementById(`file-${q.question_id}`)?.click()}
                                    className="flex-1 bg-white border-2 border-dashed border-gray-300 hover:border-[#5d7c6f] hover:text-[#5d7c6f] h-24 rounded-xl transition-all flex flex-col gap-1"
                                    isLoading={uploadingQid === q.question_id}
                                  >
                                    {uploadingQid === q.question_id ? (
                                      <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                      <>
                                        <Camera size={24} />
                                        <span className="text-xs font-semibold">ถ่ายรูป / เลือกรูป</span>
                                      </>
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
                  const currentResult = camp?.missionResults?.find((r: any) => r.mission_mission_id === selectedMission?.mission_id);
                  const isSubmitted = currentResult?.status === "completed";
                  const isQr = selectedMission?.type === 'QR_CODE_SCANNING';

                  // QR mission: only show close button
                  if (isQr) {
                    return (
                      <Button className="bg-gray-100 text-gray-700" onPress={onClose}>
                        ปิดหน้าต่าง
                      </Button>
                    );
                  }

                  const allAnswered = selectedMission?.mission_question?.every(
                    (q: any) => answers[q.question_id] && String(answers[q.question_id]).trim() !== ""
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
