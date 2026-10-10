import React from "react";
import type { SectionHeaderProps } from "../types/components";

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  Icon,
  theme,
}) => {
  return (
    <div className="flex items-center mb-6">
      <div
        className={`p-2 rounded-lg mr-3 ${theme.iconBg.light} dark:${theme.iconBg.dark}`}
      >
        <Icon
          className={`h-8 w-8 ${theme.iconColor.light} dark:${theme.iconColor.dark}`}
        />
      </div>
      <h2
        className={`text-2xl font-bold bg-clip-text text-transparent ${theme.heading.light} dark:${theme.heading.dark}`}
      >
        {title}
      </h2>
    </div>
  );
};
