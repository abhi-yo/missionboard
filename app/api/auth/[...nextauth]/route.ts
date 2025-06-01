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
      if (user && user.email) {
        try {
          return true;
        } catch (error) {
          console.error("[ERROR] Error during signIn:", error);
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session: updateSessionData }) {
      if (account && user && user.id) {
        const providerAccountId = account.providerAccountId;
        const provider = account.provider;
        
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
          token.id = accountEntry.user.id;
          token.name = accountEntry.user.name;
          token.email = accountEntry.user.email;
          token.picture = accountEntry.user.image;
          token.status = accountEntry.user.status;
        } else if (user) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.picture = dbUser.image;
            token.status = dbUser.status;
          }
        }
        return token;
      }

      if (trigger === "update" && updateSessionData) {
        if (updateSessionData.status) {
          token.status = updateSessionData.status;
        }
        return token;
      }

      if (token && token.id && token.status === undefined) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id } });
        if (dbUser) {
          token.status = dbUser.status;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
        }
      }
      
      if (token.id && trigger !== "update") {
        try {
          const latestUser = await prisma.user.findUnique({ 
            where: { id: token.id },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              status: true
            }
          });
          
          if (latestUser) {
            token.status = latestUser.status;
            token.name = latestUser.name;
            token.email = latestUser.email;
            token.picture = latestUser.image;
          }
        } catch (error) {
          console.error("[ERROR] Failed to fetch latest user data:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = { id: "", name: null, email: null, image: null }; 
      }

      session.user.id = token.id || token.sub || ""; 
      session.user.name = token.name || null; 
      session.user.email = token.email || null; 
      session.user.image = token.picture || null; 
      session.user.status = token.status; 
      
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
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 