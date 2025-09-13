export const isAIConfigured = (): boolean => {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};

export const getAIConfigError = (): string | null => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env.local file.";
  }
  return null;
};

