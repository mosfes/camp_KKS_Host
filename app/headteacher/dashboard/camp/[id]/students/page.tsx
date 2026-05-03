"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Search,
  AlertCircle,
  Users,
  Activity,
  FileText,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/react";

interface Student {
  student: {
    students_id: number;
    prefix_name: string | null;
    firstname: string;
    lastname: string;
    food_allergy: string | null;
    chronic_disease: string | null;
    remark: string | null;
    tel: string | null;
  };
}

interface Summary {
  totalStudents: number;
  allergiesCount: number;
  chronicDiseasesCount: number;
  remarksCount: number;
  allergies: any[];
  chronicDiseases: any[];
  remarks: any[];
}

export default function CampStudentsPage() {
  const router = useRouter();
  const params = useParams();
  const campId = params?.id;

  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const limit = 10;

  useEffect(() => {
    if (campId) {
      fetchStudents();
    }
  }, [campId, page, filter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Only fetch summary on first load — skip on pagination/filter changes
      const needSummary = !summary;
      const res = await fetch(
        `/api/camps/${campId}/students?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&filter=${filter}&summary=${needSummary}`,
      );

      if (res.ok) {
        const data = await res.json();

        setStudents(data.data);
        setTotalPages(data.pagination.totalPages || 1);
        if (!summary) {
          setSummary(data.summary);
        }
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f2]">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <div className="relative bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-[#6b857a]/20 border-t-[#6b857a] animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-[#2d3748] text-base">
                กำลังโหลดข้อมูลนักเรียน
              </p>
              <p className="text-sm text-gray-400 mt-0.5">กรุณารอสักครู่...</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
          onClick={() => router.push(`/headteacher/dashboard/camp/${campId}`)}
        >
          <ChevronLeft size={20} />
          <span className="font-medium">กลับไปยังหน้าค่าย</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ข้อมูลนักเรียนในค่าย
        </h1>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
            <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Users className="text-[#6b857a] w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                  นักเรียนทั้งหมด
                </h3>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                {summary.totalStudents}{" "}
                <span className="text-xs md:text-sm font-normal text-gray-500">
                  คน
                </span>
              </p>
            </div>

            <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-red-100">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <AlertCircle className="text-red-500 w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                  แพ้อาหาร
                </h3>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                {summary.allergiesCount}{" "}
                <span className="text-xs md:text-sm font-normal text-gray-500">
                  คน
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.allergies.slice(0, 3).map((a, i) => (
                  <Chip
                    key={i}
                    className="bg-red-50 text-red-700 max-w-full"
                    size="sm"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {a.text}
                  </Chip>
                ))}
                {summary.allergiesCount > 3 && (
                  <span className="text-xs text-gray-500 mt-1">
                    +{summary.allergiesCount - 3}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <Activity className="text-[#6b857a] w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                  โรคประจำตัว
                </h3>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                {summary.chronicDiseasesCount}{" "}
                <span className="text-xs md:text-sm font-normal text-gray-500">
                  คน
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.chronicDiseases.slice(0, 3).map((d, i) => (
                  <Chip
                    key={i}
                    className="bg-[#f0f4f2] text-[#5d7c6f] border border-[#d1e0d9] max-w-full"
                    size="sm"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {d.text}
                  </Chip>
                ))}
                {summary.chronicDiseasesCount > 3 && (
                  <span className="text-xs text-gray-500 mt-1">
                    +{summary.chronicDiseasesCount - 3}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 md:p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <FileText className="text-blue-500 w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                  ข้อมูลอื่นๆ
                </h3>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                {summary.remarksCount}{" "}
                <span className="text-xs md:text-sm font-normal text-gray-500">
                  คน
                </span>
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {summary.remarks.slice(0, 3).map((r, i) => (
                  <Chip
                    key={i}
                    className="bg-blue-50 text-blue-700 max-w-full"
                    size="sm"
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.text}
                  </Chip>
                ))}
                {summary.remarksCount > 3 && (
                  <span className="text-xs text-gray-500 mt-1">
                    +{summary.remarksCount - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Search & Table Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-900 w-full sm:w-auto">
              รายชื่อนักเรียน
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-[200px]">
                <Select
                  aria-label="ตัวกรอง"
                  className="w-full"
                  classNames={{
                    trigger:
                      "bg-white border border-gray-100 text-gray-700 font-medium h-10",
                  }}
                  placeholder="ตัวกรองทั้งหมด"
                  selectedKeys={[filter]}
                  size="sm"
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <SelectItem key="all" textValue="แสดงทั้งหมด">
                    แสดงทั้งหมด
                  </SelectItem>
                  <SelectItem key="allergy" textValue="แพ้อาหาร">
                    แพ้อาหาร
                  </SelectItem>
                  <SelectItem key="disease" textValue="โรคประจำตัว">
                    โรคประจำตัว
                  </SelectItem>
                  <SelectItem key="remark" textValue="หมายเหตุอื่นๆ">
                    หมายเหตุอื่นๆ
                  </SelectItem>
                </Select>
              </div>
              <div className="w-full sm:w-72">
                <Input
                  className="w-full"
                  classNames={{
                    inputWrapper: "h-10 border border-gray-100 bg-white",
                  }}
                  placeholder="ค้นหาชื่อ, นามสกุล หรือรหัส..."
                  size="sm"
                  startContent={<Search className="text-gray-400" size={18} />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-100">
                  <th className="p-4 font-semibold rounded-tl-lg whitespace-nowrap">รหัส</th>
                  <th className="p-4 font-semibold whitespace-nowrap">ชื่อ - นามสกุล</th>
                  <th className="p-4 font-semibold whitespace-nowrap">เบอร์โทร</th>
                  <th className="p-4 font-semibold whitespace-nowrap">แพ้อาหาร</th>
                  <th className="p-4 font-semibold whitespace-nowrap">โรคประจำตัว</th>
                  <th className="p-4 font-semibold rounded-tr-lg whitespace-nowrap">
                    เงื่อนไขพิเศษ/อื่นๆ
                  </th>
                </tr>
              </thead>
              <tbody>
                {!loading && students.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-gray-500" colSpan={6}>
                      ไม่พบข้อมูลนักเรียน
                    </td>
                  </tr>
                ) : (
                  students.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm"
                    >
                      <td className="p-4 text-gray-900 font-medium">
                        {row.student.students_id}
                      </td>
                      <td className="p-4 text-gray-900">
                        {row.student.prefix_name || ""} {row.student.firstname}{" "}
                        {row.student.lastname}
                      </td>
                      <td className="p-4 text-gray-600">
                        {row.student.tel || "-"}
                      </td>
                      <td className="p-4">
                        {row.student.food_allergy &&
                        row.student.food_allergy !== "-" &&
                        row.student.food_allergy !== "ไม่มี" ? (
                          <Chip
                            className="bg-red-50 text-red-700 border border-red-100"
                            size="sm"
                          >
                            {row.student.food_allergy}
                          </Chip>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {row.student.chronic_disease &&
                        row.student.chronic_disease !== "-" &&
                        row.student.chronic_disease !== "ไม่มี" ? (
                          <Chip
                            className="bg-[#f0f4f2] text-[#5d7c6f] border border-[#d1e0d9]"
                            size="sm"
                          >
                            {row.student.chronic_disease}
                          </Chip>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {row.student.remark &&
                        row.student.remark !== "-" &&
                        row.student.remark !== "ไม่มี" ? (
                          <span className="text-blue-700 font-medium">
                            {row.student.remark}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center mt-6">
              <Pagination
                isCompact
                showControls
                classNames={{
                  cursor: "bg-[#5d7c6f] text-white font-bold",
                }}
                color="default"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
