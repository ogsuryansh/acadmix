import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, BookOpen, User, LogOut, Sparkles, Home, BookMarked, Target, Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const publicNavigation = [
    { name: 'Home', href: '/' },
    { name: 'NEET', href: '/neet' },
    { name: 'BOARDS (CBSE)', href: '/boards' },
    { name: 'Class 11', href: '/class11' },
    { name: 'Class 12', href: '/class12' },
  ];

  const isAdmin = user?.role === 'admin';

  const userNavigation = [
    { name: 'Dashboard', href: isAdmin ? '/admin' : '/', icon: Home },
    { name: 'My Books', href: '/my-books', icon: BookMarked },
    { name: 'NEET', href: '/neet', icon: Target },
    { name: 'BOARDS (CBSE)', href: '/boards', icon: Target },
    { name: 'Class 11', href: '/class11', icon: BookOpen },
    { name: 'Class 12', href: '/class12', icon: BookOpen },
  ];

  const navigation = user ? userNavigation : publicNavigation;
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-effect fixed w-full top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
              <span className="ml-2 text-xl font-bold gradient-text tracking-tight">Acadmix</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center ${isActive(item.href)
                  ? 'text-white bg-primary-600 shadow-md shadow-primary-500/30'
                  : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
              >
                {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Auth & Theme */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-sm">
                    <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium hidden lg:block">
                    {user.name}
                  </span>
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200 underline-offset-4 hover:underline"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-full shadow-lg shadow-primary-500/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50`}>
        <div className="px-4 pt-2 pb-6 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 flex items-center ${isActive(item.href)
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon && <item.icon className="h-5 w-5 mr-3" />}
              {item.name}
            </Link>
          ))}

          {user ? (
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center px-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-base text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-3 text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 px-1">
              <Link
                to="/login"
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform active:scale-95"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 