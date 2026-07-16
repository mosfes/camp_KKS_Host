export type VideoSource =
  | {
      kind: "embed";
      provider: "YouTube" | "Vimeo" | "Google Drive";
      embedUrl: string;
      openUrl?: string;
    }
  | { kind: "file"; provider: "MP4"; embedUrl: string };

/**
 * Converts a supported public video URL into a safe URL for an embedded player.
 * The returned URL is always constructed from a recognised provider and never
 * used directly from user input in an iframe.
 */
export function getVideoSource(value: string): VideoSource | null {
  let url: URL;

  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathParts = url.pathname.split("/").filter(Boolean);

  if (host === "youtube.com" || host === "m.youtube.com") {
    const videoId =
      url.searchParams.get("v") ||
      (pathParts[0] === "shorts" || pathParts[0] === "embed"
        ? pathParts[1]
        : null);

    if (videoId && /^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
      return {
        kind: "embed",
        provider: "YouTube",
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  if (
    host === "youtu.be" &&
    pathParts[0] &&
    /^[A-Za-z0-9_-]{6,}$/.test(pathParts[0])
  ) {
    return {
      kind: "embed",
      provider: "YouTube",
      embedUrl: `https://www.youtube.com/embed/${pathParts[0]}`,
    };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const videoId = pathParts.find((part) => /^\d+$/.test(part));

    if (videoId) {
      return {
        kind: "embed",
        provider: "Vimeo",
        embedUrl: `https://player.vimeo.com/video/${videoId}`,
      };
    }
  }

  if (host === "drive.google.com") {
    const fileIndex = pathParts.indexOf("d");
    const fileId =
      (fileIndex >= 0 ? pathParts[fileIndex + 1] : null) ||
      url.searchParams.get("id");

    if (fileId && /^[A-Za-z0-9_-]{10,}$/.test(fileId)) {
      return {
        kind: "embed",
        provider: "Google Drive",
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        openUrl: `https://drive.google.com/file/d/${fileId}/view`,
      };
    }
  }

  if (/\.mp4$/i.test(url.pathname)) {
    return { kind: "file", provider: "MP4", embedUrl: url.toString() };
  }

  return null;
}

export const supportedVideoUrlMessage =
  "รองรับลิงก์ YouTube, Vimeo, Google Drive หรือไฟล์ MP4 ที่เปิดให้ดูได้";
