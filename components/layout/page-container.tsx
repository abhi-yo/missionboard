import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  showNewButton?: boolean;
  newButtonLabel?: string;
  newButtonLink?: string;
}

export function PageContainer({
  children,
  className,
  title,
  description,
  showNewButton,
  newButtonLabel = "New",
  newButtonLink = "#"
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        "px-4 py-5 max-w-7xl mx-auto space-y-6",
        className
      )}
    >
      {(title || description || showNewButton) && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col space-y-1.5">
            {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>
          
          {showNewButton && (
            <Button asChild>
              <Link href={newButtonLink}>{newButtonLabel}</Link>
            </Button>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}