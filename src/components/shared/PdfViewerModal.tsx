"use client";

import React, { useState, useRef } from 'react';
import { Maximize, Minimize, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export function PdfViewerModal({ 
  isOpen, 
  onClose, 
  fileId, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  fileId: string; 
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

  // Google Docs Viewer URL
  const viewerUrl = `https://docs.google.com/viewer?url=https://drive.google.com/uc?id=${fileId}&embedded=true`;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[90vw] p-0 overflow-hidden flex flex-col bg-card" aria-describedby="pdf-viewer-description">
        <div id="pdf-viewer-description" className="sr-only">Viewing PDF document: {title}</div>
        
        {/* Custom Toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30 backdrop-blur-sm z-50 relative shrink-0">
          <div className="font-semibold text-lg truncate pr-4 text-primary">
            {title}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={downloadUrl}
              className="p-2 hover:bg-muted rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>
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
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div ref={containerRef} className="relative w-full h-[80vh] bg-muted/10 overflow-hidden">
          {/* 
            Transparent Shield Overlay 
            Placed exactly over the top-right corner where Google Docs puts its "Pop-out" button
            to prevent students from escaping the viewer
          */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-transparent z-40 cursor-not-allowed" title="External opening restricted" />
          
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0"
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
