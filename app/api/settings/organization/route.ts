import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for organization settings, aligning with Organization model
// Assuming Organization model has: name, (optional) contactEmail, (optional) contactPhone, (optional) website
// And potentially other settings like autoRenew, gracePeriod if you add them to the Organization model.
// For now, let's focus on name and make others optional.
const organizationSettingsSchema = z.object({
  name: z.string().min(1, { message: "Organization name is required" }),
  // Add other fields from your Organization model that you want to be updatable here
  // For example:
  // contactEmail: z.string().email({ message: "Invalid contact email" }).optional().or(z.literal('')),
  // contactPhone: z.string().optional().or(z.literal('')),
  // website: z.string().url({ message: "Invalid website URL" }).optional().or(z.literal('')),
});

export async function GET() {
  try {
    console.log("[/api/settings/organization GET] Fetching organization settings");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("[/api/settings/organization GET] Unauthorized: No session or user ID");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const organization = await prisma.organization.findUnique({
      where: { adminId: session.user.id },
      // Select the fields you want to return
      select: {
        name: true,
        // id: true, // if needed by the client
        // contactEmail: true, 
        // contactPhone: true,
        // website: true,
        // any other settings fields from Organization model
      }
    });

    if (!organization) {
      console.log(`[/api/settings/organization GET] No organization found for admin ID: ${session.user.id}. Returning default structure.`);
      // Return a default structure or indicate no organization is set up
      // This helps the frontend display an empty form rather than erroring out
      return NextResponse.json({ name: '' /* other fields as null or default */ });
    }

    console.log("[/api/settings/organization GET] Returning settings:", organization);
    return NextResponse.json(organization);
  } catch (error) {
    console.error("[/api/settings/organization GET] Error:", error);
    return NextResponse.json({ message: "Failed to fetch organization settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("[/api/settings/organization POST] Updating/Creating organization settings");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("[/api/settings/organization POST] Unauthorized: No session or user ID");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = organizationSettingsSchema.safeParse(body);

    if (!validation.success) {
      console.log("[/api/settings/organization POST] Validation failed:", validation.error.errors);
      return NextResponse.json({ 
        message: "Invalid organization settings", 
        errors: validation.error.errors 
      }, { status: 400 });
    }

    const { name /*, contactEmail, contactPhone, website */ } = validation.data; // Destructure validated data
    const orgDataToSave = {
      name,
      // contactEmail: contactEmail || null,
      // contactPhone: contactPhone || null,
      // website: website || null,
      // any other fields from validation.data
    };

    // Upsert organization: update if exists, create if not
    // This ensures an organization is created if it's the first time settings are saved
    // and correctly links it to the admin user.
    const updatedOrCreatedOrganization = await prisma.organization.upsert({
      where: { adminId: session.user.id },
      update: orgDataToSave,
      create: {
        ...orgDataToSave,
        adminId: session.user.id, // Crucial: links the org to the user
      },
    });

    console.log("[/api/settings/organization POST] Settings updated/created successfully for org ID:", updatedOrCreatedOrganization.id);
    return NextResponse.json({ message: "Organization settings updated successfully", organization: updatedOrCreatedOrganization });
  } catch (error) {
    console.error("[/api/settings/organization POST] Error:", error);
    if (error instanceof z.ZodError) { // Should be caught by safeParse, but good practice
        return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    // Handle potential Prisma errors, e.g., unique constraint if adminId wasn't unique (though it should be)
    return NextResponse.json({ message: "Failed to update organization settings" }, { status: 500 });
  }
} 