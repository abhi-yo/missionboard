'use client';

import { PageContainer } from "@/components/layout/page-container";
import { UserList } from "@/components/dashboard/user-list";
import { ApiErrorDisplay } from "@/components/dashboard/api-error-display";

export default function UsersPage() {
  return (
    <PageContainer
      title="Team Members"
      description="Manage your organization's team members."
      showNewButton
      newButtonLabel="Add Member"
      newButtonLink="/users/new"
    >
      {/* The UserList component will handle fetching users client-side */}
      <UserList />
    </PageContainer>
  );
} 