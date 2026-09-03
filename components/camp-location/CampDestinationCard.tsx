import { ExternalLink, MapPinned } from "lucide-react";

export interface VisibleCampDestination {
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface CampDestinationCardProps {
  destination: VisibleCampDestination | null | undefined;
  fallbackName?: string | null;
  className?: string;
}

function hasValidCoordinates(
  destination: VisibleCampDestination | null | undefined,
): destination is VisibleCampDestination & {
  latitude: number;
  longitude: number;
} {
  return Boolean(
    destination &&
      Number.isFinite(destination.latitude) &&
      Number.isFinite(destination.longitude) &&
      destination.latitude! >= -90 &&
      destination.latitude! <= 90 &&
      destination.longitude! >= -180 &&
      destination.longitude! <= 180,
  );
}

export default function CampDestinationCard({
  destination,
  fallbackName,
  className = "",
}: CampDestinationCardProps) {
  if (!hasValidCoordinates(destination)) return null;

  const coordinates = `${destination.latitude.toFixed(6)}, ${destination.longitude.toFixed(6)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`;

  return (
    <section
      aria-label="หมุดสถานที่จัดค่าย"
      className={`rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5d7c6f] text-white shadow-sm">
            <MapPinned size={19} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#5d7c6f]">
              หมุดสถานที่จัดค่าย
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-800">
              {destination.name || fallbackName || "จุดหมายค่าย"}
            </p>
            {destination.address && (
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {destination.address}
              </p>
            )}
            <p className="mt-1 font-mono text-[11px] text-slate-400">
              {coordinates}
            </p>
          </div>
        </div>

        <a
          aria-label={`เปิดหมุด ${destination.name || fallbackName || "สถานที่จัดค่าย"} ใน Google Maps`}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#5d7c6f] px-4 text-xs font-semibold text-white transition hover:bg-[#4c685d] focus:outline-none focus:ring-2 focus:ring-[#5d7c6f]/30"
          href={mapsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          เปิดใน Google Maps
          <ExternalLink size={15} />
        </a>
      </div>
    </section>
  );
}
