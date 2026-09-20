"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoLightbox } from "@/components/shared/PhotoLightbox";

export default function MomentsPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchGallery = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        let q;
        if (user.role === 'super_admin') {
           q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        } else {
           q = query(collection(db, "gallery"), where("cohortId", "==", user.cohortId), orderBy("createdAt", "desc"));
        }
        
        const snap = await getDocs(q);
        const list: any[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          // Keep images that are internal, both, or don't have visibility defined (legacy)
          if (data.visibility === 'internal' || data.visibility === 'both' || !data.visibility) {
            list.push({ id: doc.id, ...data });
          }
        });
        setImages(list);
      } catch (error) {
        console.error("Error fetching moments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading moments...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
          <ImageIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moments</h1>
          <p className="text-muted-foreground">Internal gallery of memories for your batch.</p>
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
            <p>No moments have been shared with your batch yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((item, i) => {
            const displayUrl = item.imageUrls?.[0] || item.imageUrl;
            const count = item.imageUrls ? item.imageUrls.length : 1;
            return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: (i % 10) * 0.1 }}
              className="relative group rounded-xl overflow-hidden border bg-background break-inside-avoid cursor-pointer"
              onClick={() => setSelectedIndex(i)}
            >
              <img 
                src={displayUrl} 
                alt={item.title} 
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
                <div className="flex flex-wrap gap-2 mb-2">
                  {item.category && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-md">
                      {item.category}
                    </Badge>
                  )}
                  {user?.role === 'super_admin' && item.cohortId && (
                     <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-md">
                       {item.cohortId.toUpperCase()}
                     </Badge>
                  )}
                  {count > 1 && (
                     <Badge variant="secondary" className="bg-white/20 text-white border-none backdrop-blur-md">
                       {count} Photos
                     </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                {item.caption && <p className="text-sm text-white/80 line-clamp-3">{item.caption}</p>}
              </div>
            </motion.div>
          )})}
        </div>
      )}

      {selectedIndex !== null && images[selectedIndex] && (
        <PhotoLightbox
          images={(images[selectedIndex].imageUrls || (images[selectedIndex].imageUrl ? [images[selectedIndex].imageUrl] : [])).map((url: string) => ({
            id: url,
            imageUrl: url,
            title: images[selectedIndex].title,
            category: images[selectedIndex].category,
            caption: images[selectedIndex].caption,
            cohortId: images[selectedIndex].cohortId
          }))}
          initialIndex={0}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
