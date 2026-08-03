import { Skeleton } from "@/components/ui/skeleton"

export function LoadingSkeleton({ type = "list" }: { type?: "list" | "cards" | "dashboard" }) {
  if (type === "cards") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in-50">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (type === "dashboard") {
    return (
      <div className="space-y-6 animate-in fade-in-50">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  // default list
  return (
    <div className="space-y-4 animate-in fade-in-50">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  )
}
