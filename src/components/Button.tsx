"use client";

import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "glow-blue" | "glow-orange" | "glow-gradient" | "outline" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  children: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      variant = "glow-blue",
      size = "md",
      href,
      children,
      className = "",
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    // Base styles ensuring fixed dimensions, no layout shift, and smooth transitions
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none box-border border";

    // Size variants with strict padding & fixed line-heights to prevent height jumping
    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[36px]",
      md: "px-5 py-2.5 text-xs font-semibold gap-2 min-h-[42px]",
      lg: "px-8 py-4 text-sm font-semibold gap-2 min-h-[52px]",
    };

    // Variant styles: box-shadow glows with transparent borders to ensure identical dimensions across states
    const variantStyles = {
      "glow-blue":
        "bg-primary-blue text-white border-transparent shadow-glow-blue hover:brightness-110 active:brightness-95",
      "glow-orange":
        "bg-primary-orange text-white border-transparent shadow-glow-orange hover:brightness-110 active:brightness-95",
      "glow-gradient":
        "bg-gradient-to-r from-primary-blue to-primary-orange text-white border-transparent shadow-glow-blue hover:brightness-110 active:brightness-95",
      outline:
        "bg-card border-border text-foreground hover:bg-muted-background hover:border-primary-blue/40 shadow-premium",
      secondary:
        "bg-muted-background border-border text-foreground hover:border-primary-blue/30 hover:text-primary-blue",
      ghost:
        "bg-transparent border-transparent text-muted hover:text-primary-blue hover:bg-muted-background/50",
    };

    const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim();

    if (href) {
      return (
        <Link
          href={href}
          className={combinedClassName}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={disabled}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
