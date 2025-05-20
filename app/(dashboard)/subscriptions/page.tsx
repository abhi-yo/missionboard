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
import { MemberRole } from '@/lib/generated/prisma'; // Added for role comparison
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
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Subscriptions</h1>
          <p className="text-muted-foreground">
            View and manage all member subscriptions.
          </p>
        </div>
        <Button onClick={() => setIsAssignModalOpen(true)}>
          <PlusCircle size={18} className="mr-2" />
          Assign Subscription
        </Button>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Subscription Records</CardTitle>
          <CardDescription>A list of all subscriptions in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading subscriptions...</p>}
          {error && <p className="text-destructive">Error: {error}</p>}
          {!isLoading && !error && subscriptions.length === 0 && <p>No subscriptions found.</p>}
          {!isLoading && !error && subscriptions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Current Period</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                        {sub.user?.name || 'N/A'} <br/>
                        <span className="text-xs text-muted-foreground">{sub.user?.email || sub.userId}</span>
                    </TableCell>
                    <TableCell>{sub.plan.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("whitespace-nowrap", subscriptionStatusColors[sub.status])}>
                        {subscriptionStatusLabels[sub.status] || sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: sub.plan.currency }).format(sub.plan.price)} / {sub.plan.interval.toLowerCase()}</TableCell>
                    <TableCell className="whitespace-nowrap">{sub.currentPeriodStart} - {sub.currentPeriodEnd}</TableCell>
                    <TableCell>{sub.createdAt}</TableCell>
                    <TableCell className="text-right">
                        <Link href={`/users/${sub.userId}#subscription`}>
                            <Button variant="outline" size="sm" className="gap-1">
                                <Eye size={14}/> View
                            </Button>
                        </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <AssignSubscriptionModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubscriptionAssigned={() => {
          fetchSubscriptions(); // Refresh list on success
          setIsAssignModalOpen(false); // Ensure modal closes
        }}
      />
    </PageContainer>
  );
} 