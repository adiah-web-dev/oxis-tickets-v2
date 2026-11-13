import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-xl border border-slate-200 bg-white py-6 text-foreground shadow-[0_1px_2px_rgba(15,31,61,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div className={cn("flex flex-col gap-1 px-6", className)} {...props} />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <div
      className={cn("font-semibold leading-tight text-slate-900", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <div
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center px-6", className)} {...props} />;
}
