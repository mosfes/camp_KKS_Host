"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Eye, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import { useStatusModal } from "@/components/StatusModalProvider";

interface MonitorMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionData: any;
}

export default function MonitorMissionModal({
  isOpen,
  onClose,
  missionData,
}: MonitorMissionModalProps) {
  const { showError } = useStatusModal();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && missionData?.mission_id) {
      fetchResults();
    }
  }, [isOpen, missionData]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/missions/${missionData.mission_id}/results`);
      if (!res.ok) throw new Error("Failed to fetch results");
      
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
      showError("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลคำตอบได้");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white rounded-2xl shadow-xl max-h-[90vh]",
        backdrop: "bg-black/60 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="3xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-[#6b857a]">
                <Eye size={24} />
                <h2 className="text-2xl font-bold text-gray-900">ดูคำตอบนักเรียน</h2>
              </div>
              <p className="text-sm text-gray-500 font-normal">
                ภารกิจ: {missionData?.title}
              </p>
            </ModalHeader>

            <ModalBody className="py-6 px-6 bg-[#F5F1E8]/30">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-10 h-10 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                  ยังไม่มีนักเรียนส่งคำตอบสำหรับภารกิจนี้
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>จำนวนนักเรียนที่ส่งแล้ว: <strong className="text-gray-900">{results.length}</strong> คน</span>
                  </div>

                  {results.map((result) => (
                    <div key={result.resultId} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#6b857a]/10 rounded-full flex items-center justify-center text-[#6b857a]">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{result.studentName}</p>
                            <p className="text-xs text-gray-500">รหัส: {result.studentId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                          <Clock size={14} />
                          {formatDate(result.submittedAt)}
                        </div>
                      </div>

                      <div className="space-y-4 pl-2">
                        {result.answers.map((ans: any, idx: number) => (
                          <div key={ans.questionId} className="space-y-1.5">
                            <p className="text-sm font-medium text-gray-700">
                              <span className="text-gray-400 mr-1.5">{idx + 1}.</span> 
                              {ans.questionText || "คำถาม"}
                            </p>
                            
                            <div className="bg-[#6b857a]/5 p-3 rounded-lg text-sm text-gray-800 border border-[#6b857a]/10">
                              {ans.type === "TEXT" && (
                                <span className="whitespace-pre-wrap">{ans.answerText}</span>
                              )}
                              
                              {ans.type === "MCQ" && (
                                <div className="flex items-center gap-2">
                                  <span>{ans.answerText}</span>
                                  {ans.isCorrect === true && (
                                    <CheckCircle2 className="text-green-500" size={16} />
                                  )}
                                  {ans.isCorrect === false && (
                                    <XCircle className="text-red-500" size={16} />
                                  )}
                                </div>
                              )}

                              {ans.type !== "TEXT" && ans.type !== "MCQ" && (
                                <span className="text-gray-400 italic">รูปแบบคำตอบไม่รองรับการแสดงผล: {ans.type || "ไม่ระบุ"}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Status removed as requested */}
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="p-4 border-t border-gray-100">
              <Button fullWidth className="bg-gray-100 text-gray-700 font-medium hover:bg-gray-200" size="lg" onPress={onClose}>
                ปิดหน้าต่าง
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
