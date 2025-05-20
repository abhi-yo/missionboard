'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: (refreshEvents?: boolean) => void;
}

export function CreateEventDialog({ isOpen, onClose }: CreateEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [eventImageId, setEventImageId] = useState<string | null>(null);
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setEventDate(undefined);
      setEventTime('');
      setLocation('');
      setCapacity('');
      setIsPrivate(false);
      setHasDeadline(false);
      setDeadlineDate(undefined);
      setEventImageId(null);
      setEventImageUrl(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title) {
      toast.error('Please enter an event title');
      return;
    }
    
    if (!eventDate) {
      toast.error('Please select an event date');
      return;
    }
    
    if (!eventTime) {
      toast.error('Please enter an event time');
      return;
    }

    // Format date and time
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventDateTime = new Date(eventDate);
    eventDateTime.setHours(hours, minutes, 0, 0);
    
    const eventData = {
      title,
      description,
      date: eventDateTime.toISOString(),
      location,
      capacity: capacity ? parseInt(capacity) : null,
      isPrivate,
      registrationDeadline: hasDeadline && deadlineDate ? deadlineDate.toISOString() : null,
      eventImageId: eventImageId,
    };
    
    setIsSubmitting(true);
    
    try {
      // Create the event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.message || 'Failed to create event');
      }
      
      const createdEvent = await response.json();
      
      toast.success('Event created successfully');
      onClose(true);
    } catch (error: any) {
      toast.error('Error creating event', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUploaded = (imageId: string, imageUrl: string) => {
    setEventImageId(imageId);
    setEventImageUrl(imageUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Add a new event to your calendar. Fill out the form below with the event details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Event Image</Label>
              <div className="flex justify-center">
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  currentImageUrl={eventImageUrl || undefined}
                  width={500}
                  height={200}
                  aspectRatio={2.5}
                  label="Upload Event Cover Image"
                />
              </div>
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
                      disabled={(date) => date < new Date()}
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
                      disabled={(date) => eventDate ? date > eventDate : date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 