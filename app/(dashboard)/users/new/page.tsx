import { PageContainer } from "@/components/layout/page-container";
import { UserForm } from "@/components/dashboard/user-form";

export default function NewUserPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Add New User</h1>
      <UserForm />
    </PageContainer>
  );
} 