"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { MapPin, Calendar, ChevronRight, ImageOff } from "lucide-react";
import { useRouter } from "next/navigation";

/* ---------- Default SVG Component ---------- */
function DefaultCampImage() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#f1ede6] text-[#9c9488]">
            <ImageOff size={48} />
            <span className="mt-2 text-sm">No Image</span>
        </div>
    );
}

export default function StudentDashboard() {
    const [selectedTab, setSelectedTab] = useState("my-camps");

    const TAB_STATUS_MAP: Record<string, string> = {
        available: "กำลังจัด",
        "my-camps": "ยังไม่เริ่ม",
        completed: "เสร็จสิ้น",
    };
    const router = useRouter();
    const STATUS_STYLES: Record<
        string,
        { bg: string; text: string }
    > = {
        "กำลังจัด": {
            bg: "bg-[#5d7c6f]",
            text: "text-white",
        },
        "ยังไม่เริ่ม": {
            bg: "bg-[#d4c5b0]",
            text: "text-[#5a4a3a]",
        },
        "เสร็จสิ้น": {
            bg: "bg-gray-200",
            text: "text-gray-600",
        },
    };

    const camps = [
        {
            id: 1,
            title: "Fall Nature Adventure",
            description: "Explore forests, identify wildlife, and learn outdoor survival skills.",
            image: "",
            location: "Pinewood Nature Reserve",
            startDate: "Nov 5",
            endDate: "Nov 9",
            enrolled: 8,
            capacity: 25,
            status: "กำลังจัด",
        },
        {
            id: 2,
            title: "Summer Camp",
            description: "Fun activities and teamwork.",
            image: null, // ❗ ไม่มีรูป → SVG
            location: "Green Hill",
            startDate: "Dec 1",
            endDate: "Dec 5",
            enrolled: 12,
            capacity: 20,
            status: "เสร็จสิ้น",
        },
        {
            id: 3,
            title: "Nature Adventure",
            description: "Explore forests, identify wildlife.",
            image: "",
            location: "Pinewood Nature Reserve",
            startDate: "Nov 5",
            endDate: "Nov 9",
            enrolled: 8,
            capacity: 25,
            status: "กำลังจัด",
        },
    ];

    const filteredCamps = camps.filter(
        (camp) => camp.status === TAB_STATUS_MAP[selectedTab]
    );

    return (
        <div className="min-h-screen bg-[#faf9f6]">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-[#2d3748]">
                        Welcome, Student!
                    </h1>
                    <p className="text-lg text-gray-500">
                        Explore camps and continue your learning journey
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-6 w-full">
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={setSelectedTab}
                        size="lg"
                        classNames={{
                            base: "w-full",
                            tabList:
                                "w-full bg-[#f5f0e7] rounded-full p-1 flex overflow-x-auto md:overflow-visible scrollbar-hide",
                            tab:
                                "flex-1 px-6 py-3 whitespace-nowrap flex-shrink-0 md:flex-1 justify-center",
                            cursor: "rounded-full",
                            tabContent: "font-semibold text-center",
                        }}
                    >
                        <Tab key="available" title="กำลังจัด" />
                        <Tab key="my-camps" title="ยังไม่เริ่ม" />
                        <Tab key="completed" title="เสร็จสิ้น" />
                    </Tabs>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-6">
                    {filteredCamps.length === 0 && (
                        <div className="col-span-full text-center text-gray-400 py-16">
                            ยังไม่มีค่ายในขณะนี้
                        </div>
                    )}

                    {filteredCamps.map((camp) => (
                        <Card
                            key={camp.id}
                            isPressable
                            onPress={() => router.push(`/app/student/camp/${camp.id}`)}
                            className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white"
                        >
                            {/* Image / SVG (hidden on mobile) */}
                            <div className="relative h-48 overflow-hidden hidden sm:block">
                                {camp.image ? (
                                    <img
                                        src={camp.image}
                                        alt={camp.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <DefaultCampImage />
                                )}
                            </div>

                            <CardBody className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold mb-2 text-[#2d3748]">
                                            {camp.title}
                                        </h3>
                                        <p className="mb-4 text-[#718096]">
                                            {camp.description}
                                        </p>
                                    </div>
                                    <Chip
                                        variant="shadow"
                                        className={`
    ${STATUS_STYLES[camp.status]?.bg ?? "bg-gray-100"}
    ${STATUS_STYLES[camp.status]?.text ?? "text-gray-600"}
  `}
                                    >
                                        {camp.status}
                                    </Chip>
                                </div>

                                {/* Location */}
                                <div className="flex items-center gap-2 mb-2 text-[#718096]">
                                    <MapPin size={20} />
                                    <span>{camp.location}</span>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 mb-4 text-[#718096]">
                                    <Calendar size={20} />
                                    <span>
                                        {camp.startDate} - {camp.endDate}
                                    </span>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-center pt-4 border-t border-[#e2e8f0]">
                                    <span className="text-[#718096]">
                                        {camp.enrolled}/{camp.capacity} enrolled
                                    </span>
                                    <Button
                                        endContent={<ChevronRight size={20} />}
                                        className="bg-transparent text-[#718096] font-semibold hover:opacity-70"
                                    >
                                            ดูรายละเอียด
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}