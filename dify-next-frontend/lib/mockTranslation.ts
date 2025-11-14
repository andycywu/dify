/**
 * Mock translation wrapper
 * This provides a simple translation interface compatible with react-i18next
 */

interface UseTranslationReturn {
  t: (key: string, options?: any) => string;
  i18n?: any;
}

export const useTranslation = (): UseTranslationReturn => {
  const t = (key: string, options?: any): string => {
    // Simple key-based translation
    // In a real implementation, this would look up translations
    return key;
  };

  return { t };
};

export default useTranslation;
