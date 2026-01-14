"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import StatusModal, { ModalType } from "./StatusModal";

interface StatusModalContextType {
    showSuccess: (title: string, message: string) => void;
    showError: (title: string, message: string) => void;
    showWarning: (title: string, message: string) => void;
    showInfo: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, confirmText?: string) => void;
}

const StatusModalContext = createContext<StatusModalContextType | undefined>(undefined);

export function useStatusModal() {
    const context = useContext(StatusModalContext);
    if (!context) {
        throw new Error("useStatusModal must be used within a StatusModalProvider");
    }
    return context;
}

export function StatusModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<{
        type: ModalType;
        title: string;
        message: string;
        onConfirm?: () => void;
        confirmText?: string;
    }>({
        type: "info",
        title: "",
        message: "",
    });

    const openModal = useCallback((type: ModalType, title: string, message: string, onConfirm?: () => void, confirmText?: string) => {
        setConfig({ type, title, message, onConfirm, confirmText });
        setIsOpen(true);
    }, []);

    const showSuccess = useCallback((title: string, message: string) => openModal("success", title, message), [openModal]);
    const showError = useCallback((title: string, message: string) => openModal("error", title, message), [openModal]);
    const showWarning = useCallback((title: string, message: string) => openModal("warning", title, message), [openModal]);
    const showInfo = useCallback((title: string, message: string) => openModal("info", title, message), [openModal]);

    // For specialized confirmation dialogs (using warning style usually, or info)
    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, confirmText?: string) => {
        openModal("warning", title, message, onConfirm, confirmText);
    }, [openModal]);

    const close = () => setIsOpen(false);

    return (
        <StatusModalContext.Provider value={{ showSuccess, showError, showWarning, showInfo, showConfirm }}>
            {children}
            <StatusModal
                isOpen={isOpen}
                onClose={close}
                type={config.type}
                title={config.title}
                message={config.message}
                onConfirm={config.onConfirm}
                confirmText={config.confirmText}
            />
        </StatusModalContext.Provider>
    );
}
