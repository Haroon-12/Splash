# Chat Encryption Testing Guide

## ✅ Automated Tests - PASSED

All encryption/decryption tests have passed successfully:
- ✅ Text message encryption/decryption
- ✅ Binary data (files) encryption/decryption
- ✅ Key derivation consistency
- ✅ Conversation isolation
- ✅ Edge case handling

## 🧪 Manual Testing in Browser

### Prerequisites
1. Server should be running on `http://localhost:3000`
2. You need at least 2 user accounts (brand and influencer, or any two users)
3. Both users should be logged in

### Test Steps

#### 1. Test Text Message Encryption

**Steps:**
1. Log in as User A
2. Navigate to `/dashboard/chat`
3. Start a conversation with User B (or select existing conversation)
4. Send a test message: "This is a test encrypted message!"
5. Check the database to verify the message is encrypted:
   ```sql
   SELECT content FROM messages ORDER BY id DESC LIMIT 1;
   ```
   The content should be a base64-encoded string, not the original text.

6. Log in as User B
7. Open the same conversation
8. Verify the message is decrypted and displays correctly: "This is a test encrypted message!"

**Expected Result:**
- ✅ Message appears encrypted in database (base64 string)
- ✅ Message displays correctly for both users
- ✅ Original text is not visible in database

---

#### 2. Test Image File Encryption

**Steps:**
1. Log in as User A
2. Open a conversation with User B
3. Click the image icon (📷) in the message input
4. Select an image file (JPG, PNG, etc.)
5. Wait for upload to complete
6. Send the message with the image

**Check Database:**
```sql
SELECT attachment_url, attachment_name FROM messages WHERE attachment_type = 'image' ORDER BY id DESC LIMIT 1;
```

7. Log in as User B
8. Open the conversation
9. Click "Decrypt & View Image" button
10. Verify the image displays correctly

**Expected Result:**
- ✅ Image file is encrypted on disk (stored as `.enc` file)
- ✅ Filename is encrypted in database
- ✅ Image decrypts and displays correctly for User B
- ✅ Image can be downloaded after decryption

---

#### 3. Test Document File Encryption

**Steps:**
1. Log in as User A
2. Open a conversation with User B
3. Click the paperclip icon (📎) in the message input
4. Select a document file (PDF, DOCX, etc.)
5. Wait for upload to complete
6. Send the message with the document

**Check Database:**
```sql
SELECT attachment_url, attachment_name FROM messages WHERE attachment_type = 'document' ORDER BY id DESC LIMIT 1;
```

7. Log in as User B
8. Open the conversation
9. Click "Decrypt & Download Document" button
10. Verify the document opens correctly

**Expected Result:**
- ✅ Document file is encrypted on disk
- ✅ Filename is encrypted in database
- ✅ Document decrypts and opens correctly
- ✅ Document can be downloaded after decryption

---

#### 4. Test Voice Message Encryption

**Steps:**
1. Log in as User A
2. Open a conversation with User B
3. Click the microphone icon (🎤) in the message input
4. Allow microphone access when prompted
5. Record a short voice message (5-10 seconds)
6. Click the microphone icon again to stop recording
7. Wait for upload to complete
8. Send the voice message

**Check Database:**
```sql
SELECT attachment_url, attachment_name FROM messages WHERE attachment_type = 'voice' ORDER BY id DESC LIMIT 1;
```

9. Log in as User B
10. Open the conversation
11. Click "Decrypt & Play Voice Note" button
12. Verify the audio plays correctly

**Expected Result:**
- ✅ Voice file is encrypted on disk
- ✅ Filename is encrypted in database
- ✅ Audio decrypts and plays correctly
- ✅ Voice note can be downloaded after decryption

---

## 🔍 Verification Checklist

After completing all tests, verify:

- [ ] Text messages are encrypted in database
- [ ] Text messages decrypt correctly for recipients
- [ ] Image files are encrypted on disk (`.enc` extension)
- [ ] Images decrypt and display correctly
- [ ] Document files are encrypted on disk
- [ ] Documents decrypt and open correctly
- [ ] Voice messages are encrypted on disk
- [ ] Voice messages decrypt and play correctly
- [ ] Filenames are encrypted in database
- [ ] Only conversation participants can decrypt messages
- [ ] Messages from different conversations are isolated

---

## 🐛 Troubleshooting

### Issue: "Failed to encrypt message"
**Solution:** Check that `CHAT_ENCRYPTION_SECRET` is set in `.env` file

### Issue: "Failed to decrypt message"
**Possible Causes:**
- Encryption secret changed (old messages won't decrypt)
- Wrong conversation ID or participant IDs
- Corrupted encrypted data

### Issue: Files not decrypting
**Solution:**
- Check browser console for errors
- Verify the file was uploaded as encrypted (check file extension is `.enc`)
- Ensure both users are in the same conversation

### Issue: Server not starting
**Solution:**
- Check if port 3000 is already in use
- Verify all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run build`

---

## 📊 Database Verification Queries

### Check encrypted messages:
```sql
SELECT 
  id, 
  conversation_id, 
  sender_id, 
  content, 
  attachment_name,
  created_at 
FROM messages 
ORDER BY id DESC 
LIMIT 10;
```

### Check encrypted file storage:
```bash
# Check uploads directory
ls -la public/uploads/*.enc
```

### Verify encryption format:
- Encrypted text should be base64 strings (long alphanumeric strings)
- Encrypted files should have `.enc` extension
- Filenames in database should be base64 strings (not readable)

---

## ✅ Success Criteria

All tests are successful if:
1. ✅ All messages are encrypted in database
2. ✅ All files are encrypted on disk
3. ✅ All messages decrypt correctly for recipients
4. ✅ All files decrypt and display/play correctly
5. ✅ No plaintext data visible in database or file system
6. ✅ Different conversations have different encryption keys
7. ✅ Only conversation participants can decrypt messages

---

## 🎉 Testing Complete!

If all tests pass, your chat encryption system is working correctly!

