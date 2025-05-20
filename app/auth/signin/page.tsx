"use client"

import type React from "react"

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

// Define a type for the provider details we expect
interface ProviderButtonProps {
  id: string
  name: string
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, ProviderButtonProps> | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  useEffect(() => {
    ;(async () => {
      const res = await getProviders()
      console.log("[DEBUG] Auth providers:", res)
      // Filter for GitHub or other OAuth providers you might add
      const oauthProviders: Record<string, ProviderButtonProps> = {}
      if (res) {
        for (const provider in res) {
          if (res[provider].type === "oauth") {
            // Only include OAuth providers
            oauthProviders[provider] = { id: res[provider].id, name: res[provider].name }
          }
        }
      }
      console.log("[DEBUG] OAuth providers:", oauthProviders)
      setProviders(oauthProviders)
    })()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const buttonVariants = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.98 },
  }

  return (
    <PageContainer className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] p-4">
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-md">
        <Card className="border-zinc-800 bg-zinc-900/90 backdrop-blur-xl shadow-2xl overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/5 to-zinc-900/5 z-0" />

          <CardHeader className="text-center relative z-10 pt-8 pb-4">
            <CardTitle className="text-3xl font-bold text-white">Sign In</CardTitle>
            <CardDescription className="text-base text-zinc-400 mt-2">Sign in to access your dashboard</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-6 px-6 pb-8 relative z-10">
            {providers &&
              Object.values(providers).map((provider) => {
                if (provider.id === "github") {
                  return (
                    <motion.div
                      key={provider.name}
                      className="space-y-2"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        onClick={() => signIn(provider.id, { callbackUrl, redirect: true })}
                        className="w-full gap-3 bg-[#24292e] hover:bg-[#24292e]/90 text-white font-medium py-6 rounded-lg transition-all duration-300 shadow-md"
                      >
                        <Github size={22} /> Sign in with {provider.name}
                      </Button>
                    </motion.div>
                  )
                } else if (provider.id === "google") {
                  return (
                    <motion.div
                      key={provider.name}
                      className="space-y-2"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button
                        onClick={() => signIn(provider.id, { callbackUrl, redirect: true })}
                        className="w-full gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-6 border border-gray-300 rounded-lg transition-all duration-300 shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with {provider.name}
                      </Button>
                    </motion.div>
                  )
                }
                return null
              })}
            {!providers && (
              <div className="flex justify-center py-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-zinc-700 h-10 w-10"></div>
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-3 bg-zinc-700 rounded w-full"></div>
                    <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            )}
            {providers && Object.keys(providers).length === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                </div>
                <p className="text-center text-zinc-400 font-medium">No sign-in methods are currently configured</p>
                <div className="p-4 bg-zinc-800 rounded-lg text-xs font-mono whitespace-pre overflow-auto border border-zinc-700">
                  <p className="font-bold mb-2 text-zinc-300">Debug Information:</p>
                  {JSON.stringify(
                    {
                      currentUrl: typeof window !== "undefined" ? window.location.href : "Server-side rendering",
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2,
                  )}
                </div>
                <Button
                  onClick={() => (window.location.href = "/api/auth/signin/github")}
                  variant="outline"
                  className="w-full gap-2 py-6 mt-2 border-zinc-700 hover:bg-zinc-800 text-white"
                >
                  <Github size={20} /> Force GitHub Auth
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  )
}
