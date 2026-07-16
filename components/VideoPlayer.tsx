"use client";
/* eslint-disable jsx-a11y/media-has-caption -- submitted MP4 URLs do not provide a caption track to attach */

import { ExternalLink, HardDrive } from "lucide-react";

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
        className="aspect-video w-full rounded-xl bg-black object-contain"
        preload="metadata"
        src={source.embedUrl}
      />
    );
  }

  const embeddedPlayer = (
    <div className="relative isolate aspect-video w-full overflow-hidden rounded-xl bg-black [contain:paint]">
      <iframe
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
        className="absolute inset-0 block h-full w-full border-0 bg-black"
        referrerPolicy="strict-origin-when-cross-origin"
        src={source.embedUrl}
        title={title}
      />
    </div>
  );

  if (source.provider === "Google Drive" && source.openUrl) {
    return (
      <>
        <div className="md:hidden">
          <a
            className="flex min-h-32 w-full flex-col items-center justify-center gap-3 rounded-xl border border-[#5d7c6f]/20 bg-white px-5 py-6 text-center text-[#5d7c6f] transition-colors active:bg-[#5d7c6f]/10"
            href={source.openUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <HardDrive aria-hidden="true" size={32} />
            <span>
              <span className="block text-sm font-semibold">
                เปิดวิดีโอ Google Drive
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                วิดีโอจะเปิดในหน้าต่างใหม่เพื่อให้เล่นได้ถูกต้องบนมือถือ
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold">
              แตะเพื่อเปิด
              <ExternalLink aria-hidden="true" size={14} />
            </span>
          </a>
        </div>
        <div className="hidden md:block">{embeddedPlayer}</div>
      </>
    );
  }

  return embeddedPlayer;
}
