"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users } from 'lucide-react';
import { type Event } from "@/lib/generated/prisma"; // Assuming Event type from Prisma

interface UpcomingEventsListProps {
  limit?: number;
}

export function UpcomingEventsList({ limit = 4 }: UpcomingEventsListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // TODO: Adjust API endpoint and query params as needed
        const response = await fetch(`/api/events?limit=${limit}&status=SCHEDULED&sortBy=date&sortOrder=asc`);
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming events');
        }
        const data = await response.json();
        setEvents(data.events || data); // Adjust based on actual API response structure
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [limit]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4 text-center">Loading events...</div>;
  }

  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center">No upcoming events scheduled.</div>;
  }

  return (
    <div className="space-y-2 flex flex-col h-full">
      <div className="flex-grow space-y-3">
        {events.map(event => (
          <Link href={`/events/${event.id}`} key={event.id} className="block hover:bg-accent/50 p-2.5 rounded-md transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{event.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              {/* Attendee count removed for now pending API/type update */}
            </div>
          </Link>
        ))}
      </div>
      {events.length > 0 && (
         <Button variant="outline" size="sm" className="w-full mt-auto" asChild>
            <Link href="/events">View All Events</Link>
         </Button>
      )}
    </div>
  );
} 