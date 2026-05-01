"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardBody, Select, SelectItem, Spinner } from "@heroui/react";
import { Users, BookOpen, GraduationCap, Tent, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import adminService from "@/app/service/adminService";

export default function OverviewManager() {
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
    teacherRolesData: []
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
            teacherRolesData: data.teacherRolesData || []
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

  const headerActionsNode = mounted ? document.getElementById("admin-header-actions") : null;
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
        <SelectItem key={y.year.toString()} textValue={(parseInt(y.year) + 543).toString()}>
          {(parseInt(y.year) + 543).toString()}
        </SelectItem>
      ))}
    </Select>
  );

  return (
    <div className="flex flex-col gap-6 w-full pt-1">
      {/* Header Controls (Portaled) */}
      {headerActionsNode && createPortal(headerActions, headerActionsNode)}

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
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalTeachers}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">ครูทั้งหมด</p>
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
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalClassrooms}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">ห้องเรียน</p>
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
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalStudents}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">นักเรียนทั้งหมด</p>
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
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalCamps}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">ค่ายกิจกรรม</p>
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
                <h3 className="text-lg font-bold text-gray-800">จำนวนนักเรียนแต่ละระดับชั้น</h3>
                <p className="text-sm text-gray-500 mt-1">ปีการศึกษา {selectedYear ? parseInt(selectedYear) + 543 : ""}</p>
              </div>
            </div>
            <div className="h-[280px] w-full">
              {stats.studentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.studentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5d7c6f" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#5d7c6f" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 13 }} />
                    <RechartsTooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="students" name="นักเรียน" fill="url(#colorStudents)" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">ไม่มีข้อมูล</div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Donut Charts */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Donut 1 */}
          <Card className="shadow-sm border border-gray-100 rounded-2xl bg-white p-2 flex-1">
            <CardBody className="p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">ประเภทห้องเรียน</h3>
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
                          contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-4 pl-4 w-full">
                    {stats.classTypesData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-600 font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{item.value} ห้อง</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-gray-400">ไม่มีข้อมูล</div>
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
                          contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-4 pl-4 w-full">
                    {stats.teacherRolesData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-600 font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{item.value} คน</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-gray-400">ไม่มีข้อมูล</div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
