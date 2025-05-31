'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pencil, ArrowLeft, Calendar, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { userStatuses } from '@/lib/constants';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';

function formatDate(date: string | null | undefined) {
  if (!date) return 'N/A';
  return format(new Date(date), 'PPP');
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Could not load user data');
        toast.error('Could not load user data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center mb-6">
          <Link href="/users" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading user data...</h1>
        </div>
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <div className="flex items-center mb-6">
          <Link href="/users" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">User Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'User data could not be loaded'}</p>
            <Button 
              onClick={() => router.push('/users')} 
              className="mt-4"
            >
              Return to User List
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const statusColor = user.status && userStatuses[user.status as keyof typeof userStatuses] 
    ? userStatuses[user.status as keyof typeof userStatuses].color 
    : '';

  const userNameInitials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('') : 'U';

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/users" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{user.name || 'Unnamed User'}</h1>
          {user.status && (
            <Badge variant="outline" className={cn("ml-4", statusColor)}>
              {userStatuses[user.status as keyof typeof userStatuses]?.label || user.status}
            </Badge>
          )}
        </div>
        <Button 
          onClick={() => router.push(`/users/${userId}/edit`)}
          className="gap-2"
        >
          <Pencil size={16} /> Edit User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-lg">
                {userNameInitials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{user.name || 'Unnamed User'}</h2>
            
            <div className="w-full mt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-muted-foreground" />
                <span>{user.email || 'No email address'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-muted-foreground" />
                <span>{user.phoneNumber || 'No phone number'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-muted-foreground" />
                <span>Joined: {formatDate(user.joinDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
              <p className="text-sm">{user.notes || 'No notes available.'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                <p className="text-sm">{formatDate(user.updatedAt)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Payment</h3>
                <p className="text-sm">{formatDate(user.lastPayment)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/users/${userId}/edit`)}
              className="gap-2"
            >
              <Pencil size={16} /> Edit Details
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
} 