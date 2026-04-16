import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  variant?: "stat" | "company" | "es" | "deadline" | "timeline";
  className?: string;
}

export function SkeletonCard({ variant = "stat", className }: SkeletonCardProps) {
  if (variant === "stat") {
    return (
      <div className={cn("rounded-2xl border border-gray-100 bg-white p-4 space-y-3", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-14 rounded-md" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  if (variant === "company") {
    return (
      <div className={cn("rounded-xl border border-gray-100 bg-white p-5 space-y-3", className)}>
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-20 rounded-md" />
        <Skeleton className="h-3.5 w-full rounded-md" />
      </div>
    );
  }

  if (variant === "es") {
    return (
      <div className={cn("rounded-xl border border-gray-100 bg-white p-4 space-y-2.5", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-40 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
    );
  }

  if (variant === "deadline") {
    return (
      <div className={cn("flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3", className)}>
        <Skeleton className="h-10 w-1 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-20 rounded-md" />
        </div>
        <Skeleton className="h-4 w-10 rounded-md" />
      </div>
    );
  }

  if (variant === "timeline") {
    return (
      <div className={cn("flex items-start gap-3 py-3", className)}>
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-48 rounded-md" />
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
      </div>
    );
  }

  return null;
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} variant="stat" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} variant="deadline" />
        ))}
      </div>
    </div>
  );
}
