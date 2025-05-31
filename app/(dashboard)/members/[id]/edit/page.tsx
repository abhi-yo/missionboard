"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { userStatuses } from "@/lib/constants";
import { useRouter, useParams } from "next/navigation";
import { Member } from "@/lib/generated/prisma";
import { toast } from "sonner";

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState("pending");
  const [joinDate, setJoinDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  useEffect(() => {
    if (memberId) {
      const fetchMemberData = async () => {
        setIsFetching(true);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const response = await fetch(`${baseUrl}/api/members/${memberId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch member data");
          }
          const data: Member = await response.json();
          setFullName(data.name);
          setEmail(data.email || "");
          setPhoneNumber(data.phoneNumber || "");
          setStatus(data.status);
          setJoinDate(data.joinDate ? new Date(data.joinDate).toISOString().split('T')[0] : "");
          setNotes(data.notes || "");
        } catch (error) {
          console.error("Fetch error:", error);
          toast.error(error instanceof Error ? error.message : "Could not load member data.");
          router.push("/members"); // Redirect if member not found or error
        } finally {
          setIsFetching(false);
        }
      };
      fetchMemberData();
    }
  }, [memberId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const memberDataToUpdate = {
      name: fullName,
      email,
      phoneNumber: phoneNumber || undefined,
      status,
      joinDate: joinDate ? new Date(joinDate).toISOString() : undefined,
      notes: notes || undefined,
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberDataToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          setErrors(errorData.details);
        }
        throw new Error(errorData.error || "Failed to update member");
      }

      toast.success("Member updated successfully!");
      router.push(`/members/${memberId}`);
      router.refresh(); // To ensure the detail page shows updated data if it was cached client-side
    } catch (error: any) {
      console.error("Submission error:", error);
      if (!errors || Object.keys(errors).length === 0) {
        toast.error(`Error: ${error.message || "An unexpected error occurred"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
        <PageContainer>
            <div className="flex justify-center items-center h-64">
                <p>Loading member data...</p>
            </div>
        </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Member</h1>
      </div>
      
      <Card className="border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Update Member Details</CardTitle>
          <CardDescription>
            Modify the form below to update the member&apos;s information.
            {errors.general && <p className="text-sm text-red-500 mt-2">{errors.general.join(', ')}</p>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading} />
                {errors.name && <p className="text-sm text-red-500">{errors.name.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLoading} />
                {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate">Join Date</Label>
                <Input id="joinDate" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} required disabled={isLoading} />
                {errors.joinDate && <p className="text-sm text-red-500">{errors.joinDate.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Membership Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(userStatuses).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status.join(', ')}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-20" disabled={isLoading}/> 
                {errors.notes && <p className="text-sm text-red-500">{errors.notes.join(', ')}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading || isFetching}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#AD49E1] hover:bg-[#AD49E1]/90" disabled={isLoading || isFetching}>
                {isLoading ? 'Updating Member...' : 'Update Member'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
} 