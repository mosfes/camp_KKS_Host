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
import { Save, Plus, Trash2, FileText, Star, BookTemplate, ChevronDown } from "lucide-react";

import { useStatusModal } from "@/components/StatusModalProvider";

interface Question {
  text: string;
  type: "text" | "scale";
  scaleMax: number;
}

interface Template {
  template_id: number;
  title: string;
  description?: string;
  survey_template_question: {
    question_id: number;
    question_text: string;
    question_type: "text" | "scale";
    scale_max?: number;
  }[];
}

interface CreateSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  teacherId: number;
  onSurveyCreated: () => void;
  initialData?: any;
}

const inputCls =
  "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] focus:border-[#6b857a] outline-none transition-colors text-sm bg-white";

export default function CreateSurveyModal({
  isOpen,
  onClose,
  campId,
  teacherId,
  onSurveyCreated,
  initialData,
}: CreateSurveyModalProps) {
  const { showError, showSuccess } = useStatusModal();

  const isEditing = !!initialData;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { text: "", type: "scale", scaleMax: 5 },
    { text: "", type: "text", scaleMax: 5 },
  ]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        if (initialData.survey_question && initialData.survey_question.length > 0) {
          setQuestions(
            initialData.survey_question.map((q: any) => ({
              text: q.question_text,
              type: q.question_type,
              scaleMax: q.scale_max || 5,
            }))
          );
        }
      } else {
        // Reset for create mode
        setTitle("");
        setDescription("");
        setQuestions([
          { text: "", type: "scale", scaleMax: 5 },
          { text: "", type: "text", scaleMax: 5 },
        ]);
      }
      setSaveAsTemplate(false);
      setTemplateTitle("");
      setShowTemplates(false);
    }
  }, [isOpen, initialData, isEditing]);

  // Template picker
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (showTemplates && templates.length === 0) {
      fetchTemplates();
    }
  }, [showTemplates]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch(`/api/surveys/templates?teacherId=${teacherId}`);
      const data = await res.json();
      setTemplates(data || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingTemplates(false);
    }
  };

  const applyTemplate = (tpl: Template) => {
    setTitle(tpl.title);
    setDescription(tpl.description || "");
    setQuestions(
      tpl.survey_template_question.map((q) => ({
        text: q.question_text,
        type: q.question_type,
        scaleMax: q.scale_max || 5,
      }))
    );
    setShowTemplates(false);
  };

  const addQuestion = (type: "text" | "scale") => {
    setQuestions([...questions, { text: "", type, scaleMax: 5 }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: keyof Question, val: string | number) => {
    const q = [...questions];
    (q[i] as any)[field] = val;
    setQuestions(q);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("ข้อผิดพลาด", "กรุณากรอกชื่อแบบสอบถาม");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        showError("ข้อผิดพลาด", `กรุณากรอกคำถามที่ ${i + 1}`);
        return;
      }
    }

    try {
      setLoading(true);
      const url = isEditing ? `/api/surveys?campId=${campId}` : "/api/surveys";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId,
          title,
          description,
          questions,
          saveAsTemplate,
          templateTitle: templateTitle || title,
          teacherId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showError("ข้อผิดพลาด", data.error || `${isEditing ? "แก้ไข" : "สร้าง"}แบบสอบถามไม่สำเร็จ`);
        return;
      }

      showSuccess("สำเร็จ", `${isEditing ? "แก้ไข" : "สร้าง"}แบบสอบถามเรียบร้อยแล้ว`);
      handleClose();
      onSurveyCreated();
    } catch {
      showError("ข้อผิดพลาด", `${isEditing ? "แก้ไข" : "สร้าง"}แบบสอบถามไม่สำเร็จ`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-white rounded-2xl shadow-xl",
        backdrop: "bg-black/60 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onOpenChange={handleClose}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? "แก้ไขแบบสอบถาม" : "สร้างแบบสอบถาม"}
              </h2>
              <p className="text-sm text-gray-500 font-normal">
                {isEditing
                  ? "แก้ไขแบบสอบถามของค่ายนี้ (ข้อมูลที่มีอยู่จะถูกอัปเดต)"
                  : "นักเรียนทุกคนต้องทำแบบสอบถามนี้จึงจะดาวน์โหลดประกาศนียบัตรได้"}
              </p>
            </ModalHeader>

            <ModalBody className="py-6 space-y-5 px-6">
              {/* โหลดจากเทมเพลต */}
              <div>
                <button
                  className="flex items-center gap-2 text-sm text-[#6b857a] font-medium hover:text-[#5a7268] transition-colors"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <BookTemplate size={16} />
                  โหลดจากเทมเพลต
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showTemplates ? "rotate-180" : ""}`}
                  />
                </button>

                {showTemplates && (
                  <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                    {loadingTemplates ? (
                      <p className="text-sm text-gray-400 p-4 text-center">กำลังโหลด...</p>
                    ) : templates.length === 0 ? (
                      <p className="text-sm text-gray-400 p-4 text-center">ยังไม่มีเทมเพลต</p>
                    ) : (
                      templates.map((tpl) => (
                        <button
                          key={tpl.template_id}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                          onClick={() => applyTemplate(tpl)}
                        >
                          <p className="text-sm font-medium text-gray-900">{tpl.title}</p>
                          <p className="text-xs text-gray-500">
                            {tpl.survey_template_question.length} คำถาม
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* ชื่อแบบสอบถาม */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อแบบสอบถาม <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputCls}
                  placeholder="เช่น แบบสอบถามความพึงพอใจค่ายวิทยาศาสตร์"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* คำอธิบาย */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย (ไม่บังคับ)
                </label>
                <textarea
                  className={`${inputCls} resize-none`}
                  placeholder="อธิบายวัตถุประสงค์ของแบบสอบถาม"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* รายการคำถาม */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#6b857a] rounded-full" />
                  <label className="text-sm font-semibold text-gray-700">
                    คำถาม ({questions.length})
                  </label>
                </div>

                {questions.map((q, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {q.type === "scale" ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <Star size={12} fill="currentColor" />
                            ระดับความพึงพอใจ
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <FileText size={12} />
                            ข้อเสนอแนะ
                          </div>
                        )}
                        <span className="text-xs text-gray-400">ข้อที่ {i + 1}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#6b857a] bg-white"
                          value={q.type}
                          onChange={(e) =>
                            updateQuestion(i, "type", e.target.value as "text" | "scale")
                          }
                        >
                          <option value="scale">ระดับความพึงพอใจ</option>
                          <option value="text">ข้อเสนอแนะ</option>
                        </select>
                        {questions.length > 1 && (
                          <button
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            onClick={() => removeQuestion(i)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <input
                      className={inputCls}
                      placeholder={
                        q.type === "scale"
                          ? "เช่น ความพึงพอใจโดยรวมของค่ายอยู่ในระดับใด"
                          : "เช่น มีข้อเสนอแนะอะไรเพิ่มเติมหรือไม่"
                      }
                      value={q.text}
                      onChange={(e) => updateQuestion(i, "text", e.target.value)}
                    />

                    {q.type === "scale" && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>คะแนนสูงสุด:</span>
                        <select
                          className="border border-gray-200 rounded-lg px-3 py-1 outline-none focus:border-[#6b857a] bg-white text-sm"
                          value={q.scaleMax}
                          onChange={(e) =>
                            updateQuestion(i, "scaleMax", parseInt(e.target.value))
                          }
                        >
                          <option value={3}>3</option>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                        </select>
                        <span className="text-xs text-gray-400">
                          (นักเรียนเลือก 1–{q.scaleMax})
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* ปุ่มเพิ่มคำถาม */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="py-2 border-2 border-dashed border-gray-200 hover:border-yellow-400 rounded-xl text-xs text-gray-500 hover:text-yellow-600 font-medium transition-colors flex items-center justify-center gap-1"
                    onClick={() => addQuestion("scale")}
                  >
                    <Plus size={14} />
                    <Star size={12} fill="currentColor" />
                    เพิ่มคำถามระดับความพึงพอใจ
                  </button>
                  <button
                    className="py-2 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors flex items-center justify-center gap-1"
                    onClick={() => addQuestion("text")}
                  >
                    <Plus size={14} />
                    <FileText size={12} />
                    เพิ่มคำถามข้อเสนอแนะ
                  </button>
                </div>
              </div>

              {/* บันทึกเป็นเทมเพลต */}
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-[#6b857a]"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    บันทึกเป็นเทมเพลตสำหรับใช้ในครั้งต่อไป
                  </span>
                </label>

                {saveAsTemplate && (
                  <div className="mt-2 ml-7">
                    <input
                      className={inputCls}
                      placeholder="ชื่อเทมเพลต (ถ้าไม่กรอกจะใช้ชื่อแบบสอบถาม)"
                      value={templateTitle}
                      onChange={(e) => setTemplateTitle(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="p-6 pt-2 flex-col gap-2">
              <Button
                fullWidth
                className="bg-[#6b857a] text-white rounded-xl font-bold shadow-lg hover:bg-[#5a7268]"
                isLoading={loading}
                size="lg"
                startContent={!loading && <Save size={18} />}
                onPress={handleSubmit}
              >
                {isEditing ? "บันทึกการแก้ไข" : "สร้างแบบสอบถาม"}
              </Button>
              <Button
                fullWidth
                className="font-medium text-gray-600"
                size="lg"
                variant="light"
                onPress={handleClose}
              >
                ยกเลิก
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
