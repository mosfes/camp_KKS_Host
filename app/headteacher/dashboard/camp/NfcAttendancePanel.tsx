"use client";

import { Button } from "@heroui/button";
import {
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Nfc,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ScanStatus = {
  kind: "info" | "success" | "warning" | "error";
  message: string;
};

type NfcAttendancePanelProps = {
  campId: number;
  roundId: string;
  onDataChanged: () => void | Promise<void>;
};

function getNfcErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";

  if (name === "NotAllowedError")
    return "ไม่ได้รับอนุญาตให้ใช้ NFC กรุณากดอนุญาตใน Chrome";
  if (name === "NotSupportedError")
    return "อุปกรณ์หรือบัตรนี้ไม่รองรับ Web NFC";
  if (name === "NotReadableError")
    return "ไม่สามารถเปิด NFC ได้ กรุณาเปิด NFC ในการตั้งค่าโทรศัพท์";

  return "เปิดตัวอ่าน NFC ไม่สำเร็จ กรุณาลองใหม่";
}

function readCardData(event: any): string | null {
  const records = Array.from(event?.message?.records || []) as any[];

  for (const record of records) {
    if (!record?.data) continue;
    if (
      record.recordType !== "text" &&
      record.recordType !== "url" &&
      record.mediaType !== "text/plain"
    )
      continue;

    try {
      const value = new TextDecoder(record.encoding || "utf-8")
        .decode(record.data)
        .trim();

      if (value) return value;
    } catch {}
  }

  return null;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export default function NfcAttendancePanel({
  campId,
  roundId,
  onDataChanged,
}: NfcAttendancePanelProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<ScanStatus>({
    kind: "info",
    message:
      "กดเริ่มอ่านบัตร แล้วแตะบัตรได้ทันที ระบบจะอ่านรหัสนักเรียนจากข้อมูลในบัตร",
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);
  const recentCardRef = useRef({ cardData: "", readAt: 0 });

  const stopReader = (resetStatus = true) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    processingRef.current = false;
    setIsProcessing(false);
    setIsScanning(false);
    if (resetStatus) {
      setStatus({ kind: "info", message: "หยุดอ่านบัตร NFC แล้ว" });
    }
  };

  useEffect(() => {
    setSupported(window.isSecureContext && "NDEFReader" in window);

    return () => abortControllerRef.current?.abort();
  }, []);

  const handleCheckin = async (cardData: string) => {
    if (processingRef.current) return;

    const now = Date.now();

    if (
      recentCardRef.current.cardData === cardData &&
      now - recentCardRef.current.readAt < 2500
    )
      return;

    recentCardRef.current = { cardData, readAt: now };
    processingRef.current = true;
    setIsProcessing(true);
    setStatus({ kind: "info", message: "กำลังตรวจสอบรหัสในบัตร..." });

    try {
      const response = await fetch(`/api/attendance/${campId}/nfc-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, cardData }),
      });
      const data = await readJson(response);

      if (!response.ok) {
        setStatus({
          kind: "error",
          message: data.error || "เช็คชื่อด้วยบัตรนี้ไม่สำเร็จ",
        });
        navigator.vibrate?.([120, 80, 120]);

        return;
      }

      setStatus({
        kind: data.alreadyCheckedIn ? "warning" : "success",
        message: data.message,
      });
      navigator.vibrate?.(data.alreadyCheckedIn ? [80, 60, 80] : 150);
      await onDataChanged();
    } catch {
      setStatus({
        kind: "error",
        message: "เชื่อมต่อระบบเช็คชื่อไม่สำเร็จ กรุณาลองใหม่",
      });
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const startReader = async () => {
    if (!supported) return;

    stopReader(false);
    const NdefReader = (window as any).NDEFReader;
    const reader = new NdefReader();
    const controller = new AbortController();

    abortControllerRef.current = controller;
    setIsScanning(true);
    setStatus({
      kind: "info",
      message: "พร้อมอ่านบัตร — ให้นักเรียนแตะบัตรทีละคน",
    });

    reader.addEventListener("readingerror", () => {
      setStatus({
        kind: "error",
        message: "อ่านบัตรไม่สำเร็จ กรุณาตรวจว่าบัตรมีข้อมูล NDEF แบบ Text",
      });
      navigator.vibrate?.([120, 80, 120]);
    });
    reader.addEventListener("reading", (event: any) => {
      const cardData = readCardData(event);

      if (!cardData) {
        setStatus({
          kind: "error",
          message:
            "ไม่พบรหัสนักเรียนในบัตร กรุณาเขียนข้อมูลเป็น 12345 หรือ KKS_STUDENT:12345",
        });

        return;
      }

      void handleCheckin(cardData);
    });

    try {
      await reader.scan({ signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setIsScanning(false);
      setStatus({ kind: "error", message: getNfcErrorMessage(error) });
    }
  };

  if (supported === false) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
        <ShieldAlert className="mx-auto mb-2 text-amber-600" size={34} />
        <p className="font-bold text-amber-900">อุปกรณ์นี้ไม่รองรับ Web NFC</p>
        <p className="mt-1 text-xs leading-relaxed text-amber-700">
          กรุณาเปิดหน้านี้ด้วย Chrome บนโทรศัพท์ Android ผ่าน HTTPS และเปิด NFC
        </p>
      </div>
    );
  }

  const statusClasses = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-green-200 bg-green-50 text-green-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
  }[status.kind];

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col items-center rounded-2xl border border-[#6b857a]/20 bg-[#6b857a]/5 p-5 text-center">
        <div
          className={`mb-3 flex h-20 w-20 items-center justify-center rounded-full ${
            isScanning
              ? "animate-pulse bg-green-100 text-green-700"
              : "bg-white text-[#5d7c6f]"
          }`}
        >
          <Nfc size={42} />
        </div>
        <p className="font-bold text-gray-900">เครื่องอ่านบัตร NFC</p>
        <p className="mt-1 text-xs text-gray-500">
          ไม่ต้องเลือกนักเรียน — ระบบอ่านรหัสจากบัตรโดยตรง
        </p>
        <p className="mt-1 text-[11px] text-gray-400">
          รองรับ 12345 และ KKS_STUDENT:12345
        </p>
        <Button
          className={`mt-4 w-full font-bold ${
            isScanning ? "bg-red-100 text-red-700" : "bg-[#6b857a] text-white"
          }`}
          startContent={isScanning ? <XCircle size={18} /> : <Nfc size={18} />}
          onPress={() => (isScanning ? stopReader() : startReader())}
        >
          {isScanning ? "หยุดอ่านบัตร" : "เริ่มอ่านบัตรเช็คชื่อ"}
        </Button>
      </div>

      <div className={`rounded-xl border px-4 py-3 text-sm ${statusClasses}`}>
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <LoaderCircle className="shrink-0 animate-spin" size={17} />
          ) : status.kind === "success" ? (
            <CheckCircle2 className="shrink-0" size={17} />
          ) : status.kind === "error" ? (
            <XCircle className="shrink-0" size={17} />
          ) : (
            <CreditCard className="shrink-0" size={17} />
          )}
          <span className="font-medium">{status.message}</span>
        </div>
      </div>
    </div>
  );
}
