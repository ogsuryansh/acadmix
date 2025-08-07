import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  BookOpen,
  DollarSign,
  Tag,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import BookList from './BookList';

const BookManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'NEET',
    section: 'class11',
    price: '',
    priceDiscounted: '',
    pages: '',
    image: null,
    pdf: null,
    imagePreview: null,
    pdfName: null
  });
  const queryClient = useQueryClient();

  // Create book mutation
  const createBook = useMutation({
    mutationFn: (data) => api.post('/admin/books', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      toast.success('Book created successfully');
      setShowAddModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create book');
    },
  });

  // Update book mutation
  const updateBook = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/books/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      toast.success('Book updated successfully');
      setShowAddModal(false);
      setEditingBook(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update book');
    },
  });

  // Delete book mutation
  const deleteBook = useMutation({
    mutationFn: (id) => api.delete(`/admin/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      toast.success('Book deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete book');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'NEET',
      section: 'class11',
      price: '',
      priceDiscounted: '',
      pages: '',
      image: null,
      pdf: null,
      imagePreview: null,
      pdfName: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('PDF size should be less than 50MB');
        return;
      }
      
      if (file.type !== 'application/pdf') {
        toast.error('Please select a valid PDF file');
        return;
      }

      setFormData(prev => ({
        ...prev,
        pdf: file,
        pdfName: file.name
      }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
  };

  const removePdf = () => {
    setFormData(prev => ({
      ...prev,
      pdf: null,
      pdfName: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('section', formData.section);
    submitData.append('price', formData.price);
    submitData.append('priceDiscounted', formData.priceDiscounted);
    submitData.append('pages', formData.pages);
    
    if (formData.image) {
      submitData.append('image', formData.image);
    }
    
    if (formData.pdf) {
      submitData.append('pdf', formData.pdf);
    }

    if (editingBook) {
      updateBook.mutate({ id: editingBook._id, data: submitData });
    } else {
      createBook.mutate(submitData);
    }
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      description: book.description,
      category: book.category,
      section: book.section,
      price: book.price,
      priceDiscounted: book.priceDiscounted || '',
      pages: book.pages || '',
      image: null,
      pdf: null,
      imagePreview: book.image || null,
      pdfName: book.pdfUrl ? 'Current PDF' : null
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingBook(null);
    resetForm();
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Book Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Add, edit, and manage study materials</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Book
        </button>
      </div>

      {/* Book List */}
      <BookList onEditBook={openEditModal} />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter book title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="NEET">NEET</option>
                      <option value="JEE">JEE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Section *
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="class11">Class 11</option>
                      <option value="class12">Class 12</option>
                      <option value="test">Test Series</option>
                      <option value="home">Home</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discounted Price (₹)
                    </label>
                    <input
                      type="number"
                      name="priceDiscounted"
                      value={formData.priceDiscounted}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="input-field"
                    placeholder="Enter book description"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Pages
                    </label>
                    <input
                      type="number"
                      name="pages"
                      value={formData.pages}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="200"
                    />
                  </div>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cover Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      {formData.imagePreview ? (
                        <div className="relative">
                          <img
                            src={formData.imagePreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Click to upload cover image
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="btn-secondary cursor-pointer"
                          >
                            Choose Image
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PDF File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                      {formData.pdfName ? (
                        <div className="relative">
                          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <FileText className="h-8 w-8 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {formData.pdfName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removePdf}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Click to upload PDF
                          </p>
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                            id="pdf-upload"
                          />
                          <label
                            htmlFor="pdf-upload"
                            className="btn-secondary cursor-pointer"
                          >
                            Choose PDF
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createBook.isPending || updateBook.isPending}
                    className="btn-primary"
                  >
                    {createBook.isPending || updateBook.isPending ? (
                      <div className="spinner h-4 w-4 mr-2" />
                    ) : (
                      <BookOpen className="h-4 w-4 mr-2" />
                    )}
                    {editingBook ? 'Update Book' : 'Create Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagement; 