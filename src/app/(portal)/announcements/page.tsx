"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Megaphone, Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { AnnouncementCard } from "@/components/shared/AnnouncementCard";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user?.cohortId) return;
      try {
        const q = query(
          collection(db, "announcements"),
          where("cohortId", "==", user.cohortId)
        );
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        list.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });

        setAnnouncements(list);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        toast.error("Failed to fetch announcements");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [user?.cohortId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      setAnnouncements(announcements.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } catch (error) {
      toast.error("Failed to delete announcement");
    }
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'Urgent': return 'destructive';
      case 'Academic': return 'default';
      case 'General': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">Stay updated with the latest news for {user?.cohortId?.toUpperCase() || 'your cohort'}.</p>
          </div>
        </div>
        
        {user && ['rep', 'academic_rep', 'super_admin'].includes(user.role) && (
          <Link href="/admin?tab=announcements" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> New Announcement
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-1/4" />
            </Card>
          ))
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No announcements found for this cohort.</p>
          </div>
        ) : (
          announcements.map((ann, i) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <AnnouncementCard announcement={ann} onDelete={handleDelete} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
