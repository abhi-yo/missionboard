"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User as PrismaUser, MemberRole, MemberStatus } from "@/lib/generated/prisma";
import { User } from "@/types"; 
import { userRoles, userStatuses } from "@/lib/constants";
import { MoreHorizontal, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface UserListProps {
  users?: User[];
  className?: string;
}

export function UserList({ users: initialUsersFromProps, className }: UserListProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>(initialUsersFromProps || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialUsersFromProps);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Check if user is admin
  const isAdmin = session?.user?.role === MemberRole.ADMIN;

  useEffect(() => {
    if (!initialUsersFromProps) {
      setIsLoading(true);
      const fetchUsers = async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/users`, { cache: 'no-store' });
          if (!response.ok) {
            throw new Error('Failed to fetch users');
          }
          const data: User[] = await response.json();
          setUsers(data);
          setError(null);
        } catch (err: any) {
          setError(err.message);
          setUsers([]); 
        } finally {
          setIsLoading(false);
        }
      };
      fetchUsers();
    }
  }, [initialUsersFromProps]);

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = users.filter(user => {
    const nameMatch = user.name ? user.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const emailMatch = user.email ? user.email.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = nameMatch || emailMatch;
    const currentStatus = user.status as MemberStatus;
    const matchesStatus = statusFilter === "all" || (currentStatus && userStatuses[currentStatus] && currentStatus === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to delete user. Server returned an error." }));
        toast.error("Failed to delete user", { description: errorData.message });
        setIsDeleting(false);
        return;
      }
      toast.success(`User "${userToDelete.name || 'User'}" deleted successfully.`);
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred while deleting the user.", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
    <Card className={cn(
      "border-border/40 bg-card/40 backdrop-blur-md",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-medium">Users Directory</CardTitle>
          {isAdmin && (
            <div className="flex gap-2">
              <Link href="/users/new">
                <Button size="sm" variant="default" className="bg-[#4EA8DE] hover:bg-[#4EA8DE]/90">
                  Add User
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(userStatuses).map(([value, { label }]) => (
                <SelectItem key={value} value={value as MemberStatus}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-0 py-1">
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading users...</div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">Error: {error}</div>
            ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const currentStatus = user.status as MemberStatus;
              return (
                <div 
                  key={user.id}
                  className="py-2 px-4 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>{user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}</AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                            <Link href={`/users/${user.id}`} className="font-medium hover:underline">
                              {user.name || 'Unnamed User'}
                            </Link>
                          {currentStatus && userStatuses[currentStatus] && (
                            <Badge variant="outline" className={cn(
                              "text-xs font-normal py-0 h-5",
                                userStatuses[currentStatus]?.color || ''
                            )}>
                                {userStatuses[currentStatus]?.label || currentStatus}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {user.email || 'No email'}
                            {user.phoneNumber && ( 
                              <span className="ml-2">· {user.phoneNumber}</span>
                            )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/users/${user.id}/edit`} className="flex items-center gap-2 w-full">
                                <Pencil size={14} />
                                <span>Edit</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setUserToDelete(user)} 
                              className="flex items-center gap-2 w-full text-destructive hover:!text-destructive focus:!text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No users found matching your filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>

      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user 
                <span className="font-semibold">{userToDelete.name || 'this user'}</span> and remove their data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser} 
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isDeleting ? "Deleting..." : "Yes, delete user"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
} 