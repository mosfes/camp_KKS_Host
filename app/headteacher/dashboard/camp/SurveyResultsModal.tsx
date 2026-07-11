"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
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
  Book,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

interface SurveyResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
}

interface QuestionSummary {
  id: number;
  text: string;
  type: "scale" | "text" | "checkbox" | "header";
  average?: number;
  total: number;
  distribution?: { [key: string]: number };
  answers?: string[];
  options?: { label: string; count: number }[];
}

interface SurveySummary {
  surveyId: number;
  title: string;
  totalResponses: number;
  questions: QuestionSummary[];
  demographics?: {
    gender: { male: number; female: number; other: number };
    grade: Record<string, number>;
  };
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));

        throw new Error(errorData.error || "ไม่สามารถดึงข้อมูลผลแบบประเมินได้");
      }
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
        base: "bg-white shadow-xl",
        backdrop: "bg-black/40 backdrop-blur-sm",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="full"
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

                  {data.demographics && data.totalResponses > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      {/* Gender Summary */}
                      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Users size={16} />
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            สัดส่วนผู้ตอบตามเพศ
                          </h3>
                        </div>
                        <div className="h-[180px] w-full">
                          {(() => {
                            const { male, female, other } =
                              data.demographics!.gender;
                            const total = male + female + other;
                            const genderData = [
                              { name: "ชาย", value: male, color: "#60a5fa" },
                              { name: "หญิง", value: female, color: "#f472b6" },
                            ];

                            if (other > 0) {
                              genderData.push({
                                name: "อื่นๆ",
                                value: other,
                                color: "#9ca3af",
                              });
                            }

                            return (
                              <ResponsiveContainer height="100%" width="100%">
                                <PieChart>
                                  <Pie
                                    cx="50%"
                                    cy="50%"
                                    data={genderData}
                                    dataKey="value"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                  >
                                    {genderData.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip
                                    contentStyle={{
                                      borderRadius: "8px",
                                      border: "none",
                                      boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    formatter={(value: any) => [
                                      `${value} คน`,
                                      "จำนวน",
                                    ]}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-400" />
                            <span className="text-xs text-gray-600">ชาย</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-pink-400" />
                            <span className="text-xs text-gray-600">หญิง</span>
                          </div>
                          {data.demographics!.gender.other > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-gray-400" />
                              <span className="text-xs text-gray-600">
                                อื่นๆ
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Grade Summary */}
                      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Book size={16} />
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            สัดส่วนผู้ตอบตามระดับชั้น
                          </h3>
                        </div>
                        <div className="h-[200px] w-full">
                          {(() => {
                            const gradeData = Object.entries(
                              data.demographics!.grade,
                            )
                              .sort()
                              .map(([grade, count]) => ({
                                name: grade,
                                count,
                              }));

                            return (
                              <ResponsiveContainer height="100%" width="100%">
                                <BarChart
                                  data={gradeData}
                                  margin={{
                                    top: 10,
                                    right: 10,
                                    left: -25,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid
                                    stroke="#f3f4f6"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                  />
                                  <XAxis
                                    axisLine={false}
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    allowDecimals={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    tickLine={false}
                                  />
                                  <RechartsTooltip
                                    contentStyle={{
                                      borderRadius: "8px",
                                      border: "none",
                                      boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    cursor={{ fill: "#f3f4f6" }}
                                    formatter={(value: any) => [
                                      `${value} คน`,
                                      "จำนวน",
                                    ]}
                                  />
                                  <Bar
                                    dataKey="count"
                                    fill="#818cf8"
                                    maxBarSize={40}
                                    radius={[4, 4, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>
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
                        <div
                          key={q.id}
                          className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 my-3 flex flex-col"
                        >
                          <div className="flex items-start justify-between w-full mb-4">
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

                          {/* Scale distribution */}
                          {q.type === "scale" && q.distribution && (
                            <div className="h-[180px] w-full mt-2 ml-4 md:ml-6 pr-4">
                              {(() => {
                                const chartData = [1, 2, 3, 4, 5].map(
                                  (star) => ({
                                    star: star.toString(),
                                    count: q.distribution![star] || 0,
                                  }),
                                );

                                return (
                                  <ResponsiveContainer
                                    height="100%"
                                    width="100%"
                                  >
                                    <BarChart
                                      data={chartData}
                                      margin={{
                                        top: 10,
                                        right: 10,
                                        left: -25,
                                        bottom: 0,
                                      }}
                                    >
                                      <CartesianGrid
                                        stroke="#f3f4f6"
                                        strokeDasharray="3 3"
                                        vertical={false}
                                      />
                                      <XAxis
                                        axisLine={false}
                                        dataKey="star"
                                        tick={{ fontSize: 12, fill: "#6b7280" }}
                                        tickLine={false}
                                      />
                                      <YAxis
                                        allowDecimals={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12, fill: "#6b7280" }}
                                        tickLine={false}
                                      />
                                      <RechartsTooltip
                                        contentStyle={{
                                          borderRadius: "8px",
                                          border: "none",
                                          boxShadow:
                                            "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        }}
                                        cursor={{ fill: "#fffbeb" }}
                                        formatter={(value: any) => [
                                          `${value} คน`,
                                          "จำนวน",
                                        ]}
                                        labelFormatter={(label) =>
                                          `คะแนน ${label}`
                                        }
                                      />
                                      <Bar
                                        dataKey="count"
                                        fill="#fbbf24"
                                        maxBarSize={40}
                                        radius={[4, 4, 0, 0]}
                                      />
                                    </BarChart>
                                  </ResponsiveContainer>
                                );
                              })()}
                            </div>
                          )}

                          {/* Text answers */}
                          {q.type === "text" && q.answers && (
                            <div className="ml-9 space-y-2.5 mt-2">
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

                          {/* Multiple-choice answers */}
                          {q.type === "checkbox" && q.options && (
                            <div className="ml-9 space-y-2.5 mt-2">
                              {q.options.map((option) => (
                                <div
                                  key={option.label}
                                  className="flex items-center justify-between gap-4 bg-gray-50 p-3 rounded-xl text-sm border border-gray-100"
                                >
                                  <span className="text-gray-700 break-words">
                                    {option.label}
                                  </span>
                                  <span className="shrink-0 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                                    {option.count} คน
                                  </span>
                                </div>
                              ))}
                              <p className="text-xs text-gray-400 pt-1">
                                มีผู้ตอบข้อนี้ {q.total} คน (เลือกได้มากกว่า 1 ข้อ)
                              </p>
                            </div>
                          )}
                        </div>
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
