import * as React from "react";
import { cn } from "../../lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "outline" | "ghost";
    padding?: "none" | "sm" | "md" | "lg";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", padding = "md", ...props }, ref) => {

        const baseStyles = "rounded-3xl transition-all";

        const variants = {
            default: "bg-white border border-gray-100 shadow-sm",
            outline: "bg-transparent border border-gray-200",
            ghost: "bg-gray-50 border-transparent",
        };

        const paddings = {
            none: "p-0",
            sm: "p-3",
            md: "p-5",
            lg: "p-8",
        };

        return (
            <div
                ref={ref}
                className={cn(baseStyles, variants[variant], paddings[padding], className)}
                {...props}
            />
        );
    }
);
Card.displayName = "Card";

export { Card };
