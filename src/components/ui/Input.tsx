import React from "react";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

/**
 * Reusable Input component with consistent styling.
 * Supports labels, error messages, and optional icons.
 */
export function Input({ 
  label, 
  error, 
  icon: Icon, 
  className, 
  ...props 
}: InputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && props.type !== "time" && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        <input
          className={cn(
            "w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-sm",
            Icon && props.type !== "time" && "pl-12",
            error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 ml-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
