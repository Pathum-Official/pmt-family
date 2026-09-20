"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileText, Search, Download, ExternalLink, Plus, Edit, Trash2, Image as ImageIcon, Code } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { ResourceViewerModal } from "@/components/shared/ResourceViewerModal";
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

export default function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Lecture Notes");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedResource, setSelectedResource] = useState<{ url: string, title: string, type: string } | null>(null);

  // Helper to extract Google Drive file ID from URL
  const extractDriveId = (url: string) => {
    try {
      if (!url) return null;
      const match = url.match(/[-\w]{25,}/);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchResources = async () => {
      if (!user?.cohortId) return;
      try {
        const q = query(
          collection(db, "resources"),
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

        setResources(list);
      } catch (error) {
        console.error("Error fetching resources:", error);
        toast.error("Failed to fetch resources");
      } finally {
        setLoading(false);
      }
    };
    
    const fetchModules = async () => {
      try {
        const q = query(collection(db, "modules"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a: any, b: any) => (a.code || "").localeCompare(b.code || ""));
        setModules(list);
      } catch (e) {
        console.error("Error fetching modules", e);
      }
    };

    fetchResources();
    fetchModules();
  }, [user?.cohortId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "resources", id));
      setResources(resources.filter((r) => r.id !== id));
      toast.success("Resource deleted");
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  const filteredResources = resources.filter(res => {
    const isPastPaperTab = activeTab === "Past Papers";
    const resType = res.type || "pdf_document";
    const resCategory = res.category || "Lecture Notes";

    if (isPastPaperTab) {
      if (resType !== "past_paper" && resCategory !== "Past Papers") return false;
    } else {
      // General tabs (Lecture Notes, Assignments, Reference)
      if (resType === "past_paper" || resCategory === "Past Papers") return false;
      if (resCategory !== activeTab && activeTab !== "Lecture Notes") return false; 
      // Default legacy notes go to Lecture Notes
      if (activeTab === "Lecture Notes" && resCategory !== "Lecture Notes" && resCategory !== "notes") return false;
    }

    if (subjectFilter !== "ALL" && (res.moduleCode !== subjectFilter && res.module !== subjectFilter)) {
      return false;
    }

    if (typeFilter !== "ALL" && resType !== typeFilter) {
      return false;
    }

    const matchesSearch = (res.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (res.moduleCode || res.module || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group by moduleCode
  const groupedResources = filteredResources.reduce((acc, res) => {
    const mod = res.moduleCode || res.module || "Uncategorized";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(res);
    return acc;
  }, {} as Record<string, typeof resources>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resource Library</h1>
            <p className="text-muted-foreground">Access your cohort's academic materials.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:w-auto">
          <div className="flex gap-2">
            <select 
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Subjects</option>
              {modules.map(m => (
                <option key={m.id} value={m.code}>{m.code}</option>
              ))}
            </select>
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="flex h-10 w-full sm:w-36 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="ALL">All Types</option>
              <option value="pdf_document">PDF</option>
              <option value="image_resource">Image</option>
              <option value="custom_embed">HTML Embed</option>
            </select>
          </div>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground mt-0.5" />
            <Input 
              placeholder="Search title..." 
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {user && ['rep', 'academic_rep', 'super_admin'].includes(user.role) && (
            <Link href="/admin?tab=resources" className={buttonVariants()}>
              <Plus className="mr-2 h-4 w-4" /> Upload Resource
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="Lecture Notes" onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="mb-4">
            <TabsTrigger value="Lecture Notes">Lecture Notes</TabsTrigger>
            <TabsTrigger value="Past Papers">Past Papers</TabsTrigger>
            <TabsTrigger value="Assignments">Assignments</TabsTrigger>
            <TabsTrigger value="Reference">Reference</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab}>
          <div className="space-y-10">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-5 h-[200px] flex flex-col justify-between">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-1/2" />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : Object.keys(groupedResources).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-card rounded-xl border border-dashed">
                No resources found matching your criteria.
              </div>
            ) : (
          (Object.entries(groupedResources) as [string, any[]][]).map(([moduleName, moduleResources], groupIdx) => (
                <div key={moduleName} className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <div className="h-8 w-1 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-bold tracking-tight text-primary">{moduleName}</h2>
                    <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{moduleResources.length} items</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {moduleResources.map((res: any, i: number) => (
                      <motion.div
                        key={res.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: (groupIdx * 0.1) + (i * 0.05) }}
                      >
                        <Card 
                          className="hover:border-primary/50 hover:shadow-md transition-all h-full flex flex-col group overflow-hidden cursor-pointer"
                          onClick={() => {
                            setSelectedResource({
                              url: res.url || res.driveViewUrl || "",
                              title: res.title,
                              type: res.type || "pdf_document"
                            });
                          }}
                        >
                          <div className="h-36 bg-muted/30 flex items-center justify-center relative group-hover:bg-primary/5 transition-colors">
                             {res.type === 'image_resource' ? (
                               <ImageIcon className="w-14 h-14 text-blue-500/70 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300" />
                             ) : res.type === 'custom_embed' ? (
                               <Code className="w-14 h-14 text-orange-500/70 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300" />
                             ) : (
                               <FileText className="w-14 h-14 text-red-500/70 group-hover:text-red-600 group-hover:scale-110 transition-all duration-300" />
                             )}
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[1px]">
                               <ExternalLink className="w-8 h-8 text-white drop-shadow-lg" />
                             </div>
                          </div>

                          <CardContent className="p-4 flex flex-col flex-1 border-t">
                            <h3 className="font-semibold text-[15px] mb-2 leading-snug line-clamp-2">{res.title}</h3>
                            {res.description && (
                              <p className="text-[13px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed flex-1">
                                {res.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                {res.type === 'image_resource' ? 'Image' : res.type === 'custom_embed' ? 'HTML Embed' : 'PDF Document'}
                              </div>
                              <div className="flex items-center gap-1">
                                {(res.type !== 'custom_embed' && res.type !== 'image_resource') && (
                                  <a 
                                    href={extractDriveId(res.driveViewUrl || res.url) ? `https://drive.google.com/uc?export=download&id=${extractDriveId(res.driveViewUrl || res.url)}` : (res.url || "#")}
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                    title="Download File"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                )}
                                {user && ['rep', 'academic_rep', 'super_admin'].includes(user.role) && (
                                  <>
                                    <Link href={`/admin?tab=resources&editId=${res.id}`} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors">
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                    <AlertDialog>
                                      <AlertDialogTrigger render={<button className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" />}>
                                        <Trash2 className="h-4 w-4" />
                                      </AlertDialogTrigger>
                                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
                                          <AlertDialogDescription>This action cannot be undone. This will permanently delete the resource reference.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(res.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {selectedResource && (
        <ResourceViewerModal 
          isOpen={!!selectedResource} 
          onClose={() => setSelectedResource(null)} 
          url={selectedResource.url} 
          type={selectedResource.type}
          title={selectedResource.title} 
        />
      )}
    </div>
  );
}
