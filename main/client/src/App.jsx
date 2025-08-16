import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Class11 from './pages/Class11';
import Class12 from './pages/Class12';
import Tests from './pages/Tests';
import Login from './pages/Login';
import Register from './pages/Register';
import Payment from './pages/Payment';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import AuthCallback from './pages/AuthCallback';
import MyBooks from './pages/MyBooks';
import BookDetail from './pages/BookDetail';
import RefundPolicy from './pages/RefundPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 flex flex-col">
              <Navbar />
              <main className="flex-1 pt-16 animate-fade-in">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/class11" element={<Class11 />} />
                  <Route path="/class12" element={<Class12 />} />
                  <Route path="/tests" element={<Tests />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin-login" element={<AdminLogin />} />
                  <Route path="/auth-callback" element={<AuthCallback />} />
                  <Route path="/refund" element={<RefundPolicy />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route 
                    path="/book/:bookId" 
                    element={<BookDetail />} 
                  />
                  <Route 
                    path="/my-books" 
                    element={
                      <ProtectedRoute>
                        <MyBooks />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/payment/:bookId" 
                    element={
                      <ProtectedRoute>
                        <Payment />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <AdminRoute>
                        <Admin />
                      </AdminRoute>
                    } 
                  />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg, #363636)',
                  color: 'var(--toast-color, #fff)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                },
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
