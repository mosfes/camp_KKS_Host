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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    useDisclosure,
    Select,
    SelectItem,
    Accordion,
    AccordionItem,
    Checkbox,
    Tooltip
} from "@heroui/react";
import { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import { Trash2, SquarePen, ArrowUp, FileDown, Upload, HelpCircle } from 'lucide-react';
import studentService from "@/app/service/adminService";
import { useRouter } from "next/navigation";
import { PlusIcon } from "./Icons";

const StudentManager = () => {
    const { showSuccess, showError, showConfirm } = useStatusModal();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // --- State เลื่อนชั้น (Moved to /admin_promote_students) ---
    // const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    // const [promoteStep, setPromoteStep] = useState(1);
    // const [promoteData, setPromoteData] = useState({ fromYear: "", toYear: "" });
    // const [previewPlan, setPreviewPlan] = useState([]);
    // const [isLoadingPromote, setIsLoadingPromote] = useState(false);
    const [years, setYears] = useState([]);


    const [selectedYear, setSelectedYear] = useState("");
    const [selectedGrade, setSelectedGrade] = useState("all");
    const [selectedRoomType, setSelectedRoomType] = useState("all");

    const gradeOptions = [
        { key: "Level_1", label: "ม.1", value: 1 },
        { key: "Level_2", label: "ม.2", value: 2 },
        { key: "Level_3", label: "ม.3", value: 3 },
        { key: "Level_4", label: "ม.4", value: 4 },
        { key: "Level_5", label: "ม.5", value: 5 },
        { key: "Level_6", label: "ม.6", value: 6 },
    ];

    const uniqueRoomTypes = Array.from(new Set(classrooms.map(c => c.type_classroom).filter(Boolean)));

    uniqueRoomTypes.sort();

    const roomTypeOptions = uniqueRoomTypes.map(type => ({ key: type, label: type }));

    const [allTeachers, setAllTeachers] = useState([]);

    // Excel Import State
    const [importPreviewData, setImportPreviewData] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLoadingImport, setIsLoadingImport] = useState(false);
    const [selectedImportKeys, setSelectedImportKeys] = useState(new Set(["all"]));
    const fileInputRef = useRef(null);

    // --- State สำหรับ Modal เพิ่มนักเรียน ---
    const [addStudentYear, setAddStudentYear] = useState("");
    const [addStudentGrade, setAddStudentGrade] = useState("");

    const [formData, setFormData] = useState({
        students_id: "",
        firstname: "",
        lastname: "",
        email: "",
        tel: "",
        classroom_id: ""
    });


    useEffect(() => {
        const initData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchClassrooms(),
                fetchYears(),
                fetchTeachers()
            ]).then(([clsData, yearsData, tchData]) => {
                if (yearsData && yearsData.length > 0) {
                    const sortedYears = [...yearsData].sort((a, b) => b.year - a.year);
                    if (sortedYears.length > 0) {
                        setSelectedYear(sortedYears[0].years_id.toString());
                        setAddStudentYear(sortedYears[0].years_id.toString());
                    }
                }
            });
            setIsLoading(false);
        };
        initData();
    }, []);


    useEffect(() => {
        fetchStudents();
    }, [selectedYear]);

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const data = await studentService.getStudents(selectedYear);
            setStudents(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchClassrooms = async () => {
        const data = await studentService.getClassrooms();
        setClassrooms(data);
    };

    const fetchYears = async () => {
        const data = await studentService.getAcademicYears();
        setYears(data);
        return data;
    };

    const fetchTeachers = async () => {
        const data = await studentService.getTeachers();
        setAllTeachers(data);
    };

    const handleTelChange = (e) => {
        const { value } = e.target;
        if (/^(0\d*)?$/.test(value)) {
            handleChange(e);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTeacherSelect = (classroomId) => {
        setFormData({ ...formData, classroom_id: classroomId });
    };

    const selectedClassroomInfo = classrooms.find(c => c.classroom_id.toString() === formData.classroom_id.toString());

    const getGradeLabel = (grade) => {
        const map = { "Level_1": "ม.1", "Level_2": "ม.2", "Level_3": "ม.3", "Level_4": "ม.4", "Level_5": "ม.5", "Level_6": "ม.6", "Graduated": "จบการศึกษา" };
        return map[grade] || grade;
    };

    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ students_id: "", firstname: "", lastname: "", email: "", tel: "", classroom_id: "" });

        if (years.length > 0) {

            const sortedYears = [...years].sort((a, b) => b.year - a.year);
            setAddStudentYear(sortedYears[0].years_id.toString());
        }
        setAddStudentGrade("");

        onOpen();
    };

    const handleEdit = (student) => {
        setIsEditing(true);
        const currentClassroom = student.classroom_students && student.classroom_students.length > 0
            ? student.classroom_students.sort((a, b) => (b.classroom?.academic_years?.year || 0) - (a.classroom?.academic_years?.year || 0))[0].classroom
            : null;

        const currentClassroomId = currentClassroom ? currentClassroom.classroom_id.toString() : "";

        setFormData({
            students_id: student.students_id,
            firstname: student.firstname,
            lastname: student.lastname,
            email: student.email || "",
            tel: student.tel || "",
            classroom_id: currentClassroomId
        });

        if (currentClassroom) {
            setAddStudentYear(currentClassroom.academic_years_years_id.toString());
            setAddStudentGrade(currentClassroom.grade);
        } else {
            if (years.length > 0) {
                const sortedYears = [...years].sort((a, b) => b.year - a.year);
                setAddStudentYear(sortedYears[0].years_id.toString());
            }
            setAddStudentGrade("");
        }

        onOpen();
    };

    const handleDelete = (student) => {
        showConfirm(
            "ลบนักเรียน",
            `คุณต้องการลบนักเรียนชื่อ "${student.firstname} ${student.lastname}" (รหัส: ${student.students_id}) ใช่หรือไม่?`,
            async () => {
                try {
                    await studentService.deleteStudent(student.students_id);
                    showSuccess("สำเร็จ", "ลบข้อมูลสำเร็จ");
                    fetchStudents();
                } catch (error) {
                    showError("เกิดข้อผิดพลาด", error.message);
                }
            },
            "ลบ"
        );
    };

    const handleSubmit = async (onClose) => {
        if (!formData.students_id || !formData.firstname) {
            showError("ข้อมูลไม่ครบ", "กรุณากรอกรหัสนักเรียนและชื่อ");
            return;
        }
        try {
            if (isEditing) {
                await studentService.updateStudent(formData);
                showSuccess("สำเร็จ", "แก้ไขข้อมูลสำเร็จ!");
            } else {
                await studentService.addStudent(formData);
                showSuccess("สำเร็จ", "เพิ่มนักเรียนสำเร็จ!");
            }
            fetchStudents();
            onClose();
        } catch (error) {
            console.error("Operation error:", error);
            showError("เกิดข้อผิดพลาด", error.message);
        }
    };

    const getLatestClassroomObj = (stu) => {
        if (stu.classroom_students && stu.classroom_students.length > 0) {
            const sorted = [...stu.classroom_students].sort((a, b) => {
                const yearA = a.classroom?.academic_years?.year || 0;
                const yearB = b.classroom?.academic_years?.year || 0;
                return yearB - yearA;
            });
            if (selectedYear && selectedYear !== "all" && selectedYear !== "") {
                const match = sorted.find(cs => cs.classroom?.academic_years_years_id?.toString() === selectedYear.toString());
                if (match) return match.classroom;
            }
            return sorted[0].classroom;
        }
        return null;
    };

    const getStudentClassroom = (stu) => {
        const cls = getLatestClassroomObj(stu);
        if (cls) {
            const gradeLabel = gradeOptions.find(g => g.key === cls.grade)?.label || cls.grade;
            return `${gradeLabel} (${cls.type_classroom})`;
        }
        return "-";
    };

    const filteredStudents = students.filter(stu => {
        const classroom = getLatestClassroomObj(stu);

        if (selectedGrade !== "all") {
            if (!classroom || classroom.grade !== selectedGrade) return false;
        }

        if (selectedRoomType !== "all") {
            if (!classroom || classroom.type_classroom !== selectedRoomType) return false;
        }
        return true;
    });


    const handlePromoteClick = () => {
        router.push("/admin_promote_students");
    };

    const downloadTemplate = () => {
        const headers = ["รหัสนักเรียน", "ชื่อ", "นามสกุล", "อีเมล", "เบอร์โทร", "ระดับชั้น", "ห้อง"];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        XLSX.writeFile(wb, "student_template.xlsx");
    };

    const mapGradeToEnum = (gradeInput) => {
        if (!gradeInput) return null;
        const g = String(gradeInput).trim();
        if (g === "1" || g === "ม.1" || g === "M.1") return "Level_1";
        if (g === "2" || g === "ม.2" || g === "M.2") return "Level_2";
        if (g === "3" || g === "ม.3" || g === "M.3") return "Level_3";
        if (g === "4" || g === "ม.4" || g === "M.4") return "Level_4";
        if (g === "5" || g === "ม.5" || g === "M.5") return "Level_5";
        if (g === "6" || g === "ม.6" || g === "M.6") return "Level_6";
        return null;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!selectedYear) {
            showError("กรุณาเลือกปีการศึกษา", "ต้องเลือกปีการศึกษาก่อนนำเข้าข้อมูล");
            e.target.value = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const seenIds = new Set();

            const validData = data.filter(item => (item.students_id || item["รหัสนักเรียน"]) && (item.firstname || item["ชื่อ"])).map((item, index) => {
                const studentId = String(item.students_id || item["รหัสนักเรียน"]).trim();
                const firstname = item.firstname || item["ชื่อ"];
                const lastname = item.lastname || item["นามสกุล"] || "";

                // 1. Check DB Duplicate
                const isDbDuplicate = students.some(s => String(s.students_id) === studentId);

                // 2. Check File Duplicate
                let isInternalDuplicate = false;
                if (studentId) {
                    if (seenIds.has(studentId)) {
                        isInternalDuplicate = true;
                    } else {
                        seenIds.add(studentId);
                    }
                }

                const isDuplicate = isDbDuplicate || isInternalDuplicate;

                // Map Grade and Room to Classroom ID
                const gradeInput = item.grade || item["ระดับชั้น"];
                const roomInput = item.room || item["ห้อง"];

                let classroomId = null;
                let classroomStatus = "ไม่ระบุห้อง";
                let validClass = false;
                let suggestion = "";

                if (gradeInput && roomInput) {
                    const gradeEnum = mapGradeToEnum(gradeInput);
                    const roomName = String(roomInput).trim();

                    if (gradeEnum) {
                        const foundClass = classrooms.find(c =>
                            c.academic_years_years_id.toString() === selectedYear.toString() &&
                            c.grade === gradeEnum &&
                            c.type_classroom === roomName
                        );

                        if (foundClass) {
                            classroomId = foundClass.classroom_id;
                            classroomStatus = `${getGradeLabel(gradeEnum)} / ${roomName}`;
                            validClass = true;
                        } else {
                            classroomStatus = `ไม่พบห้อง (${gradeInput}/${roomName})`;
                            const availableRooms = classrooms
                                .filter(c => c.academic_years_years_id.toString() === selectedYear.toString() && c.grade === gradeEnum)
                                .map(c => c.type_classroom)
                                .join(", ");
                            suggestion = availableRooms ? `ห้องที่มีในระบบ: ${availableRooms}` : "ไม่มีห้องเรียนในระดับชั้นนี้";
                        }
                    } else {
                        classroomStatus = `ระดับชั้นไม่ถูกต้อง (${gradeInput})`;
                        suggestion = "ระดับชั้นที่ถูกต้อง: 1, 2, 3, 4, 5, 6, ม.1, ม.2, ...";
                    }
                } else {
                    if (!gradeInput && !roomInput) {
                        suggestion = "กรุณาระบุระดับชั้นและห้อง";
                    } else if (!gradeInput) {
                        suggestion = "กรุณาระบุระดับชั้น";
                    } else {
                        suggestion = "กรุณาระบุห้อง";
                    }
                }

                return {
                    id: index,
                    students_id: studentId,
                    firstname: firstname,
                    lastname: lastname,
                    email: item.email || item["อีเมล"],
                    tel: (item.tel || item["เบอร์โทร"]) ? String(item.tel || item["เบอร์โทร"]).replace(/\D/g, '').slice(0, 10) : "",
                    classroom_id: classroomId,
                    classroom_status: classroomStatus,
                    is_valid_class: validClass,
                    isDuplicate: isDuplicate,
                    suggestion: suggestion
                };
            });

            if (validData.length === 0) {
                showError("ไม่พบข้อมูลที่ถูกต้อง", "กรุณาตรวจสอบไฟล์ Excel (ต้องมีรหัสนักเรียนและชื่อ)");
                e.target.value = null;
                return;
            }

            setImportPreviewData(validData);

            const validKeys = new Set(
                validData
                    .filter(item => !item.isDuplicate && item.is_valid_class)
                    .map(item => String(item.id))
            );

            setSelectedImportKeys(validKeys);
            setIsImportModalOpen(true);
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const confirmImport = async () => {
        setIsLoadingImport(true);
        let successCount = 0;
        let failCount = 0;

        const studentsToImport = importPreviewData.filter(item => selectedImportKeys.has(String(item.id)));

        if (studentsToImport.length === 0) {
            showError("เตือน", "กรุณาเลือกรายการที่ต้องการนำเข้าอย่างน้อย 1 รายการ");
            setIsLoadingImport(false);
            return;
        }

        for (const stu of studentsToImport) {
            try {
                // Construct payload
                const payload = {
                    students_id: stu.students_id,
                    firstname: stu.firstname,
                    lastname: stu.lastname,
                    email: stu.email,
                    tel: stu.tel,
                    classroom_id: stu.classroom_id ? String(stu.classroom_id) : ""
                };
                await studentService.addStudent(payload);
                successCount++;
            } catch (error) {
                console.error("Import error for:", stu, error);
                failCount++;
            }
        }

        setIsLoadingImport(false);
        setIsImportModalOpen(false);
        setImportPreviewData([]);
        fetchStudents(); // Refresh list

        if (failCount > 0) {
            showError("เสร็จสิ้นแบบมีข้อผิดพลาด", `เพิ่มสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
        } else {
            showSuccess("สำเร็จ", `เพิ่มนักเรียนสำเร็จทั้งหมด ${successCount} รายการ`);
        }
    };


    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white" radius="sm">
                <CardBody className="p-6">
                    <div className="flex flex-row justify-between items-start mb-4">
                        <div>
                            <h3 className="text-gray-800 font-semibold">
                                การจัดการนักเรียน ({filteredStudents.length})
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">เพิ่มและจัดการข้อมูลนักเรียน</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 min-w-[160px]">
                                <Select
                                    aria-label="Select Academic Year"
                                    placeholder="ปีการศึกษา"
                                    className="max-w-xs"
                                    size="sm"
                                    selectedKeys={new Set([selectedYear])}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    {years.map((y) => (
                                        <SelectItem key={y.years_id.toString()} textValue={`ปีการศึกษา: ${(parseInt(y.year) + 543).toString()}`}>
                                            {parseInt(y.year) + 543}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 min-w-[130px]">
                                <Select
                                    aria-label="Select Grade"
                                    placeholder="ระดับชั้น"
                                    className="max-w-xs"
                                    size="sm"
                                    selectedKeys={new Set([selectedGrade])}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                >
                                    <SelectItem key="all" textValue="ระดับชั้น: ทั้งหมด">ทั้งหมด</SelectItem>
                                    {gradeOptions.map((g) => (
                                        <SelectItem key={g.key} textValue={`ระดับชั้น: ${g.label}`}>
                                            {g.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 min-w-[170px]">
                                <Select
                                    aria-label="Select Room Type"
                                    placeholder="ประเภทห้อง"
                                    className="max-w-xs"
                                    size="sm"
                                    selectedKeys={new Set([selectedRoomType])}
                                    onChange={(e) => setSelectedRoomType(e.target.value)}
                                >
                                    <SelectItem key="all" textValue="ประเภท: ทั้งหมด">ทั้งหมด</SelectItem>
                                    {roomTypeOptions.map((t) => (
                                        <SelectItem key={t.key} textValue={`ประเภท: ${t.label}`}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full"
                                onPress={handlePromoteClick}
                            >
                                <ArrowUp size={16} />
                                <span className="ml-1 font-medium">เลื่อนชั้นเรียน</span>
                            </Button>

                            <input
                                type="file"
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept=".xlsx, .xls"
                            />

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full"
                                onPress={downloadTemplate}
                            >
                                <FileDown size={16} />
                                <span className="ml-1 font-medium">โหลด Template</span>
                            </Button>

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full"
                                onPress={() => fileInputRef.current.click()}
                            >
                                <Upload size={16} />
                                <span className="ml-1 font-medium">นำเข้า Excel</span>
                            </Button>

                            <Button
                                onPress={openAddModal}
                                size="sm"
                                className="bg-sage text-white hover:bg-sage-dark shadow-sm rounded-full"
                            >
                                <PlusIcon />
                                <span className="ml-1">เพิ่มนักเรียนใหม่</span>
                            </Button>
                        </div>
                    </div>

                    <Table aria-label="Student Table"
                        shadow="none"
                        isHeaderSticky
                        classNames={{
                            wrapper: "border-2 border-[#EFECE5] rounded-xl p-0 overflow-hidden",
                            th: "bg-white border-b border-white text-gray-800",
                            td: "py-3 border-b border-[#EFECE5]",
                        }}>
                        <TableHeader>
                            <TableColumn>รหัสนักเรียน</TableColumn>
                            <TableColumn>ชื่อ-นามสกุล</TableColumn>
                            <TableColumn>อีเมล</TableColumn>
                            <TableColumn>ระดับชั้น/ห้อง</TableColumn>
                            <TableColumn>เบอร์โทร</TableColumn>
                            <TableColumn>ดำเนินการ</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent={"ไม่มีข้อมูลนักเรียน"}
                            isLoading={isLoading}
                            loadingContent={
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#6b857a] text-sm">กำลังโหลดข้อมูล...</p>
                                </div>
                            }
                        >

                            {filteredStudents.map((stu) => (
                                <TableRow key={stu.students_id} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                                    <TableCell>{stu.students_id}</TableCell>
                                    <TableCell>{stu.firstname} {stu.lastname}</TableCell>
                                    <TableCell>{stu.email}</TableCell>

                                    <TableCell>{getStudentClassroom(stu)}</TableCell>
                                    <TableCell>{stu.tel}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="cursor-pointer active:opacity-50 text-sage hover:text-sage-dark"
                                                onClick={() => handleEdit(stu)}
                                            >
                                                <SquarePen size={18} />
                                            </span>
                                            <span
                                                className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(stu)}
                                            >
                                                <Trash2 size={18} />
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>


            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur" size="lg" scrollBehavior="inside">
                <ModalContent className="bg-white rounded-2xl shadow-medium border border-gray-100 text-gray-800 p-2">
                    {(onClose) => (
                        <>
                            <ModalHeader>{isEditing ? "แก้ไขข้อมูลนักเรียน" : "เพิ่มนักเรียนใหม่"}</ModalHeader>
                            <ModalBody className="gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">รหัสนักเรียน</label>
                                    <Input name="students_id" value={formData.students_id} onChange={handleChange} isDisabled={isEditing} variant="bordered" radius="lg" placeholder="กรอกรหัสนักเรียน" classNames={{ inputWrapper: "bg-white" }} />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">ชื่อจริง</label>
                                        <Input name="firstname" value={formData.firstname} onChange={handleChange} variant="bordered" radius="lg" placeholder="กรอกชื่อจริง" classNames={{ inputWrapper: "bg-white" }} />
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">นามสกุล</label>
                                        <Input name="lastname" value={formData.lastname} onChange={handleChange} variant="bordered" radius="lg" placeholder="กรอกนามสกุล" classNames={{ inputWrapper: "bg-white" }} />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">อีเมล</label>
                                    <Input name="email" value={formData.email} onChange={handleChange} variant="bordered" radius="lg" placeholder="" classNames={{ inputWrapper: "bg-white" }} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">เบอร์โทร</label>
                                    <Input name="tel" value={formData.tel} onChange={handleTelChange} isInvalid={formData.tel.length > 0 && formData.tel.length < 10} errorMessage="เบอร์โทรศัพท์ต้องมี 10 หลัก" variant="bordered" radius="lg" placeholder="0xxxxxxxxx" maxLength={10} type="tel" classNames={{ inputWrapper: "bg-white" }} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">ปีการศึกษา</label>
                                        <Select
                                            placeholder="เลือกปีการศึกษา"
                                            variant="bordered"
                                            selectedKeys={addStudentYear ? [addStudentYear] : []}
                                            onChange={(e) => {
                                                setAddStudentYear(e.target.value);
                                                setFormData(prev => ({ ...prev, classroom_id: "" }));
                                            }}
                                            classNames={{ trigger: "bg-white" }}
                                            isDisabled={isEditing}
                                        >
                                            {years.map((y) => (
                                                <SelectItem key={y.years_id.toString()} value={y.years_id.toString()} textValue={`${parseInt(y.year) + 543}`}>
                                                    {parseInt(y.year) + 543}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">ระดับชั้น</label>
                                        <Select
                                            placeholder="เลือกระดับชั้น"
                                            variant="bordered"
                                            selectedKeys={addStudentGrade ? [addStudentGrade] : []}
                                            onChange={(e) => {
                                                setAddStudentGrade(e.target.value);
                                                setFormData(prev => ({ ...prev, classroom_id: "" }));
                                            }}
                                            classNames={{ trigger: "bg-white" }}
                                            isDisabled={isEditing && formData.classroom_id}
                                        >
                                            {gradeOptions.map((g) => (
                                                <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">ห้องเรียน</label>
                                    <Select
                                        placeholder={!addStudentYear || !addStudentGrade ? "กรุณาเลือกปีและระดับชั้นก่อน" : "เลือกห้องเรียน"}
                                        variant="bordered"
                                        isDisabled={!addStudentYear || !addStudentGrade}
                                        selectedKeys={formData.classroom_id ? [formData.classroom_id.toString()] : []}
                                        onChange={(e) => handleTeacherSelect(e.target.value)}
                                        classNames={{ trigger: "bg-white" }}
                                    >
                                        {classrooms
                                            .filter(c =>
                                                c.academic_years_years_id.toString() === addStudentYear &&
                                                c.grade === addStudentGrade
                                            )
                                            .reduce((acc, current) => {
                                                const x = acc.find(item => item.type_classroom === current.type_classroom);
                                                if (!x) {
                                                    return acc.concat([current]);
                                                } else {
                                                    return acc;
                                                }
                                            }, [])
                                            .map((room) => (
                                                <SelectItem
                                                    key={room.classroom_id}
                                                    value={room.classroom_id}
                                                    textValue={`${room.type_classroom}`}
                                                >
                                                    {room.type_classroom}
                                                </SelectItem>
                                            ))}
                                    </Select>
                                </div>
                                {formData.classroom_id && (() => {
                                    const selectedRoom = classrooms.find(c => c.classroom_id.toString() === formData.classroom_id.toString());
                                    if (!selectedRoom) return null;

                                    const relatedRooms = classrooms.filter(c =>
                                        c.type_classroom === selectedRoom.type_classroom &&
                                        c.grade === selectedRoom.grade &&
                                        c.academic_years_years_id === selectedRoom.academic_years_years_id
                                    );

                                    const advisors = [];

                                    relatedRooms.forEach(room => {
                                        if (room.teacher) advisors.push(room.teacher);
                                        if (room.classroom_teacher && room.classroom_teacher.length > 0) {
                                            room.classroom_teacher.forEach(ct => {
                                                if (ct.teacher) advisors.push(ct.teacher);
                                            });
                                        }
                                    });

                                    const uniqueAdvisors = Array.from(new Map(advisors.map(item => [item.teachers_id, item])).values());



                                    return (
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                            <span className="text-xs text-sage font-medium block mb-1">ครูที่ปรึกษา</span>
                                            {uniqueAdvisors.length > 0 ? (
                                                <ul className="list-disc list-inside text-sm text-green-900 grid grid-cols-2 gap-x-4">
                                                    {uniqueAdvisors.map(t => (
                                                        <li key={t.teachers_id}>{t.firstname} {t.lastname}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-sm text-gray-500">- ไม่ระบุ -</span>
                                            )}
                                        </div>
                                    );
                                })()}

                                {selectedClassroomInfo && (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500 block">ระดับชั้น</span>
                                            <span className="font-semibold text-green-800">{getGradeLabel(selectedClassroomInfo.grade)}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">ห้อง</span>
                                            <span className="font-semibold text-green-800">{selectedClassroomInfo.type_classroom}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">ปีการศึกษา</span>
                                            <span className="font-semibold text-green-800">{selectedClassroomInfo.academic_years ? parseInt(selectedClassroomInfo.academic_years.year) + 543 : '-'}</span>
                                        </div>
                                    </div>
                                )}


                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose} className="rounded-full">ยกเลิก</Button>
                                <Button className="bg-sage text-white shadow-sm rounded-full" onPress={() => handleSubmit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Import Preview Modal */}
            <Modal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} size="3xl" scrollBehavior="inside">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>ยืนยันการนำเข้าข้อมูล ({importPreviewData.length} รายการ)</ModalHeader>
                            <ModalBody>
                                <Table
                                    aria-label="Import Preview"
                                    selectionMode="multiple"
                                    selectedKeys={selectedImportKeys}
                                    onSelectionChange={setSelectedImportKeys}
                                    disabledKeys={importPreviewData.filter(item => item.isDuplicate || !item.is_valid_class).map(item => String(item.id))}
                                    color="primary"
                                >
                                    <TableHeader>
                                        <TableColumn>รหัสนักเรียน</TableColumn>
                                        <TableColumn>ชื่อ-นามสกุล</TableColumn>
                                        <TableColumn>ระดับชั้น/ห้อง</TableColumn>
                                        <TableColumn>อีเมล</TableColumn>
                                        <TableColumn>สถานะ</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {importPreviewData.map((stu) => (
                                            <TableRow key={stu.id}>
                                                <TableCell>{stu.students_id}</TableCell>
                                                <TableCell>{stu.firstname} {stu.lastname}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${stu.is_valid_class ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {stu.classroom_status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{stu.email}</TableCell>
                                                <TableCell>
                                                    {stu.isDuplicate ? (
                                                        <span className="text-red-500 text-xs bg-red-50 px-2 py-1 rounded-md font-medium whitespace-nowrap">
                                                            มีรหัสนักเรียนนี้แล้ว
                                                        </span>
                                                    ) : !stu.is_valid_class ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded-md font-medium whitespace-nowrap">
                                                                ตรวจสอบห้องเรียน
                                                            </span>
                                                            {stu.suggestion && (
                                                                <Tooltip content={stu.suggestion} color="warning" className="text-white">
                                                                    <span className="cursor-help text-orange-400 hover:text-orange-600">
                                                                        <HelpCircle size={16} />
                                                                    </span>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded-md font-medium whitespace-nowrap">
                                                            พร้อมนำเข้า
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose} className="rounded-full">ยกเลิก</Button>
                                <Button
                                    className="bg-sage text-white shadow-sm rounded-full"
                                    onPress={confirmImport}
                                    isLoading={isLoadingImport}
                                >
                                    ยืนยันนำเข้า
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

        </div >
    );
};

export default StudentManager;
