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
    Pagination,
    DatePicker,
    DateRangePicker,
    HeroUIProvider
} from "@heroui/react";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";
import { useState, useEffect } from "react";
import { Search, MapPin, Users, Calendar, GraduationCap, SquarePen, Trash2, RotateCcw, Trash, Archive, AlertTriangle, ArrowLeft, X, Eye } from 'lucide-react';
import { useRouter } from "next/navigation";
import adminService from "@/app/service/adminService";



const CampManager = () => {
    const router = useRouter();
    const { showError, showSuccess, showConfirm } = useStatusModal();

    const dateValueToString = (date) => {
        if (!date) return "";
        return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
    };


    const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
    const [camps, setCamps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
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

    const [dateErrors, setDateErrors] = useState({ registration: "", camp: "" });

    const validateDates = (data) => {
        const errors = { registration: "", camp: "" };
        const regisEnd = data.end_regis_date ? new Date(data.end_regis_date) : null;
        const campStart = data.start_date ? new Date(data.start_date) : null;
        const campEnd = data.end_date ? new Date(data.end_date) : null;

        if (regisEnd && campStart && regisEnd >= campStart) {
            errors.registration = "วันสิ้นสุดรับสมัคร ต้องมาก่อน วันเริ่มค่าย";
        }
        if (campStart && regisEnd && campStart <= regisEnd) {
            errors.camp = "วันเริ่มค่าย ต้องมาหลัง วันปิดรับสมัคร";
        }
        if (campStart && campEnd && campStart > campEnd) {
            errors.camp = errors.camp || "วันสิ้นสุดค่าย ต้องมาหลัง วันเริ่มค่าย";
        }

        setDateErrors(errors);
        return !errors.registration && !errors.camp;
    };

    useEffect(() => {
        validateDates(formData);
    }, [formData.start_regis_date, formData.end_regis_date, formData.start_date, formData.end_date]);

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
            
            setCamps(newData);

            if (result.pagination) {
                setHasMore(pageNum < result.pagination.totalPages);
                setTotalPages(result.pagination.totalPages || 1);
                setTotalCamps(result.pagination.total);
            } else {
                setHasMore(false);
                setTotalPages(1);
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
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear() + 543;
            return `${day}/${month}/${year}`;
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

        if (!validateDates(formData)) {
            showError("วันที่ไม่ถูกต้อง", "กรุณาตรวจสอบช่วงเวลาให้ถูกต้อง");
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

    const getCampStatusDisplay = (camp) => {
        if (!camp) return { text: "-", colorClass: "bg-gray-100 text-gray-600 border-gray-200" };

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const parseDate = (d) => {
            if (!d) return null;
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date;
        };

        const startRegis = parseDate(camp.start_regis_date);
        const endRegis = parseDate(camp.end_regis_date);
        const startDate = parseDate(camp.start_date);
        const endDate = parseDate(camp.end_date);

        if (endDate && now > endDate) {
            return { text: "สิ้นสุดโครงการ", colorClass: "bg-slate-50 text-slate-400 border-slate-200/50" };
        }
        if (startDate && endDate && now >= startDate && now <= endDate) {
            return { text: "กำลังดำเนินโครงการ", colorClass: "bg-slate-50 text-indigo-400/80 border-slate-200/50" };
        }
        if (startRegis && endRegis && now >= startRegis && now <= endRegis) {
            return { text: "กำลังเปิดลงทะเบียน", colorClass: "bg-slate-50 text-teal-500/70 border-slate-200/50" };
        }
        if (endRegis && startDate && now > endRegis && now < startDate) {
            return { text: "เตรียมดำเนินโครงการ", colorClass: "bg-slate-50 text-amber-500/70 border-slate-200/50" };
        }
        if (startRegis && now < startRegis) {
            return { text: "เตรียมเปิดลงทะเบียน", colorClass: "bg-slate-50 text-gray-400 border-slate-200/50" };
        }

        if (camp.status?.toUpperCase() === "OPEN") {
            return { text: "เปิดลงทะเบียน", colorClass: "bg-slate-50 text-teal-500/70 border-slate-200/50" };
        } else {
            return { text: "ปิดลงทะเบียน", colorClass: "bg-slate-50 text-slate-400 border-slate-200/50" };
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <I18nProvider locale="en-GB">
        <div className="flex flex-col gap-6 w-full pt-4 pb-10">
            <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white" radius="none">
                <CardBody className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4 w-full">
                        <div>
                            <h3 className="text-gray-800 font-semibold">
                                {showTrash ? "ถังขยะค่าย" : "จัดการค่าย"} ({totalCamps})
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
                                    classNames={{ 
                                        inputWrapper: "bg-white border-gray-200",
                                    }}
                                />
                            </div>
                            {!showTrash && (
                                <div className="flex items-center gap-2 min-w-[120px] max-w-[140px] md:min-w-[160px] md:max-w-none flex-1">
                                    <Select
                                        aria-label="Filter by status"
                                        size="sm"
                                        selectedKeys={[statusFilter]}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="max-w-xs"
                                    >
                                        <SelectItem key="all" value="all">ทั้งหมด</SelectItem>
                                        <SelectItem key="REGISTRATION_OPEN" value="REGISTRATION_OPEN">กำลังเปิดลงทะเบียน</SelectItem>
                                        <SelectItem key="ACTIVE" value="ACTIVE">กำลังดำเนินโครงการ</SelectItem>
                                        <SelectItem key="FINISHED" value="FINISHED">สิ้นสุดโครงการ</SelectItem>
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
                                    wrapper: "border border-gray-100 rounded-xl p-0 min-w-[800px] md:min-w-full bg-white overflow-x-auto",
                                    th: "bg-gray-50/50 border-b border-gray-100 text-gray-800 font-semibold py-4",
                                    td: "py-4 border-b border-gray-50/50",
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
                                    wrapper: "border border-gray-100 rounded-xl p-0 min-w-[1100px] bg-white overflow-x-auto",
                                    th: "bg-gray-50/50 border-b border-gray-100 text-gray-800 font-semibold py-4",
                                    td: "py-4 border-b border-gray-50/50",
                                }}
                            >
                                <TableHeader>
                                    <TableColumn>ชื่อค่าย</TableColumn>
                                    <TableColumn>สถานที่</TableColumn>
                                    <TableColumn>กำหนดการ</TableColumn>
                                    <TableColumn>สถานะ</TableColumn>
                                    <TableColumn>ผู้สร้าง</TableColumn>
                                    <TableColumn className="w-[150px]">ระดับ/ห้องเรียน</TableColumn>
                                    <TableColumn className="w-[120px]">ดำเนินการ</TableColumn>
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
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <Users size={13} className="text-slate-400 flex-shrink-0" />
                                                        <span className="truncate">ลงทะเบียน: {formatDate(camp.start_regis_date)} - {formatDate(camp.end_regis_date)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                                        <Calendar size={13} className="text-slate-300 flex-shrink-0" />
                                                        <span className="truncate">วันจัดค่าย: {formatDate(camp.start_date)} - {formatDate(camp.end_date)}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    size="sm"
                                                    variant="flat"
                                                    className={`border font-medium ${getCampStatusDisplay(camp).colorClass}`}
                                                >
                                                    {getCampStatusDisplay(camp).text}
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
                                                <span className="text-xs text-slate-500 leading-tight">
                                                    {(() => {
                                                        if (!camp.camp_classroom || camp.camp_classroom.length === 0)
                                                            return <span className="text-slate-300">-</span>;
                                                        const gradeMap = {
                                                            "Level_1": "ม.1", "Level_2": "ม.2", "Level_3": "ม.3",
                                                            "Level_4": "ม.4", "Level_5": "ม.5", "Level_6": "ม.6"
                                                        };
                                                        const grouped = {};
                                                        camp.camp_classroom.forEach((cc) => {
                                                            const type = cc.classroom?.classroom_types?.name || "ไม่ระบุ";
                                                            const grade = gradeMap[cc.classroom?.grade] || cc.classroom?.grade;
                                                            if (!grouped[type]) grouped[type] = [];
                                                            if (grade) grouped[type].push(grade);
                                                        });
                                                        return Object.entries(grouped)
                                                            .map(([type, grades]) => `${type} (${grades.join(", ")})`)
                                                            .join(", ");
                                                    })()}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="cursor-pointer active:opacity-50 text-blue-500 hover:text-blue-700 transition-colors"
                                                        onClick={() => router.push(`/headteacher/dashboard/camp/${camp.camp_id}`)}
                                                        title="ดูหน้าแสดงผลแบบหัวหน้าค่าย"
                                                    >
                                                        <Eye size={18} />
                                                    </span>
                                                    <span
                                                        className="cursor-pointer active:opacity-50 text-sage hover:text-sage-dark"
                                                        onClick={() => handleEdit(camp)}
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <SquarePen size={18} />
                                                    </span>
                                                    <span
                                                        className="cursor-pointer active:opacity-50 text-[#E84A5F] hover:text-[#FF847C] transition-colors"
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
                    </div>

                    <div className="flex flex-col md:flex-row items-center mt-6 gap-4 px-2 relative w-full">
                        <div className="text-sm text-gray-500 order-2 md:order-1 md:absolute md:left-2">
                            แสดง {camps.length} จาก {totalCamps} รายการ
                        </div>
                        <div className="flex-1 flex justify-center order-1 md:order-2 w-full">
                        {totalPages > 1 && (
                                <Pagination
                                    isCompact
                                    showControls
                                    total={totalPages}
                                    page={page}
                                    onChange={(newPage) => {
                                        setPage(newPage);
                                        fetchCamps(newPage);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="overflow-x-auto"
                                    classNames={{
                                        cursor: "bg-[#5d7c6f] text-white",
                                    }}
                                />
                        )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Edit Camp Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <div className="relative bg-white rounded-2xl shadow-medium border border-gray-100 text-gray-800 p-6 flex flex-col gap-4 max-w-2xl w-full max-h-[90vh]">
                        <div className="flex justify-between items-center pb-2 border-b">
                            <h2 className="text-xl font-bold">แก้ไขข้อมูลค่าย</h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="overflow-y-auto flex-1 pr-2 flex flex-col gap-4">
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


                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                                ช่วงเวลารับสมัคร
                                            </label>
                                            <DateRangePicker
                                                aria-label="Registration Period"
                                                className="w-full h-[56px]"
                                                errorMessage={dateErrors.registration}
                                                isInvalid={!!dateErrors.registration}
                                                formatOptions={{ day: "2-digit", month: "2-digit", year: "numeric" }}
                                                value={formData.start_regis_date && formData.end_regis_date ? {
                                                    start: parseDate(formData.start_regis_date.split('T')[0]),
                                                    end: parseDate(formData.end_regis_date.split('T')[0])
                                                } : null}
                                                onChange={(range) => {
                                                    if (!range) return;
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        start_regis_date: dateValueToString(range.start),
                                                        end_regis_date: dateValueToString(range.end)
                                                    }));
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#6b857a] uppercase mb-1">
                                                วันจัดค่าย
                                            </label>
                                            <DateRangePicker
                                                aria-label="Camp Period"
                                                className="w-full h-[56px]"
                                                errorMessage={dateErrors.camp}
                                                isInvalid={!!dateErrors.camp}
                                                formatOptions={{ day: "2-digit", month: "2-digit", year: "numeric" }}
                                                value={formData.start_date && formData.end_date ? {
                                                    start: parseDate(formData.start_date.split('T')[0]),
                                                    end: parseDate(formData.end_date.split('T')[0])
                                                } : null}
                                                onChange={(range) => {
                                                    if (!range) return;
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        start_date: dateValueToString(range.start),
                                                        end_date: dateValueToString(range.end)
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
                            <Button color="danger" variant="light" onPress={onClose} className="rounded-full">ยกเลิก</Button>
                            <Button className="bg-sage text-white shadow-sm rounded-full" onPress={() => handleSubmitEdit(onClose)}>บันทึก</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </I18nProvider>
    );
};

export default CampManager;
