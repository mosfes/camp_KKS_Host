"use client"; // จำเป็นต้องใส่บรรทัดนี้เพราะมีการใช้ useState และ useEffect

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardFooter } from "@heroui/react";
import studentService from "@/app/service/adminService";

export default function App() {
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const initData = async () => {
      try {
        const students = await studentService.getStudents();
        if (students) {
            setStudentCount(students.length);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      }
    };
    
    initData();
  }, []);

  const list = [
    {
      title: "ผู้ใช้ทั้งหมด",
      number: "15",
    },
    {
      title: "นักเรียน",
      number: studentCount, 
    },
    {
      title: "ครู",
      number: "10",
    },
  ];


  return (
    <div className="gap-2 grid grid-cols-1 sm:grid-cols-3">
      {list.map((item, index) => (
        <Card 
            key={index} 
            isPressable 
            shadow="sm" 
            className="p-3 rounded-lg w-full" 
            onPress={() => console.log("item pressed")}
        >
          <CardBody className="overflow-visible p-0">
            
          </CardBody>
          <CardFooter className="text-small flex-col items-start p-0">
            <p>{item.title}</p>
            <p className="text-2xl font-bold">{item.number}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}