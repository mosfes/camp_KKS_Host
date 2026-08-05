"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Input, Switch } from "@heroui/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Pencil, Plus, Search, UserRoundCheck } from "lucide-react";

import { useStatusModal } from "@/components/StatusModalProvider";

const EMPTY_FORM = {
  prefix_name: "",
  firstname: "",
  lastname: "",
  position: "",
  is_active: true,
};

export default function DocumentPersonnelManager() {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const { showError, showSuccess, setIsLoading } = useStatusModal();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const loadPeople = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/document-personnel?includeInactive=true",
      );
      if (!response.ok) throw new Error();
      setPeople(await response.json());
    } catch {
      showError("ข้อผิดพลาด", "ไม่สามารถโหลดรายชื่อบุคลากรได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const filteredPeople = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return people;
    return people.filter((person) =>
      `${person.prefix_name || ""}${person.firstname} ${person.lastname} ${person.position}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [people, query]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    onOpen();
  };

  const openEdit = (person) => {
    setEditingId(person.document_personnel_id);
    setForm({
      prefix_name: person.prefix_name || "",
      firstname: person.firstname,
      lastname: person.lastname,
      position: person.position,
      is_active: person.is_active,
    });
    onOpen();
  };

  const save = async () => {
    if (
      !form.firstname.trim() ||
      !form.lastname.trim() ||
      !form.position.trim()
    ) {
      showError("ข้อมูลไม่ครบ", "กรุณากรอกชื่อ นามสกุล และตำแหน่ง");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        editingId
          ? `/api/document-personnel/${editingId}`
          : "/api/document-personnel",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      showSuccess(
        "สำเร็จ",
        editingId ? "แก้ไขบุคลากรเรียบร้อยแล้ว" : "เพิ่มบุคลากรเรียบร้อยแล้ว",
      );
      onClose();
      await loadPeople();
    } catch (error) {
      showError("บันทึกไม่สำเร็จ", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (person) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/document-personnel/${person.document_personnel_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !person.is_active }),
        },
      );
      if (!response.ok) throw new Error();
      await loadPeople();
      showSuccess(
        "สำเร็จ",
        person.is_active ? "ปิดการใช้งานแล้ว" : "เปิดการใช้งานแล้ว",
      );
    } catch {
      showError("ข้อผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">
              รายชื่อสำหรับใช้ในเอกสาร
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              รายชื่อนี้ไม่ใช่บัญชีเข้าสู่ระบบ
              และยังไม่ได้ผูกบทบาทผู้อนุมัติหรือผู้ตรวจสอบ
            </p>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Input
              isClearable
              className="min-w-0 md:w-72"
              placeholder="ค้นหาชื่อหรือตำแหน่ง"
              startContent={<Search className="text-gray-400" size={16} />}
              value={query}
              onClear={() => setQuery("")}
              onValueChange={setQuery}
            />
            <Button
              className="shrink-0 bg-[#5d7c6f] text-white"
              startContent={<Plus size={18} />}
              onPress={openAdd}
            >
              เพิ่มบุคลากร
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            กำลังโหลดข้อมูล...
          </div>
        ) : filteredPeople.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-500">
            <UserRoundCheck size={40} className="text-gray-300" />
            <p>ยังไม่มีรายชื่อบุคลากรในเอกสาร</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPeople.map((person) => (
              <div
                key={person.document_personnel_id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {person.prefix_name || ""}
                      {person.firstname} {person.lastname}
                    </p>
                    <Chip
                      color={person.is_active ? "success" : "default"}
                      size="sm"
                      variant="flat"
                    >
                      {person.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </Chip>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {person.position}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={person.is_active}
                    size="sm"
                    onValueChange={() => toggleActive(person)}
                  >
                    <span className="text-xs text-gray-500">
                      แสดงในตัวเลือก
                    </span>
                  </Switch>
                  <Button
                    isIconOnly
                    aria-label="แก้ไข"
                    size="sm"
                    variant="light"
                    onPress={() => openEdit(person)}
                  >
                    <Pencil size={17} />
                  </Button>
                </div>
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
                {editingId ? "แก้ไขบุคลากร" : "เพิ่มบุคลากรในเอกสาร"}
              </ModalHeader>
              <ModalBody>
                <Input
                  label="คำนำหน้า"
                  placeholder="เช่น นาย, นางสาว"
                  value={form.prefix_name}
                  onValueChange={(value) =>
                    setForm({ ...form, prefix_name: value })
                  }
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    isRequired
                    label="ชื่อ"
                    value={form.firstname}
                    onValueChange={(value) =>
                      setForm({ ...form, firstname: value })
                    }
                  />
                  <Input
                    isRequired
                    label="นามสกุล"
                    value={form.lastname}
                    onValueChange={(value) =>
                      setForm({ ...form, lastname: value })
                    }
                  />
                </div>
                <Input
                  isRequired
                  label="ตำแหน่งที่แสดงในเอกสาร"
                  placeholder="เช่น ผู้อำนวยการโรงเรียนขุขันธ์"
                  value={form.position}
                  onValueChange={(value) =>
                    setForm({ ...form, position: value })
                  }
                />
                <Switch
                  isSelected={form.is_active}
                  onValueChange={(value) =>
                    setForm({ ...form, is_active: value })
                  }
                >
                  แสดงบุคคลนี้ในรายการเลือก
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
