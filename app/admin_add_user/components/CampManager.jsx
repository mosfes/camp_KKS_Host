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
    Textarea,
    Select,
    SelectItem,
    Chip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Search, MapPin, Users, Calendar, GraduationCap, SquarePen, Trash2, RotateCcw, Trash, Archive, AlertTriangle, ArrowLeft } from 'lucide-react';
import adminService from "@/app/service/adminService";

const CampManager = () => {
    const { showError, showSuccess, showConfirm } = useStatusModal();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [camps, setCamps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCamps, setTotalCamps] = useState(0);
    const [showTrash, setShowTrash] = useState(false);

    // Edit form state
    const [editingCamp, setEditingCamp] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        description: "",
        status: "OPEN",
        start_date: "",
        end_date: "",
        start_regis_date: "",
        end_regis_date: "",
    });

    useEffect(() => {
        setPage(1);
        fetchCamps(1);
    }, [searchTerm, statusFilter, showTrash]);

    const fetchCamps = async (pageNum = 1) => {
        setIsLoading(true);
        try {
            const result = await adminService.getCampsPaginated(
                pageNum, 20, searchTerm,
                showTrash ? "" : statusFilter,
                showTrash
            );
            const newData = Array.isArray(result) ? result : (result.data || []);

            if (pageNum === 1) {
                setCamps(newData);
            } else {
                setCamps(prev => [...prev, ...newData]);
            }

            if (result.pagination) {
                setHasMore(pageNum < result.pagination.totalPages);
                setTotalCamps(result.pagination.total);
            } else {
                setHasMore(false);
                setTotalCamps(newData.length);
            }
        } catch (error) {
            console.error(error);
            showError("เกิดข้อผิดพลาด", "ไม่สามารถดึงข้อมูลค่ายได้");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString("th-TH", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return "-";
        }
    };

    const toInputDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const d = new Date(dateStr);
            return d.toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

    const handleEdit = (camp) => {
        setEditingCamp(camp);
        setFormData({
            name: camp.name || "",
            location: camp.location || "",
            description: camp.description || "",
            status: camp.status || "OPEN",
            start_date: toInputDate(camp.start_date),
            end_date: toInputDate(camp.end_date),
            start_regis_date: toInputDate(camp.start_regis_date),
            end_regis_date: toInputDate(camp.end_regis_date),
        });
        onOpen();
    };

    const handleSubmitEdit = async (onClose) => {
        if (!formData.name) {
            showError("ข้อมูลไม่ครบ", "กรุณากรอกชื่อค่าย");
            return;
        }

        try {
            await adminService.updateCamp(editingCamp.camp_id, {
                name: formData.name,
                location: formData.location,
                description: formData.description,
                status: formData.status,
                start_date: formData.start_date || undefined,
                end_date: formData.end_date || undefined,
                start_regis_date: formData.start_regis_date || undefined,
                end_regis_date: formData.end_regis_date || undefined,
                start_shirt_date: formData.start_regis_date || undefined,
                end_shirt_date: formData.end_regis_date || undefined,
            });
            showSuccess("สำเร็จ", "แก้ไขข้อมูลค่ายสำเร็จ!");
            setPage(1);
            fetchCamps(1);
            onClose();
        } catch (error) {
            console.error("Error updating camp:", error);
            showError("เกิดข้อผิดพลาด", error.message);
        }
    };

    const handleDeleteCamp = (camp) => {
        showConfirm(
            "ลบค่าย",
            `ย้ายค่าย "${camp.name}" ไปรายการที่ลบ?\n\nสามารถกู้คืนได้ภายหลัง`,
            async () => {
                try {
                    const response = await fetch(`/api/camps/${camp.camp_id}`, {
                        method: "DELETE",
                    });
                    const result = await response.json();

                    if (response.ok) {
                        showSuccess("สำเร็จ", "ย้ายค่ายไปรายการที่ลบแล้ว");
                        setPage(1);
                        fetchCamps(1);
                    } else {
                        showError("ผลการดำเนินงาน", `ลบค่ายไม่สำเร็จ: ${result.error}`);
                    }
                } catch (error) {
                    console.error("Error deleting camp:", error);
                    showError("ข้อผิดพลาด", "เกิดข้อผิดพลาดในการลบค่าย");
                }
            },
                        "ย้ายไปรายการที่ลบ"
        );
    };

    const handleRestoreCamp = (camp) => {
        showConfirm(
            "กู้คืนค่าย",
            `คุณต้องการกู้คืนค่าย "${camp.name}" ใช่หรือไม่?`,
            async () => {
                try {
                    await adminService.restoreCamp(camp.camp_id);
                    showSuccess("สำเร็จ", "กู้คืนค่ายสำเร็จ!");
                    setPage(1);
                    fetchCamps(1);
                } catch (error) {
                    console.error("Error restoring camp:", error);
                    showError("เกิดข้อผิดพลาด", error.message);
                }
            },
            "กู้คืน"
        );
    };

    const handlePermanentDelete = (camp) => {
        showConfirm(
            "⚠️ ลบถาวร",
            `คุณต้องการลบค่าย "${camp.name}" อย่างถาวรใช่หรือไม่?\n\nข้อมูลทั้งหมดที่เกี่ยวข้อง (นักเรียน, ครู, ภารกิจ, การประเมิน ฯลฯ) จะถูกลบทั้งหมดและไม่สามารถกู้คืนได้`,
            async () => {
                try {
                    await adminService.permanentDeleteCamp(camp.camp_id);
                    showSuccess("สำเร็จ", "ลบค่ายถาวรสำเร็จ!");
                    setPage(1);
                    fetchCamps(1);
                } catch (error) {
                    console.error("Error permanently deleting camp:", error);
                    showError("เกิดข้อผิดพลาด", error.message);
                }
            },
            "ลบถาวร"
        );
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex flex-col gap-6 w-full pt-4">
            <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white" radius="none">
                <CardBody className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4 w-full">
                        <div>
                            <h3 className="text-gray-800 font-semibold">
                                {showTrash ? "🗑️ ถังขยะค่าย" : "จัดการค่าย"} ({totalCamps})
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {showTrash ? "ค่ายที่ถูกลบ สามารถกู้คืนหรือลบถาวรได้" : "ค่ายทั้งหมดที่สร้างในระบบ"}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                            <div className="flex items-center gap-2 min-w-[180px] flex-1">
                                <Input
                                    aria-label="Search camps"
                                    placeholder="ค้นหาชื่อค่าย..."
                                    size="sm"
                                    isClearable
                                    startContent={<Search size={14} className="text-gray-400" />}
                                    value={searchTerm}
                                    onValueChange={(val) => setSearchTerm(val)}
                                    onClear={() => setSearchTerm("")}
                                    classNames={{ inputWrapper: "bg-white border-gray-200" }}
                                />
                            </div>
                            {!showTrash && (
                                <div className="flex items-center gap-2 min-w-[150px] flex-1">
                                    <Select
                                        aria-label="Filter by status"
                                        size="sm"
                                        selectedKeys={[statusFilter]}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        classNames={{
                                            trigger: "bg-white border-gray-200 w-full",
                                        }}
                                        variant="bordered"
                                    >
                                        <SelectItem key="all" value="all">ทั้งหมด</SelectItem>
                                        <SelectItem key="OPEN" value="OPEN">เปิดรับสมัคร</SelectItem>
                                        <SelectItem key="CLOSED" value="CLOSED">ปิดแล้ว</SelectItem>
                                    </Select>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end mt-2 lg:mt-0">
                                <Button
                                    size="sm"
                                    variant="bordered"
                                    className="bg-white text-gray-600 border-gray-300 hover:bg-gray-50 shadow-sm rounded-full px-4"
                                    onPress={() => {
                                        setShowTrash(!showTrash);
                                        setSearchTerm("");
                                        setPage(1);
                                    }}
                                >
                                    {showTrash ? <ArrowLeft size={16} className="flex-shrink-0" /> : <Archive size={16} className="flex-shrink-0" />}
                                    <span className="ml-1 font-medium hidden sm:inline">
                                        {showTrash ? "กลับหน้าหลัก" : "รายการที่ลบ"}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        {showTrash ? (
                            /* ========== ตาราง ถังขยะ ========== */
                            <Table
                                aria-label="Deleted Camp Table"
                                shadow="none"
                                isHeaderSticky
                                classNames={{
                                    wrapper: "border-2 border-red-200 rounded-xl p-0 overflow-hidden min-w-[700px] md:min-w-full",
                                    th: "bg-red-50 border-b border-red-100 text-gray-800",
                                    td: "py-3 border-b border-red-100",
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>ชื่อค่าย</TableColumn>
                                    <TableColumn>สถานที่</TableColumn>
                                    <TableColumn>ผู้สร้าง</TableColumn>
                                    <TableColumn>วันที่ลบ</TableColumn>
                                    <TableColumn>ดำเนินการ</TableColumn>
                                </TableHeader>
                                <TableBody
                                    emptyContent={"ไม่มีค่ายในรายการที่ลบ"}
                                    isLoading={isLoading}
                                    loadingContent={
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-red-400 text-sm">กำลังโหลดข้อมูล...</p>
                                        </div>
                                    }
                                >
                                    {camps.map((camp) => (
                                        <TableRow key={camp.camp_id} className="hover:bg-red-50/50">
                                            <TableCell>
                                                <span className="font-medium text-gray-600 line-through">{camp.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[150px]">{camp.location}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-gray-500 text-sm">
                                                    {camp.created_by
                                                        ? `${camp.created_by.firstname} ${camp.created_by.lastname}`
                                                        : "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-gray-500 text-sm">
                                                    {formatDate(camp.deletedAt)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-green-100 text-green-700 rounded-full min-w-0 px-3"
                                                        onPress={() => handleRestoreCamp(camp)}
                                                    >
                                                        <RotateCcw size={14} />
                                                        <span className="ml-1 hidden sm:inline">กู้คืน</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-red-100 text-red-600 rounded-full min-w-0 px-3"
                                                        onPress={() => handlePermanentDelete(camp)}
                                                    >
                                                        <AlertTriangle size={14} />
                                                        <span className="ml-1 hidden sm:inline">ลบถาวร</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            /* ========== ตาราง ค่ายปกติ ========== */
                            <Table
                                aria-label="Camp Table"
                                shadow="none"
                                isHeaderSticky
                                classNames={{
                                    wrapper: "border border-gray-100 rounded-xl p-0 overflow-hidden min-w-[900px] md:min-w-full",
                                    th: "bg-gray-50/50 border-b border-gray-100 text-gray-800 font-semibold py-4",
                                    td: "py-4 border-b border-gray-50/50",
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>ชื่อค่าย</TableColumn>
                                    <TableColumn>สถานที่</TableColumn>
                                    <TableColumn>วันที่จัดค่าย</TableColumn>
                                    <TableColumn>สถานะ</TableColumn>
                                    <TableColumn>ผู้สร้าง</TableColumn>
                                    <TableColumn>ผู้เข้าร่วม</TableColumn>
                                    <TableColumn>ดำเนินการ</TableColumn>
                                </TableHeader>
                                <TableBody
                                    emptyContent={"ไม่มีข้อมูลค่าย"}
                                    isLoading={isLoading}
                                    loadingContent={
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-[#6b857a] text-sm">กำลังโหลดข้อมูล...</p>
                                        </div>
                                    }
                                >
                                    {camps.map((camp) => (
                                        <TableRow key={camp.camp_id} className="border-b border-gray-300 last:border-b-0 hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800">{camp.name}</span>
                                                    {camp.description && (
                                                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                                            {camp.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span className="truncate max-w-[150px]">{camp.location}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-gray-600 text-sm">
                                                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                                    <span className="whitespace-nowrap">
                                                        {formatDate(camp.start_date)} - {formatDate(camp.end_date)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className={`border font-medium ${
                                                        camp.status?.toUpperCase() === "OPEN"
                                                            ? "bg-[#eff2f0] text-[#5d7c6f] border-[#dbe6e1]"
                                                            : "bg-[#f5f5f5] text-[#666666] border-[#e5e5e5]"
                                                    }`}
                                                >
                                                    {camp.status?.toUpperCase() === "OPEN" ? "เปิดรับสมัคร" : "ปิดแล้ว"}
                                                </Chip>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-gray-600 text-sm">
                                                    {camp.created_by
                                                        ? `${camp.created_by.firstname} ${camp.created_by.lastname}`
                                                        : "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                                        <GraduationCap size={13} className="text-[#5c98d6]" />
                                                        <span>{camp._count?.student_enrollment || 0} นักเรียน</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                                        <Users size={13} className="text-[#5da382]" />
                                                        <span>{camp._count?.teacher_enrollment || 0} ครู</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="cursor-pointer active:opacity-50 text-sage hover:text-sage-dark"
                                                        onClick={() => handleEdit(camp)}
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <SquarePen size={18} />
                                                    </span>
                                                    <span
                                                        className="cursor-pointer active:opacity-50 text-red-500 hover:text-red-700"
                                                        onClick={() => handleDeleteCamp(camp)}
                                                        title="ลบค่าย"
                                                    >
                                                        <Trash2 size={18} />
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {hasMore && camps.length > 0 && (
                            <div className="flex justify-center mt-6 w-full">
                                <Button
                                    variant="flat"
                                    className="bg-sage/10 text-sage"
                                    onPress={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        fetchCamps(nextPage);
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

            {/* Edit Camp Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" backdrop="blur" size="2xl">
                <ModalContent className="bg-white rounded-2xl shadow-medium border border-gray-100 text-gray-800 p-2">
                    {(onClose) => (
                        <>
                            <ModalHeader>แก้ไขข้อมูลค่าย</ModalHeader>
                            <ModalBody className="gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">ชื่อค่าย</label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="กรอกชื่อค่าย"
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">สถานที่</label>
                                    <Input
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="กรอกสถานที่"
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">รายละเอียด</label>
                                    <Textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        variant="bordered"
                                        radius="lg"
                                        placeholder="รายละเอียดค่าย"
                                        minRows={2}
                                        classNames={{ inputWrapper: "bg-white" }}
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-gray-700">สถานะ</label>
                                    <Select
                                        name="status"
                                        selectedKeys={[formData.status]}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        variant="bordered"
                                        radius="lg"
                                        disallowEmptySelection
                                        classNames={{ trigger: "bg-white" }}
                                    >
                                        <SelectItem key="OPEN" value="OPEN">เปิดรับสมัคร</SelectItem>
                                        <SelectItem key="CLOSED" value="CLOSED">ปิดแล้ว</SelectItem>
                                    </Select>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">วันเริ่มค่าย</label>
                                        <Input
                                            name="start_date"
                                            type="date"
                                            value={formData.start_date}
                                            onChange={handleChange}
                                            variant="bordered"
                                            radius="lg"
                                            classNames={{ inputWrapper: "bg-white" }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">วันสิ้นสุดค่าย</label>
                                        <Input
                                            name="end_date"
                                            type="date"
                                            value={formData.end_date}
                                            onChange={handleChange}
                                            variant="bordered"
                                            radius="lg"
                                            classNames={{ inputWrapper: "bg-white" }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">เปิดลงทะเบียน</label>
                                        <Input
                                            name="start_regis_date"
                                            type="date"
                                            value={formData.start_regis_date}
                                            onChange={handleChange}
                                            variant="bordered"
                                            radius="lg"
                                            classNames={{ inputWrapper: "bg-white" }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-gray-700">ปิดลงทะเบียน</label>
                                        <Input
                                            name="end_regis_date"
                                            type="date"
                                            value={formData.end_regis_date}
                                            onChange={handleChange}
                                            variant="bordered"
                                            radius="lg"
                                            classNames={{ inputWrapper: "bg-white" }}
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose} className="rounded-full">ยกเลิก</Button>
                                <Button className="bg-sage text-white shadow-sm rounded-full" onPress={() => handleSubmitEdit(onClose)}>บันทึก</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};

export default CampManager;
