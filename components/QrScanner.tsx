"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  active: boolean;
}

export default function QrScanner({ onScan, onError, active }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [started, setStarted] = useState(false);
  const elementId = "qr-scanner-element";

  useEffect(() => {
    if (!active) {
      stopScanner();

      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        // Wait for element to be in DOM
        await new Promise((res) => setTimeout(res, 300));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(elementId);

        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (isMounted) onScan(decodedText);
          },
          undefined,
        );
        if (isMounted) setStarted(true);
      } catch (err: any) {
        console.error("QR scanner error:", err);
        if (isMounted && onError) {
          onError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [active]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();

        // state 2 = SCANNING, state 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch (_) {}
      scannerRef.current = null;
      setStarted(false);
    }
  };

  return (
    <div className="relative w-full">
      <div
        className="w-full rounded-2xl overflow-hidden"
        id={elementId}
        style={{ minHeight: 280 }}
      />
      {!started && active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-2xl">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">กำลังเปิดกล้อง...</p>
        </div>
      )}
    </div>
  );
}
