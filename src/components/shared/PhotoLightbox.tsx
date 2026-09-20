"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GalleryImage {
  id: string;
  imageUrl: string;
  title?: string;
  category?: string;
  caption?: string;
  cohortId?: string;
}

interface PhotoLightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export function PhotoLightbox({ images, initialIndex, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious, onClose]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        handleNext();
      }, 4000); // 4 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying, handleNext]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentImage = images[currentIndex];

  if (!currentImage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      >
        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-0"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-0 hidden sm:flex"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/10 hover:bg-white/20 text-white border-0"
            onClick={onClose}
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Left Navigation */}
        <button
          onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
          className="absolute left-4 z-50 p-3 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/80 transition-all opacity-0 md:opacity-100 animate-in fade-in group"
        >
          <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Right Navigation */}
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 z-50 p-3 rounded-full bg-black/40 text-white/70 hover:text-white hover:bg-black/80 transition-all opacity-0 md:opacity-100 animate-in fade-in group"
        >
          <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Main Image Container */}
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-12" onClick={onClose}>
          <motion.img
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            src={currentImage.imageUrl}
            alt={currentImage.title || "Gallery image"}
            className="max-h-[85vh] md:max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            loading="eager"
          />

          {/* Details Bar */}
          <div className="absolute bottom-24 md:bottom-32 left-0 right-0 px-4 flex justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/60 backdrop-blur-md rounded-2xl p-4 max-w-3xl w-full text-center border border-white/10 pointer-events-auto"
            >
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                {currentImage.category && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    {currentImage.category}
                  </Badge>
                )}
                {currentImage.cohortId && (
                  <Badge variant="secondary" className="bg-white/10 text-white/70 border-none">
                    {currentImage.cohortId.toUpperCase()}
                  </Badge>
                )}
              </div>
              {currentImage.title && (
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{currentImage.title}</h3>
              )}
              {currentImage.caption && (
                <p className="text-white/80 text-sm md:text-base">{currentImage.caption}</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-4 w-full px-4">
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 hide-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 rounded-md overflow-hidden transition-all duration-300 ${
                    idx === currentIndex 
                      ? 'w-16 h-12 ring-2 ring-white scale-110 shadow-lg' 
                      : 'w-12 h-8 opacity-50 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  {idx === currentIndex && (
                    <div className="absolute inset-0 bg-white/20" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
