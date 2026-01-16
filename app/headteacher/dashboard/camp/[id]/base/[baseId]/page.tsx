
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { ChevronLeft, Plus, Target, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useStatusModal } from "@/components/StatusModalProvider";
import CreateMissionModal from "./CreateMissionModal";
import EditMissionModal from "./EditMissionModal";

export default function BaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id: campId, baseId } = params;

    const [base, setBase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { showError, showSuccess } = useStatusModal();
    const [isCreateMissionModalOpen, setIsCreateMissionModalOpen] = useState(false);
    const [isEditMissionModalOpen, setIsEditMissionModalOpen] = useState(false);
    const [selectedMission, setSelectedMission] = useState<any>(null);

    useEffect(() => {
        if (baseId) {
            fetchBaseDetail();
        }
    }, [baseId]);

    const fetchBaseDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/stations/${baseId}`);
            if (!response.ok) throw new Error("Failed to fetch base");
            const data = await response.json();
            setBase(data);
        } catch (error) {
            console.error("Error:", error);
            showError("Error", "Failed to load base details");
        } finally {
            setLoading(false);
        }
    };

    const handleEditMission = (mission: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMission(mission);
        setIsEditMissionModalOpen(true);
    };

    const handleDeleteMission = async (missionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this mission?")) return;

        try {
            const response = await fetch(`/api/missions/${missionId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete mission");
            }

            showSuccess("Success", "Mission deleted successfully");
            fetchBaseDetail();
        } catch (error) {
            console.error("Error deleting mission:", error);
            showError("Error", "Failed to delete mission");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#6b857a] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!base) return null;

    return (
        <div className="min-h-screen bg-[#F5F1E8]">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
                >
                    <ChevronLeft size={20} />
                    <span>Back to Camp</span>
                </button>

                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{base.name}</h1>
                        <p className="text-gray-600">{base.description || "No description provided."}</p>
                    </div>
                </div>

                {/* Missions Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <Target className="text-[#6b857a]" size={24} />
                            <h2 className="text-xl font-semibold text-gray-900">Missions</h2>
                        </div>
                        <Button
                            className="bg-[#6b857a] text-white"
                            startContent={<Plus size={18} />}
                            onPress={() => setIsCreateMissionModalOpen(true)}
                        >
                            Create Mission
                        </Button>
                    </div>

                    {base.mission && base.mission.length > 0 ? (
                        <div className="space-y-4">
                            {base.mission.map((mission: any) => (
                                <div
                                    key={mission.mission_id}
                                    className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors flex justify-between items-center bg-gray-50 mb-2"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">{mission.title || "Untitled Mission"}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                                {mission.type?.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">{mission.description}</p>
                                        {mission.type === 'QUESTION_ANSWERING' && mission.mission_question?.[0] && (
                                            <div className="mt-2 bg-[#6b857a]/5 p-2 rounded-lg border border-[#6b857a]/10">
                                                <p className="text-sm text-[#6b857a] font-medium">
                                                    <span className="mr-2">Q:</span>
                                                    {mission.mission_question[0].question_text}
                                                </p>
                                            </div>
                                        )}
                                        {mission.type === 'MULTIPLE_CHOICE_QUIZ' && mission.mission_question && mission.mission_question.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {mission.mission_question.map((q: any, idx: number) => (
                                                    <div key={q.question_id} className="bg-[#6b857a]/5 p-2 rounded-lg border border-[#6b857a]/10">
                                                        <p className="text-sm text-[#6b857a] font-medium">
                                                            <span className="mr-2 font-bold">{idx + 1}.</span>
                                                            {q.question_text}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 ml-4 self-start">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-gray-400 hover:text-blue-500"
                                            onClick={(e) => handleEditMission(mission, e)}
                                        >
                                            <Pencil size={18} />
                                        </Button>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-gray-400 hover:text-red-500"
                                            onClick={(e) => handleDeleteMission(mission.mission_id, e)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target size={24} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 mb-4">No missions created yet</p>
                            <Button
                                className="bg-[#6b857a] text-white"
                                startContent={<Plus size={18} />}
                                onPress={() => setIsCreateMissionModalOpen(true)}
                            >
                                Create First Mission
                            </Button>
                        </div>
                    )}
                </div>

                <CreateMissionModal
                    isOpen={isCreateMissionModalOpen}
                    onClose={() => setIsCreateMissionModalOpen(false)}
                    baseId={Number(baseId)}
                    onMissionCreated={fetchBaseDetail}
                />
                <EditMissionModal
                    isOpen={isEditMissionModalOpen}
                    onClose={() => setIsEditMissionModalOpen(false)}
                    missionData={selectedMission}
                    onSuccess={fetchBaseDetail}
                />
            </div>
        </div>
    );
}
