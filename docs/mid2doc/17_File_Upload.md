# File Upload System

## Overview
The platform supports file uploads for proof images (profile claims), ID documents, profile pictures, and chat attachments. Files are saved locally in the `public/` directory.

---

## Files Involved

| File | Purpose |
|---|---|
| `src/app/api/upload/route.ts` | POST — handles file upload and saves to disk |
| `public/uploads/` | Directory where uploaded files are stored |
| `adimages/` | Directory for generated ad images |
| `chatresource/` | Directory for chat attachments |

---

## Upload API — `/api/upload`

### What It Does
- POST endpoint accepting `multipart/form-data`
- Receives file from form data
- Generates unique filename with timestamp
- Saves file to `public/uploads/` directory
- Returns the public URL: `/uploads/{filename}`

### Technical Details
- Uses Next.js `request.formData()` to parse multipart data
- File types: images (jpg, png, webp), documents (pdf)
- Files accessible via static serving from `public/` directory
- Unique naming prevents conflicts: `{timestamp}-{originalname}`

---

## Usage Points
1. **Profile Claims:** Proof images and ID documents uploaded during registration claim
2. **Chat Attachments:** Images and documents sent in encrypted chat
3. **Ad Generation:** Generated ad images stored in `adimages/`
4. **Profile Images:** User avatar uploads
