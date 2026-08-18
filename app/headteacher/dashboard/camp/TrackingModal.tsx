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
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";

import CampLocationTracker from "@/components/camp-location/CampLocationTracker";

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
type TrackingView = "location" | "progress" | "both";

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName: string;
  locationTrackingEnabled?: boolean;
  pageMode?: boolean;
  view?: TrackingView;
}

function TrackingSkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
    />
  );
}

function TrackingProgressSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(240px,1fr)_auto] gap-4 border-b border-gray-100 bg-gray-50/70 px-4 py-3 sm:grid">
        <TrackingSkeletonBlock className="h-3 w-20" />
        <TrackingSkeletonBlock className="h-3 w-28" />
        <TrackingSkeletonBlock className="ml-auto h-3 w-12" />
      </div>

      <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-hidden">
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(240px,1fr)_auto] sm:items-center"
          >
            <div className="flex min-w-0 items-center gap-3">
              <TrackingSkeletonBlock className="h-8 w-8 rounded-full" />
              <div className="min-w-0 space-y-1.5">
                <TrackingSkeletonBlock className="h-3 w-32" />
                <TrackingSkeletonBlock className="h-2.5 w-20" />
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <TrackingSkeletonBlock className="h-3 w-24" />
                <TrackingSkeletonBlock className="h-3 w-10" />
              </div>
              <TrackingSkeletonBlock className="h-2 w-full" />
              <TrackingSkeletonBlock className="ml-auto h-2.5 w-28" />
            </div>

            <TrackingSkeletonBlock className="h-6 w-32 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrackingModal({
  isOpen,
  onClose,
  campId,
  campName,
  locationTrackingEnabled = false,
  pageMode = false,
  view = "both",
}: TrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [certificateFilter, setCertificateFilter] =
    useState<CertificateFilter>("all");
  const [isCertificateStatusOpen, setIsCertificateStatusOpen] = useState(false);
  const [page, setPage] = useState(1);
  const defaultSection =
    view === "location"
      ? "location"
      : view === "progress"
        ? "progress"
        : locationTrackingEnabled
          ? "location"
          : "progress";
  const [activeSection, setActiveSection] = useState<"location" | "progress">(
    defaultSection,
  );
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    if (isOpen && campId) {
      if (view !== "location") {
        fetchTrackingData();
      }
      setSearchQuery("");
      setCertificateFilter("all");
      setIsCertificateStatusOpen(false);
      setPage(1);
      setActiveSection(defaultSection);
    }
  }, [isOpen, campId, defaultSection, view]);

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
        base: pageMode
          ? "!m-0 !h-full !min-h-0 !max-h-none w-full !max-w-none rounded-none bg-[#f5f5f2] shadow-none"
          : "mx-2 my-2 max-h-[98vh] w-[calc(100vw-1rem)] max-w-[1280px] rounded-3xl bg-white shadow-xl sm:w-[calc(100vw-2rem)]",
        backdrop: pageMode ? "hidden" : "bg-black/40 backdrop-blur-sm",
        wrapper: pageMode ? "camp-page-modal items-start p-0" : undefined,
      }}
      hideCloseButton={pageMode}
      isDismissable={!pageMode}
      isOpen={isOpen}
      scrollBehavior="inside"
      onOpenChange={onClose}
    >
      <ModalContent
        className={
          pageMode
            ? "!m-0 !h-full !min-h-0 !max-h-none flex min-h-0 flex-col overflow-hidden bg-[#f5f5f2]"
            : "max-h-[98vh]"
        }
      >
        {() => (
          <>
            <ModalHeader
              className={`relative flex shrink-0 flex-col gap-1 border-b border-gray-100 px-6 ${
                pageMode ? "pb-3 pt-4" : "pb-4 pt-6"
              }`}
            >
              {pageMode && (
                <button
                  className="mb-2 inline-flex w-fit items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900"
                  type="button"
                  onClick={onClose}
                >
                  <ArrowLeft size={14} />
                  กลับไปยังหน้าหลัก
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#eaf1ee] flex items-center justify-center text-[#5d7c6f] shrink-0">
                  {view === "location" ? (
                    <MapPin size={20} />
                  ) : (
                    <Users size={20} />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    {pageMode
                      ? view === "location"
                        ? "ติดตามตำแหน่ง"
                        : "ติดตามนักเรียน"
                      : "การติดตามนักเรียน"}
                  </h2>
                  {campName && (
                    <p className="mt-0.5 max-w-[300px] truncate text-sm font-normal text-gray-500">
                      {campName}
                    </p>
                  )}
                </div>
              </div>

              {view === "both" && (
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
              )}

              {activeSection === "progress" && (
                <>
                  <div className="mt-4 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="text-gray-400" size={16} />
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5d7c6f]/20 focus:border-[#5d7c6f] transition-all bg-white"
                      placeholder="ค้นหาชื่อหรือรหัสนักเรียน..."
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {data && (
                    <section className="mt-3 rounded-xl border border-gray-200 bg-white p-2.5 sm:p-3">
                      <button
                        aria-expanded={isCertificateStatusOpen}
                        className="flex w-full items-center justify-between gap-2 text-left"
                        type="button"
                        onClick={() =>
                          setIsCertificateStatusOpen((current) => !current)
                        }
                      >
                        <span className="flex min-w-0 items-start gap-2">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#5d7c6f] shadow-sm">
                            <Award size={16} />
                          </span>
                          <span>
                            <span className="block text-xs font-bold text-gray-900">
                              สถานะการรับเกียรติบัตร
                            </span>
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-gray-500">
                              “ได้รับแล้ว” หมายถึง
                              ระบบเคยออกเกียรติบัตรให้นักเรียนแล้ว
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-[#5d7c6f]">
                          {isCertificateStatusOpen ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </span>
                      </button>

                      <div
                        className={
                          isCertificateStatusOpen ? "mt-2 block" : "hidden"
                        }
                      >
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                              className={`relative flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-left transition ${
                                certificateFilter === item.key
                                  ? `${item.activeClass} shadow-sm`
                                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              type="button"
                              onClick={() => setCertificateFilter(item.key)}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.iconClass}`}
                              >
                                {item.key === "all" ? (
                                  <Users size={16} />
                                ) : item.key === "issued" ? (
                                  <CheckCircle2 size={16} />
                                ) : (
                                  <Clock size={16} />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold leading-tight text-gray-800">
                                  {item.label}
                                </span>
                                <span className="mt-0.5 block text-[10px] leading-tight text-gray-500">
                                  {item.helper}
                                </span>
                              </span>
                              <span className="text-lg font-bold text-gray-900">
                                {item.value}
                                <span className="ml-1 text-[11px] font-normal text-gray-500">
                                  คน
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>

                        <p className="mt-1.5 text-center text-[10px] text-gray-400">
                          กดสถานะด้านบนเพื่อกรองรายชื่อนักเรียน
                        </p>
                      </div>
                    </section>
                  )}
                </>
              )}
            </ModalHeader>

            <ModalBody
              className={`flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4 ${
                pageMode ? "bg-[#f5f5f2]" : "bg-gray-50/30"
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
                <TrackingProgressSkeleton />
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
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(240px,1fr)_auto] gap-4 border-b border-gray-100 bg-gray-50/70 px-4 py-3 text-xs font-semibold text-gray-500 sm:grid">
                    <span>นักเรียน</span>
                    <span>ความก้าวหน้าภารกิจ</span>
                    <span className="text-right">สถานะ</span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain divide-y divide-gray-100 [touch-action:pan-y]">
                    {paginatedStudents?.map((student, i) => (
                      <div
                        key={student.studentId}
                        className="grid gap-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(240px,1fr)_auto] sm:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                            {(page - 1) * ITEMS_PER_PAGE + i + 1}
                          </div>
                          <div className="min-w-0">
                            <h3 className="break-words text-sm font-semibold leading-6 text-gray-900">
                              {student.name}
                            </h3>
                            <p className="text-xs text-gray-400">
                              รหัสนักเรียน {student.studentId}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium text-gray-500 sm:sr-only">
                              ความก้าวหน้าภารกิจ
                            </span>
                            <span className="font-bold text-[#5d7c6f]">
                              {student.progressPercentage}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-2 rounded-full bg-[#5d7c6f] transition-all duration-1000 ease-in-out"
                              style={{
                                width: `${student.progressPercentage}%`,
                              }}
                            />
                          </div>
                          <p className="text-right text-[11px] text-gray-400">
                            สำเร็จ {student.completedMissions} /{" "}
                            {student.totalMissions} ภารกิจ
                          </p>
                        </div>

                        <div className="flex items-center justify-start sm:justify-end">
                          {student.hasCertificate ? (
                            <div className="text-left sm:text-right">
                              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                <Trophy size={14} />
                                <span>ได้รับเกียรติบัตรแล้ว</span>
                              </div>
                              {(student.certificateNo != null ||
                                student.certificateIssuedAt) && (
                                <p className="mt-1 text-[11px] text-gray-400 sm:text-right">
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
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
                              <Clock size={14} />
                              <span>ยังไม่ได้รับเกียรติบัตร</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {pages > 1 && (
                    <div className="flex justify-center border-t border-gray-100 bg-gray-50/40 pb-2 pt-3">
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
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </ModalBody>

            {activeSection === "progress" && !pageMode && (
              <ModalFooter className="shrink-0 rounded-b-3xl border-t border-gray-100 bg-white px-6 py-4">
                <Button
                  className="w-full font-medium sm:w-auto"
                  size="md"
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
