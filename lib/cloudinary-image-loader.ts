import type { ImageLoaderProps } from "next/image";

const CLOUDINARY_HOST_PREFIX = "https://res.cloudinary.com/";
const DELIVERY_MARKER = "/image/upload/";
const MAX_DELIVERY_WIDTH = 1600;

// Cloudinary transformation keys this app may embed in stored URLs
// (e.g. "c_fill,g_face,h_400,w_400"). Folder names such as
// "camp_profiles" must not be treated as transformations.
const TRANSFORMATION_KEYS = new Set([
  "a",
  "ar",
  "b",
  "bo",
  "br",
  "c",
  "co",
  "dl",
  "dpr",
  "du",
  "e",
  "f",
  "fl",
  "g",
  "h",
  "q",
  "r",
  "s",
  "so",
  "sp",
  "vs",
  "w",
  "z",
]);

function isTransformationSegment(segment: string): boolean {
  if (!segment) return false;

  return segment.split(",").every((token) => {
    const underscoreIndex = token.indexOf("_");

    if (underscoreIndex <= 0) return false;

    return TRANSFORMATION_KEYS.has(
      token.slice(0, underscoreIndex).toLowerCase(),
    );
  });
}

function buildWidthParam(width: number): string {
  return `w_${Math.max(1, Math.min(Math.round(width), MAX_DELIVERY_WIDTH))}`;
}

/**
 * Serve images straight from Cloudinary with f_auto,q_auto,w_<width>
 * transformations so Vercel's image optimizer (quota-limited on the free
 * plan) is never involved.
 */
export default function cloudinaryImageLoader({
  src,
  width,
}: ImageLoaderProps): string {
  if (!src.startsWith(CLOUDINARY_HOST_PREFIX)) {
    return src;
  }

  const markerIndex = src.indexOf(DELIVERY_MARKER);

  if (markerIndex === -1) {
    return src;
  }

  const head = src.slice(0, markerIndex + DELIVERY_MARKER.length);
  const tail = src.slice(markerIndex + DELIVERY_MARKER.length);
  const [firstSegment, ...restSegments] = tail.split("/");

  if (firstSegment && isTransformationSegment(firstSegment)) {
    // Merge into the existing transformation chain and never fight
    // explicit sizing that was signed at upload time.
    const params = firstSegment.split(",");
    const has = (key: string) =>
      params.some((param) => param.toLowerCase().startsWith(`${key}_`));

    if (!has("f")) params.push("f_auto");
    if (!has("q")) params.push("q_auto");
    if (!has("w")) params.push(buildWidthParam(width));

    return [head + params.join(","), ...restSegments].join("/");
  }

  const widthParam = buildWidthParam(width);

  return `${head}f_auto,q_auto,${widthParam}/${tail}`;
}
