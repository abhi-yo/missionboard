import { MemberStatus, SubscriptionStatus as PrismaSubscriptionStatusEnum, Prisma, MembershipPlan as PrismaMembershipPlan, Subscription as PrismaSubscription, User as PrismaUser } from '@/lib/generated/prisma';

// Re-export enums for convenience if they are not used directly from generated types elsewhere
export { MemberStatus};
export type SubscriptionStatus = PrismaSubscriptionStatusEnum; // Alias for clarity

// Extend Prisma types if needed for frontend specific properties, or use them directly.
// For now, creating specific frontend types that mirror what the API provides.

export interface MembershipPlan extends Omit<PrismaMembershipPlan, 'price'> {
  price: number; // Override price to be number for client-side usage
}

// Define a simple Member-like structure for embedding in Subscription
interface SubscriptionUserInfo {
    id: string;
    name: string | null;
    email: string | null;
}

// Explicitly define fields for client-side, converting Date types from Prisma to string
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId?: string | null;
  status: SubscriptionStatus;
  startDate: string; // Was Date in Prisma, string for client
  currentPeriodStart: string; // Was Date in Prisma, string for client
  currentPeriodEnd: string; // Was Date in Prisma, string for client
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null; // Was Date in Prisma, string for client
  trialStartDate?: string | null; // Was Date in Prisma, string for client
  trialEndDate?: string | null; // Was Date in Prisma, string for client
  createdAt: string; // Was Date in Prisma, string for client
  updatedAt: string; // Was Date in Prisma, string for client
  plan: MembershipPlan; // Use our client-side MembershipPlan type
  user?: SubscriptionUserInfo;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified?: string | null;
  image?: string | null;
  phoneNumber?: string | null;
  status: MemberStatus;
  joinDate?: string | null;
  lastPayment?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  subscriptions?: Subscription[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  registered: number;
  status: 'upcoming' | 'past' | 'canceled';
  image?: string;
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: 'credit' | 'bank' | 'cash' | 'other';
  description: string;
}

export interface ActivityItem {
  id: string;
  type: 'member' | 'event' | 'payment';
  action: string;
  date: string;
  user: {
    name: string;
    avatar: string;
  };
  details: string;
}

export interface StatItem {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  iconName: 'users' | 'calendar' | 'credit' | 'trending';
}