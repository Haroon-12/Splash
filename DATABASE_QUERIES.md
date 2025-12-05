# Database Queries Guide - Viewing Encrypted Messages

## Database Location
- **File**: `local.db` (SQLite database in project root)
- **Table**: `messages` (stores all chat messages)

## Quick View Script
Run this command to see all encrypted messages:
```bash
npx tsx scripts/view-encrypted-messages.ts
```

## Direct SQL Queries

### Using SQLite Command Line

1. **Open SQLite database:**
```bash
sqlite3 local.db
```

2. **View all messages with encryption status:**
```sql
SELECT 
  id,
  conversation_id,
  sender_id,
  CASE 
    WHEN LENGTH(content) > 44 AND content GLOB '*[A-Za-z0-9+/=]*' THEN '🔒 ENCRYPTED'
    ELSE '📝 Plain Text'
  END as encryption_status,
  content,
  attachment_type,
  attachment_url,
  attachment_name,
  datetime(created_at, 'unixepoch') as created_at
FROM messages
ORDER BY created_at DESC
LIMIT 20;
```

3. **View only encrypted messages:**
```sql
SELECT 
  id,
  conversation_id,
  sender_id,
  content as encrypted_content,
  LENGTH(content) as content_length,
  attachment_name as encrypted_filename,
  datetime(created_at, 'unixepoch') as created_at
FROM messages
WHERE LENGTH(content) > 44  -- Encrypted messages are longer
ORDER BY created_at DESC;
```

4. **View only plain text (old) messages:**
```sql
SELECT 
  id,
  conversation_id,
  sender_id,
  content as plain_text,
  datetime(created_at, 'unixepoch') as created_at
FROM messages
WHERE LENGTH(content) <= 100  -- Plain text is usually shorter
  AND content NOT GLOB '*[A-Za-z0-9+/=]{40,}*'  -- Not base64-like
ORDER BY created_at DESC;
```

5. **View encrypted files:**
```sql
SELECT 
  id,
  conversation_id,
  attachment_type,
  attachment_url,
  CASE 
    WHEN attachment_url LIKE '%.enc' THEN '🔒 ENCRYPTED'
    ELSE '📄 UNENCRYPTED'
  END as file_status,
  attachment_name,
  attachment_size,
  datetime(created_at, 'unixepoch') as created_at
FROM messages
WHERE attachment_url IS NOT NULL
ORDER BY created_at DESC;
```

6. **Get message statistics:**
```sql
SELECT 
  COUNT(*) as total_messages,
  SUM(CASE WHEN LENGTH(content) > 44 THEN 1 ELSE 0 END) as encrypted_messages,
  SUM(CASE WHEN LENGTH(content) <= 100 THEN 1 ELSE 0 END) as plain_text_messages,
  SUM(CASE WHEN attachment_url LIKE '%.enc' THEN 1 ELSE 0 END) as encrypted_files
FROM messages;
```

7. **View messages with sender information:**
```sql
SELECT 
  m.id,
  m.conversation_id,
  u.name as sender_name,
  u.email as sender_email,
  CASE 
    WHEN LENGTH(m.content) > 44 THEN '🔒 ENCRYPTED'
    ELSE '📝 Plain Text'
  END as encryption_status,
  m.content,
  m.attachment_type,
  m.attachment_url,
  datetime(m.created_at, 'unixepoch') as created_at
FROM messages m
LEFT JOIN user u ON m.sender_id = u.id
ORDER BY m.created_at DESC
LIMIT 20;
```

8. **View conversation details:**
```sql
SELECT 
  c.id as conversation_id,
  u1.name as participant1,
  u2.name as participant2,
  COUNT(m.id) as message_count,
  SUM(CASE WHEN LENGTH(m.content) > 44 THEN 1 ELSE 0 END) as encrypted_count
FROM conversations c
LEFT JOIN user u1 ON c.participant1_id = u1.id
LEFT JOIN user u2 ON c.participant2_id = u2.id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id
ORDER BY c.id;
```

## Using Node.js Script

### View All Messages
```bash
npx tsx scripts/view-encrypted-messages.ts
```

### Custom Query Script
Create a file `scripts/custom-query.ts`:
```typescript
import Database from 'better-sqlite3';
const db = new Database('local.db');

// Your custom query here
const messages = db.prepare(`
  SELECT * FROM messages 
  WHERE LENGTH(content) > 44
  ORDER BY created_at DESC
`).all();

console.log(messages);
db.close();
```

## Understanding Encrypted Data

### Message Content
- **Encrypted**: Long base64 string (usually 44+ characters)
  - Example: `+pVJKfPpo7JwzGw3hipf+CFmc0MoJUqXSxzwMnxM68xLqFPQw0c3Asw=`
- **Plain Text**: Readable text
  - Example: `"Hello, how are you?"`

### File Names
- **Encrypted**: Base64 string
  - Example: `daFI0Jr9D0Ujy4j27hhSd6WxTAmJ1CXg8CYpC/WdVMXTWJkJgjKR`
- **Plain Text**: Original filename
  - Example: `document.pdf`

### Files
- **Encrypted**: File has `.enc` extension
  - Example: `/uploads/1764942597445-ndvbdyiwhv.enc`
- **Unencrypted**: Original file extension
  - Example: `/uploads/1764440831784-f037k656oc.png`

## Database Schema

### Messages Table Structure
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,           -- Encrypted or plain text
  attachment_type TEXT,            -- 'image', 'document', 'voice'
  attachment_url TEXT,             -- File path (may have .enc extension)
  attachment_name TEXT,            -- Encrypted or plain filename
  attachment_size INTEGER,         -- File size in bytes
  is_read INTEGER DEFAULT 0,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);
```

## Tips

1. **Encrypted messages** are stored as base64 strings in the `content` column
2. **Encrypted files** have `.enc` extension in `attachment_url`
3. **Encrypted filenames** are base64 strings in `attachment_name`
4. **Old messages** (before encryption) remain in plain text for backward compatibility
5. **New messages** are automatically encrypted when sent

## Verification

To verify encryption is working:
1. Send a new message through the chat
2. Run the view script: `npx tsx scripts/view-encrypted-messages.ts`
3. Check that the new message shows as 🔒 ENCRYPTED
4. Verify the content is a base64 string, not readable text

