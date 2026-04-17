# Real-Time Chat System with E2E Encryption

## Overview
The platform provides a real-time messaging system between brands and influencers. All messages are encrypted server-side using **AES-256-GCM** before storage and decrypted on retrieval. The chat supports text messages, file attachments (images, documents), and read receipts.

---

## Files Involved

### Frontend
| File | Purpose |
|---|---|
| `src/app/dashboard/chat/page.tsx` | Main chat UI — conversation list, message view, input |
| `src/app/messages/page.tsx` | Alternate messages page |

### Backend API
| File | Purpose |
|---|---|
| `src/app/api/conversations/route.ts` | GET (list conversations), POST (create conversation) |
| `src/app/api/conversations/[conversationId]/route.ts` | GET single conversation details |
| `src/app/api/conversations/[conversationId]/messages/route.ts` | GET messages for a conversation (decrypted) |
| `src/app/api/messages/route.ts` | GET (fetch), POST (send — encrypts before storing) |
| `src/app/api/messages/[messageId]/read/route.ts` | PATCH — mark message as read |

### Encryption
| File | Purpose |
|---|---|
| `src/lib/encryption.ts` | Server-side: `encryptText()`, `decryptText()`, `encryptBinary()`, `decryptBinary()`, `isEncrypted()` |
| `src/lib/encryption-client.ts` | Client-side encryption utilities |
| `src/lib/aes256gsm.js` | Low-level AES implementation |
| `src/app/api/encryption/secret/route.ts` | API to retrieve encryption secret |

### Database Tables
| Table | Key Fields |
|---|---|
| `conversations` | id, participant1Id, participant2Id, lastMessageAt |
| `messages` | id, conversationId, senderId, content (encrypted), attachmentType, attachmentUrl, isRead, readAt |

---

## Chat Page — `src/app/dashboard/chat/page.tsx`

### What It Does
- Left sidebar shows all conversations with the other participant's name & avatar
- Unread message count shown as a badge (hidden when 0)
- Main area shows messages in a scrollable view
- Message input with send button
- File attachment support (images, documents)
- Read receipt indicators

### Technical Details
- **Polling:** Fetches new messages every 3 seconds via `setInterval`
- **Auto-scroll:** Scrolls to bottom when new messages arrive
- **Unread count:** Calculated per conversation; only shown when > 0 (not 0)
- **URL-based routing:** `?conversation=ID` query param to open specific chat
- **Responsive:** Full-width conversation list on mobile, side-by-side on desktop

---

## Encryption System — `src/lib/encryption.ts`

### Algorithm
- **AES-256-GCM** (Authenticated Encryption with Associated Data)
- 256-bit key, 128-bit IV, 128-bit auth tag

### Key Derivation
```
PBKDF2(
  password = CHAT_ENCRYPTION_SECRET (env variable),
  salt = SHA256(conversationId + sorted(participant1Id, participant2Id)),
  iterations = 100,000,
  keyLength = 32 bytes,
  digest = sha256
)
```

### Encrypt Flow
1. Derive conversation-specific key from conversation ID + participant IDs
2. Generate random 16-byte IV
3. Create AES-256-GCM cipher with key + IV
4. Encrypt plaintext → get ciphertext + auth tag
5. Concatenate: `IV || ciphertext || authTag`
6. Base64-encode the result → stored in DB

### Decrypt Flow
1. Base64-decode the stored string
2. Extract IV (first 16 bytes), auth tag (last 16 bytes), ciphertext (middle)
3. Derive same key using same inputs
4. Create decipher with key + IV + auth tag
5. Decrypt → return plaintext
6. **Fallback:** If decryption fails, return raw data (handles pre-encryption messages)

### Security Properties
- **Confidentiality:** AES-256 encryption
- **Integrity:** GCM auth tag prevents tampering
- **Per-conversation keys:** Each conversation has a unique derived key
- **Consistent keys:** Both participants derive the same key (participant IDs are sorted)

---

## Message Flow

### Sending a Message
```
User types message → POST /api/messages
  → Server gets conversation participants
  → encryptText(content, conversationId, p1Id, p2Id)
  → INSERT into messages table (encrypted content)
  → UPDATE conversations.lastMessageAt
  → Return success
```

### Receiving Messages
```
GET /api/conversations/[id]/messages
  → Fetch messages from DB
  → For each message: decryptText(content, conversationId, p1Id, p2Id)
  → Return decrypted messages to client
```

### Read Receipts
```
PATCH /api/messages/[messageId]/read
  → UPDATE messages SET isRead = true, readAt = now()
```

---

## Unread Message Handling
- Each conversation shows unread count badge
- Count = messages where `senderId != currentUserId` AND `isRead = false`
- Badge hidden when count is 0 (not showing "0")
- "Mark all read" on conversation open
