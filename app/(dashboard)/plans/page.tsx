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
      // Use absolute URL for client-side fetch
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/plans`, { 
        cache: 'no-store',
        method: 'GET'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: 'Failed to fetch plans' };
        }
        throw new Error(errorData.message || `Failed to fetch plans (${response.status})`);
      }
      
      const data: MembershipPlan[] = await response.json();
      // Prisma Decimal can be string or number, ensure it's number for client-side calcs/display
      const typedPlans = data.map(plan => ({ ...plan, price: Number(plan.price) }));
      setPlans(typedPlans);
    } catch (err: any) {
      console.error("Fetch plans error:", err);
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
      // Use absolute URL for client-side fetch
      const baseUrl = window.location.origin;
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
      // Use absolute URL for client-side fetch
      const baseUrl = window.location.origin;
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
      <PageContainer className="space-y-6">
        <div className="flex flex-col space-y-1.5 sm:flex-row sm:space-y-0 sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse available plans or manage your organization&apos;s membership plans.
            </p>
          </div>
          <Link href="/plans/new" className="mt-3 sm:mt-0">
            <Button 
              variant="default" 
              className="bg-[#9D43CC] hover:bg-[#9D43CC]/90 gap-2 w-full sm:w-auto"
            >
              <PlusCircle size={16} />
              Add New Plan
            </Button>
          </Link>
        </div>

        <Card className="border border-border/30 bg-card/30 backdrop-blur-sm shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Available Plans</CardTitle>
            <CardDescription>Choose a plan to subscribe or manage existing plans.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-pulse text-muted-foreground">Loading plans...</div>
              </div>
            )}
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 my-2">
                <p>Error: {error}</p>
              </div>
            )}
            
            {!isLoading && !error && plans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="text-muted-foreground mb-2">No plans created yet.</p>
                <p className="text-sm text-muted-foreground">Get started by adding your first membership plan.</p>
              </div>
            )}
            
            {!isLoading && !error && plans.length > 0 && (
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-background/40">
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
                      <TableRow key={plan.id} className="hover:bg-background/40">
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{formatCurrency(plan.price, plan.currency)}</TableCell>
                        <TableCell className="capitalize">{plan.interval.toLowerCase()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={plan.active ? 'default' : 'outline'} 
                            className={plan.active ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500' : ''}
                          >
                            {plan.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {plan.features.join(', ')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {plan.active && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSubscribe(plan.id, plan.name)}
                                disabled={isSubscribingPlanId === plan.id || !session}
                                className="gap-1.5 text-xs hover:bg-[#9D43CC]/10 hover:text-[#9D43CC] hover:border-[#9D43CC]/20"
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
                              <DropdownMenuContent align="end" className="min-w-[180px]">
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>

      {planToDelete && (
        <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
          <AlertDialogContent className="border border-border/40 bg-card/80 backdrop-blur-sm">
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