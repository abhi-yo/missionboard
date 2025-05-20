"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { EventCard } from "@/components/dashboard/event-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateEventDialog } from "@/components/dashboard/events/create-event-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Event } from "@/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch events
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch events on page load
  useEffect(() => {
    fetchEvents();
  }, []);
  
  // Handle dialog close and refresh events
  const handleDialogClose = (shouldRefresh: boolean) => {
    setIsDialogOpen(false);
    if (shouldRefresh) {
      fetchEvents();
    }
  };
  
  // Filter events by status
  const upcomingEvents = events.filter(event => event.status === "upcoming");
  const pastEvents = events.filter(event => event.status === "past");
  const canceledEvents = events.filter(event => event.status === "canceled");
  
  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-8 w-40 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-[350px] rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <Button 
          className="gap-2 bg-[#4EA8DE] hover:bg-[#4EA8DE]/90"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus size={16} />
          Create Event
        </Button>
      </div>
      
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Upcoming Events</h2>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map(event => (
              <EventCard key={event.id} event={event} onStatusChange={fetchEvents} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No upcoming events scheduled.</p>
        )}
      </section>

      {pastEvents.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map(event => (
              <EventCard key={event.id} event={event} onStatusChange={fetchEvents} />
            ))}
          </div>
        </section>
      )}
      
      {canceledEvents.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">Canceled Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canceledEvents.map(event => (
              <EventCard key={event.id} event={event} onStatusChange={fetchEvents} />
            ))}
          </div>
        </section>
      )}
      
      <CreateEventDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
      />
    </PageContainer>
  );
}