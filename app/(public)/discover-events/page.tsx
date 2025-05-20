"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer } from "@/components/layout/page-container";
import { Search, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  organizer: string;
  capacity: number | null;
  registered: number;
  registrationDeadline: string | null;
  image: string;
  slug: string;
  isFull: boolean;
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/public/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events when search term changes
  useEffect(() => {
    const filtered = events.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEvents(filtered);
  }, [searchTerm, events]);

  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Upcoming Events</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover and register for our upcoming events. Find something that interests you and secure your spot today.
          </p>
        </div>

        <div className="relative mb-8 max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search events by name, description or location..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col">
                <Skeleton className="h-48 w-full rounded-t-xl" />
                <div className="p-5 space-y-3 border border-t-0 rounded-b-xl">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="pt-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-rose-500 py-8">
            Failed to load events: {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            {searchTerm ? (
              <div className="space-y-3">
                <p className="text-xl">No events match your search</p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>Clear Search</Button>
              </div>
            ) : (
              <p className="text-xl">No upcoming events at the moment. Check back soon!</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function EventCard({ event }: { event: PublicEvent }) {
  const eventDate = new Date(event.date);
  
  return (
    <div className="group flex flex-col h-full overflow-hidden rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-md">
      <div className="relative h-48 w-full overflow-hidden">
        <div 
          className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundImage: `url(${event.image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
          <p className="text-white text-sm font-medium">
            {format(eventDate, 'MMMM d, yyyy')}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 p-5 space-y-4">
        <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
        
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2 mt-auto">
          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="flex-shrink-0 text-muted-foreground" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="flex-shrink-0 text-muted-foreground" />
            <span>{format(eventDate, "h:mm a")}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users size={14} className="flex-shrink-0 text-muted-foreground" />
            <div className="flex-1">
              {event.capacity ? (
                <div className="flex justify-between text-xs mb-1">
                  <span>{event.registered} registered</span>
                  <span>{event.capacity} capacity</span>
                </div>
              ) : (
                <span>Unlimited capacity</span>
              )}
              
              {event.capacity && (
                <div className="w-full bg-muted rounded-full h-1">
                  <div 
                    className={cn(
                      "h-1 rounded-full",
                      event.isFull 
                        ? "bg-rose-500" 
                        : event.registered / event.capacity > 0.75 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, (event.registered / event.capacity) * 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Link href={`/discover-events/${event.slug}`} passHref>
          <Button 
            className="w-full" 
            variant={event.isFull ? "outline" : "default"}
            disabled={event.isFull}
          >
            {event.isFull ? 'Waitlist Only' : 'Register Now'}
          </Button>
        </Link>
        
        {event.isFull && (
          <p className="text-center text-xs text-muted-foreground">
            Event is full. Join waitlist.
          </p>
        )}
        
        {event.registrationDeadline && new Date() > new Date(event.registrationDeadline) && (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-500">
            Registration Closed
          </Badge>
        )}
      </div>
    </div>
  );
} 