import React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Reusable Card component with consistent styling.
 * Used for wrapping content in a rounded, bordered, and shadowed container.
 */
export function Card({ 
  children, 
  className, 
  padding = "md",
  ...props 
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden",
        paddingClasses[padding],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
}
