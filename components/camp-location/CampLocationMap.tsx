"use client";

import { useEffect, useRef, useState } from "react";

import { loadGoogleMapLibraries } from "@/lib/google-maps-client";

export interface MapPoint {
  latitude: number;
  longitude: number;
}

interface CampLocationMapProps {
  destination: (MapPoint & { name: string; address?: string | null }) | null;
  students: Array<MapPoint & { studentId: number; name: string }>;
  path: MapPoint[];
  editable?: boolean;
  onMapClick?: (point: MapPoint) => void;
}

export default function CampLocationMap({
  destination,
  students,
  path,
  editable = false,
  onMapClick,
}: CampLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const destinationMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const studentMarkersRef = useRef(
    new Map<number, google.maps.marker.AdvancedMarkerElement>(),
  );
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const viewportSignatureRef = useRef("");
  const librariesRef = useRef<
    Awaited<ReturnType<typeof loadGoogleMapLibraries>> | undefined
  >(undefined);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const libraries = await loadGoogleMapLibraries();

        if (cancelled || !containerRef.current) return;

        librariesRef.current = libraries;
        mapRef.current = new libraries.maps.Map(containerRef.current, {
          center: { lat: 15.87, lng: 100.99 },
          zoom: 6,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
        });
        setReady(true);
      } catch (mapError) {
        setError(
          mapError instanceof Error
            ? mapError.message
            : "ไม่สามารถโหลด Google Maps ได้",
        );
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      clickListenerRef.current?.remove();
      if (destinationMarkerRef.current) destinationMarkerRef.current.map = null;
      studentMarkersRef.current.forEach((marker) => {
        marker.map = null;
      });
      studentMarkersRef.current.clear();
      polylineRef.current?.setMap(null);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const libraries = librariesRef.current;

    if (!ready || !map || !libraries) return;

    const pathPositions = path.map((point) => ({
      lat: point.latitude,
      lng: point.longitude,
    }));

    if (!polylineRef.current) {
      polylineRef.current = new libraries.maps.Polyline({
        map,
        path: pathPositions,
        strokeColor: "#2563eb",
        strokeOpacity: 0.85,
        strokeWeight: 5,
      });
    } else {
      polylineRef.current.setPath(pathPositions);
    }

    if (destination) {
      const position = {
        lat: destination.latitude,
        lng: destination.longitude,
      };

      if (!destinationMarkerRef.current) {
        const pin = new libraries.marker.PinElement({
          background: "#00a77b",
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          glyphText: "⌾",
          scale: 1.15,
        });

        destinationMarkerRef.current =
          new libraries.marker.AdvancedMarkerElement({
            map,
            position,
            title: destination.name,
            content: pin,
          });
      } else {
        destinationMarkerRef.current.position = position;
        destinationMarkerRef.current.title = destination.name;
        destinationMarkerRef.current.map = map;
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.map = null;
    }

    const visibleStudentIds = new Set(
      students.map(({ studentId }) => studentId),
    );

    studentMarkersRef.current.forEach((marker, studentId) => {
      if (!visibleStudentIds.has(studentId)) {
        marker.map = null;
        studentMarkersRef.current.delete(studentId);
      }
    });

    students.forEach((student) => {
      const position = {
        lat: student.latitude,
        lng: student.longitude,
      };
      const existingMarker = studentMarkersRef.current.get(student.studentId);

      if (!existingMarker) {
        const pin = new libraries.marker.PinElement({
          background: "#2563eb",
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          glyphText: student.name.trim().charAt(0) || "●",
          scale: 1.05,
        });

        const marker = new libraries.marker.AdvancedMarkerElement({
          map,
          position,
          title: student.name,
          content: pin,
        });

        studentMarkersRef.current.set(student.studentId, marker);
      } else {
        existingMarker.position = position;
        existingMarker.title = student.name;
        existingMarker.map = map;
      }
    });

    const visiblePoints = [
      ...pathPositions,
      ...students.map((student) => ({
        lat: student.latitude,
        lng: student.longitude,
      })),
      ...(destination
        ? [{ lat: destination.latitude, lng: destination.longitude }]
        : []),
    ];
    const viewportSignature = visiblePoints
      .map(({ lat, lng }) => `${lat.toFixed(6)},${lng.toFixed(6)}`)
      .join("|");

    // รักษามุมมองที่ผู้ใช้เลื่อนหรือซูมไว้ เมื่อเป็นเพียงการ render/poll
    // ข้อมูลเดิม และจัดกรอบใหม่เฉพาะเมื่อพิกัดบนแผนที่เปลี่ยนจริง
    if (viewportSignature !== viewportSignatureRef.current) {
      viewportSignatureRef.current = viewportSignature;

      if (visiblePoints.length === 1) {
        map.setCenter(visiblePoints[0]);
        map.setZoom(15);
      } else if (visiblePoints.length > 1) {
        const bounds = new libraries.core.LatLngBounds();

        visiblePoints.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, 32);
      }
    }
  }, [destination, path, ready, students]);

  useEffect(() => {
    const map = mapRef.current;

    clickListenerRef.current?.remove();
    clickListenerRef.current = null;

    if (!ready || !map || !editable || !onMapClick) return;

    clickListenerRef.current = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;

        onMapClick({
          latitude: event.latLng.lat(),
          longitude: event.latLng.lng(),
        });
      },
    );

    return () => {
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
    };
  }, [editable, onMapClick, ready]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 text-sm text-slate-400">
          กำลังโหลด Google Maps...
        </div>
      )}
      <div
        ref={containerRef}
        className={`h-full w-full ${editable ? "cursor-crosshair" : ""}`}
      />
    </div>
  );
}
