import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Card({ className, children, pressed = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { pressed?: boolean }) {
  return (
    <div 
      className={cn(
        "rounded-[24px] p-4 sm:p-6 transition-all duration-300 bg-[var(--color-neo-card)]",
        pressed ? "shadow-[var(--shadow-neo-pressed)]" : "shadow-[var(--shadow-neo-flat)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
