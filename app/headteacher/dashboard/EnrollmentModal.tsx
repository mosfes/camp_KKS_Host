"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Users, CheckCircle2, Clock } from "lucide-react";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName: string;
}

interface StudentEntry {
  students_id: number;
  name: string;
  enrolled_at?: string | null;
  shirt_size?: string | null;
}

interface EnrollmentData {
  totalStudents: number;
  enrolledCount: number;
  enrolled: StudentEntry[];
  notEnrolled: StudentEntry[];
}

export default function EnrollmentModal({
  isOpen,
  onClose,
  campId,
  campName,
}: EnrollmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnrollmentData | null>(null);
  const [tab, setTab] = useState<"enrolled" | "notEnrolled">("enrolled");

  useEffect(() => {
    if (isOpen && campId) {
      fetchEnrollments();
    }
  }, [isOpen, campId]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setData(null);
      const res = await fetch(`/api/camps/${campId}/enrollments`);

      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white rounded-3xl shadow-xl",
        backdrop: "bg-black/40 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-6 pt-6 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eaf1ee] flex items-center justify-center text-[#5d7c6f]">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    สถานะการลงทะเบียน
                  </h2>
                  <p className="text-sm font-normal text-gray-500 mt-0.5 truncate max-w-xs">
                    {campName}
                  </p>
                </div>
              </div>

              {/* Summary chips */}
              {data && (
                <div className="flex gap-3 mt-3">
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      tab === "enrolled"
                        ? "bg-[#5d7c6f] text-white"
                        : "bg-[#eaf1ee] text-[#5d7c6f]"
                    }`}
                    onClick={() => setTab("enrolled")}
                  >
                    <CheckCircle2 size={14} />
                    ลงทะเบียนแล้ว ({data.enrolledCount})
                  </button>
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      tab === "notEnrolled"
                        ? "bg-amber-500 text-white"
                        : "bg-amber-50 text-amber-700"
                    }`}
                    onClick={() => setTab("notEnrolled")}
                  >
                    <Clock size={14} />
                    ยังไม่ลง ({data.totalStudents - data.enrolledCount})
                  </button>
                </div>
              )}
            </ModalHeader>

            <ModalBody className="px-6 py-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !data ? (
                <p className="text-center text-gray-400 py-8">
                  ไม่สามารถโหลดข้อมูลได้
                </p>
              ) : tab === "enrolled" ? (
                data.enrolled.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <CheckCircle2
                      className="mx-auto mb-2 opacity-30"
                      size={32}
                    />
                    <p className="text-sm">ยังไม่มีนักเรียนลงทะเบียน</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {data.enrolled.map((s, i) => (
                      <li
                        key={s.students_id}
                        className="flex items-center gap-3 p-3 bg-[#f5f9f7] rounded-xl"
                      >
                        <span className="w-6 text-xs text-gray-400 text-right shrink-0">
                          {i + 1}.
                        </span>
                        <span className="flex-1 text-sm font-medium text-gray-800">
                          {s.name}
                        </span>
                        {s.shirt_size && (
                          <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                            เสื้อ {s.shirt_size}
                          </span>
                        )}
                        <CheckCircle2
                          className="text-[#5d7c6f] shrink-0"
                          size={16}
                        />
                      </li>
                    ))}
                  </ul>
                )
              ) : data.notEnrolled.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CheckCircle2
                    className="mx-auto mb-2 opacity-30 text-[#5d7c6f]"
                    size={32}
                  />
                  <p className="text-sm">นักเรียนทุกคนลงทะเบียนแล้ว!</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {data.notEnrolled.map((s, i) => (
                    <li
                      key={s.students_id}
                      className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl"
                    >
                      <span className="w-6 text-xs text-gray-400 text-right shrink-0">
                        {i + 1}.
                      </span>
                      <span className="flex-1 text-sm font-medium text-gray-700">
                        {s.name}
                      </span>
                      <Clock className="text-amber-500 shrink-0" size={16} />
                    </li>
                  ))}
                </ul>
              )}
            </ModalBody>

            <ModalFooter className="px-6 py-4 bg-gray-50/50 rounded-b-3xl">
              <Button
                className="w-full sm:w-auto"
                variant="flat"
                onPress={onClose}
              >
                ปิด
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
