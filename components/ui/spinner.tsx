import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
  showText?: boolean
}

export function Spinner({ 
  className, 
  size = "md", 
  text = "Cargando...",
  showText = true 
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 
        className={cn(
          "animate-spin text-muted-foreground",
          sizeClasses[size]
        )} 
        role="status"
        aria-label="Loading"
      />
      {showText && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  )
}

// Para compatibilidad con el uso anterior
function SpinnerLegacy({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin text-muted-foreground', className)}
      {...props}
    />
  )
}

export { SpinnerLegacy as SpinnerCompat }
