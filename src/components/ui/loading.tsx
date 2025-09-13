import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
};

export function Loading({ size = "md", text, className }: LoadingProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && (
        <span className="font-txc text-sm text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );
}

export function LoadingSpinner({ size = "md", className }: Omit<LoadingProps, "text">) {
  return <Loading size={size} className={className} />;
}

export function LoadingPage({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="vintage-card p-8 text-center">
        <Loading size="lg" text={text} />
      </div>
    </div>
  );
}
