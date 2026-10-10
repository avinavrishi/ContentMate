import type { SVGProps, ReactNode } from "react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

// Theme types
export interface ThemeColors {
  readonly light: string;
  readonly dark: string;
}

export interface BaseTheme {
  readonly border: ThemeColors;
  readonly shadow: ThemeColors;
}

export interface SectionTheme extends BaseTheme {
  readonly bg: ThemeColors;
  readonly iconBg: ThemeColors;
  readonly iconColor: ThemeColors;
  readonly heading: ThemeColors;
}

export type ThemeKey = "video" | "audio" | "design";

export type ThemeConfig = Record<ThemeKey, SectionTheme>;

// Common component types
export type IconComponent = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, "ref"> & {
    title?: string | undefined;
    titleId?: string | undefined;
  } & RefAttributes<SVGSVGElement>
>;

export interface CommonProps {
  readonly className?: string;
  readonly children?: ReactNode;
}
