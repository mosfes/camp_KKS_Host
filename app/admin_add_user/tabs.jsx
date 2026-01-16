"use client";
import React from 'react';
import { Tabs, Tab } from "@heroui/react";
import ClassroomManager from "./components/ClassroomManager";
import StudentManager from "./components/StudentManager";
import TeacherManager from "./components/TeacherManager";

export default function App() {
    let tabs = [
        {
            id: "Student",
            label: "นักเรียน",
            content: <StudentManager />,
        },
        {
            id: "Teacher",
            label: "ครู",
            content: <TeacherManager />,
        },
        {
            id: "Classroom",
            label: "ห้องเรียน",
            content: <ClassroomManager />,
        },
    ];

    return (
        <div className="flex w-full flex-col">
            <Tabs
                aria-label="User selection"
                items={tabs}
                radius="full"
                fullWidth
                classNames={{
                    tabList: "bw-full bg-[#f5f0e7] rounded-full p-1 flex overflow-x-auto md:overflow-visible scrollbar-hide",
                    tab: "h-10flex-1 px-6 py-3 whitespace-nowrap flex-shrink-0 md:flex-1 justify-center  rounded-full",
                    cursor: "rounded-full",
                    tabContent: "group-data-[selected=true]:text-black text-gray-500 font-medium font-semibold text-center",
                }}
            >
                {(item) => (
                    <Tab key={item.id} title={item.label}>
                        {item.content}
                    </Tab>
                )}
            </Tabs>
        </div>
    );
}