import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Edit, Trash, Ban } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Event } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Link from "next/link";

interface EventCardProps {
  event: Event;
  className?: string;
  onStatusChange?: () => void;
}

export function EventCard({ event, className, onStatusChange }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  const registrationPercentage = event.capacity 
    ? Math.round((event.registered / event.capacity) * 100)
    : 0;
  
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
      onStatusChange?.();
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
      onStatusChange?.();
    } catch (error: any) {
      toast.error('Failed to cancel event', { description: error.message });
    } finally {
      setIsCanceling(false);
      setIsCancelDialogOpen(false);
    }
  };
  
  return (
    <>
      <Card className={cn(
        "overflow-hidden group border-border/40 bg-card/40 backdrop-blur-md",
        "hover:border-primary/20 transition-all duration-300",
        className
      )}>
        {event.image && (
          <div className="h-40 w-full overflow-hidden">
            <div 
              className="h-full w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
              style={{ backgroundImage: `url(${event.image})` }}
            />
          </div>
        )}
        
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-normal",
                  event.status === "upcoming" ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/20" : 
                  event.status === "past" ? "bg-gray-500/20 text-gray-400 hover:bg-gray-500/20" :
                  "bg-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                )}
              >
                {event.status === "upcoming" ? "Upcoming" : 
                event.status === "past" ? "Past" : "Canceled"}
              </Badge>
              
              {event.status === "upcoming" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      asChild
                    >
                      <Link href={`/events/${event.id}/edit`}>
                        Edit Event
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsCancelDialogOpen(true)}
                      className="text-amber-500"
                    >
                      Cancel Event
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-rose-500"
                    >
                      Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {event.description}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-muted-foreground" />
              <span>{format(new Date(event.date), "MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-muted-foreground" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users size={14} className="text-muted-foreground" />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span>{event.registered} registered</span>
                  <span>{event.capacity || '∞'} capacity</span>
                </div>
                {event.capacity > 0 && (
                  <Progress 
                    value={registrationPercentage} 
                    className="h-1" 
                    style={{
                      "--progress-fill": registrationPercentage >= 90 
                        ? "var(--rose-500)" 
                        : registrationPercentage >= 75 
                          ? "var(--amber-500)" 
                          : "var(--emerald-500)"
                    } as React.CSSProperties}
                  />
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="w-full bg-[#4EA8DE] hover:bg-[#4EA8DE]/90" 
              disabled={event.status !== "upcoming"}
              asChild
            >
              <Link href={`/events/${event.id}`}>
                {event.status === "upcoming" ? "View Details" : "View Recap"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
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
    </>
  );
}