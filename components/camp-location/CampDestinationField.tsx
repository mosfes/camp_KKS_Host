"use client";

import type { FormEvent } from "react";
import type { MapPoint } from "./CampLocationMap";

import dynamic from "next/dynamic";
import { MapPin, Search } from "lucide-react";
import { useCallback, useState } from "react";

import { searchGooglePlaces } from "@/lib/google-maps-client";

const CampLocationMap = dynamic(() => import("./CampLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      กำลังโหลดแผนที่...
    </div>
  ),
});

export interface CampDestination extends MapPoint {
  name: string;
  address?: string | null;
}

interface PlaceResult extends CampDestination {
  id: string;
}

interface Props {
  destination: CampDestination | null;
  enabled: boolean;
  onDestinationChange: (destination: CampDestination | null) => void;
  onEnabledChange: (enabled: boolean) => void;
}

function searchError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (
    ["quota", "rate limit", "resource_exhausted", "over_query_limit"].some(
      (keyword) => normalized.includes(keyword),
    )
  ) {
    return "ค้นหาถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";
  }

  return message || "ค้นหาสถานที่ไม่สำเร็จ";
}

export default function CampDestinationField({
  destination,
  enabled,
  onDestinationChange,
  onEnabledChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed.length < 2 || searching) return;

    setSearching(true);
    setMessage("");

    try {
      const results = await searchGooglePlaces(trimmed);

      setPlaces(results);
      if (!results.length) {
        setMessage("ไม่พบสถานที่ ลองระบุจังหวัดหรืออำเภอเพิ่ม");
      }
    } catch (error) {
      setPlaces([]);
      setMessage(searchError(error));
    } finally {
      setSearching(false);
    }
  }

  const handleMapClick = useCallback(
    (point: MapPoint) => {
      onDestinationChange({
        ...point,
        name: "จุดที่ปักบนแผนที่",
        address: `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`,
      });
      setPlaces([]);
      setMessage("");
    },
    [onDestinationChange],
  );

  return (
    <div className="md:col-span-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            ติดตามตำแหน่งนักเรียน
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            เปิดใช้งานเพื่อกำหนดหมุดจุดหมายและให้นักเรียนแชร์ GPS ระหว่างเดินทาง
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            checked={enabled}
            className="peer sr-only"
            type="checkbox"
            onChange={(event) => onEnabledChange(event.target.checked)}
          />
          <span className="relative h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[#5d7c6f] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          {enabled ? "เปิดใช้งาน" : "ไม่ใช้งาน"}
        </label>
      </div>

      {enabled && (
        <div className="space-y-3 border-t border-slate-200 p-4">
          <form className="flex gap-2" onSubmit={handleSearch}>
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

          {message && <p className="text-xs text-amber-700">{message}</p>}

          {places.length > 0 && (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {places.map((place) => (
                <button
                  key={place.id}
                  className="flex w-full gap-3 p-3 text-left transition hover:bg-emerald-50"
                  type="button"
                  onClick={() => {
                    onDestinationChange(place);
                    setQuery(place.name);
                    setPlaces([]);
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
          )}

          <p className="text-xs text-slate-500">
            ค้นหาสถานที่หรือคลิกบนแผนที่เพื่อปักหมุดจุดหมาย
          </p>
          <div className="h-72 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <CampLocationMap
              editable
              destination={destination}
              path={[]}
              students={[]}
              onMapClick={handleMapClick}
            />
          </div>

          <div
            className={`rounded-lg border p-3 ${
              destination
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            {destination ? (
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 shrink-0 text-emerald-700"
                  size={17}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {destination.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {destination.address ||
                      `${destination.latitude.toFixed(6)}, ${destination.longitude.toFixed(6)}`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium text-amber-800">
                กรุณาปักหมุดจุดหมายก่อนบันทึกค่าย
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
