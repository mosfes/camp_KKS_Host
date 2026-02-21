"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import {
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  Flag,
  CheckCircle2,
  Ticket,
  Shirt,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "react-hot-toast";

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

const SHIRT_SIZE_CHART = [
  { size: "XS", chest: '32"', length: '24"' },
  { size: "S", chest: '36"', length: '26"' },
  { size: "M", chest: '40"', length: '28"' },
  { size: "L", chest: '44"', length: '30"' },
  { size: "XL", chest: '48"', length: '32"' },
  { size: "2XL", chest: '52"', length: '34"' },
];

function formatDate(dateString: string) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("th-TH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysRemaining(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
}

export default function StudentCampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [shirtSize, setShirtSize] = useState("");
  const [savingShirt, setSavingShirt] = useState(false);

  const fetchCamp = async () => {
    try {
      const res = await fetch("/api/student/camps");

      if (res.ok) {
        const data = await res.json();
        const found = data.find((c: any) => c.id === Number(id));

        if (found) {
          setCamp(found);
          if (found.shirtSize) setShirtSize(found.shirtSize);
        } else {
          toast.error("ไม่พบค่าย");
        }
      }
    } catch (error) {
      console.error("Failed to fetch camp", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamp();
  }, [id]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const res = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: Number(id) }),
      });

      if (res.ok) {
        toast.success("ลงทะเบียนสำเร็จ!");
        fetchCamp(); // Refresh state
      } else {
        toast.error("ลงทะเบียนล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setRegistering(false);
    }
  };

  const handleShirtUpdate = async (size: string) => {
    setShirtSize(size);
    setSavingShirt(true);
    try {
      const res = await fetch("/api/student/enroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: Number(id), shirtSize: size }),
      });

      if (res.ok) {
        toast.success("อัปเดตไซส์เสื้อเรียบร้อย!");
      } else {
        toast.error("ไม่สามารถอัปเดตไซส์เสื้อได้");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingShirt(false);
    }
  };

  if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (!camp) return <div className="p-8 text-center">ไม่พบค่าย</div>;

  // Hardcoded progress for demo visual (since we don't have mission results yet)
  // In real app, calculate from camp.station metrics
  const overallProgress = 0;
  const totalMissions =
    camp.station?.reduce(
      (acc: number, s: any) => acc + (s.mission?.length || 0),
      0,
    ) || 0;
  const completedMissions = 0;

  const daysLeftToReserve = getDaysRemaining(camp.endShirtDate);

  return (
    <div className="min-h-screen bg-[#F5F1E8] pb-24">
      {/* Header Image Area */}
      <div className="h-64 bg-gray-200 relative">
        {/* Fallback pattern or image */}
        <div className="w-full h-full bg-[#2d3748] flex items-center justify-center text-white/20">
          <Flag size={64} />
        </div>
        <div className="absolute top-4 left-4">
          <Button
            isIconOnly
            className="bg-white/80 backdrop-blur-md text-gray-700"
            variant="flat"
            onPress={() => router.back()}
          >
            <ChevronLeft />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        {/* Camp Title Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2d3748] mb-2">
                {camp.title}
              </h1>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                {camp.description}
              </p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>
                    {formatDate(camp.rawStartDate)} -{" "}
                    {formatDate(camp.rawEndDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{camp.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket size={16} />
                  <span>8/25 ลงทะเบียนแล้ว</span>
                </div>
              </div>
            </div>
            <Chip className="bg-[#E2DCC8] text-[#5C5C5C]" size="sm">
              กำลังจะมาถึง
            </Chip>
          </div>
        </div>

        {/* Schedule Section */}
        {camp.camp_daily_schedule && camp.camp_daily_schedule.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2d3748] mb-4">
              ตารางกิจกรรม
            </h2>
            <div className="space-y-3">
              {camp.camp_daily_schedule.map((day: any) => (
                <div
                  key={day.daily_schedule_id}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-gray-400" size={16} />
                    <span className="font-semibold text-gray-700">
                      วันที่ {day.day}
                    </span>
                  </div>
                  {day.time_slots && day.time_slots.length > 0 ? (
                    <div className="space-y-1 pl-6 border-l-2 border-gray-200 ml-2">
                      {day.time_slots.map((slot: any) => (
                        <div
                          key={slot.time_slot_id}
                          className="text-sm text-gray-600"
                        >
                          <span className="font-mono text-gray-400 mr-2">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {slot.activity}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 ml-8">ไม่มีกิจกรรม</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Section */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-[#2d3748] mb-4">ความคืบหน้า</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>ฐานที่ทำเสร็จ</span>
              </div>
              <span>0/{camp.station?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Flag size={16} />
                <span>ภารกิจทั้งหมด</span>
              </div>
              <span>{completedMissions} สำเร็จ</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Ticket size={16} />
                <span>คะแนนสะสม</span>
              </div>
              <span>0 pts</span>
            </div>
          </div>
        </div>

        {/* Shirt Reservation Section */}
        {camp.isRegistered && camp.hasShirt && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shirt className="text-gray-600" size={20} />
              <h2 className="text-lg font-bold text-[#2d3748]">จองเสื้อค่าย</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              กรุณาจองเสื้อค่ายของคุณก่อน {formatDate(camp.endShirtDate)}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm flex items-center gap-2 mb-6">
              <Clock size={16} />
              เหลือเวลาอีก {daysLeftToReserve} วัน
              <span className="text-blue-500 ml-auto text-xs">
                หมดเขต: {formatDate(camp.endShirtDate)}
              </span>
            </div>

            {/* Shirt Image Mockup */}
            <div className="h-48 bg-gray-200 rounded-xl mb-6 overflow-hidden relative">
              {/* Placeholder for Shirt Image provided in design */}
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white">
                <span className="font-mono tracking-widest text-xl">
                  เสื้อค่าย
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกไซส์เสื้อของคุณ:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {SHIRT_SIZES.map((size) => (
                  <button
                    key={size}
                    className={`
                                            py-2 px-4 rounded-lg border text-sm font-medium transition-all
                                            ${
                                              shirtSize === size
                                                ? "bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                                            }
                                         `}
                    disabled={savingShirt}
                    onClick={() => handleShirtUpdate(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <p className="font-medium mb-2">ตารางไซส์ (นิ้ว):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-1">ไซส์</th>
                      <th className="py-1">อก</th>
                      <th className="py-1">ยาว</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SHIRT_SIZE_CHART.map((row) => (
                      <tr key={row.size} className="border-b border-gray-50">
                        <td className="py-1 font-medium">{row.size}</td>
                        <td className="py-1">{row.chest}</td>
                        <td className="py-1">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button
              fullWidth
              className="mt-6 bg-[#5d7c6f] text-white font-medium"
              isDisabled={daysLeftToReserve <= 0}
            >
              ยืนยันการจอง
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 z-50">
        <div className="max-w-4xl mx-auto space-y-3">
          {!camp.isRegistered ? (
            <Button
              fullWidth
              className="bg-[#5d7c6f] text-white font-bold text-lg h-12"
              isLoading={registering}
              onPress={handleRegister}
            >
              ลงทะเบียนทันที
            </Button>
          ) : (
            <>
              <Button
                fullWidth
                className="bg-[#5d7c6f] text-white font-bold text-lg h-12"
                startContent={<LayoutDashboard size={20} />}
                onPress={() =>
                  router.push(`/student/dashboard/camp/${id}/missions`)
                }
              >
                ไปยังหน้าภารกิจ
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="bg-[#F5F1E8] text-[#5C5C5C]"
                  startContent={<Ticket size={18} />}
                  variant="flat"
                >
                  เกียรติบัตร
                </Button>
                <Button
                  className="bg-[#F5F1E8] text-[#5C5C5C]"
                  startContent={<CheckCircle2 size={18} />}
                  variant="flat"
                >
                  เช็คชื่อ
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
