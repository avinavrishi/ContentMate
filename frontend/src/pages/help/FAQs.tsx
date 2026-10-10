import React from 'react';

const faqs = [
  {
    question: "What is ContentMate?",
    answer: "ContentMate is an AI-powered content creation and management platform that helps you create, organize, and export content in various formats."
  },
  {
    question: "How do I get started?",
    answer: "Simply create an account, explore our tools, and start creating content. Check out our Getting Started guide for detailed instructions."
  },
  {
    question: "What types of content can I create?",
    answer: "You can create videos, blog posts, social media content, presentations, and more using our AI-powered tools."
  },
  {
    question: "Is there a free plan?",
    answer: "Yes, we offer a free plan with basic features. Premium plans are available for advanced features and higher usage limits."
  },
  {
    question: "How secure is my content?",
    answer: "We use industry-standard encryption and security measures to protect your content and personal information."
  }
];

export default function FAQs() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
      
      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold mb-2">{faq.question}</h2>
            <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 