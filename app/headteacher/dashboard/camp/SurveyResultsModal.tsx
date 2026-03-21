"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
} from "@heroui/react";
import toast from "react-hot-toast";
import { FileText, Star, MessageSquare, Users, Sparkles, CheckCircle2, Lightbulb } from "lucide-react";

interface SurveyResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
}

interface QuestionSummary {
  id: number;
  text: string;
  type: "scale" | "text";
  average?: number;
  total: number;
  distribution?: { [key: string]: number };
  answers?: string[];
}

interface SurveySummary {
  surveyId: number;
  title: string;
  totalResponses: number;
  questions: QuestionSummary[];
}

export default function SurveyResultsModal({
  isOpen,
  onClose,
  campId,
}: SurveyResultsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SurveySummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);

  useEffect(() => {
    if (isOpen && campId) {
      fetchResults();
    }
  }, [isOpen, campId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setAiSummary(null);
      const res = await fetch(`/api/surveys/results?campId=${campId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch results");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setErrorMsg(err.message || "ไม่สามารถดึงข้อมูลผลแบบประเมินได้");
    } finally {
      setLoading(false);
    }
  };

  const fetchAiSummary = async () => {
    try {
      setIsAiLoading(true);
      const res = await fetch("/api/surveys/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "เกิดข้อผิดพลาดในการสรุปผล");
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAiSummary(data);
      toast.success("สรุปผลด้วย AI สำเร็จแล้ว");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white rounded-3xl shadow-xl",
        backdrop: "bg-black/40 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="3xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-8 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {data ? data.title : "ผลการประเมินความพึงพอใจ"}
                  </h2>
                  <p className="text-sm font-normal text-gray-500 flex items-center gap-1 mt-1">
                    <Users size={14} /> ผู้ตอบแบบประเมินทั้งหมด {data?.totalResponses || 0} คน
                  </p>
                </div>
              </div>
              {data && data.totalResponses > 0 && !aiSummary && (
                <div className="absolute right-8 top-8">
                  <Button
                    variant="flat"
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors"
                    startContent={<Sparkles size={16} />}
                    isLoading={isAiLoading}
                    onPress={fetchAiSummary}
                  >
                    สรุปผลด้วย AI
                  </Button>
                </div>
              )}
            </ModalHeader>

            <ModalBody className="px-8 py-4 space-y-8 pt-0">
              {aiSummary && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-sm mb-6 mt-2">
                  <div className="flex items-center justify-between mb-4 border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-indigo-600" size={20} />
                      <h3 className="font-bold text-indigo-900 text-lg">AI สรุปผลการประเมิน</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {aiSummary.overview && (
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                        <h4 className="font-bold text-indigo-800 text-sm mb-2">ภาพรวม</h4>
                        <p className="text-gray-800 text-sm leading-relaxed">{aiSummary.overview}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-1.5">
                          <CheckCircle2 size={16} /> สิ่งที่ดี
                        </h4>
                        <ul className="space-y-2">
                          {aiSummary.strengths?.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-800 flex gap-2">
                              <span className="text-emerald-500">•</span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          )) || <li className="text-sm text-gray-400 italic">ไม่มีข้อมูล</li>}
                        </ul>
                      </div>
                      
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-1.5">
                          <Lightbulb size={16} /> สิ่งที่ควรปรับปรุง
                        </h4>
                        <ul className="space-y-2">
                          {aiSummary.improvements?.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-800 flex gap-2">
                              <span className="text-amber-500">•</span>
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          )) || <li className="text-sm text-gray-400 italic">ไม่มีข้อมูล</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : errorMsg ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                  <p>{errorMsg}</p>
                </div>
              ) : !data || data.totalResponses === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                  <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 font-medium">ยังไม่มีผู้ตอบแบบประเมิน</p>
                </div>
              ) : (
                data.questions.map((q, index) => (
                  <div key={q.id} className="bg-white border text-gray-800 border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="flex gap-3 mb-6">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 text-lg pt-0.5">
                        {q.text}
                      </h3>
                    </div>

                    {q.type === "scale" && q.distribution && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-11">
                        <div className="col-span-1 bg-amber-50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                          <p className="text-sm text-amber-700 font-medium mb-1">คะแนนเฉลี่ย</p>
                          <div className="flex items-center gap-2">
                            <span className="text-4xl font-bold text-amber-600">
                              {q.average}
                            </span>
                            <Star className="text-amber-500 fill-amber-500" size={24} />
                          </div>
                          <p className="text-xs text-amber-600/70 mt-2">จาก {q.total} คน</p>
                        </div>

                        <div className="col-span-2 flex flex-col justify-center space-y-3">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = q.distribution![star] || 0;
                            const percentage = q.total > 0 ? (count / q.total) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-3">
                                <span className="w-8 text-sm font-medium text-gray-600 flex items-center gap-1">
                                  {star} <Star size={12} className="text-gray-400 fill-gray-400" />
                                </span>
                                <Progress
                                  className="flex-1"
                                  classNames={{
                                    indicator: "bg-amber-400",
                                    track: "bg-gray-100",
                                  }}
                                  size="sm"
                                  value={percentage}
                                />
                                <span className="w-8 text-sm text-gray-500 text-right">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {q.type === "text" && q.answers && (
                      <div className="ml-11 mt-2 space-y-3">
                        {q.answers.length > 0 ? (
                          q.answers.map((ans, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm border border-gray-100 relative">
                              <MessageSquare className="absolute top-4 right-4 text-gray-300" size={16} />
                              {ans}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                            <p className="text-gray-400 text-sm">ไม่มีข้อเสนอแนะ</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </ModalBody>

            <ModalFooter className="px-8 py-6 rounded-b-3xl bg-gray-50/50">
              <Button
                className="w-full sm:w-auto px-8"
                variant="flat"
                onPress={onClose}
              >
                ปิดหน้าต่าง
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
