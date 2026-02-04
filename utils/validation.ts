/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface EventValidationData {
  eventName: string;
  locationText: string;
  location?: { lat: number; lng: number } | null;
  maxPlayers: string | number;
  dateSelected: boolean;
  timeSelected: boolean;
}

export interface ProfileValidationData {
  username?: string;
  firstName?: string;
  lastName?: string;
  age?: string | number;
}

/**
 * Validates that a location is not a placeholder {0,0} coordinate
 */
export function isValidLocation(location: { lat: number; lng: number } | null | undefined): boolean {
  if (!location) return false;
  // Reject placeholder coordinates
  if (location.lat === 0 && location.lng === 0) return false;
  // Validate latitude range (-90 to 90)
  if (location.lat < -90 || location.lat > 90) return false;
  // Validate longitude range (-180 to 180)
  if (location.lng < -180 || location.lng > 180) return false;
  return true;
}

/**
 * Validates event creation form data
 * Returns an error message or null if valid
 */
export function validateEventCreation(data: EventValidationData): string | null {
  const { eventName, locationText, maxPlayers, dateSelected, timeSelected } = data;

  if (!eventName || !eventName.trim()) {
    return 'Please enter an event name';
  }

  if (eventName.trim().length < 3) {
    return 'Event name must be at least 3 characters';
  }

  if (eventName.trim().length > 100) {
    return 'Event name must be less than 100 characters';
  }

  if (!locationText || !locationText.trim()) {
    return 'Please enter a location';
  }

  if (locationText.trim().length < 3) {
    return 'Location must be at least 3 characters';
  }

  if (!dateSelected) {
    return 'Please select a date';
  }

  if (!timeSelected) {
    return 'Please select a time';
  }

  const maxPlayersNum = typeof maxPlayers === 'string' ? parseInt(maxPlayers, 10) : maxPlayers;

  if (isNaN(maxPlayersNum) || maxPlayersNum < 2) {
    return 'Max players must be at least 2';
  }

  if (maxPlayersNum > 100) {
    return 'Max players cannot exceed 100';
  }

  return null;
}

/**
 * Validates profile update form data
 * Returns an error message or null if valid
 */
export function validateProfileUpdate(data: ProfileValidationData): string | null {
  const { username, firstName, lastName, age } = data;

  if (username !== undefined) {
    if (username.length > 0 && username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 30) {
      return 'Username must be less than 30 characters';
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
  }

  if (firstName !== undefined) {
    if (firstName.length > 0 && firstName.length < 1) {
      return 'First name is required';
    }
    if (firstName.length > 50) {
      return 'First name must be less than 50 characters';
    }
  }

  if (lastName !== undefined) {
    if (lastName.length > 50) {
      return 'Last name must be less than 50 characters';
    }
  }

  if (age !== undefined) {
    const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
    if (!isNaN(ageNum)) {
      if (ageNum < 13) {
        return 'You must be at least 13 years old';
      }
      if (ageNum > 120) {
        return 'Please enter a valid age';
      }
    }
  }

  return null;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * Returns an error message or null if valid
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  if (password.length > 128) {
    return 'Password is too long';
  }
  return null;
}

/**
 * Checks if a string is empty or only whitespace
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Sanitizes text input by trimming and removing excess whitespace
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}
