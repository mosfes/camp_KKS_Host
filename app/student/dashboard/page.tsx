"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { MapPin, Calendar, Flag, Shirt, CheckCircle2, History } from "lucide-react";
import { useRouter } from "next/navigation";

// Utility to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function StudentDashboard() {
  const router = useRouter();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);

  const goToCamp = (campId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(campId);
    router.push(`/student/dashboard/camp/${campId}`);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [campsRes, studentRes] = await Promise.all([
          fetch("/api/student/camps"),
          fetch("/api/auth/student/me")
        ]);

        if (campsRes.ok) {
          setCamps(await campsRes.json());
        }
        if (studentRes.ok) {
          setStudent(await studentRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date();
  const availableCamps = camps.filter((c: any) => !c.isRegistered && !c.isEnded);
  const myCamps = camps.filter((c: any) => c.isRegistered && !c.isEnded);
  const endedCamps = camps.filter((c: any) => c.isEnded);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
    );

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Greeting Card */}
        <div className="bg-[#5d7c6f] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">
              สวัสดี, น้อง{student?.firstname || "ๆ"}! 👋
            </h1>
            <p className="opacity-90 mb-4">พร้อมสำหรับการผจญภัยครั้งใหม่หรือยัง?</p>

            {/* Student Info Badges */}
            {student && (
              <div className="flex flex-wrap gap-2">
                {/* รหัสนักเรียน — แสดงเสมอ */}
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="13" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>
                  รหัสนักเรียน: {student.students_id}
                </span>

                {student.classroom?.grade_label && (
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                    ชั้น{student.classroom.grade_label}
                  </span>
                )}
                {student.classroom?.class_name && (
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                    ห้อง {student.classroom.class_name}
                  </span>
                )}
                {student.classroom?.homeroom_teacher && (
                  <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    ครูประจำชั้น: {student.classroom.homeroom_teacher}, {student.classroom.homeroom_teacher}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="absolute right-0 bottom-0 opacity-10">
            <Flag size={120} />
          </div>
        </div>


        <Tabs
          aria-label="Camp Options"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-[#5d7c6f]",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-[#5d7c6f] font-bold",
          }}
          color="primary"
          variant="underlined"
        >
          <Tab key="available" title="ค่ายที่เปิดรับสมัคร">
            <div className="py-4 grid gap-4">
              {availableCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p>ไม่มีค่ายที่เปิดรับสมัครในขณะนี้</p>
                </div>
              ) : (
                availableCamps.map((camp: any) => (
                  <Card
                    key={camp.id}
                    isPressable={navigatingTo === null}
                    className={`border-none shadow-sm hover:shadow-md transition-shadow bg-white relative ${navigatingTo === camp.id ? 'opacity-60' : ''}`}
                    onPress={() => goToCamp(camp.id)}
                  >
                    {navigatingTo === camp.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <CardBody className="p-0 flex flex-row">
                      <div className="w-1/3 bg-gray-100 flex items-center justify-center relative">
                        {/* Placeholder Image */}
                        <Flag className="text-[#5d7c6f]/20" size={48} />
                      </div>
                      <div className="w-2/3 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-800 line-clamp-1">
                            {camp.title}
                          </h3>
                        </div>
                        <div className="space-y-1 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{formatDate(camp.rawStartDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span>{camp.location}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <Chip
                            className="bg-green-50 text-green-700"
                            size="sm"
                            variant="flat"
                          >
                            เปิดรับสมัคร
                          </Chip>
                          <div className="bg-[#5d7c6f] text-white font-medium text-xs px-4 py-2 rounded-full cursor-pointer hover:opacity-90 transition-opacity">
                            ดูรายละเอียด
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>
          <Tab key="mycamps" title="ค่ายของฉัน">
            <div className="py-4 grid gap-4">
              {myCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p>คุณยังไม่ได้ลงทะเบียนค่ายใดๆ</p>
                </div>
              ) : (
                myCamps.map((camp: any) => (
                  <Card
                    key={camp.id}
                    isPressable={navigatingTo === null}
                    className={`border-none shadow-sm hover:shadow-md transition-shadow bg-white relative ${navigatingTo === camp.id ? 'opacity-60' : ''}`}
                    onPress={() => goToCamp(camp.id)}
                  >
                    {navigatingTo === camp.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {camp.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {camp.location}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Calendar size={14} />
                          {formatDate(camp.rawStartDate)}
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Shirt size={14} />
                          {camp.shirtSize || "ยังไม่ระบุไซส์"}
                        </div>
                      </div>

                      <div className="w-full bg-[#5d7c6f] text-white font-medium py-3 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                        เข้าสู่แดชบอร์ดค่าย
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>

          {/* ===== ประวัติค่ายที่จบแล้ว ===== */}
          <Tab
            key="ended"
            title={
              <div className="flex items-center gap-1.5">
                <span>ประวัติค่ายที่เข้าร่วม</span>
                {endedCamps.length > 0 && (
                  <span className="ml-1 bg-gray-200 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                    {endedCamps.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="py-4 grid gap-4">
              {endedCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <History className="mx-auto mb-3 opacity-30" size={40} />
                  <p>ยังไม่มีประวัติค่ายที่เข้าร่วม</p>
                </div>
              ) : (
                endedCamps.map((camp: any) => (
                  <Card
                    key={camp.id}
                    isPressable={camp.isRegistered && navigatingTo === null}
                    className={`border-none shadow-sm bg-white opacity-80 hover:opacity-100 transition-opacity relative ${navigatingTo === camp.id ? 'opacity-60' : ''}`}
                    onPress={() =>
                      camp.isRegistered && goToCamp(camp.id)
                    }
                  >
                    {navigatingTo === camp.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <CardBody className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-700">
                              {camp.title}
                            </h3>
                            {camp.isRegistered ? (
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={11} /> เข้าร่วมแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                                ไม่ได้เข้าร่วม
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{camp.location}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 flex-shrink-0">
                          <History size={18} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Calendar size={13} />
                          {formatDate(camp.rawStartDate)}
                        </div>
                        <span className="text-gray-300">–</span>
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Calendar size={13} />
                          {formatDate(camp.rawEndDate)}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
