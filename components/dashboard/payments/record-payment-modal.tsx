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
  onPaymentRecorded?: () => void;
}

type SelectMember = {
  id: string;
  name: string;
  email?: string | null;
};

type SelectSubscription = { 
  id: string; 
  planName: string; 
  memberId?: string;
};

export function RecordPaymentModal({ isOpen, onClose, onPaymentRecorded }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>(PaymentStatus.COMPLETED);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.OTHER);
  
  const [members, setMembers] = useState<SelectMember[]>([]);
  const [subscriptions, setSubscriptions] = useState<SelectSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SelectSubscription[]>([]);
  
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
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

  // Fetch members and subscriptions when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form
      setAmount('');
      setDescription('');
      setSelectedMemberId('');
      setSelectedSubscriptionId('');
      setSelectedStatus(PaymentStatus.COMPLETED);
      setSelectedMethod(PaymentMethod.OTHER);
      
      // Fetch members
      setIsLoadingMembers(true);
      fetch('/api/members')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch members');
          return res.json();
        })
        .then((data) => {
          console.log("Members data:", data);
          setMembers(data.map((m: any) => ({ 
            id: m.id, 
            name: m.name || 'Unnamed Member', 
            email: m.email || '' 
          })));
        })
        .catch(err => {
          toast.error("Failed to fetch members", { description: err.message });
          setMembers([]);
        })
        .finally(() => setIsLoadingMembers(false));
      
      // Fetch all subscriptions
      setIsLoadingSubscriptions(true);
      fetch('/api/manage/subscriptions')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch subscriptions');
          return res.json();
        })
        .then((data: any[]) => {
          console.log("Subscriptions data:", data);
          const formattedSubscriptions = data.map(sub => ({
            id: sub.id,
            planName: sub.plan?.name || "Unknown Plan",
            memberId: sub.memberId || sub.userId
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
  
  // Filter subscriptions when member changes
  useEffect(() => {
    if (selectedMemberId) {
      const filtered = subscriptions.filter(sub => sub.memberId === selectedMemberId);
      setFilteredSubscriptions(filtered);
    } else {
      setFilteredSubscriptions(subscriptions);
    }
    setSelectedSubscriptionId(''); // Reset subscription selection when member changes
  }, [selectedMemberId, subscriptions]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!selectedMemberId) {
      toast.error("Please select a member");
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
          memberId: selectedMemberId,
          subscriptionId: selectedSubscriptionId === "none" ? undefined : selectedSubscriptionId,
          status: selectedStatus,
          method: selectedMethod,
          description: description || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to record payment');
      }
      
      toast.success("Payment recorded successfully");
      onPaymentRecorded?.();
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
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
              <Label htmlFor="member" className="text-right">
                Member
              </Label>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
                disabled={isLoadingMembers}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={isLoadingMembers ? "Loading members..." : "Select a member"} />
                </SelectTrigger>
                <SelectContent>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                  {!isLoadingMembers && members.length === 0 && 
                    <SelectItem value="no-members" disabled>No members found</SelectItem>
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
                disabled={isLoadingSubscriptions || !selectedMemberId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    isLoadingSubscriptions 
                      ? "Loading subscriptions..." 
                      : !selectedMemberId
                      ? "Select a member first"
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
                  {!isLoadingSubscriptions && filteredSubscriptions.length === 0 && selectedMemberId && (
                    <SelectItem value="no-subscriptions" disabled>
                      No subscriptions found for this member
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