'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User, MembershipPlan } from '@/lib/generated/prisma'; 

interface AssignSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionAssigned: () => void;
}

type SelectUser = Pick<User, 'id' | 'name' | 'email'>;
type SelectPlan = Pick<MembershipPlan, 'id' | 'name' | 'active'>;


export function AssignSubscriptionModal({ isOpen, onClose, onSubscriptionAssigned }: AssignSubscriptionModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('');

  const [users, setUsers] = useState<SelectUser[]>([]);
  const [plans, setPlans] = useState<SelectPlan[]>([]);

  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingUsers(true);
      fetch('/api/users')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch users');
          return res.json();
        })
        .then((data: User[]) => {
          setUsers(data.map(u => ({ id: u.id, name: u.name ?? 'Unnamed User', email: u.email ?? 'No Email' })));
        })
        .catch(err => {
          toast.error("Failed to fetch users", { description: err.message });
          setUsers([]);
        })
        .finally(() => setIsLoadingUsers(false));

      setIsLoadingPlans(true);
      fetch('/api/plans')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch plans');
          return res.json();
        })
        .then((data: MembershipPlan[]) => {
          setPlans(data.filter(p => p.active).map(p => ({ id: p.id, name: p.name, active: p.active })));
        })
        .catch(err => {
          toast.error("Failed to fetch plans", { description: err.message });
          setPlans([]);
        })
        .finally(() => setIsLoadingPlans(false));
      
      setSelectedUserId('');
      setSelectedPlanId('');
      setCustomStartDate('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedPlanId) {
      toast.error("Validation Error", { description: "Please select a user and a plan." });
      return;
    }
    setIsSubmitting(true);
    try {
      let formattedStartDate: string | undefined = undefined;
      if (customStartDate) {
        // Input type="date" gives YYYY-MM-DD.
        // Backend expects ISO 8601 datetime string.
        // Convert to Date object then toISOString() for UTC datetime.
        const dateParts = customStartDate.split('-'); // [YYYY, MM, DD]
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(dateParts[2], 10);
          formattedStartDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0)).toISOString();
        } else {
          // Fallback or error if date format is not as expected, though type="date" should ensure it.
          console.warn('Unexpected date format for customStartDate:', customStartDate);
          // Send it as is, or handle error - for now, send as is, Zod will catch it.
          formattedStartDate = customStartDate;
        }
      }

      const response = await fetch('/api/manage/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedUserId,
          planId: selectedPlanId,
          customStartDate: formattedStartDate, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An error occurred."}))
        throw new Error(errorData.error || errorData.message || "Failed to assign subscription.");
      }
      
      toast.success("Subscription Assigned Successfully!");
      onSubscriptionAssigned();
      onClose(); 
    } catch (error: any) {
      toast.error("Assignment Failed", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Assign New Subscription</DialogTitle>
          <DialogDescription>
            Select a user and a plan to manually assign a new subscription.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">User</Label>
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
                disabled={isLoadingUsers}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                  {!isLoadingUsers && users.length === 0 && <SelectItem value="no-users" disabled>No users found</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan" className="text-right">Plan</Label>
               <Select 
                value={selectedPlanId} 
                onValueChange={setSelectedPlanId}
                disabled={isLoadingPlans}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={isLoadingPlans ? "Loading plans..." : "Select a plan"} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                  {!isLoadingPlans && plans.length === 0 && <SelectItem value="no-plans" disabled>No active plans found</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start-date" className="text-right">
                Start Date <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingUsers || isLoadingPlans}>
              {isSubmitting ? 'Assigning...' : 'Assign Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 