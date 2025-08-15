# Acadmix MERN Stack Application

A modern Single Page Application (SPA) built with the MERN stack (MongoDB, Express.js, React, Node.js) for selling educational study materials.

## 🚀 Features

- **Modern SPA**: Single Page Application with React Router
- **JWT Authentication**: Secure authentication with JWT tokens
- **Google OAuth**: Social login with Google
- **Payment Integration**: UPI payment system with QR codes
- **Admin Dashboard**: Complete admin panel for managing books and payments
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: React Query for efficient data fetching
- **Protected Routes**: Route protection for authenticated users

## 📁 Project Structure

```
public/
├── backend/                 # Express.js API server
│   ├── models/             # MongoDB models
│   ├── middleware/         # Custom middleware
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # React entry point
│   ├── index.html          # HTML template
│   └── package.json        # Frontend dependencies
└── assets/                 # Static assets
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **Passport.js** - Google OAuth
- **QRCode** - Payment QR generation
- **Helmet** - Security middleware

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **React Query** - Data fetching
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Google OAuth credentials (for social login)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lord-site
   ```

2. **Install backend dependencies**
   ```bash
   cd public/backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**

   Create a `.env` file in the `public/backend` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ADMIN_USER=admin_username
   ADMIN_PASS=admin_password
   SESSION_SECRET=your_session_secret
   ```

5. **Start the development servers**

   **Backend (Terminal 1):**
   ```bash
   cd public/backend
   npm run dev
   ```
   Server will run on: http://localhost:5000

   **Frontend (Terminal 2):**
   ```bash
   cd public/client
   npm run dev
   ```
   Frontend will run on: http://localhost:3000

## 📱 Available Routes

### Public Routes
- `/` - Home page with featured books
- `/class11` - Class 11 study materials
- `/class12` - Class 12 study materials
- `/tests` - Test series and practice papers
- `/login` - User login
- `/register` - User registration

### Protected Routes
- `/payment/:bookId` - Payment page for book purchase
- `/admin/*` - Admin dashboard (admin only)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:section` - Get books by section

### Payments
- `GET /api/payment/:bookId` - Get payment details
- `POST /api/payment/submit` - Submit payment

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Admin dashboard data
- `POST /api/admin/payments/:id/approve` - Approve payment
- `POST /api/admin/payments/:id/reject` - Reject payment
- `POST /api/admin/books` - Create book
- `PUT /api/admin/books/:id` - Update book
- `DELETE /api/admin/books/:id` - Delete book

## 🎨 Customization

### Styling
The application uses Tailwind CSS for styling. You can customize the theme in `public/client/tailwind.config.js`.

### Components
All reusable components are located in `public/client/src/components/`.

### Pages
Page components are in `public/client/src/pages/`.

## 🔒 Security Features

- JWT token authentication
- Protected routes
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation

## 📦 Deployment

### Backend Deployment (Vercel)
The backend is configured for Vercel deployment with `vercel.json`.

### Frontend Deployment
Build the frontend for production:
```bash
cd public/client
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@acadmix.shop or create an issue in the repository.

---

**Note**: Make sure to update the environment variables and Google OAuth credentials before deploying to production. 