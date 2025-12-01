import { Md5 } from "ts-md5";

/**
 * Generates an MD5 signature from a key and timestamp.
 *
 * @param key - The secret key.
 * @param timestamp - The timestamp.
 * @returns The signature hash.
 */
export function generateSignature(key: string, timestamp: number): string {
  const data = `${key}::${timestamp.toString().substring(0, 8)}`;
  return Md5.hashStr(data);
}

/**
 * Verifies if a signature matches the key and timestamp.
 *
 * @param signature - The signature to verify.
 * @param key - The secret key.
 * @param timestamp - The timestamp.
 * @returns True if the signature is valid.
 */
export function verifySignature(
  signature = "",
  key: string,
  timestamp: number
): boolean {
  const generatedSignature = generateSignature(key, timestamp);
  return signature === generatedSignature;
}
