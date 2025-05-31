"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AddMemberPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState("pending"); 
  const [role, setRole] = useState("member"); 
  // Ensure joinDate is in YYYY-MM-DD for the input type="date", then convert to ISO for API
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const memberData = {
      name: fullName,
      email,
      phoneNumber: phoneNumber || undefined, // Send undefined if empty, API will handle null
      avatar: avatarUrl || undefined,
      status,
      role,
      joinDate: new Date(joinDate).toISOString(), // Send as ISO string
      notes: notes || undefined,
    };

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          setErrors(errorData.details);
        }
        throw new Error(errorData.error || "Failed to add member");
      }

      // const newMember = await response.json(); // Optional: use the returned member data
      alert("Member added successfully!");
      router.push("/members"); 
    } catch (error: any) {
      console.error("Submission error:", error);
      if (!errors || Object.keys(errors).length === 0) {
        alert(`Error: ${error.message || "An unexpected error occurred"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Member</h1>
      </div>
      
      <Card className="border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>New Member Details</CardTitle>
          <CardDescription>
            Fill in the form below to add a new member to the directory.
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
                <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} disabled={isLoading} />
                {errors.avatar && <p className="text-sm text-red-500">{errors.avatar.join(', ')}</p>}
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
                    {/* Remove the usage of memberStatuses */}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-sm text-red-500">{errors.status.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Member Role</Label>
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Remove the usage of memberRoles */}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-500">{errors.role.join(', ')}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-20" disabled={isLoading}/> 
                {errors.notes && <p className="text-sm text-red-500">{errors.notes.join(', ')}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#AD49E1] hover:bg-[#AD49E1]/90" disabled={isLoading}>
                {isLoading ? 'Adding Member...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
} 