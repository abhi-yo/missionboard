"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [animations, setAnimations] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState<{ name: string; email: string; phone: string; role: string }>({ name: "", email: "", phone: "", role: "" });

  // Password form state
  const [passwordData, setPasswordData] = useState<{ currentPassword: string; newPassword: string; confirmPassword: string }>({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Organization form state
  const [orgData, setOrgData] = useState<{ name: string; email: string; phone: string; website: string; autoRenew: boolean; gracePeriod: boolean }>({ name: "", email: "", phone: "", website: "", autoRenew: false, gracePeriod: false });
  const [isOrgLoading, setIsOrgLoading] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<{ notifyMembers: boolean; notifyPayments: boolean; notifyEvents: boolean; appAll: boolean }>({ notifyMembers: true, notifyPayments: true, notifyEvents: true, appAll: true });

  // Fetch user data
  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || "",
        email: session.user.email || "",
        phone: "555-123-4567",
        role: "Administrator"
      });
    }
  }, [session]);

  // Add code to fetch organization settings
  useEffect(() => {
    const fetchOrgSettings = async () => {
      setIsOrgLoading(true);
      try {
        const response = await fetch('/api/settings/organization');
        if (response.ok) {
          const data = await response.json();
          if (orgData.name === "" || orgData.name === "My Organization") {
            setOrgData({
              name: data.name || "My Organization",
              email: data.email || "",
              phone: data.phone || "",
              website: data.website || "",
              autoRenew: data.autoRenew === true,
              gracePeriod: data.gracePeriod === true
            });
          }
        } else {
          toast.error("Failed to load organization settings.");
        }
      } catch (error) {
        console.error("Failed to fetch organization settings:", error);
        toast.error("An error occurred while loading organization settings.");
      } finally {
        setIsOrgLoading(false);
      }
    };

    if (session?.user?.id && !isSavingOrg) {
      fetchOrgSettings();
    }
  }, [session?.user?.id, isSavingOrg, orgData.name]);

  // Avoid hydration mismatch by only rendering client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleDarkMode = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleToggleAnimations = (checked: boolean) => {
    setAnimations(checked);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileData((prev: { name: string; email: string; phone: string; role: string }) => ({
      ...prev,
      [id]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldMap: Record<string, string> = {
      'current-password': 'currentPassword',
      'new-password': 'newPassword',
      'confirm-password': 'confirmPassword'
    };
    
    setPasswordData((prev: { currentPassword: string; newPassword: string; confirmPassword: string }) => ({
      ...prev,
      [fieldMap[id]]: value
    }));
  };

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setOrgData((prev: { name: string; email: string; phone: string; website: string; autoRenew: boolean; gracePeriod: boolean }) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSwitchChange = (id: string, checked: boolean) => {
    if (id === 'autoRenew' || id === 'gracePeriod') {
      setOrgData((prev: { name: string; email: string; phone: string; website: string; autoRenew: boolean; gracePeriod: boolean }) => ({
        ...prev,
        [id]: checked
      }));
    } else if (['notifyMembers', 'notifyPayments', 'notifyEvents', 'appAll'].includes(id)) {
      setNotificationSettings((prev: { notifyMembers: boolean; notifyPayments: boolean; notifyEvents: boolean; appAll: boolean }) => ({
        ...prev,
        [id]: checked
      }));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, you would call your API here
      // const response = await fetch('/api/user/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(profileData)
      // });
      
      // Update session for real-time reflection
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: profileData.name,
          email: profileData.email
        }
      });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setIsLoading(true);
      
      // Validate passwords
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("New passwords don't match");
        return;
      }
      
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        toast.error("Please fill all password fields");
        return;
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, you would call your API here
      // const response = await fetch('/api/user/password', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(passwordData)
      // });
      
      toast.success("Password updated successfully!");
      
      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      toast.error("Failed to update password");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOrganization = async () => {
    setIsSavingOrg(true);
    try {
      const response = await fetch('/api/settings/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });
      
      if (response.ok) {
        toast.success("Organization settings saved successfully!");
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error("Failed to save organization settings.", {
          description: errorData?.message || response.statusText
        });
      }
    } catch (error) {
      console.error("Error saving organization settings:", error);
      toast.error("An error occurred while saving organization settings.");
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleSaveAppearance = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app you would save these preferences to user settings
      
      toast.success("Appearance settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save appearance settings");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app you would call your API here
      
      toast.success("Notification preferences updated!");
    } catch (error) {
      toast.error("Failed to update notification preferences");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      
      <Tabs defaultValue="profile" className="mb-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session?.user?.image || "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=150"} />
                  <AvatarFallback>{profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="mb-2">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={profileData.name} 
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role" 
                    value={profileData.role} 
                    readOnly 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-[#AD49E1] hover:bg-[#AD49E1]/90"
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
                <div></div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-[#AD49E1] hover:bg-[#AD49E1]/90"
                  onClick={handleUpdatePassword}
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="organization" className="mt-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization details and configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input 
                    id="name" 
                    value={orgData.name}
                    onChange={handleOrgChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={orgData.email}
                    onChange={handleOrgChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input 
                    id="phone" 
                    value={orgData.phone}
                    onChange={handleOrgChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    value={orgData.website}
                    onChange={handleOrgChange}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h3 className="text-md font-medium">Membership Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoRenew" className="block">Automatic Renewal Reminders</Label>
                    <p className="text-xs text-muted-foreground">Send automatic reminders before membership expiration.</p>
                  </div>
                  <Switch 
                    id="autoRenew" 
                    checked={orgData.autoRenew}
                    onCheckedChange={(checked) => handleSwitchChange('autoRenew', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gracePeriod" className="block">Grace Period for Payments</Label>
                    <p className="text-xs text-muted-foreground">Allow a grace period after membership expiration.</p>
                  </div>
                  <Switch 
                    id="gracePeriod" 
                    checked={orgData.gracePeriod}
                    onCheckedChange={(checked) => handleSwitchChange('gracePeriod', checked)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveOrganization} disabled={isSavingOrg || isOrgLoading}>
                  {isSavingOrg ? "Saving..." : "Save Organization Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Theme Preferences</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode" className="block">Dark Mode</Label>
                    <p className="text-xs text-muted-foreground">Use dark theme across your dashboard.</p>
                  </div>
                  {mounted && (
                    <Switch 
                      id="dark-mode" 
                      checked={theme === 'dark'}
                      onCheckedChange={handleToggleDarkMode}
                    />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="animations" className="block">Interface Animations</Label>
                    <p className="text-xs text-muted-foreground">Enable animations throughout the interface.</p>
                  </div>
                  <Switch 
                    id="animations" 
                    checked={animations}
                    onCheckedChange={handleToggleAnimations}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-[#AD49E1] hover:bg-[#AD49E1]/90"
                  onClick={handleSaveAppearance}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Appearance Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-md font-medium">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-members" className="block">New Member Registrations</Label>
                    <p className="text-xs text-muted-foreground">Email when a new member joins.</p>
                  </div>
                  <Switch 
                    id="notify-members" 
                    checked={notificationSettings.notifyMembers}
                    onCheckedChange={(checked) => handleSwitchChange('notify-members', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-payments" className="block">Payment Received</Label>
                    <p className="text-xs text-muted-foreground">Email when a payment is received.</p>
                  </div>
                  <Switch 
                    id="notify-payments" 
                    checked={notificationSettings.notifyPayments}
                    onCheckedChange={(checked) => handleSwitchChange('notify-payments', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notify-events" className="block">Event Registrations</Label>
                    <p className="text-xs text-muted-foreground">Email when members register for events.</p>
                  </div>
                  <Switch 
                    id="notify-events" 
                    checked={notificationSettings.notifyEvents}
                    onCheckedChange={(checked) => handleSwitchChange('notify-events', checked)}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <h3 className="text-md font-medium">In-App Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="app-all" className="block">All Activity</Label>
                    <p className="text-xs text-muted-foreground">Show all activity in the notification center.</p>
                  </div>
                  <Switch 
                    id="app-all" 
                    checked={notificationSettings.appAll}
                    onCheckedChange={(checked) => handleSwitchChange('app-all', checked)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  className="bg-[#AD49E1] hover:bg-[#AD49E1]/90"
                  onClick={handleSaveNotifications}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Notification Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing" className="mt-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/5 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-md font-medium">Current Plan</h3>
                    <p className="text-2xl font-bold">Pro Plan</p>
                    <p className="text-xs text-muted-foreground mt-1">Billed annually</p>
                  </div>
                  <Badge className="bg-[#AD49E1]">Active</Badge>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h3 className="text-md font-medium">Payment Method</h3>
                <div className="flex items-center gap-3 bg-primary/5 rounded-md p-3">
                  <CreditCard size={18} className="text-[#AD49E1]" />
                  <div>
                    <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">Expires 12/25</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Update
                  </Button>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <h3 className="text-md font-medium">Billing History</h3>
                <div className="bg-primary/5 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Oct 1, 2023</p>
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20">
                      Paid
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Pro Plan - Annual</p>
                    <p className="text-sm font-medium">$240.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}