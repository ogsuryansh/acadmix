import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  BookOpen, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Payment = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState(null);

  // Fetch payment data
  const { data: paymentData, isLoading, refetch, error: paymentError } = useQuery({
    queryKey: ['payment', bookId],
    queryFn: () => {
      console.log('🔍 Fetching payment data for bookId:', bookId);
      return api.get(`/payment/${bookId}`).then(res => {
        console.log('✅ Payment data fetched successfully:', res.data);
        return res.data;
      });
    },
    onError: (error) => {
      console.error('❌ Payment data fetch error:', error);
    }
  });

  // Submit payment mutation
  const submitPaymentMutation = useMutation({
    mutationFn: (data) => {
      console.log('🔍 Submitting payment with data:', data);
      return api.post('/payment/submit', data);
    },
    onSuccess: (data) => {
      console.log('✅ Payment submitted successfully:', data);
      toast.success('Payment submitted successfully!');
      setPaymentId(data.paymentId);
      setUtrNumber('');
      refetch();
    },
    onError: (error) => {
      console.error('❌ Payment submission error:', error);
      toast.error(error.response?.data?.error || 'Payment submission failed');
    },
  });

  // Check payment status
  const { data: paymentStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['payment-status', paymentId],
    queryFn: () => api.get(`/payment/${paymentId}/status`).then(res => res.data),
    enabled: !!paymentId,
    refetchInterval: paymentId ? 5000 : false, // Poll every 5 seconds if payment exists
    onSuccess: (data) => {
      console.log('✅ Payment status updated:', data);
      if (data.payment?.status === 'approved') {
        toast.success('Payment approved! You now have access to this book.');
      }
    },
    onError: (error) => {
      console.error('❌ Payment status check error:', error);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      toast.error('Please enter UTR number');
      return;
    }
    
    submitPaymentMutation.mutate({
      bookId,
      utr: utrNumber.trim(),
      amount: paymentData?.amount
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    if (paymentData?.qrCode) {
      const link = document.createElement('a');
      link.href = paymentData.qrCode;
      link.download = `payment-qr-${paymentData?.book?.title?.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'approved': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'rejected': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!paymentData?.book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Book not found</h2>
          <p className="text-gray-600 dark:text-gray-400">The requested study material could not be found.</p>
        </div>
      </div>
    );
  }

  const { book, qrCode, upiId, payeeName, amount, existingPayment } = paymentData;
  const currentPayment = paymentStatus?.payment || existingPayment;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Complete Your Purchase</h1>
          <p className="text-gray-600 dark:text-gray-400">Secure payment for {book.title}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Book Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Book Details</h2>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {book.image ? (
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-20 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-20 h-24 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{book.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{book.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    {book.priceDiscounted && book.priceDiscounted !== book.price ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{book.priceDiscounted}</span>
                        <span className="text-sm text-gray-500 line-through">₹{book.price}</span>
                        <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                          {Math.round(((book.price - book.priceDiscounted) / book.price) * 100)}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">₹{book.price}</span>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Amount to pay: ₹{amount}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 uppercase bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{book.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            {/* Payment Status */}
            {currentPayment && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Status</h2>
                <div className="flex items-center space-x-3 mb-4">
                  {(() => {
                    const StatusIcon = getStatusIcon(currentPayment.status);
                    return <StatusIcon className={`h-6 w-6 ${getStatusColor(currentPayment.status).split(' ')[0]}`} />;
                  })()}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentPayment.status)}`}>
                    {currentPayment.status.charAt(0).toUpperCase() + currentPayment.status.slice(1)}
                  </span>
                </div>
                
                {currentPayment.status === 'pending' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      Your payment is under review. You'll receive access once approved by admin.
                    </p>
                  </div>
                )}
                
                {currentPayment.status === 'approved' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      Payment approved! You now have access to this book.
                    </p>
                  </div>
                )}
                
                {currentPayment.status === 'rejected' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      Payment rejected: {currentPayment.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Options */}
            {(!currentPayment || currentPayment.status === 'rejected') && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Options</h2>
                
                {/* QR Code */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-3">
                    <QrCode className="h-5 w-5 text-primary-600 mr-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Scan QR Code</h3>
                  </div>
                  
                  {qrCode ? (
                    <div className="relative inline-block">
                      <img
                        src={qrCode}
                        alt="UPI QR Code"
                        className="mx-auto w-48 h-48 border rounded-lg"
                      />
                      <button
                        onClick={downloadQRCode}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                        title="Download QR Code"
                      >
                        <Download className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Payment Details */}
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      UPI ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={upiId}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(upiId)}
                        className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`₹${amount}`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={() => copyToClipboard(amount.toString())}
                        className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* UTR Submission */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="utr" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      UTR Number
                    </label>
                    <input
                      type="text"
                      id="utr"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter UTR number after payment"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitPaymentMutation.isPending}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitPaymentMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                        Submitting...
                      </div>
                    ) : (
                      'Submit Payment'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Payment Instructions:</h3>
          
          {/* Price Information */}
          <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pricing Details:</h4>
            {book.priceDiscounted && book.priceDiscounted !== book.price ? (
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>• Original Price: <span className="line-through">₹{book.price}</span></p>
                <p>• Discounted Price: <span className="font-semibold text-green-600">₹{book.priceDiscounted}</span></p>
                <p>• You Save: <span className="font-semibold text-green-600">₹{book.price - book.priceDiscounted}</span></p>
              </div>
            ) : (
              <p className="text-sm text-blue-800 dark:text-blue-200">
                • Book Price: <span className="font-semibold">₹{book.price}</span>
              </p>
            )}
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-2 font-medium">
              💳 Amount to Pay: ₹{amount}
            </p>
          </div>
          
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
            <li>Scan the QR code or use the UPI ID to make payment</li>
            <li>Pay the exact amount: ₹{amount}</li>
            <li>Copy the UTR number from your payment app</li>
            <li>Paste the UTR number in the form above</li>
            <li>Click "Submit Payment" to complete your purchase</li>
            <li>Your access will be granted after admin approval</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Payment; 