"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function FeaturedRepsManager() {
  const [reps, setReps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReps = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"), 
        where("role", "in", ["rep", "super_admin"])
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      
      // Sort in memory to avoid needing composite index
      list.sort((a, b) => {
        if (a.isFeaturedOnHome === b.isFeaturedOnHome) return 0;
        return a.isFeaturedOnHome ? -1 : 1;
      });
      
      setReps(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReps();
  }, []);

  const handleToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isFeaturedOnHome: !currentStatus
      });
      toast.success(currentStatus ? "Removed from home page" : "Added to home page");
      setReps(reps.map(r => r.id === userId ? { ...r, isFeaturedOnHome: !currentStatus } : r));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div>Loading reps...</div>;

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="font-semibold text-lg">Featured Representatives</h3>
        <p className="text-muted-foreground text-sm">Select which representatives should be displayed in the Committee section of the public home page.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {reps.map(rep => (
          <div key={rep.id} className={`flex items-center justify-between p-4 border rounded-lg bg-card transition-colors ${rep.isFeaturedOnHome ? 'border-primary shadow-sm' : ''}`}>
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={rep.photoURL} alt={rep.name} />
                <AvatarFallback>{rep.name?.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold">{rep.name}</h4>
                <p className="text-sm text-muted-foreground">{rep.cohortId?.toUpperCase()} • {rep.role === 'super_admin' ? 'Super Admin' : 'Batch Rep'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{rep.isFeaturedOnHome ? 'Featured' : 'Hidden'}</span>
              <Switch 
                checked={!!rep.isFeaturedOnHome} 
                onCheckedChange={() => handleToggle(rep.id, !!rep.isFeaturedOnHome)} 
              />
            </div>
          </div>
        ))}
        {reps.length === 0 && <p className="text-muted-foreground text-sm">No reps found.</p>}
      </div>
    </div>
  );
}
