# Cloudinary Setup Guide

## Overview
This project uses Cloudinary for file uploads including:
- Student profile pictures (during account activation)
- Learning materials (documents, PDFs, etc.)
- Video content URLs

## Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email
4. Log in to your Cloudinary dashboard

## Step 2: Get Your Credentials

1. Go to your Cloudinary Dashboard: https://cloudinary.com/console
2. You'll see your **Cloud Name** at the top of the page
3. Copy and save your **Cloud Name**

## Step 3: Create an Upload Preset

1. In the Cloudinary Dashboard, go to **Settings** (gear icon)
2. Click on the **Upload** tab
3. Scroll down to **Upload presets**
4. Click **Add upload preset**
5. Configure the preset:
   - **Name**: `stephotec` (or your preferred name)
   - **Mode**: Select **Unsigned** (important for client-side uploads)
   - **Folder**: `stephotec` (optional, for organization)
   - **Resource type**: Auto
   - Click **Save**

6. Copy your **Upload Preset** name

## Step 4: Configure Environment Variables

1. Open `.env.local` in your project root (create if it doesn't exist)
2. Add the following variables:

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

Replace:
- `your_cloud_name_here` with your actual Cloud Name
- `your_upload_preset_here` with your Upload Preset name

Example:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxyz1234abc
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=stephotec
```

## Step 5: Restart Development Server

After adding environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Features Implemented

### 1. Profile Picture Upload (Activation Page)
- **Location**: `/activate-profile`
- **File Type**: Images only (JPEG, PNG, WebP)
- **Max Size**: 5MB
- **Folder**: `stephotec/profiles`
- **Required**: Yes (must upload before activation)

### 2. Learning Materials Upload (Admin Dashboard)
- **Location**: Learning Management > Learning Content tab
- **File Types**: PDF, DOC, DOCX, XLS, XLSX, TXT, PPT, PPTX
- **Max Size**: 50MB
- **Folder**: `stephotec/learning-materials`
- **Features**:
  - Upload when creating/editing content
  - Download button in content list
  - File preview in upload component

### 3. File Upload Component
- **Location**: `src/components/common/FileUploadField.js`
- **Features**:
  - Drag and drop support
  - File validation
  - Upload progress indicator
  - File preview (for images)
  - Remove/replace functionality

## Cloudinary Utility Functions

Located in `src/lib/cloudinary.js`:

### uploadToCloudinary(file, folder)
Uploads a file to Cloudinary and returns:
- `url`: Secure URL of uploaded file
- `publicId`: Cloudinary public ID
- `size`: File size in bytes
- `type`: Resource type

### validateImage(file, maxSizeMB)
Validates image files (JPEG, PNG, WebP)

### validateDocument(file, maxSizeMB)
Validates document files (PDF, DOC, DOCX, etc.)

### validateVideo(file, maxSizeMB)
Validates video files (MP4, WebM, MOV)

## File Organization in Cloudinary

```
stephotec/
├── profiles/          # Student profile pictures
├── learning-materials/ # Course materials
└── other/            # Other uploads
```

## Security Notes

1. **Unsigned Upload Preset**: Used for client-side uploads (safe for public use)
2. **Folder Organization**: Files are organized by type for easy management
3. **File Validation**: All files are validated on client-side before upload
4. **HTTPS Only**: Cloudinary URLs are always HTTPS

## Troubleshooting

### "Upload failed" error
- Check that `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is correct
- Verify Upload Preset exists and is set to "Unsigned"
- Check browser console for detailed error

### Files not uploading
- Ensure environment variables are set correctly
- Restart development server after changing `.env.local`
- Check file size doesn't exceed limit
- Verify file type is allowed

### Preview not showing
- Only images show previews
- For documents, a success message appears instead

## API Integration

When a file is uploaded, the URL is stored in the database:

### Student Profile Picture
```javascript
{
    profile_picture: "https://res.cloudinary.com/..."
}
```

### Learning Content
```javascript
{
    file_url: "https://res.cloudinary.com/...",
    content_type: "DOCUMENT"
}
```

## Limits & Pricing

**Free Plan Includes**:
- 25GB storage
- 25GB bandwidth/month
- Unlimited uploads
- Basic transformations

For more details, visit: https://cloudinary.com/pricing

## Support

For Cloudinary support: https://support.cloudinary.com/

## Next Steps

1. Create Cloudinary account
2. Get Cloud Name and create Upload Preset
3. Add credentials to `.env.local`
4. Restart development server
5. Test profile picture upload on activation page
6. Test learning material upload in admin dashboard
