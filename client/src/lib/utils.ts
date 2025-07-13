import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Development-only debug logger
 * Only outputs logs in development environment
 */
export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(`🔍 ${message}`, data);
    } else {
      console.log(`🔍 ${message}`);
    }
  }
};

/**
 * Error logger that works in all environments
 * but adds extra context in development
 */
export const errorLog = (message: string, error?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`❌ ${message}`, error);
  } else {
    // In production, you might want to send to error tracking service
    console.error(message);
  }
};
