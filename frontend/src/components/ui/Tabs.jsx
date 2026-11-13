import * as TabsPrimitive from "@radix-ui/react-tabs";
import React, { createContext, useContext } from "react";
import { cn } from "../../lib/utils";

const VariantContext = createContext("default");

export const Tabs = React.forwardRef(function Tabs(
  { className, ...props },
  ref,
) {
  return (
    <TabsPrimitive.Root
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
});

export const TabsList = React.forwardRef(function TabsList(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <VariantContext.Provider value={variant}>
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          variant === "line"
            ? "flex items-center gap-5 border-slate-200"
            : "inline-flex h-9 w-fit items-center gap-0.5 rounded-lg bg-slate-100 p-1",
          className,
        )}
        {...props}
      />
    </VariantContext.Provider>
  );
});

export const TabsTrigger = React.forwardRef(function TabsTrigger(
  { className, ...props },
  ref,
) {
  const variant = useContext(VariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50 [&_svg]:shrink-0",
        variant === "line"
          ? "-mb-px h-10 border-b-2 border-transparent px-0.5 text-slate-500 hover:text-slate-800 data-[state=active]:border-blue-600 data-[state=active]:text-navy-900"
          : "h-7 rounded-md px-3 text-[13px] text-slate-600 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-navy-900 data-[state=active]:shadow-[0_1px_2px_rgba(15,31,61,0.1)]",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef(function TabsContent(
  { className, ...props },
  ref,
) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("focus-visible:outline-none", className)}
      {...props}
    />
  );
});
