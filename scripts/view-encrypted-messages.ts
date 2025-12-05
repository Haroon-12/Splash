/**
 * Script to view encrypted messages from the database
 * Run with: npx tsx scripts/view-encrypted-messages.ts
 */

import Database from 'better-sqlite3';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const db = new Database('local.db');

interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  attachment_type: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  is_read: number;
  created_at: number;
}

function isEncrypted(data: string | null): boolean {
  if (!data) return false;
  // Encrypted data should be base64 and have minimum length
  if (data.length < 44) return false;
  try {
    const decoded = Buffer.from(data, 'base64');
    return decoded.length >= 32; // IV + AuthTag minimum
  } catch {
    return false;
  }
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString();
}

function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

console.log('🔐 Encrypted Messages Viewer\n');
console.log('='.repeat(80));

// Get all messages
const messages = db.prepare(`
  SELECT 
    m.id,
    m.conversation_id,
    m.sender_id,
    m.content,
    m.attachment_type,
    m.attachment_url,
    m.attachment_name,
    m.attachment_size,
    m.is_read,
    m.created_at,
    u1.name as sender_name,
    u1.email as sender_email,
    c.participant1_id,
    c.participant2_id
  FROM messages m
  LEFT JOIN user u1 ON m.sender_id = u1.id
  LEFT JOIN conversations c ON m.conversation_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 50
`).all() as (Message & {
  sender_name: string;
  sender_email: string;
  participant1_id: string;
  participant2_id: string;
})[];

if (messages.length === 0) {
  console.log('No messages found in the database.');
  db.close();
  process.exit(0);
}

console.log(`\nFound ${messages.length} messages (showing latest 50)\n`);

// Group by conversation
const byConversation = new Map<number, typeof messages>();
messages.forEach(msg => {
  if (!byConversation.has(msg.conversation_id)) {
    byConversation.set(msg.conversation_id, []);
  }
  byConversation.get(msg.conversation_id)!.push(msg);
});

// Display messages
byConversation.forEach((conversationMessages, conversationId) => {
  console.log(`\n conversation_id: ${conversationId}`);
  console.log('-'.repeat(80));
  
  conversationMessages.forEach((msg, index) => {
    const isContentEncrypted = isEncrypted(msg.content);
    const isNameEncrypted = isEncrypted(msg.attachment_name);
    
    console.log(`\nMessage #${msg.id} (${index + 1}/${conversationMessages.length})`);
    console.log(`  From: ${msg.sender_name || msg.sender_email} (${msg.sender_id})`);
    console.log(`  Date: ${formatDate(msg.created_at)}`);
    console.log(`  Read: ${msg.is_read ? 'Yes' : 'No'}`);
    
    // Content
    console.log(`  Content:`);
    if (isContentEncrypted) {
      console.log(`    🔒 ENCRYPTED (${msg.content.length} chars)`);
      console.log(`    Preview: ${truncateText(msg.content, 60)}`);
      console.log(`    Full: ${msg.content}`);
    } else {
      console.log(`    📝 Plain text: "${msg.content}"`);
    }
    
    // Attachments
    if (msg.attachment_url) {
      console.log(`  Attachment:`);
      console.log(`    Type: ${msg.attachment_type || 'N/A'}`);
      console.log(`    URL: ${msg.attachment_url}`);
      if (msg.attachment_name) {
        if (isNameEncrypted) {
          console.log(`    Name: 🔒 ENCRYPTED - ${truncateText(msg.attachment_name, 60)}`);
          console.log(`    Full encrypted name: ${msg.attachment_name}`);
        } else {
          console.log(`    Name: ${msg.attachment_name}`);
        }
      }
      if (msg.attachment_size) {
        console.log(`    Size: ${(msg.attachment_size / 1024).toFixed(2)} KB`);
      }
      
      // Check if file is encrypted (by extension)
      if (msg.attachment_url.endsWith('.enc')) {
        console.log(`    🔒 File is ENCRYPTED (has .enc extension)`);
      } else {
        console.log(`    📄 File appears to be UNENCRYPTED`);
      }
    }
    
    console.log('');
  });
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 Summary:');
const encryptedContentCount = messages.filter(m => isEncrypted(m.content)).length;
const encryptedFiles = messages.filter(m => m.attachment_url?.endsWith('.enc')).length;
const encryptedNames = messages.filter(m => isEncrypted(m.attachment_name)).length;

// A message is considered "encrypted" if:
// 1. Content is encrypted, OR
// 2. Has an encrypted file (with .enc extension), OR
// 3. Has an encrypted filename
const encryptedMessages = messages.filter(m => 
  isEncrypted(m.content) || 
  (m.attachment_url?.endsWith('.enc')) || 
  isEncrypted(m.attachment_name)
).length;

const plainTextMessages = messages.length - encryptedMessages;

console.log(`  Total messages: ${messages.length}`);
console.log(`  🔒 Encrypted messages: ${encryptedMessages} (content, file, or filename encrypted)`);
console.log(`    - Encrypted content: ${encryptedContentCount}`);
console.log(`    - Encrypted files: ${encryptedFiles}`);
console.log(`    - Encrypted filenames: ${encryptedNames}`);
console.log(`  📝 Plain text messages: ${plainTextMessages} (no encryption)`);
console.log(`  📄 Unencrypted files: ${messages.filter(m => m.attachment_url && !m.attachment_url.endsWith('.enc')).length}`);

console.log('\n' + '='.repeat(80));
console.log('\n💡 Tips:');
console.log('  - Encrypted content appears as long base64 strings');
console.log('  - Encrypted files have .enc extension');
console.log('  - Old messages may be in plain text (backward compatible)');
console.log('  - New messages are automatically encrypted');

db.close();

