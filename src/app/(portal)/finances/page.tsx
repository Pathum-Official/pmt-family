"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, TrendingUp, TrendingDown, Wallet, Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
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

export default function FinancesPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.cohortId) return;
      try {
        const q = query(
          collection(db, "transactions"),
          where("cohortId", "==", user.cohortId)
        );
        const snapshot = await getDocs(q);
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        list.sort((a, b) => {
          const timeA = new Date(a.date || 0).getTime();
          const timeB = new Date(b.date || 0).getTime();
          return timeB - timeA;
        });

        setTransactions(list);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user?.cohortId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      setTransactions(transactions.filter((t) => t.id !== id));
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/10 rounded-xl">
            <Receipt className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Batch Finances</h1>
            <p className="text-muted-foreground">Transparent fund tracking for {user?.cohortId?.toUpperCase() || 'your cohort'}.</p>
          </div>
        </div>
        
        {user && ['rep', 'treasurer', 'super_admin'].includes(user.role) && (
          <Link href="/admin?tab=finances" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Balance</p>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">Rs. {balance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Income</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-500">Rs. {totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium">Total Expenses</p>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-3xl font-bold text-destructive">Rs. {totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>A detailed list of all approved income and expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4 w-full">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 ml-4" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No transactions found for this cohort.</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/20 text-destructive'}`}>
                      {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold">{tx.title || tx.description}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'}`}>
                      {tx.type === 'income' ? '+' : '-'} Rs. {Number(tx.amount).toLocaleString()}
                    </span>
                    {tx.receiptUrl && <Badge variant="outline" className="hidden sm:inline-flex cursor-pointer hover:bg-muted">Receipt</Badge>}
                    {user && ['rep', 'treasurer', 'super_admin'].includes(user.role) && (
                      <div className="flex gap-1 ml-2 border-l pl-2">
                        <Link href={`/admin?tab=finances&editId=${tx.id}`} className={buttonVariants({ variant: "ghost", size: "icon", className: "h-7 w-7" })}>
                          <Edit className="h-3 w-3" />
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" />}>
                            <Trash2 className="h-3 w-3" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone. This will permanently delete the transaction record.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tx.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
