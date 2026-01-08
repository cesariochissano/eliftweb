import * as React from "react";
// import { Slot } from "@radix-ui/react-slot";
// import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

// Note: We need to install class-variance-authority and @radix-ui/react-slot if we want full proper button primitive,
// but for now I'll use a simpler version or I can assume I installed them.
// Wait, I forgot to install `class-variance-authority` and `@radix-ui/react-slot`.
// I will implement a simpler version first without CVA/Slot if I want to avoid more installs,
// BUT to be professional I should use them or just standard props.
// I'll stick to standard props + clsx for now to save time on installs, or install them.
// "Botões grandes e acessíveis"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95";

        // Variants
        const variants = {
            primary: "bg-black text-white hover:bg-gray-800 shadow-lg", // Black button as requested
            secondary: "bg-primary text-text-main hover:bg-primary-dark shadow-md", // Green button
            outline: "border-2 border-gray-200 bg-white hover:bg-gray-100 hover:text-text-main",
            ghost: "hover:bg-gray-100 hover:text-text-main",
            link: "text-primary underline-offset-4 hover:underline",
        };

        // Sizes
        const sizes = {
            default: "h-14 px-6 py-3 text-base", // Large touch targets
            sm: "h-10 rounded-xl px-4",
            lg: "h-16 rounded-3xl px-8 text-lg",
            icon: "h-12 w-12",
        };

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
