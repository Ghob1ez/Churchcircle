import React from "react";
import { cn } from "../../lib/utils";
import { ChevronDown, LucideIcon } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  options: { label: string; value: string }[] | string[];
}

export function Select({ 
  label, 
  error, 
  icon: Icon, 
  options,
  className, 
  ...props 
}: SelectProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        <select
          className={cn(
            "w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-sm appearance-none",
            Icon && "pl-12",
            "pr-10", // Space for custom chevron
            error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
            className
          )}
          {...props}
        >
          {options.map((option) => {
            const label = typeof option === "string" ? option : option.label;
            const value = typeof option === "string" ? option : option.value;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 ml-1 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
