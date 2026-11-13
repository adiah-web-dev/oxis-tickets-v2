import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import React from "react";
import { cn } from "../../lib/utils";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef(
  function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
    return (
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          className={cn(
            "z-50 min-w-[10rem] overflow-hidden rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-[0_12px_32px_-8px_rgba(15,31,61,0.18)]",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Portal>
    );
  },
);

export const DropdownMenuItem = React.forwardRef(function DropdownMenuItem(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 outline-none transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        variant === "destructive"
          ? "text-red-600 data-[highlighted]:bg-red-50 [&_svg]:text-red-500"
          : "text-slate-700 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900 [&_svg]:text-slate-400",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel(
  { className, ...props },
  ref,
) {
  return (
    <MenuPrimitive.Label
      ref={ref}
      className={cn(
        "px-2 py-1.5 text-sm font-semibold text-slate-900",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = React.forwardRef(
  function DropdownMenuSeparator({ className, ...props }, ref) {
    return (
      <MenuPrimitive.Separator
        ref={ref}
        className={cn("-mx-1 my-1 h-px bg-slate-100", className)}
        {...props}
      />
    );
  },
);
