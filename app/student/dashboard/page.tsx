"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { MapPin, Calendar, Flag, Shirt, CheckCircle2 } from "lucide-react";
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

  useEffect(() => {
    async function fetchStudentCamps() {
      try {
        const res = await fetch("/api/student/camps");

        if (res.ok) {
          const data = await res.json();

          setCamps(data);
        }
      } catch (error) {
        console.error("Failed to fetch camps", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentCamps();
  }, []);

  const availableCamps = camps.filter((c: any) => !c.isRegistered);
  const myCamps = camps.filter((c: any) => c.isRegistered);

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
            <h1 className="text-2xl font-bold mb-2">สวัสดี, น้องริว! 👋</h1>
            <p className="opacity-90">พร้อมสำหรับการผจญภัยครั้งใหม่หรือยัง?</p>
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
                    isPressable
                    className="border-none shadow-sm hover:shadow-md transition-shadow bg-white"
                    onPress={() =>
                      router.push(`/student/dashboard/camp/${camp.id}`)
                    }
                  >
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
                    isPressable
                    className="border-none shadow-sm hover:shadow-md transition-shadow bg-white"
                    onPress={() =>
                      router.push(`/student/dashboard/camp/${camp.id}`)
                    }
                  >
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
        </Tabs>
      </div>
    </div>
  );
}
