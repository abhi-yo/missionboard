"use client";

import { useState, useEffect, useMemo } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, CreditCard, Download, Plus, Search, X, Building, DollarSign, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { RecordPaymentModal } from "@/components/dashboard/payments/record-payment-modal";
import { PaymentStatus, PaymentMethod } from "@/lib/generated/prisma";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description?: string;
  initiatedById?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
  initiatedBy?: {
    id: string;
    name?: string;
    email?: string;
  };
  subscription?: {
    id: string;
    plan: {
      name: string;
    };
  };
  member?: {
    id: string;
    name: string;
    email?: string;
  };
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [avgPayment, setAvgPayment] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Fetch payments
  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data: Payment[] = await response.json();
      console.log("Payments data:", data);
      setPayments(data);
      
      // Calculate stats
      const completed = data.filter(p => p.status === PaymentStatus.COMPLETED);
      const pending = data.filter(p => p.status === PaymentStatus.PENDING);
      
      // Total revenue is sum of completed payments
      const revenue = completed.reduce((sum, p) => sum + Number(p.amount), 0);
      setTotalRevenue(revenue);
      
      // Outstanding is sum of pending payments
      const outstandingAmount = pending.reduce((sum, p) => sum + Number(p.amount), 0);
      setOutstanding(outstandingAmount);
      setPendingCount(pending.length);
      
      // Average payment
      setAvgPayment(completed.length > 0 ? revenue / completed.length : 0);
      
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch payments', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPayments();
  }, []);
  
  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    
    const term = searchTerm.toLowerCase();
    return payments.filter(payment => 
      payment.initiatedBy?.name?.toLowerCase().includes(term) || 
      payment.member?.name?.toLowerCase().includes(term) ||
      payment.subscription?.plan.name.toLowerCase().includes(term) ||
      payment.description?.toLowerCase().includes(term) ||
      payment.amount.toString().includes(term)
    );
  }, [payments, searchTerm]);
  
  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return (
          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20">
            <Check size={12} className="mr-1" /> Completed
          </Badge>
        );
      case PaymentStatus.PENDING:
        return (
          <Badge variant="outline" className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/20">
            Pending
          </Badge>
        );
      case PaymentStatus.FAILED:
        return (
          <Badge variant="outline" className="bg-rose-500/20 text-rose-500 hover:bg-rose-500/20">
            <X size={12} className="mr-1" /> Failed
          </Badge>
        );
      default:
        return null;
    }
  };
  
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        return <CreditCard size={14} className="mr-1" />;
      case PaymentMethod.BANK_TRANSFER:
        return <Building size={14} className="mr-1" />;
      case PaymentMethod.CASH:
        return <DollarSign size={14} className="mr-1" />;
      default:
        return null;
    }
  };
  
  const formatPaymentMethod = (method: PaymentMethod): string => {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        return 'Credit Card';
      case PaymentMethod.BANK_TRANSFER:
        return 'Bank Transfer';
      case PaymentMethod.CASH:
        return 'Cash';
      case PaymentMethod.OTHER:
        return 'Other';
      default:
        return String(method);
    }
  };
  
  // Function to view payment details
  const viewDetails = (paymentId: string) => {
    toast.info(`Viewing details for payment ${paymentId}`);
    // This would navigate to a payment details page or open a modal
  };
  
  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <Button 
          className="gap-2 bg-[#AD49E1] hover:bg-[#AD49E1]/90"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={16} />
          Record Payment
        </Button>
      </div>
      
      <Card className="border-border/40 bg-card/40 backdrop-blur-md mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Payment Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary/5 rounded-md p-4">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <h3 className="text-2xl font-bold">${totalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-emerald-500 flex items-center mt-1">
                <Check size={12} className="mr-1" /> 
                All payments up to date
              </p>
            </div>
            <div className="bg-primary/5 rounded-md p-4">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <h3 className="text-2xl font-bold">${outstanding.toFixed(2)}</h3>
              <p className="text-xs text-amber-500 flex items-center mt-1">
                {pendingCount} pending payment{pendingCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-primary/5 rounded-md p-4">
              <p className="text-sm text-muted-foreground">Avg. Payment</p>
              <h3 className="text-2xl font-bold">${avgPayment.toFixed(2)}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Per member
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TabsContent value="all">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading payments...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-destructive">
                        Error: {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No payments found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-accent/30">
                        <TableCell className="font-medium">
                          {payment.member?.name || 'No Member'}
                        </TableCell>
                        <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(payment.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              payment.status === PaymentStatus.COMPLETED ? "default" : 
                              payment.status === PaymentStatus.PENDING ? "outline" : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex items-center">
                          {getPaymentMethodIcon(payment.method)}
                          <span className="capitalize">{formatPaymentMethod(payment.method)}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {payment.description || 
                          (payment.subscription 
                            ? `Payment for ${payment.subscription.plan.name} subscription` 
                            : 'No description')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => viewDetails(payment.id)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardContent className="py-6 px-4 text-center">
              <p className="text-muted-foreground">
                Switch to the &quot;All Payments&quot; tab and filter by status to see pending payments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardContent className="py-6 px-4 text-center">
              <p className="text-muted-foreground">
                Switch to the &quot;All Payments&quot; tab and filter by status to see completed payments.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <RecordPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPaymentRecorded={fetchPayments}
      />
    </PageContainer>
  );
}