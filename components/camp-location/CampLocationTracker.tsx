"use client";

import type { MapPoint } from "./CampLocationMap";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { searchGooglePlaces } from "@/lib/google-maps-client";

const CampLocationMap = dynamic(() => import("./CampLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full animate-pulse items-center justify-center bg-slate-100 text-sm text-slate-400">
      กำลังโหลดแผนที่...
    </div>
  ),
});

interface Destination extends MapPoint {
  name: string;
  address?: string | null;
}

interface LocationUpdate extends MapPoint {
  accuracy?: number | null;
  recorded_at: string;
}

interface StudentLocation {
  studentId: number;
  name: string;
  latest: LocationUpdate | null;
}

interface TrackerData {
  destination: Destination | null;
  sharingEnabled: boolean;
  updateIntervalMinutes: 5 | 10;
  students: StudentLocation[];
  viewerPath: LocationUpdate[];
  permissions: {
    canConfigure: boolean;
    canSubmitStudentLocation: boolean;
  };
  trackingLabel: string;
}

interface PlaceResult extends Destination {
  id: string;
}

interface CampLocationTrackerProps {
  campId: number;
  viewer: "teacher" | "student" | "parent";
}

function thaiDateTime(value?: string | null) {
  if (!value) return "ยังไม่มีข้อมูล";

  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function minutesSince(value: string) {
  return Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60_000),
  );
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => null);

  return body?.error || "เกิดข้อผิดพลาด กรุณาลองใหม่";
}

