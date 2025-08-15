import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Check, 
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PaymentManagement = () => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  // Fetch pending payments
  const { data: pendingPayments, isLoading } = useQuery({
    queryKey: ['admin-pending-payments'],
    queryFn: () => api.get('/admin/payments/pending').then(res => res.data),
  });

  // Approve payment mutation
  const approvePaymentMutation = useMutation({
    mutationFn: ({ paymentId, notes }) => 
      api.put(`/admin/payment/${paymentId}/approve`, { notes }),
    onSuccess: () => {
      toast.success('Payment approved successfully!');
      queryClient.invalidateQueries(['admin-pending-payments']);
      queryClient.invalidateQueries(['purchased-books']);
      queryClient.invalidateQueries(['books']);
      setSelectedPayment(null);
      setApprovalNotes('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve payment');
    },
  });

  // Reject payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: ({ paymentId, rejectionReason }) => 
      api.put(`/admin/payment/${paymentId}/reject`, { rejectionReason }),
    onSuccess: () => {
      toast.success('Payment rejected successfully!');
      queryClient.invalidateQueries(['admin-pending-payments']);
      queryClient.invalidateQueries(['purchased-books']);
      queryClient.invalidateQueries(['books']);
      setSelectedPayment(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reject payment');
    },
  });

  const handleApprove = () => {
    if (!selectedPayment) return;
    
    approvePaymentMutation.mutate({
      paymentId: selectedPayment._id,
      notes: approvalNotes
    });
  };

  const handleReject = () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    rejectPaymentMutation.mutate({
      paymentId: selectedPayment._id,
      rejectionReason: rejectionReason.trim()
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return AlertCircle;
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve pending payments
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {pendingPayments?.payments?.length || 0} pending payments
        </div>
      </div>

      {/* Payment List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Payments</h3>
        </div>
        
        {pendingPayments?.payments?.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Pending Payments
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All payments have been processed
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingPayments?.payments?.map((payment) => (
              <div key={payment._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <img
                          src={payment.user?.profilePicture || `https://ui-avatars.com/api/?name=${payment.user?.name}&background=6366f1&color=fff`}
                          alt={payment.user?.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {payment.user?.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.user?.email}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-16 bg-primary-100 dark:bg-primary-900 rounded flex items-center justify-center">
                          {payment.book?.image ? (
                            <img
                              src={payment.book.image}
                              alt={payment.book.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-primary-100 dark:bg-primary-900 rounded flex items-center justify-center">
                              <span className="text-xs text-primary-600 dark:text-primary-400">📚</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {payment.book?.title}
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.book?.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                        <p className="font-semibold text-gray-900 dark:text-white">₹{payment.amount}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">UTR Number:</span>
                        <p className="font-mono text-gray-900 dark:text-white">{payment.utr}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(payment.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">UPI ID:</span>
                        <p className="font-mono text-gray-900 dark:text-white">{payment.upiId}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedPayment(payment)}
                      className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setApprovalNotes('');
                      }}
                      className="p-2 text-green-500 hover:text-green-600 transition-colors"
                      title="Approve Payment"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setRejectionReason('');
                      }}
                      className="p-2 text-red-500 hover:text-red-600 transition-colors"
                      title="Reject Payment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {approvalNotes === '' && rejectionReason === '' ? 'Payment Details' : 
                 approvalNotes !== '' ? 'Approve Payment' : 'Reject Payment'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">User:</span>
                      <span className="text-gray-900 dark:text-white">{selectedPayment.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Book:</span>
                      <span className="text-gray-900 dark:text-white">{selectedPayment.book?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                      <span className="text-gray-900 dark:text-white">₹{selectedPayment.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">UTR:</span>
                      <span className="text-gray-900 dark:text-white font-mono">{selectedPayment.utr}</span>
                    </div>
                  </div>
                </div>

                {approvalNotes !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      rows="3"
                      placeholder="Add any notes about this approval..."
                    />
                  </div>
                )}

                {rejectionReason !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      rows="3"
                      placeholder="Please provide a reason for rejection..."
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedPayment(null);
                    setApprovalNotes('');
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                
                {approvalNotes !== '' && (
                  <button
                    onClick={handleApprove}
                    disabled={approvePaymentMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {approvePaymentMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </button>
                )}
                
                {rejectionReason !== '' && (
                  <button
                    onClick={handleReject}
                    disabled={rejectPaymentMutation.isPending || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {rejectPaymentMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
