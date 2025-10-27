// Date utility functions for handling Unix timestamps

/**
 * Format Unix timestamp to localized date string
 * @param timestamp Unix timestamp (seconds)
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) {
    return 'N/A';
  }
  
  try {
    // Convert Unix timestamp (seconds) to milliseconds
    const date = new Date(timestamp * 1000);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format Unix timestamp to localized date and time string
 * @param timestamp Unix timestamp (seconds)
 * @returns Formatted date and time string
 */
export const formatDateTime = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) {
    return 'N/A';
  }
  
  try {
    // Convert Unix timestamp (seconds) to milliseconds
    const date = new Date(timestamp * 1000);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid Date';
  }
};

/**
 * Format Unix timestamp to relative time (e.g., "2 hours ago")
 * @param timestamp Unix timestamp (seconds)
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) {
    return 'N/A';
  }
  
  try {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};
