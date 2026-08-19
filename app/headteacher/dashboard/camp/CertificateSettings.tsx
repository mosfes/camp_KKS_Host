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
  ClipboardList,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Input } from "@heroui/input";

import { useStatusModal } from "@/components/StatusModalProvider";
import { getRequiredMissionCount } from "@/lib/certificate-eligibility";

const MAX_CERTIFICATE_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_UNCOMPRESSED_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_CERTIFICATE_COMPRESSION_MB = 4;

// ---- Color Picker Component ----
function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hexInput, setHexInput] = useState(value);

  React.useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <Popover placement="bottom">
        <PopoverTrigger>
          <button
            className="flex items-center gap-2 px-2 py-1.5 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors w-full"
            type="button"
          >
            <span
              className="w-5 h-5 rounded-md border border-gray-200 shrink-0 shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="text-xs font-mono text-gray-600 flex-1 text-left">
              {value.toUpperCase()}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-52">
          <div className="space-y-3">
            {/* Native color wheel */}
            <div className="flex justify-center">
              <input
                ref={inputRef}
                className="w-32 h-32 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                type="color"
                value={value}
                onChange={(e) => {
                  onChange(e.target.value);
                  setHexInput(e.target.value);
                }}
              />
            </div>
            {/* Hex input */}
            <Input
              classNames={{
                input: "font-mono text-sm",
                inputWrapper: "h-8 min-h-8",
              }}
              label=""
              maxLength={7}
              placeholder="#000000"
              size="sm"
              startContent={
                <span
                  className="w-4 h-4 rounded shrink-0 border border-gray-200"
                  style={{ backgroundColor: value }}
                />
              }
              value={hexInput}
              variant="bordered"
              onValueChange={handleHexChange}
            />
            {/* Preset colors */}
            <div>
              <p className="text-xs text-gray-400 mb-1.5">สีที่ใช้บ่อย</p>
              <div className="grid grid-cols-7 gap-1">
                {[
                  "#000000",
                  "#ffffff",
                  "#1a3a32",
                  "#374151",
                  "#dc2626",
                  "#2563eb",
                  "#ca8a04",
                  "#16a34a",
                  "#9333ea",
                  "#ea580c",
                  "#0891b2",
                  "#be185d",
                  "#6b7280",
                  "#d1d5db",
                ].map((preset) => (
                  <button
                    key={preset}
                    className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: preset }}
                    title={preset}
                    type="button"
                    onClick={() => {
                      onChange(preset);
                      setHexInput(preset);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

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
  certMissionCompletionPercent: number;
  setCertMissionCompletionPercent: (val: number) => void;
  certRequireSurvey: boolean;
  setCertRequireSurvey: (val: boolean) => void;
  totalMissions: number;
  hasSurvey: boolean;
  // จำนวนนักเรียนที่ถูกเพิ่มเข้าค่ายทั้งหมด รวมผู้ที่ยังไม่กดลงทะเบียน
  enrolledCount?: number;
  hasAttemptedSubmit?: boolean;
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
  certMissionCompletionPercent,
  setCertMissionCompletionPercent,
  certRequireSurvey,
  setCertRequireSurvey,
  totalMissions,
  hasSurvey,
  enrolledCount = 0,
  hasAttemptedSubmit = false,
}: Props) {
  const { showWarning, showConfirm, close } = useStatusModal();
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState<"name" | "number" | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(1000);
  const [imagePreparingProgress, setImagePreparingProgress] = useState<
    number | null
  >(null);
  const localPreviewUrlRef = useRef<string | null>(null);

  const releaseLocalPreview = () => {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current);
      localPreviewUrlRef.current = null;
    }
  };

  React.useEffect(() => {
    return () => {
      if (localPreviewUrlRef.current) {
        URL.revokeObjectURL(localPreviewUrlRef.current);
        localPreviewUrlRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageNaturalWidth(imgRef.current.naturalWidth || 1000);
    }
  }, [certImage]);

  const handleImageFile = async (file: File) => {
    const acceptedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!acceptedTypes.includes(file.type.toLowerCase())) {
      showWarning(
        "ไฟล์ไม่ถูกต้อง",
        "รองรับเฉพาะไฟล์ JPG, PNG, WEBP, HEIC หรือ HEIF เท่านั้น",
      );

      return;
    }
    if (file.size > MAX_CERTIFICATE_SOURCE_BYTES) {
      showWarning("ขนาดไฟล์เกิน", "ขนาดไฟล์ต้องไม่เกิน 5MB");

      return;
    }

    try {
      setImagePreparingProgress(0);
      const imageCompression = (await import("browser-image-compression"))
        .default;
      const compressedFile = await imageCompression(file, {
        maxSizeMB: MAX_CERTIFICATE_COMPRESSION_MB,
        maxWidthOrHeight: 2000,
        onProgress: (progress) => {
          setImagePreparingProgress(Math.min(90, Math.round(progress * 0.9)));
        },
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.92,
      });

      if (
        compressedFile.size >
        MAX_CERTIFICATE_COMPRESSION_MB * 1024 * 1024
      ) {
        throw new Error(
          "Compressed certificate image is still larger than 4MB",
        );
      }

      setCertImageFile(compressedFile);
      releaseLocalPreview();
      const previewUrl = URL.createObjectURL(compressedFile);

      localPreviewUrlRef.current = previewUrl;
      setCertImage(previewUrl);
      setImagePreparingProgress(100);
      setTimeout(() => setImagePreparingProgress(null), 200);
    } catch (err) {
      console.error("Compression failed in preview:", err);
      const canUploadOriginal =
        file.size <= MAX_UNCOMPRESSED_UPLOAD_BYTES &&
        ["image/jpeg", "image/png"].includes(file.type.toLowerCase());

      if (canUploadOriginal) {
        // The file is small enough to upload directly to Cloudinary even if
        // the browser compressor cannot decode or process it.
        setCertImageFile(file);
        releaseLocalPreview();
        const previewUrl = URL.createObjectURL(file);

        localPreviewUrlRef.current = previewUrl;
        setCertImage(previewUrl);
        setImagePreparingProgress(null);
        showWarning(
          "ข้ามการบีบอัดไฟล์",
          "บีบอัดรูปไม่สำเร็จ แต่ไฟล์มีขนาดไม่เกิน 5MB ระบบจะอัปโหลดไฟล์เดิมตรงไปยัง Cloudinary",
        );
      } else {
        setCertImageFile(null);
        setImagePreparingProgress(null);
        showWarning(
          "เตรียมรูปไม่สำเร็จ",
          file.size > MAX_UNCOMPRESSED_UPLOAD_BYTES
            ? "ไม่สามารถบีบอัดกรอบเกียรติบัตรได้ และไฟล์เดิมมีขนาดเกิน 5MB ระบบจึงหยุดการอัปโหลด"
            : "บีบอัดไม่สำเร็จ ไฟล์ต้นฉบับต้องเป็น JPG/PNG เท่านั้นจึงจะอัปโหลดตรงได้",
        );
      }
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) await handleImageFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (imagePreparingProgress === null) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (imagePreparingProgress !== null) return;

    const file = e.dataTransfer.files?.[0];

    if (file) await handleImageFile(file);
  };

  const removeImage = () => {
    releaseLocalPreview();
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

  const isMissingRange =
    hasAttemptedSubmit &&
    certShowNumber &&
    (certNumberStart == null ||
      certNumberEnd == null ||
      isNaN(certNumberStart) ||
      isNaN(certNumberEnd));

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
  const requiredMissionCount = getRequiredMissionCount(
    totalMissions,
    certMissionCompletionPercent,
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-[#6b857a]/20 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a3a32] text-sm font-bold text-white">
            1
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">
              เงื่อนไขการรับเกียรติบัตร
            </h4>
            <p className="text-xs text-gray-500">
              นักเรียนจะดาวน์โหลดได้เมื่อผ่านเงื่อนไขที่กำหนดไว้ด้านล่าง
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#e2e9e5] bg-white p-3">
            <label
              className="mb-2 block text-sm font-semibold text-gray-700"
              htmlFor="certificate-mission-percent"
            >
              ต้องผ่านภารกิจอย่างน้อย
            </label>
            <div className="flex items-center gap-3">
              <input
                id="certificate-mission-percent"
                aria-label="เปอร์เซ็นต์ภารกิจขั้นต่ำสำหรับรับเกียรติบัตร"
                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-right text-sm font-bold text-gray-800 outline-none focus:border-[#6b857a] focus:ring-2 focus:ring-[#6b857a]/20"
                max="100"
                min="0"
                type="number"
                value={certMissionCompletionPercent}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  setCertMissionCompletionPercent(
                    Math.min(
                      100,
                      Math.max(
                        0,
                        Number.isFinite(value) ? Math.round(value) : 0,
                      ),
                    ),
                  );
                }}
              />
              <span className="text-sm font-bold text-gray-600">%</span>
            </div>
            <div className="mt-3 rounded-lg bg-[#e8f1ed] px-3 py-2 text-sm text-[#1a3a32]">
              {totalMissions > 0 ? (
                <>
                  นักเรียนต้องทำสำเร็จอย่างน้อย{" "}
                  <strong>
                    {requiredMissionCount} ใน {totalMissions} ภารกิจ
                  </strong>
                </>
              ) : (
                "ค่ายนี้ยังไม่มีภารกิจ ระบบจะคำนวณให้อัตโนมัติเมื่อเพิ่มภารกิจ"
              )}
            </div>
            <input
              aria-label="ปรับเปอร์เซ็นต์ภารกิจขั้นต่ำสำหรับรับเกียรติบัตร"
              className="mt-3 w-full accent-[#1a3a32]"
              max="100"
              min="0"
              type="range"
              value={certMissionCompletionPercent}
              onChange={(event) =>
                setCertMissionCompletionPercent(Number(event.target.value))
              }
            />
            <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
              ปรับด้วยแถบเลื่อนหรือพิมพ์ตัวเลข 0–100 ได้
              ระบบจะปัดจำนวนภารกิจขึ้นเมื่อจำเป็น
            </p>
          </div>

          <div className="rounded-lg border border-[#e2e9e5] bg-white p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-2">
                <ClipboardList
                  className="mt-0.5 shrink-0 text-[#6b857a]"
                  size={17}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    ต้องทำแบบสอบถามก่อน
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    นักเรียนต้องส่งแบบสอบถามก่อนจึงจะดาวน์โหลดได้
                  </p>
                </div>
              </div>
              <button
                aria-checked={certRequireSurvey}
                aria-label="กำหนดให้ทำแบบสอบถามก่อนรับเกียรติบัตร"
                className="relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b857a] focus-visible:ring-offset-1"
                role="switch"
                type="button"
                onClick={() => setCertRequireSurvey(!certRequireSurvey)}
              >
                <span
                  className={`relative block h-6 w-11 rounded-full transition-colors ${
                    certRequireSurvey ? "bg-[#1a3a32]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      certRequireSurvey ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            </div>
            <p className="mt-2 text-right text-xs font-semibold text-[#1a3a32]">
              {certRequireSurvey
                ? "เปิดใช้เงื่อนไขนี้"
                : "ไม่บังคับทำแบบสอบถาม"}
            </p>
            {certRequireSurvey && !hasSurvey && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                <AlertTriangle className="mt-0.5 shrink-0" size={15} />
                ค่ายนี้ยังไม่มีแบบสอบถาม
                นักเรียนจะยังรับเกียรติบัตรไม่ได้จนกว่าจะสร้างแบบสอบถามและส่งคำตอบ
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a3a32] text-sm font-bold text-white">
            2
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">
              อัปโหลดเทมเพลตเกียรติบัตร
            </h4>
            <p className="text-xs text-gray-500">
              ใช้ภาพพื้นหลังที่ต้องการแสดงบนเกียรติบัตร
            </p>
          </div>
        </div>
        {certImage && (
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
            ลบภาพ
          </button>
        )}
      </div>

      {!certImage ? (
        <label
          className={`block w-full rounded-xl ${imagePreparingProgress === null ? "cursor-pointer" : "cursor-wait"}`}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            disabled={imagePreparingProgress !== null}
            type="file"
            onChange={handleImageChange}
          />
          <div
            className={`rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isDragOver
                ? "border-[#6b857a] bg-[#f0f4f2]"
                : "border-gray-300 bg-white hover:border-[#6b857a] hover:bg-gray-50"
            }`}
          >
            {imagePreparingProgress === null ? (
              <>
                <ImageOff className="mx-auto text-gray-400 mb-2" size={28} />
                <p className="text-sm font-medium text-gray-600">
                  {isDragOver
                    ? "วางไฟล์ภาพเกียรติบัตรที่นี่"
                    : "คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  รองรับ JPG, PNG, WEBP, HEIC และ HEIF ขนาดไม่เกิน 5MB
                </p>
              </>
            ) : (
              <div aria-live="polite" className="mx-auto max-w-md py-1">
                <div className="mb-2 flex items-center justify-between text-sm font-medium text-[#1a3a32]">
                  <span>กำลังเตรียมรูปเกียรติบัตร...</span>
                  <span>{imagePreparingProgress}%</span>
                </div>
                <div
                  aria-label="ความคืบหน้าการเตรียมรูปเกียรติบัตร"
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={imagePreparingProgress}
                  className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-[#6b857a] transition-[width] duration-200 ease-out"
                    style={{ width: `${imagePreparingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </label>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-[#e2e9e5] bg-white px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a3a32] text-xs font-bold text-white">
              3
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                จัดวางข้อมูลบนเกียรติบัตร
              </p>
              <p className="text-xs text-gray-500">
                ปรับขนาด สี และลากชื่อหรือเลขที่บนภาพตัวอย่าง
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* ---- ฝั่งตั้งค่า ---- */}
            <div className="flex-1 min-w-0 space-y-4">
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
                  <ColorPicker
                    label="สีตัวอักษร"
                    value={certFontColor}
                    onChange={setCertFontColor}
                  />
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
                    aria-checked={certShowNumber}
                    aria-label="แสดงเลขที่บนเกียรติบัตร"
                    className="relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b857a] focus-visible:ring-offset-1"
                    role="switch"
                    type="button"
                    onClick={() => setCertShowNumber(!certShowNumber)}
                  >
                    <span
                      className={`relative block h-6 w-11 rounded-full transition-colors ${
                        certShowNumber ? "bg-[#1a3a32]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1 inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          certShowNumber ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </span>
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
                        <span className="text-gray-400 font-bold shrink-0">
                          —
                        </span>
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
                            จำนวนใบในช่วงที่กำหนด:{" "}
                            <strong>{rangeCount} ใบ</strong>
                          </span>
                          {enrolledCount > 0 && (
                            <>
                              <span className="text-gray-300 mx-1.5">|</span>
                              <span className="text-gray-400">
                                นักเรียนในค่ายทั้งหมด:{" "}
                                <strong>{enrolledCount} คน</strong>
                              </span>
                            </>
                          )}
                        </div>
                      )}

                      {/* แจ้งเตือนเมื่อข้อมูลไม่ครบถ้วน */}
                      {isMissingRange && (
                        <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <XCircle
                            className="text-red-500 mt-0.5 shrink-0"
                            size={16}
                          />
                          <p className="text-xs text-red-600 leading-relaxed">
                            <strong>ข้อมูลไม่ครบถ้วน!</strong>{" "}
                            กรุณาระบุช่วงเลขเริ่มต้นและสิ้นสุดของเกียรติบัตรให้ครบถ้วน
                          </p>
                        </div>
                      )}

                      {/* แจ้งเตือนเมื่อช่วงผิดพลาด */}
                      {isInvalidRange && !isMissingRange && (
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
                            มีนักเรียนในค่ายทั้งหมด {enrolledCount} คน
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
                      <ColorPicker
                        label="สีตัวอักษร"
                        value={certNumberColor}
                        onChange={setCertNumberColor}
                      />
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
            </div>

            {/* ---- ภาพพรีวิว ---- */}
            <div className="lg:w-[55%] shrink-0">
              <div
                ref={containerRef}
                className="relative border-2 border-gray-200 rounded-lg overflow-hidden select-none touch-none bg-gray-100 lg:sticky lg:top-0"
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
              <p className="text-xs text-center text-gray-500 font-medium flex items-center justify-center gap-1 mt-2">
                <Sparkles className="text-[#6b857a]" size={14} />
                คลิกค้างที่ชื่อหรือเลขที่แล้วลากเพื่อเปลี่ยนตำแหน่ง
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
