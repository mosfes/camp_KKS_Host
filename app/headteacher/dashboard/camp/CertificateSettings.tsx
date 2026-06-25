"use client";

import React, { useRef, useState } from "react";
import {
  ImageOff,
  Trash2,
  Hash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";

import { useStatusModal } from "@/components/StatusModalProvider";

interface Props {
  certImage: string | null;
  setCertImage: (val: string | null) => void;
  setCertImageFile: (file: File | null) => void;
  certNameX: number;
  setCertNameX: (val: number) => void;
  certNameY: number;
  setCertNameY: (val: number) => void;
  certFontSize: number;
  setCertFontSize: (val: number) => void;
  certFontColor: string;
  setCertFontColor: (val: string) => void;
  // เลขที่เกียรติบัตร
  certShowNumber: boolean;
  setCertShowNumber: (val: boolean) => void;
  certNumberStart: number | null;
  setCertNumberStart: (val: number | null) => void;
  certNumberEnd: number | null;
  setCertNumberEnd: (val: number | null) => void;
  certNumberX: number;
  setCertNumberX: (val: number) => void;
  certNumberY: number;
  setCertNumberY: (val: number) => void;
  certNumberSize: number;
  setCertNumberSize: (val: number) => void;
  certNumberColor: string;
  setCertNumberColor: (val: string) => void;
  certNumberPrefix: "เลขที่" | "No." | "";
  setCertNumberPrefix: (val: "เลขที่" | "No." | "") => void;
  certNumberIsThai: boolean;
  setCertNumberIsThai: (val: boolean) => void;
  certYear: string | null;
  setCertYear: (val: string | null) => void;
  // ข้อมูลจำนวนนักเรียน (สำหรับแสดงคำเตือน)
  enrolledCount?: number;
}

export default function CertificateSettings({
  certImage,
  setCertImage,
  setCertImageFile,
  certNameX,
  setCertNameX,
  certNameY,
  setCertNameY,
  certFontSize,
  setCertFontSize,
  certFontColor,
  setCertFontColor,
  certShowNumber,
  setCertShowNumber,
  certNumberStart,
  setCertNumberStart,
  certNumberEnd,
  setCertNumberEnd,
  certNumberX,
  setCertNumberX,
  certNumberY,
  setCertNumberY,
  certNumberSize,
  setCertNumberSize,
  certNumberColor,
  setCertNumberColor,
  certNumberPrefix,
  setCertNumberPrefix,
  certNumberIsThai,
  setCertNumberIsThai,
  certYear,
  setCertYear,
  enrolledCount = 0,
}: Props) {
  const { showWarning, showConfirm, close } = useStatusModal();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState<"name" | "number" | null>(null);
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(1000);

  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageNaturalWidth(imgRef.current.naturalWidth || 1000);
    }
  }, [certImage]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      if (!file.type.startsWith("image/")) {
        showWarning("ไฟล์ไม่ถูกต้อง", "กรุณาเลือกไฟล์รูปภาพเท่านั้น");

        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showWarning("ขนาดไฟล์เกิน", "ขนาดไฟล์ต้องไม่เกิน 10MB");

        return;
      }

      try {
        const imageCompression = (await import("browser-image-compression"))
          .default;
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2000,
          useWebWorker: true,
        });

        setCertImageFile(compressedFile);
        const reader = new FileReader();

        reader.onloadend = () => {
          setCertImage(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error("Compression failed in preview:", err);
        setCertImageFile(file);
        const reader = new FileReader();

        reader.onloadend = () => {
          setCertImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = () => {
    setCertImage(null);
    setCertImageFile(null);
    close();
  };

  const handleMouseDown =
    (type: "name" | "number") => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(type);
    };

  const handleMouseUp = () => setIsDragging(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;

    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    if (isDragging === "name") {
      setCertNameX(newX);
      setCertNameY(newY);
    } else {
      setCertNumberX(newX);
      setCertNumberY(newY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    let newX = ((touch.clientX - rect.left) / rect.width) * 100;
    let newY = ((touch.clientY - rect.top) / rect.height) * 100;

    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    if (isDragging === "name") {
      setCertNameX(newX);
      setCertNameY(newY);
    } else {
      setCertNumberX(newX);
      setCertNumberY(newY);
    }
  };

  // คำนวณสถานะช่วงเลขที่
  const isInvalidRange =
    certNumberStart != null &&
    certNumberEnd != null &&
    certNumberStart > certNumberEnd;

  const rangeCount =
    certNumberStart != null && certNumberEnd != null && !isInvalidRange
      ? certNumberEnd - certNumberStart + 1
      : null;

  const isInsufficient = rangeCount != null && enrolledCount > rangeCount;
  const surplus = rangeCount != null ? rangeCount - enrolledCount : null;

  // ตัวอย่างข้อความเลขที่
  const exampleNumber =
    certNumberStart != null ? String(certNumberStart).padStart(4, "0") : "0001";
  let rawExampleText = certNumberPrefix
    ? `${certNumberPrefix} ${exampleNumber}`
    : exampleNumber;

  if (certYear) {
    rawExampleText = `${rawExampleText}/${certYear}`;
  }
  const displayExampleText = certNumberIsThai
    ? rawExampleText.replace(/[0-9]/g, (d) => "๐๑๒๓๔๕๖๗๘๙"[parseInt(d)])
    : rawExampleText;

  return (
    <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-sm text-gray-800">
            เทมเพลตเกียรติบัตร
          </h4>
          <p className="text-xs text-gray-500">
            อัปโหลดภาพพื้นหลังและจัดตำแหน่งชื่อนักเรียน
          </p>
        </div>
      </div>

      {!certImage ? (
        <label className="block w-full cursor-pointer bg-white">
          <input
            accept="image/*"
            className="hidden"
            type="file"
            onChange={handleImageChange}
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#6b857a] hover:bg-gray-50 transition-all">
            <ImageOff className="mx-auto text-gray-400 mb-2" size={28} />
            <p className="text-sm text-gray-500 font-medium">
              คลิกเพื่ออัปโหลดภาพเกียรติบัตร
            </p>
          </div>
        </label>
      ) : (
        <div className="space-y-4 bg-white p-4 rounded-lg border shadow-sm">
          {/* ---- ส่วนตั้งค่าชื่อนักเรียน ---- */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              ชื่อนักเรียน
            </p>
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  ปรับขนาดฟอนต์ ({certFontSize}px)
                </label>
                <input
                  className="w-full accent-[#6b857a]"
                  max="300"
                  min="16"
                  type="range"
                  value={certFontSize}
                  onChange={(e) => setCertFontSize(Number(e.target.value))}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  สีตัวอักษร
                </label>
                <input
                  className="w-full h-8 cursor-pointer border-0 rounded-md p-0 bg-transparent"
                  type="color"
                  value={certFontColor}
                  onChange={(e) => setCertFontColor(e.target.value)}
                />
              </div>
              <button
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                type="button"
                onClick={() =>
                  showConfirm(
                    "ยืนยันการลบ",
                    "คุณแน่ใจหรือไม่ว่าต้องการลบภาพเกียรติบัตรนี้?",
                    removeImage,
                    "ลบเกียรติบัตร",
                  )
                }
              >
                <Trash2 size={14} />
                ลบเกียรติบัตร
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                className="px-3 py-1.5 text-xs font-medium bg-[#f0f4f2] text-[#1a3a32] rounded-lg hover:bg-[#e2ebe6] transition-colors border border-[#6b857a]/20"
                type="button"
                onClick={() => setCertNameX(50)}
              >
                จัดกึ่งกลางแนวนอน
              </button>
              <button
                className="px-3 py-1.5 text-xs font-medium bg-[#f0f4f2] text-[#1a3a32] rounded-lg hover:bg-[#e2ebe6] transition-colors border border-[#6b857a]/20"
                type="button"
                onClick={() => setCertNameY(50)}
              >
                จัดกึ่งกลางแนวตั้ง
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* ---- ส่วนตั้งค่าเลขที่เกียรติบัตร ---- */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Hash className="text-[#6b857a]" size={14} />
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  เลขที่เกียรติบัตร
                </p>
              </div>
              {/* Toggle Switch */}
              <button
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  certShowNumber ? "bg-[#1a3a32]" : "bg-gray-300"
                }`}
                type="button"
                onClick={() => setCertShowNumber(!certShowNumber)}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    certShowNumber ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {certShowNumber && (
              <div className="space-y-3 pl-1">
                {/* ช่วงตัวเลข */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ช่วงเลขที่ (เริ่มต้น — สิ้นสุด)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b857a]/30"
                      min="1"
                      placeholder="เช่น 40"
                      type="number"
                      value={certNumberStart ?? ""}
                      onChange={(e) =>
                        setCertNumberStart(
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                    />
                    <span className="text-gray-400 font-bold shrink-0">—</span>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b857a]/30"
                      min="1"
                      placeholder="เช่น 120"
                      type="number"
                      value={certNumberEnd ?? ""}
                      onChange={(e) =>
                        setCertNumberEnd(
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                    />
                  </div>

                  {/* แสดงสถานะช่วงเลข */}
                  {rangeCount != null && (
                    <div className="mt-1.5 text-xs">
                      <span className="text-gray-400">
                        จำนวนใบในช่วงที่กำหนด: <strong>{rangeCount} ใบ</strong>
                      </span>
                      {enrolledCount > 0 && (
                        <>
                          <span className="text-gray-300 mx-1.5">|</span>
                          <span className="text-gray-400">
                            นักเรียนลงทะเบียน:{" "}
                            <strong>{enrolledCount} คน</strong>
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* แจ้งเตือนเมื่อช่วงผิดพลาด */}
                  {isInvalidRange && (
                    <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <XCircle
                        className="text-red-500 mt-0.5 shrink-0"
                        size={16}
                      />
                      <p className="text-xs text-red-600 leading-relaxed">
                        <strong>ช่วงเลขที่กำหนดไม่ถูกต้อง!</strong>{" "}
                        เลขสิ้นสุดต้องมีค่ามากกว่าหรือเท่ากับเลขเริ่มต้น
                      </p>
                    </div>
                  )}

                  {/* คำเตือนเมื่อไม่เพียงพอ */}
                  {isInsufficient && (
                    <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertTriangle
                        className="text-red-500 mt-0.5 shrink-0"
                        size={16}
                      />
                      <p className="text-xs text-red-600 leading-relaxed">
                        <strong>ช่วงเลขที่กำหนดไม่เพียงพอ!</strong>{" "}
                        มีนักเรียนลงทะเบียน {enrolledCount} คน
                        แต่ช่วงที่กำหนดมีเพียง {rangeCount} ใบ (ขาดไป{" "}
                        {enrolledCount - rangeCount!} ใบ)
                        ระบบยังคงออกเกียรติบัตรให้ได้ต่อไปแต่จะเกินเลขสิ้นสุดที่กำหนด
                      </p>
                    </div>
                  )}

                  {/* แสดงว่าเหลือเยอะ */}
                  {!isInsufficient &&
                    surplus != null &&
                    surplus > 0 &&
                    rangeCount != null &&
                    enrolledCount > 0 && (
                      <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle
                          className="text-green-500 shrink-0"
                          size={16}
                        />
                        <p className="text-xs text-green-600">
                          ช่วงที่กำหนดเพียงพอ — เหลืออีก{" "}
                          <strong>{surplus} ใบ</strong>
                        </p>
                      </div>
                    )}
                </div>

                {/* คำนำหน้าเลขที่ */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    คำนำหน้าเลขที่
                  </label>
                  <div className="flex gap-2">
                    {(["เลขที่", "No.", ""] as const).map((prefix) => (
                      <button
                        key={prefix === "" ? "none" : prefix}
                        className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
                          certNumberPrefix === prefix
                            ? "bg-[#1a3a32] text-white border-[#1a3a32]"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                        type="button"
                        onClick={() => setCertNumberPrefix(prefix)}
                      >
                        {prefix === "" ? "ไม่มีคำนำหน้า" : prefix}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    ตัวอย่าง:{" "}
                    <span className="font-medium text-gray-600">
                      {displayExampleText}
                    </span>
                  </p>
                </div>

                {/* ปีการศึกษา */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    ปีการศึกษา (ถ้ามี)
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b857a]/30"
                    placeholder="เช่น 2567"
                    type="text"
                    value={certYear ?? ""}
                    onChange={(e) => setCertYear(e.target.value || null)}
                  />
                </div>

                {/* เลขไทย / เลขอาราบิก */}
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-500">
                    รูปแบบตัวเลข:
                  </label>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        !certNumberIsThai
                          ? "bg-[#1a3a32] text-white border-[#1a3a32]"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                      type="button"
                      onClick={() => setCertNumberIsThai(false)}
                    >
                      เลขอาราบิก (0-9)
                    </button>
                    <button
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                        certNumberIsThai
                          ? "bg-[#1a3a32] text-white border-[#1a3a32]"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                      type="button"
                      onClick={() => setCertNumberIsThai(true)}
                    >
                      เลขไทย (๐-๙)
                    </button>
                  </div>
                </div>

                {/* ขนาดฟอนต์และสีของเลขที่ */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ขนาดฟอนต์ ({certNumberSize}px)
                    </label>
                    <input
                      className="w-full accent-[#6b857a]"
                      max="200"
                      min="12"
                      type="range"
                      value={certNumberSize}
                      onChange={(e) =>
                        setCertNumberSize(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      สีตัวอักษร
                    </label>
                    <input
                      className="w-full h-8 cursor-pointer border-0 rounded-md p-0 bg-transparent"
                      type="color"
                      value={certNumberColor}
                      onChange={(e) => setCertNumberColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-1.5 text-xs font-medium bg-[#f0f4f2] text-[#1a3a32] rounded-lg hover:bg-[#e2ebe6] transition-colors border border-[#6b857a]/20"
                    type="button"
                    onClick={() => setCertNumberX(50)}
                  >
                    จัดกึ่งกลางแนวนอน
                  </button>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* ---- ภาพพรีวิว ---- */}
          <div
            ref={containerRef}
            className="relative border-2 border-gray-200 rounded-lg overflow-hidden select-none touch-none bg-gray-100"
            style={{ containerType: "inline-size" }}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onTouchMove={handleTouchMove}
          >
            <img
              ref={imgRef}
              alt="Certificate Preview"
              className="w-full h-auto pointer-events-none"
              src={certImage}
              onLoad={(e) =>
                setImageNaturalWidth(e.currentTarget.naturalWidth || 1000)
              }
            />

            {/* ตัวอย่างชื่อนักเรียน */}
            <div
              className="absolute cursor-move flex flex-col items-center justify-center transition-all"
              style={{
                left: `${certNameX}%`,
                top: `${certNameY}%`,
                transform: "translate(-50%, -50%)",
                fontSize: `${(certFontSize / imageNaturalWidth) * 100}cqi`,
                fontFamily: "Sarabun, sans-serif",
                color: certFontColor,
                whiteSpace: "nowrap",
                zIndex: 10,
              }}
              onMouseDown={handleMouseDown("name")}
              onTouchStart={() => setIsDragging("name")}
            >
              นายตัวอย่าง นามสกุลตัวอย่าง
            </div>

            {/* ตัวอย่างเลขที่เกียรติบัตร */}
            {certShowNumber && (
              <div
                className="absolute cursor-move flex items-center justify-center transition-all"
                style={{
                  left: `${certNumberX}%`,
                  top: `${certNumberY}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: `${(certNumberSize / imageNaturalWidth) * 100}cqi`,
                  fontFamily: "Sarabun, sans-serif",
                  color: certNumberColor,
                  whiteSpace: "nowrap",
                  zIndex: 10,
                }}
                onMouseDown={handleMouseDown("number")}
                onTouchStart={() => setIsDragging("number")}
              >
                {displayExampleText ||
                  (certNumberStart
                    ? String(certNumberStart).padStart(4, "0")
                    : "0001")}
              </div>
            )}
          </div>
          <p className="text-xs text-center text-gray-500 font-medium flex items-center justify-center gap-1">
            <Sparkles className="text-[#6b857a]" size={14} />
            คลิกค้างที่ชื่อหรือเลขที่แล้วลากเพื่อเปลี่ยนตำแหน่ง
          </p>
        </div>
      )}
    </div>
  );
}
