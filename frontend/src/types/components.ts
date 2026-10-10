import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import type { CommonProps, IconComponent, SectionTheme } from "./common";

// Card types
export interface BaseCardData {
  title: string;
  description: string;
  icon: IconComponent;
  theme: Pick<
    SectionTheme,
    "iconBg" | "iconColor" | "heading" | "border" | "shadow"
  >;
  comingSoon?: boolean;
}

export interface NavigationCardData extends BaseCardData {
  type: "navigation";
  href: string;
}

export interface ActionCardData extends BaseCardData {
  type: "action";
  action: string; // Identifier for the action to perform
}

export type CardData = NavigationCardData | ActionCardData;

export interface CardProps extends CommonProps, Omit<BaseCardData, "icon"> {
  icon: IconComponent;
  type: "navigation" | "action";
  href?: string;
  action?: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

// Button types
export type ButtonVariant = "primary" | "secondary" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends CommonProps,
    Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      "size" | "className" | "children"
    > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  to?: string;
  isLoading?: boolean;
}

// Input types
export interface InputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "size" | "className" | "children"
  > {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

// Section types
export interface Section {
  title: string;
  icon: IconComponent;
  theme: SectionTheme;
  cards: readonly CardData[];
}

export type ContentSectionProps = Section;

export interface SectionHeaderProps extends Pick<Section, "title"> {
  Icon: IconComponent;
  theme: Pick<SectionTheme, "iconBg" | "iconColor" | "heading">;
}
