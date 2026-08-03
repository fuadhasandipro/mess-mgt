import { AlertCircle, RefreshCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function ErrorState({ message, onRetry }: { message: string, onRetry?: () => void }) {
  return (
    <div className="flex justify-center p-4">
      <Alert variant="destructive" className="max-w-md w-full">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
          {onRetry && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 bg-background/50">
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
