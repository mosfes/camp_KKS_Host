"use client";

import { useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { ClipboardList, Star, Heading } from "lucide-react";
import { toast } from "react-hot-toast";

interface Question {
  question_id: number;
  question_text: string;
  question_type: "text" | "scale" | "header";
  scale_max?: number;
}

interface TakeSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: {
    survey_id: number;
    title: string;
    description: string;
    survey_question: Question[];
  };
  campId: number;
  onCompleted: () => void;
}

export default function TakeSurveyModal({
  isOpen,
  onClose,
  survey,
  campId,
  onCompleted,
}: TakeSurveyModalProps) {
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        if (errorRef.current) {
          errorRef.current.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  if (!survey) return null;

  const handleAnswerChange = (qId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: value,
    }));
  };

  const handleSubmit = async () => {
    const validQuestions = survey.survey_question.filter(
      (q) => q.question_type !== "header",
    );

    // Validate
    for (const q of validQuestions) {
      if (q.question_type === "scale" && !answers[q.question_id]) {
        toast.error("กรุณาตอบคำถามให้ครบทุกข้อ");
        setErrorMsg(
          "กรุณาตอบคำถามที่มีเครื่องหมาย * ให้ครบทุกข้อก่อนส่งแบบสอบถาม",
        );

        return;
      }
    }

    const formattedAnswers = validQuestions.map((q) => ({
      questionId: q.question_id,
      textAnswer: q.question_type === "text" ? answers[q.question_id] : null,
      scaleValue:
        q.question_type === "scale" ? Number(answers[q.question_id]) : null,
    }));

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch("/api/student/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId: survey.survey_id,
          campId,
          answers: formattedAnswers,
        }),
      });

      if (!res.ok) {
        const resClone = res.clone();
        let errorMessage = "Failed to submit survey";

        try {
          const err = await res.json();

          console.warn("Survey submission failed (JSON):", err);
          errorMessage = err.error || errorMessage;
        } catch (e) {
          const text = await resClone.text();

          console.warn("Survey submission failed (Text):", text);
          errorMessage = text.slice(0, 100) || errorMessage;
        }

        throw new Error(errorMessage);
      }

      toast.success("ส่งแบบสอบถามเรียบร้อยแล้ว");
      onCompleted();
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message || "เกิดข้อผิดพลาดในการส่งแบบสอบถาม");
      toast.error(error.message || "เกิดข้อผิดพลาดในการส่งแบบสอบถาม");
    } finally {
      setLoading(false);
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
      size="2xl"
      onOpenChange={onClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 px-8 pt-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ClipboardList size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {survey.title}
                </h2>
              </div>
              {survey.description && (
                <p className="text-sm text-gray-500 font-normal leading-relaxed">
                  {survey.description}
                </p>
              )}
            </ModalHeader>

            <ModalBody className="px-8 py-4 space-y-6">
              {(() => {
                let qNumber = 1;

                return survey.survey_question.map((q) => {
                  if (q.question_type === "header") {
                    return (
                      <div
                        key={q.question_id}
                        className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100 mt-2"
                      >
                        <div className="flex gap-3 items-center">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Heading size={16} />
                          </div>
                          <h3 className="font-bold text-purple-900 text-lg">
                            {q.question_text}
                          </h3>
                        </div>
                      </div>
                    );
                  }

                  const currentIndex = qNumber++;

                  return (
                    <div
                      key={q.question_id}
                      className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
                    >
                      <div className="flex gap-3 mb-4">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                          {currentIndex}
                        </span>
                        <p className="font-medium text-gray-800 leading-relaxed pt-0.5">
                          {q.question_text}
                          {q.question_type === "scale" ? (
                            <span className="text-red-500 ml-1">*</span>
                          ) : (
                            <span className="text-gray-400 font-normal ml-2 text-sm">
                              (ไม่บังคับ)
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="pl-9">
                        {q.question_type === "text" ? (
                          <textarea
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5d7c6f] focus:border-[#5d7c6f] outline-none transition-all text-sm resize-none bg-white"
                            placeholder="พิมพ์คำตอบของคุณที่นี่..."
                            rows={3}
                            value={answers[q.question_id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(q.question_id, e.target.value)
                            }
                          />
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              {Array.from({ length: q.scale_max || 5 }).map(
                                (_, i) => {
                                  const val = i + 1;
                                  const filled =
                                    Number(answers[q.question_id]) >= val;

                                  return (
                                    <button
                                      key={val}
                                      aria-label={`ให้คะแนน ${val}`}
                                      className="flex flex-col items-center gap-0.5 group focus:outline-none flex-shrink-0"
                                      type="button"
                                      onClick={() =>
                                        handleAnswerChange(q.question_id, val)
                                      }
                                    >
                                      <Star
                                        className={`transition-all duration-150 ${
                                          filled
                                            ? "fill-amber-400 text-amber-400"
                                            : "fill-none text-gray-300 group-hover:text-amber-300"
                                        }`}
                                        size={32}
                                      />
                                      <span
                                        className={`text-[10px] font-semibold leading-none ${filled ? "text-amber-500" : "text-gray-400"}`}
                                      >
                                        {val}
                                      </span>
                                    </button>
                                  );
                                },
                              )}
                            </div>
                            <div
                              className="flex justify-between text-[10px] text-gray-400 mt-1"
                              style={{
                                width: `${(q.scale_max || 5) * 44}px`,
                                maxWidth: "100%",
                              }}
                            >
                              <span>น้อยที่สุด</span>
                              <span>มากที่สุด</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}

              {errorMsg && (
                <div ref={errorRef} className="pt-2 pb-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                    <div className="mt-0.5 flex-shrink-0">
                      <svg
                        className="text-rose-500"
                        fill="none"
                        height="20"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="20"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-rose-800 mb-1">
                        ไม่สามารถส่งแบบสอบถามได้
                      </h3>
                      <p className="text-sm text-rose-600 leading-relaxed">
                        {errorMsg}
                      </p>
                    </div>
                    <button
                      className="text-rose-400 hover:text-rose-600 transition-colors flex-shrink-0"
                      type="button"
                      onClick={() => setErrorMsg(null)}
                    >
                      <svg
                        fill="none"
                        height="18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="18"
                      >
                        <line x1="18" x2="6" y1="6" y2="18" />
                        <line x1="6" x2="18" y1="6" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-8 py-6 flex-col sm:flex-row gap-3">
              <Button
                fullWidth
                className="bg-gray-100 text-gray-600 font-medium sm:w-1/3"
                size="lg"
                onPress={onClose}
              >
                ยกเลิก
              </Button>
              <Button
                fullWidth
                className="bg-[#5d7c6f] text-white font-bold shadow-lg shadow-[#5d7c6f]/20 sm:w-2/3"
                isLoading={loading}
                size="lg"
                onPress={handleSubmit}
              >
                ส่งแบบสอบถาม
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
