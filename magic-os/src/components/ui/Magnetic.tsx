"use client";

import { HTMLAttributes, ReactNode } from "react";

interface MagneticProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  radius?: string | number;
  color?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export default function Magnetic({
  children,
  radius = "12px",
  color = "rgba(255,255,255,0.15)",
  as: Component = "div",
  className = "",
  ...props
}: MagneticProps) {
  // @ts-ignore - dynamic tag rendering typing is complex but works safely here
  return (
    <Component
      data-magnetic="true"
      data-magnetic-radius={radius}
      data-magnetic-color={color}
      className={`${className} cursor-none`}
      {...props}
    >
      {children}
    </Component>
  );
}
