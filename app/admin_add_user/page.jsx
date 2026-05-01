"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ClassroomManager from "./components/ClassroomManager";
import StudentManager from "./components/StudentManager";
import TeacherManager from "./components/TeacherManager";
import CampManager from "./components/CampManager";
import VulgarWordsManager from "./components/VulgarWordsManager";
import OverviewManager from "./components/OverviewManager";

const sectionMap = {
    overview: { label: "ภาพรวมระบบ", desc: "สรุปข้อมูลทั้งหมดในระบบ", Component: OverviewManager },
    teacher: { label: "ครู", desc: "เพิ่มและจัดการข้อมูลครู", Component: TeacherManager },
    classroom: { label: "ห้องเรียน", desc: "จัดการห้องเรียนและกลุ่ม", Component: ClassroomManager },
    student: { label: "นักเรียน", desc: "จัดการข้อมูลนักเรียน", Component: StudentManager },
    camp: { label: "ค่าย", desc: "จัดการค่ายและกิจกรรม", Component: CampManager },
    vulgarwords: { label: "คลังคำหยาบ", desc: "จัดการคำหยาบในระบบ", Component: VulgarWordsManager },
};

function AdminContent() {
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") || "overview";
    const section = sectionMap[tab] || sectionMap["overview"];
    const { label, desc, Component } = section;

    return (
        <div className="m-4 md:m-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{label}</h1>
                    <p className="text-gray-500 text-sm mt-1">{desc}</p>
                </div>
                <div id="admin-header-actions" className="flex items-center gap-2"></div>
            </div>
            <Component />
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AdminContent />
        </Suspense>
    );
}
