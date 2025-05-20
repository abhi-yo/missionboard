"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Edit, 
  Trash, 
  Ban,
  ChevronLeft,
  CornerDownRight,
  UserPlus 
} from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
        setEvent(data);
        
        // Fetch registrations
        const regResponse = await fetch(`/api/events/${params.id}/registrations`);
        
        if (!regResponse.ok) {
          throw new Error("Failed to load registrations");
        }
        
        const regData = await regResponse.json();
        setRegistrations(regData);
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
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      toast.success('Event deleted successfully');
      router.push('/events');
    } catch (error: any) {
      toast.error('Failed to delete event', { description: error.message });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      const response = await fetch(`/api/events/${event.id}/cancel`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel event');
      }
      
      toast.success('Event canceled successfully');
      // Refresh event data
      const updatedEvent = await fetch(`/api/events/${params.id}`).then(res => res.json());
      setEvent(updatedEvent);
    } catch (error: any) {
      toast.error('Failed to cancel event', { description: error.message });
    } finally {
      setIsCanceling(false);
      setIsCancelDialogOpen(false);
    }
  };
  
  // Calculate percentage of capacity filled
  const calculateCapacityPercentage = () => {
    if (!event || !event.capacity) return 0;
    return Math.min(100, Math.round((event.registered / event.capacity) * 100));
  };
  
  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
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
          <Link href="/events" className="flex items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft size={16} className="mr-1" />
            <span>Back to Events</span>
          </Link>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button variant="outline" asChild>
          <Link href="/events">View All Events</Link>
        </Button>
      </PageContainer>
    );
  }
  
  if (!event) return null;
  
  const eventDate = new Date(event.date);
  const isPastEvent = event.status === "COMPLETED" || event.status === "ARCHIVED";
  const isCanceledEvent = event.status === "CANCELED";
  
  return (
    <PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Link href="/events" className="flex items-center text-muted-foreground hover:text-foreground mr-4">
            <ChevronLeft size={16} className="mr-1" />
            <span>Back to Events</span>
          </Link>
          
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          
          <Badge 
            variant="outline" 
            className={cn(
              "ml-4 text-xs",
              event.status === "SCHEDULED" || event.status === "DRAFT" ? "bg-blue-500/20 text-blue-500" : 
              event.status === "COMPLETED" || event.status === "ARCHIVED" ? "bg-gray-500/20 text-gray-400" :
              "bg-rose-500/20 text-rose-500"
            )}
          >
            {event.status === "SCHEDULED" ? "Upcoming" : 
            event.status === "DRAFT" ? "Draft" :
            event.status === "COMPLETED" ? "Completed" :
            event.status === "ARCHIVED" ? "Archived" : 
            "Canceled"}
          </Badge>
        </div>
        
        {!isPastEvent && (
          <div className="flex items-center gap-2">
            {!isCanceledEvent && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-amber-500 border-amber-500/20"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                <Ban size={16} className="mr-2" />
                Cancel Event
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              className="text-red-500 border-red-500/20"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash size={16} className="mr-2" />
              Delete Event
            </Button>
            
            <Button 
              size="sm"
              className="bg-[#4EA8DE] hover:bg-[#4EA8DE]/90"
              asChild
            >
              <Link href={`/events/${event.id}/edit`}>
                <Edit size={16} className="mr-2" />
                Edit Event
              </Link>
            </Button>
          </div>
        )}
      </div>
      
      {isCanceledEvent && (
        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <Ban className="h-4 w-4 text-amber-500" />
          <AlertTitle>This event has been canceled</AlertTitle>
          <AlertDescription>
            This event has been canceled and is no longer accepting registrations.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Event Image */}
          {event.image && (
            <div 
              className="w-full h-64 bg-cover bg-center rounded-lg overflow-hidden border"
              style={{ backgroundImage: `url(${event.image})` }}
            />
          )}
          
          {/* Event Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About this event</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {event.description || "No description provided for this event."}
            </p>
          </div>
          
          {/* Event Location Details */}
          {event.locationDetails && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Location Details</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {event.locationDetails}
              </p>
            </div>
          )}
          
          {/* Registrations */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Registrations</h2>
              
              {!isPastEvent && !isCanceledEvent && (
                <Button 
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  asChild
                >
                  <Link href={`/events/${event.id}/registrations/add`}>
                    <UserPlus size={16} />
                    Add Registration
                  </Link>
                </Button>
              )}
            </div>
            
            {registrations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No registrations yet.</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {registrations.length} {registrations.length === 1 ? 'registration' : 'registrations'} for this event.
                </p>
                
                <div className="border rounded-md divide-y">
                  {registrations.slice(0, 5).map((reg) => (
                    <div key={reg.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{reg.name}</div>
                        <div className="text-sm text-muted-foreground">{reg.email}</div>
                      </div>
                      <Badge variant="outline">
                        {reg.status === 'CONFIRMED' ? 'Confirmed' : 
                         reg.status === 'ATTENDED' ? 'Attended' : 
                         reg.status === 'CANCELED_BY_USER' || reg.status === 'CANCELED_BY_ADMIN' ? 'Cancelled' : 'Waitlisted'}
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {registrations.length > 5 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <Link href={`/events/${event.id}/registrations`}>
                      View All Registrations
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{format(eventDate, "MMMM d, yyyy")}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3.5 w-3.5" /> 
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{event.location}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users size={16} className="text-muted-foreground mt-0.5" />
                <div className="w-full">
                  <div className="font-medium flex justify-between w-full">
                    <span>{event.registered} registered</span>
                    {event.capacity && <span>{event.capacity} capacity</span>}
                  </div>
                  
                  {event.capacity && (
                    <div className="w-full mt-2">
                      <Progress 
                        value={calculateCapacityPercentage()} 
                        className="h-1.5" 
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={cn(
                          calculateCapacityPercentage() >= 90 
                            ? "text-rose-500" 
                            : calculateCapacityPercentage() >= 75 
                              ? "text-amber-500" 
                              : "text-emerald-500"
                        )}>
                          {calculateCapacityPercentage()}% filled
                        </span>
                        <span className="text-muted-foreground">
                          {event.capacity - event.registered} spots left
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {event.registrationDeadline && (
                <div className="flex items-start gap-3">
                  <CornerDownRight size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Registration Deadline</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(event.registrationDeadline), "MMMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Event Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" asChild>
                <Link href={`/events/${event.id}/registrations`}>
                  Manage Registrations
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/events/${event.id}/email`}>
                  Email Attendees
                </Link>
              </Button>
              
              {!isPastEvent && !isCanceledEvent && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/events/${event.id}/export`}>
                    Export Attendee List
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Event Visibility Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Visibility</CardTitle>
              <CardDescription>
                Control who can see and register for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {event.isPrivate ? "Private Event" : "Public Event"}
                </div>
                <Badge variant="outline">
                  {event.isPrivate ? "Members Only" : "Open to Public"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {event.isPrivate 
                  ? "This event is only visible to members and requires authentication to register."
                  : "This event is publicly visible and anyone can register."
                }
              </p>
              
              {!isPastEvent && !isCanceledEvent && event.isPrivate === false && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      window.open(`/discover-events/${event.id}`, '_blank');
                    }}
                  >
                    View Public Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
              All registrations will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Cancel confirmation dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this event? 
              All attendees will be notified of the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>No, Keep Event</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCanceling}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isCanceling ? "Canceling..." : "Yes, Cancel Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
} 