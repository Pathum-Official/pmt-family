"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Edit } from "lucide-react";
import Link from "next/link";
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

export function ResourcesTable({ cohortId }: { cohortId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const q = query(
          collection(db, "resources"),
          where("cohortId", "==", cohortId)
        );
        const querySnapshot = await getDocs(q);
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        // Also fetch lectures for a unified table
        const lecQ = query(
          collection(db, "lectures"),
          where("cohortId", "==", cohortId)
        );
        const lecSnapshot = await getDocs(lecQ);
        lecSnapshot.forEach((doc) => {
          list.push({ id: doc.id, type: "lecture", ...doc.data() });
        });
        
        // Sort combined list by date
        list.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
          return timeB - timeA;
        });
        
        setItems(list);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };
    if (cohortId) {
      fetchItems();
    }
  }, [cohortId]);

  const handleDelete = async (id: string, isLecture: boolean) => {
    try {
      const collectionName = isLecture ? "lectures" : "resources";
      await deleteDoc(doc(db, collectionName, id));
      setItems(items.filter(i => i.id !== id));
      toast.success("Item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  if (loading) return <div className="py-4 text-center text-muted-foreground text-sm">Loading resources...</div>;

  return (
    <div className="mt-8 border rounded-md overflow-hidden bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Module</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No resources found.</TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant={item.type === 'zoom_meeting' ? 'destructive' : item.type === 'youtube_video' || item.type === 'lecture' ? 'default' : 'secondary'}>
                    {item.type === 'zoom_meeting' ? 'Zoom' : item.type === 'youtube_video' || item.type === 'lecture' ? 'YouTube' : item.type === 'image_resource' ? 'Image' : item.type === 'custom_embed' ? 'HTML' : 'PDF'}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">{item.title}</TableCell>
                <TableCell>{item.moduleCode || item.module}</TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2">
                  <Link href={`/admin?tab=resources&editId=${item.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    <Edit className="h-4 w-4" />
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive" />}>
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this {item.type === 'lecture' ? 'lecture' : 'resource'}.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id, item.type === 'lecture')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
