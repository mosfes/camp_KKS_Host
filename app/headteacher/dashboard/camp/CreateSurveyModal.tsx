"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Select,
  SelectItem,
  Switch,
} from "@heroui/react";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  FileText,
  BookTemplate,
  ChevronDown,
  ChevronUp,
  CircleDot,
  LayoutGrid,
  AlignLeft,
  Heading,
} from "lucide-react";

import { useStatusModal } from "@/components/StatusModalProvider";

interface Question {
  text: string;
  type: "text" | "scale" | "header" | "grid";
  scaleMax: number;
  options?: string[];
}

interface Template {
  template_id: number;
  title: string;
  description?: string;
  survey_template_question: {
    question_id: number;
    question_text: string;
    question_type: "text" | "scale" | "header" | "grid";
    scale_max?: number;
    options?: string;
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
  const { showError, showSuccess, showConfirm } = useStatusModal();

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
  const [isRequiredForCert, setIsRequiredForCert] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        if (
          initialData.survey_question &&
          initialData.survey_question.length > 0
        ) {
          setQuestions(
            initialData.survey_question.map((q: any) => ({
              text: q.question_text,
              type: q.question_type,
              scaleMax: q.scale_max || 5,
              options: q.options ? JSON.parse(q.options) : [],
            })),
          );
          const scaleQ = initialData.survey_question.find(
            (q: any) => q.question_type === "scale",
          );

          if (scaleQ && scaleQ.scale_max) {
            setGlobalScaleMax(scaleQ.scale_max);
          } else {
            setGlobalScaleMax(5);
          }
        }
        setIsRequiredForCert(
          initialData.is_required_for_cert !== undefined
            ? initialData.is_required_for_cert
            : true,
        );
      } else {
        // Reset for create mode
        setTitle("");
        setDescription("");
        setQuestions([
          { text: "", type: "scale", scaleMax: 5 },
          { text: "", type: "text", scaleMax: 5 },
        ]);
        setGlobalScaleMax(5);
        setIsRequiredForCert(true);
      }
      setSaveAsTemplate(false);
      setTemplateTitle("");
      setShowTemplates(false);
      setTemplates([]);
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
      const res = await fetch(`/api/surveys/templates`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setTemplates(data);
      } else {
        setTemplates([]);
      }
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
        options: q.options ? JSON.parse(q.options) : [],
      })),
    );
    const scaleQ = tpl.survey_template_question.find(
      (q) => q.question_type === "scale",
    );

    if (scaleQ && scaleQ.scale_max) {
      setGlobalScaleMax(scaleQ.scale_max);
    } else {
      setGlobalScaleMax(5);
    }
    setShowTemplates(false);
  };

  const deleteTemplate = (templateId: number) => {
    showConfirm(
      "ยืนยันการลบเทมเพลต",
      "คุณต้องการลบเทมเพลตนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
      async () => {
        try {
          const res = await fetch(
            `/api/surveys/templates?templateId=${templateId}`,
            {
              method: "DELETE",
            },
          );

          if (res.ok) {
            setTemplates((prev) =>
              prev.filter((t) => t.template_id !== templateId),
            );
            showSuccess("สำเร็จ", "ลบเทมเพลตเรียบร้อยแล้ว");
          } else {
            showError("ข้อผิดพลาด", "ไม่สามารถลบเทมเพลตได้");
          }
        } catch {
          showError("ข้อผิดพลาด", "ไม่สามารถลบเทมเพลตได้");
        }
      },
      "ลบเทมเพลต",
    );
  };

  const addQuestion = (type: "text" | "scale" | "header" | "grid") => {
    setQuestions([
      ...questions,
      {
        text: "",
        type,
        scaleMax: 5,
        options: type === "grid" ? ["รายการที่ 1"] : undefined,
      },
    ]);
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

  const updateQuestion = (i: number, field: keyof Question, val: any) => {
    const q = [...questions];

    (q[i] as any)[field] = val;
    setQuestions(q);
  };

  const addGridRow = (i: number) => {
    const q = [...questions];

    if (!q[i].options) q[i].options = [];
    q[i].options!.push(`รายการที่ ${q[i].options!.length + 1}`);
    setQuestions(q);
  };

  const updateGridRow = (qi: number, ri: number, val: string) => {
    const q = [...questions];

    if (!q[qi].options) return;
    q[qi].options![ri] = val;
    setQuestions(q);
  };

  const removeGridRow = (qi: number, ri: number) => {
    const q = [...questions];

    if (!q[qi].options) return;
    q[qi].options = q[qi].options!.filter((_, idx) => idx !== ri);
    setQuestions(q);
  };

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    const finalTitle = title.trim() || "แบบสอบถาม";
    const realQuestions = questions.filter((q) => q.type !== "header");

    if (realQuestions.length === 0) {
      showError("ข้อผิดพลาด", "กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ");

      return;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        const itemType =
          questions[i].type === "header" ? "หัวข้อ" : "คำถามข้อที่";

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
          title: finalTitle,
          description,
          questions: finalQuestions,
          saveAsTemplate,
          templateTitle: templateTitle || finalTitle,
          teacherId,
          isRequiredForCert,
        }),
      });

      if (!res.ok) {
        const data = await res.json();

        showError(
          "ข้อผิดพลาด",
          data.error || `${isEditing ? "แก้ไข" : "สร้าง"}แบบสอบถามไม่สำเร็จ`,
        );

        return;
      }

      showSuccess(
        "สำเร็จ",
        `${isEditing ? "แก้ไข" : "สร้าง"}แบบสอบถามเรียบร้อยแล้ว`,
      );
      handleClose();
      onSurveyCreated();
    } catch {
      showError(
        "ข้อผิดพลาด",
        `${isEditing ? "แก้ไข" : "สร้าง"}แบบสอบถามไม่สำเร็จ`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        backdrop="opaque"
        classNames={{
          base: "bg-[#f0f2f5] rounded-xl shadow-2xl overflow-hidden",
          backdrop: "bg-black/40",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="5xl"
        onOpenChange={handleClose}
      >
        <ModalContent>
          {() => (
            <>
              {/* ── Top Header Bar (Google Forms style) ── */}
              <ModalHeader className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-1 z-10 shadow-sm rounded-t-xl shrink-0">
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <FileText className="text-[#6b857a]" size={24} />
                    <h2 className="text-lg font-medium text-gray-800">
                      {isEditing ? "แก้ไขแบบสอบถาม" : "แบบฟอร์มแบบสอบถาม"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      className="font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
                      size="sm"
                      variant="flat"
                      onPress={handleClose}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      className="bg-[#6b857a] text-white rounded-md font-medium shadow-sm hover:bg-[#5a7268]"
                      isLoading={loading}
                      size="sm"
                      onPress={handleSubmit}
                    >
                      {isEditing ? "บันทึก" : "สร้าง"}
                    </Button>
                  </div>
                </div>
              </ModalHeader>

              <ModalBody className="py-6 px-4 sm:px-12 space-y-6">
                {/* ── Header Card ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-2.5 bg-[#6b857a]" />
                  <div className="p-8 pt-10 space-y-4">
                    <input
                      className="w-full text-3xl font-medium border-b border-transparent hover:border-gray-200 focus:border-[#6b857a] focus:border-b-2 outline-none pb-2 transition-all"
                      placeholder="ฟอร์มไม่มีชื่อ"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <textarea
                      className="w-full text-sm text-gray-600 border-b border-transparent hover:border-gray-200 focus:border-[#6b857a] focus:border-b-2 outline-none pb-1 transition-all resize-none"
                      placeholder="คำอธิบายแบบฟอร์ม"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                {/* ── Template Banner ── */}
                <div
                  className="bg-gradient-to-r from-[#6b857a]/10 to-transparent border border-[#6b857a]/20 hover:border-[#6b857a]/50 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer group transition-all gap-4"
                  onClick={() => setShowTemplates(true)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-[#6b857a] p-3 rounded-xl text-white shadow-sm group-hover:scale-105 transition-transform">
                      <BookTemplate size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-[#6b857a] transition-colors text-base sm:text-lg">
                        เลือกจากเทมเพลตแบบสอบถาม
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        ใช้โครงสร้างและคำถามที่เคยบันทึกไว้
                        เพื่อความรวดเร็วในการสร้างแบบสอบถาม
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-white text-[#6b857a] font-medium shadow-sm hover:bg-gray-50 shrink-0 border border-gray-200"
                    variant="flat"
                    onPress={() => setShowTemplates(true)}
                  >
                    เลือกเทมเพลต
                  </Button>
                </div>

                {/* ── Settings Card ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                    <div className="flex items-center justify-between w-full">
                      <label className="text-sm font-medium text-gray-700">
                        บันทึกเป็นเทมเพลตสำหรับใช้ในครั้งต่อไป
                      </label>
                      <Switch
                        color="success"
                        isSelected={saveAsTemplate}
                        size="sm"
                        onValueChange={setSaveAsTemplate}
                      />
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <label className="text-sm font-medium text-gray-700">
                        จำเป็นต้องทำแบบสอบถามก่อนรับเกียรติบัตร
                      </label>
                      <Switch
                        color="success"
                        isSelected={isRequiredForCert}
                        size="sm"
                        onValueChange={setIsRequiredForCert}
                      />
                    </div>
                  </div>

                  {saveAsTemplate && (
                    <div className="pt-2 border-t border-gray-100">
                      <input
                        className="w-full sm:w-1/2 text-sm bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#6b857a] outline-none px-4 py-2.5 rounded-lg transition-all"
                        placeholder="ชื่อเทมเพลต (ค่าเริ่มต้นจะใช้ชื่อฟอร์ม)"
                        value={templateTitle}
                        onChange={(e) => setTemplateTitle(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* ── Questions List ── */}
                <div className="space-y-4 pb-4">
                  {questions.map((q, i) => (
                    <div
                      key={i}
                      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5 relative group ${
                        q.type === "header"
                          ? "border-l-4 border-l-purple-500"
                          : ""
                      }`}
                    >
                      {/* Left Accent Bar on Hover */}
                      {q.type !== "header" && (
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-transparent group-hover:bg-gray-200 transition-colors rounded-l-xl" />
                      )}

                      {/* Top Row: Title Input & Type Selector */}
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <input
                          className="flex-1 w-full text-base bg-gray-50 hover:bg-gray-100 focus:bg-gray-50 border-b border-gray-300 focus:border-[#6b857a] focus:border-b-2 outline-none px-4 py-3 rounded-t-md transition-all"
                          placeholder={
                            q.type === "scale"
                              ? "คำถามความพึงพอใจ"
                              : q.type === "text"
                                ? "คำถามปลายเปิด"
                                : "ชื่อส่วน/หัวข้อ"
                          }
                          value={q.text}
                          onChange={(e) =>
                            updateQuestion(i, "text", e.target.value)
                          }
                        />
                        <div className="relative w-full sm:w-56 shrink-0">
                          <Select
                            aria-label="ประเภทคำถาม"
                            className="w-full"
                            classNames={{
                              trigger:
                                "border border-gray-300 rounded-md outline-none focus-within:border-[#6b857a] bg-white h-[46px] shadow-none hover:bg-white data-[hover=true]:bg-white",
                              value: "text-sm text-gray-700 font-medium",
                            }}
                            renderValue={(items) => {
                              return items.map((item) => (
                                <div
                                  key={item.key}
                                  className="flex items-center gap-2"
                                >
                                  {item.key === "scale" && (
                                    <CircleDot
                                      className="text-gray-500"
                                      size={16}
                                    />
                                  )}
                                  {item.key === "grid" && (
                                    <LayoutGrid
                                      className="text-gray-500"
                                      size={16}
                                    />
                                  )}
                                  {item.key === "text" && (
                                    <AlignLeft
                                      className="text-gray-500"
                                      size={16}
                                    />
                                  )}
                                  {item.key === "header" && (
                                    <Heading
                                      className="text-gray-500"
                                      size={16}
                                    />
                                  )}
                                  <span>{item.textValue}</span>
                                </div>
                              ));
                            }}
                            selectedKeys={[q.type]}
                            onChange={(e) => {
                              if (e.target.value) {
                                updateQuestion(
                                  i,
                                  "type",
                                  e.target.value as
                                    | "text"
                                    | "scale"
                                    | "header"
                                    | "grid",
                                );
                              }
                            }}
                          >
                            <SelectItem
                              key="scale"
                              textValue="ระดับความพึงพอใจ"
                            >
                              <div className="flex items-center gap-2">
                                <CircleDot
                                  className="text-gray-500"
                                  size={16}
                                />
                                <span>ระดับความพึงพอใจ</span>
                              </div>
                            </SelectItem>
                            <SelectItem
                              key="text"
                              textValue="ข้อความ (ปลายเปิด)"
                            >
                              <div className="flex items-center gap-2">
                                <AlignLeft
                                  className="text-gray-500"
                                  size={16}
                                />
                                <span>ข้อความ (ปลายเปิด)</span>
                              </div>
                            </SelectItem>
                            <SelectItem key="header" textValue="ส่วนแบ่งหัวข้อ">
                              <div className="flex items-center gap-2">
                                <Heading className="text-gray-500" size={16} />
                                <span>ส่วนแบ่งหัวข้อ</span>
                              </div>
                            </SelectItem>
                          </Select>
                        </div>
                      </div>

                      {/* Mock UI Preview */}
                      <div className="pl-2 pt-2">
                        {q.type === "scale" && (
                          <div className="flex items-center gap-4 text-gray-500">
                            <span className="text-sm font-medium">
                              {globalScaleMax}
                            </span>
                            <div className="flex gap-4">
                              {Array.from({ length: globalScaleMax }).map(
                                (_, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col items-center gap-2"
                                  >
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                                    <span className="text-xs text-gray-400">
                                      {globalScaleMax - idx}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                            <span className="text-sm font-medium">1</span>
                          </div>
                        )}
                        {q.type === "text" && (
                          <div className="border-b border-dotted border-gray-400 w-full sm:w-2/3 pb-1 text-sm text-gray-400">
                            ข้อความคำตอบแบบยาว
                          </div>
                        )}
                        {q.type === "header" && (
                          <div className="border-b-2 border-purple-200 w-full pb-2 text-sm text-purple-600 font-medium italic">
                            (ส่วนนี้จะแสดงเป็นตัวหนาขนาดใหญ่
                            เพื่อคั่นเนื้อหาแบบสอบถาม)
                          </div>
                        )}
                        {q.type === "grid" && (
                          <div className="w-full space-y-2 mt-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              หัวข้อย่อยที่จะให้คะแนน 1-5 (แถว)
                            </p>
                            {q.options?.map((opt, rIdx) => (
                              <div
                                key={rIdx}
                                className="flex items-center gap-3"
                              >
                                <span className="text-sm font-medium text-gray-400 w-4 text-right">
                                  {rIdx + 1}.
                                </span>
                                <input
                                  className="flex-1 text-sm bg-white border border-gray-300 focus:border-[#6b857a] outline-none px-3 py-2 rounded-md transition-all"
                                  placeholder="เช่น ความสะอาดของสถานที่"
                                  value={opt}
                                  onChange={(e) =>
                                    updateGridRow(i, rIdx, e.target.value)
                                  }
                                />
                                <button
                                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:hover:text-gray-400"
                                  disabled={(q.options?.length || 0) <= 1}
                                  onClick={() => removeGridRow(i, rIdx)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                            <button
                              className="mt-2 text-sm text-[#6b857a] hover:text-[#5a7268] font-medium flex items-center gap-1 transition-colors"
                              onClick={() => addGridRow(i)}
                            >
                              <Plus size={14} /> เพิ่มรายการย่อย
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-1 pt-4 border-t border-gray-100 mt-2 text-gray-500">
                        <button
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30"
                          disabled={i === 0}
                          title="เลื่อนขึ้น"
                          onClick={() => moveQuestion(i, -1)}
                        >
                          <ChevronUp size={20} />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30"
                          disabled={i === questions.length - 1}
                          title="เลื่อนลง"
                          onClick={() => moveQuestion(i, 1)}
                        >
                          <ChevronDown size={20} />
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-2" />
                        <button
                          className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors disabled:opacity-30"
                          disabled={questions.length === 1}
                          title="ลบคำถาม"
                          onClick={() => removeQuestion(i)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* ── Floating Add Action Bar ── */}
                  <div className="flex justify-center sticky bottom-6 z-20">
                    <div className="bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-200 px-2 py-2 flex items-center gap-1">
                      <button
                        className="px-4 py-2 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors"
                        onClick={() => addQuestion("scale")}
                      >
                        <Plus className="text-[#6b857a]" size={16} />
                        ระดับคะแนน
                      </button>
                      <div className="w-px h-6 bg-gray-200 mx-1" />
                      <button
                        className="px-4 py-2 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors"
                        onClick={() => addQuestion("text")}
                      >
                        <Plus className="text-[#6b857a]" size={16} />
                        ข้อความ
                      </button>
                      <div className="w-px h-6 bg-gray-200 mx-1" />
                      <button
                        className="px-4 py-2 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors"
                        onClick={() => addQuestion("header")}
                      >
                        <Plus className="text-[#6b857a]" size={16} />
                        หัวข้อ
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Bottom Padding ── */}
                <div className="pb-4" />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Template Selection Modal */}
      <Modal isOpen={showTemplates} onOpenChange={setShowTemplates}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg font-medium">
                เลือกเทมเพลต
              </ModalHeader>
              <ModalBody className="pb-6">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {loadingTemplates ? (
                    <p className="text-sm text-gray-400 p-4 text-center">
                      กำลังโหลด...
                    </p>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-gray-400 p-4 text-center">
                      ยังไม่มีเทมเพลต
                    </p>
                  ) : (
                    templates.map((tpl) => (
                      <div
                        key={tpl.template_id}
                        className="flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 group cursor-pointer"
                        onClick={() => {
                          applyTemplate(tpl);
                          onClose();
                        }}
                      >
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {tpl.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {tpl.survey_template_question.length} รายการ
                          </p>
                        </div>
                        <button
                          className="p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                          title="ลบเทมเพลต"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(tpl.template_id);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
