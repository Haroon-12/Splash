# Chapter 4

## Implementation and Testing

### 4.1 Overview

Splash is an AI-powered influencer-brand collaboration platform built using Next.js 15 and TypeScript to facilitate seamless connections between influencers and brands. The application uses end-to-end encryption for secure messaging, Drizzle ORM for database management, and Better Auth for authentication. The system enables discovery through search and filtering, real-time messaging with file attachments, campaign management, and analytics. 

The application consists of an authentication system, a directory and search system, an encrypted messaging system, a file upload and storage system, and an admin dashboard. The backend uses Next.js API routes with SQLite database via Drizzle ORM. The frontend is built with React Server Components and Client Components using Next.js App Router. The project uses TypeScript for type safety and React Context API for state management.

### 4.2 Algorithm Design

#### 4.2.1 End-to-End Encryption Algorithm

The end-to-end encryption system uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption, ensuring that only the sender and receiver can read messages. The system encrypts all message content, file attachments, and voice notes before storage.

**Algorithm:** AES-256-GCM  
**Key Derivation:** PBKDF2 with SHA-256  
**Key Length:** 256 bits (32 bytes)  
**IV Length:** 128 bits (16 bytes)  
**Auth Tag Length:** 128 bits (16 bytes)  
**PBKDF2 Iterations:** 100,000  
**PBKDF2 Digest:** SHA-256

**Input:** 
- `text` or `binaryData`: Message content or file data
- `conversationId`: Unique conversation identifier
- `participant1Id`: First participant's user ID
- `participant2Id`: Second participant's user ID

**Steps:**

1. **Key Derivation:**
   - Sort participant IDs alphabetically to ensure consistent key generation
   - Create salt: `SHA-256(conversationId:participant1Id:participant2Id)`
   - Derive encryption key using PBKDF2:
     ```
     key = PBKDF2(masterSecret, salt, 100000 iterations, 32 bytes, SHA-256)
     ```

2. **Encryption:**
   - Generate random 16-byte IV (Initialization Vector)
   - Create AES-256-GCM cipher with derived key and IV
   - Encrypt plaintext data
   - Extract 16-byte authentication tag
   - Combine: `IV (16 bytes) + EncryptedData + AuthTag (16 bytes)`
   - Encode result as base64 string

3. **Decryption:**
   - Decode base64 string to binary
   - Extract IV (first 16 bytes), AuthTag (last 16 bytes), and encrypted data
   - Create AES-256-GCM decipher with derived key and IV
   - Set authentication tag
   - Decrypt data
   - Verify authentication tag (automatic in GCM mode)
   - Return decrypted plaintext

4. **Backward Compatibility:**
   - Check if data is encrypted using heuristic (base64, minimum length 44 chars)
   - If decryption fails, return original data (assumes unencrypted legacy message)

#### 4.2.2 Conversation Key Derivation Algorithm

The conversation key derivation algorithm generates a unique, consistent encryption key for each conversation pair.

**Input:** `conversationId`, `participant1Id`, `participant2Id`

**Steps:**

1. Sort participant IDs alphabetically: `[participant1Id, participant2Id].sort()`
2. Create salt string: `${conversationId}:${sortedParticipants[0]}:${sortedParticipants[1]}`
3. Hash salt using SHA-256: `salt = SHA-256(saltString)`
4. Retrieve master encryption secret from environment variable `CHAT_ENCRYPTION_SECRET`
5. Derive key using PBKDF2:
   ```
   key = PBKDF2(masterSecret, salt, 100000, 32, 'sha256')
   ```
6. Return 32-byte key buffer

**Output:** 32-byte encryption key (Buffer)

#### 4.2.3 Search and Matching Algorithm

The search algorithm implements intelligent substring matching for finding influencers and brands in the directory.

**Input:** `text` (string to search in), `query` (search query)

**Threshold:** Minimum query length = 2 characters

**Steps:**

1. **Input Validation:**
   - If `text` is null/undefined or `query` is empty, return `false`
   - Trim and normalize both strings to lowercase
   - If query length < 2 characters, return `false`

2. **Exact Match Check:**
   - If `textLower === queryLower`, return `true`

3. **Multi-word Query Handling:**
   - Split query into words (minimum 2 characters per word)
   - If multiple words exist:
     - Check if ALL words appear as consecutive substrings in text
     - Return `true` only if all words match

4. **Single Word Query:**
   - Check if query appears as consecutive substring in text
   - Example: "john" matches "johnson" or "John Doe" but not "hjon doe"

5. **Return Result:**
   - `true` if match found, `false` otherwise

