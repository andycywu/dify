import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue-500',
  className = '',
  message
}) => {
  // Define spinner sizes
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-${color} ${sizes[size]}`}></div>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
