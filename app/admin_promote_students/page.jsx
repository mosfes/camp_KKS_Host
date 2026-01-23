"use client";
import { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    Button,
    Select,
    SelectItem,
    Accordion,
    AccordionItem,
    Checkbox,
    Spinner,
    Chip
} from "@heroui/react";
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import studentService from "@/app/service/adminService";
import { useRouter } from "next/navigation";
import { useStatusModal, StatusModalProvider } from "@/components/StatusModalProvider";

const PromoteStudentsContent = () => {
    const router = useRouter();
    const { showSuccess, showError, showConfirm } = useStatusModal();

    // --- State เลื่อนชั้น ---
    const [promoteStep, setPromoteStep] = useState(1);
    const [promoteData, setPromoteData] = useState({ fromYear: "", toYear: "" });
    const [previewPlan, setPreviewPlan] = useState([]);
    const [isLoadingPromote, setIsLoadingPromote] = useState(false);
    const [years, setYears] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);

    useEffect(() => {
        fetchYears();
        fetchTeachers();
    }, []);

    const fetchYears = async () => {
        try {
            const data = await studentService.getAcademicYears();
            setYears(data);
        } catch (error) {
            console.error("Failed to fetch years:", error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const data = await studentService.getTeachers();
            setAllTeachers(data);
        } catch (error) {
            console.error("Failed to fetch teachers:", error);
        }
    };

    const getGradeLabel = (grade) => {
        const map = { "Level_1": "ม.1", "Level_2": "ม.2", "Level_3": "ม.3", "Level_4": "ม.4", "Level_5": "ม.5", "Level_6": "ม.6", "Graduated": "จบการศึกษา" };
        return map[grade] || grade;
    };

    const handleGoToReview = async () => {
        if (!promoteData.fromYear || !promoteData.toYear) return showError("ข้อผิดพลาด", "กรุณาเลือกปีการศึกษา");
        if (promoteData.toYear !== "create_next" && promoteData.fromYear === promoteData.toYear) return showError("ข้อผิดพลาด", "ปีต้นทางและปลายทางต้องไม่เหมือนกัน");

        // Validate year order (only if not creating new)
        if (promoteData.toYear !== "create_next") {
            const fromYearObj = years.find(y => y.years_id.toString() === promoteData.fromYear);
            const toYearObj = years.find(y => y.years_id.toString() === promoteData.toYear);

            if (fromYearObj && toYearObj && fromYearObj.year >= toYearObj.year) {
                return showError("ข้อผิดพลาด", "ปีการศึกษาปลายทางต้องมากกว่าปีการศึกษาต้นทาง");
            }
        }

        setIsLoadingPromote(true);
        try {
            let targetYearId = promoteData.toYear;

            // Handle Create New Year
            if (promoteData.toYear === "create_next") {
                const fromYearObj = years.find(y => y.years_id.toString() === promoteData.fromYear);
                const nextYearAD = parseInt(fromYearObj.year) + 1;

                const newYear = await studentService.addAcademicYear(nextYearAD);

                // Refresh years and update target ID
                await fetchYears();
                targetYearId = newYear.years_id.toString();

                // Update state silently so UI reflects the new year after re-render (optional but good)
                setPromoteData(prev => ({ ...prev, toYear: targetYearId }));
            }

            const res = await fetch(`/api/students/promote?fromYearId=${promoteData.fromYear}&toYearId=${targetYearId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const planWithSelection = data.map(item => ({ ...item, selected: true }));
            setPreviewPlan(planWithSelection);
            setPromoteStep(2);
        } catch (error) {
            showError("เกิดข้อผิดพลาด", error.message);
        } finally {
            setIsLoadingPromote(false);
        }
    };

    const handleToggleClassroom = (index) => {
        const newPlan = [...previewPlan];
        newPlan[index].selected = !newPlan[index].selected;
        setPreviewPlan(newPlan);
    };

    const handlePlanChangeTeacher = (index, teacherIds) => {
        const newPlan = [...previewPlan];
        newPlan[index].targetTeacherIds = teacherIds;
        setPreviewPlan(newPlan);
    };

    const handleToggleStudent = (planIndex, studentIndex) => {
        const newPlan = [...previewPlan];
        newPlan[planIndex].students[studentIndex].selected = !newPlan[planIndex].students[studentIndex].selected;
        setPreviewPlan(newPlan);
    };

    const handleConfirmPromote = async () => {
        const selectedClassrooms = previewPlan.filter(item => item.selected);

        if (selectedClassrooms.length === 0) {
            return showError("ข้อผิดพลาด", "กรุณาเลือกห้องเรียนอย่างน้อย 1 ห้อง");
        }

        for (const item of selectedClassrooms) {
            // ถ้าเป็นห้องใหม่ (หรือห้องเดิมที่ไม่มีครู) และมีนักเรียนถูกเลือก แต่ไม่ได้เลือกครู
            const hasTeachers = item.targetTeacherIds && item.targetTeacherIds.length > 0;
            // Skip validation if Graduated
            if (item.targetGrade !== 'Graduated' && (item.isNewRoom || !item.targetRoomId) && !hasTeachers && item.students.some(s => s.selected)) {
                showError("ข้อมูลไม่ครบถ้วน", `กรุณาเลือกครูประจำชั้นอย่างน้อย 1 ท่าน สำหรับห้อง ${getGradeLabel(item.targetGrade)} (${item.targetType})`);
                return;
            }
        }

        showConfirm(
            "ยืนยันการเลื่อนชั้นเรียน",
            `คุณต้องการเลื่อนชั้นเรียนจำนวน ${selectedClassrooms.length} ห้อง ใช่หรือไม่?`,
            async () => {
                setIsLoadingPromote(true);
                try {
                    const res = await fetch('/api/students/promote', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            toYearId: promoteData.toYear,
                            plan: selectedClassrooms
                        })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    showSuccess("สำเร็จ", data.message);
                    router.push("/admin_add_user");
                } catch (error) {
                    showError("เกิดข้อผิดพลาด", error.message);
                } finally {
                    setIsLoadingPromote(false);
                }
            },
            "ยืนยัน"
        );
    };

    return (
        <div className="w-full h-full p-4 md:p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    isIconOnly
                    variant="light"
                    className="rounded-full"
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">จัดการการเลื่อนชั้นเรียน</h1>
                    <p className="text-gray-500 text-sm">เลื่อนระดับชั้นนักเรียนไปยังปีการศึกษาใหม่</p>
                </div>
            </div>

            <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white">
                <CardBody className="p-6">
                    <div className="flex justify-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${promoteStep === 1 ? "bg-sage text-white" : "bg-green-50 text-sage"}`}>1</div>
                            <span className={promoteStep === 1 ? "font-semibold text-gray-800" : "text-gray-500"}>เลือกปีการศึกษา</span>
                            <div className="w-12 h-1 bg-gray-200"></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${promoteStep === 2 ? "bg-sage text-white" : "bg-gray-100 text-gray-400"}`}>2</div>
                            <span className={promoteStep === 2 ? "font-semibold text-gray-800" : "text-gray-500"}>ตรวจสอบและยืนยัน</span>
                        </div>
                    </div>

                    {promoteStep === 1 && (
                        <div className="max-w-xl mx-auto flex flex-col gap-6 py-4">
                            <div className="p-4 bg-green-50 text-sage-dark rounded-lg text-sm border border-green-100">
                                ระบบจะค้นหานักเรียนในปีการศึกษาต้นทาง และจับคู่กับห้องเรียนในปีการศึกษาปลายทางโดยอัตโนมัติ (อิงตามระดับชั้นและประเภทห้องเรียนเดิม)
                            </div>

                            <div className="space-y-4">
                                <Select
                                    label="จากปีการศึกษา (จบแล้ว)"
                                    placeholder="เลือกปีต้นทาง"
                                    variant="bordered"
                                    selectedKeys={promoteData.fromYear ? [promoteData.fromYear.toString()] : []}
                                    onChange={(e) => {
                                        setPromoteData({ ...promoteData, fromYear: e.target.value, toYear: "" }); // Reset toYear when fromYear changes
                                    }}
                                    classNames={{ trigger: "bg-white" }}
                                >
                                    {years.map((y) => (
                                        <SelectItem key={y.years_id.toString()} value={y.years_id.toString()} textValue={`${parseInt(y.year) + 543}`}>
                                            {parseInt(y.year) + 543}
                                        </SelectItem>
                                    ))}
                                </Select>

                                <Select
                                    label="ไปยังปีการศึกษา (ใหม่)"
                                    placeholder="เลือกปีปลายทาง"
                                    variant="bordered"
                                    selectedKeys={promoteData.toYear ? [promoteData.toYear.toString()] : []}
                                    onChange={(e) => setPromoteData({ ...promoteData, toYear: e.target.value })}
                                    classNames={{ trigger: "bg-white" }}
                                    isDisabled={!promoteData.fromYear}
                                >
                                    {(() => {
                                        if (!promoteData.fromYear) return [];

                                        const fromYearObj = years.find(fy => fy.years_id.toString() === promoteData.fromYear);
                                        if (!fromYearObj) return [];

                                        const nextYearAD = parseInt(fromYearObj.year) + 1;
                                        const nextYearExists = years.find(y => parseInt(y.year) === nextYearAD);

                                        // Filter existing future years
                                        const validYears = years.filter(y => y.year > fromYearObj.year);

                                        const items = validYears.map((y) => (
                                            <SelectItem key={y.years_id.toString()} value={y.years_id.toString()} textValue={`${parseInt(y.year) + 543}`}>
                                                {parseInt(y.year) + 543}
                                            </SelectItem>
                                        ));

                                        // If next year doesn't exist, provide option to create it
                                        if (!nextYearExists) {
                                            items.unshift(
                                                <SelectItem key="create_next" value="create_next" textValue={`สร้างปีการศึกษา ${nextYearAD + 543}`}>
                                                    + สร้างปีการศึกษา {nextYearAD + 543}
                                                </SelectItem>
                                            );
                                        }

                                        return items;
                                    })()}
                                </Select>
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button
                                    className="bg-sage text-white hover:bg-sage-dark shadow-sm rounded-full"
                                    onPress={handleGoToReview}
                                    isLoading={isLoadingPromote}
                                    endContent={!isLoadingPromote && <ArrowRight size={16} />}
                                >
                                    ถัดไป: ตรวจสอบข้อมูล
                                </Button>
                            </div>
                        </div>
                    )}

                    {promoteStep === 2 && (
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500">
                                    ตรวจสอบรายชื่อห้องเรียนที่จะถูกสร้าง/อัปเดต และนักเรียนที่จะย้าย
                                    <br /><span className="text-red-500">* หากห้องใดยังไม่มีในปีใหม่ ระบบจะสร้างให้อัตโนมัติ (จำเป็นต้องระบุครู)</span>
                                </p>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    className="text-gray-500 rounded-full"
                                    onPress={() => setPromoteStep(1)}
                                >
                                    กลับไปแก้ไขปีการศึกษา
                                </Button>
                            </div>

                            {isLoadingPromote ? (
                                <div className="flex justify-center py-10">
                                    <Spinner />
                                </div>
                            ) : (
                                <Accordion selectionMode="multiple" variant="splitted" className="px-0">
                                    {previewPlan.map((item, idx) => (
                                        <AccordionItem
                                            key={idx}
                                            classNames={{
                                                content: "p-0",
                                                trigger: "px-4 py-3"
                                            }}
                                            title={
                                                <div className="flex items-center gap-3">
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            color="success"
                                                            isSelected={item.selected}
                                                            onValueChange={() => handleToggleClassroom(idx)}
                                                        />
                                                    </div>
                                                    <span className={`font-semibold text-lg ${!item.selected && "text-gray-400"}`}>
                                                        {getGradeLabel(item.sourceGrade)} <ArrowRight size={16} className="inline text-gray-400" /> {getGradeLabel(item.targetGrade)}
                                                    </span>
                                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        ห้อง {item.targetType}
                                                    </span>
                                                    {item.isNewRoom && (
                                                        <span className="bg-sage/10 text-sage-dark text-xs px-2 py-0.5 rounded-full border border-sage/20 font-medium">
                                                            สร้างห้องใหม่
                                                        </span>
                                                    )}
                                                </div>
                                            }
                                            subtitle={
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {item.sourceTeacher && (
                                                        <span className="text-xs text-gray-500">
                                                            ครูเดิม: {item.sourceTeacher}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        เลือกนักเรียน {item.students.filter(s => s.selected).length} จาก {item.students.length} คน
                                                    </span>
                                                </div>
                                            }
                                        >
                                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">

                                                {item.targetGrade !== 'Graduated' ? (
                                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 gap-4">

                                                        <div>
                                                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                                ครูประจำชั้นคนที่ 1 <span className="text-red-500">*</span>
                                                            </label>
                                                            <Select
                                                                size="sm"
                                                                placeholder="เลือกครูประจำชั้นคนที่ 1"
                                                                variant="bordered"
                                                                className="w-full bg-white"
                                                                selectedKeys={item.targetTeacherIds && item.targetTeacherIds[0] ? new Set([item.targetTeacherIds[0].toString()]) : new Set()}
                                                                onSelectionChange={(keys) => {
                                                                    const primaryId = Array.from(keys)[0];
                                                                    const currentIds = item.targetTeacherIds || [];
                                                                    // Update index 0, keep index 1 if exists
                                                                    const newIds = [primaryId, currentIds[1]].filter(Boolean);
                                                                    handlePlanChangeTeacher(idx, newIds);
                                                                }}
                                                                classNames={{ trigger: "bg-white" }}
                                                            >
                                                                {allTeachers.map((t) => (
                                                                    <SelectItem key={t.teachers_id.toString()} textValue={`${t.firstname} ${t.lastname}`}>
                                                                        {t.firstname} {t.lastname}
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                        </div>

                                                        {/* เลือกครูคนที่ 2 */}
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                                ครูประจำชั้นคนที่ 2 (ถ้ามี)
                                                            </label>
                                                            <Select
                                                                size="sm"
                                                                placeholder="เลือกครูประจำชั้นคนที่ 2"
                                                                variant="bordered"
                                                                className="w-full bg-white"
                                                                selectedKeys={item.targetTeacherIds && item.targetTeacherIds[1] ? new Set([item.targetTeacherIds[1].toString()]) : new Set()}
                                                                onSelectionChange={(keys) => {
                                                                    const secondaryId = Array.from(keys)[0];
                                                                    const currentIds = item.targetTeacherIds || [];
                                                                    // Keep index 0, update index 1
                                                                    // If clearing secondary, we need to handle that. `keys` will be empty set -> secondaryId undefined.
                                                                    const primary = currentIds[0];
                                                                    const newIds = [primary, secondaryId].filter(id => id); // filter undefined/null
                                                                    handlePlanChangeTeacher(idx, newIds);
                                                                }}
                                                                classNames={{ trigger: "bg-white" }}
                                                            >
                                                                {allTeachers.map((t) => (
                                                                    <SelectItem key={t.teachers_id.toString()} textValue={`${t.firstname} ${t.lastname}`}>
                                                                        {t.firstname} {t.lastname}
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                        </div>
                                                        {item.isNewRoom && (!item.targetTeacherIds || item.targetTeacherIds.length === 0) && (
                                                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1 col-span-2">
                                                                ⚠️ จำเป็นต้องเลือกครูเพื่อสร้างห้องใหม่
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-center justify-center">
                                                        <span className="text-green-700 font-semibold flex items-center gap-2">
                                                            🎓 จบการศึกษา (Graduated)
                                                        </span>
                                                    </div>
                                                )}

                                                {/* รายชื่อนักเรียน */}
                                                <div className="border rounded-lg overflow-hidden">
                                                    <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                                                        <span className="text-sm font-semibold text-gray-600">รายชื่อนักเรียน</span>
                                                        <span className="text-xs text-gray-500">เลือก {item.students.filter(s => s.selected).length}/{item.students.length}</span>
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto p-2 bg-white">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {item.students.map((stu, sIdx) => (
                                                                <Checkbox
                                                                    key={stu.id}
                                                                    color="success"
                                                                    isSelected={stu.selected}
                                                                    onValueChange={() => handleToggleStudent(idx, sIdx)}
                                                                    classNames={{
                                                                        base: "border border-gray-200 rounded-md p-2 m-0 max-w-full hover:bg-gray-50 transition-colors cursor-pointer",
                                                                        label: "w-full cursor-pointer",
                                                                    }}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium text-gray-700">{stu.firstname} {stu.lastname}</span>
                                                                        <span className="text-xs text-gray-400">ID: {stu.code}</span>
                                                                    </div>
                                                                </Checkbox>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                <Button
                                    variant="light"
                                    color="danger"
                                    className="rounded-full"
                                    onPress={() => router.back()}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    className="bg-sage text-white hover:bg-sage-dark shadow-sm rounded-full"
                                    onPress={handleConfirmPromote}
                                    isLoading={isLoadingPromote}
                                    startContent={!isLoadingPromote && <Save size={18} />}
                                >
                                    ยืนยันการเลื่อนชั้น
                                </Button>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

export default function PromoteStudentsPage() {
    return (
        <StatusModalProvider>
            <PromoteStudentsContent />
        </StatusModalProvider>
    );
}
