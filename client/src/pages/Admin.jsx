import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  Plus,
  Eye,
  Download,
  Settings,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Upload,
  FileText,
  Image,
  DollarSign,
  BarChart3,
  QrCode,
  CreditCard as CreditCardIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import BookManagement from '../components/BookManagement';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [paymentConfig, setPaymentConfig] = useState({
    upiId: '',
    payeeName: '',
    bankName: ''
  });
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(res => res.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(res => res.data),
    enabled: activeTab === 'users',
  });

  // Payment configuration query
  const { data: paymentConfigData } = useQuery({
    queryKey: ['payment-config'],
    queryFn: () => api.get('/admin/payment-config').then(res => res.data),
    enabled: activeTab === 'payment-config',
  });

  // Admin configuration query
  const { data: adminConfig } = useQuery({
    queryKey: ['admin-config'],
    queryFn: () => api.get('/admin/config').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Payment configuration update mutation
  const updatePaymentConfig = useMutation({
    mutationFn: (config) => api.put('/admin/payment-config', config),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-config']);
      toast.success('Payment configuration updated successfully');
      setIsEditingPayment(false);
    },
    onError: () => {
      toast.error('Failed to update payment configuration');
    },
  });

  // Payment approval mutation
  const approvePayment = useMutation({
    mutationFn: (paymentId) => api.post(`/admin/payments/${paymentId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-dashboard']);
      toast.success('Payment approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve payment');
    },
  });

  // Payment rejection mutation
  const rejectPayment = useMutation({
    mutationFn: (paymentId) => api.post(`/admin/payments/${paymentId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-dashboard']);
      toast.success('Payment rejected successfully');
    },
    onError: () => {
      toast.error('Failed to reject payment');
    },
  });

  // User role update mutation
  const updateUserRole = useMutation({
    mutationFn: ({ userId, role }) => api.put(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User role updated successfully');
    },
    onError: () => {
      toast.error('Failed to update user role');
    },
  });

  // User status update mutation
  const updateUserStatus = useMutation({
    mutationFn: ({ userId, isActive }) => api.put(`/admin/users/${userId}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update user status');
    },
  });

  const stats = [
    {
      name: 'Total Users',
      value: dashboardData?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      change: dashboardData?.userGrowth ? `${dashboardData.userGrowth >= 0 ? '+' : ''}${dashboardData.userGrowth}%` : '+0%',
      changeType: dashboardData?.userGrowth >= 0 ? 'positive' : 'negative'
    },
    {
      name: 'Total Books',
      value: dashboardData?.totalBooks || 0,
      icon: BookOpen,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      change: dashboardData?.bookGrowth ? `${dashboardData.bookGrowth >= 0 ? '+' : ''}${dashboardData.bookGrowth}%` : '+0%',
      changeType: dashboardData?.bookGrowth >= 0 ? 'positive' : 'negative'
    },
    {
      name: 'Total Payments',
      value: dashboardData?.totalPayments || 0,
      icon: CreditCard,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      change: dashboardData?.paymentGrowth ? `${dashboardData.paymentGrowth >= 0 ? '+' : ''}${dashboardData.paymentGrowth}%` : '+0%',
      changeType: dashboardData?.paymentGrowth >= 0 ? 'positive' : 'negative'
    },
    {
      name: 'Revenue',
      value: `₹${dashboardData?.totalRevenue || 0}`,
      icon: DollarSign,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      change: dashboardData?.revenueGrowth ? `${dashboardData.revenueGrowth >= 0 ? '+' : ''}${dashboardData.revenueGrowth}%` : '+0%',
      changeType: dashboardData?.revenueGrowth >= 0 ? 'positive' : 'negative'
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
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
            Unknown
          </span>
        );
    }
  };

  const getRoleBadge = (role) => {
    return role === 'admin' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800">
        Admin
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
        User
      </span>
    );
  };

  const getStatusToggle = (user) => {
    return (
      <button
        onClick={() => updateUserStatus.mutate({ 
          userId: user._id, 
          isActive: !user.isActive 
        })}
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
          user.isActive 
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40' 
            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40'
        }`}
      >
        {user.isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
        {user.isActive ? 'Active' : 'Inactive'}
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your Acadmix platform</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'books', label: 'Books', icon: BookOpen },
              { id: 'payment-config', label: 'Payment Config', icon: CreditCardIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={stat.name} className="card p-6 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      stat.changeType === 'positive' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveTab('books')}
                    className="w-full btn-primary text-sm flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Book
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className="w-full btn-secondary text-sm flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All Users
                  </button>
                  <button className="w-full btn-secondary text-sm flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Book
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      UTR Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {dashboardData?.payments?.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.user?.email || 'No email'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {payment.book?.title || 'Unknown Book'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ₹{payment.book?.priceDiscounted || payment.book?.price || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {payment.utr}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(payment.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {payment.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => approvePayment.mutate(payment._id)}
                                disabled={approvePayment.isPending}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50 transition-colors"
                              >
                                {approvePayment.isPending ? 'Approving...' : 'Approve'}
                              </button>
                              <button 
                                onClick={() => rejectPayment.mutate(payment._id)}
                                disabled={rejectPayment.isPending}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
                              >
                                {rejectPayment.isPending ? 'Rejecting...' : 'Reject'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(!dashboardData?.payments || dashboardData.payments.length === 0) && (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No payments found</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {usersData?.users?.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.photo && (
                            <img className="h-10 w-10 rounded-full mr-3" src={user.photo} alt={user.name} />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusToggle(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {(!usersData?.users || usersData.users.length === 0) && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No users found</p>
              </div>
            )}
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && <BookManagement />}

        {/* Payment Configuration Tab */}
        {activeTab === 'payment-config' && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Configuration</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure UPI payment settings for your platform
              </p>
            </div>
            
            <div className="p-6">
              {isEditingPayment ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  updatePaymentConfig.mutate(paymentConfig);
                }} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.upiId}
                        onChange={(e) => setPaymentConfig({...paymentConfig, upiId: e.target.value})}
                        placeholder="e.g., acadmix@paytm"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payee Name
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.payeeName}
                        onChange={(e) => setPaymentConfig({...paymentConfig, payeeName: e.target.value})}
                        placeholder="e.g., Acadmix"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={paymentConfig.bankName}
                        onChange={(e) => setPaymentConfig({...paymentConfig, bankName: e.target.value})}
                        placeholder="e.g., Paytm"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={updatePaymentConfig.isPending}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatePaymentConfig.isPending ? 'Saving...' : 'Save Configuration'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPayment(false);
                        setPaymentConfig({
                          upiId: paymentConfigData?.config?.upiId || '',
                          payeeName: paymentConfigData?.config?.payeeName || '',
                          bankName: paymentConfigData?.config?.bankName || ''
                        });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CreditCardIcon className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="font-medium text-gray-900 dark:text-white">UPI ID</h3>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {paymentConfigData?.config?.upiId || 'Not configured'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <UserCheck className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="font-medium text-gray-900 dark:text-white">Payee Name</h3>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {paymentConfigData?.config?.payeeName || 'Not configured'}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <BarChart3 className="h-5 w-5 text-primary-600 mr-2" />
                        <h3 className="font-medium text-gray-900 dark:text-white">Bank Name</h3>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {paymentConfigData?.config?.bankName || 'Not configured'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Test QR Code</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                      Test the current configuration with a sample payment of ₹{adminConfig?.payment?.testAmount || 100}
                    </p>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          const testUpiLink = `upi://pay?pa=${paymentConfigData?.config?.upiId}&pn=${encodeURIComponent(paymentConfigData?.config?.payeeName)}&am=${adminConfig?.payment?.testAmount || 100}&cu=INR`;
                          navigator.clipboard.writeText(testUpiLink);
                          toast.success('Test UPI link copied to clipboard!');
                        }}
                        className="btn-secondary text-sm"
                      >
                        Copy Test UPI Link
                      </button>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Amount: ₹{adminConfig?.payment?.testAmount || 100}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsEditingPayment(true);
                      setPaymentConfig({
                        upiId: paymentConfigData?.config?.upiId || '',
                        payeeName: paymentConfigData?.config?.payeeName || '',
                        bankName: paymentConfigData?.config?.bankName || ''
                      });
                    }}
                    className="btn-primary"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin; 