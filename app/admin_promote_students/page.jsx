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
    Spinner
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

    const handlePlanChangeTeacher = (index, teacherId) => {
        const newPlan = [...previewPlan];
        newPlan[index].targetTeacherId = teacherId;
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
            if ((item.isNewRoom || !item.targetRoomId) && !item.targetTeacherId && item.students.some(s => s.selected)) {
                showError("ข้อมูลไม่ครบถ้วน", `กรุณาเลือกครูประจำชั้นสำหรับห้อง ${getGradeLabel(item.targetGrade)} (${item.targetType})`);
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${promoteStep === 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}>1</div>
                            <span className={promoteStep === 1 ? "font-semibold text-gray-800" : "text-gray-500"}>เลือกปีการศึกษา</span>
                            <div className="w-12 h-1 bg-gray-200"></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${promoteStep === 2 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>2</div>
                            <span className={promoteStep === 2 ? "font-semibold text-gray-800" : "text-gray-500"}>ตรวจสอบและยืนยัน</span>
                        </div>
                    </div>

                    {promoteStep === 1 && (
                        <div className="max-w-xl mx-auto flex flex-col gap-6 py-4">
                            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
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
                                    color="primary"
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
                                    className="text-gray-500"
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
                                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200 font-medium">
                                                            สร้างห้องใหม่
                                                        </span>
                                                    )}
                                                </div>
                                            }
                                            subtitle={
                                                <span className="text-xs text-gray-500 mt-1 block">
                                                    เลือกนักเรียน {item.students.filter(s => s.selected).length} จาก {item.students.length} คน
                                                </span>
                                            }
                                        >
                                            <div className="p-4 bg-white border-t border-gray-100 space-y-4">
                                                {/* เลือกครู */}
                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                        ครูประจำชั้นปีใหม่ ({getGradeLabel(item.targetGrade)}) <span className="text-red-500">*</span>
                                                    </label>
                                                    <Select
                                                        size="sm"
                                                        placeholder="เลือกครูประจำชั้น"
                                                        variant="bordered"
                                                        className="max-w-md bg-white"
                                                        selectedKeys={item.targetTeacherId ? [item.targetTeacherId.toString()] : []}
                                                        onSelectionChange={(keys) => handlePlanChangeTeacher(idx, Array.from(keys)[0])}
                                                        classNames={{ trigger: "bg-white" }}
                                                    >
                                                        {allTeachers.map((t) => (
                                                            <SelectItem key={t.teachers_id.toString()} textValue={`${t.firstname} ${t.lastname}`}>
                                                                {t.firstname} {t.lastname}
                                                            </SelectItem>
                                                        ))}
                                                    </Select>
                                                    {item.isNewRoom && !item.targetTeacherId && (
                                                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                            ⚠️ จำเป็นต้องเลือกครูเพื่อสร้างห้องใหม่
                                                        </p>
                                                    )}
                                                </div>

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
                                    onPress={() => router.back()}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    color="success"
                                    className="text-white"
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
