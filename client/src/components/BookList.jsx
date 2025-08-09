import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  BookOpen, 
  DollarSign, 
  Tag, 
  Calendar,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const BookList = ({ onEditBook }) => {
  const queryClient = useQueryClient();

  const { data: books, isLoading, error } = useQuery({
    queryKey: ['admin-books'],
    queryFn: () => api.get('/admin/books').then(res => res.data),
  });

  // Delete book mutation
  const deleteBook = useMutation({
    mutationFn: (id) => api.delete(`/admin/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-books']);
      toast.success('Book deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete book');
    },
  });

  const handleDelete = (book) => {
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      deleteBook.mutate(book._id);
    }
  };

  const getCategoryBadge = (category) => {
    return category === 'NEET' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800">
        NEET
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        JEE
      </span>
    );
  };

  const getSectionBadge = (section) => {
    const sectionColors = {
      'class11': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800',
      'class12': 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      'test': 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      'home': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sectionColors[section] || sectionColors['home']}`}>
        {section.charAt(0).toUpperCase() + section.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-500 dark:text-red-400">Failed to load books</p>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No books found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Books</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{books.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{books.reduce((sum, book) => sum + (book.isFree ? 0 : (book.price || 0)), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">With PDFs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {books.filter(book => book.pdfUrl).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <ImageIcon className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">With Images</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {books.filter(book => book.image).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Free Books</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {books.filter(book => book.isFree).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Books</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {books.map((book) => (
                <tr key={book._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {book.image ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover mr-4"
                          src={book.image}
                          alt={book.title}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-4">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {book.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {book.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(book.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSectionBadge(book.section)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {book.isFree ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
                          Free
                        </span>
                      ) : (
                        <>
                          ₹{book.price}
                          {book.priceDiscounted && book.priceDiscounted !== book.price && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              ₹{book.priceDiscounted}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {book.image && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Image
                        </span>
                      )}
                      {book.pdfUrl && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                          <FileText className="h-3 w-3 mr-1" />
                          PDF
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEditBook(book)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                        title="Edit Book"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      {book.pdfUrl && (
                        <a
                          href={book.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                          title="View PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                      
                      {book.pdfUrl && (
                        <a
                          href={book.pdfUrl}
                          download
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      
                      <button
                        onClick={() => handleDelete(book)}
                        disabled={deleteBook.isPending}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                        title="Delete Book"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookList; 