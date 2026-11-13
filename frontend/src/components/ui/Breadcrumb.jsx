import { Slot } from "@radix-ui/react-slot";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

export function Breadcrumb({ className, ...props }) {
  return <nav aria-label="Breadcrumb" className={className} {...props} />;
}

export function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }) {
  return (
    <li
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

export function BreadcrumbLink({ asChild, className, ...props }) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      className={cn("transition-colors hover:text-slate-900", className)}
      {...props}
    />
  );
}

export function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      aria-current="page"
      className={cn("font-medium text-slate-700", className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ className }) {
  return (
    <li
      role="presentation"
      aria-hidden
      className={cn("text-slate-300", className)}
    >
      <ChevronRight className="size-3.5" />
    </li>
  );
}
