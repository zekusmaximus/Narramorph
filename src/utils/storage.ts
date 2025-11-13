/**
 * Utility functions for localStorage operations with error handling
 */

/**
 * Saves data to localStorage with error handling for quota exceeded
 * @param key - The localStorage key
 * @param data - The data to save
 * @returns true if successful, false if failed
 */
export function saveToStorage<T>(key: string, data: T): boolean {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded for key:', key);
        // Could trigger UI notification here
      } else {
        console.error('Failed to save to localStorage:', error.message);
      }
    }
    return false;
  }
}

/**
 * Loads data from localStorage with error handling
 * @param key - The localStorage key
 * @returns The parsed data or null if not found/invalid
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const json = localStorage.getItem(key);
    if (!json) {
      return null;
    }
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

/**
 * Removes an item from localStorage
 * @param key - The localStorage key
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

/**
 * Checks if localStorage is available and working
 * @returns true if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the approximate size of localStorage usage in bytes
 * @returns Size in bytes or null if calculation fails
 */
export function getStorageSize(): number | null {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  } catch {
    return null;
  }
}

/**
 * Storage keys used by the application
 */
export const STORAGE_KEYS = {
  SAVED_STATE: 'narramorph-saved-state',
  PREFERENCES: 'narramorph-preferences',
  EXPORT_PREFIX: 'narramorph-export-',
} as const;
