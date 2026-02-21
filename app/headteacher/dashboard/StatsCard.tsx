"use client";

import { Card, CardBody } from "@heroui/react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: StatsCardProps) {
  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-all rounded-2xl">
      <CardBody className="p-6 flex justify-between ">
        <div className="flex items-start justify-between mb-10">
          <p className="text-sm text-gray-500">{title}</p>
          <Icon className="text-gray-400" size={22} />
        </div>
        {/* Value */}
        <div>
          <h2 className="text-3xl font-semibold mt-4">{value}</h2>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
      </CardBody>
    </Card>
  );
}
