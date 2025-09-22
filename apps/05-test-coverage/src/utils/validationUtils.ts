// Validation Utilities - needs comprehensive testing!
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateTaskTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title || !title.trim()) {
    return { isValid: false, error: 'Title is required' };
  }
  if (title.length < 3) {
    return { isValid: false, error: 'Title must be at least 3 characters' };
  }
  if (title.length > 100) {
    return { isValid: false, error: 'Title must be less than 100 characters' };
  }
  if (!/^[a-zA-Z0-9\s\-_.,!?]+$/.test(title)) {
    return { isValid: false, error: 'Title contains invalid characters' };
  }
  return { isValid: true };
};

export const validatePriority = (priority: string): boolean => {
  return ['low', 'medium', 'high'].includes(priority.toLowerCase());
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain a special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic US phone number validation
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate;
};
