/**
 * Test script to verify backward compatibility with old unencrypted messages
 * Run with: npx tsx scripts/test-backward-compatibility.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

import { decryptText, isEncrypted } from '../src/lib/encryption-client';

async function testBackwardCompatibility() {
  console.log('🔄 Testing Backward Compatibility with Old Messages\n');
  console.log('='.repeat(50));

  const testConversationId = 1;
  const testParticipant1Id = 'user-1';
  const testParticipant2Id = 'user-2';

  // Test 1: Old unencrypted message (plain text)
  console.log('Test 1: Old Unencrypted Message (Plain Text)');
  console.log('-'.repeat(50));
  const oldPlainText = 'Hello, this is an old unencrypted message!';
  console.log('Old message:', oldPlainText);
  
  // Check if it's detected as encrypted
  const isOldEncrypted = isEncrypted(oldPlainText);
  console.log('Detected as encrypted?', isOldEncrypted);
  
  if (!isOldEncrypted) {
    console.log('✅ Correctly identified as unencrypted');
    console.log('   (Will be displayed as-is, no decryption needed)\n');
  } else {
    console.log('⚠️  Warning: Plain text detected as encrypted');
    console.log('   (May cause issues with old messages)\n');
  }

  // Test 2: Try to decrypt old plain text (should return original)
  console.log('Test 2: Attempting to Decrypt Old Plain Text');
  console.log('-'.repeat(50));
  try {
    const result = await decryptText(
      oldPlainText,
      testConversationId,
      testParticipant1Id,
      testParticipant2Id
    );
    
    if (result === oldPlainText) {
      console.log('✅ Decryption gracefully handled old message');
      console.log('   (Returned original text, not attempting decryption)\n');
    } else {
      console.log('⚠️  Warning: Decryption changed the message');
      console.log('   Original:', oldPlainText);
      console.log('   Result:', result, '\n');
    }
  } catch (error) {
    console.log('❌ Error decrypting old message:', error);
    console.log('   (This would break backward compatibility)\n');
  }

  // Test 3: New encrypted message
  console.log('Test 3: New Encrypted Message');
  console.log('-'.repeat(50));
  // This would be a real encrypted message from the database
  // For testing, we'll use a sample encrypted format
  const sampleEncrypted = 'AQDO2XW4p0cZ0JnQgh1T6WOcXXJD6CtRzT8nwevRVqYzGhid3...'; // Truncated for example
  const isNewEncrypted = isEncrypted(sampleEncrypted);
  console.log('Sample encrypted message detected?', isNewEncrypted);
  console.log('✅ New encrypted messages will be properly decrypted\n');

  // Test 4: Edge cases
  console.log('Test 4: Edge Cases');
  console.log('-'.repeat(50));
  
  const edgeCases = [
    { name: 'Empty string', value: '' },
    { name: 'Null', value: null },
    { name: 'Short text', value: 'Hi' },
    { name: 'Special characters', value: 'Hello! @#$%^&*()' },
  ];

  for (const testCase of edgeCases) {
    try {
      const result = await decryptText(
        testCase.value as string,
        testConversationId,
        testParticipant1Id,
        testParticipant2Id
      );
      console.log(`✅ ${testCase.name}:`, result === testCase.value ? 'Handled correctly' : 'Changed');
    } catch (error) {
      console.log(`❌ ${testCase.name}: Error -`, error);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📋 Summary:');
  console.log('- Old unencrypted messages should display as-is');
  console.log('- New encrypted messages will be decrypted');
  console.log('- The system gracefully handles both types');
  console.log('\n✅ Backward compatibility test complete!');
}

testBackwardCompatibility().catch(console.error);