export default function CampLocationTracker({
  campId,
  viewer,
}: CampLocationTrackerProps) {
  const [data, setData] = useState<TrackerData | null>(null);
  const [draftDestination, setDraftDestination] = useState<Destination | null>(
    null,
  );
  const [sharingEnabled, setSharingEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState<5 | 10>(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const autoStartedRef = useRef(false);
  const publishingRef = useRef(false);

  const fetchLocation = useCallback(
    async ({
      showLoader = false,
      syncSettings = false,
    }: {
      showLoader?: boolean;
      syncSettings?: boolean;
    } = {}) => {
      if (showLoader) setLoading(true);

      try {
        const response = await fetch(`/api/camps/${campId}/location`, {
          cache: "no-store",
        });

        if (!response.ok) throw new Error(await responseError(response));

        const nextData: TrackerData = await response.json();

        setData(nextData);
        setLoadError("");

        // การ poll ข้อมูลล่าสุดต้องไม่เขียนทับค่าที่ครูกำลังแก้แต่ยังไม่ได้บันทึก
        if (syncSettings) {
          setDraftDestination(nextData.destination);
          setSharingEnabled(nextData.sharingEnabled);
          setIntervalMinutes(nextData.updateIntervalMinutes);
        }
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "โหลดตำแหน่งไม่สำเร็จ",
        );
      } finally {
        setLoading(false);
      }
    },
    [campId],
  );

  useEffect(() => {
    void fetchLocation({ showLoader: true, syncSettings: true });
  }, [fetchLocation]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void fetchLocation();
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [fetchLocation]);

  const publishStudentLocation = useCallback(
    async (showSuccess = true) => {
      if (!navigator.geolocation || publishingRef.current) {
        if (!navigator.geolocation) {
          setMessage({ type: "error", text: "เบราว์เซอร์นี้ไม่รองรับ GPS" });
        }

        return;
      }

      publishingRef.current = true;
      setPublishing(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(`/api/camps/${campId}/location`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              }),
            });

            if (!response.ok) throw new Error(await responseError(response));
            if (showSuccess) {
              setMessage({
                type: "success",
                text: "อัปเดตตำแหน่งของนักเรียนแล้ว",
              });
            }
            await fetchLocation();
          } catch (error) {
            setMessage({
              type: "error",
              text:
                error instanceof Error ? error.message : "อัปเดต GPS ไม่สำเร็จ",
            });
          } finally {
            publishingRef.current = false;
            setPublishing(false);
          }
        },
        (error) => {
          const text =
            error.code === error.PERMISSION_DENIED
              ? "กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์"
              : "ไม่สามารถอ่านตำแหน่ง GPS ได้ กรุณาลองใหม่ในพื้นที่สัญญาณชัดเจน";

          setMessage({ type: "error", text });
          publishingRef.current = false;
          setPublishing(false);
        },
        { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
      );
    },
    [campId, fetchLocation],
  );

  useEffect(() => {
    if (
      viewer !== "student" ||
      !data?.sharingEnabled ||
      !data.permissions.canSubmitStudentLocation
    ) {
      autoStartedRef.current = false;

      return;
    }

    if (!autoStartedRef.current) {
      autoStartedRef.current = true;
      void publishStudentLocation(false);
    }

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void publishStudentLocation(false);
      }
    }, data.updateIntervalMinutes * 60_000);

    return () => window.clearInterval(timer);
  }, [
    data?.sharingEnabled,
    data?.updateIntervalMinutes,
    data?.permissions.canSubmitStudentLocation,
    publishStudentLocation,
    viewer,
  ]);

  async function searchPlaces(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed.length < 2) return;

    setSearching(true);
    setPlaces([]);
    setMessage(null);

    try {
      const nextPlaces = await searchGooglePlaces(trimmed);

      setPlaces(nextPlaces);
      if (!nextPlaces.length) {
        setMessage({
          type: "error",
          text: "ไม่พบสถานที่ ลองระบุจังหวัดหรืออำเภอเพิ่ม",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "ค้นหาสถานที่ไม่สำเร็จ",
      });
    } finally {
      setSearching(false);
    }
  }

  async function saveSettings() {
    if (!draftDestination) {
      setMessage({
        type: "error",
        text: "กรุณาค้นหาหรือคลิกแผนที่เพื่อปักหมุดจุดหมาย",
      });

      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/camps/${campId}/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: draftDestination,
          sharingEnabled,
          updateIntervalMinutes: intervalMinutes,
        }),
      });

      if (!response.ok) throw new Error(await responseError(response));
      setMessage({
        type: "success",
        text: "บันทึกจุดหมายและการแชร์ตำแหน่งแล้ว",
      });
      await fetchLocation({ syncSettings: true });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "บันทึกไม่สำเร็จ",
      });
    } finally {
      setSaving(false);
    }
  }

  const studentsOnMap = useMemo(
    () =>
      (data?.students ?? []).flatMap((student) =>
        student.latest
          ? [
              {
                studentId: student.studentId,
                name: student.name,
                latitude: student.latest.latitude,
                longitude: student.latest.longitude,
              },
            ]
          : [],
      ),
    [data?.students],
  );
  const mapPath = useMemo(
    () => (viewer === "teacher" ? [] : (data?.viewerPath ?? [])),
    [data?.viewerPath, viewer],
  );
  const handleMapClick = useCallback((point: MapPoint) => {
    setDraftDestination({
      ...point,
      name: "จุดหมายที่ปักบนแผนที่",
      address: `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`,
    });
    setPlaces([]);
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
      </section>
    );
  }

  if (!data) {
    return (
      <section
        aria-live="polite"
        className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"
      >
        <p className="font-semibold">ไม่สามารถโหลดข้อมูลตำแหน่งค่ายได้</p>
        {loadError && <p className="mt-1 text-xs">{loadError}</p>}
        <button
          className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-red-100"
          type="button"
          onClick={() =>
            void fetchLocation({ showLoader: true, syncSettings: true })
          }
        >
          ลองโหลดอีกครั้ง
        </button>
      </section>
    );
  }

  const mapDestination = data.permissions.canConfigure
    ? draftDestination
    : data.destination;
  const ownLocation = data.students[0] ?? null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-slate-800">
            <Navigation className="text-[#5d7c6f]" size={19} />
            ตำแหน่งนักเรียนระหว่างเดินทาง
          </h3>
          <p className="mt-1 text-xs text-slate-500">{data.trackingLabel}</p>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
            data.sharingEnabled
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${data.sharingEnabled ? "bg-emerald-500" : "bg-slate-400"}`}
          />
          {data.sharingEnabled
            ? "เปิดติดตามเป็นช่วงเวลา"
            : "ปิดการติดตามตำแหน่ง"}
        </div>
      </div>

      {data.permissions.canConfigure && (
        <div className="space-y-3 border-b border-slate-100 bg-slate-50/70 p-4">
          <form className="flex gap-2" onSubmit={searchPlaces}>
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/15"
                placeholder='ค้นหา เช่น "มหาวิทยาลัยขอนแก่น"'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <button
              className="h-11 rounded-xl bg-[#5d7c6f] px-4 text-sm font-semibold text-white disabled:opacity-50"
              disabled={searching || query.trim().length < 2}
              type="submit"
            >
              {searching ? "กำลังค้นหา..." : "ค้นหา"}
            </button>
          </form>

          {places.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="divide-y divide-slate-100">
                {places.map((place) => (
                  <button
                    key={place.id}
                    className="flex w-full gap-3 p-3 text-left transition hover:bg-emerald-50"
                    type="button"
                    onClick={() => {
                      setDraftDestination(place);
                      setPlaces([]);
                      setQuery(place.name);
                    }}
                  >
                    <MapPin
                      className="mt-0.5 shrink-0 text-[#5d7c6f]"
                      size={17}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        {place.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {place.address}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="border-t border-slate-100 px-3 py-2 text-[10px] text-slate-400">
                ผลการค้นหาจาก Google Maps
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            ค้นหาสถานที่หรือคลิกตำแหน่งบนแผนที่เพื่อย้ายหมุดปลายทาง
          </p>
        </div>
      )}

      <div className="h-[320px] w-full bg-slate-100 sm:h-[380px]">
        <CampLocationMap
          destination={mapDestination}
          editable={data.permissions.canConfigure}
          path={mapPath}
          students={studentsOnMap}
          onMapClick={handleMapClick}
        />
      </div>

      <div className="space-y-4 p-4">
        {loadError && (
          <div
            aria-live="polite"
            className="flex items-start justify-between gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
          >
            <span className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0" size={17} />
              อัปเดตข้อมูลล่าสุดไม่สำเร็จ: {loadError}
            </span>
            <button
              className="shrink-0 font-semibold underline underline-offset-2"
              type="button"
              onClick={() => void fetchLocation()}
            >
              ลองใหม่
            </button>
          </div>
        )}

        {mapDestination && (
          <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-3">
            <MapPin className="mt-0.5 shrink-0 text-rose-600" size={18} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-rose-600">จุดหมาย</p>
              <p className="truncate text-sm font-bold text-slate-800">
                {mapDestination.name}
              </p>
              {mapDestination.address && (
                <p className="text-xs text-slate-500">
                  {mapDestination.address}
                </p>
              )}
            </div>
          </div>
        )}

        {viewer === "teacher" ? (
          <div className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Users size={17} /> นักเรียนที่ลงทะเบียน
              </span>
              <span className="text-xs text-slate-500">
                มีพิกัด {studentsOnMap.length}/{data.students.length} คน
              </span>
            </div>
            <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
              {data.students.length ? (
                data.students.map((student) => {
                  const age = student.latest
                    ? minutesSince(student.latest.recorded_at)
                    : null;
                  const stale =
                    age != null && age > data.updateIntervalMinutes * 2;

                  return (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {student.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          รหัส {student.studentId}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {student.latest ? (
                          <>
                            <p
                              className={`text-xs font-semibold ${stale ? "text-amber-600" : "text-emerald-600"}`}
                            >
                              {age === 0
                                ? "ไม่ถึง 1 นาที"
                                : `${age} นาทีที่แล้ว`}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {student.latest.accuracy != null
                                ? `แม่นยำประมาณ ${Math.round(student.latest.accuracy)} ม.`
                                : "รับพิกัดแล้ว"}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">
                            ยังไม่มีตำแหน่ง
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="p-4 text-center text-sm text-slate-400">
                  ยังไม่มีนักเรียนลงทะเบียนค่าย
                </p>
              )}
            </div>
          </div>
        ) : ownLocation?.latest && data.sharingEnabled ? (
          <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-3">
            <Clock3 className="mt-0.5 shrink-0 text-blue-600" size={18} />
            <div>
              <p className="text-xs font-medium text-slate-500">
                ตำแหน่งล่าสุดของ {ownLocation.name}
              </p>
              <p className="text-sm font-bold text-slate-800">
                {thaiDateTime(ownLocation.latest.recorded_at)}
              </p>
              <p className="text-xs text-slate-500">
                {minutesSince(ownLocation.latest.recorded_at) === 0
                  ? "ไม่ถึง 1 นาทีที่แล้ว"
                  : `${minutesSince(ownLocation.latest.recorded_at)} นาทีที่แล้ว`}
                {ownLocation.latest.accuracy != null &&
                  ` · แม่นยำประมาณ ${Math.round(ownLocation.latest.accuracy)} ม.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <ShieldCheck className="shrink-0 text-slate-400" size={18} />
            {data.sharingEnabled
              ? viewer === "parent"
                ? "ยังไม่มีตำแหน่งจากอุปกรณ์ของนักเรียน"
                : "กำลังรอสิทธิ์ GPS หรือยังไม่ได้รับตำแหน่งจากอุปกรณ์นี้"
              : "ครูยังไม่ได้เปิดการติดตามตำแหน่ง นักเรียนจะยังไม่ส่ง GPS"}
          </div>
        )}

        {data.permissions.canConfigure && (
          <div className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="flex items-center gap-3">
              <input
                checked={sharingEnabled}
                className="h-5 w-5 accent-[#5d7c6f]"
                id={`camp-location-sharing-${campId}`}
                type="checkbox"
                onChange={(event) => setSharingEnabled(event.target.checked)}
              />
              <label
                className="cursor-pointer"
                htmlFor={`camp-location-sharing-${campId}`}
              >
                <span className="block text-sm font-semibold text-slate-800">
                  เปิดให้นักเรียนแชร์ตำแหน่ง
                </span>
                <span className="block text-xs text-slate-500">
                  นักเรียนแต่ละคนต้องเปิดหน้าค่ายและอนุญาต GPS
                </span>
              </label>
            </div>
            <label className="text-xs font-medium text-slate-600">
              อัปเดตทุก
              <select
                className="ml-2 h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                value={intervalMinutes}
                onChange={(event) =>
                  setIntervalMinutes(Number(event.target.value) as 5 | 10)
                }
              >
                <option value={5}>5 นาที</option>
                <option value={10}>10 นาที</option>
              </select>
            </label>
          </div>
        )}

        {viewer === "parent" && data.sharingEnabled && (
          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
            ตำแหน่งจะอัปเดตเมื่อหน้าเว็บของนักเรียนเปิดอยู่เท่านั้น
            และอาจล่าช้าตามช่วงเวลาที่ครูกำหนด
          </div>
        )}

        {message && (
          <div
            className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="shrink-0" size={18} />
            ) : (
              <AlertCircle className="shrink-0" size={18} />
            )}
            {message.text}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {viewer === "student" &&
            data.permissions.canSubmitStudentLocation &&
            data.sharingEnabled && (
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#5d7c6f] px-4 text-sm font-semibold text-[#5d7c6f] disabled:opacity-50"
                disabled={publishing}
                type="button"
                onClick={() => void publishStudentLocation(true)}
              >
                <LocateFixed size={17} />
                {publishing ? "กำลังอ่าน GPS..." : "อัปเดตตำแหน่งของฉันตอนนี้"}
              </button>
            )}
          {data.permissions.canConfigure && (
            <button
              className="h-11 rounded-xl bg-[#5d7c6f] px-5 text-sm font-semibold text-white disabled:opacity-50"
              disabled={saving || !draftDestination}
              type="button"
              onClick={() => void saveSettings()}
            >
              {saving ? "กำลังบันทึก..." : "บันทึกจุดหมายและการแชร์"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
