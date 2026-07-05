"use client";

import React, { HTMLAttributes, ReactNode, ElementType } from "react";

interface MagneticProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  radius?: string | number;
  color?: string;
  as?: ElementType;
  className?: string;
  type?: string;
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
      {...(props as any)}
    >
      {children}
    </Component>
  );
}
