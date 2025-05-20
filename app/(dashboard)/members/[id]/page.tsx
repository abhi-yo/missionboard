// "use client"; // Removed: This will be a Server Component
import { PageContainer } from "@/components/layout/page-container";
// import { useParams, useRouter } from "next/navigation"; // Removed: useRouter not needed, params is a prop
import Link from "next/link";
// import { members } from "@/lib/mock-data"; // Removed: Will fetch from API
import { Member } from "@/types"; // Updated import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { memberRoles, memberStatuses, subscriptionStatusColors, subscriptionStatusLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react"; // Reduced imports to only what's used by current structure + Pencil for edit button
import { notFound } from 'next/navigation'; // Added: For handling not found cases
import { ManageSubscriptionModal } from "../../../../components/dashboard/manage-subscription-modal"; // Using relative path
import { MemberActions } from "@/components/dashboard/member-actions"; // Added import
import { format } from 'date-fns'; // For date formatting

// The Member type from @/types now includes subscriptions with plan details
async function getMember(id: string): Promise<Member | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/members/${id}`, { cache: 'no-store' });
  if (!res.ok) {
    if (res.status === 404) return null;
    // This will activate the closest `error.js` Error Boundary for other errors
    throw new Error('Failed to fetch member data');
  }
  const memberData = await res.json();
  // Ensure dates are consistently handled, Prisma might return Date objects or strings
  // For server components, it's often fine, but client components might need string conversion
  return {
    ...memberData,
    joinDate: memberData.joinDate ? format(new Date(memberData.joinDate), 'yyyy-MM-dd') : null,
    createdAt: format(new Date(memberData.createdAt), 'yyyy-MM-dd HH:mm'),
    updatedAt: format(new Date(memberData.updatedAt), 'yyyy-MM-dd HH:mm'),
    subscriptions: memberData.subscriptions?.map((sub: any) => ({
        ...sub,
        startDate: format(new Date(sub.startDate), 'yyyy-MM-dd'),
        currentPeriodStart: format(new Date(sub.currentPeriodStart), 'yyyy-MM-dd'),
        currentPeriodEnd: format(new Date(sub.currentPeriodEnd), 'yyyy-MM-dd'),
        canceledAt: sub.canceledAt ? format(new Date(sub.canceledAt), 'yyyy-MM-dd') : null,
        trialStartDate: sub.trialStartDate ? format(new Date(sub.trialStartDate), 'yyyy-MM-dd') : null,
        trialEndDate: sub.trialEndDate ? format(new Date(sub.trialEndDate), 'yyyy-MM-dd') : null,
        plan: {
            ...sub.plan,
            price: Number(sub.plan.price) // Ensure price is a number
        }
    })) || []
  } as Member;
}

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const memberId = params.id;
  const member = await getMember(memberId);

  if (!member) {
    notFound(); // Triggers the not-found UI
  }

  const activeSubscription = member.subscriptions?.find(sub => sub.status === 'ACTIVE');

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={member.avatar || undefined} /> 
            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>
            <p className="text-muted-foreground">{member.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
            <ManageSubscriptionModal member={member} activeSubscription={activeSubscription} />
            <MemberActions memberId={member.id} /> 
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-lg border border-border/40 bg-card/40 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-4">Member Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p><strong>Status:</strong> 
                <Badge variant="outline" className={cn("ml-1", memberStatuses[member.status]?.color)}>
                  {memberStatuses[member.status]?.label || member.status}
                </Badge>
              </p>
              <p><strong>Role:</strong> 
                <Badge variant="secondary" className="ml-1">
                  {memberRoles[member.role]?.label || member.role}
                </Badge>
              </p>
              <p><strong>Join Date:</strong> {member.joinDate ? format(new Date(member.joinDate), 'PPP') : 'N/A'}</p>
              {member.phoneNumber && <p><strong>Phone:</strong> {member.phoneNumber}</p>}
              <p><strong>Member Since:</strong> {format(new Date(member.createdAt), 'PPP')}</p>
              <p><strong>Last Updated:</strong> {format(new Date(member.updatedAt), 'PPP p')}</p>
            </div>
          </div>
          <div className="p-6 rounded-lg border border-border/40 bg-card/40 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold">Subscription Details</h2>
                 {/* Button to manage subscription will be part of ManageSubscriptionModal trigger above */} 
            </div>
            {activeSubscription ? (
              <div className="space-y-2 text-sm">
                <p><strong>Plan:</strong> {activeSubscription.plan.name}</p>
                <p><strong>Status:</strong> 
                    <Badge variant="outline" className={cn("ml-1", subscriptionStatusColors[activeSubscription.status])}>
                        {subscriptionStatusLabels[activeSubscription.status] || activeSubscription.status}
                    </Badge>
                </p>
                <p><strong>Price:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: activeSubscription.plan.currency }).format(activeSubscription.plan.price)} / {activeSubscription.plan.interval.toLowerCase()}</p>
                <p><strong>Current Period:</strong> {format(new Date(activeSubscription.currentPeriodStart), 'PPP')} - {format(new Date(activeSubscription.currentPeriodEnd), 'PPP')}</p>
                <p><strong>Started On:</strong> {format(new Date(activeSubscription.startDate), 'PPP')}</p>
                {activeSubscription.cancelAtPeriodEnd && <p className="text-orange-600">Set to cancel at period end.</p>}
                {activeSubscription.canceledAt && <p className="text-red-600">Canceled on: {format(new Date(activeSubscription.canceledAt), 'PPP')}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active subscription found for this member.</p>
            )}
          </div>
          <div className="p-6 rounded-lg border border-border/40 bg-card/40 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {member.notes || "No notes available for this member."}
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-border/40 bg-card/40 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
            <p className="text-sm text-muted-foreground">
              Activity feed will be implemented here.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 