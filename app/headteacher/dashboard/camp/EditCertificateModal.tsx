"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Download } from "lucide-react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/react";

import CertificateSettings from "./CertificateSettings";

import { useStatusModal } from "@/components/StatusModalProvider";

interface CampDetail {
  camp_id: number;
  img_certificate_url?: string;
  cert_name_x?: number;
  cert_name_y?: number;
  cert_font_size?: number;
  cert_font_color?: string;
  cert_show_number?: boolean;
  cert_number_start?: number | null;
  cert_number_end?: number | null;
  cert_number_x?: number | null;
  cert_number_y?: number | null;
  cert_number_size?: number | null;
  cert_number_color?: string | null;
  cert_number_prefix?: string | null;
  cert_number_is_thai?: boolean;
  cert_year?: string | null;
  // จำนวนนักเรียนที่สามารถออกเกียรติบัตรได้ทั้งหมด
  certificate_candidate_count?: number;
  student_enrollment?: { student_enrollment_id: number }[];
}

interface EditCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  campData: CampDetail | null;
  onSuccess: () => void;
}

export default function EditCertificateModal({
  isOpen,
  onClose,
  campData,
  onSuccess,
}: EditCertificateModalProps) {
  const { showError, showSuccess } = useStatusModal();

  // ชื่อ
  const [certImage, setCertImage] = useState<string | null>(null);
  const [certImageFile, setCertImageFile] = useState<File | null>(null);
  const [certNameX, setCertNameX] = useState<number>(50);
  const [certNameY, setCertNameY] = useState<number>(50);
  const [certFontSize, setCertFontSize] = useState<number>(48);
  const [certFontColor, setCertFontColor] = useState<string>("#000000");

  // เลขที่เกียรติบัตร
  const [certShowNumber, setCertShowNumber] = useState<boolean>(false);
  const [certNumberStart, setCertNumberStart] = useState<number | null>(null);
  const [certNumberEnd, setCertNumberEnd] = useState<number | null>(null);
  const [certNumberX, setCertNumberX] = useState<number>(50);
  const [certNumberY, setCertNumberY] = useState<number>(10);
  const [certNumberSize, setCertNumberSize] = useState<number>(36);
  const [certNumberColor, setCertNumberColor] = useState<string>("#000000");
  const [certNumberPrefix, setCertNumberPrefix] = useState<
    "เลขที่" | "No." | ""
  >("เลขที่");
  const [certNumberIsThai, setCertNumberIsThai] = useState<boolean>(false);
  const [certYear, setCertYear] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [exportCondition, setExportCondition] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const enrolledCount =
    campData?.certificate_candidate_count ??
    campData?.student_enrollment?.length ??
    0;

  useEffect(() => {
    if (isOpen && campData) {
      setCertImage(campData.img_certificate_url || null);
      setCertImageFile(null);
      setCertNameX(campData.cert_name_x ?? 50);
      setCertNameY(campData.cert_name_y ?? 50);
      setCertFontSize(campData.cert_font_size ?? 48);
      setCertFontColor(campData.cert_font_color ?? "#000000");
      setCertShowNumber(campData.cert_show_number ?? false);
      setCertNumberStart(campData.cert_number_start ?? null);
      setCertNumberEnd(campData.cert_number_end ?? null);
      setCertNumberX(campData.cert_number_x ?? 50);
      setCertNumberY(campData.cert_number_y ?? 10);
      setCertNumberSize(campData.cert_number_size ?? 36);
      setCertNumberColor(campData.cert_number_color ?? "#000000");
      const raw = campData.cert_number_prefix;

      setCertNumberPrefix(
        raw === "เลขที่" || raw === "No." || raw === "" ? raw : "เลขที่",
      );
      setCertNumberIsThai(campData.cert_number_is_thai ?? false);
      setCertYear(campData.cert_year ?? null);
    }
  }, [isOpen, campData]);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!campData) return;

    // Check if the current settings differ from saved ones
    // We assume the user has saved their changes before exporting.

    try {
      setIsExporting(true);
      const url = `/api/camps/${campData.camp_id}/certificate/bulk?condition=${exportCondition}`;

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.error || "เกิดข้อผิดพลาดในการดาวน์โหลดเกียรติบัตร",
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = downloadUrl;
      a.download = `certificates_camp_${campData.camp_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showSuccess("สำเร็จ", "ดาวน์โหลดเกียรติบัตรเรียบร้อยแล้ว");
    } catch (error: any) {
      showError(
        "ข้อผิดพลาด",
        error.message || "ไม่สามารถดาวน์โหลดเกียรติบัตรได้",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const compressImage = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return file;
    try {
      const imageCompression = (await import("browser-image-compression"))
        .default;

      return await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2000,
        useWebWorker: true,
      });
    } catch (e) {
      console.error("Compression error:", e);

      return file;
    }
  };

  const uploadCertificateImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const uploadForm = new FormData();
      const request = new XMLHttpRequest();

      uploadForm.append("file", file);
      request.open("POST", "/api/upload");

      request.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      request.addEventListener("load", () => {
        if (request.status >= 200 && request.status < 300) {
          try {
            const data = JSON.parse(request.responseText);

            if (!data.url) throw new Error("Upload response has no URL");
            setUploadProgress(100);
            resolve(data.url);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("Certificate upload failed"));
        }
      });
      request.addEventListener("error", () =>
        reject(new Error("Certificate upload failed")),
      );
      request.addEventListener("abort", () =>
        reject(new Error("Certificate upload was cancelled")),
      );
      request.send(uploadForm);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!campData) return;

    if (certShowNumber) {
      if (
        certNumberStart == null ||
        certNumberEnd == null ||
        isNaN(certNumberStart) ||
        isNaN(certNumberEnd)
      ) {
        showError(
          "ข้อมูลไม่ครบถ้วน",
          "กรุณาระบุช่วงเลขเริ่มต้นและสิ้นสุดของเกียรติบัตร",
        );

        return;
      }

      if (certNumberStart > certNumberEnd) {
        showError(
          "ข้อมูลไม่ถูกต้อง",
          "เลขสิ้นสุดต้องมีค่ามากกว่าหรือเท่ากับเลขเริ่มต้น",
        );

        return;
      }
    }

    try {
      setIsSubmitting(true);
      let finalCertUrl = certImage || null;

      if (certImageFile) {
        const compressedFile = await compressImage(certImageFile);

        try {
          setUploadProgress(0);
          finalCertUrl = await uploadCertificateImage(compressedFile);
        } catch (error) {
          console.error("Certificate upload error:", error);
          showError("อัปโหลดรูปล้มเหลว", "ไม่สามารถอัปโหลดรูปเกียรติบัตรได้");

          return;
        }
      }

      const response = await fetch(`/api/camps/${campData.camp_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          img_certificate_url: finalCertUrl,
          cert_name_x: certNameX,
          cert_name_y: certNameY,
          cert_font_size: certFontSize,
          cert_font_color: certFontColor,
          cert_show_number: certShowNumber,
          cert_number_start: certNumberStart,
          cert_number_end: certNumberEnd,
          cert_number_x: certNumberX,
          cert_number_y: certNumberY,
          cert_number_size: certNumberSize,
          cert_number_color: certNumberColor,
          cert_number_prefix: certNumberPrefix,
          cert_number_is_thai: certNumberIsThai,
          cert_year: certYear,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Server Error:", errorText);
        throw new Error(`Failed to update certificate: ${errorText}`);
      }

      showSuccess("สำเร็จ", "อัปเดตการตั้งค่าเกียรติบัตรเรียบร้อยแล้ว");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating certificate:", error);
      showError("ข้อผิดพลาด", "ไม่สามารถบันทึกการตั้งค่าเกียรติบัตรได้");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">
            ตั้งค่าเกียรติบัตร
          </h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <form id="certForm" onSubmit={handleSubmit}>
            <CertificateSettings
              certFontColor={certFontColor}
              certFontSize={certFontSize}
              certImage={certImage}
              certNameX={certNameX}
              certNameY={certNameY}
              certNumberColor={certNumberColor}
              certNumberEnd={certNumberEnd}
              certNumberIsThai={certNumberIsThai}
              certNumberPrefix={certNumberPrefix}
              certNumberSize={certNumberSize}
              certNumberStart={certNumberStart}
              certNumberX={certNumberX}
              certNumberY={certNumberY}
              certShowNumber={certShowNumber}
              certYear={certYear}
              enrolledCount={enrolledCount}
              hasAttemptedSubmit={hasAttemptedSubmit}
              setCertFontColor={setCertFontColor}
              setCertFontSize={setCertFontSize}
              setCertImage={setCertImage}
              setCertImageFile={setCertImageFile}
              setCertNameX={setCertNameX}
              setCertNameY={setCertNameY}
              setCertNumberColor={setCertNumberColor}
              setCertNumberEnd={setCertNumberEnd}
              setCertNumberIsThai={setCertNumberIsThai}
              setCertNumberPrefix={setCertNumberPrefix}
              setCertNumberSize={setCertNumberSize}
              setCertNumberStart={setCertNumberStart}
              setCertNumberX={setCertNumberX}
              setCertNumberY={setCertNumberY}
              setCertShowNumber={setCertShowNumber}
              setCertYear={setCertYear}
            />
          </form>
        </div>

        {uploadProgress !== null && (
          <div
            aria-live="polite"
            className="px-6 pt-3 bg-white border-t border-gray-100"
          >
            <div className="flex items-center justify-between mb-1.5 text-xs font-medium text-[#1a3a32]">
              <span>กำลังอัปโหลดไฟล์เกียรติบัตร...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div
              aria-label="ความคืบหน้าการอัปโหลดไฟล์เกียรติบัตร"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={uploadProgress}
              className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-[#6b857a] transition-[width] duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div
          className={`flex flex-wrap justify-between items-center gap-3 px-6 py-4 bg-white sticky bottom-0 z-10 ${uploadProgress === null ? "border-t border-gray-100" : ""}`}
        >
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              aria-label="เลือกกลุ่มนักเรียนสำหรับดาวน์โหลดเกียรติบัตร"
              className="w-80 max-w-full shrink-0"
              selectedKeys={[exportCondition]}
              size="sm"
              onChange={(e) => setExportCondition(e.target.value)}
            >
              <SelectItem key="all">เฉพาะผู้ลงทะเบียนแล้ว</SelectItem>
              <SelectItem key="all_students">
                นักเรียนทั้งหมด (รวมผู้ยังไม่ลงทะเบียน)
              </SelectItem>
              <SelectItem key="passed_conditions">
                เฉพาะผู้ผ่านเงื่อนไข
              </SelectItem>
            </Select>
            <Button
              className="font-medium bg-[#1a3a32]/10 text-[#1a3a32] hover:bg-[#1a3a32]/20"
              isLoading={isExporting}
              size="sm"
              startContent={!isExporting && <Download size={16} />}
              onPress={handleExport}
            >
              ดาวน์โหลด PDF แบบรวม
            </Button>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              className="font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
              isDisabled={isSubmitting}
              variant="flat"
              onPress={onClose}
            >
              ยกเลิก
            </Button>
            <Button
              className="font-medium bg-[#1a3a32] text-white shadow-md shadow-[#1a3a32]/20"
              form="certForm"
              isLoading={isSubmitting}
              startContent={<Save size={18} />}
              type="submit"
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
