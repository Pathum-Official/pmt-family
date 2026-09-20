import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoThumbnailCardProps {
  url: string;
  title: string;
  moduleCode?: string;
  onClick: () => void;
  actionComponent?: React.ReactNode;
  description?: string;
}

export function VideoThumbnailCard({ url, title, moduleCode, description, onClick, actionComponent }: VideoThumbnailCardProps) {
  // Extract video ID from URL
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;

  const thumbnailUrl = videoId 
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : '/placeholder-thumbnail.jpg';

  return (
    <div 
      className="group cursor-pointer flex flex-col h-full rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative aspect-video w-full bg-black overflow-hidden">
        {/* Thumbnail Image */}
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <Play className="h-8 w-8 ml-1" fill="currentColor" />
          </motion.div>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          {moduleCode && (
            <div className="text-xs font-semibold text-primary">
              {moduleCode}
            </div>
          )}
          {actionComponent && (
            <div className="flex gap-0 -mt-1 -mr-2" onClick={(e) => e.stopPropagation()}>
              {actionComponent}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
