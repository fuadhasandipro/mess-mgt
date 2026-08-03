"use client"

import { useEffect } from "react"
import { ErrorState } from "@/components/shared/error-state"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[50vh] items-center justify-center">
      <ErrorState 
        message={error.message || "Something went wrong while loading this page."} 
        onRetry={reset} 
      />
    </div>
  )
}
