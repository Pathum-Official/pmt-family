"use client";

import React, { useState, useRef } from 'react';
import { Maximize, Minimize, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function ResourceViewerModal({ 
  isOpen, 
  onClose, 
  url,
  type,
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  url: string;
  type: string;
  title: string; 
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isPdf = type === 'pdf_document' || type === 'past_paper' || type === 'document';
  const isImage = type === 'image_resource';
  const isEmbed = type === 'custom_embed';

  const extractDriveId = (urlStr: string) => {
    try {
      if (!urlStr) return null;
      const match = urlStr.match(/[-\w]{25,}/);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  };

  const driveId = isPdf ? extractDriveId(url) : null;
  const viewerUrl = driveId ? `https://docs.google.com/viewer?url=https://drive.google.com/uc?id=${driveId}&embedded=true` : url;
  const downloadUrl = driveId ? `https://drive.google.com/uc?export=download&id=${driveId}` : url;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="!w-[90vw] !max-w-6xl !h-[85vh] p-0 overflow-hidden flex flex-col bg-card" aria-describedby="resource-viewer-description">
        <div id="resource-viewer-description" className="sr-only">Viewing resource: {title}</div>
        
        {/* Custom Toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30 backdrop-blur-sm z-50 relative shrink-0">
          <div className="font-semibold text-lg truncate pr-4 text-primary">
            {title}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isEmbed && (
              <a 
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 hover:bg-muted rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
            <button 
              onClick={handleFullscreen}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors text-destructive"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div 
          ref={containerRef}
          className="relative w-full bg-[#f8f9fa] dark:bg-zinc-950 flex-1 overflow-hidden flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full"
        >
          {isPdf && (
            <>
              {/* Invisible shield to intercept right-clicks on the pop-out button */}
              <div 
                className="absolute top-0 right-0 w-[60px] h-[60px] z-40 bg-transparent"
                style={{ cursor: 'default' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
              <iframe 
                src={viewerUrl}
                className="w-full h-full border-0"
                title={title}
              />
            </>
          )}

          {isImage && (
            <img src={url} alt={title} className="max-w-full max-h-full object-contain" />
          )}

          {isEmbed && (
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: url }} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
