"use client";
/* eslint-disable jsx-a11y/media-has-caption -- submitted MP4 URLs do not provide a caption track to attach */

import { getVideoSource } from "@/lib/video";

interface VideoPlayerProps {
  url: string;
  title?: string;
}

export default function VideoPlayer({
  url,
  title = "วิดีโอที่ส่ง",
}: VideoPlayerProps) {
  const source = getVideoSource(url);

  if (!source) return null;

  if (source.kind === "file") {
    return (
      <video
        controls
        className="w-full rounded-xl bg-black"
        preload="metadata"
        src={source.embedUrl}
      />
    );
  }

  return (
    <iframe
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      className="aspect-video w-full rounded-xl border-0 bg-black"
      referrerPolicy="strict-origin-when-cross-origin"
      src={source.embedUrl}
      title={title}
    />
  );
}
