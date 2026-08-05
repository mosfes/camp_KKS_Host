"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Input, Select, SelectItem, Switch } from "@heroui/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import {
  ArrowDown,
  ArrowUp,
  ListChecks,
  Pencil,
  Plus,
  Search,
} from "lucide-react";

import { useStatusModal } from "@/components/StatusModalProvider";

const categories = {
  STANDARD: "มาตรฐานการศึกษา",
  STRATEGY: "กลยุทธ์โรงเรียน",
};

const emptyForm = {
  category: "STANDARD",
  label: "",
  is_active: true,
};

export default function DocumentReferenceOptionsManager() {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const { showError, showSuccess, setIsLoading } = useStatusModal();
  const [options, setOptions] = useState([]);
  const [category, setCategory] = useState("STANDARD");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/document-reference-options?includeInactive=true",
      );
      if (!response.ok) throw new Error();
      setOptions(await response.json());
    } catch {
      showError("ข้อผิดพลาด", "ไม่สามารถโหลดตัวเลือกเอกสารได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const filtered = useMemo(
    () =>
      options.filter(
        (option) =>
          option.category === category &&
          option.label.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [options, category, query],
  );

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, category });
    onOpen();
  };

  const openEdit = (option) => {
    setEditingId(option.document_reference_option_id);
    setForm({
      category: option.category,
      label: option.label,
      is_active: option.is_active,
    });
    onOpen();
  };

  const save = async () => {
    if (!form.label.trim()) {
      showError("ข้อมูลไม่ครบ", "กรุณากรอกข้อความตัวเลือก");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        editingId
          ? `/api/document-reference-options/${editingId}`
          : "/api/document-reference-options",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      onClose();
      await loadOptions();
      showSuccess(
        "สำเร็จ",
        editingId ? "แก้ไขตัวเลือกแล้ว" : "เพิ่มตัวเลือกแล้ว",
      );
    } catch (error) {
      showError("บันทึกไม่สำเร็จ", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (option) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/document-reference-options/${option.document_reference_option_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !option.is_active }),
        },
      );
      if (!response.ok) throw new Error();
      await loadOptions();
    } catch {
      showError("ข้อผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้");
    } finally {
      setIsLoading(false);
    }
  };

  const moveOption = async (option, direction) => {
    if (query.trim()) {
      showError("กรุณาล้างคำค้นหา", "ล้างคำค้นหาก่อนจัดลำดับรายการ");
      return;
    }
    const categoryOptions = options.filter(
      (item) => item.category === category,
    );
    const currentIndex = categoryOptions.findIndex(
      (item) =>
        item.document_reference_option_id ===
        option.document_reference_option_id,
    );
    const targetIndex = currentIndex + direction;
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= categoryOptions.length
    )
      return;

    const reordered = [...categoryOptions];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];

    setIsLoading(true);
    try {
      const response = await fetch("/api/document-reference-options", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: reordered.map(
            (item) => item.document_reference_option_id,
          ),
        }),
      });
      if (!response.ok) throw new Error();
      await loadOptions();
    } catch {
      showError("จัดลำดับไม่สำเร็จ", "กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">คลังตัวเลือกเอกสาร</h2>
            <p className="mt-1 text-sm text-gray-500">
              ผู้จัดทำเอกสารเลือกได้หลายรายการ
              และยังกรอกหัวข้ออื่นเพิ่มเติมเองได้
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              isClearable
              placeholder="ค้นหาตัวเลือก"
              startContent={<Search className="text-gray-400" size={16} />}
              value={query}
              onClear={() => setQuery("")}
              onValueChange={setQuery}
            />
            <Button
              className="bg-[#5d7c6f] text-white"
              startContent={<Plus size={18} />}
              onPress={openAdd}
            >
              เพิ่มตัวเลือก
            </Button>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          {Object.entries(categories).map(([key, label]) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium ${category === key ? "bg-[#5d7c6f] text-white" : "bg-gray-100 text-gray-600"}`}
              key={key}
              onClick={() => setCategory(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            กำลังโหลดข้อมูล...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-500">
            <ListChecks className="text-gray-300" size={42} />
            ยังไม่มีตัวเลือกในหมวดนี้
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((option) => (
              <div
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                key={option.document_reference_option_id}
              >
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">
                    {option.label}
                  </p>
                </div>
                <Chip
                  color={option.is_active ? "success" : "default"}
                  size="sm"
                  variant="flat"
                >
                  {option.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                </Chip>
                <Switch
                  isSelected={option.is_active}
                  size="sm"
                  onValueChange={() => toggleActive(option)}
                />
                <div className="flex gap-1">
                  <Button
                    isIconOnly
                    aria-label="เลื่อนขึ้น"
                    isDisabled={
                      Boolean(query.trim()) ||
                      filtered[0]?.document_reference_option_id ===
                        option.document_reference_option_id
                    }
                    size="sm"
                    variant="flat"
                    onPress={() => moveOption(option, -1)}
                  >
                    <ArrowUp size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    aria-label="เลื่อนลง"
                    isDisabled={
                      Boolean(query.trim()) ||
                      filtered[filtered.length - 1]
                        ?.document_reference_option_id ===
                        option.document_reference_option_id
                    }
                    size="sm"
                    variant="flat"
                    onPress={() => moveOption(option, 1)}
                  >
                    <ArrowDown size={16} />
                  </Button>
                </div>
                <Button
                  isIconOnly
                  aria-label="แก้ไข"
                  size="sm"
                  variant="light"
                  onPress={() => openEdit(option)}
                >
                  <Pencil size={17} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                {editingId ? "แก้ไขตัวเลือก" : "เพิ่มตัวเลือกเอกสาร"}
              </ModalHeader>
              <ModalBody>
                <Select
                  label="หมวด"
                  selectedKeys={new Set([form.category])}
                  onSelectionChange={(keys) =>
                    setForm({ ...form, category: Array.from(keys)[0] })
                  }
                >
                  <SelectItem key="STANDARD">มาตรฐานการศึกษา</SelectItem>
                  <SelectItem key="STRATEGY">กลยุทธ์โรงเรียน</SelectItem>
                </Select>
                <Input
                  isRequired
                  label="ข้อความตัวเลือก"
                  value={form.label}
                  onValueChange={(value) => setForm({ ...form, label: value })}
                />
                <Switch
                  isSelected={form.is_active}
                  onValueChange={(value) =>
                    setForm({ ...form, is_active: value })
                  }
                >
                  แสดงในรายการเลือก
                </Switch>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={close}>
                  ยกเลิก
                </Button>
                <Button className="bg-[#5d7c6f] text-white" onPress={save}>
                  บันทึก
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
