"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Card, CardBody, Select, SelectItem, Spinner } from "@heroui/react";
import {
  Users,
  BookOpen,
  GraduationCap,
  Tent,
  ChevronRight,
  CalendarDays,
  ClipboardList,
  MapPin,
  Route,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import adminService from "@/app/service/adminService";

export default function OverviewManager() {
  const router = useRouter();
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalClassrooms: 0,
    totalStudents: 0,
    totalCamps: 0,
    studentData: [],
    classTypesData: [],
    teacherRolesData: [],
    campOverview: {
      activeCamps: 0,
      upcomingCamps: 0,
      completedCamps: 0,
      totalEnrollments: 0,
      campsWithoutStations: 0,
      focusCamps: [],
    },
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Fetch academic years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const years = await adminService.getAcademicYears();
        // sort descending
        const sortedYears = years.sort((a, b) => b.year - a.year);
        setAcademicYears(sortedYears);
        if (sortedYears.length > 0) {
          setSelectedYear(sortedYears[0].year.toString());
        }
      } catch (error) {
        console.error("Error fetching academic years", error);
      }
    };
    fetchYears();
  }, []);

  // Fetch stats when year changes
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedYear) return;
      setIsLoading(true);
      try {
        const data = await adminService.getOverviewStats(selectedYear);
        if (data) {
          setStats({
            totalTeachers: data.totalTeachers || 0,
            totalClassrooms: data.totalClassrooms || 0,
            totalStudents: data.totalStudents || 0,
            totalCamps: data.totalCamps || 0,
            studentData: data.studentData || [],
            classTypesData: data.classTypesData || [],
            teacherRolesData: data.teacherRolesData || [],
            campOverview: data.campOverview || {
              activeCamps: 0,
              upcomingCamps: 0,
              completedCamps: 0,
              totalEnrollments: 0,
              campsWithoutStations: 0,
              focusCamps: [],
            },
          });
        }
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [selectedYear]);

  if (isLoading && !stats.totalTeachers) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="success" />
      </div>
    );
  }

  const headerActionsNode = mounted
    ? document.getElementById("admin-header-actions")
    : null;
  const headerActions = academicYears.length > 0 && (
    <Select
      label="ปีการศึกษา"
      size="sm"
      className="w-36 bg-white rounded-xl shadow-sm"
      variant="bordered"
      selectedKeys={new Set([selectedYear])}
      onSelectionChange={(keys) => setSelectedYear(Array.from(keys)[0])}
      disallowEmptySelection
    >
      {academicYears.map((y) => (
        <SelectItem
          key={y.year.toString()}
          textValue={(parseInt(y.year) + 543).toString()}
        >
          {(parseInt(y.year) + 543).toString()}
        </SelectItem>
      ))}
    </Select>
  );

  const campOverview = stats.campOverview;
  const formatCampDate = (date) =>
    new Date(date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="flex flex-col gap-6 w-full pt-1">
      {/* Header Controls (Portaled) */}
      {headerActionsNode && createPortal(headerActions, headerActionsNode)}

      {/* Camp operations command centre */}
      <section className="rounded-3xl overflow-hidden bg-[#365f4f] text-white shadow-sm relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_84%_18%,#81a98c_0,transparent_26%),radial-gradient(circle_at_72%_85%,#c8ddc7_0,transparent_30%)]" />
        <div className="relative p-5 sm:p-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#c8ddc7] uppercase">
              <Route size={15} /> ศูนย์จัดการค่าย
            </p>
            <h2 className="text-xl sm:text-2xl font-bold mt-2">
              ภาพรวมการดำเนินงานค่าย
            </h2>
            <p className="text-sm text-emerald-50/80 mt-1">
              ติดตามค่ายที่กำลังจัด งานที่ต้องตั้งค่า
              และการเข้าร่วมของนักเรียนได้จากจุดเดียว
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#365f4f] px-3.5 py-2 text-sm font-semibold hover:bg-[#f4efe2] transition-colors"
                onClick={() => router.push("/admin_add_user?tab=camp")}
              >
                จัดการค่าย <ChevronRight size={16} />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
                onClick={() => router.push("/admin_add_user?tab=classroom")}
              >
                จัดการห้องเรียน <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-[430px]">
            <div className="rounded-2xl bg-white/12 border border-white/15 p-3">
              <Tent className="text-[#c8ddc7]" size={17} />
              <p className="text-2xl font-bold mt-2">
                {campOverview.activeCamps}
              </p>
              <p className="text-[11px] text-emerald-50/75">กำลังจัด</p>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/15 p-3">
              <CalendarDays className="text-[#c8ddc7]" size={17} />
              <p className="text-2xl font-bold mt-2">
                {campOverview.upcomingCamps}
              </p>
              <p className="text-[11px] text-emerald-50/75">ค่ายที่รอเริ่ม</p>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/15 p-3">
              <Tent className="text-[#c8ddc7]" size={17} />
              <p className="text-2xl font-bold mt-2">
                {campOverview.completedCamps}
              </p>
              <p className="text-[11px] text-emerald-50/75">ค่ายที่เสร็จสิ้น</p>
            </div>
            <div className="rounded-2xl bg-white/12 border border-white/15 p-3">
              <ClipboardList className="text-[#c8ddc7]" size={17} />
              <p className="text-2xl font-bold mt-2">
                {campOverview.campsWithoutStations}
              </p>
              <p className="text-[11px] text-emerald-50/75">ยังไม่มีฐาน</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        <Card className="border border-[#dbe7dd] shadow-sm rounded-2xl bg-white">
          <CardBody className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-bold tracking-wider text-[#527363] uppercase">
                  ค่ายที่ควรโฟกัส
                </p>
                <h3 className="text-lg font-bold text-gray-800 mt-1">
                  กำหนดการค่ายที่กำลังจะมาถึง
                </h3>
              </div>
              <Tent className="text-[#5d7c6f]" size={22} />
            </div>
            {campOverview.focusCamps.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {campOverview.focusCamps.map((camp) => (
                  <button
                    key={camp.camp_id}
                    className="w-full text-left py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-[#f7faf8] -mx-2 px-2 rounded-xl transition-colors"
                    onClick={() => router.push("/admin_add_user?tab=camp")}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {camp.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <CalendarDays size={13} />{" "}
                        {formatCampDate(camp.start_date)} · <MapPin size={13} />{" "}
                        {camp.location}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-[#416b5a]">
                        {camp._count.student_enrollment}
                      </p>
                      <p className="text-[11px] text-gray-400">ผู้เข้าร่วม</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                ยังไม่มีค่ายที่กำลังจะจัด
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="border border-[#dbe7dd] shadow-sm rounded-2xl bg-[#f7faf7]">
          <CardBody className="p-5 sm:p-6">
            <p className="text-xs font-bold tracking-wider text-[#527363] uppercase">
              งานที่ต้องติดตาม
            </p>
            <h3 className="text-lg font-bold text-gray-800 mt-1">
              เตรียมค่ายให้พร้อมก่อนเริ่มงาน
            </h3>
            <div className="mt-5 space-y-3">
              <button
                className="w-full flex items-center justify-between gap-3 rounded-xl bg-white border border-[#e4ede5] p-3 text-left hover:border-[#bad0bf] transition-colors"
                onClick={() => router.push("/admin_add_user?tab=camp")}
              >
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[#e8f1e9] text-[#527363] flex items-center justify-center">
                    <ClipboardList size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-700">
                      ตั้งค่าฐานกิจกรรม
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      ค่ายที่ยังไม่มีฐาน
                    </span>
                  </span>
                </span>
                <span className="text-lg font-bold text-[#527363]">
                  {campOverview.campsWithoutStations}
                </span>
              </button>
              <button
                className="w-full flex items-center justify-between gap-3 rounded-xl bg-white border border-[#e4ede5] p-3 text-left hover:border-[#bad0bf] transition-colors"
                onClick={() => router.push("/admin_add_user?tab=camp")}
              >
                <span className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-[#eaf2ed] text-[#416b5a] flex items-center justify-center">
                    <CalendarDays size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-700">
                      ค่ายที่กำลังจะเริ่ม
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      ตรวจสอบกำหนดการและผู้เข้าร่วม
                    </span>
                  </span>
                </span>
                <span className="text-lg font-bold text-[#416b5a]">
                  {campOverview.upcomingCamps}
                </span>
              </button>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-1 sm:p-2">
          <CardBody className="overflow-visible">
            <div className="flex justify-between items-start">
              <div className="bg-[#f7f2fa] p-2 sm:p-3 rounded-2xl">
                <Users className="text-[#8e6ba8]" size={22} />
              </div>
            </div>
            <div className="mt-3 sm:mt-5">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {stats.totalTeachers}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                ครูทั้งหมด
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Card 2 */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-1 sm:p-2">
          <CardBody className="overflow-visible">
            <div className="flex justify-between items-start">
              <div className="bg-[#eff2f0] p-2 sm:p-3 rounded-2xl">
                <BookOpen className="text-[#5d7c6f]" size={22} />
              </div>
            </div>
            <div className="mt-3 sm:mt-5">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {stats.totalClassrooms}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                ห้องเรียน
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Card 3 */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-1 sm:p-2">
          <CardBody className="overflow-visible">
            <div className="flex justify-between items-start">
              <div className="bg-[#f0f5fa] p-2 sm:p-3 rounded-2xl">
                <GraduationCap className="text-[#4a90e2]" size={22} />
              </div>
            </div>
            <div className="mt-3 sm:mt-5">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {stats.totalStudents}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                นักเรียนทั้งหมด
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Card 4 */}
        <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white p-1 sm:p-2">
          <CardBody className="overflow-visible">
            <div className="flex justify-between items-start">
              <div className="bg-[#fcf3f0] p-2 sm:p-3 rounded-2xl">
                <Tent className="text-[#e07a5f]" size={22} />
              </div>
            </div>
            <div className="mt-3 sm:mt-5">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {stats.totalCamps}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                ค่ายกิจกรรม
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm border border-gray-100 rounded-2xl bg-white p-2">
          <CardBody className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  จำนวนนักเรียนแต่ละระดับชั้น
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ปีการศึกษา {selectedYear ? parseInt(selectedYear) + 543 : ""}
                </p>
              </div>
            </div>
            <div className="h-[280px] w-full">
              {stats.studentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.studentData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorStudents"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#5d7c6f"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor="#5d7c6f"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 13 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9ca3af", fontSize: 13 }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "#f9fafb" }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #f3f4f6",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="students"
                      name="นักเรียน"
                      fill="url(#colorStudents)"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  ไม่มีข้อมูล
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Donut Charts */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Donut 1 */}
          <Card className="shadow-sm border border-gray-100 rounded-2xl bg-white p-2 flex-1">
            <CardBody className="p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">
                ประเภทห้องเรียน
              </h3>
              {stats.classTypesData.length > 0 ? (
                <div className="flex items-center justify-between h-[150px]">
                  <div className="w-[120px] h-full shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.classTypesData}
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.classTypesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #f3f4f6",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-4 pl-4 w-full">
                    {stats.classTypesData.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-gray-600 font-medium">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {item.value} ห้อง
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-gray-400">
                  ไม่มีข้อมูล
                </div>
              )}
            </CardBody>
          </Card>

          {/* Donut 2 */}
          <Card className="shadow-sm border border-gray-100 rounded-2xl bg-white p-2 flex-1">
            <CardBody className="p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">บทบาท</h3>
              {stats.teacherRolesData.length > 0 ? (
                <div className="flex items-center justify-between h-[150px]">
                  <div className="w-[120px] h-full shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.teacherRolesData}
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {stats.teacherRolesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #f3f4f6",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-4 pl-4 w-full">
                    {stats.teacherRolesData.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-gray-600 font-medium">
                            {item.name}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {item.value} คน
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-gray-400">
                  ไม่มีข้อมูล
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
