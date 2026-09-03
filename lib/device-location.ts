import type { BusEventLocation } from "@/lib/bus-event-location";

function geolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "กรุณาอนุญาตให้เว็บไซต์เข้าถึงตำแหน่งก่อนยืนยันขึ้นหรือลงรถ";
  }

  if (error.code === error.TIMEOUT) {
    return "อ่านพิกัดไม่ทันเวลา กรุณาลองใหม่ในบริเวณที่รับสัญญาณ GPS ได้ดี";
  }

  return "ไม่สามารถอ่านพิกัดจากโทรศัพท์ได้ กรุณาตรวจสอบ GPS แล้วลองใหม่";
}

export function getCurrentDeviceLocation(): Promise<BusEventLocation> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("เบราว์เซอร์นี้ไม่รองรับการอ่านพิกัด GPS"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => reject(new Error(geolocationErrorMessage(error))),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}
