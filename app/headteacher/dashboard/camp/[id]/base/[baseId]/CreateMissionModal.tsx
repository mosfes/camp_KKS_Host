"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useState } from "react";
import { Save, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

import { useStatusModal } from "@/components/StatusModalProvider";

interface CreateMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseId: number;
  onMissionCreated: () => void;
}

// ประเภทภารกิจ (ตรงกับ MissionType enum ใน schema)
const MISSION_TYPES = [
  { key: "QUESTION_ANSWERING", label: "ตอบคำถาม" },
  { key: "PHOTO_SUBMISSION", label: "ส่งรูปภาพ" },
  { key: "QR_CODE_SCANNING", label: "สแกน QR Code" },
  { key: "MULTIPLE_CHOICE_QUIZ", label: "แบบทดสอบหลายตัวเลือก" },
];

const inputCls = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b857a] focus:border-[#6b857a] outline-none transition-colors text-sm";

export default function CreateMissionModal({
  isOpen,
  onClose,
  baseId,
  onMissionCreated,
}: CreateMissionModalProps) {
  const { showError, showSuccess } = useStatusModal();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("QUESTION_ANSWERING");
  const [description, setDescription] = useState("");
  const [textQuestions, setTextQuestions] = useState([{ text: "" }]);
  const [mcqQuestions, setMcqQuestions] = useState([
    { text: "", choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] },
  ]);
  const [loading, setLoading] = useState(false);

  // MCQ Handlers
  const addMcqQuestion = () =>
    setMcqQuestions([...mcqQuestions, { text: "", choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] }]);

  const removeMcqQuestion = (i: number) => {
    if (mcqQuestions.length <= 1) return;
    setMcqQuestions(mcqQuestions.filter((_, idx) => idx !== i));
  };

  const addTextQuestion = () => setTextQuestions([...textQuestions, { text: "" }]);
  const removeTextQuestion = (i: number) => {
    if (textQuestions.length <= 1) return;
    setTextQuestions(textQuestions.filter((_, idx) => idx !== i));
  };
  const updateTextQ = (i: number, val: string) => {
    const q = [...textQuestions]; q[i].text = val; setTextQuestions(q);
  };

  const updateQText = (qi: number, text: string) => {
    const q = [...mcqQuestions]; q[qi].text = text; setMcqQuestions(q);
  };

  const addChoice = (qi: number) => {
    const q = [...mcqQuestions]; q[qi].choices.push({ text: "", isCorrect: false }); setMcqQuestions(q);
  };

  const removeChoice = (qi: number, ci: number) => {
    const q = [...mcqQuestions];
    if (q[qi].choices.length <= 2) return;
    q[qi].choices = q[qi].choices.filter((_, i) => i !== ci);
    setMcqQuestions(q);
  };

  const updateChoiceText = (qi: number, ci: number, text: string) => {
    const q = [...mcqQuestions]; q[qi].choices[ci].text = text; setMcqQuestions(q);
  };

  const setCorrect = (qi: number, ci: number) => {
    const q = [...mcqQuestions];
    q[qi].choices = q[qi].choices.map((c, i) => ({ ...c, isCorrect: i === ci }));
    setMcqQuestions(q);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { showError("ข้อผิดพลาด", "กรุณากรอกชื่อภารกิจ"); return; }

    if (type === "MULTIPLE_CHOICE_QUIZ") {
      for (let i = 0; i < mcqQuestions.length; i++) {
        const q = mcqQuestions[i];
        if (!q.text.trim()) { showError("ข้อผิดพลาด", `คำถามที่ ${i + 1} ยังว่างอยู่`); return; }
        if (q.choices.some((c) => !c.text.trim())) { showError("ข้อผิดพลาด", `กรุณากรอกตัวเลือกในคำถามที่ ${i + 1} ให้ครบ`); return; }
        if (!q.choices.some((c) => c.isCorrect)) { showError("ข้อผิดพลาด", `กรุณาเลือกคำตอบที่ถูกต้องสำหรับคำถามที่ ${i + 1}`); return; }
      }
    } else if (type === "QUESTION_ANSWERING") {
      for (let i = 0; i < textQuestions.length; i++) {
        if (!textQuestions[i].text.trim()) { showError("ข้อผิดพลาด", `คำถามที่ ${i + 1} ยังว่างอยู่`); return; }
      }
    }

    try {
      setLoading(true);
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, type, description,
          questions: type === "MULTIPLE_CHOICE_QUIZ" ? mcqQuestions : (type === "QUESTION_ANSWERING" ? textQuestions : undefined),
          stationId: baseId,
        }),
      });
      if (!res.ok) throw new Error();
      showSuccess("สำเร็จ", "สร้างภารกิจสำเร็จ");
      onClose(); onMissionCreated();
      setTitle(""); setType("QUESTION_ANSWERING"); setDescription(""); setTextQuestions([{ text: "" }]);
      setMcqQuestions([{ text: "", choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] }]);
    } catch {
      showError("ข้อผิดพลาด", "สร้างภารกิจไม่สำเร็จ");
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
      onOpenChange={onClose}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">สร้างภารกิจ</h2>
              <p className="text-sm text-gray-500 font-normal">ตั้งค่าภารกิจใหม่สำหรับนักเรียน</p>
            </ModalHeader>

            <ModalBody className="py-6 space-y-5 px-6">
              {/* ชื่อภารกิจ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อภารกิจ <span className="text-red-500">*</span>
                </label>
                <input className={inputCls} placeholder="เช่น ถ่ายรูปสัตว์ป่า" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              {/* ประเภทภารกิจ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทภารกิจ</label>
                <select
                  className={inputCls}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {MISSION_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>

              {/* รายละเอียด */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <textarea className={`${inputCls} resize-none`} placeholder="อธิบายภารกิจนี้โดยย่อ" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              {/* ตอบคำถาม */}
              {type === "QUESTION_ANSWERING" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-[#6b857a] rounded-full" />
                    <label className="text-sm font-semibold text-gray-700">คำถาม</label>
                  </div>
                  {textQuestions.map((q, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">
                          {i + 1}
                        </span>
                        <input
                          className={`${inputCls} pl-8`}
                          placeholder="กรอกคำถาม..."
                          value={q.text}
                          onChange={(e) => updateTextQ(i, e.target.value)}
                        />
                      </div>
                      {textQuestions.length > 1 && (
                        <button
                          className="p-2 text-[#E84A5F] opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:text-[#FF847C] hover:bg-[#E84A5F]/10 rounded-lg transition-all"
                          onClick={() => removeTextQuestion(i)}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    className="w-full py-2 border-2 border-dashed border-gray-200 hover:border-[#6b857a] rounded-xl text-xs text-gray-500 hover:text-[#6b857a] font-medium transition-colors flex items-center justify-center gap-1"
                    onClick={addTextQuestion}
                  >
                    <Plus size={14} /> เพิ่มคำถาม
                  </button>
                </div>
              )}

              {/* แบบทดสอบหลายตัวเลือก */}
              {type === "MULTIPLE_CHOICE_QUIZ" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-[#6b857a] rounded-full" />
                    <label className="text-sm font-semibold text-gray-700">คำถามแบบทดสอบ</label>
                  </div>

                  {mcqQuestions.map((q, qi) => (
                    <div key={qi} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                      {mcqQuestions.length > 1 && (
                        <button
                          className="p-2 text-[#E84A5F] opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:text-[#FF847C] hover:bg-[#E84A5F]/10 rounded-lg transition-all absolute top-3 right-3"
                          onClick={() => removeMcqQuestion(qi)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">คำถามที่ {qi + 1}</p>
                      <input
                        className={`${inputCls} mb-3 bg-white`}
                        placeholder="กรอกข้อความคำถาม"
                        value={q.text}
                        onChange={(e) => updateQText(qi, e.target.value)}
                      />

                      <div className="space-y-2 pl-2 border-l-2 border-[#6b857a]/20 ml-1">
                        {q.choices.map((c, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <button
                              className={`p-1 rounded-full transition-colors flex-shrink-0 ${c.isCorrect ? "text-[#6b857a]" : "text-gray-300 hover:text-gray-400"}`}
                              title="เลือกเป็นคำตอบที่ถูกต้อง"
                              onClick={() => setCorrect(qi, ci)}
                            >
                              {c.isCorrect ? (
                                <CheckCircle2 size={20} />
                              ) : (
                                <Circle size={20} />
                              )}
                            </button>
                            <input
                              className={`flex-1 px-3 py-1.5 border rounded-lg text-sm outline-none transition-colors ${c.isCorrect ? "border-[#6b857a] ring-1 ring-[#6b857a] bg-[#6b857a]/5" : "border-gray-300 focus:border-[#6b857a] focus:ring-1 focus:ring-[#6b857a]"}`}
                              placeholder={`ตัวเลือกที่ ${ci + 1}`}
                              value={c.text}
                              onChange={(e) => updateChoiceText(qi, ci, e.target.value)}
                            />
                            {q.choices.length > 2 && (
                              <button className="text-[#E84A5F] opacity-70 hover:opacity-100 hover:text-[#FF847C] hover:bg-[#E84A5F]/10 p-1 rounded transition-colors" onClick={() => removeChoice(qi, ci)}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          className="flex items-center gap-1 text-xs text-[#6b857a] hover:text-[#5a7268] font-medium ml-7 mt-1"
                          onClick={() => addChoice(qi)}
                        >
                          <Plus size={14} /> เพิ่มตัวเลือก
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-[#6b857a] rounded-xl text-sm text-gray-500 hover:text-[#6b857a] font-medium transition-colors flex items-center justify-center gap-2"
                    onClick={addMcqQuestion}
                  >
                    <Plus size={16} /> เพิ่มคำถามอีก
                  </button>
                </div>
              )}
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
                สร้างภารกิจ
              </Button>
              <Button fullWidth className="font-medium text-gray-600" size="lg" variant="light" onPress={onClose}>
                ยกเลิก
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
