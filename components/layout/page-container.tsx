import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div 
      className={cn(
        "px-4 py-5 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}