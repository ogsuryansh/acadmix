const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Book = require('./models/Book');
const User = require('./models/User');

// Test payment approval process
const testPaymentApproval = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acadmix');
    console.log('✅ Connected to database');

    // Find a pending payment
    const pendingPayment = await Payment.findOne({ status: 'pending' }).populate('book user');
    
    if (!pendingPayment) {
      console.log('❌ No pending payments found');
      return;
    }

    console.log('🔍 Found pending payment:', {
      id: pendingPayment._id,
      user: pendingPayment.user?.name,
      book: pendingPayment.book?.title,
      status: pendingPayment.status,
      submittedAt: pendingPayment.submittedAt
    });

    // Approve the payment
    pendingPayment.status = 'approved';
    pendingPayment.approvedAt = new Date();
    pendingPayment.approvedBy = 'test-admin';
    pendingPayment.notes = 'Test approval';

    await pendingPayment.save();
    console.log('✅ Payment approved successfully');

    // Check if the payment is now approved
    const approvedPayment = await Payment.findById(pendingPayment._id);
    console.log('🔍 Payment status after approval:', {
      id: approvedPayment._id,
      status: approvedPayment.status,
      approvedAt: approvedPayment.approvedAt,
      approvedBy: approvedPayment.approvedBy
    });

    // Test the purchased books query
    const approvedPayments = await Payment.find({ 
      user: pendingPayment.user._id, 
      status: "approved" 
    }).populate('book');

    console.log('🔍 Approved payments for user:', {
      userId: pendingPayment.user._id,
      count: approvedPayments.length,
      books: approvedPayments.map(p => p.book?.title)
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

console.log('🧪 Testing payment approval process...');
testPaymentApproval();
