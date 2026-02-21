"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
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
      showError("Error", "Base Name is required");

      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/stations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          campId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create base");
      }

      const newBase = await response.json();

      showSuccess("Success", "Base created successfully");
      onClose();
      // Redirect to the new base page
      router.push(
        `/headteacher/dashboard/camp/${campId}/base/${newBase.station_id}`,
      );
    } catch (error) {
      console.error("Error creating base:", error);
      showError("Error", "Failed to create base");
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
      size="2xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">Create Base</h2>
              <p className="text-sm text-gray-500 font-normal">
                Fill in the base information
              </p>
            </ModalHeader>

            <ModalBody className="py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Name
                </label>
                <Input
                  classNames={{
                    inputWrapper:
                      "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors",
                  }}
                  placeholder="e.g., Nature Exploration Base"
                  value={name}
                  variant="bordered"
                  onValueChange={setName}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Description
                </label>
                <Textarea
                  classNames={{
                    inputWrapper:
                      "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors",
                  }}
                  minRows={3}
                  placeholder="Describe the activities and goals of this base"
                  value={description}
                  variant="bordered"
                  onValueChange={setDescription}
                />
              </div>
            </ModalBody>

            <ModalFooter className="p-6 pt-2">
              <Button
                isLoading={loading}
                onPress={handleSubmit}
                className="bg-[#6b857a] text-white font-medium"
                // Note: The design image shows a grey button like this
                startContent={<Save size={18} />}
              >
                Create Base
              </Button>
              <Button
                className="text-gray-700 font-medium bg-[#f5f1e8]"
                variant="light"
                onPress={onClose}
              >
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
