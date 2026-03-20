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
    Tooltip,
    Textarea
} from "@heroui/react";
import { useState, useEffect, useRef } from "react";
import * as XLSX from 'xlsx';
import { Trash2, Trash, Archive, SquarePen, ArrowUp, FileDown, ClipboardPaste, HelpCircle, Search } from 'lucide-react';
import studentService from "@/app/service/adminService";
import { useRouter } from "next/navigation";
import { PlusIcon } from "./Icons";
import TrashManager from "./TrashManager";

const StudentManager = () => {
    const { showSuccess, showError, showConfirm } = useStatusModal();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const router = useRouter();
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

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
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalStudents, setTotalStudents] = useState(0);

    const gradeOptions = [
        { key: "Level_1", label: "ม.1", value: 1 },
        { key: "Level_2", label: "ม.2", value: 2 },
        { key: "Level_3", label: "ม.3", value: 3 },
        { key: "Level_4", label: "ม.4", value: 4 },
        { key: "Level_5", label: "ม.5", value: 5 },
        { key: "Level_6", label: "ม.6", value: 6 },
    ];

    const [classroomTypes, setClassroomTypes] = useState([]);
    const uniqueRoomTypes = Array.from(new Set(classrooms.map(c => c.type_classroom).filter(Boolean)));
    uniqueRoomTypes.sort();
    const roomTypeOptions = uniqueRoomTypes.map(type => {
        const found = classroomTypes.find(t => t.classroom_type_id.toString() === type.toString());
        return { key: type.toString(), label: found ? found.name : type.toString() };
    });

    const [allTeachers, setAllTeachers] = useState([]);

    // Paste Import State
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [pasteYear, setPasteYear] = useState("");
    const [pasteGrade, setPasteGrade] = useState("");
    const [pasteClassroomId, setPasteClassroomId] = useState("");
    const [pasteText, setPasteText] = useState("");

    const [importPreviewData, setImportPreviewData] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLoadingImport, setIsLoadingImport] = useState(false);
    const [selectedImportKeys, setSelectedImportKeys] = useState(new Set(["all"]));

    // --- State สำหรับ Modal เพิ่มนักเรียน ---
    const [addStudentYear, setAddStudentYear] = useState("");
    const [addStudentGrade, setAddStudentGrade] = useState("");

    // ตัวเลือกคำนำหน้า
    const prefixOptions = [
        { key: "เด็กชาย", label: "เด็กชาย" },
        { key: "เด็กหญิง", label: "เด็กหญิง" },
        { key: "นาย", label: "นาย" },
        { key: "นางสาว", label: "นางสาว" },
    ];

    const [formData, setFormData] = useState({
        students_id: "",
        prefix_name: "",
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
                fetchTeachers(),
                fetchClassroomTypes()
            ]).then(([clsData, yearsData, tchData, typeData]) => {
                if (yearsData && yearsData.length > 0) {
                    const sortedYears = [...yearsData].sort((a, b) => b.year - a.year);
                    if (sortedYears.length > 0) {
                        setSelectedYear(sortedYears[0].year.toString());
                        setAddStudentYear(sortedYears[0].year.toString());
                        setPasteYear(sortedYears[0].year.toString());
                    }
                }
            });
            setIsLoading(false);
        };
        initData();
    }, []);


    useEffect(() => {
        if (selectedYear) {
            setPage(1);
            fetchStudents(1);
        }
    }, [selectedYear, selectedGrade, selectedRoomType, searchTerm]);

    const fetchStudents = async (pageNum = 1) => {
        setIsLoading(true);
        try {
            const result = await studentService.getStudentsPaginated(selectedYear, selectedGrade, selectedRoomType, pageNum, 20, searchTerm);
            const newData = Array.isArray(result) ? result : (result.data || []);
            
            if (pageNum === 1) {
                setStudents(newData);
            } else {
                setStudents(prev => [...prev, ...newData]);
            }
            
            if (result.pagination) {
                setHasMore(pageNum < result.pagination.totalPages);
                setTotalStudents(result.pagination.total);
            } else {
                setHasMore(false);
                setTotalStudents(newData.length);
            }
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

    const fetchClassroomTypes = async () => {
        try {
            const types = await studentService.getClassroomTypes();
            setClassroomTypes(types);
        } catch (error) {
            console.error(error);
        }
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
        setFormData({ students_id: "", prefix_name: "", firstname: "", lastname: "", email: "", tel: "", classroom_id: "" });

        if (years.length > 0) {

            const sortedYears = [...years].sort((a, b) => b.year - a.year);
            setAddStudentYear(sortedYears[0].year.toString());
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
            prefix_name: student.prefix_name || "",
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
                setAddStudentYear(sortedYears[0].year.toString());
            }
            setAddStudentGrade("");
        }

        onOpen();
    };

    const handleDelete = (student) => {
        // หาห้องเรียนของปีการศึกษาที่กำลังดูอยู่
        const matchedCs = student.classroom_students?.find(
            cs => cs.classroom?.academic_years_years_id?.toString() === selectedYear?.toString()
        );
        const classroomId = matchedCs?.classroom?.classroom_id || null;

        // สร้างข้อความบอกว่าลบออกจากห้องไหน
        let classroomDesc = "";
        if (matchedCs?.classroom) {
            const cls = matchedCs.classroom;
            const gradeLabel = gradeOptions.find(g => g.key === cls.grade)?.label || cls.grade;
            const foundType = classroomTypes.find(t => t.classroom_type_id?.toString() === cls.type_classroom?.toString());
            const roomName = foundType ? foundType.name : cls.type_classroom;
            const yearBE = cls.academic_years?.year ? parseInt(cls.academic_years.year) + 543 : selectedYear;
            classroomDesc = `\nห้องเรียน: ${gradeLabel}${roomName ? ` (${roomName})` : ""} ปีการศึกษา ${yearBE}`;
        }

        showConfirm(
            "ลบนักเรียนออกจากห้องเรียน",
            `ลบนักเรียน "${student.firstname} ${student.lastname}" (รหัส: ${student.students_id}) ออกจากห้องเรียนปีนี้ใช่หรือไม่?${classroomDesc}\n\nนักเรียนจะถูกย้ายไปยังที่เก็บถาวร และสามารถกู้คืนได้ในภายหลัง`,
            async () => {
                try {
                    await studentService.deleteStudent(student.students_id, classroomId);
                    showSuccess("สำเร็จ", "ลบนักเรียนออกจากห้องเรียนสำเร็จ");
                    setPage(1);
                    fetchStudents(1);
                } catch (error) {
                    showError("เกิดข้อผิดพลาด", error.message);
                }
            },
            "ลบออกจากห้อง"
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
            setPage(1);
            fetchStudents(1);
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

            const foundType = classroomTypes.find(t => t.classroom_type_id.toString() === cls.type_classroom?.toString());
            const roomName = foundType ? foundType.name : cls.type_classroom;

            if (roomName) {
                return `${gradeLabel} (${roomName})`;
            }

            return `${gradeLabel}`;
        }
        return "-";
    };
    const filteredStudents = students;


    const handlePromoteClick = () => {
        router.push("/admin_promote_students");
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

    const openPasteModal = () => {
        setPasteYear(years.length > 0 ? [...years].sort((a, b) => b.year - a.year)[0].year.toString() : "");
        setPasteGrade("");
        setPasteClassroomId("");
        setPasteText("");
        setIsPasteModalOpen(true);
    };

    const handlePastePreview = () => {
        if (!pasteYear || !pasteGrade || !pasteClassroomId) {
            showError("ข้อมูลไม่ครบ", "กรุณาเลือกปีการศึกษา ระดับชั้น และห้องเรียนก่อน");
            return;
        }

        if (!pasteText.trim()) {
            showError("ไม่มีข้อมูล", "กรุณาวางข้อมูลก่อนตรวจสอบ");
            return;
        }

        const lines = pasteText.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) return;

        const seenIds = new Set();

        const selectedClassroom = classrooms.find(c => c.classroom_id.toString() === pasteClassroomId.toString());
        const gradeLabel = getGradeLabel(selectedClassroom?.grade) || "-";
        const roomName = classroomTypes.find(t => t.classroom_type_id === selectedClassroom?.type_classroom)?.name || selectedClassroom?.type_classroom || "-";

        // ตรวจสอบคำนำหน้าจากข้อความ
        const knownPrefixes = ["เด็กชาย", "เด็กหญิง", "นางสาว", "นาย", "นาง"];
        const extractPrefix = (name) => {
            for (const prefix of knownPrefixes) {
                if (name.startsWith(prefix)) {
                    return { prefix_name: prefix, cleanName: name.slice(prefix.length).trim() };
                }
            }
            return { prefix_name: "", cleanName: name };
        };

        const validData = lines.map((line, index) => {
            const cols = line.split('\t').map(c => c.trim());
            if (cols.length < 2) return null;

            const studentId = cols[0];
            let prefix_name = "";
            let firstname = "";
            let lastname = "";

            if (cols.length >= 4) {
                // รูปแบบ: รหัส \t คำนำหน้า \t ชื่อ \t นามสกุล
                prefix_name = cols[1];
                firstname = cols[2];
                lastname = cols[3];
            } else if (cols.length >= 3) {
                // รูปแบบ: รหัส \t ชื่อ \t นามสกุล (ชื่ออาจมีคำนำหน้า)
                const extracted = extractPrefix(cols[1]);
                prefix_name = extracted.prefix_name;
                firstname = extracted.cleanName;
                lastname = cols[2];
            } else {
                // รูปแบบ: รหัส \t ชื่อ นามสกุล (รวมในคอลัมน์เดียว)
                const combined = cols[1];
                const extracted = extractPrefix(combined);
                prefix_name = extracted.prefix_name;
                const nameParts = extracted.cleanName.split(' ');
                firstname = nameParts[0];
                lastname = nameParts.slice(1).join(' ');
            }

            if (!studentId || !firstname) return null;

            const isDbDuplicate = students.some(s => String(s.students_id) === studentId);

            let isInternalDuplicate = false;
            if (seenIds.has(studentId)) {
                isInternalDuplicate = true;
            } else {
                seenIds.add(studentId);
            }

            const isDuplicate = isDbDuplicate || isInternalDuplicate;

            return {
                id: index,
                students_id: studentId,
                prefix_name: prefix_name,
                firstname: firstname,
                lastname: lastname,
                email: `kks${studentId}@khukhan.ac.th`,
                tel: "",
                classroom_id: pasteClassroomId,
                classroom_status: `${gradeLabel} / ${roomName}`,
                is_valid_class: true,
                isDuplicate: isDuplicate,
                suggestion: ""
            };
        }).filter(item => item !== null);

        if (validData.length === 0) {
            showError("ไม่พบข้อมูลที่ถูกต้อง", "กรุณาตรวจสอบข้อมูลที่วาง (ต้องมีรหัสนักเรียนและชื่อคั่นด้วย Tab)");
            return;
        }

        setImportPreviewData(validData);

        const validKeys = new Set(
            validData
                .filter(item => !item.isDuplicate)
                .map(item => String(item.id))
        );

        setSelectedImportKeys(validKeys);
        setIsPasteModalOpen(false);
        setIsImportModalOpen(true);
    };

    const confirmImport = async () => {
        setIsLoadingImport(true);

        const studentsToImport = importPreviewData.filter(item => selectedImportKeys.has(String(item.id)));

        if (studentsToImport.length === 0) {
            showError("เตือน", "กรุณาเลือกรายการที่ต้องการนำเข้าอย่างน้อย 1 รายการ");
            setIsLoadingImport(false);
            return;
        }

        try {
            const payloadArray = studentsToImport.map(stu => ({
                students_id: stu.students_id,
                prefix_name: stu.prefix_name || "",
                firstname: stu.firstname,
                lastname: stu.lastname,
                email: stu.email,
                tel: stu.tel,
                classroom_id: stu.classroom_id ? String(stu.classroom_id) : ""
            }));

            const result = await studentService.addStudentsBulk(payloadArray);

            setIsLoadingImport(false);
            setIsImportModalOpen(false);
            setImportPreviewData([]);
            setPage(1);
            fetchStudents(1);

            showSuccess("สำเร็จ", `เพิ่มนักเรียนสำเร็จทั้งหมด ${result.length} รายการ (ข้ามรายการที่ซ้ำกัน)`);
        } catch (error) {
            console.error("Bulk import error:", error);
            setIsLoadingImport(false);
            showError("เกิดข้อผิดพลาด", "การนำเข้าข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบไฟล์ของคุณ");
        }
    };


    if (showTrash) {
        return <TrashManager type="student" onBack={() => { setShowTrash(false); setPage(1); fetchStudents(1); }} />;
    }

    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white" radius="none">
                <CardBody className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
                        <div>
                            <h3 className="text-gray-800 font-semibold">
                                การจัดการนักเรียน ({totalStudents})
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">เพิ่มและจัดการข้อมูลนักเรียน</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <div className="flex items-center gap-2 min-w-[180px] flex-1">
                                <Input
                                    aria-label="Search students"
                                    placeholder="ค้นหา..."
                                    size="sm"
                                    isClearable
                                    startContent={<Search size={14} className="text-gray-400" />}
                                    value={searchTerm}
                                    onValueChange={(val) => {
                                        setSearchTerm(val);
                                    }}
                                    onClear={() => setSearchTerm("")}
                                    classNames={{ inputWrapper: "bg-white border-gray-200" }}
                                />
                            </div>
                            <div className="flex items-center gap-2 min-w-[120px] lg:min-w-[160px] flex-1">
                                <Select
                                    aria-label="Select Academic Year"
                                    placeholder="ปีการศึกษา"
                                    size="sm"
                                    selectedKeys={new Set([selectedYear])}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                >
                                    {years.map((y) => (
                                        <SelectItem key={y.year.toString()} textValue={`ปีการศึกษา: ${(parseInt(y.year) + 543).toString()}`}>
                                            {parseInt(y.year) + 543}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 min-w-[100px] lg:min-w-[130px] flex-1">
                                <Select
                                    aria-label="Select Grade"
                                    placeholder="ระดับชั้น"
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
                            <div className="flex items-center gap-2 min-w-[120px] lg:min-w-[170px] flex-1">
                                <Select
                                    aria-label="Select Room Type"
                                    placeholder="ประเภทห้อง"
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
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end mt-2 lg:mt-0">
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full"
                                    onPress={handlePromoteClick}
                                >
                                    <ArrowUp size={16} />
                                    <span className="ml-1 font-medium hidden sm:inline">เลื่อนชั้นเรียน</span>
                                </Button>

                                <Button
                                    size="sm"
                                    variant="bordered"
                                    className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full"
                                    onPress={openPasteModal}
                                >
                                    <ClipboardPaste size={16} />
                                    <span className="ml-1 font-medium hidden sm:inline">นำเข้ารายชื่อ (วางข้อมูล)</span>
                                </Button>

                                <Button
                                    onPress={openAddModal}
                                    size="sm"
                                    className="bg-sage text-white hover:bg-sage-dark shadow-sm rounded-full"
                                >
                                    <PlusIcon />
                                    <span className="ml-1 hidden sm:inline">เพิ่มนักเรียนใหม่</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full"
                                    onPress={() => setShowTrash(true)}
                                >
                                    <Archive size={16} />
                                    <span className="ml-1 font-medium hidden sm:inline">รายการที่ลบ</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <Table aria-label="Student Table"
                            shadow="none"
                            isHeaderSticky
                            classNames={{
                                wrapper: "border border-gray-100 rounded-xl p-0 overflow-hidden min-w-[900px] lg:min-w-full",
                                th: "bg-gray-50/50 border-b border-gray-100 text-gray-800 font-semibold py-4",
                                td: "py-4 border-b border-gray-50/50",
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
                                        <TableCell>{stu.prefix_name ? `${stu.prefix_name}${stu.firstname}` : stu.firstname} {stu.lastname}</TableCell>
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
                        {hasMore && students.length > 0 && (
                            <div className="flex justify-center mt-6 w-full">
                                <Button
                                    variant="flat"
                                    className="bg-sage/10 text-sage"
                                    onPress={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        fetchStudents(nextPage);
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
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">คำนำหน้า</label>
                                    <Select
                                        placeholder="เลือกคำนำหน้า"
                                        variant="bordered"
                                        selectedKeys={formData.prefix_name ? [formData.prefix_name] : []}
                                        onChange={(e) => setFormData(prev => ({ ...prev, prefix_name: e.target.value }))}
                                        classNames={{ trigger: "bg-white" }}
                                    >
                                        {prefixOptions.map((p) => (
                                            <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                        ))}
                                    </Select>
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
                                                <SelectItem key={y.year.toString()} value={y.year.toString()} textValue={`${parseInt(y.year) + 543}`}>
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
                                            .map((room) => {
                                                const roomName = classroomTypes.find(t => t.classroom_type_id === room.type_classroom)?.name || room.type_classroom;
                                                return (
                                                    <SelectItem
                                                        key={room.classroom_id}
                                                        value={room.classroom_id}
                                                        textValue={`${roomName}`}
                                                    >
                                                        {roomName}
                                                    </SelectItem>
                                                )
                                            })}
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

                                {selectedClassroomInfo && (() => {
                                    const roomName = classroomTypes.find(t => t.classroom_type_id === selectedClassroomInfo.type_classroom)?.name || selectedClassroomInfo.type_classroom;
                                    return (
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex gap-4 mt-2">
                                            <div>
                                                <span className="text-xs text-gray-500 block">ระดับชั้น</span>
                                                <span className="font-semibold text-green-800">{getGradeLabel(selectedClassroomInfo.grade)}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block">ห้อง</span>
                                                <span className="font-semibold text-green-800">{roomName}</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 block">ปีการศึกษา</span>
                                                <span className="font-semibold text-green-800">{selectedClassroomInfo.academic_years ? parseInt(selectedClassroomInfo.academic_years.year) + 543 : '-'}</span>
                                            </div>
                                        </div>
                                    );
                                })()}


                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose} className="rounded-full">ยกเลิก</Button>
                                <Button className="bg-sage text-white shadow-sm rounded-full" onPress={() => handleSubmit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Paste Data Modal */}
            <Modal isOpen={isPasteModalOpen} onOpenChange={setIsPasteModalOpen} placement="center" backdrop="blur" size="2xl" scrollBehavior="inside">
                <ModalContent className="bg-white rounded-2xl shadow-medium border border-gray-100 text-gray-800 p-2">
                    {(onClosePaste) => (
                        <>
                            <ModalHeader>นำเข้ารายชื่อนักเรียน</ModalHeader>
                            <ModalBody className="gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-gray-700">ปีการศึกษา</label>
                                        <Select
                                            placeholder="เลือกปีการศึกษา"
                                            variant="bordered"
                                            selectedKeys={pasteYear ? [pasteYear] : []}
                                            onChange={(e) => {
                                                setPasteYear(e.target.value);
                                                setPasteClassroomId("");
                                            }}
                                            classNames={{ trigger: "bg-white" }}
                                        >
                                            {years.map((y) => (
                                                <SelectItem key={y.year.toString()} value={y.year.toString()} textValue={`${parseInt(y.year) + 543}`}>
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
                                            selectedKeys={pasteGrade ? [pasteGrade] : []}
                                            onChange={(e) => {
                                                setPasteGrade(e.target.value);
                                                setPasteClassroomId("");
                                            }}
                                            classNames={{ trigger: "bg-white" }}
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
                                        placeholder={!pasteYear || !pasteGrade ? "กรุณาเลือกปีและระดับชั้นก่อน" : "เลือกห้องเรียน"}
                                        variant="bordered"
                                        isDisabled={!pasteYear || !pasteGrade}
                                        selectedKeys={pasteClassroomId ? [pasteClassroomId.toString()] : []}
                                        onChange={(e) => setPasteClassroomId(e.target.value)}
                                        classNames={{ trigger: "bg-white" }}
                                    >
                                        {classrooms
                                            .filter(c =>
                                                c.academic_years_years_id.toString() === pasteYear &&
                                                c.grade === pasteGrade
                                            )
                                            .map((room) => {
                                                const roomName = classroomTypes.find(t => t.classroom_type_id === room.type_classroom)?.name || room.type_classroom;
                                                return (
                                                    <SelectItem
                                                        key={room.classroom_id}
                                                        value={room.classroom_id}
                                                        textValue={`${roomName}`}
                                                    >
                                                        {roomName}
                                                    </SelectItem>
                                                )
                                            })}
                                    </Select>
                                </div>
                                {pasteClassroomId && (() => {
                                    const selectedRoom = classrooms.find(c => c.classroom_id.toString() === pasteClassroomId.toString());
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

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">วางข้อมูลนักเรียน (คัดลอกจาก Excel)</label>
                                    <Textarea
                                        placeholder={`ก๊อปปี้ข้อมูลมาจากไฟล์ Excel แล้วนำมาวางที่นี่ได้เลย (รองรับรหัสนักเรียน ชื่อ และนามสกุล)\n\nตัวอย่าง:\n12345\tเด็กชาย\tสมชาย\tใจดี\n12346\tเด็กหญิงสมหญิง\tดีมาก`}
                                        variant="bordered"
                                        minRows={8}
                                        value={pasteText}
                                        onChange={(e) => setPasteText(e.target.value)}
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClosePaste} className="rounded-full">ยกเลิก</Button>
                                <Button className="bg-sage text-white shadow-sm rounded-full" onPress={handlePastePreview}>ตรวจสอบข้อมูล</Button>
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
                                                <TableCell>{stu.prefix_name ? `${stu.prefix_name}${stu.firstname}` : stu.firstname} {stu.lastname}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${stu.is_valid_class ? 'bg-[#eff2f0] text-[#5d7c6f] border-[#dbe6e1] border' : 'bg-orange-100 text-orange-700'}`}>
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
