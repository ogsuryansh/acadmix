import { Shield, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Refund Policy
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Important information about our refund policy
          </p>
        </div>

        {/* No Refund Notice */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-2">
                No Refund Policy
              </h2>
              <p className="text-red-800 dark:text-red-200">
                <strong>IMPORTANT:</strong> Acadmix operates on a strict no-refund policy. 
                Once a payment is made and approved, no refunds will be provided under any circumstances.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="space-y-8">
          {/* Overview */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Policy Overview
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                At Acadmix, we provide digital study materials and educational content. 
                Due to the nature of our digital products and services, we maintain a strict 
                no-refund policy to protect our business and ensure fair usage of our resources.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                By making a purchase on our platform, you acknowledge and agree to this 
                no-refund policy. This policy applies to all purchases made through our website.
              </p>
            </div>
          </section>

          {/* No Refund Circumstances */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No Refunds Will Be Provided For:
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Digital Content Access</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Once you gain access to our study materials, no refunds will be provided 
                    regardless of usage or satisfaction level.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Change of Mind</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Refunds will not be provided if you change your mind after making a purchase.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Technical Issues</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No refunds for technical difficulties, device compatibility issues, or 
                    internet connectivity problems.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Exam Results</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Refunds will not be provided based on exam results, performance, or 
                    perceived value of the materials.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Time Limitations</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No refunds for time-based access or subscription services after the 
                    access period has begun.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* What You Get */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              What You Receive
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Lifetime Access</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Once approved, you get lifetime access to the purchased study materials.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">High-Quality Content</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Expert-curated study materials designed for NEET and JEE preparation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">24/7 Access</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Access your materials anytime, anywhere through our platform.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Regular Updates</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Materials are regularly updated to stay current with exam patterns.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Questions About This Policy?
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If you have any questions about our refund policy, please contact our support team:
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Email: support@acadmix.com</li>
                <li>Phone: +91 98765 43210</li>
                <li>Response Time: Within 24-48 hours</li>
              </ul>
            </div>
          </section>

          {/* Legal Notice */}
          <section className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Legal Notice
            </h2>
            <div className="prose dark:prose-invert max-w-none text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                This refund policy is legally binding and constitutes part of our Terms of Service. 
                By making a purchase on Acadmix, you explicitly agree to this no-refund policy. 
                This policy is subject to change at our discretion, but such changes will not 
                affect purchases already made.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
