"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { CheckCircle, AlertOctagon, AlertCircle, Info } from "lucide-react";

export type ModalType = "success" | "error" | "warning" | "info";

interface StatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: ModalType;
    title: string;
    message: string;
    onConfirm?: () => void; // Optional for confirmation dialogs
    confirmText?: string;
}

export default function StatusModal({
    isOpen,
    onClose,
    type,
    title,
    message,
    onConfirm,
    confirmText = "ยืนยัน"
}: StatusModalProps) {

    const getIcon = () => {
        switch (type) {
            case "success": return <CheckCircle size={48} className="text-green-500" />;
            case "error": return <AlertOctagon size={48} className="text-red-500" />;
            case "warning": return <AlertCircle size={48} className="text-yellow-500" />;
            case "info": return <Info size={48} className="text-blue-500" />;
        }
    };

    const getColor = () => {
        switch (type) {
            case "success": return "success";
            case "error": return "danger";
            case "warning": return "warning";
            case "info": return "primary";
        }
    };

    // Default confirm text if not provided
    const defaultConfirmText = "ยืนยัน";

    return (
        <Modal isOpen={isOpen} onOpenChange={onClose} backdrop="blur" classNames={{
            base: "bg-[#F5F1E8] rounded-2xl shadow-xl border border-[#6b857a]/20",
            backdrop: "bg-black/60 backdrop-blur-sm",
        }}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 items-center justify-center pt-8">
                            <div className="w-20 h-20 bg-[#e6e2d8] rounded-full flex items-center justify-center mb-4">
                                {getIcon()}
                            </div>
                            <h3 className="text-xl font-bold text-center text-[#5c7267]">{title}</h3>
                        </ModalHeader>
                        <ModalBody className="text-center pb-6">
                            <p className="text-[#6b857a]/80 font-medium text-lg">{message}</p>
                        </ModalBody>
                        <ModalFooter className="justify-center gap-4 pb-8">
                            {onConfirm ? (
                                <>
                                    <Button
                                        className="bg-[#6b857a] text-white rounded-full font-bold w-36 shadow-sm hover:bg-[#5a7268]"
                                        onPress={() => { onConfirm(); onClose(); }}
                                    >
                                        {confirmText === "Confirm" ? defaultConfirmText : confirmText}
                                    </Button>
                                    <Button
                                        className="bg-white border-2 border-[#6b857a] text-[#6b857a] rounded-full font-bold w-36 shadow-sm hover:bg-gray-50"
                                        variant="bordered"
                                        onPress={onClose}
                                    >
                                        ยกเลิก
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    className="bg-[#6b857a] text-white rounded-full font-bold px-12 shadow-sm hover:bg-[#5a7268]"
                                    onPress={onClose}
                                >
                                    ปิด
                                </Button>
                            )}
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
