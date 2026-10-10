import React from 'react';

export default function GettingStarted() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Getting Started with ContentMate</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Welcome to ContentMate</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            ContentMate is your all-in-one solution for content creation and management. This guide will help you get started with our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Key Features</h2>
          <ul className="space-y-4">
            <li>
              <h3 className="font-medium">Content Generation</h3>
              <p className="text-gray-600 dark:text-gray-300">Create engaging content using AI-powered tools</p>
            </li>
            <li>
              <h3 className="font-medium">File Management</h3>
              <p className="text-gray-600 dark:text-gray-300">Organize and manage your content efficiently</p>
            </li>
            <li>
              <h3 className="font-medium">Multi-format Export</h3>
              <p className="text-gray-600 dark:text-gray-300">Export your content in various formats</p>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Quick Start Steps</h2>
          <ol className="list-decimal list-inside space-y-4">
            <li className="text-gray-600 dark:text-gray-300">
              Create an account or sign in
            </li>
            <li className="text-gray-600 dark:text-gray-300">
              Explore the dashboard and available tools
            </li>
            <li className="text-gray-600 dark:text-gray-300">
              Start creating your first content piece
            </li>
            <li className="text-gray-600 dark:text-gray-300">
              Save and organize your work
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
} 