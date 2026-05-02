"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Accordion,
  AccordionItem,
  Select,
  SelectItem,
} from "@heroui/react";
import { useState, useEffect, useMemo } from "react";
import {
  Eye,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Users,
  Search,
  ChevronDown,
  QrCode,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import QRCode from "react-qr-code";

import { useStatusModal } from "@/components/StatusModalProvider";

interface MonitorMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionData: any;
}

export default function MonitorMissionModal({
  isOpen,
  onClose,
  missionData,
}: MonitorMissionModalProps) {
  const { showError } = useStatusModal();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // QR Code for QR_CODE_SCANNING missions
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrPin, setQrPin] = useState<string | null>(null);
  const [qrGeneratedAt, setQrGeneratedAt] = useState<Date | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (isOpen && missionData?.mission_id) {
      fetchResults();
      if (missionData.type === "QR_CODE_SCANNING") {
        fetchQrPayload();
      }
    }
  }, [isOpen, missionData]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/missions/${missionData.mission_id}/results`,
      );

      if (!res.ok) throw new Error("Failed to fetch results");
      const data = await res.json();

      setResults(data);
    } catch (error) {
      console.error(error);
      showError("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลคำตอบได้");
    } finally {
      setLoading(false);
    }
  };

  const fetchQrPayload = async () => {
    try {
      setQrLoading(true);
      const res = await fetch(`/api/missions/${missionData.mission_id}/qr`);

      if (!res.ok) throw new Error("Failed to fetch QR");
      const data = await res.json();

      setQrPayload(data.qrPayload);
      setQrPin(data.pin ?? null);
      setQrGeneratedAt(data.generatedAt ? new Date(data.generatedAt) : null);
    } catch (error) {
      console.error(error);
    } finally {
      setQrLoading(false);
    }
  };

  const regenerateQr = async () => {
    try {
      setRegenerating(true);
      const res = await fetch(`/api/missions/${missionData.mission_id}/qr`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to regenerate");
      const data = await res.json();

      setQrPayload(data.qrPayload);
      setQrPin(data.pin ?? null);
      setQrGeneratedAt(data.generatedAt ? new Date(data.generatedAt) : null);
      setPinCopied(false);
    } catch (error) {
      console.error(error);
    } finally {
      setRegenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const localDateString = dateString.endsWith("Z")
      ? dateString.slice(0, -1)
      : dateString;

    return new Date(localDateString).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (selectedStatus === "submitted" && !r.isSubmitted) return false;
      if (selectedStatus === "unsubmitted" && r.isSubmitted) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = r.studentName?.toLowerCase().includes(query);
        const matchId = String(r.studentId).includes(query);

        if (!matchName && !matchId) return false;
      }

      return true;
    });
  }, [results, selectedStatus, searchQuery]);

  const isQrMission = missionData?.type === "QR_CODE_SCANNING";
  const isMcqMission =
    missionData?.type === "MULTIPLE_CHOICE_QUIZ" ||
    missionData?.type === "PRE_TEST" ||
    missionData?.type === "POST_TEST";
  const totalMcqQuestions = missionData?.mission_question?.length || 0;

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white rounded-2xl shadow-xl max-h-[90vh]",
        backdrop: "bg-black/60 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="3xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#6b857a]">
                <Eye size={24} />
                <h2 className="text-2xl font-bold text-gray-900">
                  ดูคำตอบนักเรียน
                </h2>
              </div>
              <p className="text-sm text-gray-500 font-normal">
                ภารกิจ: {missionData?.title}
              </p>
            </ModalHeader>

            <ModalBody className="py-6 px-6 bg-[#F5F1E8]/30">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* QR CODE DISPLAY for QR missions */}
                  {isQrMission && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <QrCode className="text-[#6b857a]" size={20} />
                        <h3 className="font-bold text-gray-900">
                          QR Code สำหรับภารกิจนี้
                        </h3>
                        <button
                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-[#6b857a] bg-[#6b857a]/10 hover:bg-[#6b857a]/20 transition-colors disabled:opacity-50"
                          disabled={regenerating}
                          title="สุ่ม QR + PIN ใหม่"
                          onClick={regenerateQr}
                        >
                          <RefreshCw
                            className={regenerating ? "animate-spin" : ""}
                            size={13}
                          />
                          สุ่มรหัสใหม่
                        </button>
                      </div>
                      {qrGeneratedAt && (
                        <p className="text-[10px] text-gray-400 text-right -mt-3 mb-2">
                          สร้างเมื่อ{" "}
                          {qrGeneratedAt.toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      )}
                      <div className="flex flex-col items-center gap-3">
                        {qrLoading ? (
                          <div className="w-52 h-52 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : qrPayload ? (
                          <>
                            <div className="p-4 bg-white border-4 border-[#6b857a]/20 rounded-2xl shadow-inner">
                              <QRCode
                                bgColor="#ffffff"
                                fgColor="#2d3748"
                                size={200}
                                value={qrPayload}
                              />
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                              แสดง QR Code
                              นี้ให้นักเรียนแสกนเพื่อบันทึกการทำภารกิจ
                            </p>
                            {/* PIN Section */}
                            {qrPin && (
                              <div className="w-full mt-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-1 h-4 bg-[#6b857a] rounded-full" />
                                  <p className="text-xs font-semibold text-gray-600">
                                    รหัส PIN สำรอง
                                  </p>
                                  <span className="text-[10px] text-gray-400">
                                    (สำหรับนักเรียนที่แสกนไม่ได้)
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 bg-[#6b857a]/5 border-2 border-[#6b857a]/25 rounded-2xl px-5 py-4">
                                  <div className="flex-1 flex gap-2 items-center justify-center">
                                    {qrPin.split("").map((digit, i) => (
                                      <span
                                        key={i}
                                        className="w-10 h-12 bg-white border-2 border-[#6b857a]/30 rounded-xl flex items-center justify-center text-2xl font-black text-[#3d5c52] font-mono shadow-sm"
                                      >
                                        {digit}
                                      </span>
                                    ))}
                                  </div>
                                  <button
                                    className="p-2 rounded-lg text-gray-400 hover:text-[#6b857a] hover:bg-white transition-all border border-transparent hover:border-[#6b857a]/20"
                                    title="คัดลอก PIN"
                                    onClick={() => {
                                      navigator.clipboard.writeText(qrPin);
                                      setPinCopied(true);
                                      setTimeout(
                                        () => setPinCopied(false),
                                        2000,
                                      );
                                    }}
                                  >
                                    {pinCopied ? (
                                      <Check
                                        className="text-green-500"
                                        size={18}
                                      />
                                    ) : (
                                      <Copy size={18} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-400 text-sm">
                            ไม่สามารถโหลด QR Code ได้
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats + Filter row */}
                  {results.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="p-2 bg-[#6b857a]/10 rounded-lg text-[#6b857a]">
                          <Users size={18} />
                        </div>
                        <span>
                          ส่งแล้ว{" "}
                          <strong className="text-gray-900 text-lg">
                            {results.filter((r) => r.isSubmitted).length}
                          </strong>{" "}
                          / {results.length} คน
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                        <div className="relative w-full sm:w-48">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            className="pl-9 pr-4 py-1.5 text-sm h-[32px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#6b857a] w-full bg-gray-50 hover:bg-gray-100 transition-colors"
                            placeholder="ค้นหานักเรียน..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <div className="w-full sm:w-40">
                          <Select
                            aria-label="Filter status"
                            classNames={{
                              trigger:
                                "border-gray-200 hover:border-[#6b857a] bg-gray-50 min-h-[32px] h-[32px]",
                              value: "text-gray-700 font-medium text-sm",
                            }}
                            selectedKeys={[selectedStatus]}
                            size="sm"
                            variant="bordered"
                            onSelectionChange={(keys) => {
                              const val = Array.from(keys)[0] as string;

                              setSelectedStatus(val || "all");
                            }}
                          >
                            <SelectItem key="all" textValue="นักเรียนทุกคน">
                              นักเรียนทุกคน
                            </SelectItem>
                            <SelectItem key="submitted" textValue="ส่งแล้ว">
                              ส่งแล้ว
                            </SelectItem>
                            <SelectItem key="unsubmitted" textValue="ยังไม่ส่ง">
                              ยังไม่ส่ง
                            </SelectItem>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student list */}
                  {results.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Users size={32} />
                      </div>
                      <p className="text-gray-500 font-medium">
                        ยังไม่มีนักเรียนในฐานนี้
                      </p>
                    </div>
                  ) : filteredResults.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      ไม่พบนักเรียนที่คุณค้นหา
                    </div>
                  ) : isQrMission ? (
                    // QR mission: simple list (no answers to show)
                    <div className="space-y-3">
                      {filteredResults.map((result) => (
                        <div
                          key={result.enrollmentId}
                          className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
                        >
                          <div className="w-10 h-10 bg-[#6b857a]/10 rounded-full flex items-center justify-center text-[#6b857a] shrink-0">
                            <User size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {result.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              รหัส: {result.studentId}
                            </p>
                          </div>
                          {result.isSubmitted ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full text-xs font-bold">
                                <CheckCircle2 size={14} />
                                แสกนแล้ว
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatDate(result.submittedAt)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full text-xs font-medium shrink-0">
                              <XCircle size={14} />
                              ยังไม่แสกน
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Non-QR mission: Accordion with answers
                    <Accordion
                      key={`${selectedStatus}-${searchQuery}`}
                      className="px-0 gap-4"
                      defaultExpandedKeys={[]}
                      selectionMode="multiple"
                      variant="splitted"
                    >
                      {filteredResults.map((result) => (
                        <AccordionItem
                          key={String(result.enrollmentId)}
                          aria-label={result.studentName}
                          classNames={{
                            base: "bg-white group-[.is-splitted]:shadow-sm group-[.is-splitted]:border border-gray-100 rounded-xl overflow-hidden",
                            title: "w-full",
                            trigger:
                              "py-4 px-5 hover:bg-gray-50/50 transition-colors",
                            content: "pt-0 pb-6 px-6",
                          }}
                          indicator={({ isOpen }) => (
                            <div
                              className={`p-1.5 rounded-lg transition-colors ${isOpen ? "bg-[#6b857a] text-white" : "bg-gray-100 text-gray-400"}`}
                            >
                              <ChevronDown
                                className={`transition-transform duration-0 ${isOpen ? "rotate-270" : ""}`}
                                size={18}
                              />
                            </div>
                          )}
                          title={
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#6b857a]/10 rounded-full flex items-center justify-center text-[#6b857a]">
                                  <User size={20} />
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-gray-900 leading-tight">
                                    {result.studentName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    รหัส: {result.studentId}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full">
                                {isMcqMission && result.isSubmitted && (
                                  <div className="sm:mr-2 flex items-center gap-1.5 bg-[#6b857a]/10 text-[#6b857a] px-3 py-1 rounded-full border border-[#6b857a]/20">
                                    <span className="font-bold">
                                      คะแนน:{" "}
                                      {result.answers?.filter(
                                        (ans: any) => ans.isCorrect === true,
                                      ).length || 0}{" "}
                                      / {totalMcqQuestions}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  {result.isSubmitted ? (
                                    <>
                                      <Clock
                                        className="text-green-600"
                                        size={12}
                                      />
                                      <span className="text-green-700">
                                        {formatDate(result.submittedAt)}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-500">
                                      ยังไม่ส่งงาน
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          }
                        >
                          {result.isSubmitted ? (
                            <>
                              <div className="divider h-px bg-gray-100 w-full mb-5" />
                              <div className="space-y-5">
                                {result.answers.map((ans: any, idx: number) => (
                                  <div
                                    key={ans.questionId}
                                    className="space-y-2"
                                  >
                                    <div className="flex gap-2">
                                      <span className="text-gray-300 font-bold text-lg leading-none">
                                        {String(idx + 1).padStart(2, "0")}
                                      </span>
                                      <p className="text-sm font-semibold text-gray-700 pt-0.5">
                                        {ans.questionText || "คำถาม"}
                                      </p>
                                    </div>

                                    <div className="bg-[#6b857a]/5 p-4 rounded-xl text-sm text-gray-800 border border-[#6b857a]/10 ml-7">
                                      {ans.type === "TEXT" && (
                                        <span className="whitespace-pre-wrap leading-relaxed">
                                          {ans.answerText}
                                        </span>
                                      )}

                                      {ans.type === "MCQ" && (
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-[#6b857a]">
                                            {ans.answerText}
                                          </span>
                                          {ans.isCorrect === true && (
                                            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100">
                                              <CheckCircle2 size={14} />
                                              ถูกต้อง
                                            </div>
                                          )}
                                          {ans.isCorrect === false && (
                                            <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100">
                                              <XCircle size={14} />
                                              ไม่ถูกต้อง
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {ans.type === "PHOTO" && (
                                        <div className="space-y-2">
                                          <div className="relative group">
                                            <img
                                              alt="Student submission"
                                              className="w-full max-w-md rounded-lg shadow-sm border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                                              src={ans.answerText}
                                              onClick={() =>
                                                window.open(
                                                  ans.answerText,
                                                  "_blank",
                                                )
                                              }
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">
                                              คลิกที่รูปเพื่อดูขนาดใหญ่
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="py-6 text-center text-gray-500 font-medium">
                              นักเรียนยังไม่ได้ส่งงาน
                            </div>
                          )}
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="p-4 border-t border-gray-100">
              <Button
                fullWidth
                className="bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
                size="lg"
                onPress={onClose}
              >
                ปิดหน้าต่าง
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
