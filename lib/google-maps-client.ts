"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

function configureGoogleMaps() {
  if (configured) return;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า NEXT_PUBLIC_GOOGLE_MAPS_API_KEY สำหรับ Google Maps",
    );
  }

  setOptions({
    key: apiKey,
    v: "weekly",
    language: "th",
    region: "TH",
  });
  configured = true;
}

export async function loadGoogleMapLibraries() {
  configureGoogleMaps();

  const [maps, marker, core] = await Promise.all([
    importLibrary("maps"),
    importLibrary("marker"),
    importLibrary("core"),
  ]);

  return { maps, marker, core };
}

export async function searchGooglePlaces(textQuery: string) {
  configureGoogleMaps();

  const { Place } = await importLibrary("places");
  const { places } = await Place.searchByText({
    textQuery,
    fields: ["id", "displayName", "formattedAddress", "location"],
    language: "th",
    region: "th",
    locationBias: {
      south: 5.5,
      west: 97.3,
      north: 20.5,
      east: 105.7,
    },
    maxResultCount: 5,
  });

  return places.flatMap((place) => {
    if (!place.id || !place.location) return [];

    return [
      {
        id: place.id,
        name: place.displayName || place.formattedAddress || "สถานที่",
        address: place.formattedAddress || "",
        latitude: place.location.lat(),
        longitude: place.location.lng(),
      },
    ];
  });
}
