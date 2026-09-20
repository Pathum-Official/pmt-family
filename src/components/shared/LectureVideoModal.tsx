"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
const Plyr = dynamic(() => import("plyr-react").then((mod) => mod.Plyr), { ssr: false });
import "plyr-react/plyr.css";

interface LectureVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  moduleCode?: string;
}

export function LectureVideoModal({ isOpen, onClose, url, title, moduleCode }: LectureVideoModalProps) {
  // Extract video ID from URL
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;

  const plyrSource = videoId ? {
    type: "video" as const,
    sources: [
      {
        src: videoId,
        provider: "youtube" as const,
      }
    ]
  } : null;

  const plyrOptions = {
    settings: ['speed'],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
    controls: ['play-large', 'play', 'progress', 'current-time', 'settings', 'fullscreen'],
    youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1 },
    clickToPlay: true,
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!w-[95vw] !max-w-5xl p-0 overflow-hidden bg-black border-zinc-800">
        <div className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Video player for {title}</DialogDescription>
        </div>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent z-50 flex items-center justify-between pointer-events-none">
          <div>
            {moduleCode && (
              <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider mb-1 block">
                {moduleCode}
              </span>
            )}
            <h2 className="text-white font-medium text-lg lg:text-xl drop-shadow-md">
              {title}
            </h2>
          </div>
        </div>

        {/* Video Player */}
        <div className="w-full bg-black pt-16 pb-8 px-0 sm:px-8 [&_.plyr-react]:w-full [&_.plyr]:w-full [&_.plyr__video-wrapper::after]:content-[''] [&_.plyr__video-wrapper::after]:absolute [&_.plyr__video-wrapper::after]:inset-0 [&_.plyr__video-wrapper::after]:z-10 [&_.plyr__video-wrapper::after]:bg-transparent [&_.plyr__video-wrapper::after]:cursor-pointer">
          {plyrSource ? (
            <Plyr 
              source={plyrSource} 
              options={plyrOptions as any} 
            />
          ) : (
            <div className="text-white text-center p-8">
              <p>Invalid Video URL</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
