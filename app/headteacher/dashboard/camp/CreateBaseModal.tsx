"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import { useStatusModal } from "@/components/StatusModalProvider";

interface CreateBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
}

export default function CreateBaseModal({
  isOpen,
  onClose,
  campId,
}: CreateBaseModalProps) {
  const router = useRouter();
  const { showError, showSuccess } = useStatusModal();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError("ข้อผิดพลาด", "กรุณากรอกชื่อฐานกิจกรรม");

      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/stations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, campId }),
      });

      if (!response.ok) throw new Error("Failed to create base");

      const newBase = await response.json();

      showSuccess("สำเร็จ", "สร้างฐานกิจกรรมสำเร็จ");
      onClose();
      router.push(
        `/headteacher/dashboard/camp/${campId}/base/${newBase.station_id}`,
      );
    } catch (error) {
      console.error("Error creating base:", error);
      showError("ข้อผิดพลาด", "สร้างฐานกิจกรรมไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white rounded-2xl shadow-xl",
        backdrop: "bg-black/60 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      size="lg"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                สร้างฐานกิจกรรม
              </h2>
              <p className="text-sm text-gray-500 font-normal">
                กรอกข้อมูลฐานกิจกรรม
              </p>
            </ModalHeader>

            <ModalBody className="py-6 space-y-4 px-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อฐานกิจกรรม <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] focus:border-[#6b857a] outline-none transition-colors"
                  placeholder="เช่น ฐานสำรวจธรรมชาติ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] focus:border-[#6b857a] outline-none transition-colors resize-none"
                  placeholder="อธิบายกิจกรรมและเป้าหมายของฐานนี้"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </ModalBody>

            <ModalFooter className="p-6 pt-2 flex-col gap-2">
              <Button
                fullWidth
                className="bg-[#6b857a] text-white rounded-xl font-bold shadow-lg hover:bg-[#5a7268]"
                isLoading={loading}
                size="lg"
                startContent={!loading && <Save size={18} />}
                onPress={handleSubmit}
              >
                สร้างฐานกิจกรรม
              </Button>
              <Button
                fullWidth
                className="font-medium text-gray-600"
                size="lg"
                variant="light"
                onPress={onClose}
              >
                ยกเลิก
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
