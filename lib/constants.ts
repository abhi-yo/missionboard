import { 
  Users, CalendarDays, CreditCard, BarChart3, 
  Settings, Home, Bell, LogOut, 
  User, PlusCircle, Calendar, DollarSign, 
  TrendingUp, Check, X, FileText
} from "lucide-react";
import { MemberStatus, MemberRole, SubscriptionStatus } from "@/lib/generated/prisma";

export const sidebarItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
  },
  {
    title: "Plans",
    href: "/plans",
    icon: DollarSign,
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: FileText,
  },
  {
    title: "Events",
    href: "/events",
    icon: CalendarDays,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const quickActions = [
  {
    title: "Add User",
    href: "/users/new",
    icon: User,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    title: "Add Plan",
    href: "/plans/new",
    icon: PlusCircle,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    title: "Create Event",
    href: "/events/new",
    icon: Calendar,
    color: "bg-amber-500 hover:bg-amber-600",
  },
];

export const userStatuses: Record<MemberStatus, { label: string; color: string }> = {
  [MemberStatus.active]: { label: "Active", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/50" },
  [MemberStatus.pending]: { label: "Pending", color: "bg-amber-500/20 text-amber-500 border-amber-500/50" },
  [MemberStatus.inactive]: { label: "Inactive", color: "bg-gray-500/20 text-gray-400 border-gray-500/50" },
  [MemberStatus.cancelled]: { label: "Cancelled", color: "bg-rose-500/20 text-rose-500 border-rose-500/50" },
};

export const userRoles: Record<MemberRole, { label: string }> = {
  [MemberRole.ADMIN]: { label: "User" },
};

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: 'Active',
  [SubscriptionStatus.CANCELED]: 'Canceled',
  [SubscriptionStatus.PAST_DUE]: 'Past Due',
  [SubscriptionStatus.INCOMPLETE]: 'Incomplete',
  [SubscriptionStatus.TRIALING]: 'Trial',
};

export const subscriptionStatusColors: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: 'bg-green-100 text-green-800 border-green-300',
  [SubscriptionStatus.CANCELED]: 'bg-gray-100 text-gray-800 border-gray-300',
  [SubscriptionStatus.PAST_DUE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  [SubscriptionStatus.INCOMPLETE]: 'bg-orange-100 text-orange-800 border-orange-300',
  [SubscriptionStatus.TRIALING]: 'bg-blue-100 text-blue-800 border-blue-300',
};