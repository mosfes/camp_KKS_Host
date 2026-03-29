"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { User, HeartPulse, ShieldAlert, FileText, AlignLeft } from "lucide-react";

export default function HomeroomStudentModal({ isOpen, onClose, student }: { isOpen: boolean, onClose: () => void, student: any }) {
  if (!student) return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      backdrop="blur"
      size="md"
      classNames={{
        base: "bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#6b857a]/10",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-8 pt-8 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#5d7c6f] to-[#6b857a] p-0.5 shadow-md">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <User size={32} className="text-[#6b857a]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {student.prefix}{student.firstname} {student.lastname}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs font-semibold">
                      รหัส: {student.id}
                    </span>
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="px-8 py-4 space-y-5">
              
              {student.isSpecialCare ? (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3">
                  <HeartPulse className="text-rose-500 flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-rose-800 font-bold text-sm mb-1">ต้องดูแลเป็นพิเศษ</h4>
                    <p className="text-rose-600/80 text-xs leading-relaxed">
                      นักเรียนคนนี้มีโรคประจำตัวหรืออาการแพ้ที่ต้องเฝ้าระวัง กรุณาตรวจสอบข้อมูลด้านล่างอย่างละเอียด
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f1ede6] border border-[#d4c5b0] rounded-xl p-4 flex gap-3">
                  <HeartPulse className="text-[#6b857a] flex-shrink-0" size={20} />
                  <div>
                    <h4 className="text-[#2d3748] font-bold text-sm">ข้อมูลสุขภาพปกติ</h4>
                    <p className="text-gray-500 text-xs">นักเรียนไม่มีประวัติโรคประจำตัวหรืออาการแพ้ที่รุนแรง</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-red-50 text-red-500 flex items-center justify-center">
                      <ShieldAlert size={14} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">โรคประจำตัว</span>
                  </div>
                  <p className="text-gray-600 text-sm ml-8">
                    {student.chronicDisease && student.chronicDisease !== "-" ? student.chronicDisease : "ไม่มี"}
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-500 flex items-center justify-center">
                      <FileText size={14} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">อาหารที่แพ้</span>
                  </div>
                  <p className="text-gray-600 text-sm ml-8">
                    {student.foodAllergy && student.foodAllergy !== "-" ? student.foodAllergy : "ไม่มี"}
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 text-gray-500 flex items-center justify-center">
                      <AlignLeft size={14} />
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">หมายเหตุเพิ่มเติม</span>
                  </div>
                  <p className="text-gray-600 text-sm ml-8 whitespace-pre-wrap">
                    {student.remark && student.remark !== "-" ? student.remark : "ไม่มีหมายเหตุ"}
                  </p>
                </div>
              </div>
              
            </ModalBody>
            <ModalFooter className="px-8 pb-8 pt-4">
              <Button
                fullWidth
                variant="flat"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                onPress={onClose}
              >
                ปิดข้อมูล
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
