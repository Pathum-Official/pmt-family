"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";

export function PortalGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (user.status === 'pending') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <ShieldAlert className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Account Pending Approval</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Your registration is complete, but your account is currently under review by an administrator. 
          Please check back later or contact your batch representative if this takes too long.
        </p>
        <Button variant="outline" onClick={() => auth.signOut()}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    );
  }

  if (user.status === 'rejected') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-destructive/10 p-6 rounded-full mb-6">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Account Rejected</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Your account request has been rejected by an administrator.
        </p>
        <Button variant="outline" onClick={() => auth.signOut()}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
