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
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-6">User Directory</h1> {/* Changed title */}
      <UserList users={users} /> {/* Renamed component and prop */}
    </PageContainer>
  );
} 