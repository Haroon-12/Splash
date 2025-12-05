/**
 * End-to-End Encryption Utility
 * Uses AES-256-GCM for authenticated encryption
 */

import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha256';

/**
 * Get the encryption secret from environment variable
 * This should be set in .env.local or .env
 */
function getEncryptionSecret(): string {
  const secret = process.env.CHAT_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('CHAT_ENCRYPTION_SECRET environment variable is not set');
  }
  return secret;
}

/**
 * Derive encryption key for a conversation
 * Uses PBKDF2 to derive a consistent key from conversation and participant IDs
 */
export function deriveConversationKey(
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): Buffer {
  // Sort participant IDs to ensure consistent key generation regardless of order
  const sortedParticipants = [participant1Id, participant2Id].sort();
  
  // Create a salt from conversation ID and sorted participant IDs
  const salt = crypto
    .createHash('sha256')
    .update(`${conversationId}:${sortedParticipants[0]}:${sortedParticipants[1]}`)
    .digest();
  
  // Derive key using PBKDF2
  const secret = getEncryptionSecret();
  const key = crypto.pbkdf2Sync(
    secret,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
  
  return key;
}

/**
 * Encrypt text data
 * Returns base64-encoded string: iv:encryptedData:authTag
 */
export function encryptText(
  text: string,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): string {
  if (!text) {
    return text;
  }

  try {
    const key = deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag
    const combined = Buffer.concat([iv, encrypted, authTag]);
    
    // Return as base64 string
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt text data
 * Expects base64-encoded string: iv:encryptedData:authTag
 */
export function decryptText(
  encryptedData: string,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): string {
  if (!encryptedData) {
    return encryptedData;
  }

  try {
    const key = deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Return as UTF-8 string
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, it might be an old unencrypted message
    // Return the original data
    return encryptedData;
  }
}

/**
 * Encrypt binary data (for files, images, voice notes)
 * Returns base64-encoded string: iv:encryptedData:authTag
 */
export function encryptBinary(
  data: Buffer | Uint8Array,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): string {
  if (!data || data.length === 0) {
    return '';
  }

  try {
    const key = deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    const buffer = Buffer.from(data);
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag
    const combined = Buffer.concat([iv, encrypted, authTag]);
    
    // Return as base64 string
    return combined.toString('base64');
  } catch (error) {
    console.error('Binary encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt binary data (for files, images, voice notes)
 * Expects base64-encoded string: iv:encryptedData:authTag
 * Returns Buffer
 */
export function decryptBinary(
  encryptedData: string,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): Buffer {
  if (!encryptedData) {
    return Buffer.alloc(0);
  }

  try {
    const key = deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  } catch (error) {
    console.error('Binary decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Check if a string is encrypted (heuristic check)
 * Encrypted strings are base64 and have a minimum length
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  
  // Encrypted data should be base64 and have minimum length
  // IV (16) + at least some data + AuthTag (16) = minimum ~32 bytes = ~44 base64 chars
  if (data.length < 44) return false;
  
  // Check if it's valid base64
  try {
    const decoded = Buffer.from(data, 'base64');
    // Should have at least IV + AuthTag = 32 bytes
    return decoded.length >= 32;
  } catch {
    return false;
  }
}

