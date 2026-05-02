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
  Accordion,
  AccordionItem,
} from "@heroui/react";
import toast from "react-hot-toast";
import {
  FileText,
  Star,
  MessageSquare,
  Users,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  ChevronDown,
} from "lucide-react";

interface SurveyResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
}

interface QuestionSummary {
  id: number;
  text: string;
  type: "scale" | "text" | "header";
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

      if (!res.ok) throw new Error("Failed to fetch results");
      const json = await res.json();

      setData(json.survey === null ? null : json);
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
      const result = await res.json();

      if (result.error) throw new Error(result.error);
      setAiSummary(result);
      toast.success("สรุปผลด้วย AI สำเร็จแล้ว");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const scaleQuestions =
    data?.questions.filter((q) => q.type === "scale" && q.average != null) ??
    [];
  const campAverage =
    scaleQuestions.length > 0
      ? (
          scaleQuestions.reduce((sum, q) => sum + (q.average || 0), 0) /
          scaleQuestions.length
        ).toFixed(2)
      : null;

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
            <ModalHeader className="flex flex-col gap-1 px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                      {data ? data.title : "ผลการประเมินความพึงพอใจ"}
                    </h2>
                    <p className="text-sm font-normal text-gray-500 flex items-center gap-1 mt-1">
                      <Users size={14} /> ผู้ตอบแบบประเมินทั้งหมด{" "}
                      {data?.totalResponses || 0} คน
                    </p>
                  </div>
                </div>
                {data && data.totalResponses > 0 && !aiSummary && (
                  <div className="flex-shrink-0">
                    <Button
                      className="w-full sm:w-auto bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors"
                      isLoading={isAiLoading}
                      startContent={<Sparkles size={16} />}
                      variant="flat"
                      onPress={fetchAiSummary}
                    >
                      สรุปผลด้วย AI
                    </Button>
                  </div>
                )}
              </div>
            </ModalHeader>

            <ModalBody className="px-5 sm:px-8 py-4 pt-2 space-y-4">
              {/* AI Summary */}
              {aiSummary && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 border-b border-indigo-100 pb-3">
                    <Sparkles className="text-indigo-600" size={20} />
                    <h3 className="font-bold text-indigo-900 text-lg">
                      AI สรุปผลการประเมิน
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {aiSummary.overview && (
                      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                        <h4 className="font-bold text-indigo-800 text-sm mb-2">
                          ภาพรวม
                        </h4>
                        <p className="text-gray-800 text-sm leading-relaxed">
                          {aiSummary.overview}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <h4 className="font-bold text-emerald-800 text-sm mb-3 flex items-center gap-1.5">
                          <CheckCircle2 size={16} /> สิ่งที่ดี
                        </h4>
                        <ul className="space-y-2">
                          {aiSummary.strengths?.map(
                            (item: string, idx: number) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-800 flex gap-2"
                              >
                                <span className="text-emerald-500">•</span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ),
                          ) || (
                            <li className="text-sm text-gray-400 italic">
                              ไม่มีข้อมูล
                            </li>
                          )}
                        </ul>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-1.5">
                          <Lightbulb size={16} /> สิ่งที่ควรปรับปรุง
                        </h4>
                        <ul className="space-y-2">
                          {aiSummary.improvements?.map(
                            (item: string, idx: number) => (
                              <li
                                key={idx}
                                className="text-sm text-gray-800 flex gap-2"
                              >
                                <span className="text-amber-500">•</span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ),
                          ) || (
                            <li className="text-sm text-gray-400 italic">
                              ไม่มีข้อมูล
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading / empty states */}
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : errorMsg ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
                  <p>{errorMsg}</p>
                </div>
              ) : !data ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                  <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 font-medium">
                    ยังไม่มีแบบประเมิน
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    สร้างแบบประเมินก่อนเพื่อดูผลที่นี่
                  </p>
                </div>
              ) : data.totalResponses === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                  <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                  <p className="text-gray-500 font-medium">
                    ยังไม่มีผู้ตอบแบบประเมิน
                  </p>
                </div>
              ) : (
                <>
                  {/* Camp-wide average banner */}
                  {campAverage && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <Star
                            className="text-amber-500 fill-amber-400"
                            size={20}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                            ภาพรวมคะแนนในค่ายนี้
                          </p>
                          <p className="text-xs text-amber-600/70 mt-0.5">
                            เฉลี่ยจาก {scaleQuestions.length} หัวข้อ ·{" "}
                            {data.totalResponses} คน
                          </p>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5 sm:pr-2">
                        <span className="text-3xl font-extrabold text-amber-600">
                          {campAverage}
                        </span>
                        <span className="text-amber-500 font-semibold text-sm">
                          / 5
                        </span>
                      </div>
                    </div>
                  )}

