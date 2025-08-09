import { useQuery } from '@tanstack/react-query';
import { BookOpen, ShoppingBag, Download, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import BookCard from '../components/BookCard';

const MyBooks = () => {
  const { user } = useAuth();
  
  const { data: purchasedBooks, isLoading, error } = useQuery({
    queryKey: ['purchased-books'],
    queryFn: () => {
      console.log('🔍 Fetching purchased books for user:', user?.id);
      return api.get('/user/purchased-books').then(res => {
        console.log('✅ Purchased books response:', res.data);
        return res.data;
      });
    },
    enabled: !!user,
  });

  console.log('🔍 MyBooks Debug:', {
    user: user?.id,
    isLoading,
    error: error?.message,
    purchasedBooks: purchasedBooks?.length || 0
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view your books
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Books
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your purchased study materials
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="spinner h-12 w-12"></div>
          </div>
        ) : purchasedBooks && purchasedBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchasedBooks.map((book, index) => (
              <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                <BookCard book={book} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Books Purchased Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start building your library by purchasing study materials.
            </p>
            <a
              href="/class11"
              className="btn-primary inline-flex items-center"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Books
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBooks;
