import React from "react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  text?: string;
}

/**
 * Reusable LoadingSpinner component for consistent loading states.
 * Supports different sizes and optional text.
 */
export function LoadingSpinner({ 
  size = "md", 
  text, 
  className, 
  ...props 
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-4",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-12 space-y-4",
        className
      )} 
      {...props}
    >
      <div 
        className={cn(
          "animate-spin rounded-full border-indigo-600 border-t-transparent",
          sizes[size]
        )} 
      />
      {text && (
        <p className="text-neutral-500 font-medium text-sm">
          {text}
        </p>
      )}
    </div>
  );
}
