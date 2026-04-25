"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Accordion,
  AccordionItem,
  Select,
  SelectItem,
} from "@heroui/react";
import { useState, useEffect, useMemo } from "react";
import { Eye, Clock, User, CheckCircle2, XCircle, Users, Search, ChevronLeft } from "lucide-react";
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
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");

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

  const filteredResults = useMemo(() => {
    if (selectedStudentId === "all") return results;
    return results.filter((r) => String(r.resultId) === selectedStudentId);
  }, [results, selectedStudentId]);

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
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Users size={32} />
                  </div>
                  <p className="text-gray-500 font-medium">ยังไม่มีนักเรียนส่งงานในฐานนี้</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="p-2 bg-[#6b857a]/10 rounded-lg text-[#6b857a]">
                        <Users size={18} />
                      </div>
                      <span>ส่งแล้วทั้งหมด <strong className="text-gray-900 text-lg">{results.length}</strong> คน</span>
                    </div>

                    <div className="w-full sm:w-72">
                      <Select
                        label="เลือกนักเรียน"
                        placeholder="ค้นหาหรือเลือกนักเรียน"
                        size="sm"
                        variant="bordered"
                        startContent={<Search size={16} className="text-gray-400" />}
                        selectedKeys={[selectedStudentId]}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as string;
                          setSelectedStudentId(val || "all");
                        }}
                        classNames={{
                          trigger: "border-gray-200 hover:border-[#6b857a] bg-gray-50/50",
                          label: "text-[#6b857a] font-medium",
                        }}
                      >
                        <SelectItem key="all" textValue="แสดงทุกคน">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                              <Users size={14} />
                            </div>
                            <span>แสดงทุกคน</span>
                          </div>
                        </SelectItem>
                        {results.map((r) => (
                          <SelectItem key={String(r.resultId)} textValue={r.studentName}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-[#6b857a]/10 rounded-full flex items-center justify-center text-[#6b857a]">
                                <User size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{r.studentName}</span>
                                <span className="text-[10px] text-gray-400">รหัส: {r.studentId}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <Accordion 
                    variant="splitted"
                    className="px-0 gap-4"
                    selectionMode="multiple"
                    defaultExpandedKeys={selectedStudentId !== "all" ? [selectedStudentId] : []}
                  >
                    {filteredResults.map((result) => (
                      <AccordionItem
                        key={String(result.resultId)}
                        aria-label={result.studentName}
                        indicator={({ isOpen }) => (
                          <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-[#6b857a] text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <ChevronLeft size={18} className={`transition-transform duration-300 ${isOpen ? '-rotate-90' : ''}`} />
                          </div>
                        )}
                        classNames={{
                          base: "bg-white group-[.is-splitted]:shadow-sm group-[.is-splitted]:border border-gray-100 rounded-xl overflow-hidden",
                          title: "w-full",
                          trigger: "py-4 px-5 hover:bg-gray-50/50 transition-colors",
                          content: "pt-0 pb-6 px-6",
                        }}
                        title={
                          <div className="flex items-center justify-between w-full pr-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#6b857a]/10 rounded-full flex items-center justify-center text-[#6b857a]">
                                <User size={20} />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-gray-900 leading-tight">{result.studentName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">รหัส: {result.studentId}</p>
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                              <Clock size={12} />
                              {formatDate(result.submittedAt)}
                            </div>
                          </div>
                        }
                      >
                        <div className="divider h-px bg-gray-100 w-full mb-5" />
                        <div className="space-y-5">
                          {result.answers.map((ans: any, idx: number) => (
                            <div key={ans.questionId} className="space-y-2">
                              <div className="flex gap-2">
                                <span className="text-gray-300 font-bold text-lg leading-none">{String(idx + 1).padStart(2, '0')}</span>
                                <p className="text-sm font-semibold text-gray-700 pt-0.5">
                                  {ans.questionText || "คำถาม"}
                                </p>
                              </div>
                              
                              <div className="bg-[#6b857a]/5 p-4 rounded-xl text-sm text-gray-800 border border-[#6b857a]/10 ml-7">
                                {ans.type === "TEXT" && (
                                  <span className="whitespace-pre-wrap leading-relaxed">{ans.answerText}</span>
                                )}
                                
                                {ans.type === "MCQ" && (
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-[#6b857a]">{ans.answerText}</span>
                                    {ans.isCorrect === true && (
                                      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100">
                                        <CheckCircle2 size={14} />
                                        ถูกต้อง
                                      </div>
                                    )}
                                    {ans.isCorrect === false && (
                                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100">
                                        <XCircle size={14} />
                                        ไม่ถูกต้อง
                                      </div>
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
                      </AccordionItem>
                    ))}
                  </Accordion>
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
