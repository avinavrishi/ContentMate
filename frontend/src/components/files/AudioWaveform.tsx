import React from "react";

export const AudioWaveform: React.FC = () => {
  // Generate random heights for bars
  const bars = Array.from({ length: 40 }, () => Math.random() * 100);

  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex items-center space-x-0.5">
        {bars.map((height, index) => (
          <div
            key={index}
            className="w-1 bg-emerald-400/30 dark:bg-emerald-400/20 rounded-full transform transition-all duration-150 group-hover:bg-emerald-400/40"
            style={{
              height: `${Math.max(15, height)}%`,
              animationDelay: `${index * 0.05}s`,
              transform: `scaleY(${Math.max(0.3, Math.min(1, height / 100))})`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
