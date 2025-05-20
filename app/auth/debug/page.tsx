"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    // Check and log cookies
    const cookieList = document.cookie.split(';').map(c => c.trim());
    setCookies(cookieList);
    
    console.log("[DEBUG PAGE] Session status:", status);
    console.log("[DEBUG PAGE] Session data:", session);
  }, [session, status]);

  const testFetch = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setTestResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <PageContainer>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Auth Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Session Status</h3>
              <div className="p-3 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap break-all text-xs">
                  {status}
                </pre>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Session Data</h3>
              <div className="p-3 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap break-all text-xs">
                  {session ? JSON.stringify(session, null, 2) : "No session"}
                </pre>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Cookies</h3>
            <div className="p-3 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap break-all text-xs">
                {cookies.map((cookie, i) => (
                  <div key={i}>{cookie}</div>
                ))}
              </pre>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => signIn()}>Sign In</Button>
            <Button onClick={() => signOut()} variant="outline">Sign Out</Button>
            <Button onClick={testFetch} variant="secondary">Test Session API</Button>
          </div>

          {testResult && (
            <div>
              <h3 className="text-lg font-medium mb-2">API Test Result</h3>
              <div className="p-3 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap break-all text-xs">
                  {testResult}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
} 