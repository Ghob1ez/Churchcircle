import React from "react";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
}

/**
 * Reusable Button component with consistent styling.
 * Supports different variants, sizes, and optional icons.
 */
export function Button({ 
  variant = "primary", 
  size = "md", 
  icon: Icon, 
  loading = false, 
  children, 
  className, 
  disabled, 
  ...props 
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-bold transition-all rounded-xl disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700",
    secondary: "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
    outline: "bg-white border border-neutral-200 text-neutral-600 hover:border-indigo-500 hover:text-indigo-600",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
    icon: "p-2",
  };

  return (
    <button 
      className={cn(base, variants[variant], sizes[size], className)} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Icon && (
        <Icon className={cn("h-4 w-4", size === "icon" && "h-5 w-5")} />
      )}
      {children}
    </button>
  );
}
