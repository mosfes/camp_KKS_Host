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
  const params = useParams();
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
      const res = await fetch("/api/student/camps", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const foundCamp = data.find((c: any) => c.id === Number(id));

        if (foundCamp) {
          if (!foundCamp.isRegistered) {
            toast.error("กรุณาลงทะเบียนเข้าร่วมค่ายก่อนเข้าถึงหน้าภารกิจ");
            router.replace(`/student/dashboard/camp/${id}`);
            return;
          }
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
    
    const existingResult = camp?.missionResults?.find((r: any) => r.mission_mission_id === mission.mission_id);
    const initialAnswers: any = {};
    if (existingResult && existingResult.mission_answer) {
      existingResult.mission_answer.forEach((ans: any) => {
        const qid = ans.mission_question_question_id;
        if (ans.answer_text && ans.answer_text.length > 0) {
          initialAnswers[qid] = ans.answer_text[0].answer_text;
        } else if (ans.answer_mcq && ans.answer_mcq.length > 0) {
          initialAnswers[qid] = ans.answer_mcq[0].question_text;
        }
      });
    }
    
    setAnswers(initialAnswers);
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

    const isDraft = selectedMission.mission_question.some(
      (q: any) => !answers[q.question_id] || String(answers[q.question_id]).trim() === ""
    );

    try {
      const res = await fetch("/api/student/mission/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId: Number(id),
          missionId: selectedMission.mission_id,
          answers: payloadAnswers,
          isDraft: isDraft,
        }),
      });

      if (res.ok) {
        toast.success(isDraft ? "บันทึกคำตอบสำเร็จ!" : "ส่งภารกิจสำเร็จ!");
        await fetchCamp(); // Refresh status
        if (!isDraft) {
          onClose();
        }
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
                                bg-white p-5 rounded-2xl shadow-sm border transition-all cursor-pointer
                                ${completed ? "border-green-200 bg-green-50 hover:border-green-300" : "border-transparent hover:border-[#5d7c6f]"}
                            `}
              onClick={() => openMission(mission)}
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
                {/* Mission Description */}
                {selectedMission?.description && (
                  <div className="bg-blue-50/50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-blue-100/50">
                    <h4 className="font-bold text-[#5d7c6f] mb-1">รายละเอียดภารกิจ:</h4>
                    <p className="whitespace-pre-wrap">{selectedMission.description}</p>
                  </div>
                )}

                {/* Questions */}
                <div className="space-y-6">
                  {(() => {
                    const currentResult = camp?.missionResults?.find((r: any) => r.mission_mission_id === selectedMission?.mission_id);
                    const isSubmitted = currentResult?.status === "completed";
                    
                    return selectedMission?.mission_question?.map(
                      (q: any, idx: number) => (
                        <div key={q.question_id} className="space-y-3">
                          <label className="block font-semibold text-gray-700">
                            {idx + 1}. {q.question_text}
                          </label>

                          {q.question_type === "TEXT" && (
                            <Textarea
                              minRows={3}
                              placeholder={isSubmitted ? "" : "พิมพ์คำตอบของคุณที่นี่..."}
                              value={answers[q.question_id] || ""}
                              variant="bordered"
                              isReadOnly={isSubmitted}
                              onValueChange={(val) =>
                                handleAnswerChange(q.question_id, val)
                              }
                            />
                        )}

                        {q.question_type === "MCQ" && (
                          <div className="space-y-2">
                            {q.choices?.map((c: any, choiceIdx: number) => {
                              const choiceLetter = String.fromCharCode(65 + choiceIdx); // 0=A, 1=B, 2=C...
                              
                              return (
                                <div
                                  key={c.choice_id}
                                  className={`
                                      p-3 rounded-lg border flex items-center gap-3 transition-colors
                                      ${answers[q.question_id] === choiceLetter
                                      ? "bg-[#5d7c6f] text-white border-[#5d7c6f]"
                                      : "bg-white text-gray-700 border-gray-200"
                                    }
                                    ${isSubmitted ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
                                  `}
                                  onClick={() =>
                                    !isSubmitted && handleAnswerChange(q.question_id, choiceLetter)
                                  }
                                >
                                  <div
                                    className={`
                                        w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs
                                        ${answers[q.question_id] === choiceLetter ? "border-white" : "border-gray-400"}
                                    `}
                                  >
                                    {choiceLetter}
                                  </div>
                                  <span>{c.choice_text}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        </div>
                      ),
                    );
                  })()}
                </div>
              </ModalBody>
              <ModalFooter>
                {(() => {
                  const currentResult = camp?.missionResults?.find((r: any) => r.mission_mission_id === selectedMission?.mission_id);
                  const isSubmitted = currentResult?.status === "completed";
                  const allAnswered = selectedMission?.mission_question?.every(
                    (q: any) => answers[q.question_id] && String(answers[q.question_id]).trim() !== ""
                  );
                  
                  return (
                    <>
                      <Button color="danger" variant="light" onPress={onClose}>
                        ปิดหน้าต่าง
                      </Button>
                      {!isSubmitted && (
                        <Button
                          className={`text-white font-bold ${allAnswered ? "bg-[#5d7c6f]" : "bg-gray-500 hover:bg-gray-600"}`}
                          isLoading={submitting}
                          onPress={submitMission}
                        >
                          {allAnswered ? "ส่งคำตอบ" : "บันทึกร่าง"}
                        </Button>
                      )}
                    </>
                  );
                })()}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
