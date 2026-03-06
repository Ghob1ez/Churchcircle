import React from "react";
import { cn } from "../../lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/**
 * Reusable PageHeader component for consistent page titles and subtitles.
 * Supports an optional action button or element on the right.
 */
export function PageHeader({ 
  title, 
  subtitle, 
  action, 
  className, 
  ...props 
}: PageHeaderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8",
        className
      )} 
      {...props}
    >
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-neutral-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 w-full md:w-auto">
          {action}
        </div>
      )}
    </div>
  );
}
