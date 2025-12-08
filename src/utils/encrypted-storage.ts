import CryptoJS from "crypto-js";
import { createJSONStorage, type PersistStorage } from "zustand/middleware";

/**
 * Generates a deterministic encryption key from browser fingerprint.
 * This provides a basic layer of obfuscation without requiring user input.
 * 
 * Note: This is NOT cryptographically secure against determined attackers,
 * but provides protection against casual inspection of localStorage.
 * For production, consider using a user-provided password or secure key management.
 */
function generateEncryptionKey(): string {
  // Use browser fingerprint components to generate a deterministic key
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.width + "x" + screen.height,
  ].join("|");
  
  // Hash the fingerprint to create a consistent key
  return CryptoJS.SHA256(fingerprint).toString();
}

/**
 * Encrypts a string using AES encryption.
 * 
 * @param data - The data to encrypt.
 * @param key - The encryption key.
 * @returns The encrypted data as a string.
 */
function encrypt(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypts a string using AES encryption.
 * 
 * @param encryptedData - The encrypted data.
 * @param key - The encryption key.
 * @returns The decrypted data as a string, or null if decryption fails.
 */
function decrypt(encryptedData: string, key: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch {
    return null;
  }
}

/**
 * Creates an encrypted storage adapter that only encrypts sensitive fields.
 * This provides a balance between security and debuggability.
 * 
 * @param sensitiveFields - Array of field names that should be encrypted.
 * @returns A PersistStorage implementation with selective encryption.
 */
export function createSelectiveEncryptedStorage<S = unknown>(
  sensitiveFields: string[]
): PersistStorage<S> | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const encryptionKey = generateEncryptionKey();

  const encryptedStorage = {
    getItem: (name: string): string | null => {
      try {
        const storedValue = localStorage.getItem(name);
        if (!storedValue) return null;

        const parsed = JSON.parse(storedValue);
        
        // Decrypt sensitive fields
        if (parsed?.state) {
          for (const field of sensitiveFields) {
            if (parsed.state[field] && typeof parsed.state[field] === "string") {
              // Check if field is encrypted
              if (parsed.state[field].startsWith("U2FsdGVkX1")) {
                const decrypted = decrypt(parsed.state[field], encryptionKey);
                if (decrypted) {
                  parsed.state[field] = decrypted;
                }
              }
            }
          }
        }

        return JSON.stringify(parsed);
      } catch (error) {
        console.error("Error reading selective encrypted storage:", error);
        return null;
      }
    },

    setItem: (name: string, value: string): void => {
      try {
        const parsed = JSON.parse(value);

        // Encrypt sensitive fields
        if (parsed?.state) {
          for (const field of sensitiveFields) {
            if (parsed.state[field] && typeof parsed.state[field] === "string") {
              // Only encrypt non-empty values
              if (parsed.state[field].trim() !== "") {
                parsed.state[field] = encrypt(parsed.state[field], encryptionKey);
              }
            }
          }
        }

        localStorage.setItem(name, JSON.stringify(parsed));
      } catch (error) {
        console.error("Error writing selective encrypted storage:", error);
      }
    },

    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.error("Error removing encrypted storage:", error);
      }
    },
  };

  return createJSONStorage<S>(() => encryptedStorage);
}
