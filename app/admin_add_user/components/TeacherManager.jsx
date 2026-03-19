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
    SelectItem
} from "@heroui/react";
import { useState, useEffect, useRef } from "react";
import { Trash2, Trash, Archive, SquarePen, Search } from 'lucide-react';
import TrashManager from "./TrashManager";
import studentService from "@/app/service/adminService";
import { PlusIcon } from "./Icons";

const TeacherManager = () => {
    const { showSuccess, showError, showConfirm } = useStatusModal();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalTeachers, setTotalTeachers] = useState(0);



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
        setPage(1);
        fetchTeachers(1);
    }, [searchTerm]);

    const fetchTeachers = async (pageNum = 1) => {
        setIsLoading(true);
        try {
            const result = await studentService.getTeachersPaginated(pageNum, 20, searchTerm);
            const newData = Array.isArray(result) ? result : (result.data || []);
            
            if (pageNum === 1) {
                setTeachers(newData);
            } else {
                setTeachers(prev => [...prev, ...newData]);
            }
            
            if (result.pagination) {
                setHasMore(pageNum < result.pagination.totalPages);
                setTotalTeachers(result.pagination.total);
            } else {
                setHasMore(false);
                setTotalTeachers(newData.length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
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


    const handleDelete = (teacher) => {
        showConfirm(
            "ลบข้อมูลครู",
            `คุณต้องการลบข้อมูลครู "${teacher.firstname} ${teacher.lastname}" ใช่หรือไม่?`,
            async () => {
                try {
                    await studentService.deleteTeacher(teacher.teachers_id);
                    showSuccess("สำเร็จ", "ลบข้อมูลสำเร็จ");
                    setPage(1);
                    fetchTeachers(1);
                } catch (error) {
                    showError("เกิดข้อผิดพลาด", error.message);
                }
            },
            "ลบ"
        );
    };

    const handleSubmit = async (onClose) => {
        if (!formData.firstname || !formData.email) {
            showError("ข้อมูลไม่ครบ", "กรุณากรอกชื่อและอีเมล");
            return;
        }

        try {
            if (isEditing) {
                await studentService.updateTeacher(formData);
                showSuccess("สำเร็จ", "แก้ไขข้อมูลครูสำเร็จ!");
            } else {
                await studentService.addTeacher(formData);
                showSuccess("สำเร็จ", "เพิ่มข้อมูลครูสำเร็จ!");
            }

            setFormData({ firstname: "", lastname: "", email: "", tel: "", role: "TEACHER" });
            setPage(1);
            fetchTeachers(1);
            onClose();
        } catch (error) {
            console.error("Teacher operation error:", error);
            showError("เกิดข้อผิดพลาด", error.message);
        }
    };



    if (showTrash) {
        return <TrashManager type="teacher" onBack={() => { setShowTrash(false); setPage(1); fetchTeachers(1); }} />;
    }

    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-[#EFECE5] shadow-sm rounded-lg bg-white" radius="sm">
                <CardBody className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 w-full">
                        <div>
                            <h3 className="text-gray-800 font-semibold">
                                การจัดการครู ({totalTeachers})
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">เพิ่มและจัดการข้อมูลครู</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                            <div className="flex items-center gap-2 min-w-[150px] flex-1 sm:flex-none">
                                <Input
                                    aria-label="Search teachers"
                                    placeholder="ค้นหา..."
                                    size="sm"
                                    isClearable
                                    startContent={<Search size={14} className="text-gray-400" />}
                                    value={searchTerm}
                                    onValueChange={(val) => setSearchTerm(val)}
                                    onClear={() => setSearchTerm("")}
                                    classNames={{ inputWrapper: "bg-white border-gray-200" }}
                                />
                            </div>



                            <Button
                                onPress={openAddModal}
                                size="sm"
                                className="bg-sage text-white hover:bg-sage-dark shadow-sm rounded-full"
                            >
                                <PlusIcon />
                                <span className="ml-1 hidden sm:inline">เพิ่มครูใหม่</span>
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


                    <div className="overflow-x-auto w-full">
                        <Table
                            aria-label="Teacher Table"
                            shadow="none"
                            isHeaderSticky
                            classNames={{
                                wrapper: "border-2 border-[#EFECE5] rounded-xl p-0 overflow-hidden min-w-[700px] md:min-w-full",
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
                                            <span className="px-2 py-1 rounded-full bg-green-100 text-sage text-xs font-medium">
                                                {t.role || "Teacher"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="cursor-pointer active:opacity-50 text-sage hover:text-sage-dark"
                                                    onClick={() => handleEdit(t)}
                                                >
                                                    <SquarePen size={18} />
                                                </span>
                                                <span
                                                    className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                                                    onClick={() => handleDelete(t)}
                                                >
                                                    <Trash2 size={18} />
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {hasMore && teachers.length > 0 && (
                            <div className="flex justify-center mt-6 w-full">
                                <Button
                                    variant="flat"
                                    className="bg-sage/10 text-sage"
                                    onPress={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        fetchTeachers(nextPage);
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

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">ตำแหน่ง</label>
                                    <Select
                                        name="role"
                                        selectedKeys={[formData.role]}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="เลือกตำแหน่ง"
                                        disallowEmptySelection
                                        classNames={{ trigger: "bg-white" }}
                                    >
                                        <SelectItem key="TEACHER" value="TEACHER">ครู (Teacher)</SelectItem>
                                        <SelectItem key="ADMIN" value="ADMIN">ผู้ดูแลระบบ (Admin)</SelectItem>
                                    </Select>
                                </div>
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

export default TeacherManager;
