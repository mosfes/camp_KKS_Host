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
import * as XLSX from 'xlsx';
import { Trash2, SquarePen, FileDown, Upload } from 'lucide-react';
import studentService from "@/app/service/adminService";
import { PlusIcon } from "./Icons";

const TeacherManager = () => {
    const { showSuccess, showError, showConfirm } = useStatusModal();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [teachers, setTeachers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Excel Import State
    const [importPreviewData, setImportPreviewData] = useState([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isLoadingImport, setIsLoadingImport] = useState(false);
    const [selectedImportKeys, setSelectedImportKeys] = useState(new Set(["all"]));
    const fileInputRef = useRef(null);

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


    const handleDelete = (teacher) => {
        showConfirm(
            "ลบข้อมูลครู",
            `คุณต้องการลบข้อมูลครู "${teacher.firstname} ${teacher.lastname}" ใช่หรือไม่?`,
            async () => {
                try {
                    await studentService.deleteTeacher(teacher.teachers_id);
                    showSuccess("สำเร็จ", "ลบข้อมูลสำเร็จ");
                    fetchTeachers();
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
            fetchTeachers();
            onClose();
        } catch (error) {
            console.error("Teacher operation error:", error);
            showError("เกิดข้อผิดพลาด", error.message);
        }
    };

    const downloadTemplate = () => {
        const headers = ["ชื่อ", "นามสกุล", "อีเมล", "เบอร์โทร"];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Teachers");
        XLSX.writeFile(wb, "teacher_template.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const validData = data.filter(item => (item.firstname && item.email) || (item["ชื่อ"] && item["อีเมล"])).map((item, index) => {
                const firstname = item.firstname || item["ชื่อ"];
                const lastname = item.lastname || item["นามสกุล"] || "";
                const isDuplicate = teachers.some(t =>
                    t.firstname.trim() === firstname.trim() &&
                    t.lastname.trim() === lastname.trim()
                );


                
                let role = "TEACHER";

                return {
                    id: index,
                    firstname: firstname,
                    lastname: lastname,
                    email: item.email || item["อีเมล"],
                    tel: (item.tel || item["เบอร์โทร"]) ? String(item.tel || item["เบอร์โทร"]).replace(/\D/g, '').slice(0, 10) : "",
                    role: role,
                    isDuplicate: isDuplicate
                };
            });

            if (validData.length === 0) {
                showError("ไม่พบข้อมูลที่ถูกต้อง", "กรุณาตรวจสอบไฟล์ Excel (ต้องมีชื่อและอีเมล)");
                e.target.value = null;
                return;
            }

            setImportPreviewData(validData);


            const nonDuplicateKeys = new Set(
                validData
                    .filter(item => !item.isDuplicate)
                    .map(item => String(item.id))
            );

            setSelectedImportKeys(nonDuplicateKeys);
            setIsImportModalOpen(true);
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const confirmImport = async () => {
        setIsLoadingImport(true);
        let successCount = 0;
        let failCount = 0;

        const teachersToImport = importPreviewData.filter(item => selectedImportKeys.has(String(item.id)));

        if (teachersToImport.length === 0) {
            showError("เตือน", "กรุณาเลือกรายการที่ต้องการนำเข้าอย่างน้อย 1 รายการ");
            setIsLoadingImport(false);
            return;
        }

        for (const teacher of teachersToImport) {
            try {
                await studentService.addTeacher(teacher);
                successCount++;
            } catch (error) {
                console.error("Import error for:", teacher, error);
                failCount++;
            }
        }

        setIsLoadingImport(false);
        setIsImportModalOpen(false);
        setImportPreviewData([]);
        fetchTeachers();

        if (failCount > 0) {
            showError("เสร็จสิ้นแบบมีข้อผิดพลาด", `เพิ่มสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
        } else {
            showSuccess("สำเร็จ", `เพิ่มข้อมูลครูสำเร็จทั้งหมด ${successCount} รายการ`);
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
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={downloadTemplate}
                            >
                                <FileDown size={16} />
                                <span className="ml-1 font-medium">โหลด Template</span>
                            </Button>

                            <Button
                                size="sm"
                                variant="bordered"
                                className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm"
                                onPress={() => fileInputRef.current.click()}
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
                                <Button color="danger" variant="light" onPress={onClose}>ยกเลิก</Button>
                                <Button color="primary" onPress={() => handleSubmit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Import Preview Modal */}
            <Modal isOpen={isImportModalOpen} onOpenChange={setIsImportModalOpen} size="2xl" scrollBehavior="inside">
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
                                    disabledKeys={importPreviewData.filter(item => item.isDuplicate).map(item => String(item.id))}
                                    color="primary"
                                >
                                    <TableHeader>
                                        <TableColumn>ชื่อ-นามสกุล</TableColumn>
                                        <TableColumn>อีเมล</TableColumn>
                                        <TableColumn>เบอร์โทร</TableColumn>
                                        <TableColumn>สถานะ</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {importPreviewData.map((teacher) => (
                                            <TableRow key={teacher.id}>
                                                <TableCell>{teacher.firstname} {teacher.lastname}</TableCell>
                                                <TableCell>{teacher.email}</TableCell>
                                                <TableCell>{teacher.tel}</TableCell>
                                                <TableCell>
                                                    {teacher.isDuplicate ? (
                                                        <span className="text-red-500 text-xs bg-red-50 px-2 py-1 rounded-md font-medium">
                                                            มีข้อมูลแล้ว
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded-md font-medium">
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
                                <Button color="danger" variant="light" onPress={onClose}>ยกเลิก</Button>
                                <Button
                                    color="primary"
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

export default TeacherManager;
