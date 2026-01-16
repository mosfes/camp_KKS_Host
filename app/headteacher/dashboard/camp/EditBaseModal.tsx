
"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useStatusModal } from "@/components/StatusModalProvider";

interface EditBaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseData: {
        station_id: number;
        name: string;
        description: string;
    } | null;
    onSuccess: () => void;
}

export default function EditBaseModal({ isOpen, onClose, baseData, onSuccess }: EditBaseModalProps) {
    const { showError, showSuccess } = useStatusModal();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (baseData) {
            setName(baseData.name || "");
            setDescription(baseData.description || "");
        }
    }, [baseData]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            showError("Error", "Base Name is required");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/stations/${baseData?.station_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    description,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update base");
            }

            showSuccess("Success", "Base updated successfully");
            onSuccess();
            onClose();

        } catch (error) {
            console.error("Error updating base:", error);
            showError("Error", "Failed to update base");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="2xl"
            backdrop="blur"
            classNames={{
                base: "bg-white rounded-2xl shadow-xl",
                backdrop: "bg-black/60 backdrop-blur-sm",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Base</h2>
                            <p className="text-sm text-gray-500 font-normal">
                                Update the base information
                            </p>
                        </ModalHeader>

                        <ModalBody className="py-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Name
                                </label>
                                <Input
                                    placeholder="e.g., Nature Exploration Base"
                                    value={name}
                                    onValueChange={setName}
                                    variant="bordered"
                                    classNames={{
                                        inputWrapper: "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Base Description
                                </label>
                                <Textarea
                                    placeholder="Describe the activities and goals of this base"
                                    value={description}
                                    onValueChange={setDescription}
                                    variant="bordered"
                                    minRows={3}
                                    classNames={{
                                        inputWrapper: "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                                    }}
                                />
                            </div>
                        </ModalBody>

                        <ModalFooter className="p-6 pt-2">
                            <Button
                                className="bg-[#6b857a] text-white font-medium"
                                startContent={<Save size={18} />}
                                onPress={handleSubmit}
                                isLoading={loading}
                            >
                                Save Changes
                            </Button>
                            <Button
                                variant="light"
                                onPress={onClose}
                                className="text-gray-700 font-medium bg-[#f5f1e8]"
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
