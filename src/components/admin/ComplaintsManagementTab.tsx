"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Trash2, Eye, UserX, User } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Complaint = {
  id: string;
  type: string;
  subject: string;
  description?: string;
  message?: string;
  status: 'pending' | 'resolved';
  createdAt: any;
  cohortId: string;
  submittedBy?: string;
  submittedByName?: string;
};

export function ComplaintsManagementTab({ cohortId }: { cohortId: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewedComplaint, setViewedComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const q = query(
          collection(db, "complaints"),
          where("cohortId", "==", cohortId)
        );
        const querySnapshot = await getDocs(q);
        const list: Complaint[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Complaint);
        });
        
        // Sort manually to avoid composite index requirement
        list.sort((a, b) => {
          const dateA = typeof a.createdAt === 'number' ? a.createdAt : a.createdAt?.toDate?.()?.getTime() || 0;
          const dateB = typeof b.createdAt === 'number' ? b.createdAt : b.createdAt?.toDate?.()?.getTime() || 0;
          return dateB - dateA;
        });
        
        setComplaints(list);
      } catch (error) {
        console.error("Error fetching complaints:", error);
        toast.error("Failed to fetch complaints");
      } finally {
        setLoading(false);
      }
    };
    if (cohortId) {
      fetchComplaints();
    }
  }, [cohortId]);

  const handleResolve = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, "complaints", id), { status: 'resolved' });
      setComplaints(complaints.map(c => c.id === id ? { ...c, status: 'resolved' } : c));
      toast.success("Marked as resolved");
      if (viewedComplaint?.id === id) {
        setViewedComplaint({ ...viewedComplaint, status: 'resolved' });
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteDoc(doc(db, "complaints", id));
      setComplaints(complaints.filter(c => c.id !== id));
      toast.success("Feedback deleted");
      if (viewedComplaint?.id === id) {
        setViewedComplaint(null);
      }
    } catch (error) {
      toast.error("Failed to delete feedback");
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "Unknown Date";
    if (typeof ts === 'number') return new Date(ts).toLocaleString();
    if (ts.toDate) return ts.toDate().toLocaleString();
    return "Unknown Date";
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading feedback...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Feedback & Complaints</h2>
          <p className="text-sm text-muted-foreground">Review anonymous submissions from your batch.</p>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No feedback found.</TableCell>
              </TableRow>
            ) : (
              complaints.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewedComplaint(c)}>
                  <TableCell>
                    {c.submittedByName ? (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{c.submittedByName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserX className="h-4 w-4" />
                        <span className="italic">Anonymous</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.type === 'complaint' ? 'destructive' : 'secondary'}>
                      {(c.type || 'feedback').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{c.subject}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={c.message || c.description}>
                    {c.message || c.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'resolved' ? 'outline' : 'default'} className={c.status === 'resolved' ? 'text-emerald-500 border-emerald-500' : ''}>
                      {(c.status || 'pending').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.status !== 'resolved' && (
                        <Button variant="ghost" size="sm" onClick={(e) => handleResolve(c.id, e)}>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger>
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent text-destructive cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this feedback from the server.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={(e) => handleDelete(c.id, e)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!viewedComplaint} onOpenChange={(open) => !open && setViewedComplaint(null)}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Badge variant={viewedComplaint?.type === 'complaint' ? 'destructive' : 'secondary'}>
                {(viewedComplaint?.type || 'feedback').toUpperCase()}
              </Badge>
              {viewedComplaint?.subject}
            </DialogTitle>
            <DialogDescription>
              {formatDate(viewedComplaint?.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Sender</span>
                {viewedComplaint?.submittedByName ? (
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4 text-primary" />
                    {viewedComplaint.submittedByName}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground italic">
                    <UserX className="h-4 w-4" />
                    Anonymous Submission
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Status</span>
                <Badge variant={viewedComplaint?.status === 'resolved' ? 'outline' : 'default'} className={viewedComplaint?.status === 'resolved' ? 'text-emerald-500 border-emerald-500' : ''}>
                  {(viewedComplaint?.status || 'pending').toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold tracking-wide text-foreground">Message Content</h4>
              <div className="p-4 bg-background border rounded-lg whitespace-pre-wrap text-sm leading-relaxed max-h-[300px] overflow-y-auto">
                {viewedComplaint?.message || viewedComplaint?.description || "No message provided."}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-4 border-t">
            {viewedComplaint?.status !== 'resolved' ? (
              <Button onClick={() => viewedComplaint && handleResolve(viewedComplaint.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Resolved
              </Button>
            ) : (
              <div className="text-sm text-emerald-500 flex items-center font-medium">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Resolved
              </div>
            )}
            <Button variant="outline" onClick={() => setViewedComplaint(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
