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
  ShieldCheck, 
  CornerDownRight,
  ChevronLeft
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  date: string;
  formattedDate: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  locationDetails: string | null;
  organizer: string;
  organizerImage: string | null;
  capacity: number | null;
  registered: number;
  registrationDeadline: string | null;
  image: string;
  isFull: boolean;
  hasDeadlinePassed: boolean;
}

// Registration form schema
const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  guestsCount: z.coerce.number().min(0).max(10, "Maximum 10 guests allowed"),
  notes: z.string().optional(),
});

export default function EventDetail({ params }: { params: { slug: string } }) {
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<'none' | 'processing' | 'success' | 'error'>('none');
  
  const router = useRouter();

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      guestsCount: 0,
      notes: "",
    },
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/public/events/${params.slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event details");
          }
          return;
        }
        
        const data = await response.json();
        setEvent(data);
      } catch (error) {
        setError("An error occurred while fetching event details");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [params.slug]);

  const handleRegister = () => {
    if (!event) return;
    
    if (event.hasDeadlinePassed) {
      toast.error("Registration Closed", {
        description: "The registration deadline for this event has passed."
      });
      return;
    }
    
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof registrationSchema>) => {
    if (!event) return;
    
    setRegistrationStatus('processing');
    
    try {
      const response = await fetch(`/api/public/events/${event.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setRegistrationStatus('error');
        toast.error("Registration Failed", {
          description: data.error || "Failed to register for the event."
        });
        return;
      }
      
      setRegistrationStatus('success');
      toast.success("Registration Successful", {
        description: "You're all set for the event!"
      });
      
      setIsDialogOpen(false);
      
      // If it was a waitlist registration
      if (data.registration?.status === 'waitlisted') {
        toast.info("Added to Waitlist", {
          description: "The event is full, but you've been added to the waitlist."
        });
      }
      
      // Reset form
      form.reset();
      
    } catch (error) {
      setRegistrationStatus('error');
      toast.error("Registration Failed", {
        description: "An unexpected error occurred. Please try again."
      });
      console.error(error);
    } finally {
      setRegistrationStatus('none');
    }
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link 
            href="/discover-events" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={18} className="mr-1" />
            <span>Back to Events</span>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4 max-w-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Skeleton className="h-[400px] w-full rounded-xl" />
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-rose-500 mb-2">{error}</h2>
            <p className="text-muted-foreground mb-6">We couldn&apos;t find the event you&apos;re looking for.</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/discover-events')}
            >
              View All Events
            </Button>
          </div>
        ) : event ? (
          <>
            <div className="space-y-8">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{event.title}</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main content - left 2/3 */}
                <div className="md:col-span-2 space-y-6">
                  <div className="relative h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden border border-border/60">
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${event.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  
                  {/* Organizer info */}
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {event.organizerImage ? (
                        <Image 
                          src={event.organizerImage} 
                          alt={event.organizer} 
                          width={48} 
                          height={48} 
                          className="object-cover"
                        />
                      ) : (
                        <ShieldCheck className="text-muted-foreground h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Organized by</div>
                      <div className="font-medium">{event.organizer}</div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Event description */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">About this event</h2>
                    <div className="text-muted-foreground whitespace-pre-line">
                      {event.description || "No description provided for this event."}
                    </div>
                  </div>
                  
                  {event.locationDetails && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">Location Details</h2>
                      <div className="text-muted-foreground whitespace-pre-line">
                        {event.locationDetails}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sidebar - right 1/3 */}
                <div className="space-y-6">
                  <div className="bg-card rounded-xl overflow-hidden border shadow-sm">
                    <div className="p-6 space-y-4">
                      {/* Date & Time */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{event.formattedDate}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3.5 w-3.5" /> 
                            <span>{event.startTime}</span>
                            {event.endTime && (
                              <>
                                <span>-</span>
                                <span>{event.endTime}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Location */}
                      {event.location && (
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{event.location}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Capacity */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {event.capacity 
                              ? `${event.registered} / ${event.capacity} registered`
                              : "Unlimited capacity"}
                          </div>
                          
                          {event.capacity && (
                            <div className="w-full mt-2">
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div 
                                  className={cn(
                                    "h-1.5 rounded-full",
                                    event.isFull 
                                      ? "bg-rose-500" 
                                      : event.registered / event.capacity > 0.75 
                                        ? "bg-amber-500" 
                                        : "bg-emerald-500"
                                  )}
                                  style={{ width: `${Math.min(100, (event.registered / event.capacity) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Registration Deadline */}
                      {event.registrationDeadline && (
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <CornerDownRight className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">Registration Deadline</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(event.registrationDeadline), "MMMM d, yyyy 'at' h:mm a")}
                            </div>
                            {event.hasDeadlinePassed && (
                              <Badge variant="outline" className="mt-2 bg-rose-500/10 text-rose-500">
                                Registration Closed
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 pt-0">
                      <Button 
                        onClick={handleRegister}
                        disabled={event.hasDeadlinePassed}
                        className="w-full" 
                        variant={event.isFull ? "outline" : "default"}
                      >
                        {event.isFull 
                          ? 'Join Waitlist' 
                          : 'Register Now'}
                      </Button>
                      
                      {event.isFull && (
                        <p className="text-center text-xs text-muted-foreground mt-2">
                          This event is full. You can join the waitlist in case spots open up.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Registration Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{event.isFull ? 'Join Waitlist' : 'Register for Event'}</DialogTitle>
                  <DialogDescription>
                    {event.isFull 
                      ? "This event is currently full. Complete this form to join the waitlist."
                      : "Fill out your information to register for this event."}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Your contact number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="guestsCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of additional guests</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="10" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Any special requirements or notes for the organizer" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter className="pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={registrationStatus === 'processing'}
                      >
                        {registrationStatus === 'processing' 
                          ? 'Submitting...' 
                          : event.isFull 
                            ? 'Join Waitlist'
                            : 'Complete Registration'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        ) : null}
      </div>
    </PageContainer>
  );
} 