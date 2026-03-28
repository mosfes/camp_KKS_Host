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
  ClipboardList,
  ImageOff,
} from "lucide-react";
import { toast } from "react-hot-toast";

import TakeSurveyModal from "../TakeSurveyModal";

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

function formatDate(dateString: string) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getDaysRemaining(endDate: string) {
  if (!endDate) return null;
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = end.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24)); // Use round to avoid -0 issues

  return days >= 0 ? days : 0;
}

/** คืน true ถ้าวันนี้อยู่ในช่วงจองเสื้อ (ไม่ย้อนหลัง ไม่เกินวันหมดเขต) */
function isInShirtPeriod(startDate?: string, endDate?: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (today < start) return false;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (today > end) return false;
  }
  return true;
}

export default function StudentCampDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [camp, setCamp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [shirtSize, setShirtSize] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [savingShirt, setSavingShirt] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [isEditingShirt, setIsEditingShirt] = useState(false);

  // Survey State
  const [surveyData, setSurveyData] = useState<any>(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  const fetchCamp = async () => {
    try {
      const res = await fetch("/api/student/camps", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const found = data.find((c: any) => c.id === Number(id));

        if (found) {
          setCamp(found);
          if (found.shirtSize) {
            setShirtSize(found.shirtSize);
            setSelectedSize(found.shirtSize);
          }
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
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const res = await fetch(`/api/student/surveys?campId=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.survey) {
          setSurveyData(data.survey);
          setSurveyCompleted(data.isCompleted);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSurveyCompleted = () => {
    setSurveyCompleted(true);
  };

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
        fetchCamp();
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
    setSavingShirt(true);
    try {
      const res = await fetch("/api/student/enroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId: Number(id), shirtSize: size }),
      });

      if (res.ok) {
        toast.success("อัปเดตไซส์เสื้อเรียบร้อย!");
        setShirtSize(size);
        setIsEditingShirt(false);
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

  const totalMissions = camp.station?.reduce((acc: number, s: any) => acc + (s.mission?.length || 0), 0) || 0;
  const completedMissions = 0;

  const daysLeftToReserve = getDaysRemaining(camp.endShirtDate);
  const daysUntilStart = getDaysRemaining(camp.rawStartDate);
  const shirtPeriodActive = isInShirtPeriod(camp.startShirtDate, camp.endShirtDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = camp.rawStartDate ? new Date(camp.rawStartDate) : null;
  if (startDate) startDate.setHours(0, 0, 0, 0);
  const campNotStarted = startDate && today < startDate;

  return (
    <div className="min-h-screen bg-[#F5F1E8] pb-64">
      <div className="h-64 bg-gray-200 relative overflow-hidden">
        {camp.img_camp_url ? (
          <img src={camp.img_camp_url} alt={camp.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#2d3748] flex items-center justify-center text-white/20">
            <Flag size={64} />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <Button isIconOnly className="bg-white/80 backdrop-blur-md text-gray-700" variant="flat" onPress={() => router.back()}>
            <ChevronLeft />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#2d3748] mb-2">{camp.title}</h1>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{camp.description}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formatDate(camp.rawStartDate)} - {formatDate(camp.rawEndDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{camp.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket size={16} />
                  <span>{camp.totalEnrolled}/{camp.totalCapacity} ลงทะเบียนแล้ว</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {camp.camp_daily_schedule && camp.camp_daily_schedule.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2d3748] mb-4">ตารางกิจกรรม</h2>
            <div className="space-y-3">
              {camp.camp_daily_schedule.map((day: any) => (
                <div key={day.daily_schedule_id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-gray-400" size={16} />
                    <span className="font-semibold text-gray-700">วันที่ {day.day}</span>
                  </div>
                  {day.time_slots && day.time_slots.length > 0 ? (
                    <div className="space-y-1 pl-6 border-l-2 border-gray-200 ml-2">
                      {day.time_slots.map((slot: any) => (
                        <div key={slot.time_slot_id} className="text-sm text-gray-600">
                          <span className="font-mono text-gray-400 mr-2">{slot.startTime} - {slot.endTime}</span>
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

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 relative overflow-hidden">
          {!camp.isRegistered && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                <Flag size={24} />
              </div>
              <h3 className="font-bold text-[#2d3748] mb-1">
                {camp.isEnded ? "ค่ายนี้จบลงแล้ว" : "ลงทะเบียนเพื่อดูความคืบหน้า"}
              </h3>
              <p className="text-xs text-gray-500">
                {camp.isEnded 
                  ? "คุณไม่ได้เข้าร่วมค่ายนี้ในระยะเวลาที่กำหนด" 
                  : "คุณจะสามารถทำภารกิจได้หลังจากเข้าร่วมค่ายแล้ว"}
              </p>
            </div>
          )}
          <h2 className="text-lg font-bold text-[#2d3748] mb-4">ความคืบหน้า</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} /><span>ฐานที่ทำเสร็จ</span></div>
              <span>0/{camp.station?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2"><Flag size={16} /><span>ภารกิจทั้งหมด</span></div>
              <span>{completedMissions} สำเร็จ</span>
            </div>
          </div>
        </div>

        {camp.isRegistered && camp.hasShirt && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shirt className="text-gray-600" size={20} />
                <h2 className="text-lg font-bold text-[#2d3748]">จองเสื้อค่าย</h2>
              </div>
              <div className="flex gap-2">
                {isEditingShirt && (
                  <Button size="sm" variant="light" className="text-gray-500 font-medium hover:bg-gray-100" onPress={() => { setSelectedSize(shirtSize); setIsEditingShirt(false); }}>
                    ยกเลิก
                  </Button>
                )}
                {shirtSize && shirtPeriodActive && !isEditingShirt && (
                  <Button size="sm" variant="flat" className="bg-gray-100 text-[#5C5C5C] font-medium" onPress={() => setIsEditingShirt(true)}>
                    แก้ไขไซส์เสื้อ
                  </Button>
                )}
              </div>
            </div>

            {shirtSize && !isEditingShirt ? (
              <div className="bg-gray-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-gray-100/50">
                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-[#5d7c6f] font-bold text-xl mb-2">{shirtSize}</div>
                <p className="text-gray-600 text-sm font-medium">จองเสื้อไซส์ {shirtSize} เรียบร้อยแล้ว</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{shirtPeriodActive ? "แก้ไขได้ภายในกำหนดเวลา" : "หมดเขตการแก้ไขแล้ว"}</p>
              </div>
            ) : (!shirtSize && !shirtPeriodActive) ? (
              <div className="bg-orange-50/50 rounded-2xl p-4 flex flex-col items-center justify-center border border-orange-100/50">
                <p className="text-orange-600 text-sm font-medium">หมดเขตการจองเสื้อแล้ว</p>
                <p className="text-[10px] text-orange-400 mt-0.5">คุณไม่ได้ทำรายการในช่วงเวลาที่กำหนด</p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-4">กรุณาจองเสื้อค่ายของคุณก่อน {formatDate(camp.endShirtDate)}</p>
                {daysLeftToReserve !== null && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 text-sm flex items-center gap-2 mb-6">
                    <Clock size={16} />
                    {daysLeftToReserve === 0 ? "วันนี้วันสุดท้ายของการจอง" : `เหลือเวลาอีก ${daysLeftToReserve} วัน`}
                    <span className="text-blue-500 ml-auto text-xs">หมดเขต: {formatDate(camp.endShirtDate)}</span>
                  </div>
                )}
                <div className="mb-6">
                  {(() => {
                    let shirtUrls: string[] = [];
                    if (camp.img_shirt_url) {
                      try {
                        const parsed = JSON.parse(camp.img_shirt_url);
                        shirtUrls = Array.isArray(parsed) ? parsed.filter(Boolean) : [camp.img_shirt_url];
                      } catch (e) { shirtUrls = [camp.img_shirt_url]; }
                    }
                    if (shirtUrls.length > 0) {
                      return (
                        <div className={`grid gap-3 ${shirtUrls.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2 md:grid-cols-3'}`}>
                          {shirtUrls.map((url, idx) => (
                            <div key={idx} className="bg-gray-100 rounded-xl overflow-hidden aspect-square border border-gray-200 shadow-sm relative group">
                              <img src={url} alt="Shirt" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => window.open(url, '_blank')}>
                                <span className="text-white text-sm font-medium">ดูรูปขนาดเต็ม</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return <div className="h-48 bg-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 font-medium"><ImageOff size={32} className="mb-2 opacity-50" />ไม่มีรูปตัวอย่างเสื้อ</div>;
                  })()}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">เลือกไซส์เสื้อของคุณ:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SHIRT_SIZES.map((size) => (
                      <button key={size} disabled={savingShirt || !shirtPeriodActive} onClick={() => setSelectedSize(size)} className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${selectedSize === size ? "bg-gray-800 text-white border-gray-800 ring-2 ring-gray-300" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"} ${!shirtPeriodActive ? "opacity-60 cursor-not-allowed" : ""}`}>{size}</button>
                    ))}
                  </div>
                </div>
                <Button fullWidth className="mt-6 font-bold bg-[#5d7c6f] text-white" isDisabled={!shirtPeriodActive || !selectedSize} isLoading={savingShirt} onPress={() => { if(shirtSize === selectedSize) setIsEditingShirt(false); else handleShirtUpdate(selectedSize); }}>
                  {!shirtPeriodActive ? "ไม่อยู่ในช่วงเวลาการจอง" : (shirtSize ? (shirtSize === selectedSize ? "ยกเลิกการแก้ไข" : "ยืนยันการแก้ไข") : "ยืนยันการจองเสื้อ")}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 z-50">
        <div className="max-w-4xl mx-auto space-y-3">
          {!camp.isRegistered ? (
             camp.isEnded ? (
                <Button fullWidth className="bg-gray-300 text-gray-500 font-bold text-lg h-12 cursor-not-allowed" isDisabled>สิ้นสุดการรับสมัครแล้ว</Button>
             ) : (
                <Button fullWidth className="bg-[#5d7c6f] text-white font-bold text-lg h-12" isLoading={registering} onPress={handleRegister}>เข้าร่วมค่าย</Button>
             )
          ) : (
            <div className="relative">
              {/* Overlay เมื่อค่ายยังไม่เริ่ม */}
              {campNotStarted && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 rounded-xl flex flex-col items-center justify-center gap-1">
                  <Clock className="text-gray-400" size={22} />
                  <p className="text-sm font-bold text-gray-600">ยังไม่ถึงเวลาเริ่มค่าย</p>
                  <p className="text-xs text-gray-400">อีก {daysUntilStart} วัน · เริ่ม {formatDate(camp.rawStartDate)}</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {camp.isEnded ? (
                  <>
                    <Button fullWidth className="bg-[#5d7c6f] text-white font-bold text-lg h-12" startContent={<LayoutDashboard size={20} />} isLoading={navigating} onPress={() => { setNavigating(true); router.push(`/student/dashboard/camp/${id}/missions`); }}>
                      สรุปผลการทำภารกิจ
                    </Button>
                    <Button 
                      fullWidth
                      className="bg-gray-100 text-gray-400 border border-gray-200 font-bold text-lg h-12 cursor-not-allowed opacity-80"
                      startContent={<Ticket size={20} />} 
                      isDisabled
                    >
                      ดาวน์โหลดเกียรติบัตร (กำลังพัฒนา)
                    </Button>
                  </>
                ) : (
                  <>
                    <Button fullWidth className="bg-[#5d7c6f] text-white font-bold text-lg h-12" startContent={<LayoutDashboard size={20} />} isLoading={navigating} isDisabled={navigating || !!campNotStarted} onPress={() => { setNavigating(true); router.push(`/student/dashboard/camp/${id}/missions`); }}>
                      ไปยังหน้าภารกิจ
                    </Button>
                    <Button fullWidth className={`border font-medium ${surveyData && !surveyCompleted ? "bg-[#FFECC9] text-yellow-800 border-yellow-300" : "bg-gray-100 text-gray-500 border-gray-200"}`} startContent={<ClipboardList size={18} />} onPress={() => setIsSurveyModalOpen(true)} isDisabled={!surveyData || surveyCompleted}>{surveyCompleted ? "ทำแบบประเมินเรียบร้อยแล้ว" : "แบบประเมินความพึงพอใจ"}</Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        className="bg-gray-100 text-gray-400 border-gray-200 font-medium cursor-not-allowed opacity-80"
                        startContent={<Ticket size={18} />} 
                        isDisabled
                      >
                        เกียรติบัตร (กำลังพัฒนา)
                      </Button>
                      <Button
                        className="bg-gray-100 text-gray-400 border-gray-200 font-medium cursor-not-allowed opacity-80"
                        startContent={<CheckCircle2 size={18} />}
                        isDisabled
                      >
                        เช็คชื่อ (กำลังพัฒนา)
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <TakeSurveyModal isOpen={isSurveyModalOpen} onClose={() => setIsSurveyModalOpen(false)} survey={surveyData} campId={Number(id)} onCompleted={handleSurveyCompleted} />
    </div>
  );
}
