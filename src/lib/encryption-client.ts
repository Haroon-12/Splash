/**
 * Client-side Encryption Utility
 * Uses Web Crypto API for browser-based encryption
 * Compatible with server-side encryption
 */

// Encryption configuration (must match server-side)
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000;

/**
 * Get the encryption secret from environment variable
 * For client-side, we'll need to fetch it from an API endpoint
 * or use a different approach (like deriving from user session)
 */
async function getEncryptionSecret(): Promise<string> {
  try {
    const response = await fetch('/api/encryption/secret');
    if (!response.ok) {
      throw new Error('Failed to get encryption secret');
    }
    const data = await response.json();
    return data.secret;
  } catch (error) {
    console.error('Error fetching encryption secret:', error);
    throw new Error('Failed to initialize encryption');
  }
}

/**
 * Derive encryption key for a conversation (client-side)
 */
async function deriveConversationKey(
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): Promise<CryptoKey> {
  // Sort participant IDs to ensure consistent key generation
  const sortedParticipants = [participant1Id, participant2Id].sort();
  
  // Create salt from conversation ID and sorted participant IDs
  const saltData = `${conversationId}:${sortedParticipants[0]}:${sortedParticipants[1]}`;
  const saltBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(saltData));
  
  // Get the base secret
  const secret = await getEncryptionSecret();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    secretKey,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
  
  return key;
}

/**
 * Encrypt text data (client-side)
 * Returns base64-encoded string: iv:encryptedData:authTag
 * Note: Web Crypto API includes auth tag in encrypted data, so we need to extract it
 */
export async function encryptText(
  text: string,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): Promise<string> {
  if (!text) {
    return text;
  }

  try {
    const key = await deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Encrypt
    const encodedText = new TextEncoder().encode(text);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: AUTH_TAG_LENGTH * 8, // in bits
      },
      key,
      encodedText
    );
    
    // Web Crypto API includes auth tag at the end of encrypted data
    // Extract encrypted data and auth tag
    const encryptedArray = new Uint8Array(encrypted);
    const encryptedData = encryptedArray.subarray(0, encryptedArray.length - AUTH_TAG_LENGTH);
    const authTag = encryptedArray.subarray(encryptedArray.length - AUTH_TAG_LENGTH);
    
    // Combine IV, encrypted data, and auth tag (to match server format)
    const combined = new Uint8Array(iv.length + encryptedData.length + authTag.length);
    combined.set(iv, 0);
    combined.set(encryptedData, iv.length);
    combined.set(authTag, iv.length + encryptedData.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Client encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt text data (client-side)
 * Expects base64-encoded string: iv:encryptedData:authTag
 */
export async function decryptText(
  encryptedData: string,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): Promise<string> {
  if (!encryptedData) {
    return encryptedData;
  }

  try {
    const key = await deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    
    // Combine encrypted data and auth tag (Web Crypto API expects them together)
    const encryptedWithTag = new Uint8Array(encrypted.length + authTag.length);
    encryptedWithTag.set(encrypted, 0);
    encryptedWithTag.set(authTag, encrypted.length);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: AUTH_TAG_LENGTH * 8, // in bits
      },
      key,
      encryptedWithTag
    );
    
    // Return as UTF-8 string
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Client decryption error:', error);
    // If decryption fails, it might be an old unencrypted message
    // Return the original data
    return encryptedData;
  }
}

/**
 * Encrypt binary data (client-side) - for files
 * Returns base64-encoded string
 */
export async function encryptBinary(
  data: ArrayBuffer | Uint8Array,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): Promise<string> {
  if (!data || data.byteLength === 0) {
    return '';
  }

  try {
    const key = await deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Convert to ArrayBuffer if needed
    const buffer = data instanceof ArrayBuffer ? data : (data.buffer instanceof ArrayBuffer ? data.buffer : new Uint8Array(data).buffer);
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: AUTH_TAG_LENGTH * 8,
      },
      key,
      buffer
    );
    
    // Web Crypto API includes auth tag at the end
    // Extract encrypted data and auth tag
    const encryptedArray = new Uint8Array(encrypted);
    const encryptedData = encryptedArray.subarray(0, encryptedArray.length - AUTH_TAG_LENGTH);
    const authTag = encryptedArray.subarray(encryptedArray.length - AUTH_TAG_LENGTH);
    
    // Combine IV, encrypted data, and auth tag
    const combined = new Uint8Array(iv.length + encryptedData.length + authTag.length);
    combined.set(iv, 0);
    combined.set(encryptedData, iv.length);
    combined.set(authTag, iv.length + encryptedData.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Client binary encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt binary data (client-side) - for files
 * Returns ArrayBuffer
 */
export async function decryptBinary(
  encryptedData: string,
  conversationId: number,
  participant1Id: string,
  participant2Id: string
): Promise<ArrayBuffer> {
  if (!encryptedData) {
    return new ArrayBuffer(0);
  }

  try {
    const key = await deriveConversationKey(conversationId, participant1Id, participant2Id);
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV, encrypted data, and auth tag
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
    
    // Combine encrypted data and auth tag (Web Crypto API expects them together)
    const encryptedWithTag = new Uint8Array(encrypted.length + authTag.length);
    encryptedWithTag.set(encrypted, 0);
    encryptedWithTag.set(authTag, encrypted.length);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: AUTH_TAG_LENGTH * 8,
      },
      key,
      encryptedWithTag
    );
    
    return decrypted;
  } catch (error) {
    console.error('Client binary decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Check if a string is encrypted (heuristic check)
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  
  // Encrypted data should be base64 and have minimum length
  if (data.length < 44) return false;
  
  // Check if it's valid base64
  try {
    const decoded = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    return decoded.length >= 32; // IV + AuthTag minimum
  } catch {
    return false;
  }
}

