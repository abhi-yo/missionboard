'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { BillingInterval } from '@/lib/generated/prisma';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { createApiUrl } from "@/lib/api-utils";

// Helper to get enum keys for select options
const billingIntervalOptions = Object.keys(BillingInterval).map(key => ({
  value: key as BillingInterval,
  label: key.charAt(0) + key.slice(1).toLowerCase(), // E.g., MONTHLY -> Monthly
}));

export default function NewPlanPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>(0);
  const [currency, setCurrency] = useState('USD');
  const [interval, setInterval] = useState<BillingInterval | ''>(BillingInterval.MONTHLY);
  const [features, setFeatures] = useState<string[]>([]);
  const [currentFeature, setCurrentFeature] = useState('');
  const [active, setActive] = useState(true);
  const [stripePriceId, setStripePriceId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[] | undefined> | null>(null);

  const handleAddFeature = () => {
    if (currentFeature.trim() !== '' && !features.includes(currentFeature.trim())) {
      setFeatures([...features, currentFeature.trim()]);
      setCurrentFeature('');
    }
  };

  const handleRemoveFeature = (featureToRemove: string) => {
    setFeatures(features.filter(feature => feature !== featureToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiErrors(null);

    if (price === '' || price < 0) {
        setApiErrors({ price: ["Price must be a positive number"]});
        setIsSubmitting(false);
        return;
    }

    const planData = {
      name,
      description: description || null,
      price: Number(price), // Ensure price is a number
      currency,
      interval,
      features,
      active,
      stripePriceId: stripePriceId || null,
    };

    try {
      const res = await fetch(createApiUrl('/plans'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 400 && errorData.errors) {
          setApiErrors(errorData.errors);
          const errorMessages = Object.values(errorData.errors).flat().join("; ");
          toast.error('Validation failed', { description: errorMessages });
        } else {
          const message = errorData.message || 'Failed to create plan';
          setApiErrors({ form: [message] });
          toast.error('Error creating plan', { description: message });
        }
        return;
      }

      toast.success(`Plan "${name}" created successfully!`);
      router.push('/plans');
      router.refresh(); // To ensure the list on /plans is updated if it was cached client-side
    } catch (error) {
      console.error("Error creating plan:", error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setApiErrors({ form: [message] });
      toast.error('An error occurred', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add New Membership Plan</h1>
        <Link href="/plans">
            <Button variant="outline">Back to Plans</Button>
        </Link>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>Fill in the information for the new membership plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {apiErrors?.form && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{apiErrors.form.join(', ')}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                {apiErrors?.name && <p className="text-sm text-destructive mt-1">{apiErrors.name.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} required min="0" step="0.01" />
                {apiErrors?.price && <p className="text-sm text-destructive mt-1">{apiErrors.price.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} required />
                 {apiErrors?.currency && <p className="text-sm text-destructive mt-1">{apiErrors.currency.join(', ')}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Billing Interval</Label>
                <Select value={interval} onValueChange={(value) => setInterval(value as BillingInterval)} required>
                  <SelectTrigger id="interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    {billingIntervalOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {apiErrors?.interval && <p className="text-sm text-destructive mt-1">{apiErrors.interval.join(', ')}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional: A brief description of the plan" />
              {apiErrors?.description && <p className="text-sm text-destructive mt-1">{apiErrors.description.join(', ')}</p>}
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2 mb-2">
                <Input 
                  value={currentFeature} 
                  onChange={(e) => setCurrentFeature(e.target.value)} 
                  placeholder="Add a feature"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                />
                <Button type="button" variant="outline" onClick={handleAddFeature}>Add Feature</Button>
              </div>
              <div className="space-y-1">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <span>{feature}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFeature(feature)}>Remove</Button>
                  </div>
                ))}
                 {features.length === 0 && <p className="text-xs text-muted-foreground">No features added yet.</p>}
              </div>
              {apiErrors?.features && <p className="text-sm text-destructive mt-1">{apiErrors.features.join(', ')}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripePriceId">Stripe Price ID (Optional)</Label>
              <Input id="stripePriceId" value={stripePriceId} onChange={(e) => setStripePriceId(e.target.value)} placeholder="price_xxxxxxxxxxxxxx"/>
              {apiErrors?.stripePriceId && <p className="text-sm text-destructive mt-1">{apiErrors.stripePriceId.join(', ')}</p>}
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="active" checked={active} onCheckedChange={(checked) => setActive(checked as boolean)} />
                <Label htmlFor="active" className="font-normal">
                    Set plan as active
                </Label>
            </div>
             {apiErrors?.active && <p className="text-sm text-destructive mt-1">{apiErrors.active.join(', ')}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/plans">
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </Link>
              <Button type="submit" className="bg-[#AD49E1] hover:bg-[#AD49E1]/90" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Plan...' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
} 