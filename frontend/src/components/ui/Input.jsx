import React from "react";
import { cn } from "../../lib/utils";

export const fieldBase =
  "w-full rounded-lg border border-slate-200 bg-white text-sm text-foreground shadow-[0_1px_2px_rgba(15,31,61,0.03)] transition-colors placeholder:text-slate-400 " +
  "focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 " +
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:focus-visible:ring-red-500/20";

export const Input = React.forwardRef(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(fieldBase, "h-9 px-3", className)}
      {...props}
    />
  );
});
