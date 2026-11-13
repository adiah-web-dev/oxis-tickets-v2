import React from "react";
import { cn } from "../../lib/utils";
import { fieldBase } from "./Input";

export const Textarea = React.forwardRef(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        fieldBase,
        "min-h-[72px] px-3 py-2 leading-relaxed",
        className,
      )}
      {...props}
    />
  );
});
