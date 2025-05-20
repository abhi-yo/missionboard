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
import { PaymentMethod, PaymentStatus, User, Subscription } from '@/lib/generated/prisma';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

type SelectUser = Pick<User, 'id' | 'name' | 'email'>;
type SelectSubscription = { id: string; planName: string; userId: string };

export function RecordPaymentModal({ isOpen, onClose, onPaymentRecorded }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(PaymentStatus.COMPLETED);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.OTHER);
  
  const [users, setUsers] = useState<SelectUser[]>([]);
  const [subscriptions, setSubscriptions] = useState<SelectSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SelectSubscription[]>([]);
  
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Convert enum values to display strings
  const paymentStatusMap = {
    [PaymentStatus.COMPLETED]: 'Completed',
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.FAILED]: 'Failed',
  };
  
  const paymentMethodMap = {
    [PaymentMethod.CREDIT_CARD]: 'Credit Card',
    [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
    [PaymentMethod.CASH]: 'Cash',
    [PaymentMethod.OTHER]: 'Other',
  };

  // Fetch users and subscriptions when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form
      setAmount('');
      setDescription('');
      setSelectedUserId('');
      setSelectedSubscriptionId('');
      setSelectedStatus(PaymentStatus.COMPLETED);
      setSelectedMethod(PaymentMethod.OTHER);
      
      // Fetch users
      setIsLoadingUsers(true);
      fetch('/api/users')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch users');
          return res.json();
        })
        .then((data: User[]) => {
          setUsers(data.map(u => ({ 
            id: u.id, 
            name: u.name ?? 'Unnamed User', 
            email: u.email ?? 'No Email' 
          })));
        })
        .catch(err => {
          toast.error("Failed to fetch users", { description: err.message });
          setUsers([]);
        })
        .finally(() => setIsLoadingUsers(false));
      
      // Fetch all subscriptions
      setIsLoadingSubscriptions(true);
      fetch('/api/manage/subscriptions')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch subscriptions');
          return res.json();
        })
        .then((data: any[]) => {
          const formattedSubscriptions = data.map(sub => ({
            id: sub.id,
            planName: sub.plan.name,
            userId: sub.userId
          }));
          setSubscriptions(formattedSubscriptions);
          setFilteredSubscriptions(formattedSubscriptions);
        })
        .catch(err => {
          toast.error("Failed to fetch subscriptions", { description: err.message });
          setSubscriptions([]);
          setFilteredSubscriptions([]);
        })
        .finally(() => setIsLoadingSubscriptions(false));
    }
  }, [isOpen]);
  
  // Filter subscriptions when user changes
  useEffect(() => {
    if (selectedUserId) {
      const filtered = subscriptions.filter(sub => sub.userId === selectedUserId);
      setFilteredSubscriptions(filtered);
    } else {
      setFilteredSubscriptions(subscriptions);
    }
    setSelectedSubscriptionId(''); // Reset subscription selection when user changes
  }, [selectedUserId, subscriptions]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          userId: selectedUserId,
          subscriptionId: selectedSubscriptionId === "none" ? undefined : selectedSubscriptionId || undefined,
          method: selectedMethod,
          status: selectedStatus,
          description: description || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record payment');
      }
      
      toast.success('Payment recorded successfully');
      onPaymentRecorded();
      onClose();
    } catch (error: any) {
      toast.error('Failed to record payment', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record New Payment</DialogTitle>
          <DialogDescription>
            Record a payment for a member&apos;s subscription or other purposes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                User
              </Label>
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
                  {!isLoadingUsers && users.length === 0 && 
                    <SelectItem value="no-users" disabled>No users found</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subscription" className="text-right">
                Subscription
              </Label>
              <Select
                value={selectedSubscriptionId}
                onValueChange={setSelectedSubscriptionId}
                disabled={isLoadingSubscriptions || !selectedUserId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    isLoadingSubscriptions 
                      ? "Loading subscriptions..." 
                      : !selectedUserId
                      ? "Select a user first"
                      : "Select subscription (optional)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific subscription</SelectItem>
                  {filteredSubscriptions.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.planName}
                    </SelectItem>
                  ))}
                  {!isLoadingSubscriptions && filteredSubscriptions.length === 0 && selectedUserId && (
                    <SelectItem value="no-subscriptions" disabled>
                      No subscriptions found for this user
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex rounded-md">
                <span className="flex items-center bg-muted px-3 rounded-l-md border border-r-0">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="rounded-l-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as PaymentStatus)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentStatusMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="method" className="text-right">
                Method
              </Label>
              <Select
                value={selectedMethod}
                onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment description (optional)"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 