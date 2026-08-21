"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary" | "warning";
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  confirmVariant = "danger",
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal Card */}
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full z-10 border border-gray-100 text-center"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="w-13 h-13 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              {icon || <AlertCircle size={26} />}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6">
              {description}
            </p>

            <div className="flex items-center gap-3">
              <button
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-98 text-gray-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                type="button"
                onClick={onCancel}
              >
                {cancelText}
              </button>

              <button
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs sm:text-sm font-semibold transition-all active:scale-98 cursor-pointer shadow-xs ${
                  confirmVariant === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirmVariant === "warning"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-[#5d7c6f] hover:bg-[#4a6659]"
                }`}
                type="button"
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
