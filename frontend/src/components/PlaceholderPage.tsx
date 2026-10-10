import React from 'react';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center p-8 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-w-lg w-full">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          This feature is coming soon. Stay tuned!
        </p>
        <div className="mt-6">
          <div className="animate-pulse flex justify-center">
            <div className="h-2 w-24 bg-indigo-200 dark:bg-indigo-600 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 