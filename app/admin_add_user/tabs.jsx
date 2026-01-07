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

    // State สำหรับการเพิ่มปีการศึกษา
    const [isAddingYear, setIsAddingYear] = useState(false);
    const [newYearInput, setNewYearInput] = useState("");

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

    const getRoomOptions = (gradeKey) => {
        const gradeLevel = gradeOptions.find(g => g.key === gradeKey)?.value || 0;
        let options = [];
        if (gradeLevel >= 1 && gradeLevel <= 6) options.push({ key: "Gifted", label: "ห้อง Gifted" });
        if (gradeLevel >= 4 && gradeLevel <= 6) options.push({ key: "Morkrajay", label: "ห้องมอกระจาย" });

        if (options.length === 0 && !gradeKey) {
            return [{ key: "Gifted", label: "ห้อง Gifted" }, { key: "Morkrajay", label: "ห้องมอกระจาย" }];
        }
        return options;
    };

    const fetchData = async () => {
        setIsLoading(true);
        const [clsData, tchData, yearData] = await Promise.all([
            studentService.getClassrooms(),
            studentService.getTeachers(),
            studentService.getAcademicYears()
        ]);
        setClassrooms(clsData);
        setTeachers(tchData);
        setYears(yearData);

        if (yearData.length > 0 && !formData.academic_year_id) {
            setFormData(prev => ({ ...prev, academic_year_id: yearData[0].years_id.toString() }));
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectChange = (key, value) => {
        setFormData(prev => {
            const newData = { ...prev, [key]: value };
            if (key === 'grade') newData.type_classroom = "";
            return newData;
        });
    };

    const handleAddYear = async () => {

        const cleanInput = newYearInput.trim();

        if (!cleanInput || cleanInput.length !== 4) {
            alert("กรุณากรอกปีให้ถูกต้อง (4 หลัก)");
            return;
        }

        let yearToSend = parseInt(cleanInput);

        // 2. เช็คว่าเป็น พ.ศ. หรือไม่? (ถ้ามากกว่า 2400 สันนิษฐานว่าเป็น พ.ศ.)
        // แล้วแปลงเป็น ค.ศ. บันทึกลงฐานข้อมูล
        if (yearToSend > 2400) {
            yearToSend = yearToSend - 543;
        }

        try {
            // ส่งค่าที่แปลงเป็น ค.ศ. แล้ว (เช่น 2025) ไปที่ API
            const addedYear = await studentService.addAcademicYear(yearToSend);
            alert(`เพิ่มปีการศึกษา ${addedYear.year + 543} สำเร็จ`); // แจ้งเตือนเป็น พ.ศ. ให้คนใช้งงน้อยลง

            const updatedYears = await studentService.getAcademicYears();
            setYears(updatedYears);
            setFormData(prev => ({ ...prev, academic_year_id: addedYear.years_id.toString() }));

            setIsAddingYear(false);
            setNewYearInput("");
        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    };

    const handleSubmit = async (onClose) => {
        if (!formData.grade || !formData.teacher_id || !formData.type_classroom) {
            alert("กรุณากรอกข้อมูลให้ครบ");
            return;
        }
        try {
            await studentService.addClassroom(formData);
            alert("ตั้งค่าห้องเรียนสำเร็จ!");
            fetchData();
            onClose();
        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
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
                                ข้อมูลห้องเรียนและครูประจำชั้น
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                ตรวจสอบและจัดการรายชื่อครูประจำชั้นในแต่ละห้อง
                            </p>
                        </div>

                        <Button onPress={onOpen} variant="light" size="sm" className="text-gray-500 hover:text-gray-700">
                            <Settings size={18} />
                            <span className="ml-1">ตั้งค่าห้องเรียน</span>
                        </Button>
                    </div>

                    <Table aria-label="Classroom Table" shadow="none">
                        <TableHeader>
                            <TableColumn>ระดับชั้น</TableColumn>
                            <TableColumn>ประเภทห้อง</TableColumn>
                            <TableColumn>ครูประจำชั้น</TableColumn>
                            <TableColumn>ปีการศึกษา</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="ยังไม่ได้กำหนดห้องเรียนในปีนี้">
                            {classrooms.map((room) => (
                                <TableRow key={room.classroom_id}>
                                    <TableCell>{gradeOptions.find(g => g.key === room.grade)?.label || room.grade}</TableCell>
                                    <TableCell>{displayRoomName(room.type_classroom)}</TableCell>
                                    <TableCell>{room.teacher?.firstname} {room.teacher?.lastname}</TableCell>
                                    <TableCell>{room.academic_years?.year}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

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
                                <div className="flex items-end gap-2">
                                    {isAddingYear ? (

                                        <div className="flex-1 flex gap-2 items-end">
                                            <Input
                                                label="เพิ่มปีการศึกษา"
                                                placeholder="เช่น 2568"
                                                value={newYearInput}
                                                onChange={(e) => setNewYearInput(e.target.value)}
                                                autoFocus
                                            />
                                            <Button isIconOnly color="success" variant="flat" onPress={handleAddYear}>
                                                <Check size={18} />
                                            </Button>
                                            <Button isIconOnly color="danger" variant="flat" onPress={() => setIsAddingYear(false)}>
                                                <X size={18} />
                                            </Button>
                                        </div>
                                    ) : (

                                        <>
                                            <Select
                                                label="ปีการศึกษา"
                                                className="flex-1"
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

                                            <Button
                                                isIconOnly
                                                variant="faded"
                                                onPress={() => setIsAddingYear(true)}
                                                title="เพิ่มปีการศึกษาใหม่"
                                            >
                                                <PlusIcon />
                                            </Button>
                                        </>
                                    )}
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
        </div >
    );
};

const StudentManagerContent = () => {

    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [students, setStudents] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        students_id: "",
        firstname: "",
        lastname: "",
        email: "",
        tel: "",
        classroom_id: ""

    });

    useEffect(() => {
        fetchStudents();
        fetchClassrooms();
    }, []);

    const fetchStudents = async () => {
        setIsLoading(true);
        const data = await studentService.getStudents();
        setStudents(data);
        setIsLoading(false);
    };

    const fetchClassrooms = async () => {
        const data = await studentService.getClassrooms();
        setClassrooms(data);
    };

    const handleTeacherSelect = (classroomId) => {
        setFormData({ ...formData, classroom_id: classroomId });
    };

    const selectedClassroomInfo = classrooms.find(c => c.classroom_id.toString() === formData.classroom_id.toString());

    const getGradeLabel = (grade) => {
        const map = { "Level_1": "ม.1", "Level_2": "ม.2", "Level_3": "ม.3", "Level_4": "ม.4", "Level_5": "ม.5", "Level_6": "ม.6" };
        return map[grade] || grade;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (onClose) => {
        if (!formData.students_id || !formData.firstname) {
            alert("กรุณากรอกรหัสนักเรียนและชื่อ");
            return;
        }

        try {
            await studentService.addStudent(formData);
            alert("เพิ่มนักเรียนสำเร็จ!");
            setFormData({ students_id: "", firstname: "", lastname: "", email: "", tel: "", classroom_id: "" });
            fetchStudents();
            onClose();

        } catch (error) {
            console.error("Add student error:", error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    };

    const getStudentClassroom = (stu) => {
        if (stu.classroom_students && stu.classroom_students.length > 0) {
            const cls = stu.classroom_students[0].classroom;
            return `${getGradeLabel(cls.grade)} (${cls.type_classroom})`;
        }
        return "-";
    };

    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white" radius="sm">
                <CardBody className="p-6">
                    <div className="justify-items-stretch">
                        <h3 className="text-gray-800 font-semibold">
                            นักเรียนทั้งหมด
                        </h3>
                        <p>เพิ่มและจัดการนักเรียน</p>
                        <div className="gap-2 flex justify-end mb-4">

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={() => alert("ยังไม่เสร็จ")}
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
                                onPress={onOpen}
                                size="sm"
                                className="bg-green-900 text-white hover:bg-green-800 shadow-sm"
                            >
                                <PlusIcon />
                                <span className="ml-1">เพิ่มนักเรียนใหม่</span>
                            </Button>
                        </div>
                    </div>

                    <Table aria-label="Student Table" shadow="none" classNames={{ th: "bg-transparent text-gray-600 font-medium border-b", td: "py-3" }}>
                        <TableHeader>
                            <TableColumn>รหัสนักเรียน</TableColumn>
                            <TableColumn>ชื่อ-นามสกุล</TableColumn>
                            <TableColumn>อีเมล</TableColumn>
                            <TableColumn>ระดับชั้น/ห้อง</TableColumn>
                            <TableColumn>เบอร์โทร</TableColumn>
                            <TableColumn>ดำเนินการ</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={"ไม่มีข้อมูลนักเรียน"}>
                            {students.map((stu) => (
                                <TableRow key={stu.students_id} className="border-b last:border-b-0 hover:bg-gray-50">
                                    <TableCell>{stu.students_id}</TableCell>
                                    <TableCell>{stu.firstname} {stu.lastname}</TableCell>
                                    <TableCell>{stu.email}</TableCell>

                                    <TableCell>{getStudentClassroom(stu)}</TableCell>
                                    <TableCell>{stu.tel}</TableCell>
                                    <TableCell>
                                        <span className="cursor-pointer active:opacity-50 flex items-center">
                                            <DeleteIcon />
                                        </span>
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
                            <ModalHeader>เพิ่มนักเรียนใหม่</ModalHeader>
                            <ModalBody className="gap-4">

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">รหัสนักเรียน</label>
                                    <Input name="students_id" value={formData.students_id} onChange={handleChange} variant="bordered" radius="lg" placeholder="กรอกรหัสนักเรียน" classNames={{ inputWrapper: "bg-white" }} />
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
                                                {/* แสดงชื่อครู และวงเล็บห้องเรียน */}
                                                {room.teacher?.firstname} {room.teacher?.lastname} — {getGradeLabel(room.grade)} ({room.type_classroom})
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>


                                {selectedClassroomInfo && (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex gap-4">
                                        <div>
                                            <span className="text-xs text-gray-500 block">ระดับชั้น</span>
                                            <span className="font-semibold text-green-800">
                                                {getGradeLabel(selectedClassroomInfo.grade)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">ห้อง</span>
                                            <span className="font-semibold text-green-800">
                                                {selectedClassroomInfo.type_classroom}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 block">ปีการศึกษา</span>
                                            <span className="font-semibold text-green-800">
                                                {selectedClassroomInfo.academic_years ? parseInt(selectedClassroomInfo.academic_years.year) + 543 : '-'}
                                            </span>
                                        </div>
                                    </div>
                                )}


                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">อีเมล</label>
                                    <Input name="email" value={formData.email} onChange={handleChange} variant="bordered" radius="lg" placeholder="" classNames={{ inputWrapper: "bg-white" }} />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">เบอร์โทร</label>
                                    <Input name="tel" value={formData.tel} onChange={handleChange} variant="bordered" radius="lg" placeholder="" classNames={{ inputWrapper: "bg-white" }} />
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

const TeacherManagerContent = () => {
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        tel: "",
        role: "TEACHER"
    });

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

    const handleSubmit = async (onClose) => {
        if (!formData.firstname || !formData.email) {
            alert("กรุณากรอกชื่อและอีเมล");
            return;
        }

        try {
            await studentService.addTeacher(formData);
            alert("เพิ่มข้อมูลครูสำเร็จ!");
            setFormData({ firstname: "", lastname: "", email: "", tel: "", role: "TEACHER" });
            fetchTeachers();
            onClose();
        } catch (error) {
            console.error("Add teacher error:", error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white" radius="sm">
                <CardBody className="p-6">
                    <div className="justify-items-stretch">
                        <h3 className="text-gray-800 font-semibold">
                            ครูทั้งหมด ({teachers.length})
                        </h3>
                        <p>จัดการข้อมูลครู</p>
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
                                onPress={onOpen}
                                size="sm"
                                className="bg-green-900 text-white hover:bg-green-800 shadow-sm"
                            >
                                <PlusIcon />
                                <span className="ml-1">เพิ่มครู</span>
                            </Button>
                        </div>
                    </div>

                    <Table aria-label="Teacher Table" shadow="none" classNames={{ th: "bg-transparent text-gray-600 font-medium border-b", td: "py-3" }}>
                        <TableHeader>
                            <TableColumn>ID</TableColumn>
                            <TableColumn>ชื่อ-นามสกุล</TableColumn>
                            <TableColumn>อีเมล</TableColumn>
                            <TableColumn>เบอร์โทร</TableColumn>
                            <TableColumn>ตำแหน่ง</TableColumn>
                            <TableColumn>ดำเนินการ</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={"ไม่มีข้อมูลครู"}>
                            {teachers.map((tch) => (
                                <TableRow key={tch.teachers_id} className="border-b last:border-b-0 hover:bg-gray-50">
                                    <TableCell>{tch.teachers_id}</TableCell>
                                    <TableCell>{tch.firstname} {tch.lastname}</TableCell>
                                    <TableCell>{tch.email}</TableCell>
                                    <TableCell>{tch.tel}</TableCell>
                                    <TableCell>{tch.role}</TableCell>
                                    <TableCell>
                                        <span className="cursor-pointer active:opacity-50 flex items-center">
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                            <SquarePen className="w-5 h-5 ml-3" />
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur">
                <ModalContent className="bg-white rounded-2xl shadow-medium border border-gray-100 text-gray-800 p-2">
                    {(onClose) => (
                        <>
                            <ModalHeader>เพิ่มครูใหม่</ModalHeader>
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
                                            placeholder="ชื่อจริง"
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
                                            placeholder="นามสกุล"
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
                                        placeholder="email@school.edu"
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">เบอร์โทร</label>
                                    <Input
                                        name="tel"
                                        value={formData.tel}
                                        onChange={handleChange}
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="0xxxxxxxxx"
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">ตำแหน่ง</label>
                                    <Select
                                        name="role"
                                        selectedKeys={[formData.role]}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="เลือกตำแหน่ง"
                                        classNames={{
                                            trigger: "bg-white",
                                        }}
                                    >
                                        <SelectItem key="TEACHER" value="TEACHER" textValue="ครู">
                                            ครู
                                        </SelectItem>
                                        <SelectItem key="ADMIN" value="ADMIN" textValue="ผู้ดูแลระบบ (Admin)">
                                            ผู้ดูแลระบบ (Admin)
                                        </SelectItem>
                                    </Select>
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