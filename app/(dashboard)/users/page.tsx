import { PageContainer } from "@/components/layout/page-container";
// import { MemberList } from "@/components/dashboard/member-list"; // Will be UserList
import { UserList } from "@/components/dashboard/user-list"; // Renamed component
import { User } from "@/types"; // Changed from Member to User
import { headers } from 'next/headers'; // Import headers
import { createApiUrl } from "@/lib/api-utils";
import { ApiErrorDisplay } from "@/components/dashboard/api-error-display";

async function getUsers(): Promise<User[]> {
  // Forward headers for authentication
  const forwardedHeaders = { 'cookie': headers().get('cookie') || '' };

  // Use relative URL - this works in both production and development
  const res = await fetch(createApiUrl('/users'), {
    cache: 'no-store',
    headers: forwardedHeaders,
  });

  if (!res.ok) {
    // Log the response status and text for more detailed error information
    const errorText = await res.text();
    console.error(`Failed to fetch users. Status: ${res.status}, Body: ${errorText}`);
    throw new Error(`Failed to fetch users. Status: ${res.status}`);
  }
  return res.json();
}

export default async function UsersPage() {
  let users: User[] = [];
  let error = null;
  
  try {
    users = await getUsers();
  } catch (err) {
    console.error('Error fetching users:', err);
    error = err instanceof Error ? err.message : 'Failed to load users';
  }
  
  return (
    <PageContainer
      title="Team Members"
      description="Manage your organization's team members."
      showNewButton
      newButtonLabel="Add Member"
      newButtonLink="/users/new"
    >
      {error ? (
        <ApiErrorDisplay error={error} />
      ) : (
        <UserList users={users} />
      )}
    </PageContainer>
  );
} 