"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Clock, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function EditEventPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationDetails, setLocationDetails] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  
  const router = useRouter();
  
  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Event not found");
          }
          throw new Error("Failed to load event details");
        }
        
        const data = await response.json();
        
        // Populate form fields
        setTitle(data.name || "");
        setDescription(data.description || "");
        
        const date = new Date(data.date);
        setEventDate(date);
        
        // Format time (HH:MM)
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        setEventTime(`${hours}:${minutes}`);
        
        setLocation(data.location || "");
        setLocationDetails(data.locationDetails || "");
        setCapacity(data.capacity ? data.capacity.toString() : "");
        setIsPrivate(data.isPrivate || false);
        
        if (data.registrationDeadline) {
          setHasDeadline(true);
          setDeadlineDate(new Date(data.registrationDeadline));
        } else {
          setHasDeadline(false);
          setDeadlineDate(undefined);
        }
      } catch (error: any) {
        console.error("Error fetching event details:", error);
        setError(error.message);
        toast.error("Error", { description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [params.id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title) {
      toast.error("Please enter an event title");
      return;
    }
    
    if (!eventDate) {
      toast.error("Please select an event date");
      return;
    }
    
    if (!eventTime) {
      toast.error("Please enter an event time");
      return;
    }

    // Format date and time
    const [hours, minutes] = eventTime.split(":").map(Number);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);
    
    const eventData = {
      name: title,
      description,
      date: eventDateTime.toISOString(),
      location,
      locationDetails,
      capacity: capacity ? parseInt(capacity) : null,
      isPrivate,
      registrationDeadline: hasDeadline && deadlineDate ? deadlineDate.toISOString() : null,
    };
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update event");
      }
      
      toast.success("Event updated successfully");
      router.push(`/events/${params.id}`);
    } catch (error: any) {
      toast.error("Failed to update event", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }
  
  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center mb-6">
          <Link href={`/events/${params.id}`} className="flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft size={16} className="mr-1" />
            <span>Back to Event</span>
          </Link>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button variant="outline" asChild>
          <Link href={`/events/${params.id}`}>Return to Event Page</Link>
        </Button>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <div className="flex items-center mb-6">
        <Link href={`/events/${params.id}`} className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft size={16} className="mr-1" />
          <span>Back to Event</span>
        </Link>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Update your event information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter event description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !eventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? format(eventDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="time">Event Time</Label>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter event location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="locationDetails">Location Details</Label>
                <Textarea
                  id="locationDetails"
                  placeholder="Enter additional location details, directions, etc."
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity (optional)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    placeholder="Leave blank for unlimited"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <div className="grid gap-2 flex-1">
                    <Label className="flex items-center gap-2">
                      <span>Private Event</span>
                      <Switch
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Private events are only visible to invited members
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id="hasDeadline" 
                    checked={hasDeadline} 
                    onCheckedChange={(checked) => setHasDeadline(checked === true)}
                  />
                  <Label htmlFor="hasDeadline" className="cursor-pointer">
                    Set registration deadline
                  </Label>
                </div>
                
                {hasDeadline && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !deadlineDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadlineDate ? format(deadlineDate, "PPP") : "Select deadline date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deadlineDate}
                        onSelect={setDeadlineDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/events/${params.id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
} 