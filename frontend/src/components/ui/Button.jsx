import { Slot } from "@radix-ui/react-slot";
import React from "react";
import { cn } from "../../lib/utils";

const variants = {
  default:
    "bg-blue-600 text-white shadow-[0_1px_2px_rgba(15,31,61,0.12)] hover:bg-blue-700",
  outline:
    "border border-slate-200 bg-white text-slate-800 shadow-[0_1px_2px_rgba(15,31,61,0.04)] hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  destructive:
    "bg-red-600 text-white shadow-[0_1px_2px_rgba(15,31,61,0.12)] hover:bg-red-700",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
  link: "text-blue-600 underline-offset-4 hover:underline",
};

const sizes = {
  default: "h-9 px-4 text-sm",
  xs: "h-7 gap-1 rounded-md px-2 text-xs",
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  lg: "h-11 px-5 text-sm",
  icon: "size-9",
  "icon-sm": "size-8",
};

export const Button = React.forwardRef(function Button(
  {
    variant = "default",
    size = "default",
    asChild = false,
    className,
    type,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
