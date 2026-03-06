import React from "react";
import { cn } from "../../lib/utils";
import { ShieldCheck, ShieldAlert, ShieldQuestion, CheckCircle2, XCircle, Clock3 } from "lucide-react";

type BadgeVariant = "approved" | "denied" | "pending" | "default" | "admin";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  showIcon?: boolean;
}

/**
 * Reusable Badge component for status and roles.
 * Supports different variants with consistent styling and optional icons.
 */
export function Badge({ 
  variant = "default", 
  children, 
  className, 
  showIcon = false,
  ...props 
}: BadgeProps) {
  const base = "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 w-fit";
  
  const variants = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    denied: "bg-red-50 text-red-700 border-red-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    admin: "bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-200",
    default: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };

  const getIcon = () => {
    if (!showIcon) return null;
    switch (variant) {
      case "approved": return <CheckCircle2 className="h-3 w-3" />;
      case "denied": return <XCircle className="h-3 w-3" />;
      case "pending": return <Clock3 className="h-3 w-3" />;
      case "admin": return <ShieldCheck className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <span 
      className={cn(base, variants[variant], className)} 
      {...props}
    >
      {getIcon()}
      {children}
    </span>
  );
}
