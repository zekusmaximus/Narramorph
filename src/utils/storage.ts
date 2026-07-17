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
 * Reads a raw string from localStorage without JSON parsing.
 * Used by the persistence boundary so a corrupt (non-JSON) save can be
 * distinguished from an empty slot and quarantined verbatim.
 * @param key - The localStorage key
 * @returns The raw stored string, or null if absent/unreadable
 */
export function loadRawString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Failed to read raw value from localStorage:', error);
    return null;
  }
}

/**
 * Writes a raw string to localStorage with the same quota handling as
 * {@link saveToStorage}. Used to quarantine a corrupt save verbatim.
 * @param key - The localStorage key
 * @param value - The raw string to store
 * @returns true if successful, false if failed (e.g. quota exceeded)
 */
export function saveRawString(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded for key:', key);
    } else if (error instanceof Error) {
      console.error('Failed to save raw value to localStorage:', error.message);
    }
    return false;
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
  // Device-local quarantine slot for a save that failed to parse/validate on load
  // (Phase 7.4). Off the save schema; the raw bytes are held so the reader can
  // retrieve them before the app starts clean.
  SAVED_STATE_CORRUPT: 'narramorph-saved-state.corrupt',
  PREFERENCES: 'narramorph-preferences',
  EXPORT_PREFIX: 'narramorph-export-',
} as const;
