"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { MapPin, Calendar, Flag, Shirt, CheckCircle2, History, Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Utility to format date (with optional range)
const formatDate = (start: string, end?: string) => {
  if (!start) return "";
  const s = new Date(start).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  if (!end || start === end) return s;
  const e = new Date(end).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${s} - ${e}`;
};

export default function StudentDashboard() {
  const router = useRouter();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [navigatingTo, setNavigatingTo] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    chronic_disease: "",
    food_allergy: "",
    birthday: "",
    parent_tel: "",
    remark: "",
  });
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const goToCamp = (campId: number) => {
    if (navigatingTo !== null) return;
    setNavigatingTo(campId);
    router.push(`/student/dashboard/camp/${campId}`);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [campsRes, studentRes, profileRes] = await Promise.all([
          fetch("/api/student/camps"),
          fetch("/api/auth/student/me"),
          fetch("/api/student/profile")
        ]);

        if (campsRes.ok) {
          setCamps(await campsRes.json());
        }
        if (studentRes.ok) {
          setStudent(await studentRes.json());
        }
        if (profileRes.ok) {
          const profile = await profileRes.json();
          // Check if key information is missing
          if (!profile.birthday || !profile.tel || profile.chronic_disease === null || profile.food_allergy === null) {
            setProfileData({
              chronic_disease: profile.chronic_disease || "",
              food_allergy: profile.food_allergy || "",
              birthday: profile.birthday ? profile.birthday.split('T')[0] : "",
              parent_tel: profile.tel || (profile.parents && profile.parents.length > 0 ? profile.parents[0].tel : ""),
              remark: profile.remark || "",
            });
            setShowProfileModal(true);
          }
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

  // Constants for birthday selection
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => (currentYear - (i + 5)).toString());

  const handleProfileSubmit = async (e: any) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        setShowProfileModal(false);
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSubmittingProfile(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
    );

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Profile Completion Modal */}
      <Modal isOpen={showProfileModal} isDismissable={false} hideCloseButton={true} placement="center">
        <ModalContent>
          <form onSubmit={handleProfileSubmit}>
            <ModalHeader className="flex flex-col gap-1 text-[#5d7c6f] font-bold pb-1 pt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-xl">
                <Sparkles size={24} className="text-[#5d7c6f]" />
                มาทำความรู้จักกันอีกนิด
              </div>
            </ModalHeader>
            <ModalBody className="py-2 gap-4">
              <div className="bg-[#5d7c6f]/10 p-4 rounded-xl border border-[#5d7c6f]/20 mb-2">
                <p className="text-sm text-gray-700 leading-relaxed text-center">
                  รบกวนอัปเดตข้อมูลส่วนตัวเหล่านี้หน่อยนะ <br/>
                  <span className="text-xs text-gray-500 mt-1 block">(ถ้าหากไม่มีข้อมูลในส่วนไหน สามารถพิมพ์คำว่า "ไม่มี" ได้เลย)</span>
                </p>
              </div>
              
              <Input
                isRequired
                label="โรคประจำตัว"
                placeholder="เช่น หอบหืด (หากไม่มีให้พิมพ์ 'ไม่มี')"
                value={profileData.chronic_disease}
                onChange={(e) => setProfileData({...profileData, chronic_disease: e.target.value})}
                variant="bordered"
              />
              <Input
                isRequired
                label="การแพ้อาหาร/ยา"
                placeholder="เช่น อาหารทะเล, พาราเซตามอล (หากไม่มีให้พิมพ์ 'ไม่มี')"
                value={profileData.food_allergy}
                onChange={(e) => setProfileData({...profileData, food_allergy: e.target.value})}
                variant="bordered"
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">วัน/เดือน/ปีเกิด</label>
                <div className="flex gap-2">
                  <Select
                    isRequired
                    placeholder="วันที่"
                    aria-label="วันเกิด"
                    selectedKeys={profileData.birthday ? [profileData.birthday.split('-')[2].replace(/^0/, '')] : []}
                    onSelectionChange={(keys) => {
                      const day = Array.from(keys)[0] as string;
                      const parts = profileData.birthday ? profileData.birthday.split('-') : ["", "", ""];
                      setProfileData({...profileData, birthday: `${parts[0] || currentYear}-${parts[1] || '01'}-${day.padStart(2, '0')}`});
                    }}
                    variant="bordered"
                    className="flex-1"
                  >
                    {days.map((d) => (
                      <SelectItem key={d} textValue={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    isRequired
                    placeholder="เดือน"
                    aria-label="เดือนเกิด"
                    selectedKeys={profileData.birthday ? [profileData.birthday.split('-')[1]] : []}
                    onSelectionChange={(keys) => {
                      const month = Array.from(keys)[0] as string;
                      const parts = profileData.birthday ? profileData.birthday.split('-') : ["", "", ""];
                      setProfileData({...profileData, birthday: `${parts[0] || currentYear}-${month}-${parts[2] || '01'}`});
                    }}
                    variant="bordered"
                    className="flex-[2]"
                  >
                    {months.map((m) => (
                      <SelectItem key={m.value} textValue={m.label}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    isRequired
                    placeholder="ปี (พ.ศ.)"
                    aria-label="ปีเกิด"
                    selectedKeys={profileData.birthday ? [profileData.birthday.split('-')[0]] : []}
                    onSelectionChange={(keys) => {
                      const year = Array.from(keys)[0] as string;
                      const parts = profileData.birthday ? profileData.birthday.split('-') : ["", "", ""];
                      setProfileData({...profileData, birthday: `${year}-${parts[1] || '01'}-${parts[2] || '01'}`});
                    }}
                    variant="bordered"
                    className="flex-[1.5]"
                  >
                    {years.map((y) => (
                      <SelectItem key={y} textValue={(parseInt(y) + 543).toString()}>
                        {(parseInt(y) + 543).toString()}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              <Input
                isRequired
                type="tel"
                label="เบอร์โทรศัพท์ติดต่อ (ผู้ปกครองหรือนักเรียน)"
                placeholder="เช่น 0812345678"
                maxLength={10}
                value={profileData.parent_tel}
                onChange={(e) => setProfileData({...profileData, parent_tel: e.target.value})}
                variant="bordered"
              />
              <Textarea
                label="หมายเหตุเพิ่มเติม"
                placeholder="ข้อมูลอื่นๆ ที่ต้องการแจ้งให้ครูทราบ (ถ้ามี)"
                value={profileData.remark}
                onChange={(e) => setProfileData({...profileData, remark: e.target.value})}
                variant="bordered"
              />
            </ModalBody>
            <ModalFooter>
              <Button color="primary" type="submit" className="w-full bg-[#5d7c6f] font-bold" isLoading={submittingProfile}>
                บันทึกข้อมูล
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Greeting Card */}
        <div className="bg-[#5d7c6f] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              สวัสดีน้อง{student?.firstname || "ๆ"} <Sparkles className="text-white" size={24} />
            </h1>
            <p className="opacity-90 mb-4">ยินดีตอนรับ</p>

            {/* Student Info Badges */}
            {student && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {/* รหัสนักเรียน — แสดงเสมอ */}
                <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="13" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" /></svg>
                  <span className="hidden xs:inline">รหัสนักเรียน:</span>
                  <span className="xs:hidden">ID:</span> {student.students_id}
                </span>

                {student.classroom?.grade_label && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                    ชั้น {student.classroom.grade_label}
                  </span>
                )}
                {student.classroom?.class_name && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                    ห้อง {student.classroom.class_name}
                  </span>
                )}
                {student.classroom?.homeroom_teacher && (
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span className="truncate">ครูประจำชั้น: {student.classroom.homeroom_teacher}</span>
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
              "gap-3 sm:gap-6 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto overflow-y-hidden scrollbar-hide",
            cursor: "w-full bg-[#5d7c6f]",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-[#5d7c6f] font-bold",
          }}
          color="primary"
          variant="underlined"
        >
          {/* ----- Tab 1: Available ----- */}
          <Tab 
            key="available" 
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">ค่ายที่เปิดรับสมัคร</span>
                {availableCamps.length > 0 && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">
                    {availableCamps.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="py-2 grid gap-4">
              {availableCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p>ไม่มีค่ายที่เปิดรับสมัครในขณะนี้</p>
                </div>
              ) : (
                availableCamps.map((camp: any) => (
                  <Card
                    key={camp.id}
                    isPressable={navigatingTo === null}
                    className={`border-none shadow-sm hover:shadow-md transition-shadow bg-white relative ${navigatingTo === camp.id ? "opacity-60" : ""}`}
                    onPress={() => goToCamp(camp.id)}
                  >
                    {navigatingTo === camp.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <CardBody className="p-0 flex flex-col sm:flex-row sm:h-48">
                      <div className="w-full h-40 sm:w-48 sm:h-full md:w-56 bg-gray-100 flex-shrink-0 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                        {camp.img_camp_url ? (
                          <img
                            src={camp.img_camp_url}
                            alt={camp.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Flag className="text-[#5d7c6f]/20" size={40} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-start gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base sm:text-lg text-gray-800 line-clamp-2 leading-snug">
                            {camp.title}
                          </h3>
                        </div>

                        <div className="flex flex-col gap-1.5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">สถานที่:</span>
                            <span className="text-gray-700 line-clamp-1">{camp.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">วันลงทะเบียน:</span>
                            <span className="text-gray-700">{formatDate(camp.startRegisDate, camp.endRegisDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">วันเริ่มค่าย:</span>
                            <span className="text-gray-700">{formatDate(camp.rawStartDate, camp.rawEndDate)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-[#5d7c6f] text-white font-medium py-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity text-sm">
                          ดูรายละเอียดค่าย
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>

          {/* ----- Tab 2: My Camps ----- */}
          <Tab 
            key="mycamps" 
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">ค่ายของฉัน</span>
                {myCamps.length > 0 && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">
                    {myCamps.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="py-2 grid gap-4">
              {myCamps.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <p>คุณยังไม่ได้ลงทะเบียนค่ายใดๆ</p>
                </div>
              ) : (
                myCamps.map((camp: any) => (
                  <Card
                    key={camp.id}
                    isPressable={navigatingTo === null}
                    className={`border-none shadow-sm hover:shadow-md transition-shadow bg-white relative ${navigatingTo === camp.id ? "opacity-60" : ""}`}
                    onPress={() => goToCamp(camp.id)}
                  >
                    {navigatingTo === camp.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <CardBody className="p-0 flex flex-col sm:flex-row sm:h-48">
                      <div className="w-full h-40 sm:w-48 sm:h-full md:w-56 bg-gray-100 flex-shrink-0 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                        {camp.img_camp_url ? (
                          <img
                            src={camp.img_camp_url}
                            alt={camp.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Flag className="text-[#5d7c6f]/20" size={40} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-start gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base sm:text-lg text-gray-800 line-clamp-2 leading-snug">
                            {camp.title}
                          </h3>
                        </div>

                        <div className="flex flex-col gap-1.5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">สถานที่:</span>
                            <span className="text-gray-700 line-clamp-1">{camp.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">วันลงทะเบียน:</span>
                            <span className="text-gray-700">{formatDate(camp.startRegisDate, camp.endRegisDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">วันเริ่มค่าย:</span>
                            <span className="text-gray-700">{formatDate(camp.rawStartDate, camp.rawEndDate)}</span>
                          </div>
                        </div>

                        <div className="w-full bg-[#5d7c6f] text-white font-medium py-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity text-sm">
                          ดูรายละเอียดค่าย
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
              )}
            </div>
          </Tab>

          {/* ----- Tab 3: Ended ----- */}
          <Tab
            key="ended"
            title={
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold">ประวัติค่ายที่เข้าร่วม</span>
                {endedCamps.length > 0 && (
                  <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-full">
                    {endedCamps.length}
                  </span>
                )}
              </div>
            }
          >
            <div className="py-2 grid gap-4">
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
                    className={`border-none shadow-sm bg-white opacity-80 hover:opacity-100 transition-opacity relative ${navigatingTo === camp.id ? "opacity-60" : ""}`}
                    onPress={() => camp.isRegistered && goToCamp(camp.id)}
                  >
                    {navigatingTo === camp.id && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/60 rounded-2xl">
                        <div className="w-6 h-6 border-2 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <CardBody className="p-0 flex flex-col sm:flex-row sm:h-48">
                      <div className="w-full h-40 sm:w-48 sm:h-full md:w-56 bg-gray-100 flex-shrink-0 relative overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none">
                        {camp.img_camp_url ? (
                          <img
                            src={camp.img_camp_url}
                            alt={camp.title}
                            className="w-full h-full object-cover opacity-80"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Flag className="text-[#5d7c6f]/20" size={40} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-start gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base sm:text-lg text-gray-700 line-clamp-2 leading-snug mb-1">
                            {camp.title}
                          </h3>
                        </div>

                        <div className="flex flex-col gap-1.5 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">สถานที่:</span>
                            <span className="text-gray-700 line-clamp-1">{camp.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">วันลงทะเบียน:</span>
                            <span className="text-gray-700">{formatDate(camp.startRegisDate, camp.endRegisDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#5d7c6f]" />
                            <span className="text-gray-400">วันเริ่มค่าย:</span>
                            <span className="text-gray-700">{formatDate(camp.rawStartDate, camp.rawEndDate)}</span>
                          </div>
                        </div>

                        <div className="w-full bg-[#5d7c6f] text-white font-medium py-2.5 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity text-sm">
                          ดูรายละเอียดค่าย
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
