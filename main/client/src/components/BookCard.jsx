import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BookOpen, Lock, CheckCircle, Clock, XCircle, ArrowRight, Star, Eye } from 'lucide-react';
import AdvancedPDFViewer from './AdvancedPDFViewer';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const BookCard = ({ book }) => {
  const [showPDF, setShowPDF] = useState(false);
  const [showDemoPDF, setShowDemoPDF] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleBuyNow = (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to purchase this book');
      navigate('/login');
      return;
    }

    // Check if payment is pending
    if (book.paymentStatus === 'pending') {
      toast.error('Payment is already pending for this book. Please wait for admin approval.');
      return;
    }

    navigate(`/payment/${book._id}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </span>
        );
      case 'admin_access':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Admin Access
          </span>
        );
      case 'free':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Free
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <Lock className="h-3 w-3 mr-1" />
            Locked
          </span>
        );
    }
  };

  return (
    <>
      <div className="card group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
        <div className="relative bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {book.image ? (
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${book.image ? 'hidden' : ''}`}>
            <BookOpen className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>

          <div className="absolute top-2 right-2 flex items-center bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs text-white ml-1 font-medium">4.8</span>
          </div>

          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 backdrop-blur-sm">
              {book.category}
            </span>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {book.title}
              </h3>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
              {book.description}
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {book.isFree || book.paymentStatus === 'free' ? (
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    Free
                  </span>
                ) : (
                  <>
                    {book.priceDiscounted && book.priceDiscounted !== book.price ? (
                      <>
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                          ₹{book.priceDiscounted}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                          ₹{book.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{book.price}
                      </span>
                    )}
                  </>
                )}
              </div>

              {getStatusBadge(isAdmin ? 'admin_access' : (book.paymentStatus || 'locked'))}
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>{book.pages || '200+'} pages</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {(book.paymentStatus === 'approved' || book.paymentStatus === 'admin_access' || book.paymentStatus === 'free' || isAdmin) ? (
                <div className="flex items-center space-x-2 w-full">
                  {book.telegramLink ? (
                    <a
                      href={book.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-2.02-1.35-2.92-1.96-.96-.65-.05-1.09.2-1.34.64-.64 3.75-3.4 3.82-3.69.01-.03.01-.13-.05-.18s-.15-.04-.22.01c-.1.06-1.56.99-4.43 2.93-.41.28-.79.42-1.12.41-.36-.01-1.05-.2-1.56-.36-.63-.19-1.13-.29-1.08-.61.02-.16.24-.32.65-.49 2.54-1.1 4.24-1.83 5.09-2.18 2.42-1 2.92-1.17 3.25-1.17.07 0 .23.02.34.1.11.08.14.19.16.27l.02.13z" />
                      </svg>
                      Get on Telegram
                    </a>
                  ) : book.pdfUrl && (
                    <button
                      onClick={() => setShowPDF(true)}
                      className="group/link flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Read Now
                    </button>
                  )}
                  <Link
                    to={`/payment/${book._id}`}
                    className="group/link flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 ml-auto"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ) : book.paymentStatus === 'pending' ? (
                <div className="flex items-center justify-center w-full">
                  <button
                    disabled
                    className="flex items-center justify-center w-full text-sm text-gray-500 dark:text-gray-400 font-medium px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Payment Pending
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {book.demoPdfUrl && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDemoPDF(true);
                      }}
                      className="group/link flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Demo
                    </button>
                  )}
                  <button
                    onClick={handleBuyNow}
                    className={`group/link flex items-center justify-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-primary-200 dark:border-primary-800 ${!book.demoPdfUrl ? 'col-span-2' : ''}`}
                  >
                    Buy Now
                    <ArrowRight className="h-4 w-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {showPDF && book.pdfUrl && (
        <AdvancedPDFViewer
          pdfUrl={book.pdfUrl}
          title={book.title}
          onClose={() => setShowPDF(false)}
        />
      )}

      {showDemoPDF && book.demoPdfUrl && (
        <AdvancedPDFViewer
          pdfUrl={book.demoPdfUrl}
          title={`${book.title} (Demo)`}
          onClose={() => setShowDemoPDF(false)}
        />
      )}
    </>
  );
};

export default BookCard; 