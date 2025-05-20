'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { MembershipPlan, BillingInterval } from '@/lib/generated/prisma'; // Assuming types are here
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PlanWithTypedPrice extends Omit<MembershipPlan, 'price'> {
  price: number; // Ensure price is treated as a number on the client
}

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export default function PlansPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<PlanWithTypedPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlanWithTypedPrice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubscribingPlanId, setIsSubscribingPlanId] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/plans`, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch plans' }));
        throw new Error(errorData.message || 'Failed to fetch plans');
      }
      const data: MembershipPlan[] = await response.json();
      // Prisma Decimal can be string or number, ensure it's number for client-side calcs/display
      const typedPlans = data.map(plan => ({ ...plan, price: Number(plan.price) }));
      setPlans(typedPlans);
    } catch (err: any) {
      setError(err.message);
      toast.error('Error fetching plans', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/plans/${planToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Server returned an error.' }));
        throw new Error(errorData.message || 'Failed to delete plan.');
      }
      
      toast.success(`Plan "${planToDelete.name}" deleted successfully.`);
      setPlans(prevPlans => prevPlans.filter(p => p.id !== planToDelete.id));
      setPlanToDelete(null);
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan', { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubscribe = async (planId: string, planName: string) => {
    if (!session || !session.user?.id) {
      toast.error('Authentication required', { description: 'Please log in to subscribe to a plan.' });
      return;
    }

    setIsSubscribingPlanId(planId);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id, planId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server returned an error.'}));
        throw new Error(errorData.message || 'Failed to subscribe to plan.');
      }

      toast.success(`Successfully subscribed to ${planName}!`, {
        description: 'You can view your subscriptions on the Subscriptions page.'
      });
      router.push('/subscriptions');
    } catch (error: any) {
      console.error('Error subscribing to plan:', error);
      toast.error(`Failed to subscribe to ${planName}`, { description: error.message });
    } finally {
      setIsSubscribingPlanId(null);
    }
  };

  return (
    <>
      <PageContainer>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
            <p className="text-muted-foreground">
              Browse available plans or manage your organization&apos;s membership plans.
            </p>
          </div>
          <Link href="/plans/new">
            <Button variant="default" className="bg-[#4EA8DE] hover:bg-[#4EA8DE]/90 gap-2">
              <PlusCircle size={18} />
              Add New Plan
            </Button>
          </Link>
        </div>

        <Card className="border-border/40 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose a plan to subscribe or manage existing plans.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p>Loading plans...</p>}
            {error && <p className="text-destructive">Error: {error}</p>}
            {!isLoading && !error && plans.length === 0 && <p>No plans created yet. Admins can add new plans.</p>}
            {!isLoading && !error && plans.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{formatCurrency(plan.price, plan.currency)}</TableCell>
                      <TableCell className="capitalize">{plan.interval.toLowerCase()}</TableCell>
                      <TableCell>
                        <Badge variant={plan.active ? 'default' : 'outline'}>
                          {plan.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{plan.features.join(', ')}</TableCell>
                      <TableCell className="text-right flex items-center justify-end space-x-2">
                        {plan.active && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSubscribe(plan.id, plan.name)}
                            disabled={isSubscribingPlanId === plan.id || !session}
                            className="gap-1.5"
                          >
                            <ShoppingCart size={14}/>
                            {isSubscribingPlanId === plan.id ? 'Subscribing...' : 'Subscribe'}
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/plans/${plan.id}/edit`} className="flex items-center gap-2 w-full cursor-pointer">
                                <Edit size={14} />
                                <span>Edit Plan</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setPlanToDelete(plan)}
                              className="flex items-center gap-2 w-full text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              <span>Delete Plan</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      {planToDelete && (
        <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the plan 
                <span className="font-semibold"> {planToDelete.name}</span>.
                If this plan has active subscriptions, those might be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPlanToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeletePlan} 
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete plan'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
} 