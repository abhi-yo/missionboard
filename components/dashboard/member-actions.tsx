"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner"; // Assuming you have sonner or similar for notifications

interface MemberActionsProps {
  memberId: string;
  onDelete?: () => Promise<void> | void; // Optional: if parent needs to do something before/after redirect
}

export function MemberActions({ memberId, onDelete }: MemberActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this member? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete member.");
      }
      
      toast.success("Member deleted successfully.");

      if (onDelete) {
        await onDelete();
      }
      router.push("/members");
      router.refresh(); // Ensure the list is updated
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Link href={`/members/${memberId}/edit`}>
        <Button variant="outline" className="gap-2" disabled={isDeleting}>
          <Pencil size={16} />
          Edit Member
        </Button>
      </Link>
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
        className="gap-2"
      >
        <Trash2 size={16} />
        {isDeleting ? "Deleting..." : "Delete Member"}
      </Button>
    </div>
  );
} 