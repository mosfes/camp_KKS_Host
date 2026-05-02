"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";
import { useState, useEffect, useMemo } from "react";
import {
  UserCheck,
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Trash2,
  Plus,
  CheckSquare,
} from "lucide-react";
import QRCode from "react-qr-code";

import { useStatusModal } from "@/components/StatusModalProvider";

interface RoundInfo {
  roundId: string;
  roundNumber: number;
  description: string;
  createdAt: string;
  expiresAt: string;
  isClosed: boolean;
  closedAt: string | null;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName?: string;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  campId,
  campName,
}: AttendanceModalProps) {
  const { showError, showConfirm, close } = useStatusModal();

  // QR / PIN state
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrPin, setQrPin] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [roundDescription, setRoundDescription] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Rounds state
  const [rounds, setRounds] = useState<RoundInfo[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);

  // Student list state
  const [results, setResults] = useState<any[]>([]);
  const [totalCheckedIn, setTotalCheckedIn] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ─── Fetch helpers ────────────────────────────────────────────────────────

  const fetchResults = async (roundId?: string | null) => {
    try {
      setResultsLoading(true);
      const rid = roundId !== undefined ? roundId : selectedRoundId;
      const url = rid
        ? `/api/attendance/${campId}/results?roundId=${rid}`
        : `/api/attendance/${campId}/results`;
      const res = await fetch(url);

      if (!res.ok) throw new Error();
      const data = await res.json();

      setResults(data.results ?? []);
      setTotalCheckedIn(data.totalCheckedIn ?? 0);
    } catch {
    } finally {
      setResultsLoading(false);
    }
  };

  const fetchQr = async (): Promise<{
    roundId: string | null;
    rounds: RoundInfo[];
  }> => {
    try {
      setQrLoading(true);
      const res = await fetch(`/api/attendance/${campId}/qr`);

      if (!res.ok) throw new Error();
      const data = await res.json();
      const fetchedRounds: RoundInfo[] = data.rounds ?? [];

      setRounds(fetchedRounds);
      if (data.active) {
        setQrPayload(data.qrPayload);
        setQrPin(data.pin ?? null);
        setQrExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
        setActiveRoundId(data.roundId);

        return { roundId: data.roundId, rounds: fetchedRounds };
      } else {
        setQrPayload(null);
        setQrPin(null);
        setQrExpiresAt(null);
        setActiveRoundId(null);
        const lastRound = fetchedRounds[fetchedRounds.length - 1] ?? null;

        return { roundId: lastRound?.roundId ?? null, rounds: fetchedRounds };
      }
    } catch {
      return { roundId: null, rounds: [] };
    } finally {
      setQrLoading(false);
    }
  };

  // โหลดครั้งแรกเมื่อเปิด modal
  useEffect(() => {
    if (!isOpen || !campId) return;
    (async () => {
      const { roundId } = await fetchQr();

      setSelectedRoundId(roundId);
      await fetchResults(roundId);
    })();
  }, [isOpen, campId]);

  // Auto-refresh ทุก 10 วินาที
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(() => fetchResults(), 10000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, selectedRoundId]);

  // เมื่อเลือกรอบอื่น
  const handleSelectRound = (roundId: string) => {
    setSelectedRoundId(roundId);
    fetchResults(roundId);
    setSearchQuery("");
    setSelectedStatus("all");
  };

  const regenerateQr = async () => {
    try {
      setRegenerating(true);
      const res = await fetch(`/api/attendance/${campId}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes,
          description: roundDescription,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      setQrPayload(data.qrPayload);
      setQrPin(data.pin ?? null);
      setQrExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
      setActiveRoundId(data.roundId);
      setRounds(data.rounds ?? []);
      setSelectedRoundId(data.roundId);
      setPinCopied(false);
      setRoundDescription("");
      await fetchResults(data.roundId);
    } catch {
    } finally {
      setRegenerating(false);
    }
  };

  const handleCloseSession = () => {
    showConfirm(
      "ปิดรับเช็คชื่อ",
      "คุณแน่ใจหรือไม่? นักเรียนจะไม่สามารถเช็คชื่อในรอบนี้ได้อีก",
      async () => {
        const res = await fetch(`/api/attendance/${campId}/qr`, {
          method: "DELETE",
        });

        if (!res.ok) return;
        const data = await res.json();

        setQrPayload(null);
        setQrPin(null);
        setQrExpiresAt(null);
        setActiveRoundId(null);
        setRounds(data.rounds ?? []);
        close();
      },
      "ปิดรับเช็คชื่อ",
    );
  };

  const handleClearRound = () => {
    const label =
      selectedRoundId === activeRoundId
        ? "รอบนี้"
        : `รอบที่ ${rounds.find((r) => r.roundId === selectedRoundId)?.roundNumber ?? ""}`;

    showConfirm(
      "ล้างข้อมูลเช็คชื่อ",
      `คุณแน่ใจหรือไม่? ข้อมูลการเช็คชื่อ${label}จะถูกล้าง`,
      async () => {
        await fetch(
          `/api/attendance/${campId}/results?roundId=${selectedRoundId}`,
          { method: "DELETE" },
        );
        fetchResults(selectedRoundId);
        close();
      },
      "ล้างข้อมูล",
    );
  };

  const handleClearAll = () => {
    showConfirm(
      "ล้างข้อมูลทั้งหมด",
      "คุณแน่ใจหรือไม่? ข้อมูลเช็คชื่อทุกรอบและประวัติรอบจะถูกล้างทั้งหมด",
      async () => {
        await fetch(`/api/attendance/${campId}/results`, { method: "DELETE" });
        setRounds([]);
        setSelectedRoundId(null);
        setActiveRoundId(null);
        setQrPayload(null);
        setQrPin(null);
        setQrExpiresAt(null);
        fetchResults(null);
        close();
      },
      "ล้างทั้งหมด",
    );
  };

  const handleToggleCheckin = async (
    studentId: number,
    enrollmentId: number,
    isCheckedIn: boolean,
    studentName: string,
  ) => {
    if (!selectedRoundId) {
      showError(
        "ไม่สามารถเช็คชื่อได้",
        "กรุณาสร้างรอบการเช็คชื่อก่อน หรือเลือกรอบที่ต้องการเช็คชื่อ",
      );

      return;
    }

    const title = isCheckedIn ? "ยกเลิกการเช็คชื่อ" : "ยืนยันการเช็คชื่อ";
    const message = isCheckedIn
      ? `คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเช็คชื่อของ "${studentName}" (รหัส: ${studentId}) ?`
      : `คุณต้องการเช็คชื่อให้ "${studentName}" (รหัส: ${studentId}) ใช่หรือไม่?`;
    const confirmText = isCheckedIn ? "ยกเลิกเช็คชื่อ" : "ยืนยันเช็คชื่อ";

    showConfirm(
      title,
      message,
      async () => {
        try {
          const res = await fetch(`/api/attendance/${campId}/manual-checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roundId: selectedRoundId,
              studentId,
              enrollmentId,
              action: isCheckedIn ? "uncheck" : "checkin",
            }),
          });

          if (res.ok) fetchResults(selectedRoundId);
          close();
        } catch {}
      },
      confirmText,
    );
  };

  const formatTime = (d: string | Date) => {
    const s =
      typeof d === "string"
        ? d.endsWith("Z")
          ? d.slice(0, -1)
          : d
        : d.toISOString();

    return new Date(s).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const filteredResults = useMemo(
    () =>
      results.filter((r) => {
        if (selectedStatus === "checked" && !r.isCheckedIn) return false;
        if (selectedStatus === "unchecked" && r.isCheckedIn) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();

          if (
            !r.studentName?.toLowerCase().includes(q) &&
            !String(r.studentId).includes(q)
          )
            return false;
        }

        return true;
      }),
    [results, selectedStatus, searchQuery],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

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
            {/* Header */}
            <ModalHeader className="flex flex-col gap-1 p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#6b857a]">
                <UserCheck size={24} />
                <h2 className="text-2xl font-bold text-gray-900">
                  เช็คชื่อนักเรียน
                </h2>
              </div>
              {campName && (
                <p className="text-sm text-gray-500 font-normal">
                  ค่าย: {campName}
                </p>
              )}
            </ModalHeader>

            {/* Body */}
            <ModalBody className="py-6 px-6 bg-[#F5F1E8]/30">
              <div className="space-y-4">
                {/* ─── QR Section ─── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="text-[#6b857a] shrink-0" size={20} />
                      <h3 className="font-bold text-gray-900">
                        QR Code สำหรับเช็คชื่อ
                      </h3>
                    </div>
                    {qrPayload && (
                      <div className="sm:ml-auto flex items-center gap-2 w-full sm:w-auto">
                        <button
                          className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-lg text-[#6b857a] bg-[#6b857a]/10 hover:bg-[#6b857a]/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                          disabled={regenerating}
                          onClick={regenerateQr}
                        >
                          <RefreshCw
                            className={regenerating ? "animate-spin" : ""}
                            size={13}
                          />
                          สุ่มรหัสใหม่
                        </button>
                        <button
                          className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap"
                          onClick={handleCloseSession}
                        >
                          <XCircle size={13} />
                          ปิดรับเช็คชื่อ
                        </button>
                      </div>
                    )}
                  </div>

                  {qrExpiresAt && qrPayload && (
                    <p className="text-[12px] text-red-500 sm:text-right mb-3 sm:-mt-3 font-semibold text-center sm:text-right">
                      หมดเวลาเช็คชื่อ:{" "}
                      {qrExpiresAt.toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
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
                          แสดง QR Code นี้ให้นักเรียนแสกนเพื่อเช็คชื่อ
                        </p>
                        {qrPin && (
                          <div className="w-full mt-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-1 h-4 bg-[#6b857a] rounded-full shrink-0" />
                              <p className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                รหัส PIN สำรอง
                              </p>
                              <span className="text-[10px] text-gray-400 truncate">
                                (สำหรับนักเรียนที่แสกนไม่ได้)
                              </span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 bg-[#6b857a]/5 border-2 border-[#6b857a]/25 rounded-2xl px-3 sm:px-5 py-3 sm:py-4 w-full">
                              <div className="flex-1 flex gap-1 sm:gap-2 items-center justify-center">
                                {qrPin.split("").map((digit, i) => (
                                  <span
                                    key={i}
                                    className="w-8 h-10 sm:w-10 sm:h-12 bg-white border-2 border-[#6b857a]/30 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black text-[#3d5c52] font-mono shadow-sm"
                                  >
                                    {digit}
                                  </span>
                                ))}
                              </div>
                              <button
                                className="p-2 shrink-0 rounded-lg text-gray-400 hover:text-[#6b857a] hover:bg-white transition-all border border-transparent hover:border-[#6b857a]/20"
                                onClick={() => {
                                  navigator.clipboard.writeText(qrPin);
                                  setPinCopied(true);
                                  setTimeout(() => setPinCopied(false), 2000);
                                }}
                              >
                                {pinCopied ? (
                                  <Check className="text-green-500" size={18} />
                                ) : (
                                  <Copy size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* ─── Create New Round ─── */
                      <div className="flex flex-col items-center gap-4 py-4 w-full">
                        <div className="w-14 h-14 bg-[#6b857a]/10 rounded-full flex items-center justify-center text-[#6b857a]">
                          <Clock size={28} />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-900 font-bold">
                            สร้างรอบการเช็คชื่อใหม่
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {rounds.length > 0
                              ? `รอบที่ ${rounds.length + 1} — ค่ายนี้เช็คชื่อแล้ว ${rounds.length} รอบ`
                              : "กำหนดเวลาที่ให้นักเรียนเช็คชื่อได้"}
                          </p>
                        </div>
                        <div className="w-full max-w-xs space-y-3 mt-1">
                          <input
                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#6b857a] bg-white"
                            placeholder={`ชื่อรอบ (เช่น รอบเช้า, รอบที่ ${rounds.length + 1})`}
                            type="text"
                            value={roundDescription}
                            onChange={(e) =>
                              setRoundDescription(e.target.value)
                            }
                          />
                          <Select
                            classNames={{ trigger: "bg-white" }}
                            label="ระยะเวลาเช็คชื่อ"
                            placeholder="เลือกระยะเวลา"
                            selectedKeys={[durationMinutes]}
                            variant="bordered"
                            onSelectionChange={(keys) =>
                              setDurationMinutes(Array.from(keys)[0] as string)
                            }
                          >
                            <SelectItem key="10" textValue="10 นาที">
                              10 นาที
                            </SelectItem>
                            <SelectItem key="15" textValue="15 นาที">
                              15 นาที
                            </SelectItem>
                            <SelectItem key="30" textValue="30 นาที">
                              30 นาที
                            </SelectItem>
                            <SelectItem key="60" textValue="1 ชั่วโมง">
                              1 ชั่วโมง
                            </SelectItem>
                            <SelectItem key="120" textValue="2 ชั่วโมง">
                              2 ชั่วโมง
                            </SelectItem>
                            <SelectItem key="240" textValue="4 ชั่วโมง">
                              4 ชั่วโมง
                            </SelectItem>
                          </Select>
                          <Button
                            className="w-full bg-[#6b857a] font-medium"
                            color="primary"
                            isLoading={regenerating}
                            startContent={!regenerating && <Plus size={16} />}
                            onPress={regenerateQr}
                          >
                            เริ่มรอบเช็คชื่อ
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Round Selector ─── */}
                {rounds.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckSquare className="text-[#6b857a]" size={16} />
                      <p className="text-sm font-semibold text-gray-700">
                        รอบการเช็คชื่อ
                      </p>
                      <span className="ml-auto text-xs text-gray-400">
                        {rounds.length} รอบ
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {rounds.map((round) => {
                        const isActive = round.roundId === activeRoundId;
                        const isSelected = round.roundId === selectedRoundId;

                        return (
                          <button
                            key={round.roundId}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              isSelected
                                ? "bg-[#6b857a] text-white border-[#6b857a]"
                                : isActive
                                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                            onClick={() => handleSelectRound(round.roundId)}
                          >
                            {isActive && (
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            )}
                            {round.description}
                            {isActive && (
                              <span className="text-[10px] opacity-75">
                                ● กำลังเปิด
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedRoundId &&
                      rounds.find((r) => r.roundId === selectedRoundId) && (
                        <p className="text-[11px] text-gray-400 mt-2">
                          เริ่ม:{" "}
                          {formatTime(
                            rounds.find((r) => r.roundId === selectedRoundId)!
                              .createdAt,
                          )}
                          {" · "}หมดเวลา:{" "}
                          {formatTime(
                            rounds.find((r) => r.roundId === selectedRoundId)!
                              .expiresAt,
                          )}
                        </p>
                      )}
                  </div>
                )}

                {/* ─── Stats + Filter ─── */}
                <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#6b857a]/10 rounded-lg text-[#6b857a]">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          เช็คชื่อแล้ว{" "}
                          <strong className="text-gray-900 text-xl">
                            {totalCheckedIn}
                          </strong>{" "}
                          / {results.length} คน
                        </p>
                        {results.length > 0 && (
                          <div className="w-48 h-2 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-[#6b857a] rounded-full transition-all duration-500"
                              style={{
                                width: `${(totalCheckedIn / results.length) * 100}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                      <div className="relative w-full sm:w-48">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          className="pl-9 pr-4 py-1.5 text-sm h-[32px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#6b857a] w-full bg-gray-50"
                          placeholder="ค้นหานักเรียน..."
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="w-full sm:w-44">
                        <Select
                          aria-label="Filter status"
                          classNames={{
                            trigger:
                              "border-gray-200 bg-gray-50 min-h-[32px] h-[32px]",
                            value: "text-gray-700 font-medium text-sm",
                          }}
                          selectedKeys={[selectedStatus]}
                          size="sm"
                          variant="bordered"
                          onSelectionChange={(keys) =>
                            setSelectedStatus(
                              (Array.from(keys)[0] as string) || "all",
                            )
                          }
                        >
                          <SelectItem key="all" textValue="นักเรียนทุกคน">
                            นักเรียนทุกคน
                          </SelectItem>
                          <SelectItem key="checked" textValue="เช็คชื่อแล้ว">
                            เช็คชื่อแล้ว
                          </SelectItem>
                          <SelectItem
                            key="unchecked"
                            textValue="ยังไม่เช็คชื่อ"
                          >
                            ยังไม่เช็คชื่อ
                          </SelectItem>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Refresh Button moved below */}
                  <div className="flex justify-end border-t border-gray-100 pt-3">
                    <button
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 w-full sm:w-auto"
                      disabled={resultsLoading}
                      onClick={() => fetchResults()}
                    >
                      <RefreshCw
                        className={resultsLoading ? "animate-spin" : ""}
                        size={14}
                      />
                      รีเฟรชข้อมูล
                    </button>
                  </div>
                </div>

                {/* ─── Student list ─── */}
                {resultsLoading && results.length === 0 ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Users size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">
                      ยังไม่มีนักเรียนในค่ายนี้
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      (นักเรียนต้องลงทะเบียนก่อน)
                    </p>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    ไม่พบนักเรียนที่คุณค้นหา
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredResults.map((result) => (
                      <div
                        key={result.enrollmentId}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:border-[#6b857a] hover:shadow-md transition-all cursor-pointer group"
                        onClick={() =>
                          handleToggleCheckin(
                            result.studentId,
                            result.enrollmentId,
                            result.isCheckedIn,
                            result.studentName,
                          )
                        }
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${result.isCheckedIn ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 group-hover:bg-[#6b857a]/10 group-hover:text-[#6b857a]"}`}
                        >
                          <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate group-hover:text-[#6b857a] transition-colors">
                            {result.studentName}
                          </p>
                          <p className="text-xs text-gray-500">
                            รหัส: {result.studentId}
                          </p>
                        </div>
                        {result.isCheckedIn ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                              <CheckCircle2 size={14} />
                              เช็คชื่อแล้ว
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock size={12} />
                              {formatTime(result.checkedAt)}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 group-hover:bg-gray-200 transition-colors">
                            คลิกเพื่อเช็คชื่อ
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ModalBody>

            {/* Footer */}
            <ModalFooter className="p-4 border-t border-gray-100 flex justify-between">
              <div className="flex gap-2">
                {selectedRoundId && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#6b857a] hover:bg-[#f0f4f2] rounded-lg transition-colors"
                    onClick={handleClearRound}
                  >
                    <Trash2 size={16} />
                    ล้างรอบนี้
                  </button>
                )}
                {rounds.length > 1 && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={handleClearAll}
                  >
                    <Trash2 size={16} />
                    ล้างทั้งหมด
                  </button>
                )}
                {rounds.length === 0 && (
                  <button
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={handleClearAll}
                  >
                    <Trash2 size={16} />
                    ล้างข้อมูลเช็คชื่อ
                  </button>
                )}
              </div>
              <Button
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
