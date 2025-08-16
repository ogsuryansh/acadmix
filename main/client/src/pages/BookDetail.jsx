import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Download, 
  ArrowLeft, 
  Star, 
  Clock, 
  FileText,
  Tag,
  DollarSign,
  ShoppingCart,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const BookDetail = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: book, isLoading, error } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => api.get(`/books/${bookId}`).then(res => res.data),
    enabled: !!bookId,
  });

  const handlePurchase = () => {
    if (!user) {
      toast.error('Please login to purchase this book');
      navigate('/login', { state: { from: `/book/${bookId}` } });
      return;
    }
    
    // Navigate to payment page
    navigate(`/payment/${bookId}`);
  };

  const handlePreview = () => {
    if (book?.pdfUrl) {
      window.open(book.pdfUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Book Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The book you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Book Details
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Image and Basic Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <BookOpen className="h-24 w-24 text-gray-400" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {book.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {book.pages} pages
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handlePurchase}
                      className="w-full btn-primary flex items-center justify-center space-x-2 py-3"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>
                        {book.isFree ? 'Get Free Book' : (
                          book.priceDiscounted && book.priceDiscounted !== book.price ? 
                          `Buy for ₹${book.priceDiscounted}` : 
                          `Buy for ₹${book.price}`
                        )}
                      </span>
                    </button>
                    
                    {book.pdfUrl && (
                      <button
                        onClick={handlePreview}
                        className="w-full btn-outline flex items-center justify-center space-x-2 py-3"
                      >
                        <Eye className="h-5 w-5" />
                        <span>Preview Book</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Book Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {book.pages}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pages
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {book.category}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Category
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {book.section}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Section
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-600 rounded-lg">
                  <div className="text-sm text-blue-100">
                    {book.priceDiscounted && book.priceDiscounted !== book.price ? 'Sale Price' : 'Price'}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {book.isFree ? 'Free' : (
                      book.priceDiscounted && book.priceDiscounted !== book.price ? 
                      `₹${book.priceDiscounted}` : 
                      `₹${book.price}`
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  What you'll get
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Complete PDF version of the book
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      High-quality content for {book.category} preparation
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Instant download after purchase
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Accessible on all devices
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(book.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Format:</span> PDF
                  </div>
                  <div>
                    <span className="font-medium">Language:</span> English
                  </div>
                  <div>
                    <span className="font-medium">File Size:</span> Optimized
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
