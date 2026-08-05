"use client";

import { useState } from "react";
import { ListChecks, UserRoundCheck } from "lucide-react";

import DocumentPersonnelManager from "./DocumentPersonnelManager";
import DocumentReferenceOptionsManager from "./DocumentReferenceOptionsManager";

const sections = [
  {
    id: "personnel",
    label: "บุคลากรในเอกสาร",
    description: "รายชื่อและตำแหน่งสำหรับช่องลงนาม",
    icon: UserRoundCheck,
  },
  {
    id: "options",
    label: "มาตรฐานและกลยุทธ์",
    description: "ตัวเลือกกลางสำหรับจัดทำเอกสารโครงการ",
    icon: ListChecks,
  },
];

export default function DocumentDataManager() {
  const [activeSection, setActiveSection] = useState("personnel");

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map(({ id, label, description, icon: Icon }) => {
          const active = activeSection === id;

          return (
            <button
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-[#5d7c6f] bg-[#edf4f1] shadow-sm"
                  : "border-gray-200 bg-white hover:border-[#a8bbb3]"
              }`}
              key={id}
              onClick={() => setActiveSection(id)}
              type="button"
            >
              <span
                className={`rounded-xl p-2 ${active ? "bg-[#5d7c6f] text-white" : "bg-gray-100 text-gray-500"}`}
              >
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-medium text-gray-800">{label}</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {activeSection === "personnel" ? (
        <DocumentPersonnelManager />
      ) : (
        <DocumentReferenceOptionsManager />
      )}
    </div>
  );
}
