"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { ChevronLeft, FileText, CheckCircle2, Circle } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudentStationDetailPage() {
  const params = useParams(); // { id: campId, stationId: stationId }
  const router = useRouter();
  const { id, stationId } = params;

  const [camp, setCamp] = useState<any>(null);
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mission Execution State
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({}); // { questionId: value }
  const [submitting, setSubmitting] = useState(false);

  const fetchCamp = async () => {
    try {
      const res = await fetch("/api/student/camps");

      if (res.ok) {
        const data = await res.json();
        const foundCamp = data.find((c: any) => c.id === Number(id));

        if (foundCamp) {
          setCamp(foundCamp);
          // Find Station
          // Note: Original endpoint structure puts 'stations' under camp with full nested data
          const foundStation = foundCamp.station?.find(
            (s: any) => s.station_id === Number(stationId),
          );

          if (foundStation) {
            setStation(foundStation);
          } else {
            toast.error("ไม่พบฐานกิจกรรม");
          }
        } else {
          toast.error("ไม่พบค่าย");
        }
      }
    } catch (error) {
      console.error("Failed to fetch camp", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamp();
  }, [id, stationId]);

  const openMission = (mission: any) => {
    setSelectedMission(mission);
    setAnswers({});
    onOpen();
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers((prev: any) => ({ ...prev, [questionId]: value }));
  };

  const submitMission = async () => {
    if (!selectedMission) return;
    setSubmitting(true);

    // Transform answers
    const payloadAnswers = Object.entries(answers).map(([qid, val]) => {
      // Determine type from mission questions
      const q = selectedMission.mission_question.find(
        (mq: any) => mq.question_id === Number(qid),
      );

      return {
        questionId: Number(qid),
        type: q?.question_type,
        value: val,
      };
    });

    try {
      const res = await fetch("/api/student/mission/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: Number(id),
          missionId: selectedMission.mission_id,
          answers: payloadAnswers,
        }),
      });

      if (res.ok) {
        toast.success("ส่งภารกิจสำเร็จ!");
        onClose();
        fetchCamp(); // Refresh status
      } else {
        toast.error("ส่งภารกิจล้มเหลว");
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการส่ง");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to check if mission is completed
  const isMissionCompleted = (missionId: number) => {
    if (!camp || !camp.missionResults) return false;

    // Check if any result confirms completion for this mission
    // status='completed'
    return camp.missionResults.some(
      (r: any) =>
        r.mission_mission_id === missionId && r.status === "completed",
    );
  };

  if (loading)
    return (
      <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">
        กำลังโหลด...
      </div>
    );
  if (!station)
    return (
      <div className="p-8 text-center bg-[#F5F1E8] min-h-screen">
        ไม่พบฐานกิจกรรม
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-50">
        <Button isIconOnly variant="light" onPress={() => router.back()}>
          <ChevronLeft className="text-gray-600" size={24} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-[#2d3748]">{station.name}</h1>
          <p className="text-sm text-gray-500">{camp.title}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <p className="text-gray-600 mb-6">{station.description}</p>

        {station.mission?.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            ยังไม่มีภารกิจในฐานนี้
          </div>
        )}

        {station.mission?.map((mission: any) => {
          const completed = isMissionCompleted(mission.mission_id);

          return (
            <div
              key={mission.mission_id}
              className={`
                                bg-white p-5 rounded-2xl shadow-sm border transaction-all
                                ${completed ? "border-green-200 bg-green-50" : "border-transparent hover:border-[#5d7c6f] cursor-pointer"}
                            `}
              onClick={() => !completed && openMission(mission)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 ${completed ? "text-green-600" : "text-gray-400"}`}
                  >
                    {completed ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`font-bold ${completed ? "text-green-800" : "text-gray-800"}`}
                    >
                      {mission.title || "ภารกิจ"}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {mission.description}
                    </p>
                  </div>
                </div>
                {completed && (
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    สำเร็จ
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mission Execution Modal */}
      <Modal
        classNames={{
          base: "bg-white",
          header: "border-b border-gray-100",
          footer: "border-t border-gray-100",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-sm font-normal text-gray-500">
                  ทำภารกิจ
                </span>
                <h2 className="text-xl font-bold">{selectedMission?.title}</h2>
              </ModalHeader>
              <ModalBody className="py-6 space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm leading-relaxed">
                  <h4 className="font-bold mb-1 flex items-center gap-2">
                    <FileText size={16} /> คำชี้แจง
                  </h4>
                  {selectedMission?.instructions || "ไม่มีคำชี้แจงเพิ่มเติม"}
                </div>

                {/* Questions */}
                <div className="space-y-6">
                  {selectedMission?.mission_question?.map(
                    (q: any, idx: number) => (
                      <div key={q.question_id} className="space-y-3">
                        <label className="block font-semibold text-gray-700">
                          {idx + 1}. {q.question_text}
                        </label>

                        {q.question_type === "TEXT" && (
                          <Textarea
                            minRows={3}
                            placeholder="พิมพ์คำตอบของคุณที่นี่..."
                            value={answers[q.question_id] || ""}
                            variant="bordered"
                            onValueChange={(val) =>
                              handleAnswerChange(q.question_id, val)
                            }
                          />
                        )}

                        {q.question_type === "MCQ" && (
                          <div className="space-y-2">
                            {q.choices?.map((c: any) => (
                              <div
                                key={c.choice_id}
                                className={`
                                                                p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors
                                                                ${
                                                                  answers[
                                                                    q
                                                                      .question_id
                                                                  ] ===
                                                                  c.choice_text
                                                                    ? "bg-[#5d7c6f] text-white border-[#5d7c6f]"
                                                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                                                }
                                                            `}
                                onClick={() =>
                                  handleAnswerChange(
                                    q.question_id,
                                    c.choice_text,
                                  )
                                }
                              >
                                <div
                                  className={`
                                                                w-5 h-5 rounded-full border flex items-center justify-center shrink-0
                                                                ${answers[q.question_id] === c.choice_text ? "border-white" : "border-gray-300"}
                                                            `}
                                >
                                  {answers[q.question_id] === c.choice_text && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                  )}
                                </div>
                                <span>{c.choice_text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  className="bg-[#5d7c6f] text-white font-bold"
                  isLoading={submitting}
                  onPress={submitMission}
                >
                  ส่งคำตอบ
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
