"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { RadioGroup, Radio } from "@heroui/radio";
import { Textarea } from "@heroui/input";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StudentSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const fetchSurvey = async () => {
    try {
      const res = await fetch(`/api/student/surveys?campId=${id}`, {
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isCompleted) {
          setIsCompleted(true);
          toast.success("คุณทำแบบประเมินนี้ไปแล้ว");
          setTimeout(() => router.replace(`/student/dashboard/camp/${id}/missions`), 1500);
        } else if (!data.survey) {
          toast.error("ไม่พบแบบประเมิน");
          router.replace(`/student/dashboard/camp/${id}/missions`);
        } else {
          setSurvey(data.survey);
        }
      } else {
        toast.error("ดึงข้อมูลแบบประเมินล้มเหลว");
      }
    } catch (error) {
      console.error("Failed to fetch survey", error);
      toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!survey || !survey.survey_question) return;

    // Validate that all questions are answered (except text-based feedback)
    const unanswered = survey.survey_question.some((q: any) => {
      const ans = answers[q.question_id];
      if (q.question_type === 'scale' && !ans) return true;
      // if (q.question_type === 'text' && (!ans || ans.trim() === '')) return true; // Now optional
      return false;
    });

    if (unanswered) {
      toast.error("กรุณาตอบคำถามให้ครบทุกข้อ");
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = survey.survey_question.map((q: any) => ({
        questionId: q.question_id,
        scaleValue: q.question_type === 'scale' ? Number(answers[q.question_id]) : null,
        textAnswer: q.question_type === 'text' ? answers[q.question_id] : null,
      }));

      const res = await fetch("/api/student/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyId: survey.survey_id,
          campId: id,
          answers: formattedAnswers
        }),
      });

      if (res.ok) {
        toast.success("ส่งแบบประเมินเรียบร้อยแล้ว");
        router.replace(`/student/dashboard/camp/${id}/missions`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "บันทึกข้อมูลล้มเหลว");
      }
    } catch (error) {
      console.error("Failed to submit survey", error);
      toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isCompleted) {
    return (
      <div className="p-8 text-center bg-[#F5F1E8] min-h-screen flex items-center justify-center">
        {loading ? 'กำลังโหลดแบบประเมิน...' : 'กำลังพากลับหน้าภารกิจ...'}
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-50">
        <Button isIconOnly variant="light" onPress={() => router.back()}>
          <ChevronLeft className="text-gray-600" size={24} />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-[#2d3748]">แบบประเมินความพึงพอใจ</h1>
          <p className="text-sm text-gray-500">{survey.title || 'ค่ายกิจกรรม'}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Survey Header Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#EBE7DD] flex items-center justify-center text-[#5a4a3a]">
              <ClipboardList size={20} />
            </div>
            <h2 className="text-xl font-bold text-[#2d3748]">{survey.title}</h2>
          </div>
          {survey.description && (
            <p className="text-gray-600 whitespace-pre-wrap">{survey.description}</p>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {survey.survey_question?.map((q: any, index: number) => (
            <div key={q.question_id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-gray-800 font-medium mb-4">
                {index + 1}. {q.question_text}
                {q.question_type === 'text' ? (
                  <span className="text-gray-400 font-normal ml-2 text-sm">(ไม่บังคับ)</span>
                ) : (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h3>

              {q.question_type === 'scale' && (
                <div className="mt-2">
                  <RadioGroup 
                    orientation="horizontal"
                    value={answers[q.question_id]?.toString()}
                    onValueChange={(val) => handleAnswerChange(q.question_id, val)}
                    classNames={{
                      wrapper: "gap-4 md:gap-8 flex-wrap justify-between md:justify-start"
                    }}
                  >
                    {Array.from({ length: q.scale_max || 5 }).map((_, i) => {
                      const value = (i + 1).toString();
                      return (
                        <Radio key={value} value={value} classNames={{
                          base: "m-0",
                          label: "text-gray-600"
                        }}>
                          {value}
                        </Radio>
                      );
                    })}
                  </RadioGroup>
                  <div className="flex justify-between text-xs text-gray-400 mt-2 px-1 max-w-[280px]">
                    <span>น้อยที่สุด</span>
                    <span>มากที่สุด</span>
                  </div>
                </div>
              )}

              {q.question_type === 'text' && (
                <Textarea
                  placeholder="พิมพ์คำตอบของคุณที่นี่..."
                  value={answers[q.question_id] || ''}
                  onValueChange={(val) => handleAnswerChange(q.question_id, val)}
                  minRows={3}
                  classNames={{
                    input: "text-gray-700 bg-gray-50",
                    inputWrapper: "bg-gray-50 data-[hover=true]:bg-gray-100"
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="pt-4 pb-8 flex justify-center">
          <Button
            className="w-full md:w-auto md:min-w-[200px] bg-[#5d7c6f] text-white py-6 shadow-md hover:bg-[#4a6358] transition-colors"
            size="lg"
            radius="full"
            isLoading={submitting}
            onPress={handleSubmit}
          >
            ส่งแบบประเมิน
          </Button>
        </div>
      </div>
    </div>
  );
}
