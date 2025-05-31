'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Added for role check
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, PlusCircle } from 'lucide-react'; // Added PlusCircle for new button
import { Subscription } from '@/types'; // Use our frontend Subscription type
import { toast } from 'sonner';
import { subscriptionStatusLabels, subscriptionStatusColors } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { AssignSubscriptionModal } from '@/components/dashboard/subscriptions/assign-subscription-modal'; // Path to be created

function formatDisplayDate(dateString: string | null | undefined) {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'PPP'); // e.g., Jun 21, 2023
}

export default function SubscriptionsPage() {
  const { data: session } = useSession(); // Get session
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false); // State for modal

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/manage/subscriptions', { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch subscriptions' }));
        throw new Error(errorData.message || 'Failed to fetch subscriptions');
      }
      const data: Subscription[] = await response.json();
      // Our /api/subscriptions already includes user and plan with formatted price/dates if done there
      // Assuming data is already in correct client-side format from the API for dates (as per type/index.ts)
      // and plan.price is number
      setSubscriptions(data.map(sub => ({
        ...sub,
        user: sub.user,
        plan: {
          ...sub.plan,
          price: Number(sub.plan.price) // Ensure price is number
        },
        // Ensure dates from API are handled if they are not already strings from the API
        startDate: formatDisplayDate(sub.startDate),
        currentPeriodStart: formatDisplayDate(sub.currentPeriodStart),
        currentPeriodEnd: formatDisplayDate(sub.currentPeriodEnd),
        createdAt: formatDisplayDate(sub.createdAt),
        updatedAt: formatDisplayDate(sub.updatedAt),
        canceledAt: sub.canceledAt ? formatDisplayDate(sub.canceledAt) : null,
        trialStartDate: sub.trialStartDate ? formatDisplayDate(sub.trialStartDate) : null,
        trialEndDate: sub.trialEndDate ? formatDisplayDate(sub.trialEndDate) : null,
      })));
    } catch (err: any) {
      setError(err.message);
      toast.error('Error fetching subscriptions', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  return (
    <PageContainer className="space-y-6">
      <div className="flex flex-col space-y-1.5 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and manage all member subscriptions.
          </p>
        </div>
        <Button 
          onClick={() => setIsAssignModalOpen(true)} 
          className="mt-3 sm:mt-0 bg-[#9D43CC] hover:bg-[#9D43CC]/90 gap-2 w-full sm:w-auto"
        >
          <PlusCircle size={16} />
          Assign Subscription
        </Button>
      </div>

      <Card className="border border-border/30 bg-card/30 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Subscription Records</CardTitle>
          <CardDescription>A list of all subscriptions in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading subscriptions...</div>
            </div>
          )}
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 my-2">
              <p>Error: {error}</p>
            </div>
          )}
          
          {!isLoading && !error && subscriptions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-muted-foreground mb-2">No subscriptions found.</p>
              <p className="text-sm text-muted-foreground">Get started by assigning a subscription to a member.</p>
            </div>
          )}
          
          {!isLoading && !error && subscriptions.length > 0 && (
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-background/40">
                    <TableHead>Member</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Current Period</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-background/40">
                      <TableCell>
                        <div className="font-medium">{sub.user?.name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {sub.user?.email || sub.userId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{sub.plan.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn("whitespace-nowrap", subscriptionStatusColors[sub.status])}
                        >
                          {subscriptionStatusLabels[sub.status] || sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: sub.plan.currency }).format(sub.plan.price)}</span>
                          <span className="text-xs text-muted-foreground capitalize">per {sub.plan.interval.toLowerCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col text-sm">
                          <div>From: {sub.currentPeriodStart}</div>
                          <div>To: {sub.currentPeriodEnd}</div>
                        </div>
                      </TableCell>
                      <TableCell>{sub.createdAt}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/users/${sub.userId}#subscription`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 hover:bg-[#9D43CC]/10 hover:text-[#9D43CC] hover:border-[#9D43CC]/20"
                          >
                            <Eye size={14}/> 
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AssignSubscriptionModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubscriptionAssigned={() => {
          fetchSubscriptions();
          setIsAssignModalOpen(false);
        }}
      />
    </PageContainer>
  );
} 