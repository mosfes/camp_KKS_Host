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
import { Search, Shirt } from "lucide-react";

interface StudentShirt {
  enrollmentId: number;
  studentId: number;
  name: string;
  classroom: string;
  shirtSize: string | null;
  enrolledAt: string;
}

interface ShirtTrackingData {
  hasShirt: boolean;
  summary: Record<string, number>;
  totalShirts: number;
  totalStudents: number;
  students: StudentShirt[];
}

interface ShirtTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName: string;
}

export default function ShirtTrackingModal({
  isOpen,
  onClose,
  campId,
  campName,
}: ShirtTrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShirtTrackingData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (isOpen && campId) {
      fetchShirtData();
      setSearchQuery("");
      setPage(1);
    }
  }, [isOpen, campId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const fetchShirtData = async () => {
    try {
      setLoading(true);
      setData(null);
      const res = await fetch(`/api/camps/${campId}/shirts`);

      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch shirt data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = data?.students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0f4f2] flex items-center justify-center text-[#6b857a]">
                  <Shirt size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    รายการจองเสื้อ
                  </h2>
                  <p className="text-sm text-gray-500 font-normal">
                    {campName}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className="py-6 px-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-3 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-gray-500 font-medium animate-pulse">
                    กำลังโหลดข้อมูลการจองเสื้อ...
                  </p>
                </div>
              ) : data && !data.hasShirt ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <Shirt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-lg text-gray-700">
                    ค่ายนี้ไม่ได้เปิดให้จองเสื้อ
                  </p>
                  <p className="text-sm mt-1">
                    คุณสามารถเปิดการจองเสื้อได้ในหน้าแก้ไขข้อมูลค่าย
                  </p>
                </div>
              ) : data ? (
                <div className="space-y-6">
                  {/* Summary Section */}
                  <div className="bg-[#f0f4f2]/50 rounded-2xl p-5 border border-[#d1e0d9]">
                    <h3 className="text-sm font-semibold text-[#5d7c6f] mb-3 flex items-center gap-2">
                      <Shirt size={16} /> สรุปยอดจองเสื้อ (รวม{" "}
                      {data.totalShirts} ตัว)
                    </h3>

                    {data.totalShirts === 0 ? (
                      <div className="bg-white border border-[#d1e0d9] p-4 rounded-xl text-center">
                        <p className="text-sm font-medium text-gray-600">
                          ยังไม่มีผู้จองเสื้อ
                        </p>
                        {data.totalStudents > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            (รอนักเรียนระบุไซส์ {data.totalStudents} คน)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(data.summary).map(([size, count]) => (
                          <div
                            key={size}
                            className={`bg-white border px-4 py-2 rounded-xl flex items-center justify-between min-w-[100px] ${
                              size === "รอระบุไซส์"
                                ? "border-gray-200"
                                : "border-[#d1e0d9]"
                            }`}
                          >
                            <span
                              className={`font-medium ${size === "รอระบุไซส์" ? "text-gray-500" : "text-gray-700"}`}
                            >
                              {size}
                            </span>
                            <span
                              className={`font-bold ml-3 ${size === "รอระบุไซส์" ? "text-gray-600" : "text-[#6b857a]"}`}
                            >
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search Section */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5d7c6f] focus:border-[#5d7c6f] sm:text-sm transition-all"
                      placeholder="ค้นหาชื่อนักเรียน..."
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Student List Section */}
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    {paginatedStudents && paginatedStudents.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {paginatedStudents.map((student) => (
                          <div
                            key={student.studentId}
                            className="p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {student.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                {student.classroom}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {student.shirtSize ? (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold border border-green-200">
                                  ไซส์ {student.shirtSize}
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium border border-gray-200">
                                  รอระบุไซส์
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <Shirt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium text-sm">
                          ไม่พบรายชื่อนักเรียน
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="flex justify-center mt-4 pb-2">
                      <Pagination
                        classNames={{
                          cursor: "bg-[#5d7c6f] text-white font-bold",
                        }}
                        page={page}
                        total={pages}
                        onChange={setPage}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </ModalBody>

            <ModalFooter className="p-6 pt-2 border-t border-gray-100">
              <Button
                className="bg-gray-100 text-gray-700 font-medium px-6 hover:bg-gray-200"
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
