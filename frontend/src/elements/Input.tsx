import React from "react";
import { InputProps } from "../types";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`
              block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm
              placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500
              disabled:cursor-not-allowed disabled:opacity-50
              dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500
              ${
                error
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {(error || helperText) && (
          <p
            className={`mt-1 text-sm ${
              error ? "text-red-600" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
