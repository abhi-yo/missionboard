import { PageContainer } from "@/components/layout/page-container";
// import { MemberList } from "@/components/dashboard/member-list"; // Will be UserList
import { UserList } from "@/components/dashboard/user-list"; // Renamed component
import { User } from "@/types"; // Changed from Member to User
import { headers } from 'next/headers'; // Import headers

async function getUsers(): Promise<User[]> { // Renamed function and return type
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Forward headers for authentication
  const forwardedHeaders = { 'cookie': headers().get('cookie') || '' };

  const res = await fetch(`${baseUrl}/api/users`, {
    cache: 'no-store',
    headers: forwardedHeaders, // Add forwarded headers to the fetch call
  });

  if (!res.ok) {
    // Log the response status and text for more detailed error information
    const errorText = await res.text();
    console.error(`Failed to fetch users. Status: ${res.status}, Body: ${errorText}`);
    throw new Error(`Failed to fetch users. Status: ${res.status}`);
  }
  return res.json();
}

export default async function UsersPage() { // Renamed page component
  const users = await getUsers(); // Renamed variable and function call

  return (
    <PageContainer className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
        <p className="text-muted-foreground text-sm">
          Manage your organization&apos;s members and their account settings.
        </p>
      </div>
      
      <div className="rounded-xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
        <UserList users={users} /> {/* Renamed component and prop */}
      </div>
    </PageContainer>
  );
} 