import { ArrowPathIcon } from '@heroicons/react/24/solid';

interface FancyLoaderProps {
  message?: string;
  showOverlay?: boolean;
}

export const FancyLoader: React.FC<FancyLoaderProps> = ({ 
  message = "Loading...",
  showOverlay = true 
}) => {
  return (
    <div className={`
      fixed inset-0 
      ${showOverlay ? 'bg-black/30 backdrop-blur-sm' : ''} 
      flex items-center justify-center z-50
    `}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-900"></div>
        
        {/* Inner spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-purple-600 border-r-purple-600 border-b-transparent border-l-transparent animate-spin"></div>
        
        {/* Pulsing center */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-rose-500 animate-pulse flex items-center justify-center">
          <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
        </div>

        {/* Message */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-base font-medium text-gray-700 dark:text-gray-200">
            {message}
          </p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}; 