                  {(() => {
                    let qNum = 0;

                    return data.questions.map((q) => {
                      if (q.type === "header") {
                        return (
                          <div
                            key={q.id}
                            className="bg-indigo-50 border border-indigo-100 shadow-sm rounded-2xl px-5 py-3 my-2"
                          >
                            <h3 className="font-bold text-indigo-900 text-sm leading-snug whitespace-normal break-words relative flex items-center gap-2">
                              <span className="w-1 h-4 bg-indigo-500 rounded-full inline-block" />
                              {q.text}
                            </h3>
                          </div>
                        );
                      }

                      qNum++;

                      return (
                        <Accordion
                          key={q.id}
                          className="px-0"
                          selectionMode="multiple"
                          variant="splitted"
                        >
                          <AccordionItem
                            key={q.id}
                            aria-label={q.text}
                            classNames={{
                              base: "bg-white !shadow-sm border border-gray-100 rounded-2xl overflow-hidden",
                              title: "w-full",
                              trigger: "py-4 px-5",
                              content: "pt-0 pb-5 px-5",
                            }}
                            indicator={({ isOpen }) => (
                              <div
                                className={`p-1 rounded-full transition-colors ${isOpen ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}
                              >
                                <ChevronDown
                                  className={`transition-transform duration-0 ${isOpen ? "rotate-270" : ""}`}
                                  size={18}
                                />
                              </div>
                            )}
                            title={
                              <div className="flex items-center justify-between w-full pr-2">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                    {qNum}
                                  </span>
                                  <h3 className="flex-1 min-w-0 font-semibold text-gray-900 text-sm leading-snug whitespace-normal break-words pt-0.5 text-left">
                                    {q.text}
                                  </h3>
                                </div>
                                {q.type === "scale" && q.average != null && (
                                  <div className="flex-shrink-0 flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 ml-4">
                                    <Star
                                      className="text-amber-400 fill-amber-400"
                                      size={11}
                                    />
                                    <span className="text-amber-700 font-bold text-xs leading-none">
                                      {q.average}
                                    </span>
                                  </div>
                                )}
                              </div>
                            }
                          >
                            <div className="divider h-px bg-gray-50 w-full mb-5 ml-0" />

                            {/* Scale distribution */}
                            {q.type === "scale" && q.distribution && (
                              <div className="ml-10 flex flex-col gap-2.5">
                                {[5, 4, 3, 2, 1].map((star) => {
                                  const count = q.distribution![star] || 0;
                                  const percentage =
                                    q.total > 0 ? (count / q.total) * 100 : 0;

                                  return (
                                    <div
                                      key={star}
                                      className="flex items-center gap-3"
                                    >
                                      <span className="w-7 text-xs font-medium text-gray-500 flex items-center gap-1 flex-shrink-0">
                                        {star}{" "}
                                        <Star
                                          className="text-gray-400 fill-gray-400"
                                          size={10}
                                        />
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
                                      <span className="w-7 text-xs text-gray-500 text-right flex-shrink-0">
                                        {count}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Text answers */}
                            {q.type === "text" && q.answers && (
                              <div className="ml-10 space-y-2.5">
                                {q.answers.length > 0 ? (
                                  q.answers.map((ans, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-50 p-3 rounded-xl text-gray-700 text-sm border border-gray-100 relative pr-8"
                                    >
                                      <MessageSquare
                                        className="absolute top-3 right-3 text-gray-300"
                                        size={14}
                                      />
                                      {ans}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center py-5 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                                    <p className="text-gray-400 text-sm">
                                      ไม่มีข้อเสนอแนะ
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </AccordionItem>
                        </Accordion>
                      );
                    });
                  })()}
                </>
              )}
            </ModalBody>

            <ModalFooter className="px-6 sm:px-8 py-5 border-t border-gray-100">
              <Button
                className="w-full sm:w-auto px-8 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
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
