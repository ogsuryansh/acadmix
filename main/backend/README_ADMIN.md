# Acadmix Admin Panel Setup Guide

## Overview
The Acadmix admin panel provides comprehensive book management functionality with cloud-based file uploads for images and PDFs. This system is designed to work with Vercel deployment and uses Cloudinary for file storage.

## Features

### 🎯 **Admin Dashboard**
- **Statistics Overview**: Total users, books, payments, and revenue
- **Payment Management**: Approve/reject user payments
- **User Management**: View, edit, and manage user accounts
- **Book Management**: Complete CRUD operations for study materials

### 📚 **Book Management**
- **Add New Books**: Upload cover images and PDF files
- **Edit Books**: Modify existing books with new files
- **Delete Books**: Remove books with automatic file cleanup
- **File Upload**: Support for images (JPEG, PNG, WebP) and PDFs
- **Cloud Storage**: Automatic upload to Cloudinary

### 📱 **Mobile-Friendly**
- **Responsive Design**: Works perfectly on mobile devices
- **Touch-Optimized**: File upload buttons and interactions
- **Mobile Upload**: Direct camera and file access

### 🌙 **Dark Mode Support**
- **Theme Toggle**: Switch between light and dark modes
- **Consistent Styling**: All components support both themes
- **Smooth Transitions**: Animated theme switching

## Setup Instructions

### 1. Environment Variables

Add the following variables to your `.env` file:

```env
# Cloudinary Configuration (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Other required variables
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
ADMIN_USER=acadmix
ADMIN_PASS=acadmix
NODE_ENV=development
```

### 2. Cloudinary Setup

1. **Create Cloudinary Account**:
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account
   - Get your cloud name, API key, and API secret

2. **Configure Cloudinary**:
   - The system automatically creates folders: `acadmix/images` and `acadmix/pdfs`
   - Files are optimized and transformed automatically

### 3. Install Dependencies

```bash
cd public/backend
npm install
```

### 4. Database Setup

The system uses MongoDB with the following models:
- **User**: User accounts and authentication
- **Book**: Study materials with file URLs
- **Payment**: Payment records and status

### 5. File Upload Configuration

#### Supported File Types:
- **Images**: JPEG, PNG, WebP, JPG
- **PDFs**: PDF files only
- **Size Limits**: 
  - Images: 5MB max
  - PDFs: 50MB max

#### Upload Process:
1. Files are uploaded to memory (multer memory storage)
2. Automatically uploaded to Cloudinary
3. URLs are stored in the database
4. Old files are automatically deleted when updated

## API Endpoints

### Admin Authentication
```
POST /api/admin/login
```

### Book Management
```
GET    /api/admin/books          # Get all books
POST   /api/admin/books          # Create new book (with file upload)
PUT    /api/admin/books/:id      # Update book (with file upload)
DELETE /api/admin/books/:id      # Delete book
```

### Payment Management
```
GET    /api/admin/dashboard      # Get dashboard data
POST   /api/admin/payments/:id/approve  # Approve payment
POST   /api/admin/payments/:id/reject   # Reject payment
```

### User Management
```
GET    /api/admin/users          # Get all users
PUT    /api/admin/users/:id/role # Update user role
PUT    /api/admin/users/:id/status # Update user status
```

## File Upload Flow

### Frontend (React)
1. User selects files using HTML file input
2. Files are validated for type and size
3. FormData is created with files and book data
4. POST request sent to backend

### Backend (Node.js/Express)
1. Multer middleware processes file uploads
2. Files are uploaded to Cloudinary
3. URLs are stored in MongoDB
4. Response includes book data with file URLs

### Cloud Storage (Cloudinary)
1. Files are automatically organized in folders
2. Images are optimized and transformed
3. PDFs are stored as raw files
4. Secure URLs are generated

## Security Features

### File Upload Security
- **File Type Validation**: Only allowed file types
- **Size Limits**: Prevents large file uploads
- **Virus Scanning**: Cloudinary provides basic scanning
- **Secure URLs**: HTTPS URLs only

### Admin Security
- **JWT Authentication**: Secure admin access
- **Role-Based Access**: Admin-only endpoints
- **Input Validation**: Server-side validation
- **Rate Limiting**: Prevents abuse

## Deployment (Vercel)

### Environment Variables
Set the following in Vercel:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_USER`
- `ADMIN_PASS`

### File Upload Considerations
- **Vercel Limitations**: No local file storage
- **Cloud Storage**: All files stored in Cloudinary
- **Memory Usage**: Files processed in memory
- **Timeout**: Large files may timeout (consider chunked uploads)

## Usage Guide

### Adding a New Book
1. Navigate to Admin Panel → Books
2. Click "Add New Book"
3. Fill in book details (title, description, price, etc.)
4. Upload cover image (optional)
5. Upload PDF file (optional)
6. Click "Create Book"

### Editing a Book
1. Find the book in the list
2. Click the edit icon
3. Modify any fields
4. Upload new files if needed
5. Click "Update Book"

### Managing Payments
1. Navigate to Admin Panel → Payments
2. View pending payments
3. Click "Approve" or "Reject"
4. Users are automatically notified

### User Management
1. Navigate to Admin Panel → Users
2. View all registered users
3. Toggle user status (active/inactive)
4. Change user roles if needed

## Troubleshooting

### Common Issues

#### File Upload Fails
- Check Cloudinary credentials
- Verify file size limits
- Ensure file type is supported

#### Admin Login Issues
- Verify admin credentials in .env
- Check JWT secret configuration
- Ensure MongoDB connection

#### PDF Viewer Not Working
- Check if PDF URL is accessible
- Verify CORS settings
- Ensure PDF is properly uploaded

### Error Messages
- `"File too large"`: Reduce file size
- `"Invalid file type"`: Use supported formats
- `"Upload failed"`: Check Cloudinary configuration
- `"Admin access required"`: Verify admin role

## Performance Optimization

### File Optimization
- Images are automatically compressed
- PDFs are stored as-is for quality
- CDN delivery for fast loading

### Database Optimization
- Indexed queries for fast retrieval
- Efficient file URL storage
- Automatic cleanup of orphaned files

### Frontend Optimization
- Lazy loading of images
- Progressive file uploads
- Cached API responses

## Support

For technical support or questions:
1. Check the troubleshooting section
2. Verify environment variables
3. Test with smaller files first
4. Check browser console for errors

## Future Enhancements

### Planned Features
- **Bulk Upload**: Upload multiple books at once
- **File Compression**: Automatic PDF compression
- **Analytics**: Book download and view statistics
- **Advanced Search**: Filter and search books
- **Export Data**: Export book data to CSV/Excel
- **Backup System**: Automatic file backups
- **CDN Integration**: Multiple CDN support
- **Mobile App**: Native mobile admin app 