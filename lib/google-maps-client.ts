"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

export interface GoogleMapPoint {
  latitude: number;
  longitude: number;
}

export interface GoogleDrivingRoute {
  path: GoogleMapPoint[];
  distanceMeters: number;
  durationMillis: number | null;
}

function findAddressComponent(
  results: google.maps.GeocoderResult[],
  types: string[],
) {
  for (const type of types) {
    for (const result of results) {
      const component = result.address_components.find((item) =>
        item.types.includes(type),
      );

      if (component) return component.long_name;
    }
  }

  return "";
}

function findAddressByPrefix(
  results: google.maps.GeocoderResult[],
  prefixes: string[],
) {
  for (const result of results) {
    const component = result.address_components.find((item) =>
      prefixes.some((prefix) => item.long_name.startsWith(prefix)),
    );

    if (component) return component.long_name;
  }

  return "";
}

function addAdministrativePrefix(
  value: string,
  prefix: string,
  acceptedPrefixes: string[],
) {
  if (!value || acceptedPrefixes.some((item) => value.startsWith(item))) {
    return value;
  }

  return `${prefix}${value}`;
}

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

export async function computeGoogleDrivingRoute(
  origin: GoogleMapPoint,
  destination: GoogleMapPoint,
): Promise<GoogleDrivingRoute> {
  configureGoogleMaps();

  const { PolylineQuality, Route, RoutingPreference, TravelMode } =
    await importLibrary("routes");
  const { routes } = await Route.computeRoutes({
    origin: { lat: origin.latitude, lng: origin.longitude },
    destination: {
      lat: destination.latitude,
      lng: destination.longitude,
    },
    travelMode: TravelMode.DRIVING,
    routingPreference: RoutingPreference.TRAFFIC_UNAWARE,
    polylineQuality: PolylineQuality.OVERVIEW,
    fields: ["path", "distanceMeters", "staticDurationMillis"],
    language: "th",
    region: "TH",
  });
  const route = routes?.[0];
  const distanceMeters = route?.distanceMeters;
  const path =
    route?.path?.map((point) => ({
      latitude: point.lat,
      longitude: point.lng,
    })) ?? [];

  if (
    !route ||
    !path.length ||
    distanceMeters == null ||
    !Number.isFinite(distanceMeters)
  ) {
    throw new Error("Google Routes ไม่พบเส้นทางระหว่างตำแหน่งนี้");
  }

  return {
    path,
    distanceMeters,
    durationMillis: route.staticDurationMillis ?? null,
  };
}

export async function reverseGeocodeThaiAdministrativeArea(
  point: GoogleMapPoint,
) {
  configureGoogleMaps();

  const { Geocoder } = await importLibrary("geocoding");
  const { results } = await new Geocoder().geocode({
    location: { lat: point.latitude, lng: point.longitude },
    language: "th",
    region: "TH",
  });

  if (!results.length) return null;

  const subdistrict = addAdministrativePrefix(
    findAddressByPrefix(results, ["ตำบล", "แขวง"]) ||
      findAddressComponent(results, [
        "administrative_area_level_3",
        "sublocality_level_2",
        "sublocality_level_1",
      ]),
    "ตำบล",
    ["ตำบล", "แขวง"],
  );
  const district = addAdministrativePrefix(
    findAddressByPrefix(results, ["อำเภอ", "เขต"]) ||
      findAddressComponent(results, [
        "administrative_area_level_2",
        "sublocality_level_1",
        "locality",
      ]),
    "อำเภอ",
    ["อำเภอ", "เขต"],
  );
  const province = addAdministrativePrefix(
    findAddressByPrefix(results, ["จังหวัด", "กรุงเทพมหานคร"]) ||
      findAddressComponent(results, ["administrative_area_level_1"]),
    "จังหวัด",
    ["จังหวัด", "กรุงเทพมหานคร"],
  );
  const parts = [subdistrict, district, province].filter(
    (part, index, values) => Boolean(part) && values.indexOf(part) === index,
  );

  return parts.length ? parts.join(" · ") : results[0].formatted_address;
}
