import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { BookOpen, CreditCard, QrCode, Copy, Check } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Payment = () => {
  const { bookId } = useParams();
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => api.get(`/books/${bookId}`).then(res => res.data),
  });

  const { data: paymentData } = useQuery({
    queryKey: ['payment', bookId],
    queryFn: () => api.get(`/payment/${bookId}`).then(res => res.data),
  });

  const submitPaymentMutation = useMutation({
    mutationFn: (data) => api.post('/payment/submit', data),
    onSuccess: () => {
      toast.success('Payment submitted successfully!');
      setUtrNumber('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Payment submission failed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      toast.error('Please enter UTR number');
      return;
    }
    
    submitPaymentMutation.mutate({
      bookId,
      utrNumber: utrNumber.trim(),
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Book not found</h2>
          <p className="text-gray-600">The requested study material could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Complete Your Purchase</h1>
            <p className="text-primary-100">Secure payment for {book.title}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Book Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Book Details</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {book.image ? (
                        <img
                          src={book.image}
                          alt={book.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-primary-100 rounded flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{book.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{book.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg font-bold text-primary-600">₹{book.price}</span>
                        <span className="text-sm text-gray-500 uppercase">{book.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Options</h2>
                
                {/* UPI Payment */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-3">
                    <CreditCard className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-medium text-gray-900">UPI Payment</h3>
                  </div>
                  
                  {paymentData?.qrCode && (
                    <div className="text-center mb-4">
                      <img
                        src={paymentData.qrCode}
                        alt="UPI QR Code"
                        className="mx-auto w-48 h-48 border rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UPI ID
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={paymentData?.upiId || 'acadmix@paytm'}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                        />
                        <button
                          onClick={() => copyToClipboard(paymentData?.upiId || 'acadmix@paytm')}
                          className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={`₹${book.price}`}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                        />
                        <button
                          onClick={() => copyToClipboard(book.price.toString())}
                          className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UTR Submission */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Submit Payment Details</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="utr" className="block text-sm font-medium text-gray-700 mb-1">
                        UTR Number
                      </label>
                      <input
                        type="text"
                        id="utr"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        placeholder="Enter UTR number after payment"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submitPaymentMutation.isPending}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitPaymentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                      ) : (
                        'Submit Payment'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Payment Instructions:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Scan the QR code or use the UPI ID to make payment</li>
                <li>Pay the exact amount: ₹{book.price}</li>
                <li>Copy the UTR number from your payment app</li>
                <li>Paste the UTR number in the form above</li>
                <li>Click "Submit Payment" to complete your purchase</li>
                <li>Your access will be granted after payment verification</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 