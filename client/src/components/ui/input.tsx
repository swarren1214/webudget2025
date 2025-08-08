import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
  icon?: React.ReactNode; // Icon element
  iconPosition?: "left" | "right"; // Position of the icon
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, iconPosition = "left", ...props }, ref) => {
    return (
      <div
        className={cn(
          "relative flex items-center h-10 w-full rounded-xl border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-3 py-2 text-base placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      >
        {icon && iconPosition === "left" && (
          <span className="absolute left-3 flex items-center text-current w-4 h-4">{icon}</span>
        )}
        <input
          type={type}
          className={cn(
            "flex-1 bg-transparent border-none focus:outline-none focus:ring-0",
            icon && iconPosition === "left" ? "pl-6" : "",
            icon && iconPosition === "right" ? "pr-6" : ""
          )}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === "right" && (
          <span className="absolute right-3 flex items-center text-current w-4 h-4">{icon}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
