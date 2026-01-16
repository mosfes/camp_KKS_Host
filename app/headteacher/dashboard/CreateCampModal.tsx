"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, ImageOff, X, Plus, Trash2 } from "lucide-react";
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
    templateName: string;
    saveAsTemplate: boolean;
    dailySchedule: DaySchedule[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    projectType: string | null;
    templateData?: any;
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

import { useStatusModal } from "@/components/StatusModalProvider";

// ... inside component
export default function CreateCampModal({
    isOpen,
    onClose,
    onSubmit,
    projectType,
    templateData,
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
        templateName: "",
        saveAsTemplate: false,
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

    useEffect(() => {
        async function fetchClassrooms() {
            try {
                const res = await fetch("/api/classrooms");
                const data = await res.json();
                console.log("Fetched classrooms:", data);
                setClassrooms(data);
            } catch (err) {
                console.error("Failed to fetch classrooms:", err);
            }
        }
        if (isOpen) {
            fetchClassrooms();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedGrade) {
            const filtered = classrooms.filter(c => c.grade === selectedGrade);
            console.log("Filtered classrooms for grade", selectedGrade, ":", filtered);
            setFilteredClassrooms(filtered);
        } else {
            setFilteredClassrooms([]);
        }
        setSelectedClassroomIds([]);
    }, [selectedGrade, classrooms]);

    // โหลดข้อมูลจาก template เมื่อเปิด modal
    useEffect(() => {
        if (isOpen && projectType === "continuing" && templateData) {
            console.log("Loading template data:", templateData);

            // Pull data from the nested 'camp' object within templateData
            const campSource = templateData.camp || {};

            // แปลง dailySchedule จาก template (ถ้ามี) - currently API might not return this, need to check if added to select in route.js
            // If the template API doesn't return daily_schedule, we default to empty.
            // Note: The GET /api/templates/[id] route viewed earlier only selects basic fields. 
            // It needs to be updated to select 'camp_daily_schedule' too if we want that.
            // For now, let's map what we have being careful with optionals.
            const dailySchedule = campSource.camp_daily_schedule && Array.isArray(campSource.camp_daily_schedule)
                ? campSource.camp_daily_schedule.map((day: any) => ({
                    day: day.day,
                    timeSlots: day.time_slots || []
                }))
                : [{ day: 1, timeSlots: [{ startTime: "", endTime: "", activity: "" }] }];

            setFormData({
                name: campSource.name || "",
                location: campSource.location || "",
                gradeLevel: "", // Will be set below from classrooms
                classroomType: "", // Not directly on camp, usually inferred
                registrationStartDate: "",
                registrationEndDate: "",
                campStartDate: "",
                campEndDate: "",
                description: campSource.description || "",
                hasShirt: campSource.has_shirt || false,
                shirtStartDate: "",
                shirtEndDate: "",
                templateName: "",
                saveAsTemplate: false,
                dailySchedule: dailySchedule,
            });

            // ถ้ามี grade level ให้ตั้งค่าจาก camp_classroom
            if (campSource.camp_classroom && campSource.camp_classroom.length > 0) {
                // Assuming all classrooms in a camp are same grade
                const grade = campSource.camp_classroom[0].classroom?.grade;
                if (grade) {
                    setSelectedGrade(grade);
                }
            }

            // ถ้ามีรูปเสื้อ (Note: API doesn't seem to select shirt_image_url yet, but if it did)
            if (campSource.shirt_image_url) {
                setShirtImage(campSource.shirt_image_url);
            }
        } else if (isOpen && projectType === "new") {
            // Reset form เมื่อเป็น new project
            setFormData({
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
                templateName: "",
                saveAsTemplate: false,
                dailySchedule: [
                    {
                        day: 1,
                        timeSlots: [{ startTime: "", endTime: "", activity: "" }],
                    },
                ],
            });
            setSelectedGrade("");
            setShirtImage(null);
            setShirtImageFile(null);
            setSelectedClassroomIds([]);
        }
    }, [isOpen, projectType, templateData]);

    // โหลด classroom IDs จาก template หลังจาก classrooms ถูก fetch แล้ว
    useEffect(() => {
        if (isOpen && projectType === "continuing" && templateData && classrooms.length > 0) {
            console.log("Loading classroom IDs from template:", templateData);
            const campSource = templateData.camp || {};

            // ถ้า template มี camp.camp_classrooms ให้ดึง classroom_id จากนั้น
            if (campSource.camp_classroom && Array.isArray(campSource.camp_classroom)) {
                const classroomIds = campSource.camp_classroom
                    .map((cc: any) => cc.classroom_classroom_id || cc.classroom_id || (cc.classroom && cc.classroom.classroom_id)) // Handle various structures
                    .filter((id: number) => classrooms.some(c => c.classroom_id === id));
                console.log("Setting classroom IDs from camp_classrooms:", classroomIds);
                setSelectedClassroomIds(classroomIds);
            }
        }
    }, [isOpen, projectType, templateData, classrooms]);

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

    // Debug logs
    console.log("CreateCampModal render:");
    console.log("isOpen:", isOpen);
    console.log("projectType:", projectType);

    if (!isOpen) {
        console.log("Modal not shown: isOpen is false");
        return null;
    }

    if (projectType !== "new" && projectType !== "continuing") {
        console.log("Modal not shown: projectType is invalid:", projectType);
        return null;
    }

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
        newSchedule[dayIndex].timeSlots[slotIndex][field] = value;
        setFormData({ ...formData, dailySchedule: newSchedule });
    };

    const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
        const newSchedule = [...formData.dailySchedule];
        newSchedule[dayIndex].timeSlots = newSchedule[dayIndex].timeSlots.filter((_, i) => i !== slotIndex);
        setFormData({ ...formData, dailySchedule: newSchedule });
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
        // ...


        const payload = {
            ...formData,
            dailySchedule: formData.dailySchedule.map(day => ({
                ...day,
                timeSlots: day.timeSlots.map(slot => ({
                    ...slot,
                    startTime: slot.startTime.replace(':', '.'),
                    endTime: slot.endTime.replace(':', '.')
                }))
            })),
            classroom_ids: selectedClassroomIds,
            gradeLevel: selectedGrade,
            shirtImage: shirtImage,
            shirtImageFile: shirtImageFile,
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
                            <span className="text-sm font-medium">กลับไปยังหน้าหลัก</span>
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {projectType === "continuing" ? "สร้างค่ายจาก Template" : "รายละเอียดค่าย"}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {projectType === "continuing"
                                ? "ตรวจสอบและแก้ไขข้อมูลจาก Template ตามต้องการ"
                                : "กรอกข้อมูลค่ายเพื่อเริ่มต้น"}
                        </p>
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
                                            <SelectItem key={grade}>
                                                {grade.replace("Level_", "ม.")}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </label>
                            </div>

                            {/* Classroom Selection (Multiple) */}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">รายละเอียด</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="ค่ายเกี่ยวกับการประยุกต์ใช้ STEM ในชีวิตประจำวัน"
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
                        {/* Date Ranges */}
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
                                                {/* Remove manual delete day button since it's auto-generated now, or keep it but it might conflict with auto-gen logic? 
                                                User requirement: "Auto". Usually implies manual add/remove is disabled or overridden.
                                                However, user might want to add extra days manually? 
                                                "ถ้าวันมันไม่ถูกต้องอยากให้แจ้งทันทีไม่ต้องกดซับมิทก่อน" -> This was previous req.
                                                "ตรง Daily Schedule อยากให้จำนวนวันขึ้นมาตามวันที่ที่เลือก" -> This implies strict sync.
                                                Let's keep the manual controls for flexibility but primarily rely on sync. 
                                                Actually, strict sync implies we should probably remove "Add Day" and "Delete Day" buttons to avoid confusion?
                                                Let's hide them for cleaner UI if we enforce sync.
                                            */}
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

                    {/* Shirt & Template Section */}
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
                                        Shirt Sample Image
                                    </label>
                                    <p className="text-xs text-gray-400 mb-3">
                                        Upload an image showing the camp shirt design for student reference
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
                                                <p className="text-sm text-gray-500 font-medium">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 10MB</p>
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
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs">
                                                {shirtImageFile?.name || "Template Image"}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={formData.saveAsTemplate}
                                    onChange={(e) => handleChange("saveAsTemplate", e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#6b857a] focus:ring-[#6b857a]"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-black">Save this configuration as a template</span>
                            </label>
                            {formData.saveAsTemplate && (
                                <input
                                    type="text"
                                    placeholder="Template Name (e.g., Annual Science Camp)"
                                    value={formData.templateName}
                                    onChange={(e) => handleChange("templateName", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] outline-none text-sm"
                                />
                            )}
                        </div>
                    </section>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 border-t bg-gray-50">
                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-[#6b857a] text-white rounded-xl hover:bg-[#5a7268] transition-all font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                        Create Camp & Continue
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}