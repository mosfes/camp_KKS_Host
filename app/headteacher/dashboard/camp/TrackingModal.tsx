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
  Trophy,
  Clock,
  MapPin,
  Users,
  Award,
  CheckCircle2,
} from "lucide-react";

import CampLocationTracker from "@/components/camp-location/CampLocationTracker";
import LoadingSpinner from "@/components/LoadingSpinner";

interface StudentProgress {
  studentId: number;
  name: string;
  completedMissions: number;
  totalMissions: number;
  progressPercentage: number;
  hasCertificate: boolean;
  certificateNo: number | null;
  certificateIssuedAt: string | null;
}

interface TrackingData {
  campId: number;
  totalMissions: number;
  summary: {
    totalStudents: number;
    issuedCertificates: number;
    pendingCertificates: number;
  };
  students: StudentProgress[];
}

type CertificateFilter = "all" | "issued" | "pending";

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName: string;
  locationTrackingEnabled?: boolean;
}

export default function TrackingModal({
  isOpen,
  onClose,
  campId,
  campName,
  locationTrackingEnabled = false,
}: TrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [certificateFilter, setCertificateFilter] =
    useState<CertificateFilter>("all");
  const [page, setPage] = useState(1);
  const [activeSection, setActiveSection] = useState<"location" | "progress">(
    locationTrackingEnabled ? "location" : "progress",
  );
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (isOpen && campId) {
      fetchTrackingData();
      setSearchQuery("");
      setCertificateFilter("all");
      setPage(1);
      setActiveSection(locationTrackingEnabled ? "location" : "progress");
    }
  }, [isOpen, campId, locationTrackingEnabled]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, certificateFilter]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setData(null);
      setLoadError("");
      const res = await fetch(`/api/camps/${campId}/tracking`);

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setLoadError(
          body?.error || body?._error || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่",
        );

        return;
      }

      setData(body);
    } catch {
      setLoadError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = data?.students.filter((student) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesCertificate =
      certificateFilter === "all" ||
      (certificateFilter === "issued" && student.hasCertificate) ||
      (certificateFilter === "pending" && !student.hasCertificate);

    if (!matchesCertificate) return false;
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
        base: "mx-2 my-2 max-h-[98vh] w-[calc(100vw-1rem)] max-w-[1280px] rounded-3xl bg-white shadow-xl sm:w-[calc(100vw-2rem)]",
        backdrop: "bg-black/40 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onOpenChange={onClose}
    >
      <ModalContent className="max-h-[98vh]">
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

              <div
                className={`mt-4 grid gap-2 rounded-xl bg-gray-100 p-1 ${
                  locationTrackingEnabled ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {locationTrackingEnabled && (
                  <button
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      activeSection === "location"
                        ? "bg-white text-[#5d7c6f] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    type="button"
                    onClick={() => setActiveSection("location")}
                  >
                    <MapPin size={16} />
                    ตำแหน่งนักเรียน
                  </button>
                )}
                <button
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeSection === "progress"
                      ? "bg-white text-[#5d7c6f] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  type="button"
                  onClick={() => setActiveSection("progress")}
                >
                  <Users size={16} />
                  ความก้าวหน้านักเรียน
                </button>
              </div>

              {activeSection === "progress" && (
                <>
                  <div className="mt-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="text-gray-400" size={16} />
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5d7c6f]/20 focus:border-[#5d7c6f] transition-all bg-gray-50/50"
                      placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {data && (
                    <section className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#5d7c6f] shadow-sm">
                          <Award size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            สถานะการรับเกียรติบัตร
                          </h3>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                            “ได้รับแล้ว” หมายถึง
                            ระบบเคยออกเกียรติบัตรให้นักเรียนแล้ว
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {[
                          {
                            key: "all" as const,
                            label: "นักเรียนทั้งหมด",
                            helper: "ทุกสถานะ",
                            value: data.summary.totalStudents,
                            activeClass: "border-[#5d7c6f] bg-[#eef4f1]",
                            iconClass: "bg-[#e2ece7] text-[#5d7c6f]",
                          },
                          {
                            key: "issued" as const,
                            label: "ได้รับเกียรติบัตรแล้ว",
                            helper: "มีประวัติออกเกียรติบัตร",
                            value: data.summary.issuedCertificates,
                            activeClass: "border-emerald-500 bg-emerald-50",
                            iconClass: "bg-emerald-100 text-emerald-700",
                          },
                          {
                            key: "pending" as const,
                            label: "ยังไม่ได้รับเกียรติบัตร",
                            helper: "ยังไม่มีประวัติออกเกียรติบัตร",
                            value: data.summary.pendingCertificates,
                            activeClass: "border-amber-500 bg-amber-50",
                            iconClass: "bg-amber-100 text-amber-700",
                          },
                        ].map((item) => (
                          <button
                            key={item.key}
                            aria-pressed={certificateFilter === item.key}
                            className={`relative flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                              certificateFilter === item.key
                                ? `${item.activeClass} shadow-sm`
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`}
                            type="button"
                            onClick={() => setCertificateFilter(item.key)}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}
                            >
                              {item.key === "all" ? (
                                <Users size={17} />
                              ) : item.key === "issued" ? (
                                <CheckCircle2 size={17} />
                              ) : (
                                <Clock size={17} />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold leading-tight text-gray-800">
                                {item.label}
                              </span>
                              <span className="mt-1 block text-[11px] leading-tight text-gray-500">
                                {item.helper}
                              </span>
                            </span>
                            <span className="text-xl font-bold text-gray-900">
                              {item.value}
                              <span className="ml-1 text-xs font-normal text-gray-500">
                                คน
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>

                      <p className="mt-2 text-center text-[11px] text-gray-400">
                        กดสถานะด้านบนเพื่อกรองรายชื่อนักเรียน
                      </p>
                    </section>
                  )}
                </>
              )}
            </ModalHeader>

            <ModalBody
              className={`bg-gray-50/30 px-6 py-4 ${
                activeSection === "location" ? "flex-1 overflow-y-auto" : ""
              }`}
            >
              {activeSection === "location" ? (
                <CampLocationTracker
                  campId={campId}
                  configureDestination={false}
                  showDestination={false}
                  viewer="teacher"
                />
              ) : loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-sm text-gray-500">
                    กำลังโหลดข้อมูล...
                  </p>
                </div>
              ) : !data ? (
                <p className="text-center text-gray-400 py-8">
                  {loadError || "ไม่สามารถโหลดข้อมูลได้"}
                </p>
              ) : filteredStudents?.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Search className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm">
                    {certificateFilter === "issued"
                      ? "ยังไม่มีนักเรียนที่ได้รับเกียรติบัตร"
                      : certificateFilter === "pending"
                        ? "นักเรียนทุกคนได้รับเกียรติบัตรแล้ว"
                        : "ไม่พบรายชื่อในระบบ"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedStudents?.map((student, i) => (
                    <div
                      key={student.studentId}
                      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                            {(page - 1) * ITEMS_PER_PAGE + i + 1}
                          </div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {student.name}
                          </h3>
                        </div>
                        {student.hasCertificate ? (
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-100">
                              <Trophy size={14} />
                              <span>ได้รับเกียรติบัตรแล้ว</span>
                            </div>
                            {(student.certificateNo != null ||
                              student.certificateIssuedAt) && (
                              <p className="mt-1 text-[11px] text-gray-400">
                                {student.certificateNo != null &&
                                  `เลขที่ ${student.certificateNo}`}
                                {student.certificateNo != null &&
                                  student.certificateIssuedAt &&
                                  " · "}
                                {student.certificateIssuedAt &&
                                  new Date(
                                    student.certificateIssuedAt,
                                  ).toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                            <Clock size={14} />
                            <span>ยังไม่ได้รับเกียรติบัตร</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-end text-xs mb-1">
                          <span className="text-gray-500 font-medium tracking-wide text-[11px] uppercase">
                            ความก้าวหน้าภารกิจ
                          </span>
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
                          สำเร็จ {student.completedMissions} /{" "}
                          {student.totalMissions} ภารกิจ
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

            {activeSection === "progress" && (
              <ModalFooter className="rounded-b-3xl border-t border-gray-100 bg-white px-6 py-4">
                <Button
                  className="w-full font-medium sm:w-auto"
                  variant="flat"
                  onPress={onClose}
                >
                  ปิดหน้าต่าง
                </Button>
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
