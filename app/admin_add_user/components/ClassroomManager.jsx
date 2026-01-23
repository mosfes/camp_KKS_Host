"use client";
import { useStatusModal } from "@/components/StatusModalProvider";
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
    Checkbox
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Trash2, SquarePen, Settings } from 'lucide-react';
import studentService from "@/app/service/adminService";
import { PlusIcon } from "./Icons";

const ClassroomManager = () => {
    const { showSuccess, showError, showConfirm } = useStatusModal();
    const [isLoading, setIsLoading] = useState(true);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [classrooms, setClassrooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("all");


    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);



    const [newYearInput, setNewYearInput] = useState("");

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
        if (!newTypeData.name) return showError("ข้อมูลไม่ครบ", "กรุณาระบุชื่อประเภท");
        if (newTypeData.valid_grades.length === 0) return showError("ข้อมูลไม่ครบ", "กรุณาเลือกอย่างน้อย 1 ระดับชั้น");

        try {
            await studentService.addClassroomType({
                name: newTypeData.name,
                valid_grades: newTypeData.valid_grades.join(",")
            });
            showSuccess("สำเร็จ", "เพิ่มข้อมูลสำเร็จ");
            setNewTypeData({ name: "", valid_grades: [] });
            const types = await studentService.getClassroomTypes();
            setClassroomTypes(types);
        } catch (e) {
            showError("เกิดข้อผิดพลาด", e.message);
        }
    };

    const handleDeleteClassroomType = (id) => {
        showConfirm(
            "ลบประเภทห้องเรียน",
            "ยืนยันการลบประเภทห้องเรียนนี้?",
            async () => {
                try {
                    await studentService.deleteClassroomType(id);
                    const types = await studentService.getClassroomTypes();
                    setClassroomTypes(types);
                    showSuccess("สำเร็จ", "ลบข้อมูลสำเร็จ");
                } catch (e) {
                    showError("เกิดข้อผิดพลาด", e.message);
                }
            },
            "ลบ"
        );
    };

    const handleToggleLevel = (level) => {
        const middle = ['1', '2', '3'];
        const high = ['4', '5', '6'];
        const targetGrades = level === 'middle' ? middle : high;

        setNewTypeData(prev => {
            const allSelected = targetGrades.every(g => prev.valid_grades.includes(g));
            let newGrades;
            if (allSelected) {
  
                newGrades = prev.valid_grades.filter(g => !targetGrades.includes(g));
            } else {
                newGrades = [...new Set([...prev.valid_grades, ...targetGrades])].sort();
            }
            return { ...prev, valid_grades: newGrades };
        });
    };

    const handleAddAcademicYear = async () => {
        const cleanInput = newYearInput.trim();
        if (!cleanInput || cleanInput.length !== 4) {
            return showError("ข้อมูลไม่ถูกต้อง", "กรุณาระบุปีให้ถูกต้อง (4 หลัก)");
        }

        let yearToSend = parseInt(cleanInput);
        if (isNaN(yearToSend)) return showError("ข้อมูลไม่ถูกต้อง", "กรุณาระบุปีเป็นตัวเลข");

        if (yearToSend > 2400) {
            yearToSend = yearToSend - 543;
        }

        try {
            await studentService.addAcademicYear(yearToSend);
            showSuccess("สำเร็จ", `เพิ่มปีการศึกษา ${yearToSend + 543} สำเร็จ`);
            setNewYearInput("");
            fetchData();
        } catch (e) {
            showError("เกิดข้อผิดพลาด", e.message);
        }
    };

    const handleDeleteAcademicYear = (id) => {
        showConfirm(
            "ลบปีการศึกษา",
            "ยืนยันการลบปีการศึกษา? ข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ",
            async () => {
                try {
                    await studentService.deleteAcademicYear(id);
                    showSuccess("สำเร็จ", "ลบข้อมูลสำเร็จ");
                    fetchData();
                } catch (e) {
                    showError("เกิดข้อผิดพลาด", e.message);
                }
            },
            "ลบ"
        );
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

    const handleDeleteClassroom = (classroom) => {

        const gradeLabel = gradeOptions.find(g => g.key === classroom.grade)?.label || classroom.grade;
        const yearLabel = classroom.academic_years ? parseInt(classroom.academic_years.year) + 543 : "";
        const roomType = displayRoomName(classroom.type_classroom);

        showConfirm(
            "ลบห้องเรียน",
            `คุณต้องการลบข้อมูลห้องเรียน "${gradeLabel} - ${roomType} (ปีการศึกษา ${yearLabel})" ใช่หรือไม่?`,
            async () => {
                try {
                    await studentService.deleteClassroom(classroom.classroom_id);
                    showSuccess("สำเร็จ", "ลบสำเร็จ");
                    fetchData();
                } catch (error) {
                    showError("เกิดข้อผิดพลาด", error.message);
                }
            },
            "ลบ"
        );
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
            showError("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบ");
            return;
        }
        try {
            if (isEditing) {
                await studentService.updateClassroom({ ...formData, classroom_id: editId });
                showSuccess("สำเร็จ", "แก้ไขข้อมูลห้องเรียนสำเร็จ!");
            } else {
                await studentService.addClassroom(formData);
                showSuccess("สำเร็จ", "เพิ่มข้อมูลห้องเรียนสำเร็จ!");
            }
            fetchData();
            onClose();
        } catch (error) {
            showError("เกิดข้อผิดพลาด", error.message);
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
                                className="text-gray-500 rounded-full"
                            >
                                <Settings size={20} />
                            </Button>
                            <Button onPress={handleOpenAdd} size="sm" className="bg-sage text-white hover:bg-sage-dark shadow-sm rounded-full">
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
                                                className="cursor-pointer active:opacity-50 text-sage hover:text-sage-dark"
                                                onClick={() => handleEditClassroom(room)}
                                            >
                                                <SquarePen size={18} />
                                            </span>
                                            <span
                                                className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                                                onClick={() => handleDeleteClassroom(room)}
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
                                            <Button onClick={handleAddAcademicYear} className="bg-sage text-white shadow-sm rounded-full">เพิ่ม</Button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {years.map(y => (
                                                <div key={y.years_id} className="p-2 border rounded-xl flex justify-between items-center text-sm">
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
                                                <Button onClick={handleAddClassroomType} className="bg-sage text-white shadow-sm rounded-full">บันทึก</Button>
                                            </div>
                                            <div className="flex gap-4">
                                                <span className="text-sm pt-1">ใช้กับระดับชั้น:</span>
                                                <div className="flex gap-4">
                                                    <Checkbox
                                                        isSelected={['1', '2', '3'].every(g => newTypeData.valid_grades.includes(g))}
                                                        onValueChange={() => handleToggleLevel('middle')}
                                                    >
                                                        ม.ต้น
                                                    </Checkbox>
                                                    <Checkbox
                                                        isSelected={['4', '5', '6'].every(g => newTypeData.valid_grades.includes(g))}
                                                        onValueChange={() => handleToggleLevel('high')}
                                                    >
                                                        ม.ปลาย
                                                    </Checkbox>
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
                                <Button color="danger" variant="light" onPress={onClose} className="rounded-full">ปิด</Button>
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
                                <Button color="danger" variant="light" onPress={onClose} className="rounded-full">ยกเลิก</Button>
                                <Button className="bg-sage text-white shadow-sm rounded-full" onPress={() => handleSubmit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div >
    );
};

export default ClassroomManager;
