import React from "react";
import { Link } from "react-router-dom";
import type { CardProps } from "../types/components";

export const Card: React.FC<CardProps> = ({
  title,
  description,
  type,
  href,
  onClick,
  className = "",
  children,
  theme,
  comingSoon = false,
}) => {
  const baseStyles = `
    group relative backdrop-blur-sm rounded-lg border p-6 transition-all duration-200
    bg-white/50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700
    hover:ring-1 hover:shadow-lg
  `;

  const themeStyles = theme
    ? `${theme.border.light} dark:${theme.border.dark} ${theme.shadow.light} dark:${theme.shadow.dark}`
    : "hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-purple-100/50 dark:hover:shadow-purple-900/50";

  const combinedClassName = `${baseStyles} ${themeStyles} ${className} ${comingSoon ? 'cursor-not-allowed opacity-75' : ''}`;

  // Get badge color based on theme
  const getBadgeColor = () => {
    if (!theme) return "bg-red-600";
    if (theme.border.light.includes("purple")) return "bg-purple-600";
    if (theme.border.light.includes("blue")) return "bg-blue-600";
    if (theme.border.light.includes("green")) return "bg-green-600";
    if (theme.border.light.includes("orange")) return "bg-orange-600";
    return "bg-red-600";
  };

  const content = (
    <>
      <div className="relative">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
          <span className="absolute inset-0" aria-hidden="true" />
        </h3>
        {comingSoon && (
          <div className="absolute -top-3 -right-3 bg-gray-600 text-white px-1 py-px font-bold text-[9px] rounded shadow-sm">
            <div className="flex items-center gap-0.5">
              <span className="text-[7px]">★</span>
              <span>COMING SOON</span>
              <span className="text-[7px]">★</span>
            </div>
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      {children}
    </>
  );

  if (comingSoon) {
    return <div className={combinedClassName}>{content}</div>;
  }

  if (type === 'navigation' && href) {
    return (
      <Link to={href} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  if (type === 'action' && onClick) {
    return (
      <button onClick={onClick} className={combinedClassName}>
        {content}
      </button>
    );
  }

  // Fallback for cases where props don't match the type
  return <div className={combinedClassName}>{content}</div>;
};
