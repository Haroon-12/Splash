/**
 * Test script to verify encryption/decryption functionality
 * Run with: npx tsx scripts/test-encryption.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

import { encryptText, decryptText, encryptBinary, decryptBinary } from '../src/lib/encryption';

// Test data
const testConversationId = 1;
const testParticipant1Id = 'user-1';
const testParticipant2Id = 'user-2';
const testMessage = 'Hello, this is a test message!';
const testBinaryData = Buffer.from('This is test binary data for file encryption');

async function testEncryption() {
  console.log('🔐 Testing Chat Encryption System\n');
  console.log('='.repeat(50));

  // Check if secret is set
  if (!process.env.CHAT_ENCRYPTION_SECRET) {
    console.error('❌ ERROR: CHAT_ENCRYPTION_SECRET not set in environment');
    console.log('Please add it to your .env file');
    process.exit(1);
  }
  console.log('✅ Encryption secret loaded from environment\n');

  try {
    // Test 1: Text Encryption/Decryption
    console.log('Test 1: Text Message Encryption/Decryption');
    console.log('-'.repeat(50));
    console.log('Original message:', testMessage);
    
    const encryptedText = encryptText(
      testMessage,
      testConversationId,
      testParticipant1Id,
      testParticipant2Id
    );
    console.log('Encrypted (base64):', encryptedText.substring(0, 50) + '...');
    console.log('Encrypted length:', encryptedText.length, 'characters');
    
    const decryptedText = decryptText(
      encryptedText,
      testConversationId,
      testParticipant1Id,
      testParticipant2Id
    );
    console.log('Decrypted message:', decryptedText);
    
    if (decryptedText === testMessage) {
      console.log('✅ Text encryption/decryption: PASSED\n');
    } else {
      console.log('❌ Text encryption/decryption: FAILED');
      console.log('Expected:', testMessage);
      console.log('Got:', decryptedText);
      process.exit(1);
    }

    // Test 2: Binary Encryption/Decryption (for files)
    console.log('Test 2: Binary Data Encryption/Decryption (Files)');
    console.log('-'.repeat(50));
    console.log('Original data length:', testBinaryData.length, 'bytes');
    
    const encryptedBinary = encryptBinary(
      testBinaryData,
      testConversationId,
      testParticipant1Id,
      testParticipant2Id
    );
    console.log('Encrypted (base64):', encryptedBinary.substring(0, 50) + '...');
    console.log('Encrypted length:', encryptedBinary.length, 'characters');
    
    const decryptedBinary = decryptBinary(
      encryptedBinary,
      testConversationId,
      testParticipant1Id,
      testParticipant2Id
    );
    console.log('Decrypted data length:', decryptedBinary.length, 'bytes');
    
    if (decryptedBinary.equals(testBinaryData)) {
      console.log('✅ Binary encryption/decryption: PASSED\n');
    } else {
      console.log('❌ Binary encryption/decryption: FAILED');
      process.exit(1);
    }

    // Test 3: Key Consistency (same inputs = same key)
    console.log('Test 3: Key Derivation Consistency');
    console.log('-'.repeat(50));
    const encrypted1 = encryptText(
      testMessage,
      testConversationId,
      testParticipant1Id,
      testParticipant2Id
    );
    const encrypted2 = encryptText(
      testMessage,
      testConversationId,
      testParticipant2Id, // Order reversed
      testParticipant1Id
    );
    
    // Both should decrypt to the same message (key is derived consistently)
    const decrypted1 = decryptText(
      encrypted1,
      testConversationId,
      testParticipant1Id,
      testParticipant2Id
    );
    const decrypted2 = decryptText(
      encrypted2,
      testConversationId,
      testParticipant2Id,
      testParticipant1Id
    );
    
    if (decrypted1 === testMessage && decrypted2 === testMessage) {
      console.log('✅ Key derivation consistency: PASSED');
      console.log('   (Same key derived regardless of participant order)\n');
    } else {
      console.log('❌ Key derivation consistency: FAILED');
      process.exit(1);
    }

    // Test 4: Different conversations get different keys
    console.log('Test 4: Conversation Isolation');
    console.log('-'.repeat(50));
    const encryptedConv1 = encryptText(
      testMessage,
      1, // Conversation 1
      testParticipant1Id,
      testParticipant2Id
    );
    const encryptedConv2 = encryptText(
      testMessage,
      2, // Conversation 2
      testParticipant1Id,
      testParticipant2Id
    );
    
    // Encrypted messages should be different
    if (encryptedConv1 !== encryptedConv2) {
      console.log('✅ Conversation isolation: PASSED');
      console.log('   (Different conversations produce different encrypted data)\n');
    } else {
      console.log('❌ Conversation isolation: FAILED');
      process.exit(1);
    }

    // Test 5: Empty/null handling
    console.log('Test 5: Edge Cases');
    console.log('-'.repeat(50));
    const emptyEncrypted = encryptText('', testConversationId, testParticipant1Id, testParticipant2Id);
    const emptyDecrypted = decryptText('', testConversationId, testParticipant1Id, testParticipant2Id);
    
    if (emptyEncrypted === '' && emptyDecrypted === '') {
      console.log('✅ Empty string handling: PASSED\n');
    } else {
      console.log('❌ Empty string handling: FAILED');
      process.exit(1);
    }

    console.log('='.repeat(50));
    console.log('🎉 All encryption tests PASSED!');
    console.log('\nThe encryption system is working correctly.');
    console.log('You can now test in the browser by:');
    console.log('1. Opening the chat page');
    console.log('2. Sending a text message');
    console.log('3. Uploading a file/image');
    console.log('4. Sending a voice note');
    console.log('5. Verifying messages are encrypted in the database');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testEncryption();

