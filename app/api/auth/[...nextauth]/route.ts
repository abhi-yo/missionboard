import NextAuth, { AuthOptions, User as NextAuthUserOriginal } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { /* MemberRole, */ MemberStatus } from "@/lib/generated/prisma";
import type { User as PrismaUserType } from "@/lib/generated/prisma";

// Extend NextAuth User and Session types to include our custom fields
declare module "next-auth" {
  interface User extends Partial<Omit<PrismaUserType, 'id'| 'email'| 'name'| 'image'>> { 
    id: string; 
    // role?: MemberRole; // Removed
    status?: MemberStatus;
  }
  interface Session {
    user?: User & NextAuthUserOriginal;
  }
}

// Add this declare module for JWT
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    // role?: MemberRole; // Removed
    status?: MemberStatus;
    accessToken?: string;
    //picture?: string;
  }
}

if (!process.env.GITHUB_ID || !process.env.GITHUB_SECRET) {
  throw new Error("Missing GITHUB_ID or GITHUB_SECRET environment variables");
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google authentication is configured but missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable");
}

console.log("[DEBUG] NEXTAUTH_URL in authOptions:", process.env.NEXTAUTH_URL);

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Always allow sign in. User creation is handled by the adapter.
      // The Prisma adapter and schema default (User.role @default(ADMIN))
      // will handle setting the role for new users.
      if (user && user.email) {
        try {
          console.log(`[DEBUG] Sign in attempt for user with email: ${user.email}`);
          // The Prisma adapter handles user creation or lookup.
          // If it's a new user, the schema default for 'role' (ADMIN) will apply.
          // If it's an existing user, their existing role will be used.
          // No explicit role update is needed here for new users anymore.
          
          // Removed the block that checked for !existingUser and updated role to MemberRole.member
          // const existingUser = await prisma.user.findUnique({ ... });
          // if (!existingUser) { ... await prisma.user.update({ data: { role: MemberRole.member ... } }) ... }

        } catch (error) {
          console.error("[ERROR] Error during signIn (logging only, not critical for flow):", error);
        }
      }
      return true; // Always allow sign-in
    },
    async jwt({ token, user, account, trigger, session: updateSessionData }) {
      console.log("[DEBUG] JWT: Enter", { token: JSON.parse(JSON.stringify(token)), user: JSON.parse(JSON.stringify(user || {})), account: JSON.parse(JSON.stringify(account || {})), trigger, updateSessionData: JSON.parse(JSON.stringify(updateSessionData || {})) });

      // Case 1: Initial Sign-in
      if (account && user && user.id) {
        console.log("[DEBUG] JWT: Initial sign-in path. User from callback:", JSON.parse(JSON.stringify(user)));
        
        // Get provider-specific ID (ensures unique users across providers)
        const providerAccountId = account.providerAccountId;
        const provider = account.provider;
        
        console.log(`[DEBUG] JWT: Provider: ${provider}, ProviderAccountId: ${providerAccountId}`);
        
        // Find the user account by provider details
        const accountEntry = await prisma.account.findFirst({
          where: {
            provider: provider,
            providerAccountId: providerAccountId,
          },
          include: {
            user: true,
          },
        });
        
        if (accountEntry && accountEntry.user) {
          console.log("[DEBUG] JWT: Found matching account and user:", JSON.parse(JSON.stringify(accountEntry.user)));
          token.id = accountEntry.user.id;
          token.name = accountEntry.user.name;
          token.email = accountEntry.user.email;
          token.picture = accountEntry.user.image;
          // token.role = accountEntry.user.role; // Removed
          token.status = accountEntry.user.status;
        } else if (user) {
          // Fallback to direct user lookup for compatibility
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          if (dbUser) {
            console.log("[DEBUG] JWT: dbUser found during initial sign-in:", JSON.parse(JSON.stringify(dbUser)));
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.image;
            // token.role = dbUser.role; // Removed
            token.status = dbUser.status;
          } else {
            console.error("[DEBUG] JWT: CRITICAL - dbUser not found in initial sign-in for id:", user.id);
          }
        }
        
        console.log("[DEBUG] JWT: Token populated after initial sign-in:", JSON.parse(JSON.stringify(token)));
        return token;
      }

      // Case 2: Session update triggered (e.g., by client calling useSession().update())
      if (trigger === "update" && updateSessionData) {
        // Update token with the new session data
        // if (updateSessionData.role) { // Removed
        //   token.role = updateSessionData.role; // Removed
        // } // Removed
        if (updateSessionData.status) {
          token.status = updateSessionData.status;
        }
        console.log("[DEBUG] JWT: Token updated from session update:", JSON.parse(JSON.stringify(token)));
        return token;
      }

      // Case 3: Subsequent JWT access (token already exists)
      // Attempt to "repair" token if role or status is missing but we have an id.
      // This can happen if user signed in before these fields were correctly populated.
      if (token && token.id && (/* token.role === undefined || */ token.status === undefined)) { // Adjusted condition
        console.log("[DEBUG] JWT: Token exists but status is missing. Attempting to fetch from DB for user ID:", token.id);
        const dbUser = await prisma.user.findUnique({ where: { id: token.id } });
        if (dbUser) {
          console.log("[DEBUG] JWT: dbUser found for repair:", JSON.parse(JSON.stringify(dbUser)));
          // token.role = dbUser.role; // Removed
          token.status = dbUser.status;
          // Also ensure other core fields are up-to-date if they could change
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          console.log("[DEBUG] JWT: Token after repair attempt:", JSON.parse(JSON.stringify(token)));
        } else {
          console.warn("[DEBUG] JWT: dbUser not found during repair attempt for ID:", token.id);
        }
      }
      
      // For non-update triggers, always check for latest user data
      if (token.id && trigger !== "update") {
        try {
          const latestUser = await prisma.user.findUnique({ 
            where: { id: token.id },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              // role: true, // Removed
              status: true
            }
          });
          
          if (latestUser) {
            // Update role and status from database
            // token.role = latestUser.role; // Removed
            token.status = latestUser.status;
            token.name = latestUser.name;
            token.email = latestUser.email;
            token.picture = latestUser.image;
            console.log("[DEBUG] JWT: Token updated with latest user data:", JSON.parse(JSON.stringify(token)));
          }
        } catch (error) {
          console.error("[ERROR] Failed to fetch latest user data:", error);
        }
      }
      
      console.log("[DEBUG] JWT: Returning token for subsequent access:", JSON.parse(JSON.stringify(token)));
      return token;
    },
    async session({ session, token }) {
        console.log("[DEBUG] Session: Enter", { session: JSON.parse(JSON.stringify(session)), token: JSON.parse(JSON.stringify(token)) });
        
        if (!session.user) {
            console.warn("[DEBUG] Session: session.user was initially undefined. Initializing.");
            session.user = { id: "", name: null, email: null, image: null }; 
        }

        session.user.id = token.id || token.sub || ""; 
        session.user.name = token.name || null; 
        session.user.email = token.email || null; 
        session.user.image = token.picture || null; 
        // session.user.role = token.role; // Removed
        session.user.status = token.status; 
            
        if (!token.id && !token.sub) {
            console.error("[DEBUG] Session: CRITICAL - Both token.id and token.sub are undefined. Session user ID defaulted to empty string.");
        }
        if (/*token.role === undefined ||*/ token.status === undefined) { // Adjusted condition
            console.warn("[DEBUG] Session: Status is undefined in the token when populating session. Token:", JSON.parse(JSON.stringify(token)));
        }
        
        console.log("[DEBUG] Session: After enhancement:", JSON.parse(JSON.stringify(session)));
        return session;
      },
  },
  events: {
    async createUser(message) {
      console.log("[DEBUG] CreateUser event triggered for user:", message.user.id);
      if (message.user && message.user.id) {
        try {
          await prisma.organization.create({
            data: {
              name: `${message.user.name || 'New User'}'s Organization`,
              adminId: message.user.id,
            },
          });
          console.log(`[DEBUG] Organization created for user: ${message.user.id}`);
        } catch (error) {
          console.error(`[ERROR] Failed to create organization for user ${message.user.id}:`, error);
        }
      }
    },
    async signOut({ session, token }) {
      console.log("[DEBUG] SignOut event triggered", { session, token });
    },
    async updateUser({ user }) {
      console.log("[DEBUG] User updated event:", user);
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 