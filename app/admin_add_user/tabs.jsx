"use client";
import {
    Tabs,
    Tab,
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
    Spinner,
    Accordion, AccordionItem, Checkbox, Badge, Avatar

} from "@heroui/react";

import { useState, useEffect } from "react";

import { Trash2, SquarePen, Settings, Check, X, ArrowUp, FileDown, Upload } from 'lucide-react';

import studentService from "@/app/service/adminService";



const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);



const ClassroomManagerContent = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [classrooms, setClassrooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("all");


    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);



    const [newYearInput, setNewYearInput] = useState("");


    // Settings Modal State
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onOpenChange: onSettingsChange } = useDisclosure();
    const [classroomTypes, setClassroomTypes] = useState([]);
    const [newTypeData, setNewTypeData] = useState({ name: "", valid_grades: [] });

    const handleOpenSettings = async () => {
        setIsLoading(true);
        try {
            const types = await studentService.getClassroomTypes();
            setClassroomTypes(types);
            onSettingsOpen();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClassroomType = async () => {
        if (!newTypeData.name) return alert("กรุณาระบุชื่อประเภท");
        if (newTypeData.valid_grades.length === 0) return alert("กรุณาเลือกอย่างน้อย 1 ระดับชั้น");

        try {
            await studentService.addClassroomType({
                name: newTypeData.name,
                valid_grades: newTypeData.valid_grades.join(",")
            });
            alert("เพิ่มข้อมูลสำเร็จ");
            setNewTypeData({ name: "", valid_grades: [] });
            const types = await studentService.getClassroomTypes();
            setClassroomTypes(types);
        } catch (e) {
            alert(e.message);
        }
    };

    const handleDeleteClassroomType = async (id) => {
        if (!confirm("ยืนยันการลบ?")) return;
        try {
            await studentService.deleteClassroomType(id);
            const types = await studentService.getClassroomTypes();
            setClassroomTypes(types);
        } catch (e) {
            alert(e.message);
        }
    };

    const handleToggleGrade = (grade) => {
        setNewTypeData(prev => {
            const grades = prev.valid_grades.includes(grade)
                ? prev.valid_grades.filter(g => g !== grade)
                : [...prev.valid_grades, grade].sort();
            return { ...prev, valid_grades: grades };
        });
    };

    const handleAddAcademicYear = async () => {
        const cleanInput = newYearInput.trim();
        if (!cleanInput || cleanInput.length !== 4) {
            return alert("กรุณาระบุปีให้ถูกต้อง (4 หลัก)");
        }

        let yearToSend = parseInt(cleanInput);
        if (isNaN(yearToSend)) return alert("กรุณาระบุปีเป็นตัวเลข");

        // Convert BE to CE if needed
        if (yearToSend > 2400) {
            yearToSend = yearToSend - 543;
        }

        try {
            await studentService.addAcademicYear(yearToSend);
            alert(`เพิ่มปีการศึกษา ${yearToSend + 543} สำเร็จ`);
            setNewYearInput("");
            fetchData(); // Refresh main data
        } catch (e) {
            alert(e.message);
        }
    };

    const handleDeleteAcademicYear = async (id) => {
        if (!confirm("ยืนยันการลบปีการศึกษา")) return;
        try {
            await studentService.deleteAcademicYear(id);
            alert("ลบข้อมูลสำเร็จ");
            fetchData();
        } catch (e) {
            alert(e.message);
        }
    };

    const [formData, setFormData] = useState({
        grade: "",
        type_classroom: "",
        teacher_id: "",
        academic_year_id: ""
    });

    const gradeOptions = [
        { key: "Level_1", label: "ม.1", value: 1 },
        { key: "Level_2", label: "ม.2", value: 2 },
        { key: "Level_3", label: "ม.3", value: 3 },
        { key: "Level_4", label: "ม.4", value: 4 },
        { key: "Level_5", label: "ม.5", value: 5 },
        { key: "Level_6", label: "ม.6", value: 6 },
    ];

    const handleEditClassroom = (room) => {
        setIsEditing(true);
        setEditId(room.classroom_id);
        setFormData({
            grade: room.grade,
            type_classroom: room.type_classroom,
            teacher_id: room.teachers_teachers_id.toString(),
            academic_year_id: room.academic_years_years_id.toString()
        });
        onOpen();
    };

    const handleDeleteClassroom = async (id) => {
        if (!confirm("คุณต้องการลบข้อมูลห้องเรียนนี้ใช่หรือไม่?")) return;
        try {
            await studentService.deleteClassroom(id);
            alert("ลบสำเร็จ");
            fetchData();
        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    };

    const getRoomOptions = (gradeKey) => {
        const gradeLevel = gradeOptions.find(g => g.key === gradeKey)?.value || 0;
        if (!gradeLevel) return [];

        return classroomTypes
            .filter(type => {
                const validGrades = type.valid_grades.split(',').map(Number);
                return validGrades.includes(gradeLevel);
            })
            .map(type => ({ key: type.name, label: type.name }));
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [clsData, tchData, yearData, typeData] = await Promise.all([
                studentService.getClassrooms(selectedYear),
                studentService.getTeachers(),
                studentService.getAcademicYears(),
                studentService.getClassroomTypes()
            ]);
            setClassrooms(clsData);
            setTeachers(tchData);
            setYears(yearData);
            setClassroomTypes(typeData);

            if (yearData.length > 0 && !formData.academic_year_id) {
                setFormData(prev => ({ ...prev, academic_year_id: yearData[0].years_id.toString() }));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const handleSelectChange = (key, value) => {
        setFormData(prev => {
            const newData = { ...prev, [key]: value };
            if (key === 'grade') newData.type_classroom = "";
            return newData;
        });
    };




    const handleSubmit = async (onClose) => {
        if (!formData.grade || !formData.teacher_id || !formData.type_classroom) {
            alert("กรุณากรอกข้อมูลให้ครบ");
            return;
        }
        try {
            if (isEditing) {
                await studentService.updateClassroom({ ...formData, classroom_id: editId });
                alert("แก้ไขข้อมูลห้องเรียนสำเร็จ!");
            } else {
                await studentService.addClassroom(formData);
                alert("เพิ่มข้อมูลห้องเรียนสำเร็จ!");
            }
            fetchData();
            onClose();
        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    };
    const handleOpenAdd = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            grade: "",
            type_classroom: "",
            teacher_id: "",
            academic_year_id: years.length > 0 ? years[0].years_id.toString() : ""
        });
        onOpen();
    };
    const displayRoomName = (typeKey) => {
        if (typeKey === "Gifted") return "ห้อง Gifted";
        if (typeKey === "Morkrajay") return "ห้องมอกระจาย";
        return typeKey;
    };



    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white" radius="sm">
                <CardBody className="p-6">
                    <div className="flex flex-row justify-between items-start mb-4">
                        <div>
                            <h3 className="text-gray-800 font-semibold text-lg">
                                ข้อมูลห้องเรียนและครูประจำชั้น ({classrooms.length})
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                ตรวจสอบและจัดการรายชื่อครูประจำชั้นในแต่ละห้อง
                            </p>
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
                                    <SelectItem key="all" textValue="ปีการศึกษา: ทั้งหมด">ทั้งหมด</SelectItem>
                                    {years.map((y) => (
                                        <SelectItem key={y.years_id.toString()} textValue={`ปีการศึกษา: ${(parseInt(y.year) + 543).toString()}`}>
                                            {parseInt(y.year) + 543}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                            <Button
                                onPress={handleOpenSettings}
                                size="sm"
                                isIconOnly
                                variant="light"
                                className="text-gray-500"
                            >
                                <Settings size={20} />
                            </Button>
                            <Button onPress={handleOpenAdd} variant="light" size="sm" className="text-gray-500 hover:text-gray-700">
                                <PlusIcon />
                                <span className="ml-1">เพิ่มห้องเรียน</span>
                            </Button>
                        </div>
                    </div>

                    <Table aria-label="Classroom Table" shadow="none">
                        <TableHeader>
                            <TableColumn>ระดับชั้น</TableColumn>
                            <TableColumn>ประเภทห้อง</TableColumn>
                            <TableColumn>ครูประจำชั้น</TableColumn>
                            <TableColumn>ปีการศึกษา</TableColumn>
                            <TableColumn>ดำเนินการ</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent="ยังไม่ได้กำหนดห้องเรียนในปีนี้"
                            isLoading={isLoading}
                            loadingContent={
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#6b857a] text-sm">กำลังโหลดข้อมูล...</p>
                                </div>
                            }
                        >
                            {classrooms.map((room) => (
                                <TableRow key={room.classroom_id}>
                                    <TableCell>{gradeOptions.find(g => g.key === room.grade)?.label || room.grade}</TableCell>
                                    <TableCell>{displayRoomName(room.type_classroom)}</TableCell>
                                    <TableCell>{room.teacher?.firstname} {room.teacher?.lastname}</TableCell>
                                    <TableCell>{room.academic_years?.year + 543}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="cursor-pointer active:opacity-50 text-blue-500 hover:text-blue-700"
                                                onClick={() => handleEditClassroom(room)}
                                            >
                                                <SquarePen size={18} />
                                            </span>
                                            <span
                                                className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                                                onClick={() => handleDeleteClassroom(room.classroom_id)}
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

            <Modal isOpen={isSettingsOpen} onOpenChange={onSettingsChange} size="2xl">
                <ModalContent className="bg-white text-gray-800">
                    {(onClose) => (
                        <>
                            <ModalHeader>ตั้งค่าข้อมูลพื้นฐาน</ModalHeader>
                            <ModalBody>
                                <Tabs aria-label="Settings Options">
                                    <Tab key="years" title="ปีการศึกษา">
                                        <div className="flex gap-2 mb-4">
                                            <Input
                                                placeholder="ระบุปีการศึกษา (เช่น 2568)"
                                                value={newYearInput}
                                                onChange={(e) => setNewYearInput(e.target.value)}
                                            />
                                            <Button onClick={handleAddAcademicYear} color="primary">เพิ่ม</Button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {years.map(y => (
                                                <div key={y.years_id} className="p-2 border rounded flex justify-between items-center text-sm">
                                                    <span>{(parseInt(y.year) + 543)}</span>
                                                    <span
                                                        className="text-red-500 cursor-pointer hover:bg-red-50 p-1 rounded"
                                                        onClick={() => handleDeleteAcademicYear(y.years_id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </Tab>
                                    <Tab key="types" title="ประเภทห้องเรียน">
                                        <div className="border p-4 rounded-lg mb-4 bg-gray-50">
                                            <h4 className="font-semibold mb-2">เพิ่มประเภทห้องใหม่</h4>
                                            <div className="flex gap-2 mb-2">
                                                <Input
                                                    placeholder="ชื่อประเภท (เช่น ห้อง Gifted)"
                                                    value={newTypeData.name}
                                                    onChange={(e) => setNewTypeData({ ...newTypeData, name: e.target.value })}
                                                />
                                                <Button onClick={handleAddClassroomType} color="primary">บันทึก</Button>
                                            </div>
                                            <div className="flex gap-4">
                                                <span className="text-sm pt-1">ใช้กับระดับชั้น:</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    {['1', '2', '3', '4', '5', '6'].map(g => (
                                                        <Checkbox
                                                            key={g}
                                                            isSelected={newTypeData.valid_grades.includes(g)}
                                                            onValueChange={() => handleToggleGrade(g)}
                                                        >
                                                            ม.{g}
                                                        </Checkbox>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <Table aria-label="Classroom Types">
                                            <TableHeader>
                                                <TableColumn>ชื่อประเภท</TableColumn>
                                                <TableColumn>ใช้กับระดับชั้น</TableColumn>
                                                <TableColumn>จัดการ</TableColumn>
                                            </TableHeader>
                                            <TableBody>
                                                {classroomTypes.map(type => (
                                                    <TableRow key={type.classroom_type_id}>
                                                        <TableCell>{type.name}</TableCell>
                                                        <TableCell>
                                                            {type.valid_grades.split(',').map(g => `ม.${g}`).join(', ')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className="text-red-500 cursor-pointer"
                                                                onClick={() => handleDeleteClassroomType(type.classroom_type_id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Tab>
                                </Tabs>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>ปิด</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent className="bg-white p-4 text-gray-800">
                    {(onClose) => (
                        <>
                            <ModalHeader>ตั้งค่าห้องเรียน</ModalHeader>
                            <ModalBody className="gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label="ระดับชั้น"
                                        placeholder="เลือกระดับชั้น"
                                        selectedKeys={formData.grade ? [formData.grade] : []}
                                        onChange={(e) => handleSelectChange("grade", e.target.value)}
                                    >
                                        {gradeOptions.map((g) => (
                                            <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                                        ))}
                                    </Select>

                                    <Select
                                        label="ประเภทห้อง"
                                        placeholder={formData.grade ? "เลือกประเภทห้อง" : "กรุณาเลือกระดับชั้นก่อน"}
                                        isDisabled={!formData.grade}
                                        selectedKeys={formData.type_classroom ? [formData.type_classroom] : []}
                                        onChange={(e) => handleSelectChange("type_classroom", e.target.value)}
                                    >
                                        {getRoomOptions(formData.grade).map((r) => (
                                            <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <Select
                                    label="ครูประจำชั้น"
                                    placeholder="เลือกครู"
                                    selectedKeys={formData.teacher_id ? [formData.teacher_id] : []}
                                    onChange={(e) => handleSelectChange("teacher_id", e.target.value)}
                                >
                                    {teachers.map((t) => (
                                        <SelectItem
                                            key={t.teachers_id}
                                            value={t.teachers_id}

                                            textValue={`${t.firstname} ${t.lastname}`}
                                        >
                                            {t.firstname} {t.lastname}
                                        </SelectItem>
                                    ))}
                                </Select>

                                {/* ส่วนจัดการปีการศึกษา */}
                                <Select
                                    label="ปีการศึกษา"
                                    placeholder="เลือกปีการศึกษา"
                                    defaultSelectedKeys={formData.academic_year_id ? [formData.academic_year_id] : []}
                                    selectedKeys={formData.academic_year_id ? [formData.academic_year_id] : []}
                                    onChange={(e) => handleSelectChange("academic_year_id", e.target.value)}
                                >
                                    {years.map((y) => (
                                        <SelectItem
                                            key={y.years_id}
                                            value={y.years_id}
                                            textValue={`${parseInt(y.year) + 543}`}
                                        >
                                            {parseInt(y.year) + 543}
                                        </SelectItem>
                                    ))}
                                </Select>

                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>ยกเลิก</Button>
                                <Button color="primary" onPress={() => handleSubmit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div >
    );
};


const StudentManagerContent = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // --- State เลื่อนชั้น  ---
    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [promoteStep, setPromoteStep] = useState(1);
    const [promoteData, setPromoteData] = useState({ fromYear: "", toYear: "" });
    const [previewPlan, setPreviewPlan] = useState([]);
    const [isLoadingPromote, setIsLoadingPromote] = useState(false);
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
        onOpen();
    };

    const handleEdit = (student) => {
        setIsEditing(true);
        const currentClassroomId = student.classroom_students && student.classroom_students.length > 0
            ? student.classroom_students.sort((a, b) => (b.classroom?.academic_years?.year || 0) - (a.classroom?.academic_years?.year || 0))[0].classroom_classroom_id.toString()
            : "";
        setFormData({
            students_id: student.students_id,
            firstname: student.firstname,
            lastname: student.lastname,
            email: student.email || "",
            tel: student.tel || "",
            classroom_id: currentClassroomId
        });
        onOpen();
    };

    const handleDelete = async (id) => {
        if (!confirm("คุณต้องการลบนักเรียนรหัส " + id + " ใช่หรือไม่?")) return;
        try {
            await studentService.deleteStudent(id);
            alert("ลบข้อมูลสำเร็จ");
            fetchStudents();
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
        }
    };

    const handleSubmit = async (onClose) => {
        if (!formData.students_id || !formData.firstname) {
            alert("กรุณากรอกรหัสนักเรียนและชื่อ");
            return;
        }
        try {
            if (isEditing) {
                await studentService.updateStudent(formData);
                alert("แก้ไขข้อมูลสำเร็จ!");
            } else {
                await studentService.addStudent(formData);
                alert("เพิ่มนักเรียนสำเร็จ!");
            }
            fetchStudents();
            onClose();
        } catch (error) {
            console.error("Operation error:", error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    };

    const getLatestClassroomObj = (stu) => {
        if (stu.classroom_students && stu.classroom_students.length > 0) {
            const sorted = [...stu.classroom_students].sort((a, b) => {
                const yearA = a.classroom?.academic_years?.year || 0;
                const yearB = b.classroom?.academic_years?.year || 0;
                return yearB - yearA;
            });
            // Try to find one matching selectedYear if set
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
        setPromoteStep(1);
        setPromoteData({ fromYear: "", toYear: "" });
        setPreviewPlan([]);
        setIsPromoteOpen(true);
    };

    const handleGoToReview = async () => {
        if (!promoteData.fromYear || !promoteData.toYear) return alert("กรุณาเลือกปีการศึกษา");
        if (promoteData.fromYear === promoteData.toYear) return alert("ปีต้นทางและปลายทางต้องไม่เหมือนกัน");

        setIsLoadingPromote(true);
        try {
            const res = await fetch(`/api/students/promote?fromYearId=${promoteData.fromYear}&toYearId=${promoteData.toYear}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setPreviewPlan(data);
            setPromoteStep(2);
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setIsLoadingPromote(false);
        }
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

        for (const item of previewPlan) {
            // ถ้าเป็นห้องใหม่ (หรือห้องเดิมที่ไม่มีครู) และมีนักเรียนถูกเลือก แต่ไม่ได้เลือกครู
            if ((item.isNewRoom || !item.targetRoomId) && !item.targetTeacherId && item.students.some(s => s.selected)) {
                alert(`กรุณาเลือกครูประจำชั้นสำหรับห้อง ${getGradeLabel(item.targetGrade)} (${item.targetType})`);
                return;
            }
        }

        if (!confirm("ยืนยันการเลื่อนชั้นเรียน? ข้อมูลจะถูกบันทึกทันที")) return;

        setIsLoadingPromote(true);
        try {
            const res = await fetch('/api/students/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toYearId: promoteData.toYear,
                    plan: previewPlan
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(data.message);
            setIsPromoteOpen(false);
            fetchStudents();
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setIsLoadingPromote(false);
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
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={handlePromoteClick}
                            >
                                <ArrowUp size={16} />
                                <span className="ml-1 font-medium">เลื่อนชั้นเรียน</span>
                            </Button>

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={() => alert("ยังไม่เสร็จ")}
                            >
                                <FileDown size={16} />
                                <span className="ml-1 font-medium">โหลด Template</span>
                            </Button>

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={() => alert("ยังไม่เสร็จ")}
                            >
                                <Upload size={16} />
                                <span className="ml-1 font-medium">นำเข้า Excel</span>
                            </Button>

                            <Button
                                onPress={openAddModal}
                                size="sm"
                                className="bg-green-900 text-white hover:bg-green-800 shadow-sm"
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
                                                className="cursor-pointer active:opacity-50 text-blue-500 hover:text-blue-700"
                                                onClick={() => handleEdit(stu)}
                                            >
                                                <SquarePen size={18} />
                                            </span>
                                            <span
                                                className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(stu.students_id)}
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


            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur" size="lg">
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
                                    <label className="text-sm font-medium text-gray-700">ครูประจำชั้น (ระบุห้องเรียนอัตโนมัติ)</label>
                                    <Select
                                        placeholder="เลือกครูประจำชั้น"
                                        variant="bordered"
                                        selectedKeys={formData.classroom_id ? [formData.classroom_id.toString()] : []}
                                        onChange={(e) => handleTeacherSelect(e.target.value)}
                                        classNames={{ trigger: "bg-white" }}
                                    >
                                        {classrooms.map((room) => (
                                            <SelectItem
                                                key={room.classroom_id}
                                                value={room.classroom_id}
                                                textValue={`${room.teacher?.firstname} ${room.teacher?.lastname}`}
                                            >
                                                {room.teacher?.firstname} {room.teacher?.lastname} — {getGradeLabel(room.grade)} ({room.type_classroom})
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>
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
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">อีเมล</label>
                                    <Input name="email" value={formData.email} onChange={handleChange} variant="bordered" radius="lg" placeholder="" classNames={{ inputWrapper: "bg-white" }} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">เบอร์โทร</label>
                                    <Input name="tel" value={formData.tel} onChange={handleTelChange} isInvalid={formData.tel.length > 0 && formData.tel.length < 10} errorMessage="เบอร์โทรศัพท์ต้องมี 10 หลัก" variant="bordered" radius="lg" placeholder="0xxxxxxxxx" maxLength={10} type="tel" classNames={{ inputWrapper: "bg-white" }} />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>ยกเลิก</Button>
                                <Button color="primary" onPress={() => handleSubmit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>


            <Modal
                isOpen={isPromoteOpen}
                onOpenChange={setIsPromoteOpen}
                size="2xl"
                scrollBehavior="inside"
                isDismissable={false}
            >
                <ModalContent className="bg-white text-gray-800">
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                {promoteStep === 1 ? "เลือกปีการศึกษา" : "ตรวจสอบรายการเลื่อนชั้น"}
                            </ModalHeader>
                            <ModalBody>
                                {promoteStep === 1 && (
                                    <div className="flex flex-col gap-4 py-4">
                                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm mb-2">
                                            ระบบจะค้นหานักเรียนในปีการศึกษาต้นทาง และจับคู่กับห้องเรียนในปีการศึกษาปลายทางโดยอัตโนมัติ (อิงตามระดับชั้นและประเภทห้องเรียนเดิม)
                                        </div>

                                        {/* เลือกปีต้นทาง */}
                                        <Select
                                            label="จากปีการศึกษา (จบแล้ว)"
                                            placeholder="เลือกปีต้นทาง"
                                            selectedKeys={promoteData.fromYear ? [promoteData.fromYear.toString()] : []}
                                            onChange={(e) => setPromoteData({ ...promoteData, fromYear: e.target.value })}
                                        >
                                            {years.map((y) => (
                                                <SelectItem key={y.years_id.toString()} value={y.years_id.toString()} textValue={`${parseInt(y.year) + 543}`}>
                                                    {parseInt(y.year) + 543}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        {/* เลือกปีการศึกษาปลายทาง */}
                                        <Select
                                            label="ไปยังปีการศึกษา (ใหม่)"
                                            placeholder="เลือกปีปลายทาง"
                                            selectedKeys={promoteData.toYear ? [promoteData.toYear.toString()] : []}
                                            onChange={(e) => setPromoteData({ ...promoteData, toYear: e.target.value })}
                                        >
                                            {years.map((y) => (
                                                <SelectItem key={y.years_id.toString()} value={y.years_id.toString()} textValue={`${parseInt(y.year) + 543}`}>
                                                    {parseInt(y.year) + 543}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                )}

                                {promoteStep === 2 && (
                                    <div className="flex flex-col gap-4">
                                        <p className="text-sm text-gray-500">
                                            ตรวจสอบรายชื่อห้องเรียนที่จะถูกสร้าง/อัปเดต และนักเรียนที่จะย้าย
                                            <br /><span className="text-red-500">* หากห้องใดยังไม่มีในปีใหม่ ระบบจะสร้างให้อัตโนมัติ (จำเป็นต้องระบุครู)</span>
                                        </p>

                                        <Accordion selectionMode="multiple" variant="splitted">
                                            {previewPlan.map((item, idx) => (
                                                <AccordionItem
                                                    key={idx}
                                                    title={
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-lg">
                                                                {getGradeLabel(item.sourceGrade)} ➝ {getGradeLabel(item.targetGrade)}
                                                            </span>
                                                            <span className="text-sm text-gray-500">({item.targetType})</span>
                                                            {item.isNewRoom && (
                                                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
                                                                    สร้างห้องใหม่
                                                                </span>
                                                            )}
                                                        </div>
                                                    }
                                                    subtitle={
                                                        <span className="text-xs text-gray-500">
                                                            นักเรียน {item.students.filter(s => s.selected).length}/{item.students.length} คน
                                                        </span>
                                                    }
                                                >
                                                    <div className="p-2 space-y-4">
                                                        {/* เลือกครู */}
                                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                            <label className="text-xs font-medium text-gray-500 mb-1 block">
                                                                ครูประจำชั้นปีใหม่ ({getGradeLabel(item.targetGrade)})
                                                            </label>
                                                            <Select
                                                                size="sm"
                                                                placeholder="เลือกครูประจำชั้น"
                                                                selectedKeys={item.targetTeacherId ? [item.targetTeacherId] : []}
                                                                onChange={(e) => handlePlanChangeTeacher(idx, e.target.value)}
                                                                classNames={{ trigger: "bg-white" }}
                                                            >
                                                                {allTeachers.map((t) => (
                                                                    <SelectItem key={t.teachers_id} value={t.teachers_id}>
                                                                        {t.firstname} {t.lastname}
                                                                    </SelectItem>
                                                                ))}
                                                            </Select>
                                                            {item.isNewRoom && !item.targetTeacherId && (
                                                                <p className="text-xs text-red-500 mt-1">* จำเป็นต้องเลือกครูเพื่อสร้างห้องใหม่</p>
                                                            )}
                                                        </div>

                                                        {/* รายชื่อนักเรียน */}
                                                        <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {item.students.map((stu, sIdx) => (
                                                                    <Checkbox
                                                                        key={stu.id}
                                                                        isSelected={stu.selected}
                                                                        onValueChange={() => handleToggleStudent(idx, sIdx)}
                                                                        size="sm"
                                                                    >
                                                                        <span className="text-sm">{stu.name}</span>
                                                                    </Checkbox>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>

                                        {previewPlan.length === 0 && (
                                            <div className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">
                                                ไม่พบห้องเรียนที่สามารถเลื่อนชั้นได้ <br />(หรือปีการศึกษาปลายทางไม่ถูกต้อง)
                                            </div>
                                        )}
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                {promoteStep === 1 ? (
                                    <>
                                        <Button variant="light" onPress={() => setIsPromoteOpen(false)}>ยกเลิก</Button>
                                        <Button color="primary" onPress={handleGoToReview} isLoading={isLoadingPromote}>
                                            ตรวจสอบ (ถัดไป)
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="light" onPress={() => setPromoteStep(1)}>ย้อนกลับ</Button>
                                        <Button
                                            color="success"
                                            className="text-white"
                                            onPress={handleConfirmPromote}
                                            isLoading={isLoadingPromote}
                                        >
                                            ยืนยันการเลื่อนชั้น
                                        </Button>
                                    </>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};



const TeacherManagerContent = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        teachers_id: "",
        firstname: "",
        lastname: "",
        email: "",
        tel: "",
        role: "TEACHER"
    });


    const handleTelChange = (e) => {
        const { name, value } = e.target;


        if (/^(0\d*)?$/.test(value)) {
            handleChange(e);

        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setIsLoading(true);
        const data = await studentService.getTeachers();
        setTeachers(data);
        setIsLoading(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const openAddModal = () => {
        setIsEditing(false);
        setFormData({ firstname: "", lastname: "", email: "", tel: "", role: "TEACHER" });
        onOpen();
    };

    const handleEdit = (teacher) => {
        setIsEditing(true);
        setFormData({
            teachers_id: teacher.teachers_id,
            firstname: teacher.firstname,
            lastname: teacher.lastname,
            email: teacher.email || "",
            tel: teacher.tel || "",
            role: teacher.role || "TEACHER"
        });
        onOpen();
    };


    const handleDelete = async (id) => {
        if (!confirm("คุณต้องการลบข้อมูลครูท่านนี้ใช่หรือไม่?")) return;
        try {
            await studentService.deleteTeacher(id);
            alert("ลบข้อมูลสำเร็จ");
            fetchTeachers();
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
        }
    };

    const handleSubmit = async (onClose) => {
        if (!formData.firstname || !formData.email) {
            alert("กรุณากรอกชื่อและอีเมล");
            return;
        }

        try {
            if (isEditing) {
                await studentService.updateTeacher(formData);
                alert("แก้ไขข้อมูลครูสำเร็จ!");
            } else {
                await studentService.addTeacher(formData);
                alert("เพิ่มข้อมูลครูสำเร็จ!");
            }

            setFormData({ firstname: "", lastname: "", email: "", tel: "", role: "TEACHER" });
            fetchTeachers();
            onClose();
        } catch (error) {
            console.error("Teacher operation error:", error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white" radius="sm">
                <CardBody className="p-6">
                    <div className="justify-items-stretch">
                        <h3 className="text-gray-800 font-semibold">
                            การจัดการครู ({teachers.length})
                        </h3>
                        <p>เพิ่มและจัดการข้อมูลครู</p>
                        <div className="gap-2 flex justify-end mb-4">

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={() => alert("ยังไม่เสร็จ")}
                            >
                                <FileDown size={16} />
                                <span className="ml-1 font-medium">โหลด Template</span>
                            </Button>

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={() => alert("ยังไม่เสร็จ")}
                            >
                                <Upload size={16} />
                                <span className="ml-1 font-medium">นำเข้า Excel</span>
                            </Button>

                            <Button
                                onPress={openAddModal}
                                size="sm"
                                className="bg-green-900 text-white hover:bg-green-800 shadow-sm"
                            >
                                <PlusIcon />
                                <span className="ml-1">เพิ่มครูใหม่</span>
                            </Button>
                        </div>
                    </div>


                    <Table
                        aria-label="Teacher Table"
                        shadow="none"
                        isHeaderSticky
                        classNames={{
                            wrapper: "border-2 border-[#EFECE5] rounded-xl p-0 overflow-hidden",
                            th: "bg-white border-b border-white text-gray-800",
                            td: "py-3 border-b border-[#EFECE5]",
                        }}
                    >
                        <TableHeader>
                            <TableColumn>ชื่อ-นามสกุล</TableColumn>
                            <TableColumn>อีเมล</TableColumn>
                            <TableColumn>เบอร์โทร</TableColumn>
                            <TableColumn>ตำแหน่ง</TableColumn>
                            <TableColumn>ดำเนินการ</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent={"ไม่มีข้อมูลครู"}
                            isLoading={isLoading}
                            loadingContent={
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#6b857a] text-sm">กำลังโหลดข้อมูล...</p>
                                </div>
                            }
                        >
                            {teachers.map((t) => (
                                <TableRow key={t.teachers_id} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                                    <TableCell>{t.firstname} {t.lastname}</TableCell>
                                    <TableCell>{t.email}</TableCell>
                                    <TableCell>{t.tel || "-"}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                            {t.role || "Teacher"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="cursor-pointer active:opacity-50 text-blue-500 hover:text-blue-700"
                                                onClick={() => handleEdit(t)}
                                            >
                                                <SquarePen size={18} />
                                            </span>
                                            <span
                                                className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(t.teachers_id)}
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


            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur" size="lg">
                <ModalContent className="bg-white rounded-2xl shadow-medium border border-gray-100 text-gray-800 p-2">
                    {(onClose) => (
                        <>
                            <ModalHeader>{isEditing ? "แก้ไขข้อมูลครู" : "เพิ่มครูใหม่"}</ModalHeader>
                            <ModalBody className="gap-4">
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">ชื่อจริง</label>
                                        <Input
                                            name="firstname"
                                            value={formData.firstname}
                                            onChange={handleChange}
                                            variant="bordered"
                                            radius="lg"
                                            placeholder="กรอกชื่อจริง"
                                            classNames={{ inputWrapper: "bg-white" }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">นามสกุล</label>
                                        <Input
                                            name="lastname"
                                            value={formData.lastname}
                                            onChange={handleChange}
                                            variant="bordered"
                                            radius="lg"
                                            placeholder="กรอกนามสกุล"
                                            classNames={{ inputWrapper: "bg-white" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">อีเมล</label>
                                    <Input
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="email@school.ac.th"
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">เบอร์โทร</label>
                                    <Input
                                        name="tel"
                                        value={formData.tel}
                                        onChange={(e) => {

                                            handleTelChange(e);
                                        }}
                                        isInvalid={formData.tel.length > 0 && formData.tel.length < 10}

                                        errorMessage="เบอร์โทรศัพท์ต้องมี 10 หลัก"
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="0xxxxxxxxx"
                                        maxLength={10}
                                        type="tel"
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>ยกเลิก</Button>
                                <Button color="primary" onPress={() => handleSubmit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};



export default function App() {

    let tabs = [
        {
            id: "Student",
            label: "นักเรียน",
            content: <StudentManagerContent />,
        },
        {
            id: "Teacher",
            label: "ครู",
            content: <TeacherManagerContent />,
        },
        {
            id: "Classroom",
            label: "ห้องเรียน",
            content: <ClassroomManagerContent />,
        },

    ];

    return (
        <div className="flex w-full flex-col">
            <Tabs
                aria-label="User selection"
                items={tabs}
                radius="full"
                fullWidth
                classNames={{
                    tabList: "bw-full bg-[#f5f0e7] rounded-full p-1 flex overflow-x-auto md:overflow-visible scrollbar-hide",
                    tab: "h-10flex-1 px-6 py-3 whitespace-nowrap flex-shrink-0 md:flex-1 justify-center  rounded-full",
                    tabContent: "group-data-[selected=true]:text-black text-gray-500 font-medium",
                    cursor: "rounded-full",
                    tabContent: "font-semibold text-center",
                }}

            >
                {(item) => (
                    <Tab key={item.id} title={item.label}>
                        {item.content}
                    </Tab>
                )}
            </Tabs>
        </div>
    );
}