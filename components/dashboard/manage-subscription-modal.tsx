'use client';

import { useState, useEffect } from 'react';
import { Member, Subscription, MembershipPlan } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { subscriptionStatusLabels, subscriptionStatusColors } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ManageSubscriptionModalProps {
  member: Member;
  activeSubscription: Subscription | undefined;
}

export function ManageSubscriptionModal({ member, activeSubscription: initialActiveSubscription }: ManageSubscriptionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(undefined);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(initialActiveSubscription);

  useEffect(() => {
    setCurrentSubscription(initialActiveSubscription);
  }, [initialActiveSubscription]);

  const fetchAvailablePlans = async () => {
    setIsLoadingPlans(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/plans?active=true`); // Fetch only active plans
      if (!res.ok) throw new Error('Failed to fetch plans');
      const plansData: MembershipPlan[] = await res.json();
      // Ensure price is a number for plans fetched here as well
      setAvailablePlans(plansData.map(p => ({ ...p, price: Number(p.price) })));
    } catch (error) {
      toast.error('Could not load plans', { description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (isOpen && !currentSubscription) {
      fetchAvailablePlans();
    }
  }, [isOpen, currentSubscription]);

  const handleSubscribe = async () => {
    if (!selectedPlanId) {
      toast.error('Please select a plan to subscribe.');
      return;
    }
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id, planId: selectedPlanId }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create subscription');
      }
      const newSubscription: Subscription = await res.json();
      // Ensure dates and price are correctly formatted/typed for the new subscription
      const formattedNewSubscription: Subscription = {
        ...newSubscription,
        startDate: format(new Date(newSubscription.startDate), 'yyyy-MM-dd'),
        currentPeriodStart: format(new Date(newSubscription.currentPeriodStart), 'yyyy-MM-dd'),
        currentPeriodEnd: format(new Date(newSubscription.currentPeriodEnd), 'yyyy-MM-dd'),
        plan: {
            ...newSubscription.plan,
            price: Number(newSubscription.plan.price)
        }
      };
      setCurrentSubscription(formattedNewSubscription);
      toast.success(`Subscribed ${member.name} to ${formattedNewSubscription.plan.name} successfully!`);
      setSelectedPlanId(undefined);
      // No automatic close, user can see the new state or we can add router.refresh() and close
      // router.refresh(); // if parent page needs to update immediately
      setIsOpen(false); // Close modal on success
    } catch (error) {
      toast.error('Subscription failed', { description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      // For this example, we set cancelAtPeriodEnd to true.
      // A more robust implementation might immediately set status to CANCELED or handle it differently.
      const res = await fetch(`${baseUrl}/api/subscriptions/${currentSubscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELED', cancelAtPeriodEnd: true, canceledAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }
      const updatedSubscription = await res.json();
       const formattedUpdatedSubscription: Subscription = {
        ...updatedSubscription,
        startDate: format(new Date(updatedSubscription.startDate), 'yyyy-MM-dd'),
        currentPeriodStart: format(new Date(updatedSubscription.currentPeriodStart), 'yyyy-MM-dd'),
        currentPeriodEnd: format(new Date(updatedSubscription.currentPeriodEnd), 'yyyy-MM-dd'),
        canceledAt: updatedSubscription.canceledAt ? format(new Date(updatedSubscription.canceledAt), 'yyyy-MM-dd') : null,
        plan: {
            ...updatedSubscription.plan,
            price: Number(updatedSubscription.plan.price)
        }
      };
      setCurrentSubscription(formattedUpdatedSubscription);
      toast.success('Subscription status updated to Canceled.');
      setIsOpen(false); // Close modal on success
    } catch (error) {
      toast.error('Failed to cancel subscription', { description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const triggerButtonLabel = currentSubscription ? "Manage Subscription" : "Add Subscription";
  const triggerButtonIcon = currentSubscription ? <Edit size={16}/> : <PlusCircle size={16}/>;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {triggerButtonIcon}
          {triggerButtonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {currentSubscription ? `Manage Subscription: ${member.name}` : `Subscribe Member: ${member.name}`}
          </DialogTitle>
          <DialogDescription>
            {currentSubscription 
              ? "View or cancel the member\'s current subscription."
              : "Select a plan to subscribe this member to."
            }
          </DialogDescription>
        </DialogHeader>
        
        {currentSubscription ? (
          <div className="space-y-4 py-4">
            <p><strong>Current Plan:</strong> {currentSubscription.plan.name}</p>
            <p><strong>Status:</strong> 
                <span className={cn("px-2 py-0.5 ml-1 rounded-full text-xs font-medium", subscriptionStatusColors[currentSubscription.status], "border")}>
                    {subscriptionStatusLabels[currentSubscription.status] || currentSubscription.status}
                </span>
            </p>
            <p><strong>Price:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: currentSubscription.plan.currency }).format(currentSubscription.plan.price)} / {currentSubscription.plan.interval.toLowerCase()}</p>
            <p><strong>Current Period:</strong> {format(new Date(currentSubscription.currentPeriodStart), 'PPP')} - {format(new Date(currentSubscription.currentPeriodEnd), 'PPP')}</p>
            <p><strong>Started On:</strong> {format(new Date(currentSubscription.startDate), 'PPP')}</p>
            {currentSubscription.cancelAtPeriodEnd && <p className="text-orange-500 font-semibold">This subscription is set to cancel at the end of the current period.</p>}
            {currentSubscription.canceledAt && <p className="text-red-500 font-semibold">This subscription was canceled on {format(new Date(currentSubscription.canceledAt), 'PPP')}.</p>}

            {currentSubscription.status === 'ACTIVE' && !currentSubscription.cancelAtPeriodEnd && (
                <Button 
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={isSubmitting} 
                    className="w-full mt-4"
                >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4"/>}
                    Cancel Subscription
                </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Membership Plan</Label>
              {isLoadingPlans ? (
                <p>Loading plans...</p>
              ) : availablePlans.length > 0 ? (
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger id="plan">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id} disabled={!plan.active}>
                        {plan.name} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency }).format(plan.price)} / {plan.interval.toLowerCase()}) {!plan.active && "(Inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p>No active plans available. Please add some plans first.</p>
              )}
            </div>
            <Button onClick={handleSubscribe} disabled={isSubmitting || isLoadingPlans || !selectedPlanId || availablePlans.length === 0} className="w-full bg-[#4EA8DE] hover:bg-[#4EA8DE]/90">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4"/>}
              Subscribe Member
            </Button>
          </div>
        )}
        <DialogFooter className="sm:justify-start pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 