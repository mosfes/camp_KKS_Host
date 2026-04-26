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
import { Search, Trophy, CheckCircle2, Clock, MapPin } from "lucide-react";

interface StudentProgress {
  studentId: number;
  name: string;
  completedMissions: number;
  totalMissions: number;
  progressPercentage: number;
  hasCertificate: boolean;
}

interface TrackingData {
  campId: number;
  totalMissions: number;
  students: StudentProgress[];
}

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName: string;
}

export default function TrackingModal({
  isOpen,
  onClose,
  campId,
  campName,
}: TrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackingData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (isOpen && campId) {
      fetchTrackingData();
      setSearchQuery("");
      setPage(1);
    }
  }, [isOpen, campId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setData(null);
      const res = await fetch(`/api/camps/${campId}/tracking`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch tracking data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = data?.students.filter((student) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const matchName = student.name.toLowerCase().includes(query);
    const matchId = String(student.studentId).includes(query);
    return matchName || matchId;
  });

  const pages = Math.ceil((filteredStudents?.length || 0) / ITEMS_PER_PAGE);

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredStudents?.slice(start, end);
  }, [page, filteredStudents]);

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eaf1ee] flex items-center justify-center text-[#5d7c6f] shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    การติดตามนักเรียน
                  </h2>
                  <p className="text-sm font-normal text-gray-500 mt-0.5 truncate max-w-[300px]">
                    {campName}
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5d7c6f]/20 focus:border-[#5d7c6f] transition-all bg-gray-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Summary Stats */}
              {data && (
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <span className="font-semibold text-gray-900">{data.students.length}</span> คนที่ลงทะเบียน
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <span className="font-semibold text-gray-900">{data.totalMissions}</span> ภารกิจทั้งหมด
                  </div>
                </div>
              )}
            </ModalHeader>

            <ModalBody className="px-6 py-4 bg-gray-50/30">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
              ) : !data ? (
                <p className="text-center text-gray-400 py-8">
                  ไม่สามารถโหลดข้อมูลได้
                </p>
              ) : filteredStudents?.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Search className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm">ไม่พบรายชื่อในระบบ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedStudents?.map((student, i) => (
                    <div
                      key={student.studentId}
                      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                            {(page - 1) * ITEMS_PER_PAGE + i + 1}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {student.name}
                          </h3>
                        </div>
                        {student.hasCertificate ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-100">
                            <Trophy size={14} />
                            <span>ได้รับเกียรติบัตรแล้ว</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                            <Clock size={14} />
                            <span>ยังไม่ได้เกียรติบัตร</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end text-xs mb-1">
                          <span className="text-gray-500 font-medium tracking-wide text-[11px] uppercase">ความก้าวหน้าภารกิจ</span>
                          <span className="font-bold text-[#5d7c6f]">
                            {student.progressPercentage}%
                          </span>
                        </div>
                        
                        {/* Custom Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-[#5d7c6f] h-2.5 rounded-full transition-all duration-1000 ease-in-out" 
                            style={{ width: `${student.progressPercentage}%` }}
                          />
                        </div>

                        <p className="text-xs text-right text-gray-400 mt-1">
                          สำเร็จ {student.completedMissions} / {student.totalMissions} ภารกิจ
                        </p>
                      </div>
                    </div>
                  ))}
                  
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
                        onChange={(newPage) => {
                          setPage(newPage);
                          // find parent scroll container if needed, but pagination inside modal body usually is fine
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 bg-white border-t border-gray-100 rounded-b-3xl">
              <Button variant="flat" className="w-full sm:w-auto font-medium" onPress={onClose}>
                ปิดหน้าต่าง
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
