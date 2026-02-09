import { Alert } from 'react-native';

/**
 * Common error codes mapped to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Supabase auth errors
  'invalid_credentials': 'Invalid email or password.',
  'email_not_confirmed': 'Please verify your email before signing in.',
  'user_not_found': 'No account found with this email.',
  'email_taken': 'An account with this email already exists.',
  'weak_password': 'Password must be at least 6 characters.',
  'invalid_email': 'Please enter a valid email address.',

  // Supabase database errors
  'PGRST116': 'Record not found.',
  '23505': 'This record already exists.',
  '23503': 'Referenced record does not exist.',
  '42501': 'You do not have permission to perform this action.',
  '23514': 'Invalid data provided.',

  // Network errors
  'NetworkError': 'Network error. Please check your connection.',
  'NETWORK_REQUEST_FAILED': 'Network error. Please check your connection.',

  // Game-related errors
  'game_full': 'This game is already full.',
  'already_requested': 'You have already requested to join this game.',
  'not_authorized': 'You are not authorized to perform this action.',

  // Generic
  'unknown': 'An unexpected error occurred. Please try again.',
};

/**
 * Extract error code from various error formats
 */
function getErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.code === 'string') return err.code;
    if (typeof err.error_code === 'string') return err.error_code;
    if (typeof err.status === 'number') return String(err.status);
  }
  return null;
}

/**
 * Extract error message from various error formats
 */
function getErrorMessageRaw(error: unknown): string {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
    if (typeof err.error_description === 'string') return err.error_description;
    if (typeof err.msg === 'string') return err.msg;
  }
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

/**
 * Get a user-friendly error message from an error object
 */
export function getErrorMessage(error: unknown): string {
  const code = getErrorCode(error);

  // Check for known error code
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  // Check raw message for known patterns
  const rawMessage = getErrorMessageRaw(error);
  const lowerMessage = rawMessage.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return ERROR_MESSAGES['NetworkError'];
  }

  if (lowerMessage.includes('already') && lowerMessage.includes('request')) {
    return ERROR_MESSAGES['already_requested'];
  }

  if (lowerMessage.includes('full')) {
    return ERROR_MESSAGES['game_full'];
  }

  if (lowerMessage.includes('authorized') || lowerMessage.includes('permission')) {
    return ERROR_MESSAGES['not_authorized'];
  }

  // Return the raw message if it's user-readable, otherwise return generic
  if (rawMessage.length > 0 && rawMessage.length < 200 && !rawMessage.includes('Error:')) {
    return rawMessage;
  }

  return ERROR_MESSAGES['unknown'];
}

/**
 * Show an error alert to the user and log to console
 */
export function showError(error: unknown, title: string = 'Error'): void {
  const message = getErrorMessage(error);
  console.error(`[${title}]`, error);
  Alert.alert(title, message);
}

/**
 * Show a success alert to the user
 */
export function showSuccess(message: string, title: string = 'Success'): void {
  Alert.alert(title, message);
}

/**
 * Async wrapper with automatic error handling
 * Returns the result or null on error
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorTitle: string = 'Error'
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    showError(error, errorTitle);
    return null;
  }
}

/**
 * Async wrapper that returns a result object instead of throwing
 */
export async function safeAsync<T>(
  operation: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
