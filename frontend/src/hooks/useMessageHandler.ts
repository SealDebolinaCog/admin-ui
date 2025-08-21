import { useState, useEffect } from 'react';

interface UseMessageHandlerReturn {
  error: string | null;
  successMessage: string | null;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  clearError: () => void;
  clearSuccessMessage: () => void;
  clearAllMessages: () => void;
}

export const useMessageHandler = (): UseMessageHandlerReturn => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const clearError = () => setError(null);
  const clearSuccessMessage = () => setSuccessMessage(null);
  const clearAllMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return {
    error,
    successMessage,
    setError,
    setSuccessMessage,
    clearError,
    clearSuccessMessage,
    clearAllMessages
  };
}; 