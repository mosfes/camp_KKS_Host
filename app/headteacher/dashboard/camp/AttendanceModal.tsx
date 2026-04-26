"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Pagination,
} from "@heroui/react";
import {
  Search,
  CheckCircle2,
  Circle,
  Users,
  UserCheck,
  UserX,
  ClipboardCheck,
} from "lucide-react";

interface Student {
  studentId: number;
  name: string;
  enrollmentId: number | null;
  checkedIn: boolean;
  checkedInAt: string | null;
}

interface AttendanceData {
  campId: number;
  totalStudents: number;
  checkedInCount: number;
  students: Student[];
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName: string;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  campId,
  campName,
}: AttendanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "checked" | "unchecked">("all");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    if (isOpen && campId) {
      fetchAttendance();
      setSearchQuery("");
      setFilterStatus("all");
      setPage(1);
    }
  }, [isOpen, campId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setData(null);
      const res = await fetch(`/api/camps/${campId}/attendance`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheckin = async (student: Student) => {
    if (!student.enrollmentId) return;
    setTogglingId(student.studentId);
    try {
      const res = await fetch(`/api/camps/${campId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId: student.enrollmentId,
          checkedIn: !student.checkedIn,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        // อัปเดต state ใน place ไม่ต้อง refetch ทั้งหมด
        setData((prev) => {
          if (!prev) return prev;
          const newStudents = prev.students.map((s) =>
            s.studentId === student.studentId
              ? { ...s, checkedIn: !s.checkedIn, checkedInAt: updated.enrolled_at }
              : s
          );
          return {
            ...prev,
            students: newStudents,
            checkedInCount: newStudents.filter((s) => s.checkedIn).length,
          };
        });
      }
    } catch (err) {
      console.error("Toggle checkin failed:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    return data.students.filter((s) => {
      // filter สถานะ
      if (filterStatus === "checked" && !s.checkedIn) return false;
      if (filterStatus === "unchecked" && s.checkedIn) return false;
      // ค้นหาชื่อหรือรหัส
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchId = String(s.studentId).includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [data, searchQuery, filterStatus]);

  const pages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [page, filteredStudents]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  };

  const checkedCount = data?.checkedInCount ?? 0;
  const total = data?.totalStudents ?? 0;
  const percent = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white rounded-3xl shadow-xl",
        backdrop: "bg-black/40 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-6 pt-6 pb-4 border-b border-gray-100">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eaf1ee] flex items-center justify-center text-[#5d7c6f] shrink-0">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    เช็คชื่อนักเรียน
                  </h2>
                  <p className="text-sm font-normal text-gray-500 mt-0.5 truncate max-w-[300px]">
                    {campName}
                  </p>
                </div>
              </div>

              {/* Stats bar */}
              {data && (
                <div className="mt-4 space-y-3">
                  {/* Progress */}
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500 font-medium">ความคืบหน้า</span>
                    <span className="font-bold text-[#5d7c6f]">
                      {checkedCount} / {total} คน ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#5d7c6f] h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Mini stats */}
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === "all"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <Users size={14} />
                      ทั้งหมด {total}
                    </button>
                    <button
                      onClick={() => setFilterStatus("checked")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === "checked"
                          ? "bg-[#5d7c6f] text-white"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      <UserCheck size={14} />
                      มาแล้ว {checkedCount}
                    </button>
                    <button
                      onClick={() => setFilterStatus("unchecked")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filterStatus === "unchecked"
                          ? "bg-red-500 text-white"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <UserX size={14} />
                      ยังไม่มา {total - checkedCount}
                    </button>
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="mt-3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อหรือรหัสนักเรียน..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5d7c6f]/20 focus:border-[#5d7c6f] transition-all bg-gray-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </ModalHeader>

            <ModalBody className="px-6 py-4 bg-gray-50/30">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
              ) : !data ? (
                <p className="text-center text-gray-400 py-8">ไม่สามารถโหลดข้อมูลได้</p>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Search className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm">ไม่พบนักเรียนที่ค้นหา</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedStudents.map((student) => {
                    const isToggling = togglingId === student.studentId;
                    return (
                      <div
                        key={student.studentId}
                        onClick={() => !isToggling && toggleCheckin(student)}
                        className={`flex items-center gap-4 bg-white border rounded-xl px-4 py-3 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                          student.checkedIn
                            ? "border-[#5d7c6f]/40 bg-[#f0f7f4]"
                            : "border-gray-100 hover:border-gray-200"
                        } ${isToggling ? "opacity-60 pointer-events-none" : ""}`}
                      >
                        {/* Checkbox icon */}
                        <div className="shrink-0">
                          {isToggling ? (
                            <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                          ) : student.checkedIn ? (
                            <CheckCircle2 size={24} className="text-[#5d7c6f]" />
                          ) : (
                            <Circle size={24} className="text-gray-300" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-sm truncate ${
                              student.checkedIn ? "text-[#3d5c52]" : "text-gray-800"
                            }`}
                          >
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-400">รหัส: {student.studentId}</p>
                        </div>

                        {/* Status badge */}
                        {student.checkedIn ? (
                          <div className="shrink-0 text-right">
                            <span className="inline-flex items-center gap-1 bg-[#5d7c6f]/10 text-[#5d7c6f] text-xs font-semibold px-2.5 py-1 rounded-full">
                              <CheckCircle2 size={11} />
                              มาแล้ว
                            </span>
                            {student.checkedInAt && (
                              <p className="text-[10px] text-gray-400 mt-0.5 text-right">
                                {formatTime(student.checkedInAt)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-gray-100 text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full">
                            <Circle size={11} />
                            ยังไม่มา
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {pages > 1 && (
                    <div className="pt-4 flex justify-center pb-2">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        className="bg-transparent"
                        classNames={{
                          cursor: "bg-[#5d7c6f] text-white font-medium",
                        }}
                        page={page}
                        total={pages}
                        onChange={setPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 bg-white border-t border-gray-100 rounded-b-3xl flex justify-between items-center">
              <p className="text-sm text-gray-500">
                กดที่รายชื่อเพื่อเช็ค / ยกเลิกเช็คชื่อ
              </p>
              <Button
                variant="flat"
                className="font-medium"
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
