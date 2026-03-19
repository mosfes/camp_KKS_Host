"use client";
import { useStatusModal } from "@/components/StatusModalProvider";
import {
    Card,
    CardBody,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Search, RotateCcw, AlertTriangle, Trash, Archive, ArrowLeft } from 'lucide-react';
import adminService from "@/app/service/adminService";

const TrashManager = ({ type, onBack }) => {
    const { showError, showSuccess, showConfirm } = useStatusModal();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const [classroomTypes, setClassroomTypes] = useState([]);

    const gradeOptions = [
        { key: "Level_1", label: "ม.1" },
        { key: "Level_2", label: "ม.2" },
        { key: "Level_3", label: "ม.3" },
        { key: "Level_4", label: "ม.4" },
        { key: "Level_5", label: "ม.5" },
        { key: "Level_6", label: "ม.6" },
        { key: "Graduated", label: "จบการศึกษา" }
    ];

    const getLatestClassroomObj = (stu) => {
        if (stu.classroom_students && stu.classroom_students.length > 0) {
            const sorted = [...stu.classroom_students].sort((a, b) => {
                const yearA = a.classroom?.academic_years?.year || 0;
                const yearB = b.classroom?.academic_years?.year || 0;
                return yearB - yearA;
            });
            return sorted[0].classroom;
        }
        return null;
    };

    const getStudentClassroom = (stu) => {
        const cls = getLatestClassroomObj(stu);
        if (cls) {
            const gradeLabel = gradeOptions.find(g => g.key === cls.grade)?.label || cls.grade;
            const foundType = classroomTypes.find(t => t.classroom_type_id.toString() === cls.type_classroom?.toString());
            const roomName = foundType ? foundType.name : cls.type_classroom;

            if (roomName) return `${gradeLabel} (${roomName})`;
            return `${gradeLabel}`;
        }
        return "-";
    };

    useEffect(() => {
        if (type === 'classroom' || type === 'student') {
            const fetchClassroomTypes = async () => {
                try {
                    const types = await adminService.getClassroomTypes();
                    setClassroomTypes(types);
                } catch (e) { console.error(e); }
            };
            fetchClassroomTypes();
        }
    }, [type]);

    const config = {
        student: {
            title: "นักเรียน",
            idField: "students_id",
            fetchFn: (p, s) => adminService.getDeletedStudents(p, 20, s),
            restoreFn: (id) => adminService.restoreStudent(id),
            deleteFn: (id) => adminService.permanentDeleteStudent(id),
            columns: ["รหัสนักเรียน", "ชื่อ-นามสกุล", "อีเมล", "ระดับชั้น/ห้อง", "เบอร์โทร", "ดำเนินการ"],
            renderRow: (item) => [
                item.students_id,
                `${item.firstname} ${item.lastname}`,
                item.email || "-",
                getStudentClassroom(item),
                item.tel || "-",
            ],
        },
        teacher: {
            title: "ครู",
            idField: "teachers_id",
            fetchFn: (p, s) => adminService.getDeletedTeachers(p, 20, s),
            restoreFn: (id) => adminService.restoreTeacher(id),
            deleteFn: (id) => adminService.permanentDeleteTeacher(id),
            columns: ["ชื่อ-นามสกุล", "อีเมล", "เบอร์โทร", "ตำแหน่ง", "ดำเนินการ"],
            renderRow: (item) => [
                `${item.firstname} ${item.lastname}`,
                item.email || "-",
                item.tel || "-",
                item.role === "ADMIN" ? "แอดมิน" : "ครู",
            ],
        },
        classroom: {
            title: "ห้องเรียน",
            idField: "classroom_id",
            fetchFn: (p) => adminService.getDeletedClassrooms(p, 20),
            restoreFn: (id) => adminService.restoreClassroom(id),
            deleteFn: (id) => adminService.permanentDeleteClassroom(id),
            columns: ["ระดับชั้น", "ประเภทห้อง", "ครูประจำชั้น", "ปีการศึกษา", "จำนวนนักเรียน", "ดำเนินการ"],
            renderRow: (item) => {
                const gradeMap = { "Level_1": "ม.1", "Level_2": "ม.2", "Level_3": "ม.3", "Level_4": "ม.4", "Level_5": "ม.5", "Level_6": "ม.6" };
                const foundType = classroomTypes.find(t => t.classroom_type_id.toString() === item.type_classroom?.toString());
                const typeName = foundType ? foundType.name : item.type_classroom;

                return [
                    gradeMap[item.grade] || item.grade || "-",
                    typeName || "-",
                    <div className="flex flex-col">
                        <span>{item.teacher?.firstname} {item.teacher?.lastname}</span>
                        {item.classroom_teacher && item.classroom_teacher.length > 0 && (
                            <span className="text-sm text-gray-500">
                                {item.classroom_teacher[0].teacher?.firstname} {item.classroom_teacher[0].teacher?.lastname}
                            </span>
                        )}
                    </div>,
                    item.academic_years ? (parseInt(item.academic_years.year) + 543).toString() : "-",
                    `${item._count?.classroom_students || 0} คน`
                ];
            },
        },
    };

    const cfg = config[type];

    useEffect(() => {
        setPage(1);
        fetchItems(1);
    }, [searchTerm]);

    const fetchItems = async (pageNum = 1) => {
        setIsLoading(true);
        try {
            const result = await cfg.fetchFn(pageNum, searchTerm);
            const newData = result.data || [];
            if (pageNum === 1) {
                setItems(newData);
            } else {
                setItems(prev => [...prev, ...newData]);
            }
            if (result.pagination) {
                setHasMore(pageNum < result.pagination.totalPages);
                setTotal(result.pagination.total);
            } else {
                setHasMore(false);
                setTotal(newData.length);
            }
        } catch (e) {
            console.error(e);
            showError("เกิดข้อผิดพลาด", "ไม่สามารถดึงข้อมูลรายการที่ลบได้");
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayName = (item) => {
        if (type === 'student') {
            const cls = getStudentClassroom(item);
            return `${item.firstname} ${item.lastname} ${cls !== "-" ? `(${cls})` : ""}`;
        }
        if (type === 'teacher') {
            const role = item.role === "ADMIN" ? "แอดมิน" : "ครู";
            return `${item.firstname} ${item.lastname} (บทบาท: ${role})`;
        }
        if (type === 'classroom') {
            const gradeMap = { "Level_1": "ม.1", "Level_2": "ม.2", "Level_3": "ม.3", "Level_4": "ม.4", "Level_5": "ม.5", "Level_6": "ม.6" };
            const foundType = classroomTypes.find(t => t.classroom_type_id.toString() === item.type_classroom?.toString());
            const typeName = foundType ? foundType.name : item.type_classroom;
            const gradeLabel = gradeMap[item.grade] || item.grade || "-";
            const yearLabel = item.academic_years ? (parseInt(item.academic_years.year) + 543).toString() : "-";
            return `${gradeLabel} - ${typeName} (ปีการศึกษา ${yearLabel})`;
        }
        return `ID: ${item[cfg.idField]}`;
    };

    const handleRestore = (item) => {
        const id = item[cfg.idField];
        const name = getDisplayName(item);
        showConfirm("กู้คืน", `กู้คืน${cfg.title} "${name}" ใช่หรือไม่?`, async () => {
            try {
                await cfg.restoreFn(id);
                showSuccess("สำเร็จ", `กู้คืน${cfg.title}สำเร็จ!`);
                setPage(1);
                fetchItems(1);
            } catch (e) {
                showError("เกิดข้อผิดพลาด", e.message);
            }
        }, "กู้คืน");
    };

    const handlePermanentDelete = (item) => {
        const id = item[cfg.idField];
        const name = getDisplayName(item);
        showConfirm("⚠️ ลบถาวร", `ลบ${cfg.title} "${name}" อย่างถาวร?\n\nข้อมูลทั้งหมดจะหายไปและไม่สามารถกู้คืนได้`, async () => {
            try {
                await cfg.deleteFn(id);
                showSuccess("สำเร็จ", `ลบ${cfg.title}ถาวรสำเร็จ!`);
                setPage(1);
                fetchItems(1);
            } catch (e) {
                showError("เกิดข้อผิดพลาด", e.message);
            }
        }, "ลบถาวร");
    };

    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-rose-100 shadow-md rounded-xl bg-white" radius="none">
                <CardBody className="p-0 sm:p-6 overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 sm:p-0 gap-4">
                        <div>
                            <h3 className="text-gray-800 font-semibold text-lg flex items-center gap-2">
                                <Archive size={20} className="text-red-500" />
                                <span>รายการที่ลบ{cfg.title} ({total})</span>
                            </h3>
                            <p className="text-sm text-gray-400 mt-0.5 whitespace-nowrap">สามารถกู้คืนหรือลบข้อมูลได้</p>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {type !== "classroom" && (
                                <Input
                                    aria-label="Search"
                                    placeholder="ค้นหา..."
                                    size="sm"
                                    isClearable
                                    startContent={<Search size={14} className="text-gray-400" />}
                                    value={searchTerm}
                                    onValueChange={(val) => setSearchTerm(val)}
                                    onClear={() => setSearchTerm("")}
                                    className="w-[150px] sm:w-[250px] md:w-[300px]"
                                    classNames={{ inputWrapper: "bg-white border-gray-200" }}
                                />
                            )}
                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full px-4"
                                onPress={onBack}
                            >
                                <ArrowLeft size={16} className="flex-shrink-0" />
                                <span className="ml-1 font-medium hidden sm:inline">กลับหน้าหลัก</span>
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <Table
                            aria-label="Trash Table"
                            shadow="none"
                            isHeaderSticky
                            classNames={{
                                wrapper: "border border-rose-100 rounded-xl p-0 overflow-hidden min-w-[800px] md:min-w-full bg-white",
                                th: "bg-rose-50/50 border-b border-rose-100 text-rose-800 font-semibold py-4",
                                td: "py-4 border-b border-rose-50/50",
                            }}
                        >
                            <TableHeader>
                                {cfg.columns.map((col, i) => (
                                    <TableColumn key={i}>{col}</TableColumn>
                                ))}
                            </TableHeader>
                            <TableBody
                                emptyContent={`ไม่มี${cfg.title}ในรายการที่ลบ`}
                                isLoading={isLoading}
                                loadingContent={
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-red-400 text-sm">กำลังโหลด...</p>
                                    </div>
                                }
                            >
                                {items.map((item) => (
                                    <TableRow key={item[cfg.idField]} className="hover:bg-rose-50/30 transition-colors">
                                        {cfg.renderRow(item).map((cell, i) => (
                                            <TableCell key={i}>
                                                <div className="text-gray-700">{cell}</div>
                                            </TableCell>
                                        ))}
                                        <TableCell width={220}>
                                            <div className="flex items-center gap-2 whitespace-nowrap">
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full font-medium transition-all"
                                                    onPress={() => handleRestore(item)}
                                                >
                                                    <RotateCcw size={14} />
                                                    <span>กู้คืน</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-full font-medium transition-all"
                                                    onPress={() => handlePermanentDelete(item)}
                                                >
                                                    <AlertTriangle size={14} />
                                                    <span>ลบถาวร</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {hasMore && items.length > 0 && (
                            <div className="flex justify-center mt-6 w-full">
                                <Button
                                    variant="flat"
                                    className="bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-full px-8"
                                    onPress={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        fetchItems(nextPage);
                                    }}
                                    isLoading={isLoading && page > 1}
                                >
                                    แสดงเพิ่มเติม
                                </Button>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default TrashManager;
