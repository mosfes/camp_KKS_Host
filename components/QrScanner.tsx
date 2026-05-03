"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { Button } from "@heroui/button";

interface QrScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  active: boolean;
}

export default function QrScanner({ onScan, onError, active }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [started, setStarted] = useState(false);
  const [zoomCapabilities, setZoomCapabilities] = useState<{
    min: number;
    max: number;
    step: number;
  } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [availableCameras, setAvailableCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const elementId = "qr-scanner-element";

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch (_) {}
      scannerRef.current = null;
      setStarted(false);
      setZoomCapabilities(null);
    }
  };

  const startWithCameraId = async (cameraId: string | { facingMode: string }, html5QrCode: Html5Qrcode, isMounted: boolean) => {
    try {
      await html5QrCode.start(
        cameraId,
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decodedText) => {
          if (isMounted) onScan(decodedText);
        },
        undefined,
      );
      
      if (isMounted) {
        setStarted(true);
        // Check for zoom
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          if (capabilities.zoom) {
            setZoomCapabilities({
              min: capabilities.zoom.min,
              max: capabilities.zoom.max,
              step: capabilities.zoom.step,
            });
            setCurrentZoom(capabilities.zoom.min);
          }
        } catch (e) {
          console.warn("Could not get camera capabilities", e);
        }
      }
    } catch (err: any) {
      console.error("QR scanner start error:", err);
      if (isMounted && onError) {
        onError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง");
      }
    }
  };

  useEffect(() => {
    if (!active) {
      stopScanner();
      return;
    }

    let isMounted = true;

    const initScanner = async () => {
      try {
        await new Promise((res) => setTimeout(res, 300));
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        // Try to get cameras to find the best one
        let cameras = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (e) {
          console.warn("Could not get cameras list", e);
        }

        if (cameras && cameras.length > 0) {
          // Filter for back cameras
          const backCameras = cameras.filter(c => {
            const label = c.label.toLowerCase();
            return label.includes("back") || label.includes("rear") || label.includes("camera 0") || label.includes("camera 1");
          });

          const finalBackCameras = backCameras.length > 0 ? backCameras : cameras;
          setAvailableCameras(finalBackCameras);

          // Heuristic: Pick the one that ISN'T wide/ultra/0.5
          let bestIndex = 0;
          for (let i = 0; i < finalBackCameras.length; i++) {
            const label = finalBackCameras[i].label.toLowerCase();
            if (!label.includes("wide") && !label.includes("ultra") && !label.includes("0.5") && !label.includes("1x")) {
              bestIndex = i;
              break;
            }
          }
          
          setCurrentCameraIndex(bestIndex);
          await startWithCameraId(finalBackCameras[bestIndex].id, html5QrCode, isMounted);
        } else {
          // Fallback to default behavior
          await startWithCameraId({ facingMode: "environment" }, html5QrCode, isMounted);
        }
      } catch (err: any) {
        console.error("QR scanner init error:", err);
        if (isMounted && onError) {
          onError("ไม่สามารถเปิดกล้องได้");
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [active]);

  const switchCamera = async () => {
    if (!scannerRef.current || availableCameras.length <= 1) return;
    
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    
    const html5QrCode = scannerRef.current;
    await stopScanner();
    
    // Re-init and start
    const newScanner = new Html5Qrcode(elementId);
    scannerRef.current = newScanner;
    await startWithCameraId(availableCameras[nextIndex].id, newScanner, true);
  };

  const handleZoomChange = async (value: number) => {
    if (!scannerRef.current || !zoomCapabilities) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ zoom: value }] as any
      });
      setCurrentZoom(value);
    } catch (e) {
      console.error("Failed to apply zoom", e);
    }
  };

  return (
    <div className="relative w-full">
      <div
        className="w-full rounded-2xl overflow-hidden"
        id={elementId}
        style={{ minHeight: 280 }}
      />
      
      {/* Controls Overlay */}
      {started && (
        <div className="absolute bottom-4 left-0 right-0 px-4 z-10 flex flex-col gap-3">
          {/* Zoom Control */}
          {zoomCapabilities && (
            <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3">
              <ZoomOut size={18} className="text-white/70" />
              <input
                type="range"
                min={zoomCapabilities.min}
                max={zoomCapabilities.max}
                step={zoomCapabilities.step}
                value={currentZoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="flex-1 accent-[#5d7c6f] h-1.5 rounded-lg appearance-none cursor-pointer bg-white/20"
              />
              <ZoomIn size={18} className="text-white/70" />
            </div>
          )}

          {/* Camera Switcher (Only show if multiple back cameras) */}
          {availableCameras.length > 1 && (
            <Button
              isIconOnly
              className="self-end bg-black/40 backdrop-blur-md text-white border border-white/20 rounded-full"
              onPress={switchCamera}
            >
              <RefreshCw size={20} />
            </Button>
          )}
        </div>
      )}

      {!started && active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-2xl">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">กำลังเปิดกล้อง...</p>
        </div>
      )}
    </div>
  );
}
