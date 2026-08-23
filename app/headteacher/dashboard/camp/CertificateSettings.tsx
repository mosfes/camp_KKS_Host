"use client";

import React, { useRef, useState } from "react";
import {
  FileImage,
  ImageOff,
  Trash2,
  Hash,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  ClipboardList,
  Move,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Input } from "@heroui/input";

import { useStatusModal } from "@/components/StatusModalProvider";
import { getRequiredMissionCount } from "@/lib/certificate-eligibility";

const MAX_CERTIFICATE_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_UNCOMPRESSED_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_CERTIFICATE_COMPRESSION_MB = 4;

function formatFileSize(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  certificateImageMetadata?: {
    bytes?: number | null;
    width?: number | null;
    height?: number | null;
    format?: string | null;
  };
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
  certificateImageMetadata,
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
  const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0);
  const [selectedImageInfo, setSelectedImageInfo] = useState<{
    bytes: number;
    format: string;
  } | null>(null);
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
      setImageNaturalHeight(imgRef.current.naturalHeight || 0);
    }
  }, [certImage]);

  React.useEffect(() => {
    if (certImage && !certImage.startsWith("blob:")) {
      setSelectedImageInfo(null);
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

      if (compressedFile.size > MAX_CERTIFICATE_COMPRESSION_MB * 1024 * 1024) {
        throw new Error(
          "Compressed certificate image is still larger than 4MB",
        );
      }

      setCertImageFile(compressedFile);
      setSelectedImageInfo({
        bytes: compressedFile.size,
        format: compressedFile.type.split("/")[1]?.toUpperCase() || "JPEG",
      });
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
        setSelectedImageInfo({
          bytes: file.size,
          format: file.type.split("/")[1]?.toUpperCase() || "IMAGE",
        });
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
    setSelectedImageInfo(null);
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

  const handlePositionKeyDown =
    (type: "name" | "number") => (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1;
      const keyDelta = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      }[e.key];

      if (!keyDelta) return;
      e.preventDefault();
      const [deltaX, deltaY] = keyDelta;

      if (type === "name") {
        setCertNameX(Math.max(0, Math.min(100, certNameX + deltaX)));
        setCertNameY(Math.max(0, Math.min(100, certNameY + deltaY)));
      } else {
        setCertNumberX(Math.max(0, Math.min(100, certNumberX + deltaX)));
        setCertNumberY(Math.max(0, Math.min(100, certNumberY + deltaY)));
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

  const imageBytes =
    selectedImageInfo?.bytes ?? certificateImageMetadata?.bytes;
  const imageFormat =
    selectedImageInfo?.format ??
    certificateImageMetadata?.format?.toUpperCase() ??
    "IMAGE";
  const imageWidth = imageNaturalWidth || certificateImageMetadata?.width || 0;
  const imageHeight =
    imageNaturalHeight || certificateImageMetadata?.height || 0;
  const isPortraitTemplate = imageHeight > imageWidth;
  const controlButtonClass =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#6b857a]/20 bg-[#f0f4f2] px-3 py-2 text-xs font-semibold text-[#1a3a32] transition-colors hover:bg-[#e2ebe6]";

  return (
    <div
      className={
        certImage
          ? "grid items-start gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(460px,1.15fr)]"
          : "space-y-4"
      }
    >
      <div className="min-w-0 space-y-4">
        <section className="rounded-2xl border border-[#6b857a]/20 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1a3a32] bg-white text-sm font-bold text-[#1a3a32]">
              1
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">
                เงื่อนไขการรับเกียรติบัตร
              </h4>
              <p className="text-xs text-gray-500">
                กำหนดสิ่งที่นักเรียนต้องทำก่อนดาวน์โหลด
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#e2e9e5] bg-[#fbfcfb] p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    ภารกิจขั้นต่ำ
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {totalMissions > 0 ? (
                      <>
                        ต้องผ่าน <strong>{requiredMissionCount}</strong> จาก{" "}
                        <strong>{totalMissions}</strong> ภารกิจ
                      </>
                    ) : (
                      "ยังไม่มีภารกิจในค่ายนี้"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    aria-label="เปอร์เซ็นต์ภารกิจขั้นต่ำสำหรับรับเกียรติบัตร"
                    className="h-9 w-20 rounded-lg border border-gray-200 bg-white px-2 text-right text-sm font-bold text-gray-800 outline-none focus:border-[#6b857a] focus:ring-2 focus:ring-[#6b857a]/20"
                    id="certificate-mission-percent"
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
                  <span className="text-sm font-bold text-gray-500">%</span>
                </div>
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
              <div className="mt-2 grid grid-cols-5 gap-1.5">
                {[0, 25, 50, 75, 100].map((preset) => (
                  <button
                    key={preset}
                    aria-pressed={certMissionCompletionPercent === preset}
                    className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                      certMissionCompletionPercent === preset
                        ? "bg-[#1a3a32] text-white"
                        : "bg-white text-gray-500 hover:bg-[#e8f1ed]"
                    }`}
                    type="button"
                    onClick={() => setCertMissionCompletionPercent(preset)}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#e2e9e5] bg-[#fbfcfb] p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <ClipboardList
                    className="mt-0.5 shrink-0 text-[#6b857a]"
                    size={17}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      ต้องส่งแบบสอบถาม
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      บังคับให้ส่งคำตอบก่อนดาวน์โหลดเกียรติบัตร
                    </p>
                  </div>
                </div>
                <button
                  aria-checked={certRequireSurvey}
                  aria-label="กำหนดให้ทำแบบสอบถามก่อนรับเกียรติบัตร"
                  className="relative inline-flex h-10 w-14 shrink-0 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b857a] focus-visible:ring-offset-1"
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
              {certRequireSurvey && !hasSurvey && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                  <AlertTriangle className="mt-0.5 shrink-0" size={15} />
                  ค่ายนี้ยังไม่มีแบบสอบถาม นักเรียนจะยังรับเกียรติบัตรไม่ได้
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#6b857a]/20 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1a3a32] bg-white text-sm font-bold text-[#1a3a32]">
              2
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">
                เทมเพลตเกียรติบัตร
              </h4>
              <p className="text-xs text-gray-500">
                อัปโหลดภาพพื้นหลังแนวนอน ขนาดไม่เกิน 5MB
              </p>
            </div>
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
                    : "border-gray-300 bg-[#fbfcfb] hover:border-[#6b857a] hover:bg-gray-50"
                }`}
              >
                {imagePreparingProgress === null ? (
                  <>
                    <ImageOff
                      className="mx-auto mb-2 text-gray-400"
                      size={28}
                    />
                    <p className="text-sm font-semibold text-gray-600">
                      {isDragOver
                        ? "วางไฟล์ภาพที่นี่"
                        : "เลือกภาพ หรือลากไฟล์มาวาง"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      JPG, PNG, WEBP, HEIC หรือ HEIF
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
            <div className="rounded-xl border border-[#e2e9e5] bg-[#fbfcfb] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img
                    alt="ภาพย่อเทมเพลตเกียรติบัตร"
                    className="h-full w-full object-cover"
                    src={certImage}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                    <FileImage className="shrink-0 text-[#6b857a]" size={16} />
                    เทมเพลตพร้อมใช้งาน
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-gray-500">
                    <span className="rounded-md bg-white px-2 py-0.5">
                      {imageFormat}
                    </span>
                    {formatFileSize(imageBytes) && (
                      <span className="rounded-md bg-white px-2 py-0.5">
                        {formatFileSize(imageBytes)}
                      </span>
                    )}
                    {imageWidth > 0 && imageHeight > 0 && (
                      <span className="rounded-md bg-white px-2 py-0.5">
                        {imageWidth} × {imageHeight}px
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className={`${controlButtonClass} cursor-pointer`}>
                  <Upload size={14} />
                  เปลี่ยนภาพ
                  <input
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="hidden"
                    disabled={imagePreparingProgress !== null}
                    type="file"
                    onChange={handleImageChange}
                  />
                </label>
                <button
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
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
              </div>
            </div>
          )}
        </section>

        {certImage && (
          <section className="rounded-2xl border border-[#6b857a]/20 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#1a3a32] bg-white text-sm font-bold text-[#1a3a32]">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">
                  จัดวางข้อมูล
                </h4>
                <p className="text-xs text-gray-500">
                  ปรับรูปแบบที่นี่ แล้วลากข้อความบนภาพตัวอย่าง
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-[#e2e9e5] bg-[#fbfcfb] p-3.5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      ชื่อนักเรียน
                    </p>
                    <p className="text-[11px] text-gray-400">
                      ตำแหน่ง {Math.round(certNameX)}, {Math.round(certNameY)}
                    </p>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-[#1a3a32]"
                    type="button"
                    onClick={() => {
                      setCertNameX(50);
                      setCertNameY(50);
                      setCertFontSize(48);
                      setCertFontColor("#000000");
                    }}
                  >
                    <RotateCcw size={13} />
                    คืนค่าเริ่มต้น
                  </button>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-3">
                  <div>
                    <label
                      className="mb-1 block text-xs font-medium text-gray-500"
                      htmlFor="certificate-name-size"
                    >
                      ขนาดตัวอักษร
                    </label>
                    <input
                      aria-label="ขนาดตัวอักษรชื่อนักเรียน"
                      className="w-full accent-[#6b857a]"
                      id="certificate-name-size"
                      max="300"
                      min="16"
                      type="range"
                      value={certFontSize}
                      onChange={(e) => setCertFontSize(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label
                      className="mb-1 block text-xs font-medium text-gray-500"
                      htmlFor="certificate-name-size-number"
                    >
                      พิกเซล
                    </label>
                    <input
                      aria-label="ขนาดตัวอักษรชื่อนักเรียนเป็นพิกเซล"
                      className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-right text-sm"
                      id="certificate-name-size-number"
                      max="300"
                      min="16"
                      type="number"
                      value={certFontSize}
                      onChange={(e) => setCertFontSize(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[150px_1fr] sm:items-end">
                  <ColorPicker
                    label="สีตัวอักษร"
                    value={certFontColor}
                    onChange={setCertFontColor}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={controlButtonClass}
                      type="button"
                      onClick={() => setCertNameX(50)}
                    >
                      กึ่งกลางแนวนอน
                    </button>
                    <button
                      className={controlButtonClass}
                      type="button"
                      onClick={() => setCertNameY(50)}
                    >
                      กึ่งกลางแนวตั้ง
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e2e9e5] bg-[#fbfcfb] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Hash className="mt-0.5 text-[#6b857a]" size={16} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        เลขที่เกียรติบัตร
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {certShowNumber
                          ? `ตัวอย่าง ${displayExampleText}`
                          : "ไม่แสดงเลขที่บนเกียรติบัตร"}
                      </p>
                    </div>
                  </div>
                  <button
                    aria-checked={certShowNumber}
                    aria-label="แสดงเลขที่บนเกียรติบัตร"
                    className="relative inline-flex h-10 w-14 shrink-0 items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6b857a] focus-visible:ring-offset-1"
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
                        className={`absolute left-0 top-1 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          certShowNumber ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </span>
                  </button>
                </div>

                {certShowNumber && (
                  <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                    <div>
                      <p className="mb-1 block text-xs font-medium text-gray-500">
                        ช่วงเลขที่ (เริ่มต้น — สิ้นสุด)
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          aria-label="เลขที่เกียรติบัตรเริ่มต้น"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b857a]/30"
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
                        <span className="shrink-0 font-bold text-gray-400">
                          —
                        </span>
                        <input
                          aria-label="เลขที่เกียรติบัตรสิ้นสุด"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b857a]/30"
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
                      {rangeCount != null && (
                        <p className="mt-1.5 text-[11px] text-gray-400">
                          ช่วงนี้มี {rangeCount} ใบ
                          {enrolledCount > 0 &&
                            ` · นักเรียน ${enrolledCount} คน`}
                        </p>
                      )}
                      {isMissingRange && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                          <XCircle className="mt-0.5 shrink-0" size={15} />
                          กรุณาระบุเลขเริ่มต้นและสิ้นสุดให้ครบถ้วน
                        </div>
                      )}
                      {isInvalidRange && !isMissingRange && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                          <XCircle className="mt-0.5 shrink-0" size={15} />
                          เลขสิ้นสุดต้องมากกว่าหรือเท่ากับเลขเริ่มต้น
                        </div>
                      )}
                      {isInsufficient && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                          <AlertTriangle
                            className="mt-0.5 shrink-0"
                            size={15}
                          />
                          ช่วงเลขขาด {enrolledCount - rangeCount!} ใบ
                          ระบบจะออกเลขเกินช่วงที่กำหนดเมื่อจำเป็น
                        </div>
                      )}
                      {!isInsufficient &&
                        surplus != null &&
                        surplus > 0 &&
                        enrolledCount > 0 && (
                          <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-600">
                            <CheckCircle className="shrink-0" size={15} />
                            ช่วงเลขเพียงพอ เหลือ {surplus} ใบ
                          </div>
                        )}
                    </div>

                    <div>
                      <p className="mb-1.5 block text-xs font-medium text-gray-500">
                        คำนำหน้าเลขที่
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["เลขที่", "No.", ""] as const).map((prefix) => (
                          <button
                            key={prefix === "" ? "none" : prefix}
                            aria-pressed={certNumberPrefix === prefix}
                            className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                              certNumberPrefix === prefix
                                ? "border-[#1a3a32] bg-[#1a3a32] text-white"
                                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                            }`}
                            type="button"
                            onClick={() => setCertNumberPrefix(prefix)}
                          >
                            {prefix === "" ? "ไม่มี" : prefix}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          className="mb-1 block text-xs font-medium text-gray-500"
                          htmlFor="certificate-year"
                        >
                          ปีการศึกษา (ถ้ามี)
                        </label>
                        <input
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6b857a]/30"
                          id="certificate-year"
                          placeholder="เช่น 2569"
                          type="text"
                          value={certYear ?? ""}
                          onChange={(e) => setCertYear(e.target.value || null)}
                        />
                      </div>
                      <div>
                        <p className="mb-1.5 block text-xs font-medium text-gray-500">
                          รูปแบบตัวเลข
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            aria-pressed={!certNumberIsThai}
                            className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                              !certNumberIsThai
                                ? "border-[#1a3a32] bg-[#1a3a32] text-white"
                                : "border-gray-200 bg-white text-gray-500"
                            }`}
                            type="button"
                            onClick={() => setCertNumberIsThai(false)}
                          >
                            0–9
                          </button>
                          <button
                            aria-pressed={certNumberIsThai}
                            className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                              certNumberIsThai
                                ? "border-[#1a3a32] bg-[#1a3a32] text-white"
                                : "border-gray-200 bg-white text-gray-500"
                            }`}
                            type="button"
                            onClick={() => setCertNumberIsThai(true)}
                          >
                            ๐–๙
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-3">
                      <div>
                        <label
                          className="mb-1 block text-xs font-medium text-gray-500"
                          htmlFor="certificate-number-size"
                        >
                          ขนาดตัวอักษรเลขที่
                        </label>
                        <input
                          aria-label="ขนาดตัวอักษรเลขที่เกียรติบัตร"
                          className="w-full accent-[#6b857a]"
                          id="certificate-number-size"
                          max="200"
                          min="12"
                          type="range"
                          value={certNumberSize}
                          onChange={(e) =>
                            setCertNumberSize(Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="mb-1 block text-xs font-medium text-gray-500"
                          htmlFor="certificate-number-size-number"
                        >
                          พิกเซล
                        </label>
                        <input
                          aria-label="ขนาดตัวอักษรเลขที่เกียรติบัตรเป็นพิกเซล"
                          className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-right text-sm"
                          id="certificate-number-size-number"
                          max="200"
                          min="12"
                          type="number"
                          value={certNumberSize}
                          onChange={(e) =>
                            setCertNumberSize(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[150px_1fr] sm:items-end">
                      <ColorPicker
                        label="สีตัวอักษร"
                        value={certNumberColor}
                        onChange={setCertNumberColor}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className={controlButtonClass}
                          type="button"
                          onClick={() => setCertNumberX(50)}
                        >
                          กึ่งกลางแนวนอน
                        </button>
                        <button
                          className={controlButtonClass}
                          type="button"
                          onClick={() => setCertNumberY(50)}
                        >
                          กึ่งกลางแนวตั้ง
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {certImage && (
        <aside className="min-w-0 xl:sticky xl:top-4">
          <div className="overflow-hidden rounded-2xl border border-[#6b857a]/20 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-gray-800">ภาพตัวอย่าง</p>
                <p className="text-[11px] text-gray-500">
                  ตัวอย่างจะอัปเดตทันทีเมื่อปรับค่า
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-[#e8f1ed] px-2.5 py-1 text-[11px] font-semibold text-[#1a3a32]">
                <Move size={13} />
                ลากเพื่อจัดตำแหน่ง
              </div>
            </div>
            <div className="bg-[#eef1ef] p-3 sm:p-4">
              <div
                ref={containerRef}
                className={`relative mx-auto max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm select-none touch-none ${
                  isPortraitTemplate ? "w-[min(100%,46dvh)]" : "w-full"
                }`}
                role="presentation"
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
                  className="pointer-events-none block h-auto w-full"
                  src={certImage}
                  onLoad={(e) => {
                    setImageNaturalWidth(e.currentTarget.naturalWidth || 1000);
                    setImageNaturalHeight(e.currentTarget.naturalHeight || 0);
                  }}
                />
                {isDragging && (
                  <>
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[5] border-l border-dashed border-[#1a3a32]/50" />
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[5] border-t border-dashed border-[#1a3a32]/50" />
                  </>
                )}
                <button
                  aria-label="ตำแหน่งตัวอย่างชื่อนักเรียน ใช้ปุ่มลูกศรเพื่อขยับ"
                  className={`absolute z-10 flex cursor-move items-center justify-center whitespace-nowrap rounded px-1 transition-shadow ${
                    isDragging === "name" ? "ring-2 ring-[#1a3a32]/50" : ""
                  }`}
                  style={{
                    left: `${certNameX}%`,
                    top: `${certNameY}%`,
                    transform: "translate(-50%, -50%)",
                    fontSize: `${(certFontSize / imageNaturalWidth) * 100}cqi`,
                    fontFamily: "Sarabun, sans-serif",
                    color: certFontColor,
                  }}
                  type="button"
                  onKeyDown={handlePositionKeyDown("name")}
                  onMouseDown={handleMouseDown("name")}
                  onTouchStart={() => setIsDragging("name")}
                >
                  นายตัวอย่าง นามสกุลตัวอย่าง
                </button>
                {certShowNumber && (
                  <button
                    aria-label="ตำแหน่งตัวอย่างเลขที่เกียรติบัตร ใช้ปุ่มลูกศรเพื่อขยับ"
                    className={`absolute z-10 flex cursor-move items-center justify-center whitespace-nowrap rounded px-1 transition-shadow ${
                      isDragging === "number" ? "ring-2 ring-[#1a3a32]/50" : ""
                    }`}
                    style={{
                      left: `${certNumberX}%`,
                      top: `${certNumberY}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${(certNumberSize / imageNaturalWidth) * 100}cqi`,
                      fontFamily: "Sarabun, sans-serif",
                      color: certNumberColor,
                    }}
                    type="button"
                    onKeyDown={handlePositionKeyDown("number")}
                    onMouseDown={handleMouseDown("number")}
                    onTouchStart={() => setIsDragging("number")}
                  >
                    {displayExampleText}
                  </button>
                )}
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-gray-500">
                <Sparkles className="text-[#6b857a]" size={14} />
                คลิกค้างที่ชื่อหรือเลขที่แล้วลากไปยังตำแหน่งที่ต้องการ
              </p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
