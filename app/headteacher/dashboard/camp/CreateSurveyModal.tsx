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
import { Save, Plus, Trash2, FileText, Star, BookTemplate, ChevronDown, ChevronUp } from "lucide-react";

import { useStatusModal } from "@/components/StatusModalProvider";
import { Heading } from "lucide-react";

interface Question {
  text: string;
  type: "text" | "scale" | "header";
  scaleMax: number;
}

interface Template {
  template_id: number;
  title: string;
  description?: string;
  survey_template_question: {
    question_id: number;
    question_text: string;
    question_type: "text" | "scale" | "header";
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
  const [globalScaleMax, setGlobalScaleMax] = useState<number>(5);

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
          const scaleQ = initialData.survey_question.find((q: any) => q.question_type === 'scale');
          if (scaleQ && scaleQ.scale_max) {
            setGlobalScaleMax(scaleQ.scale_max);
          } else {
            setGlobalScaleMax(5);
          }
        }
      } else {
        // Reset for create mode
        setTitle("");
        setDescription("");
        setQuestions([
          { text: "", type: "scale", scaleMax: 5 },
          { text: "", type: "text", scaleMax: 5 },
        ]);
        setGlobalScaleMax(5);
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
    const scaleQ = tpl.survey_template_question.find((q) => q.question_type === 'scale');
    if (scaleQ && scaleQ.scale_max) {
      setGlobalScaleMax(scaleQ.scale_max);
    } else {
      setGlobalScaleMax(5);
    }
    setShowTemplates(false);
  };

  const deleteTemplate = async (templateId: number) => {
    if (!confirm("คุณต้องการลบเทมเพลตนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/surveys/templates?templateId=${templateId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.template_id !== templateId));
        showSuccess("สำเร็จ", "ลบเทมเพลตเรียบร้อยแล้ว");
      } else {
        showError("ข้อผิดพลาด", "ไม่สามารถลบเทมเพลตได้");
      }
    } catch {
      showError("ข้อผิดพลาด", "ไม่สามารถลบเทมเพลตได้");
    }
  };

  const addQuestion = (type: "text" | "scale" | "header") => {
    setQuestions([...questions, { text: "", type, scaleMax: 5 }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const moveQuestion = (i: number, dir: -1 | 1) => {
    if (i + dir < 0 || i + dir >= questions.length) return;
    const newQ = [...questions];
    const temp = newQ[i];
    newQ[i] = newQ[i + dir];
    newQ[i + dir] = temp;
    setQuestions(newQ);
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
    const realQuestions = questions.filter(q => q.type !== "header");
    if (realQuestions.length === 0) {
      showError("ข้อผิดพลาด", "กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        const itemType = questions[i].type === "header" ? "หัวข้อ" : "คำถามข้อที่";
        showError("ข้อผิดพลาด", `กรุณากรอก${itemType} ${i + 1} ให้ครบถ้วน`);
        return;
      }
    }

    // Apply globalScaleMax to all scale questions before sending
    const finalQuestions = questions.map((q) => ({
      ...q,
      scaleMax: q.type === "scale" ? globalScaleMax : 5,
    }));

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
          questions: finalQuestions,
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
                        <div
                          key={tpl.template_id}
                          className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 group"
                        >
                          <button
                            className="flex-1 text-left"
                            onClick={() => applyTemplate(tpl)}
                          >
                            <p className="text-sm font-medium text-gray-900">{tpl.title}</p>
                            <p className="text-xs text-gray-500">
                              {tpl.survey_template_question.length} รายการ
                            </p>
                          </button>
                          <button
                            className="p-2 text-[#E84A5F] opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:text-[#FF847C] hover:bg-[#E84A5F]/10 rounded-lg transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(tpl.template_id);
                            }}
                            title="ลบเทมเพลต"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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

              {/* การตั้งค่าคะแนนสูงสุด (Global) */}
              <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  คะแนนสูงสุดสำหรับแบบประเมิน
                  <span className="block text-xs font-normal text-gray-500 mt-0.5">
                    (เลือกครั้งเดียว ใช้คะแนนนี้สำหรับคำถามประเภท "ระดับความพึงพอใจ" ทุกข้อ)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {[3, 5, 10].map((score) => (
                    <label
                      key={score}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${globalScaleMax === score
                        ? "bg-orange-100 border-orange-300 text-orange-800"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="globalScaleMax"
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500 shrink-0"
                        checked={globalScaleMax === score}
                        onChange={() => setGlobalScaleMax(score)}
                      />
                      <span className="text-sm font-medium whitespace-nowrap">{score} คะแนน</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* รายการคำถาม */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#6b857a] rounded-full" />
                  <label className="text-sm font-semibold text-gray-700">
                    คำถาม ({questions.filter(q => q.type !== "header").length}) และ ส่วนแบ่งหัวข้อ ({questions.filter(q => q.type === "header").length})
                  </label>
                </div>

                {questions.map((q, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border space-y-3 ${q.type === "header" ? "bg-purple-50/50 border-purple-200" : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {q.type === "scale" ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] sm:text-xs font-medium">
                            <Star size={12} fill="currentColor" />
                            <span className="hidden sm:inline">ระดับความพึงพอใจ</span>
                            <span className="sm:hidden">ความพึงพอใจ</span>
                          </div>
                        ) : q.type === "text" ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] sm:text-xs font-medium">
                            <FileText size={12} />
                            ข้อเสนอแนะ
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] sm:text-xs font-medium">
                            <Heading size={12} />
                            ส่วนแบ่งหัวข้อ
                          </div>
                        )}
                        <span className="text-xs text-gray-400">รายการที่ {i + 1}</span>
                      </div>

                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#6b857a] bg-white w-auto max-w-[130px]"
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(i, "type", e.target.value as "text" | "scale" | "header")
                        }
                      >
                        <option value="scale">ระดับความพึงพอใจ</option>
                        <option value="text">ข้อเสนอแนะ</option>
                        <option value="header">ส่วนแบ่งหัวข้อ</option>
                      </select>
                    </div>

                    <input
                      className={`${inputCls} ${q.type === 'header' ? 'font-semibold text-purple-900 border-purple-200 focus:ring-purple-500 focus:border-purple-500 bg-white' : ''}`}
                      placeholder={
                        q.type === "scale"
                          ? "เช่น ความพึงพอใจโดยรวมของค่ายอยู่ในระดับใด"
                          : q.type === "text"
                            ? "เช่น มีข้อเสนอแนะอะไรเพิ่มเติมหรือไม่"
                            : "ชื่อส่วนแบ่งหัวข้อ (เช่น ส่วนที่ 2: ความพึงพอใจด้านสถานที่)"
                      }
                      value={q.text}
                      onChange={(e) => updateQuestion(i, "text", e.target.value)}
                    />

                    {/* Move and Delete Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 mt-1 border-t border-gray-200/60">
                      <div className="flex items-center gap-1">
                        <button
                          className="py-1.5 px-3 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1 text-[11px] font-bold tracking-wide"
                          disabled={i === 0}
                          onClick={() => moveQuestion(i, -1)}
                          title="เลื่อนขึ้น"
                        >
                          <ChevronUp size={16} />
                          <span>เลื่อนขึ้น</span>
                        </button>
                        <button
                          className="py-1.5 px-3 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1 text-[11px] font-bold tracking-wide"
                          disabled={i === questions.length - 1}
                          onClick={() => moveQuestion(i, 1)}
                          title="เลื่อนลง"
                        >
                          <ChevronDown size={16} />
                          <span>เลื่อนลง</span>
                        </button>
                      </div>

                      {questions.length > 1 && (
                        <button
                          className="py-1.5 px-3 text-[#E84A5F] opacity-80 hover:opacity-100 hover:text-[#FF847C] hover:bg-[#E84A5F]/10 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold tracking-wide"
                          onClick={() => removeQuestion(i)}
                          title="ลบคำถาม"
                        >
                          <Trash2 size={14} />
                          <span>ลบรายการ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* ปุ่มเพิ่มคำถาม */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="flex-1 py-3 sm:py-2 border-2 border-dashed border-gray-200 hover:border-yellow-400 rounded-xl text-sm sm:text-xs text-gray-500 hover:text-yellow-600 font-medium transition-colors flex items-center justify-center gap-2 sm:gap-1"
                    onClick={() => addQuestion("scale")}
                  >
                    <Plus size={16} className="sm:w-3.5 sm:h-3.5" />
                    <Star size={14} fill="currentColor" className="sm:w-3 sm:h-3" />
                    เพิ่มระดับความพึงพอใจ
                  </button>
                  <button
                    className="flex-1 py-3 sm:py-2 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl text-sm sm:text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors flex items-center justify-center gap-2 sm:gap-1"
                    onClick={() => addQuestion("text")}
                  >
                    <Plus size={16} className="sm:w-3.5 sm:h-3.5" />
                    <FileText size={14} className="sm:w-3 sm:h-3" />
                    เพิ่มข้อเสนอแนะ
                  </button>
                  <button
                    className="flex-1 py-3 sm:py-2 border-2 border-dashed border-gray-200 hover:border-purple-400 rounded-xl text-sm sm:text-xs text-gray-500 hover:text-purple-600 font-medium transition-colors flex items-center justify-center gap-2 sm:gap-1"
                    onClick={() => addQuestion("header")}
                  >
                    <Plus size={16} className="sm:w-3.5 sm:h-3.5" />
                    <Heading size={14} className="sm:w-3 sm:h-3" />
                    เพิ่มส่วนแบ่งหัวข้อ
                  </button>
                </div>
              </div>

              {/* บันทึกเป็นเทมเพลต */}
              <div className="border-t border-gray-100 pt-4 pb-2">
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
                  <div className="mt-3 ml-7">
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

            <ModalFooter className="px-6 py-4 pb-8 sm:pb-6 flex-col gap-3 bg-white border-t border-gray-50 rounded-b-2xl">
              <Button
                fullWidth
                className="bg-[#6b857a] text-white rounded-xl font-bold shadow-lg shadow-[#6b857a]/20 hover:bg-[#5a7268] active:scale-[0.98] transition-transform"
                isLoading={loading}
                size="lg"
                onPress={handleSubmit}
              >
                {isEditing ? "บันทึกการแก้ไข" : "สร้างแบบสอบถาม"}
              </Button>
              <Button
                fullWidth
                className="font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                size="lg"
                variant="flat"
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