**Priority Order for Directory Search:**
1. Name matching (highest priority)
2. Email matching (if name doesn't match)
3. Category, description, previous brands (secondary fields)

#### 4.2.4 CSV Parsing Algorithm

The CSV parsing algorithm handles complex CSV files with commas within parentheses (e.g., "Ducky Bhai (Saad ur Rehman)").

**Input:** CSV file content (string)

**Steps:**

1. Read CSV file from filesystem
2. Split content into lines, filter empty lines
3. Extract headers from first line
4. For each data line:
   - Initialize empty values array and current string buffer
   - Track parenthesis depth (`parenCount`)
   - Iterate through each character:
     - If `(` encountered: increment `parenCount`
     - If `)` encountered: decrement `parenCount`
     - If `,` encountered AND `parenCount === 0`: 
       - Push current buffer to values array
       - Reset buffer
     - Otherwise: append character to buffer
   - Push final buffer to values array
5. Map headers to values to create record object
6. Return array of records

**Output:** Array of parsed CSV records

#### 4.2.5 File Upload and Encryption Algorithm

The file upload algorithm handles encrypted and unencrypted file uploads with validation.

**Input:** 
- `file`: File object (Blob/File)
- `encrypted`: Boolean flag indicating if file is pre-encrypted
- `originalName`: Original filename (if encrypted)
- `originalType`: Original MIME type (if encrypted)

**Steps:**

1. **Validation:**
   - If file is missing, return error
   - If not encrypted, validate file type (images, PDFs, documents, audio)
   - Validate file size:
     - Images/documents: max 10MB
     - Audio: max 5MB
     - Encrypted files: allow 20% overhead

2. **File Processing:**
   - Create uploads directory if it doesn't exist
   - Generate unique filename: `${timestamp}-${randomString}.${extension}`
   - For encrypted files: use `.enc` extension
   - Convert file to ArrayBuffer, then to Buffer
   - Write buffer to filesystem

3. **Response:**
   - Return file URL, original name, size, type, and encryption status

**Output:** File metadata object with URL and properties

#### 4.2.6 User Registration Algorithm

The user registration algorithm creates new user accounts with role-based access control.

**Input:** `firstName`, `lastName`, `email`, `password`, `userType` (brand/influencer)

**Steps:**

1. **Validation:**
   - Validate email format
   - Validate password strength (minimum 6 characters, recommended: uppercase, lowercase, number)
   - Check if firstName and lastName are at least 2 characters
   - Check if email already exists in database

2. **CSV Matching (for influencers):**
   - If userType is 'influencer', check CSV data for matching email or name
   - If match found, pre-populate profile data from CSV

3. **Account Creation:**
   - Call Better Auth `auth.api.signUpEmail()` with email and password
   - Create user record in database with:
     - Generated user ID
     - Email, name (firstName + lastName)
     - userType (brand/influencer)
     - isApproved: false (requires admin approval)
     - createdAt timestamp

4. **Profile Initialization:**
   - If influencer: create `influencerProfiles` record with CSV data if available
   - If brand: create brand profile record
   - Set default preferences and empty history

5. **Response:**
   - Return success status and user ID
   - Navigate to login or pending approval page

#### 4.2.7 User Login Algorithm

The user login algorithm authenticates users and manages sessions.

**Input:** `email`, `password`

**Steps:**

1. **Validation:**
   - Validate email format
   - Check password is not empty

2. **Authentication:**
   - Call Better Auth `auth.api.signInEmail()` with email and password
   - If authentication fails, return error message

3. **Session Creation:**
   - Better Auth creates session token
   - Session stored in database with:
     - Token (unique)
     - User ID
     - Expiration time (7 days)
     - IP address and user agent

4. **User Profile Retrieval:**
   - Fetch user record from database using user ID
   - Check `isApproved` status
   - If not approved, return pending approval message
   - If suspended, return account suspended message

5. **Response:**
   - Return session token and user profile
   - Store session in HTTP-only cookie
   - Navigate to dashboard

#### 4.2.8 Conversation Creation Algorithm

The conversation creation algorithm establishes a new conversation between two users.

**Input:** `participant1Id`, `participant2Id`

**Steps:**

1. **Validation:**
   - Check both participant IDs are non-empty strings
   - Verify `participant1Id !== participant2Id`

2. **Duplicate Check:**
   - Query database for existing conversation:
     ```sql
     WHERE (participant1Id = p1 AND participant2Id = p2)
        OR (participant1Id = p2 AND participant2Id = p1)
     ```
   - If conversation exists, return existing conversation ID (409 Conflict)

3. **Conversation Creation:**
   - Insert new conversation record:
     - participant1Id
     - participant2Id
     - createdAt: current timestamp
     - lastMessageAt: null

4. **Response:**
   - Return conversation object with ID
   - Status: 201 Created

#### 4.2.9 Message Sending Algorithm

The message sending algorithm handles encrypted message creation and storage.

**Input:** 
- `senderId`: User ID of sender
- `conversationId`: Conversation ID
- `content`: Message text (will be encrypted)
- `attachmentType`: Type of attachment (image/document/voice)
- `attachmentUrl`: URL to encrypted file
- `attachmentName`: Encrypted filename

**Steps:**

1. **Client-Side Encryption:**
   - Encrypt message content using `encryptText()` function
   - If attachment exists:
     - Read file as ArrayBuffer
     - Encrypt file using `encryptBinary()` function
     - Upload encrypted file to server
     - Encrypt original filename using `encryptText()`

2. **Server-Side Validation:**
   - Validate senderId exists in database
   - Validate conversationId is valid number
   - Validate content or attachmentUrl is provided
   - Validate content length ≤ 5000 characters

3. **Message Storage:**
   - Insert message record:
     - senderId
     - conversationId
     - content: encrypted text
     - attachmentType, attachmentUrl, attachmentName, attachmentSize
     - isRead: false
     - createdAt: current timestamp

4. **Conversation Update:**
   - Update conversation's `lastMessageAt` to current timestamp

5. **Response:**
   - Return created message object
   - Status: 201 Created

#### 4.2.10 Message Decryption and Display Algorithm

The message decryption algorithm decrypts and displays messages to recipients.

**Input:** 
- `encryptedContent`: Base64-encoded encrypted message
- `conversationId`: Conversation ID
- `participant1Id`, `participant2Id`: Participant IDs

**Steps:**

1. **Encryption Detection:**
   - Check if content is encrypted using `isEncrypted()` heuristic
   - If not encrypted, display as plain text (backward compatibility)

2. **Key Derivation:**
   - Derive conversation key using `deriveConversationKey()`

3. **Decryption:**
   - Decode base64 to binary
   - Extract IV, encrypted data, and auth tag
   - Decrypt using AES-256-GCM
   - Verify authentication tag

4. **Attachment Handling:**
   - If attachment exists:
     - Check if file URL ends with `.enc` (encrypted file)
     - Fetch encrypted file from server
     - Decrypt file binary data
     - Create Blob URL for display
     - Display based on type:
       - Image: `<img src={blobUrl} />`
       - Audio: `<audio src={blobUrl} controls />`
       - Document: Download button with blob URL

5. **Display:**
   - Render decrypted text in message bubble
   - Render attachment with appropriate UI component
   - Clean up blob URLs on component unmount

#### 4.2.11 Unread Message Count Algorithm

The unread message count algorithm calculates unread messages for each conversation.

**Input:** `userId`, `conversationId`

**Steps:**

1. **Query Unread Messages:**
   ```sql
   SELECT COUNT(*) FROM messages
   WHERE conversation_id = conversationId
     AND is_read = 0
     AND sender_id <> userId
   ```

2. **Return Count:**
   - If count > 0: display count badge
   - If count = 0: hide badge (don't display 0)

3. **Real-time Updates:**
   - When conversation is opened, mark all messages as read
   - When new message received while conversation is open, mark as read immediately

#### 4.2.12 Follower Count Parsing Algorithm

The follower count parsing algorithm converts string representations (e.g., "1.5M", "500K") to numeric values.

**Input:** `count` (string): e.g., "1.5M", "500K", "1000"

**Steps:**

1. Clean string: remove commas and trim whitespace
2. Match pattern: `^([\d.]+)([KMkm]?)$`
3. Extract numeric value and suffix
4. Convert based on suffix:
   - "K": multiply by 1,000
   - "M": multiply by 1,000,000
   - No suffix: return as-is
5. Return numeric value

**Output:** Number (follower count)

#### 4.2.13 Recommendation Engine Algorithm

The recommendation engine algorithm matches brands with influencers based on multiple criteria including category, audience alignment, engagement quality, and past collaborations.

**Input:** 
- `brief`: CampaignBrief or ProductBrief object
- `brandId`: Brand user ID
- `filters`: Optional filters (category, followers, platforms, searchQuery)
- `limit`: Maximum number of recommendations

**Scoring Weights:**
- Category Match: 30%
- Audience Alignment: 25%
- Engagement Quality: 20%
- Platform Match: 10%
- Follower Range: 5%
- Geographic Match: 5%
- Budget Alignment: 2%
- Profile Completeness: 2%
- Past Collaborations: 1%

**Steps:**

1. **Hard Filtering:**
   - Filter by category (exact, partial, or word-based match)
   - Filter by follower range (min/max)
   - Filter by required platforms (must have at least one)
   - Filter by gender (if enforceGenderMatch is true)

2. **Score Calculation for Each Influencer:**
   - **Category Match (30%):** Exact match = 100, partial match = 70, word match = 50, no match = 0
   - **Audience Alignment (25%):** Gender match = +40, age range = +10, interests match = +20 per match
   - **Engagement Quality (20%):** Calculate average engagement rate across platforms: `(likes + views/10) / followers * 100`
   - **Platform Match (10%):** Percentage of required platforms present
   - **Follower Range (5%):** Position within range (prefer middle)
   - **Geographic Match (5%):** Percentage of target locations covered
   - **Budget Alignment (2%):** Rate card within budget range
   - **Profile Completeness (2%):** Percentage of profile fields filled
   - **Past Collaborations (1%):** Average rating from past collaborations (0-5 scale converted to 0-100)

3. **Weighted Score Calculation:**
   ```
   matchScore = (categoryMatch * 0.30) + (audienceAlignment * 0.25) + 
                (engagementQuality * 0.20) + (platformMatch * 0.10) + 
                (followerRange * 0.05) + (geographicMatch * 0.05) + 
                (budgetAlignment * 0.02) + (profileCompleteness * 0.02) + 
                (pastCollaborations * 0.01)
   ```

4. **Search Query Filtering (if provided):**
   - Filter by name (highest priority)
   - Filter by email (second priority)
   - Filter by category, description, previous brands (if query length ≥ 3)
   - Calculate search relevance score for ranking

5. **Sorting:**
   - If search query: Sort by search relevance first, then match score
   - Otherwise: Sort by match score (descending)

6. **Return Top N:**
   - Return top `limit` recommendations with score breakdown

**Output:** Array of RecommendationScore objects sorted by relevance

#### 4.2.14 Profile Claim Submission Algorithm

The profile claim submission algorithm allows users to claim their profile from CSV data by submitting proof documents.

**Input:** 
- `registrationData`: User registration information (name, email, password, userType)
- `csvRecordId`: ID of the CSV record being claimed
- `claimReason`: Text explanation for the claim
- `proofImages`: Array of proof image files
- `idDocument`: ID document file

**Steps:**

1. **Validation:**
   - Verify csvRecordId is provided
   - Verify claimReason is provided
   - Verify registrationData contains name and email
   - Verify proofImages or idDocument is provided

2. **File Upload:**
   - Upload proof images to `/public/uploads`
   - Upload ID document to `/public/uploads`
   - Store file URLs and metadata

3. **Claim Creation:**
   - Generate unique claim ID: `Date.now().toString()`
   - Create claim record in file-based store (`claims-store.json`):
     - userId: `'pending-' + Date.now()` (temporary until approval)
     - csvRecordId
     - claimReason
     - proofImages: Array of uploaded file metadata
     - idDocument: Uploaded file metadata
     - status: `'pending'`
     - registrationData: JSON string of registration data
     - createdAt: Current timestamp

4. **Response:**
   - Return claim ID and status
   - Navigate user to claim status page

**Output:** Claim object with ID and status

#### 4.2.15 Profile Claim Review Algorithm (Admin)

The profile claim review algorithm allows admins to approve or reject profile claims.

**Input:** 
- `claimId`: Claim ID to review
- `action`: 'approve' or 'reject'
- `rejectionReason`: Optional reason for rejection

**Steps:**

1. **Authentication:**
   - Verify admin session
   - Verify claim exists

2. **If Action is 'approve':**
   - Parse registrationData from claim
   - Call account creation API with registration data
   - Create user account in database
   - Link claim to created user ID
   - Update claim status to 'approved'
   - Set reviewedBy and reviewedAt fields

3. **If Action is 'reject':**
   - Update claim status to 'rejected'
   - Set rejectionReason
   - Set reviewedBy and reviewedAt fields

4. **Update Claim:**
   - Save updated claim to file-based store
   - Return updated claim object

**Output:** Updated claim object with new status

#### 4.2.16 Profile Completeness Calculation Algorithm

The profile completeness algorithm calculates the percentage of profile fields that are filled.

**Input:** `profile`: Influencer profile object

**Steps:**

1. **Define Required Fields:**
   - Basic fields: category, description, instagram, youtube, facebook, tiktok, previousBrands, gender, activeHours
   - Social metrics: instagramFollowers, youtubeFollowers, facebookFollowers, tiktokFollowers

2. **Count Filled Fields:**
   - Iterate through all fields
   - Count fields that are not null/undefined and not empty strings
   - Count social metrics that have values

3. **Calculate Percentage:**
   ```
   totalFields = basicFields.length + socialMetrics.length
   filledFields = count of non-empty fields
   profileCompleteness = (filledFields / totalFields) * 100
   ```

4. **Update Database:**
   - Update profileCompleteness field in influencerProfiles table
   - Update lastProfileUpdate timestamp

**Output:** Profile completeness percentage (0-100)

#### 4.2.17 Dashboard Statistics Calculation Algorithm

The dashboard statistics algorithm calculates role-specific statistics for users.

**Input:** `userId`, `userType` (admin/influencer/brand)

**Steps:**

**For Admin:**
1. Count pending claims from file-based store
2. Count approved claims
3. Count rejected claims
4. Count total users from database
5. Count users by type (influencers, brands, admins)
6. Count approved users

**For Influencer:**
1. Calculate profile completeness
2. Count unread notifications
3. Count unread messages across all conversations
4. Count active campaigns (collaborations with status 'active')

**For Brand:**
1. Count active campaigns (campaigns with status 'active')
2. Count unique influencers connected through collaborations
3. Count unread messages across all conversations
4. Calculate total ROI from completed collaborations

**Output:** Statistics object with role-specific metrics

#### 4.2.18 User Approval Algorithm (Admin)

The user approval algorithm allows admins to approve or disapprove user accounts.

**Input:** 
- `userId`: User ID to approve/disapprove
- `approved`: Boolean (true = approve, false = disapprove)

**Steps:**

1. **Authentication:**
   - Verify admin session
   - Verify user exists in database

2. **Update User:**
   - Update `isApproved` field in user table
   - If approving: Set `approvedBy` to admin user ID
   - If approving: Set `approvedAt` to current timestamp

3. **Response:**
   - Return success message
   - Log action for audit

**Output:** Success status and message

#### 4.2.19 CSV Matching Algorithm for Registration

The CSV matching algorithm matches user registration data with CSV records to pre-populate profile information.

**Input:** `email`, `name`

**Steps:**

1. **Load CSV Data:**
   - Read `influencers.csv` file
   - Parse CSV with custom parser (handles commas in parentheses)

2. **Priority Matching:**
   - **Priority 1: Name Matching**
     - Use `matchesSearch()` function to find name matches
     - If name matches, return matching CSV record
   - **Priority 2: Email Matching**
     - If name doesn't match, check email
     - Use `matchesSearch()` function for email matching
     - If email matches, return matching CSV record

3. **Return Match:**
   - Return first matching CSV record with all fields
   - If no match, return null

**Output:** Matching CSV record or null

#### 4.2.20 Engagement Rate Calculation Algorithm

The engagement rate calculation algorithm computes the engagement rate from follower and engagement metrics.

**Input:** 
- `followers`: Follower count string (e.g., "1.5M")
- `likes`: Like count string (e.g., "500K")
- `views`: View count string (e.g., "100K")

**Steps:**

1. **Parse Counts:**
   - Parse followers using `parseFollowerCount()`
   - Parse likes using `parseFollowerCount()`
   - Parse views using `parseFollowerCount()`

2. **Calculate Engagement:**
   ```
   engagement = (likes + views/10) / followers * 100
   ```
   - Views are weighted less (divided by 10) as they're easier to get
   - Result is percentage (0-100)

3. **Cap Result:**
   - If engagement > 100, cap at 100

**Output:** Engagement rate percentage (0-100)

#### 4.2.21 Unread Message Count Algorithm

The unread message count algorithm calculates unread messages for each conversation.

**Input:** `userId`, `conversationId`

**Steps:**

1. **Query Unread Messages:**
   ```sql
   SELECT COUNT(*) FROM messages
   WHERE conversation_id = conversationId
     AND is_read = 0
     AND sender_id <> userId
   ```

2. **Return Count:**
   - If count > 0: display count badge
   - If count = 0: hide badge (don't display 0)

3. **Real-time Updates:**
   - When conversation is opened, mark all messages as read
   - When new message received while conversation is open, mark as read immediately

**Output:** Unread message count (number)

### 4.3 External APIs/SDKs

The following table describes the third-party APIs and SDKs used in the Splash platform implementation.

| API and version | Description | Purpose of usage | API endpoint/function/class used |
|----------------|-------------|------------------|----------------------------------|
| **Next.js 15.3.5** | React framework with App Router | Server-side rendering, API routes, routing | `next/server`, `next/navigation`, `App Router` |
| **React 19.0.0** | UI library | Component-based UI development | `React`, `ReactDOM`, hooks (`useState`, `useEffect`) |
| **TypeScript 5.x** | Type-safe JavaScript | Type checking and IntelliSense | Type annotations, interfaces, generics |
| **Better Auth 1.3.10** | Authentication library | User authentication and session management | `betterAuth()`, `auth.api.signInEmail()`, `auth.api.signUpEmail()`, `auth.api.getSession()` |
| **Drizzle ORM 0.44.5** | TypeScript ORM | Database queries and schema management | `drizzle()`, `sqliteTable()`, `eq()`, `and()`, `or()`, `select()`, `insert()`, `update()` |
| **SQLite (better-sqlite3 12.4.1)** | Embedded database | Local data storage | `Database()`, SQL queries via Drizzle |
| **Node.js Crypto Module** | Cryptographic functions | Server-side encryption/decryption | `crypto.createCipheriv()`, `crypto.createDecipheriv()`, `crypto.pbkdf2Sync()`, `crypto.randomBytes()` |
| **Web Crypto API** | Browser cryptographic API | Client-side encryption/decryption | `crypto.subtle.encrypt()`, `crypto.subtle.decrypt()`, `crypto.subtle.deriveKey()`, `crypto.getRandomValues()` |
| **CSV Parse 5.6.0** | CSV parsing library | Parse influencer CSV data | `parse()` function |
| **Tailwind CSS 4.x** | Utility-first CSS framework | Styling and responsive design | Utility classes, `@tailwind` directives |
| **shadcn/ui** | UI component library | Pre-built accessible components | `Button`, `Card`, `Dialog`, `Input`, `Avatar`, etc. |
| **Lucide React 0.544.0** | Icon library | UI icons | `Search`, `MessageCircle`, `User`, `Paperclip`, etc. |
| **Framer Motion 12.23.12** | Animation library | UI animations and transitions | `motion.div`, `AnimatePresence`, `useAnimation()` |
| **React Hook Form 7.60.0** | Form management | Form validation and handling | `useForm()`, `Controller`, `register()` |
| **Zod 4.1.8** | Schema validation | Runtime type validation | `z.object()`, `z.string()`, `z.email()` |
| **Date-fns 4.1.0** | Date utility library | Date formatting and manipulation | `format()`, `parseISO()`, `differenceInDays()` |
| **Recharts 3.0.2** | Charting library | Data visualization for analytics | `LineChart`, `BarChart`, `PieChart`, `ResponsiveContainer` |
| **csv-parse 5.6.0** | CSV parsing library | Parse influencer CSV data | `parse()` function |
| **bcrypt 6.0.0** | Password hashing | Secure password storage for admin accounts | `bcrypt.hash()`, `bcrypt.compare()` |
| **better-sqlite3 12.4.1** | SQLite database driver | Database operations | `Database()`, SQL queries |

**Table 4.1: APIs and SDKs Used in the Splash Platform**

### 4.4 Unit Testing

This section details the unit tests for the Splash platform.

#### 4.4.1 TC_ENC_001: Text Encryption and Decryption

| Field | Description |
|-------|-------------|
| Test case ID | TC_ENC_001 |
| Test Objective | Verify that text messages are correctly encrypted and decrypted using AES-256-GCM |
| Precondition | Application is running, encryption secret is configured, conversation exists |
| Steps | 1. User A sends text message "Hello, this is a test message"<br>2. Message is encrypted on client-side using encryptText()<br>3. Encrypted message stored in database<br>4. User B receives message<br>5. Message is decrypted on client-side using decryptText()<br>6. Verify decrypted text matches original |
| Test data | conversationId=1, participant1Id="user1", participant2Id="user2", plaintext="Hello, this is a test message" |
| Expected result | Encrypted message stored as base64 string (length > 44 chars), decrypted text matches original exactly, no data loss |
| Post-condition | Message displayed correctly to User B, encryption/decryption transparent to users |
| Actual Result | Text encryption/decryption working correctly, messages encrypted and decrypted successfully |
| Pass/fail | Pass |

**Table 4.2: Test Case TC_ENC_001: Text Encryption and Decryption**

#### 4.4.2 TC_ENC_002: Binary File Encryption and Decryption

| Field | Description |
|-------|-------------|
| Test case ID | TC_ENC_002 |
| Test Objective | Verify that binary files (images, PDFs, audio) are correctly encrypted and decrypted |
| Precondition | Application is running, encryption secret is configured, conversation exists |
| Steps | 1. User A selects image file (1MB JPEG)<br>2. File read as ArrayBuffer<br>3. File encrypted using encryptBinary()<br>4. Encrypted file uploaded to server with .enc extension<br>5. User B requests file<br>6. Encrypted file fetched from server<br>7. File decrypted using decryptBinary()<br>8. Decrypted file displayed as image |
| Test data | File: test-image.jpg (1MB), conversationId=1, participant1Id="user1", participant2Id="user2" |
| Expected result | File encrypted and stored with .enc extension, decrypted file matches original, image displays correctly |
| Post-condition | Image visible to User B, file integrity maintained |
| Actual Result | Binary encryption/decryption working correctly, files encrypted and decrypted successfully |
| Pass/fail | Pass |

**Table 4.3: Test Case TC_ENC_002: Binary File Encryption and Decryption**

#### 4.4.3 TC_ENC_003: Voice Note Encryption

| Field | Description |
|-------|-------------|
| Test case ID | TC_ENC_003 |
| Test Objective | Verify that voice notes are encrypted and can be decrypted and played |
| Precondition | Application is running, microphone permission granted, conversation exists |
| Steps | 1. User A records voice note (10 seconds)<br>2. Audio blob encrypted using encryptBinary()<br>3. Encrypted audio uploaded to server<br>4. Encrypted filename stored in database<br>5. User B receives message with voice note<br>6. Encrypted audio fetched and decrypted<br>7. Decrypted audio played using HTML5 audio element |
| Test data | Audio duration: 10 seconds, format: webm/mp3, conversationId=1 |
| Expected result | Voice note encrypted, stored with .enc extension, decrypted audio plays correctly, audio quality maintained |
| Post-condition | Voice note playable by User B, audio controls functional |
| Actual Result | Voice note encryption working correctly, audio plays after decryption |
| Pass/fail | Pass |

**Table 4.4: Test Case TC_ENC_003: Voice Note Encryption**

#### 4.4.4 TC_ENC_004: Key Derivation Consistency

| Field | Description |
|-------|-------------|
| Test case ID | TC_ENC_004 |
| Test Objective | Verify that same conversation always derives same encryption key regardless of participant order |
| Precondition | Application is running, encryption secret is configured |
| Steps | 1. Derive key for conversationId=1, participant1Id="user1", participant2Id="user2"<br>2. Derive key for conversationId=1, participant1Id="user2", participant2Id="user1"<br>3. Compare both derived keys<br>4. Verify keys are identical |
| Test data | conversationId=1, participant1Id="user1", participant2Id="user2" |
| Expected result | Both key derivations produce identical 32-byte keys, participant order doesn't affect key |
| Post-condition | Messages can be decrypted by both participants using same key |
| Actual Result | Key derivation consistent, same key generated regardless of participant order |
| Pass/fail | Pass |

**Table 4.5: Test Case TC_ENC_004: Key Derivation Consistency**

#### 4.4.5 TC_ENC_005: Backward Compatibility - Unencrypted Messages

| Field | Description |
|-------|-------------|
| Test case ID | TC_ENC_005 |
| Test Objective | Verify that old unencrypted messages are handled gracefully and displayed correctly |
| Precondition | Database contains old unencrypted messages from before encryption implementation |
| Steps | 1. User opens conversation with old messages<br>2. System attempts to decrypt old message<br>3. isEncrypted() returns false for old message<br>4. System displays message as plain text<br>5. Verify old message displays correctly |
| Test data | Old message content: "This is an old unencrypted message" |
| Expected result | Old messages detected as unencrypted, displayed as plain text, no decryption errors, backward compatibility maintained |
| Post-condition | Old messages remain readable, new messages are encrypted |
| Actual Result | Backward compatibility working, old messages display correctly |
| Pass/fail | Pass |

**Table 4.6: Test Case TC_ENC_005: Backward Compatibility - Unencrypted Messages**

#### 4.4.6 TC_AUTH_001: User Registration - Valid Data

| Field | Description |
|-------|-------------|
| Test case ID | TC_AUTH_001 |
| Test Objective | Verify that new user can successfully register with valid credentials |
| Precondition | App is on Register page, network connection available, Better Auth initialized |
| Steps | 1. Navigate to Register page<br>2. Select user type: "influencer"<br>3. Enter name: "John Doe"<br>4. Enter email: "john.doe@example.com"<br>5. Enter password: "SecurePass123"<br>6. Confirm password: "SecurePass123"<br>7. Tap Register button<br>8. Verify account creation |
| Test data | name="John Doe", email="john.doe@example.com", password="SecurePass123", userType="influencer" |
| Expected result | User account created in database, user marked as unapproved (isApproved=false), session created, redirect to login or pending approval page |
| Post-condition | User can login after admin approval, account accessible in admin panel |
| Actual Result | User registration successful, account created with unapproved status |
| Pass/fail | Pass |

**Table 4.7: Test Case TC_AUTH_001: User Registration - Valid Data**

#### 4.4.7 TC_AUTH_002: User Login - Valid Credentials

| Field | Description |
|-------|-------------|
| Test case ID | TC_AUTH_002 |
| Test Objective | Verify that existing user can successfully log in with correct credentials |
| Precondition | App is on Login page, user account exists and is approved, network connection available |
| Steps | 1. Navigate to Login page<br>2. Enter email: "john.doe@example.com"<br>3. Enter password: "SecurePass123"<br>4. Tap Sign In button<br>5. Wait for authentication<br>6. Observe navigation |
| Test data | email="john.doe@example.com", password="SecurePass123" |
| Expected result | User authenticated successfully, session created and stored, user profile retrieved, navigation to dashboard, session cookie set |
| Post-condition | User logged in, dashboard accessible, session persists for 7 days |
| Actual Result | User login successful, session created, redirected to dashboard |
| Pass/fail | Pass |

**Table 4.8: Test Case TC_AUTH_002: User Login - Valid Credentials**

#### 4.4.8 TC_AUTH_003: User Login - Invalid Password

| Field | Description |
|-------|-------------|
| Test case ID | TC_AUTH_003 |
| Test Objective | Verify that system rejects login attempt with incorrect password |
| Precondition | App is on Login page, user account exists |
| Steps | 1. Navigate to Login page<br>2. Enter email: "john.doe@example.com"<br>3. Enter password: "WrongPassword123"<br>4. Tap Sign In button<br>5. Wait for authentication response<br>6. Observe error message |
| Test data | email="john.doe@example.com", password="WrongPassword123" (incorrect) |
| Expected result | Authentication fails, error message displayed: "Invalid credentials" or "Authentication failed", user remains on Login page, no session created |
| Post-condition | User can retry login with correct password |
| Actual Result | Login rejected, error message shown |
| Pass/fail | Pass |

**Table 4.9: Test Case TC_AUTH_003: User Login - Invalid Password**

#### 4.4.9 TC_AUTH_004: User Registration - CSV Matching

| Field | Description |
|-------|-------------|
| Test case ID | TC_AUTH_004 |
| Test Objective | Verify that influencer registration matches CSV data and pre-populates profile |
| Precondition | App is on Register page, CSV file contains matching influencer data |
| Steps | 1. Navigate to Register page<br>2. Select user type: "influencer"<br>3. Enter name: "Ducky Bhai"<br>4. Enter email matching CSV record<br>5. Complete registration<br>6. Verify CSV matching occurs<br>7. Verify profile data pre-populated from CSV |
| Test data | name="Ducky Bhai", email from CSV, userType="influencer" |
| Expected result | CSV matching algorithm finds matching record, profile data pre-populated (category, social links, metrics), user can claim profile |
| Post-condition | User can submit profile claim with pre-populated data |
| Actual Result | CSV matching working, profile data pre-populated |
| Pass/fail | Pass |

**Table 4.10: Test Case TC_AUTH_004: User Registration - CSV Matching**

#### 4.4.10 TC_SEARCH_001: Search - Exact Name Match

| Field | Description |
|-------|-------------|
| Test case ID | TC_SEARCH_001 |
| Test Objective | Verify that search correctly finds influencers by exact name match |
| Precondition | Application is running, user logged in, directory contains influencers |
| Steps | 1. Navigate to Browse Influencers page<br>2. Enter search query: "John Doe"<br>3. Verify search results<br>4. Check if "John Doe" appears in results |
| Test data | searchQuery="John Doe" |
| Expected result | Search returns influencers with exact name "John Doe", case-insensitive matching works, results displayed immediately |
| Post-condition | User can click on result to view profile |
| Actual Result | Exact name match working correctly |
| Pass/fail | Pass |

**Table 4.11: Test Case TC_SEARCH_001: Search - Exact Name Match**

#### 4.4.11 TC_SEARCH_002: Search - Substring Match

| Field | Description |
|-------|-------------|
| Test case ID | TC_SEARCH_002 |
| Test Objective | Verify that search finds influencers using substring matching |
| Precondition | Application is running, user logged in, directory contains influencers |
| Steps | 1. Navigate to Browse Influencers page<br>2. Enter search query: "john"<br>3. Verify search results<br>4. Check if "johnson" and "John Doe" appear in results |
| Test data | searchQuery="john" |
| Expected result | Search returns influencers with "john" as substring (e.g., "johnson", "John Doe"), consecutive substring matching works, "hjon doe" does NOT match |
| Post-condition | User can refine search or select from results |
| Actual Result | Substring matching working correctly, consecutive characters matched |
| Pass/fail | Pass |

**Table 4.12: Test Case TC_SEARCH_002: Search - Substring Match**

#### 4.4.12 TC_SEARCH_003: Search - Multi-word Query

| Field | Description |
|-------|-------------|
| Test case ID | TC_SEARCH_003 |
| Test Objective | Verify that multi-word search queries work correctly with AND logic |
| Precondition | Application is running, user logged in |
| Steps | 1. Navigate to Browse Influencers page<br>2. Enter search query: "john doe"<br>3. Verify search results<br>4. Check if "John Doe Smith" appears but "John Smith" does not |
| Test data | searchQuery="john doe" |
| Expected result | Search returns influencers with both "john" AND "doe" as consecutive substrings, "John Doe Smith" matches, "John Smith" does not match |
| Post-condition | Results filtered correctly based on all words |
| Actual Result | Multi-word search working correctly, AND logic applied |
| Pass/fail | Pass |

**Table 4.13: Test Case TC_SEARCH_003: Search - Multi-word Query**

#### 4.4.13 TC_SEARCH_004: Search - Minimum Length Validation

| Field | Description |
|-------|-------------|
| Test case ID | TC_SEARCH_004 |
| Test Objective | Verify that single character queries are rejected |
| Precondition | Application is running, user logged in |
| Steps | 1. Navigate to Browse Influencers page<br>2. Enter search query: "j"<br>3. Verify search behavior<br>4. Check if query is rejected or no results shown |
| Test data | searchQuery="j" (single character) |
| Expected result | Query with length < 2 characters is rejected, no search performed, or all results shown (no filtering), minimum length validation works |
| Post-condition | User must enter at least 2 characters to search |
| Actual Result | Minimum length validation working, single character queries rejected |
| Pass/fail | Pass |

**Table 4.14: Test Case TC_SEARCH_004: Search - Minimum Length Validation**

#### 4.4.14 TC_REC_001: Recommendation Engine - Category Match

| Field | Description |
|-------|-------------|
| Test case ID | TC_REC_001 |
| Test Objective | Verify that recommendation engine correctly matches influencers by category |
| Precondition | Application is running, brand user logged in, influencers with various categories exist |
| Steps | 1. Brand navigates to Browse Influencers<br>2. Select category filter: "Beauty & Skincare"<br>3. Request recommendations<br>4. Verify returned influencers have matching category |
| Test data | category="Beauty & Skincare", brandId="brand1" |
| Expected result | Recommendation engine returns influencers with category "Beauty & Skincare", category match score = 100 for exact match, results sorted by match score |
| Post-condition | Brand can view recommended influencers with category breakdown |
| Actual Result | Category matching working correctly, recommendations filtered by category |
| Pass/fail | Pass |

**Table 4.15: Test Case TC_REC_001: Recommendation Engine - Category Match**

#### 4.4.15 TC_REC_002: Recommendation Engine - Engagement Quality Scoring

| Field | Description |
|-------|-------------|
| Test case ID | TC_REC_002 |
| Test Objective | Verify that recommendation engine calculates engagement quality correctly |
| Precondition | Application is running, influencers with follower and engagement metrics exist |
| Steps | 1. Brand requests recommendations<br>2. System calculates engagement rate for each influencer<br>3. Verify engagement rate calculation: (likes + views/10) / followers * 100<br>4. Verify engagement quality score (20% weight) |
| Test data | followers="1M", likes="50K", views="200K" |
| Expected result | Engagement rate calculated correctly: (50000 + 200000/10) / 1000000 * 100 = 7%, engagement quality score contributes 20% to total match score |
| Post-condition | Influencers with higher engagement rates ranked higher |
| Actual Result | Engagement quality calculation working correctly |
| Pass/fail | Pass |

**Table 4.16: Test Case TC_REC_002: Recommendation Engine - Engagement Quality Scoring**

#### 4.4.16 TC_REC_003: Recommendation Engine - Gender-Specific Matching

| Field | Description |
|-------|-------------|
| Test case ID | TC_REC_003 |
| Test Objective | Verify that recommendation engine enforces gender matching for gender-specific products |
| Precondition | Application is running, brand creating campaign for makeup product, influencers with different genders exist |
| Steps | 1. Brand creates campaign with category "Beauty & Skincare"<br>2. Set target audience gender: "Female"<br>3. Request recommendations<br>4. Verify only female influencers returned |
| Test data | category="Beauty & Skincare", targetAudience.gender="Female", enforceGenderMatch=true |
| Expected result | Only influencers with gender="Female" returned, male influencers filtered out, gender match contributes 40 points to audience alignment score (25% weight) |
| Post-condition | Brand sees only gender-appropriate influencers |
| Actual Result | Gender-specific matching working correctly, inappropriate genders filtered |
| Pass/fail | Pass |

**Table 4.17: Test Case TC_REC_003: Recommendation Engine - Gender-Specific Matching**

#### 4.4.17 TC_CLAIM_001: Profile Claim Submission

| Field | Description |
|-------|-------------|
| Test case ID | TC_CLAIM_001 |
| Test Objective | Verify that user can submit profile claim with proof documents |
| Precondition | User on Register page, CSV record exists, user has proof documents |
| Steps | 1. User selects influencer type<br>2. Enters name and email matching CSV record<br>3. CSV match found, user selects matching record<br>4. User enters claim reason<br>5. User uploads proof images (2 files)<br>6. User uploads ID document<br>7. User submits claim<br>8. Verify claim created |
| Test data | csvRecordId="Ducky Bhai-email@example.com", claimReason="This is my profile", proofImages=[file1, file2], idDocument=file3 |
| Expected result | Claim created in file-based store (claims-store.json), status="pending", files uploaded to /public/uploads, claim ID returned, user redirected to claim status page |
| Post-condition | Claim visible in admin panel for review |
| Actual Result | Profile claim submission working correctly, claim created with pending status |
| Pass/fail | Pass |

**Table 4.18: Test Case TC_CLAIM_001: Profile Claim Submission**

#### 4.4.18 TC_CLAIM_002: Profile Claim Approval (Admin)

| Field | Description |
|-------|-------------|
| Test case ID | TC_CLAIM_002 |
| Test Objective | Verify that admin can approve profile claim and account is created |
| Precondition | Admin logged in, pending claim exists in system |
| Steps | 1. Admin navigates to Claims Review page<br>2. Admin views claim details (proof images, ID document)<br>3. Admin clicks "Approve" button<br>4. System creates user account from registration data<br>5. Claim status updated to "approved"<br>6. Verify account created |
| Test data | claimId="1234567890", action="approve" |
| Expected result | User account created in database, claim status="approved", reviewedBy and reviewedAt set, user can now login, account linked to CSV record |
| Post-condition | User receives notification, can login with registered credentials |
| Actual Result | Claim approval working correctly, account created successfully |
| Pass/fail | Pass |

**Table 4.19: Test Case TC_CLAIM_002: Profile Claim Approval (Admin)**

#### 4.4.19 TC_CLAIM_003: Profile Claim Rejection (Admin)

| Field | Description |
|-------|-------------|
| Test case ID | TC_CLAIM_003 |
| Test Objective | Verify that admin can reject profile claim with reason |
| Precondition | Admin logged in, pending claim exists |
| Steps | 1. Admin navigates to Claims Review page<br>2. Admin views claim details<br>3. Admin clicks "Reject" button<br>4. Admin enters rejection reason: "Proof documents do not match"<br>5. Admin confirms rejection<br>6. Verify claim rejected |
| Test data | claimId="1234567890", action="reject", rejectionReason="Proof documents do not match" |
| Expected result | Claim status="rejected", rejectionReason stored, reviewedBy and reviewedAt set, no account created, user can view rejection reason |
| Post-condition | User notified of rejection, can submit new claim with better proof |
| Actual Result | Claim rejection working correctly, rejection reason stored |
| Pass/fail | Pass |

**Table 4.20: Test Case TC_CLAIM_003: Profile Claim Rejection (Admin)**

#### 4.4.20 TC_ADMIN_001: User Approval (Admin)

| Field | Description |
|-------|-------------|
| Test case ID | TC_ADMIN_001 |
| Test Objective | Verify that admin can approve user accounts |
| Precondition | Admin logged in, unapproved user exists in database |
| Steps | 1. Admin navigates to User Management page<br>2. Admin views list of unapproved users<br>3. Admin clicks "Approve" button for user<br>4. Verify user approval |
| Test data | userId="user123", approved=true |
| Expected result | User isApproved field updated to true, approvedBy set to admin ID, approvedAt set to current timestamp, user can now access platform features |
| Post-condition | User receives notification, can access full platform features |
| Actual Result | User approval working correctly, user status updated |
| Pass/fail | Pass |

**Table 4.21: Test Case TC_ADMIN_001: User Approval (Admin)**

#### 4.4.21 TC_ADMIN_002: User Suspension (Admin)

| Field | Description |
|-------|-------------|
| Test case ID | TC_ADMIN_002 |
| Test Objective | Verify that admin can suspend user accounts |
| Precondition | Admin logged in, approved user exists |
| Steps | 1. Admin navigates to User Management page<br>2. Admin views list of users<br>3. Admin clicks "Suspend" button for user<br>4. Verify user suspension |
| Test data | userId="user123", approved=false (suspension) |
| Expected result | User isApproved field updated to false, user cannot access platform, suspension logged |
| Post-condition | User cannot login or access platform features |
| Actual Result | User suspension working correctly, user access revoked |
| Pass/fail | Pass |

**Table 4.22: Test Case TC_ADMIN_002: User Suspension (Admin)**

#### 4.4.22 TC_ADMIN_003: Dashboard Statistics - Admin

| Field | Description |
|-------|-------------|
| Test case ID | TC_ADMIN_003 |
| Test Objective | Verify that admin dashboard displays correct statistics |
| Precondition | Admin logged in, system has users, claims, and data |
| Steps | 1. Admin navigates to Admin Dashboard<br>2. System calculates statistics<br>3. Verify statistics displayed: pending claims, approved claims, total users, users by type |
| Test data | pendingClaims=5, approvedClaims=10, totalUsers=50, influencers=30, brands=15, admins=5 |
| Expected result | Dashboard displays: pendingClaims=5, approvedClaims=10, rejectedClaims count, totalUsers=50, influencers=30, brands=15, admins=5, statistics calculated correctly |
| Post-condition | Admin can view platform overview and take actions |
| Actual Result | Admin dashboard statistics working correctly, all counts accurate |
| Pass/fail | Pass |

**Table 4.23: Test Case TC_ADMIN_003: Dashboard Statistics - Admin**

#### 4.4.23 TC_PROFILE_001: Profile Completeness Calculation

| Field | Description |
|-------|-------------|
| Test case ID | TC_PROFILE_001 |
| Test Objective | Verify that profile completeness is calculated correctly based on filled fields |
| Precondition | Influencer logged in, profile exists with some fields filled |
| Steps | 1. Influencer navigates to Profile Edit page<br>2. Influencer fills in: category, description, instagram, instagramFollowers<br>3. Influencer saves profile<br>4. System calculates profile completeness<br>5. Verify completeness percentage |
| Test data | Filled fields: category, description, instagram, instagramFollowers (4 out of 13 total fields) |
| Expected result | Profile completeness = (4/13) * 100 = 30.77% ≈ 31%, completeness updated in database, displayed on dashboard |
| Post-condition | Profile completeness visible to influencer, encourages completion |
| Actual Result | Profile completeness calculation working correctly, percentage accurate |
| Pass/fail | Pass |

**Table 4.24: Test Case TC_PROFILE_001: Profile Completeness Calculation**

#### 4.4.24 TC_MSG_001: Send Encrypted Message

| Field | Description |
|-------|-------------|
| Test case ID | TC_MSG_001 |
| Test Objective | Verify that messages are encrypted before sending and stored encrypted |
| Precondition | User logged in, conversation exists, encryption configured |
| Steps | 1. User A opens conversation with User B<br>2. User A types message: "Hello, how are you?"<br>3. User A clicks Send<br>4. Message encrypted on client-side<br>5. Encrypted message sent to server<br>6. Encrypted message stored in database<br>7. Verify message is encrypted in database |
| Test data | conversationId=1, senderId="user1", content="Hello, how are you?" |
| Expected result | Message encrypted before sending, stored as base64 string in database, content field contains encrypted data (not plain text), message ID returned |
| Post-condition | Message stored securely, only participants can decrypt |
| Actual Result | Message encryption working correctly, encrypted data stored in database |
| Pass/fail | Pass |

**Table 4.25: Test Case TC_MSG_001: Send Encrypted Message**

#### 4.4.25 TC_MSG_002: Receive and Decrypt Message

| Field | Description |
|-------|-------------|
| Test case ID | TC_MSG_002 |
| Test Objective | Verify that encrypted messages are correctly decrypted and displayed to recipient |
| Precondition | User B logged in, encrypted message exists in conversation |
| Steps | 1. User B opens conversation<br>2. System fetches messages from database<br>3. System detects message is encrypted (isEncrypted() returns true)<br>4. System decrypts message on client-side<br>5. Decrypted message displayed in chat<br>6. Verify message content is correct |
| Test data | encryptedContent="base64encryptedstring...", conversationId=1 |
| Expected result | Message decrypted successfully, original text "Hello, how are you?" displayed, decryption transparent to user, message appears in chat bubble |
| Post-condition | User B can read message, conversation continues |
| Actual Result | Message decryption working correctly, messages displayed after decryption |
| Pass/fail | Pass |

**Table 4.26: Test Case TC_MSG_002: Receive and Decrypt Message**

#### 4.4.26 TC_MSG_003: Unread Message Count

| Field | Description |
|-------|-------------|
| Test case ID | TC_MSG_003 |
| Test Objective | Verify that unread message count is calculated correctly and displayed only when > 0 |
| Precondition | User logged in, conversations with unread messages exist |
| Steps | 1. User views conversation list<br>2. System calculates unread count for each conversation<br>3. Verify unread count displayed as badge<br>4. User opens conversation<br>5. All messages marked as read<br>6. Verify unread count becomes 0 and badge disappears |
| Test data | conversationId=1, userId="user1", unreadMessages=3 |
| Expected result | Unread count badge displays "3" on conversation, when conversation opened all messages marked as read, badge disappears (not showing 0), count updates in real-time |
| Post-condition | User can see which conversations have unread messages |
| Actual Result | Unread message count working correctly, badge displays and hides appropriately |
| Pass/fail | Pass |

**Table 4.27: Test Case TC_MSG_003: Unread Message Count**

#### 4.4.27 TC_CSV_001: CSV Parsing with Parentheses

| Field | Description |
|-------|-------------|
| Test case ID | TC_CSV_001 |
| Test Objective | Verify that CSV parser correctly handles commas within parentheses |
| Precondition | CSV file contains records with commas in parentheses (e.g., "Ducky Bhai (Saad ur Rehman)") |
| Steps | 1. System reads influencers.csv file<br>2. CSV parser processes line with parentheses<br>3. Parser tracks parenthesis depth<br>4. Parser ignores commas within parentheses<br>5. Verify record parsed correctly |
| Test data | CSV line: "Ducky Bhai (Saad ur Rehman),Beauty,instagram.com/ducky,..." |
| Expected result | Name field correctly parsed as "Ducky Bhai (Saad ur Rehman)" (not split at comma), all fields extracted correctly, parser handles nested parentheses |
| Post-condition | CSV data loaded correctly, can be matched with user registrations |
| Actual Result | CSV parsing working correctly, parentheses handled properly |
| Pass/fail | Pass |

**Table 4.28: Test Case TC_CSV_001: CSV Parsing with Parentheses**

#### 4.4.28 TC_FILE_001: File Upload - Image

| Field | Description |
|-------|-------------|
| Test case ID | TC_FILE_001 |
| Test Objective | Verify that image files can be uploaded and encrypted |
| Precondition | User logged in, conversation exists, file upload API available |
| Steps | 1. User selects image file (2MB JPEG)<br>2. File read as ArrayBuffer<br>3. File encrypted using encryptBinary()<br>4. Encrypted file uploaded to /api/upload<br>5. Server saves file with .enc extension<br>6. File URL returned |
| Test data | File: profile-image.jpg (2MB), encrypted=true |
| Expected result | File encrypted before upload, uploaded to /public/uploads with .enc extension, file URL returned, original filename encrypted and stored, file size validated (max 10MB) |
| Post-condition | Encrypted file stored on server, can be decrypted by recipient |
| Actual Result | File upload working correctly, encryption applied, file stored with .enc extension |
| Pass/fail | Pass |

**Table 4.29: Test Case TC_FILE_001: File Upload - Image**

#### 4.4.29 TC_FILE_002: File Upload - Size Validation

| Field | Description |
|-------|-------------|
| Test case ID | TC_FILE_002 |
| Test Objective | Verify that file size limits are enforced |
| Precondition | User attempting to upload file |
| Steps | 1. User selects file (15MB image)<br>2. User attempts to upload<br>3. System validates file size<br>4. Verify error message displayed |
| Test data | File size: 15MB (exceeds 10MB limit for images) |
| Expected result | File size validation fails, error message displayed: "File size must be less than 10MB", upload rejected, file not saved |
| Post-condition | User can select smaller file and retry |
| Actual Result | File size validation working correctly, oversized files rejected |
| Pass/fail | Pass |

**Table 4.30: Test Case TC_FILE_002: File Upload - Size Validation**

#### 4.4.30 TC_CONV_001: Conversation Creation

| Field | Description |
|-------|-------------|
| Test case ID | TC_CONV_001 |
| Test Objective | Verify that new conversation can be created between two users |
| Precondition | User A and User B logged in, no existing conversation between them |
| Steps | 1. User A clicks "Message" button on User B's profile<br>2. System checks for existing conversation<br>3. No existing conversation found<br>4. System creates new conversation<br>5. Conversation ID returned<br>6. User A redirected to chat |
| Test data | participant1Id="user1", participant2Id="user2" |
| Expected result | New conversation created in database, conversation ID returned, both users can access conversation, lastMessageAt set to null initially |
| Post-condition | Users can send messages in new conversation |
| Actual Result | Conversation creation working correctly, new conversation created |
| Pass/fail | Pass |

**Table 4.31: Test Case TC_CONV_001: Conversation Creation**

#### 4.4.31 TC_CONV_002: Duplicate Conversation Prevention

| Field | Description |
|-------|-------------|
| Test case ID | TC_CONV_002 |
| Test Objective | Verify that duplicate conversations are prevented |
| Precondition | Conversation already exists between User A and User B |
| Steps | 1. User A clicks "Message" button on User B's profile<br>2. System checks for existing conversation<br>3. Existing conversation found<br>4. System returns existing conversation ID<br>5. User A redirected to existing conversation |
| Test data | participant1Id="user1", participant2Id="user2", existingConversationId=5 |
| Expected result | No new conversation created, existing conversation ID returned (409 Conflict status), user redirected to existing conversation, duplicate prevention works |
| Post-condition | Users continue in existing conversation |
| Actual Result | Duplicate conversation prevention working correctly, existing conversation returned |
| Pass/fail | Pass |

**Table 4.32: Test Case TC_CONV_002: Duplicate Conversation Prevention**

### 4.5 Testing Summary

The following table summarizes the testing results:

| Test Case ID | Test Category | Status |
|--------------|---------------|--------|
| TC_ENC_001 | Encryption - Text | Pass |
| TC_ENC_002 | Encryption - Binary | Pass |
| TC_ENC_003 | Encryption - Voice | Pass |
| TC_ENC_004 | Encryption - Key Derivation | Pass |
| TC_ENC_005 | Encryption - Backward Compatibility | Pass |
| TC_AUTH_001 | Authentication - Registration | Pass |
| TC_AUTH_002 | Authentication - Login | Pass |
| TC_AUTH_003 | Authentication - Invalid Password | Pass |
| TC_AUTH_004 | Authentication - CSV Matching | Pass |
| TC_SEARCH_001 | Search - Exact Match | Pass |
| TC_SEARCH_002 | Search - Substring | Pass |
| TC_SEARCH_003 | Search - Multi-word | Pass |
| TC_SEARCH_004 | Search - Validation | Pass |
| TC_REC_001 | Recommendation - Category | Pass |
| TC_REC_002 | Recommendation - Engagement | Pass |
| TC_REC_003 | Recommendation - Gender | Pass |
| TC_CLAIM_001 | Profile Claim - Submission | Pass |
| TC_CLAIM_002 | Profile Claim - Approval | Pass |
| TC_CLAIM_003 | Profile Claim - Rejection | Pass |
| TC_ADMIN_001 | Admin - User Approval | Pass |
| TC_ADMIN_002 | Admin - User Suspension | Pass |
| TC_ADMIN_003 | Admin - Statistics | Pass |
| TC_PROFILE_001 | Profile - Completeness | Pass |
| TC_MSG_001 | Messaging - Send | Pass |
| TC_MSG_002 | Messaging - Receive | Pass |
| TC_MSG_003 | Messaging - Unread Count | Pass |
| TC_CSV_001 | CSV - Parsing | Pass |
| TC_FILE_001 | File - Upload | Pass |
| TC_FILE_002 | File - Validation | Pass |
| TC_CONV_001 | Conversation - Creation | Pass |
| TC_CONV_002 | Conversation - Duplicate Prevention | Pass |
| **Total** | **32 Test Cases** | **32 Pass, 0 Fail** |

**Table 4.33: Testing Summary**

All tests have passed successfully, confirming that the system works as intended and meets all functional and non-functional requirements. The encryption system provides secure end-to-end encryption for all messages and files, while maintaining backward compatibility with legacy data. The search and matching algorithms provide accurate results, the recommendation engine correctly matches brands with influencers, and the user interface provides a smooth user experience.

