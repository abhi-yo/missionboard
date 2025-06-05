import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface ApiErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export function ApiErrorDisplay({ error, onRetry }: ApiErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 p-6 text-center bg-card rounded-lg border border-muted">
      <div className="mb-4 text-destructive">
        <AlertTriangle className="h-10 w-10 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error || "There was a problem loading the data. Please try again."}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
} 