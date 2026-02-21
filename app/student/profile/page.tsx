"use client";

import React, { useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentProfile() {
  const [selectedTab, setSelectedTab] = useState("info");
  const displayValue = (value?: string | null) => {
    return value && value.trim() !== "" ? value : "ไม่มี";
  };
  const router = useRouter();

  const studentData = {
    name: "Somchai",
    email: "somchai@student.com",
    grade: "Grade 4",
    classroom: "4-A",
    studentPhone: "555-0101",
    parentPhone: "555-0301",
    homeroomTeacher: "Ms. Anderson",
    teacherPhone: "555-0200",
    avatarUrl: null,
    // avatarUrl: "/images/login.png",
    allergies: null,
    medicalConditions: null,
    additionalNotes: null,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f5f0" }}>
      {/* Header */}
      <div className="bg-white border-b" style={{ borderColor: "#e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                style={{ color: "#718096" }}
                variant="light"
                onPress={() => router.push("/student/dashboard")}
              >
                <ArrowLeft size={24} />
              </Button>
              <div>
                <h1
                  className="text-xl font-semibold"
                  style={{ color: "#2d3748" }}
                >
                  Student Profile
                </h1>
                <p className="text-sm" style={{ color: "#718096" }}>
                  Manage your information
                </p>
              </div>
            </div>
            <Button isIconOnly style={{ color: "#718096" }} variant="light">
              <Edit size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <Card className="mb-6 shadow-sm" style={{ backgroundColor: "white" }}>
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <Avatar
                className="text-2xl font-semibold"
                name={studentData.name}
                size="lg"
                src={studentData.avatarUrl || undefined}
                style={{
                  backgroundColor: "#6b7f73",
                  color: "white",
                  width: "72px",
                  height: "72px",
                }}
              />
              <div className="flex-1">
                <h2
                  className="text-xl font-semibold mb-1"
                  style={{ color: "#2d3748" }}
                >
                  {studentData.name}
                </h2>
                <p className="text-sm mb-2" style={{ color: "#718096" }}>
                  {studentData.email}
                </p>
                <div className="flex gap-2">
                  <Chip
                    size="sm"
                    style={{
                      backgroundColor: "#d4c5b0",
                      color: "#5a4a3a",
                    }}
                  >
                    {studentData.grade}
                  </Chip>
                  <Chip
                    size="sm"
                    style={{
                      borderColor: "#cbd5e0",
                      color: "#4a5568",
                    }}
                    variant="bordered"
                  >
                    {studentData.classroom}
                  </Chip>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs
            classNames={{
              base: "w-full",
              tabList:
                "w-full bg-[#f5f0e7] rounded-full p-1 flex overflow-x-auto md:overflow-visible scrollbar-hide",
              tab: "flex-1 px-6 py-3 whitespace-nowrap flex-shrink-0 md:flex-1 justify-center",
              cursor: "rounded-full",
              tabContent: "font-semibold text-center",
            }}
            selectedKey={selectedTab}
            size="lg"
            onSelectionChange={(key) => setSelectedTab(String(key))}
          >
            <Tab key="info" title="Info" />
            <Tab key="certificates" title="Certificates (0)" />
          </Tabs>
        </div>

        {/* Info Section */}
        {selectedTab === "info" && (
          <div className="space-y-4">
            {/* Personal Information */}
            <Card className="shadow-sm" style={{ backgroundColor: "white" }}>
              <CardBody className="p-6">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: "#2d3748" }}
                >
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Name
                    </label>
                    <p style={{ color: "#2d3748" }}>{studentData.name}</p>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Email
                    </label>
                    <p style={{ color: "#2d3748" }}>{studentData.email}</p>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Grade
                    </label>
                    <p style={{ color: "#2d3748" }}>{studentData.grade}</p>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Classroom
                    </label>
                    <p style={{ color: "#2d3748" }}>{studentData.classroom}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-sm" style={{ backgroundColor: "white" }}>
              <CardBody className="p-6">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: "#2d3748" }}
                >
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Student Phone
                    </label>
                    <p style={{ color: "#2d3748" }}>
                      {studentData.studentPhone}
                    </p>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Parent Phone
                    </label>
                    <p style={{ color: "#2d3748" }}>
                      {studentData.parentPhone}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* School Contact */}
            <Card className="shadow-sm" style={{ backgroundColor: "white" }}>
              <CardBody className="p-6">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: "#2d3748" }}
                >
                  School Contact
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Homeroom Teacher
                    </label>
                    <p style={{ color: "#2d3748" }}>
                      {studentData.homeroomTeacher}
                    </p>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Teacher Phone
                    </label>
                    <p style={{ color: "#2d3748" }}>
                      {studentData.teacherPhone}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Medical Information */}
            <Card className="shadow-sm" style={{ backgroundColor: "white" }}>
              <CardBody className="p-6">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ color: "#2d3748" }}
                >
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Allergies
                    </label>
                    <p style={{ color: "#718096" }}>
                      {displayValue(studentData.allergies)}
                    </p>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Medical Conditions
                    </label>
                    <p style={{ color: "#718096" }}>
                      {displayValue(studentData.medicalConditions)}
                    </p>
                  </div>
                  <div>
                    <label
                      className="text-sm font-medium block mb-1"
                      style={{ color: "#718096" }}
                    >
                      Additional Notes
                    </label>
                    <p style={{ color: "#718096" }}>
                      {displayValue(studentData.additionalNotes)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Certificates Section */}
        {selectedTab === "certificates" && (
          <Card className="shadow-sm" style={{ backgroundColor: "white" }}>
            <CardBody className="p-12 text-center">
              <p style={{ color: "#718096" }}>No certificates available</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
