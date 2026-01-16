
"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
} from "@heroui/react";
import { useState } from "react";
import { Save, Plus, Trash2, CheckCircle2, GripVertical } from "lucide-react";
import { useStatusModal } from "@/components/StatusModalProvider";

interface CreateMissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseId: number;
    onMissionCreated: () => void;
}

const MISSION_TYPES = [
    { key: "QUESTION_ANSWERING", label: "Question Answering" },
    { key: "PHOTO_SUBMISSION", label: "Photo Submission" },
    { key: "QR_CODE_SCANNING", label: "QR Code Scanning" },
    { key: "MULTIPLE_CHOICE_QUIZ", label: "Multiple Choice Quiz" },
];

export default function CreateMissionModal({ isOpen, onClose, baseId, onMissionCreated }: CreateMissionModalProps) {
    const { showError, showSuccess } = useStatusModal();

    // Form States
    const [title, setTitle] = useState("");
    const [type, setType] = useState<string>("QUESTION_ANSWERING");
    const [description, setDescription] = useState("");
    const [instructions, setInstructions] = useState("");

    // QA State
    const [question, setQuestion] = useState("");

    // MCQ State: List of questions
    const [mcqQuestions, setMcqQuestions] = useState([
        {
            text: "",
            choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }]
        }
    ]);

    const [loading, setLoading] = useState(false);

    // MCQ Handlers
    const addMcqQuestion = () => {
        setMcqQuestions([
            ...mcqQuestions,
            {
                text: "",
                choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }]
            }
        ]);
    };

    const removeMcqQuestion = (qIndex: number) => {
        if (mcqQuestions.length <= 1) return;
        setMcqQuestions(mcqQuestions.filter((_, i) => i !== qIndex));
    };

    const updateMcqQuestionText = (qIndex: number, text: string) => {
        const newQuestions = [...mcqQuestions];
        newQuestions[qIndex].text = text;
        setMcqQuestions(newQuestions);
    };

    const addChoice = (qIndex: number) => {
        const newQuestions = [...mcqQuestions];
        newQuestions[qIndex].choices.push({ text: "", isCorrect: false });
        setMcqQuestions(newQuestions);
    };

    const removeChoice = (qIndex: number, cIndex: number) => {
        const newQuestions = [...mcqQuestions];
        if (newQuestions[qIndex].choices.length <= 2) return;
        newQuestions[qIndex].choices = newQuestions[qIndex].choices.filter((_, i) => i !== cIndex);
        setMcqQuestions(newQuestions);
    };

    const updateChoiceText = (qIndex: number, cIndex: number, text: string) => {
        const newQuestions = [...mcqQuestions];
        newQuestions[qIndex].choices[cIndex].text = text;
        setMcqQuestions(newQuestions);
    };

    const setCorrectChoice = (qIndex: number, cIndex: number) => {
        const newQuestions = [...mcqQuestions];
        newQuestions[qIndex].choices = newQuestions[qIndex].choices.map((c, i) => ({
            ...c,
            isCorrect: i === cIndex
        }));
        setMcqQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        if (!title.trim()) {
            showError("Error", "Mission Name is required");
            return;
        }

        // Validate
        if (type === "MULTIPLE_CHOICE_QUIZ") {
            for (let i = 0; i < mcqQuestions.length; i++) {
                const q = mcqQuestions[i];
                if (!q.text.trim()) {
                    showError("Error", `Question ${i + 1} is empty`);
                    return;
                }
                if (q.choices.some(c => !c.text.trim())) {
                    showError("Error", `All choices in Question ${i + 1} must be filled`);
                    return;
                }
                if (!q.choices.some(c => c.isCorrect)) {
                    showError("Error", `Please select a correct answer for Question ${i + 1}`);
                    return;
                }
            }
        } else if (type === "QUESTION_ANSWERING") {
            if (!question.trim()) {
                showError("Error", "Question is required");
                return;
            }
        }

        try {
            setLoading(true);
            const response = await fetch("/api/missions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    type,
                    description,
                    instructions,
                    question: type === "QUESTION_ANSWERING" ? question : undefined,
                    questions: type === "MULTIPLE_CHOICE_QUIZ" ? mcqQuestions : undefined,
                    stationId: baseId
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to create mission");
            }

            showSuccess("Success", "Mission created successfully");
            onClose();
            onMissionCreated();

            // Reset Form 
            setTitle("");
            setType("QUESTION_ANSWERING");
            setDescription("");
            setInstructions("");
            setQuestion("");
            setMcqQuestions([{
                text: "",
                choices: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }]
            }]);

        } catch (error) {
            console.error("Error creating mission:", error);
            showError("Error", "Failed to create mission");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="3xl"
            backdrop="blur"
            scrollBehavior="inside"
            classNames={{
                base: "bg-white rounded-2xl shadow-xl",
                backdrop: "bg-black/60 backdrop-blur-sm",
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 p-6 pb-2">
                            <h2 className="text-2xl font-bold text-gray-900">Create Mission</h2>
                            <p className="text-sm text-gray-500 font-normal">
                                Set up a new mission for students
                            </p>
                        </ModalHeader>

                        <ModalBody className="py-6 space-y-4">
                            {/* Mission Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mission Name
                                </label>
                                <Input
                                    placeholder="e.g., Capture Wildlife Photos"
                                    value={title}
                                    onValueChange={setTitle}
                                    variant="bordered"
                                    classNames={{
                                        inputWrapper: "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                                    }}
                                />
                            </div>

                            {/* Mission Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mission Type
                                </label>
                                <Select
                                    placeholder="Select a mission type"
                                    selectedKeys={[type]}
                                    onChange={(e) => setType(e.target.value)}
                                    variant="bordered"
                                    classNames={{
                                        trigger: "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                                    }}
                                >
                                    {MISSION_TYPES.map((t) => (
                                        <SelectItem key={t.key} value={t.key}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <Textarea
                                    placeholder="Briefly describe this mission"
                                    value={description}
                                    onValueChange={setDescription}
                                    variant="bordered"
                                    minRows={2}
                                    classNames={{
                                        inputWrapper: "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                                    }}
                                />
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Instructions for Students
                                </label>
                                <Textarea
                                    placeholder="Provide detailed instructions"
                                    value={instructions}
                                    onValueChange={setInstructions}
                                    variant="bordered"
                                    minRows={3}
                                    classNames={{
                                        inputWrapper: "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                                    }}
                                />
                            </div>

                            {/* Question Answering Field */}
                            {type === "QUESTION_ANSWERING" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Question
                                    </label>
                                    <Input
                                        placeholder="Enter the question"
                                        value={question}
                                        onValueChange={setQuestion}
                                        variant="bordered"
                                        classNames={{
                                            inputWrapper: "bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors"
                                        }}
                                    />
                                </div>
                            )}

                            {/* Multiple Questions for Quiz */}
                            {type === "MULTIPLE_CHOICE_QUIZ" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">
                                            Quiz Questions
                                        </label>
                                    </div>

                                    {mcqQuestions.map((q, qIndex) => (
                                        <div key={qIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                                            {/* Remove Question Button */}
                                            {mcqQuestions.length > 1 && (
                                                <button
                                                    onClick={() => removeMcqQuestion(qIndex)}
                                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}

                                            <div className="mb-4 pr-8">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                                    Question {qIndex + 1}
                                                </label>
                                                <Input
                                                    placeholder="Enter question text"
                                                    value={q.text}
                                                    onValueChange={(val) => updateMcqQuestionText(qIndex, val)}
                                                    variant="flat"
                                                    classNames={{
                                                        input: "font-medium text-gray-900",
                                                        inputWrapper: "bg-white border hover:bg-white"
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-2 pl-2 border-l-2 border-gray-200 ml-1">
                                                {q.choices.map((choice, cIndex) => (
                                                    <div key={cIndex} className="flex items-center gap-2">
                                                        <div
                                                            className={`cursor-pointer p-1 rounded-full ${choice.isCorrect ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}
                                                            onClick={() => setCorrectChoice(qIndex, cIndex)}
                                                            title="Mark as correct answer"
                                                        >
                                                            <CheckCircle2 size={20} fill={choice.isCorrect ? "currentColor" : "none"} />
                                                        </div>
                                                        <Input
                                                            size="sm"
                                                            placeholder={`Option ${cIndex + 1}`}
                                                            value={choice.text}
                                                            onValueChange={(val) => updateChoiceText(qIndex, cIndex, val)}
                                                            variant="bordered"
                                                            classNames={{
                                                                inputWrapper: `bg-white h-9 ${choice.isCorrect ? 'border-green-500 ring-1 ring-green-500' : ''}`
                                                            }}
                                                        />
                                                        {q.choices.length > 2 && (
                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                variant="light"
                                                                className="text-gray-400 hover:text-red-500 min-w-8 w-8 h-8"
                                                                onPress={() => removeChoice(qIndex, cIndex)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    startContent={<Plus size={14} />}
                                                    onPress={() => addChoice(qIndex)}
                                                    className="text-gray-600 h-8 gap-1 ml-7"
                                                >
                                                    Add Option
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        fullWidth
                                        variant="dashed"
                                        className="border-2 border-dashed border-gray-300 text-gray-600 font-medium h-12"
                                        startContent={<Plus size={18} />}
                                        onPress={addMcqQuestion}
                                    >
                                        Add Another Question
                                    </Button>
                                </div>
                            )}

                        </ModalBody>

                        <ModalFooter className="p-6 pt-2">
                            <Button
                                className="bg-[#6b857a] text-white font-medium"
                                startContent={<Save size={18} />}
                                onPress={handleSubmit}
                                isLoading={loading}
                            >
                                Create Mission
                            </Button>
                            <Button
                                variant="light"
                                onPress={onClose}
                                className="text-gray-700 font-medium bg-[#f5f1e8]"
                            >
                                Cancel
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
