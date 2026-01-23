"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ImageOff, X, Plus, Trash2, FileText } from "lucide-react";
import { useStatusModal } from "@/components/StatusModalProvider";
import { Select, SelectItem } from "@heroui/react";
import { DateRangePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";

interface TimeSlot {
    startTime: string;
    endTime: string;
    activity: string;
}

interface DaySchedule {
    day: number;
    timeSlots: TimeSlot[];
}

interface FormData {
    name: string;
    location: string;
    gradeLevel: string;
    classroomType: string;
    registrationStartDate: string;
    registrationEndDate: string;
    campStartDate: string;
    campEndDate: string;
    description: string;
    hasShirt: boolean;
    shirtStartDate: string;
    shirtEndDate: string;
    dailySchedule: DaySchedule[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    campData: any;
    isLoading?: boolean;
}

function dateValueToString(date: DateValue) {
    return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function formatDateWithOffset(startDateStr: string, dayOffset: number) {
    if (!startDateStr) return "";
    const date = new Date(startDateStr);
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
    });
}

export default function EditCampModal({
    isOpen,
    onClose,
    onSubmit,
    campData,
    isLoading
}: Props) {
    const { showWarning } = useStatusModal();
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [filteredClassrooms, setFilteredClassrooms] = useState<any[]>([]);
    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const [selectedClassroomIds, setSelectedClassroomIds] = useState<number[]>([]);
    const [shirtImage, setShirtImage] = useState<string | null>(null);
    const [shirtImageFile, setShirtImageFile] = useState<File | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: "",
        location: "",
        gradeLevel: "",
        classroomType: "",
        registrationStartDate: "",
        registrationEndDate: "",
        campStartDate: "",
        campEndDate: "",
        description: "",
        hasShirt: false,
        shirtStartDate: "",
        shirtEndDate: "",
        dailySchedule: [
            {
                day: 1,
                timeSlots: [{ startTime: "", endTime: "", activity: "" }],
            },
        ],
    });

    const [dateErrors, setDateErrors] = useState({
        registration: "",
        shirt: "",
        camp: ""
    });

    const validateDates = (data: FormData) => {
        const errors = {
            registration: "",
            shirt: "",
            camp: ""
        };

        const regisStart = data.registrationStartDate ? new Date(data.registrationStartDate) : null;
        const regisEnd = data.registrationEndDate ? new Date(data.registrationEndDate) : null;
        const shirtStart = data.shirtStartDate ? new Date(data.shirtStartDate) : null;
        const shirtEnd = data.shirtEndDate ? new Date(data.shirtEndDate) : null;
        const campStart = data.campStartDate ? new Date(data.campStartDate) : null;

        // 1. Registration Logic
        if (regisEnd) {
            if (data.hasShirt && shirtStart && regisEnd >= shirtStart) {
                errors.registration = "วันสิ้นสุดรับสมัคร ต้องมาก่อน วันเริ่มจองเสื้อ";
            } else if (campStart && regisEnd >= campStart) {
                errors.registration = "วันสิ้นสุดรับสมัคร ต้องมาก่อน วันเริ่มค่าย";
            }
        }

        // 2. Shirt Logic
        if (data.hasShirt && shirtStart && shirtEnd) {
            if (regisEnd && shirtStart <= regisEnd) {
                errors.shirt = "วันเริ่มจองเสื้อ ต้องมาหลัง วันปิดรับสมัคร";
            }
            if (campStart && shirtEnd >= campStart) {
                errors.shirt = "วันสิ้นสุดจองเสื้อ ต้องมาก่อน วันเริ่มค่าย";
            }
        }

        // 3. Camp Logic
        if (campStart) {
            if (data.hasShirt && shirtEnd && campStart <= shirtEnd) {
                errors.camp = "วันเริ่มค่าย ต้องมาหลัง วันปิดจองเสื้อ";
            }
            if (regisEnd && campStart <= regisEnd) {
                errors.camp = "วันเริ่มค่าย ต้องมาหลัง วันปิดรับสมัคร";
            }
        }

        setDateErrors(errors);
        return !errors.registration && !errors.shirt && !errors.camp;
    };

    // Re-validate whenever relevant form data changes
    useEffect(() => {
        validateDates(formData);
    }, [formData.registrationStartDate, formData.registrationEndDate, formData.shirtStartDate, formData.shirtEndDate, formData.campStartDate, formData.campEndDate, formData.hasShirt]);

    // Fetch classrooms
    useEffect(() => {
        async function fetchClassrooms() {
            try {
                const res = await fetch("/api/classrooms");
                const data = await res.json();
                setClassrooms(data);
            } catch (err) {
                console.error("Failed to fetch classrooms:", err);
            }
        }
        if (isOpen) {
            fetchClassrooms();
        }
    }, [isOpen]);

    // โหลดข้อมูลค่ายที่จะแก้ไข
    useEffect(() => {
        if (isOpen && campData) {
            console.log("=== Loading Camp Data for Edit ===");
            console.log("campData:", campData);

            // แปลง date จาก ISO string เป็น YYYY-MM-DD
            const formatDateForInput = (dateString: string) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            // ดึง grade_level
            let gradeLevel = "";
            if (campData.camp_classroom && campData.camp_classroom.length > 0) {
                gradeLevel = campData.camp_classroom[0].classroom.grade;
                setSelectedGrade(gradeLevel);
            }

            // ดึง classroom IDs
            if (campData.camp_classroom && campData.camp_classroom.length > 0) {
                const classroomIds = campData.camp_classroom.map((cc: any) => cc.classroom.classroom_id);
                setSelectedClassroomIds(classroomIds);
            }

            // ดึง daily_schedule
            let dailySchedule: DaySchedule[] = [];
            if (campData.camp_daily_schedule && campData.camp_daily_schedule.length > 0) {
                dailySchedule = campData.camp_daily_schedule
                    .sort((a: any, b: any) => a.day - b.day)
                    .map((schedule: any) => ({
                        day: schedule.day,
                        timeSlots: schedule.time_slots && schedule.time_slots.length > 0
                            ? schedule.time_slots.map((slot: any) => ({
                                startTime: (slot.startTime || slot.start_time || "").replace('.', ':'),
                                endTime: (slot.endTime || slot.end_time || "").replace('.', ':'),
                                activity: slot.activity || ""
                            }))
                            : [{ startTime: "", endTime: "", activity: "" }]
                    }));
            }

            // ตั้งค่า formData
            setFormData({
                name: campData.name || "",
                location: campData.location || "",
                gradeLevel: gradeLevel,
                classroomType: campData.plan_type?.name || "",
                registrationStartDate: formatDateForInput(campData.start_regis_date),
                registrationEndDate: formatDateForInput(campData.end_regis_date),
                campStartDate: formatDateForInput(campData.start_date),
                campEndDate: formatDateForInput(campData.end_date),
                description: campData.description || "",
                hasShirt: campData.has_shirt || false,
                shirtStartDate: formatDateForInput(campData.start_shirt_date),
                shirtEndDate: formatDateForInput(campData.end_shirt_date),
                dailySchedule: dailySchedule.length > 0 ? dailySchedule : [
                    {
                        day: 1,
                        timeSlots: [{ startTime: "", endTime: "", activity: "" }],
                    },
                ],
            });

            // ตั้งค่ารูปเสื้อ
            if (campData.shirt_image_url) {
                setShirtImage(campData.shirt_image_url);
            }
        }
    }, [isOpen, campData]);

    // Filter classrooms by grade
    useEffect(() => {
        if (selectedGrade) {
            const filtered = classrooms.filter(c => c.grade === selectedGrade);
            setFilteredClassrooms(filtered);
        } else {
            setFilteredClassrooms([]);
        }
    }, [selectedGrade, classrooms]);

    // Auto-generate schedule days based on Camp Period
    useEffect(() => {
        if (formData.campStartDate && formData.campEndDate) {
            const start = new Date(formData.campStartDate);
            const end = new Date(formData.campEndDate);

            // Calculate difference in days (inclusive)
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays > 0 && diffDays !== formData.dailySchedule.length) {
                setFormData(prev => {
                    const currentSchedule = [...prev.dailySchedule];

                    if (diffDays > currentSchedule.length) {
                        // Add missing days
                        for (let i = currentSchedule.length; i < diffDays; i++) {
                            currentSchedule.push({
                                day: i + 1,
                                timeSlots: [{ startTime: "", endTime: "", activity: "" }]
                            });
                        }
                    } else {
                        // Remove extra days
                        currentSchedule.splice(diffDays);
                    }

                    return { ...prev, dailySchedule: currentSchedule };
                });
            }
        }
    }, [formData.campStartDate, formData.campEndDate]);

    const grades = Array.from(new Set(classrooms.map(c => c.grade))).sort();

    if (!isOpen) return null;

    const handleChange = (field: keyof FormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const addDay = () => {
        setFormData((prev) => ({
            ...prev,
            dailySchedule: [
                ...prev.dailySchedule,
                {
                    day: prev.dailySchedule.length + 1,
                    timeSlots: [{ startTime: "", endTime: "", activity: "" }],
                },
            ],
        }));
    };

    const removeDay = (dayIndex: number) => {
        if (formData.dailySchedule.length <= 1) return;
        const newSchedule = formData.dailySchedule
            .filter((_, i) => i !== dayIndex)
            .map((day, idx) => ({ ...day, day: idx + 1 }));
        setFormData({ ...formData, dailySchedule: newSchedule });
    };

    const addTimeSlot = (dayIndex: number) => {
        const newSchedule = [...formData.dailySchedule];
        newSchedule[dayIndex].timeSlots.push({ startTime: "", endTime: "", activity: "" });
        setFormData({ ...formData, dailySchedule: newSchedule });
    };

    const updateTimeSlot = (dayIndex: number, slotIndex: number, field: keyof TimeSlot, value: string) => {
        const newSchedule = [...formData.dailySchedule];
        const currentSlot = newSchedule[dayIndex].timeSlots[slotIndex];

        // Validation: End time cannot be before Start time
        if (field === "endTime" && value) {
            if (currentSlot.startTime && value < currentSlot.startTime) {
                showWarning("เวลาไม่ถูกต้อง", "เวลาสิ้นสุดต้องไม่ก่อนเวลาเริ่ม");
                return;
            }
        }

        // Validation: Start time cannot be after End time
        if (field === "startTime" && value) {
            if (currentSlot.endTime && value > currentSlot.endTime) {
                showWarning("เวลาไม่ถูกต้อง", "เวลาเริ่มต้องมาก่อนเวลาสิ้นสุด");
                return;
            }
        }

        newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
        setFormData({ ...formData, dailySchedule: newSchedule });
    };

    const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
        const newSchedule = [...formData.dailySchedule];
        if (newSchedule[dayIndex].timeSlots.length > 1) {
            newSchedule[dayIndex].timeSlots = newSchedule[dayIndex].timeSlots.filter((_, i) => i !== slotIndex);
            setFormData({ ...formData, dailySchedule: newSchedule });
        }
    };

    const handleShirtImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showWarning('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพเท่านั้น');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                showWarning('ขนาดไฟล์เกิน', 'ขนาดไฟล์ต้องไม่เกิน 10MB');
                return;
            }

            setShirtImageFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setShirtImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeShirtImage = () => {
        setShirtImage(null);
        setShirtImageFile(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedClassroomIds.length === 0) {
            showWarning('ข้อมูลไม่ครบถ้วน', "กรุณาเลือกห้องเรียนอย่างน้อย 1 ห้อง");
            return;
        }

        if (formData.hasShirt) {
            if (!formData.shirtEndDate || !formData.campStartDate) {
                showWarning('ข้อมูลไม่ครบถ้วน', "กรุณากรอกวันที่สิ้นสุดการจองเสื้อ และวันเริ่มค่าย");
                return;
            }
            if (new Date(formData.shirtEndDate) >= new Date(formData.campStartDate)) {
                showWarning('วันที่ไม่ถูกต้อง', "วันสิ้นสุดการจองเสื้อต้องเป็นวันก่อนเริ่มค่ายเท่านั้น");
                return;
            }
        }

        const payload = {
            name: formData.name,
            location: formData.location,
            start_date: formData.campStartDate,
            end_date: formData.campEndDate,
            start_regis_date: formData.registrationStartDate,
            end_regis_date: formData.registrationEndDate,
            start_shirt_date: formData.shirtStartDate,
            end_shirt_date: formData.shirtEndDate,
            description: formData.description,
            has_shirt: formData.hasShirt,
            status: "OPEN",
            classroom_ids: selectedClassroomIds,
            dailySchedule: formData.dailySchedule,
            shirtImage: shirtImage,
            shirtImageFile: shirtImageFile,
            camp_id: campData.camp_id,
        };

        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b bg-white flex justify-between items-center">
                    <div>
                        <button onClick={onClose} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-1">
                            <ChevronRight className="rotate-180" size={18} />
                            <span className="text-sm font-medium">กลับ</span>
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900">แก้ไขข้อมูลค่าย</h2>
                        <p className="text-sm text-gray-500">อัปเดตรายละเอียดของค่าย</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="overflow-y-auto p-6 space-y-8">
                    {/* Basic Information Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#6b857a] rounded-full"></span>
                            ข้อมูลทั่วไป
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อค่าย</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    placeholder="เช่น MSEC Camp 2025"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] outline-none"
                                />
                            </div>

                            {/* Grade Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เลือกระดับชั้น
                                    <Select
                                        label="ระดับชั้น"
                                        placeholder="-- เลือกระดับชั้น --"
                                        selectedKeys={selectedGrade ? [selectedGrade] : []}
                                        onSelectionChange={(keys) => {
                                            const grade = Array.from(keys)[0] as string;
                                            setSelectedGrade(grade);
                                            handleChange("gradeLevel", grade);
                                        }}
                                        isRequired
                                        classNames={{
                                            trigger: "border-gray-300",
                                        }}
                                    >
                                        {grades.map((grade) => (
                                            <SelectItem key={grade} value={grade}>
                                                {grade.replace("Level_", "ม.")}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </label>
                            </div>

                            {/* Classroom Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เลือกห้องเรียน
                                    {selectedClassroomIds.length > 0 && (
                                        <span className="ml-2 text-xs text-[#6b857a]">
                                            (เลือกแล้ว {selectedClassroomIds.length} ห้อง)
                                        </span>
                                    )}
                                </label>
                                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg max-h-40 overflow-y-auto bg-white">
                                    {!selectedGrade ? (
                                        <p className="text-sm text-gray-400">กรุณาเลือกระดับชั้นก่อน</p>
                                    ) : filteredClassrooms.length === 0 ? (
                                        <p className="text-sm text-gray-400">ไม่มีห้องเรียนสำหรับระดับชั้นนี้</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredClassrooms.map((classroom) => (
                                                <label
                                                    key={classroom.classroom_id}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedClassroomIds.includes(classroom.classroom_id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedClassroomIds([...selectedClassroomIds, classroom.classroom_id]);
                                                            } else {
                                                                setSelectedClassroomIds(
                                                                    selectedClassroomIds.filter(id => id !== classroom.classroom_id)
                                                                );
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-[#6b857a] focus:ring-[#6b857a]"
                                                    />
                                                    <span className="text-sm">
                                                        {classroom.type_classroom} - {classroom.teacher.firstname} {classroom.teacher.lastname}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">สถานที่</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleChange("location", e.target.value)}
                                    placeholder="อาคารวิทยวิภาส คณะวิทยาศาสตร์ มข."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="รายละเอียดของค่าย..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Dates Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-[#6b857a] rounded-full"></span>
                            ช่วงเวลาและกำหนดการ
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Registration Period */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    ช่วงเวลารับสมัคร
                                </label>
                                <DateRangePicker
                                    className="w-full h-[56px]"
                                    aria-label="Registration Period"
                                    value={
                                        formData.registrationStartDate && formData.registrationEndDate
                                            ? {
                                                start: parseDate(formData.registrationStartDate),
                                                end: parseDate(formData.registrationEndDate),
                                            }
                                            : null
                                    }
                                    isInvalid={!!dateErrors.registration}
                                    errorMessage={dateErrors.registration}
                                    onChange={(range) => {
                                        if (!range) return;
                                        handleChange("registrationStartDate", dateValueToString(range.start));
                                        handleChange("registrationEndDate", dateValueToString(range.end));
                                    }}
                                />
                            </div>

                            {/* Camp Period */}
                            <div>
                                <label className="block text-xs font-bold text-[#6b857a] uppercase mb-1">
                                    วันจัดค่าย
                                </label>
                                <DateRangePicker
                                    className="w-full h-[56px]"
                                    aria-label="Camp Period"
                                    value={
                                        formData.campStartDate && formData.campEndDate
                                            ? {
                                                start: parseDate(formData.campStartDate),
                                                end: parseDate(formData.campEndDate),
                                            }
                                            : null
                                    }
                                    isInvalid={!!dateErrors.camp}
                                    errorMessage={dateErrors.camp}
                                    onChange={(range) => {
                                        if (!range) return;
                                        handleChange("campStartDate", dateValueToString(range.start));
                                        handleChange("campEndDate", dateValueToString(range.end));
                                    }}
                                />
                            </div>
                        </div>

                        {/* Daily Schedule Section */}
                        <div className="border-t pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">กําหนดการรายวัน</h3>
                                    <p className="text-sm text-gray-500">จำนวนวันจะถูกสร้างอัตโนมัติตามช่วงเวลาค่าย</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {formData.dailySchedule.map((day, dayIndex) => (
                                    <div key={dayIndex} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                        {/* Day Header */}
                                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-semibold text-gray-700 border border-gray-200">
                                                    {day.day}
                                                </div>
                                                <span className="font-medium text-gray-700">
                                                    Day {day.day}
                                                    {formData.campStartDate && (
                                                        <span className="ml-2 text-gray-500 font-normal">
                                                            : {formatDateWithOffset(formData.campStartDate, dayIndex)}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => addTimeSlot(dayIndex)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="text-base">+</span>
                                                    เพิ่มช่วงเวลา
                                                </button>
                                                {/* Hide delete day button for auto-managed schedule */}
                                            </div>
                                        </div>

                                        {/* Time Slots */}
                                        <div className="divide-y divide-gray-100">
                                            {day.timeSlots.map((slot, slotIndex) => (
                                                <div key={slotIndex} className="p-4 hover:bg-gray-50 transition-colors">
                                                    <div className="grid grid-cols-12 gap-3 items-center">
                                                        {/* Start Time */}
                                                        <div className="col-span-3">
                                                            <label className="block text-xs text-gray-500 mb-1">เวลาเริ่ม</label>
                                                            <input
                                                                type="time"
                                                                value={slot.startTime}
                                                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, "startTime", e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b857a] focus:border-transparent"
                                                            />
                                                        </div>

                                                        {/* End Time */}
                                                        <div className="col-span-3">
                                                            <label className="block text-xs text-gray-500 mb-1">เวลาสิ้นสุด</label>
                                                            <input
                                                                type="time"
                                                                value={slot.endTime}
                                                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, "endTime", e.target.value)}
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b857a] focus:border-transparent"
                                                            />
                                                        </div>

                                                        {/* Activity */}
                                                        <div className="col-span-5">
                                                            <label className="block text-xs text-gray-500 mb-1">กิจกรรม</label>
                                                            <input
                                                                type="text"
                                                                value={slot.activity}
                                                                onChange={(e) => updateTimeSlot(dayIndex, slotIndex, "activity", e.target.value)}
                                                                placeholder="ชื่อกิจกรรม"
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b857a] focus:border-transparent"
                                                            />
                                                        </div>

                                                        {/* Delete Button */}
                                                        <div className="col-span-1 flex justify-end">
                                                            {day.timeSlots.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mt-5"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Shirt Section */}
                    <section className="pt-6 border-t space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <ImageOff size={20} className="text-[#6b857a]" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">การจองเสื้อ</h4>
                                    <p className="text-xs text-gray-500">เปิดให้มีการเลือกขนาดเสื้อระหว่างการสมัคร</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={formData.hasShirt} onChange={(e) => handleChange("hasShirt", e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6b857a]"></div>
                            </label>
                        </div>

                        {formData.hasShirt && (
                            <div className="space-y-4 p-4 border rounded-xl">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        ช่วงเวลาจองเสื้อ
                                    </label>

                                    <DateRangePicker
                                        className="w-full h-[56px]"
                                        aria-label="Shirt Booking Period"
                                        value={
                                            formData.shirtStartDate && formData.shirtEndDate
                                                ? {
                                                    start: parseDate(formData.shirtStartDate),
                                                    end: parseDate(formData.shirtEndDate),
                                                }
                                                : null
                                        }
                                        isInvalid={!!dateErrors.shirt}
                                        errorMessage={dateErrors.shirt}
                                        onChange={(range) => {
                                            if (!range) return;
                                            handleChange("shirtStartDate", dateValueToString(range.start));
                                            handleChange("shirtEndDate", dateValueToString(range.end));
                                        }}
                                    />
                                </div>

                                {/* Shirt Image Upload */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">
                                        ตัวอย่างเสื้อ
                                    </label>
                                    <p className="text-xs text-gray-400 mb-3">
                                        อัปโหลดรูปภาพตัวอย่างเสื้อค่ายสำหรับให้นักเรียนดู
                                    </p>

                                    {!shirtImage ? (
                                        <label className="block w-full cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleShirtImageChange}
                                                className="hidden"
                                            />
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#6b857a] hover:bg-gray-50 transition-all">
                                                <ImageOff size={32} className="mx-auto text-gray-400 mb-2" />
                                                <p className="text-sm text-gray-500 font-medium">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG ขนาดไม่เกิน 10MB</p>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                                            <img
                                                src={shirtImage}
                                                alt="Shirt preview"
                                                className="w-full h-64 object-contain bg-gray-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={removeShirtImage}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full py-4 bg-[#6b857a] text-white rounded-xl hover:bg-[#5a7268] transition-all font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <FileText size={20} />
                                <span>บันทึกการแก้ไข</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}