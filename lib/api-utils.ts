export function getBaseUrl() {
  // Always use relative URLs in production
  if (typeof window !== 'undefined') {
    // Browser should use relative URL
    return '';
  }

  // SSR should use the deployment URL or localhost
  // Note: We're returning just the path prefix here, not a full URL
  return process.env.NEXT_PUBLIC_APP_URL || '';
}

export function createApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/api${apiPath}`;
}

// Helper for fetch with error handling
export async function fetchApi<T>(
  path: string, 
  options?: RequestInit
): Promise<T> {
  const url = createApiUrl(path);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // Handle status codes like 401, 404, 500
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
} 