import * as AlertPrimitive from "@radix-ui/react-alert-dialog";
import React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { overlayClass } from "./Dialog";

export const AlertDialog = AlertPrimitive.Root;

export const AlertDialogContent = React.forwardRef(function AlertDialogContent(
  { className, ...props },
  ref,
) {
  return (
    <AlertPrimitive.Portal>
      <AlertPrimitive.Overlay className={overlayClass} />
      <AlertPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_16px_48px_-12px_rgba(15,31,61,0.25)] focus:outline-none",
          className,
        )}
        {...props}
      />
    </AlertPrimitive.Portal>
  );
});

export function AlertDialogHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export const AlertDialogTitle = React.forwardRef(function AlertDialogTitle(
  { className, ...props },
  ref,
) {
  return (
    <AlertPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold tracking-tight text-navy-900",
        className,
      )}
      {...props}
    />
  );
});

export const AlertDialogDescription = React.forwardRef(
  function AlertDialogDescription({ className, ...props }, ref) {
    return (
      <AlertPrimitive.Description
        ref={ref}
        className={cn(
          "text-sm leading-relaxed text-muted-foreground",
          className,
        )}
        {...props}
      />
    );
  },
);

export const AlertDialogCancel = React.forwardRef(function AlertDialogCancel(
  { className, children, ...props },
  ref,
) {
  return (
    <AlertPrimitive.Cancel ref={ref} asChild {...props}>
      <Button variant="outline" className={className}>
        {children}
      </Button>
    </AlertPrimitive.Cancel>
  );
});
