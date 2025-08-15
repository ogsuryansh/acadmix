import { FileText, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileText className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Please read these terms carefully before using our services
          </p>
        </div>

        {/* Terms Content */}
        <div className="space-y-8">
          {/* Acceptance */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Acceptance of Terms
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                By accessing and using Acadmix's educational platform and services, you accept and agree to be bound by 
                the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          {/* Service Description */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Service Description
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Educational Content</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    We provide digital study materials, practice tests, and educational content for NEET and JEE preparation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Digital Access</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Access to purchased materials is provided digitally through our platform.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Payment Processing</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Secure payment processing with admin approval for all transactions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              User Responsibilities
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Account Security</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You are responsible for maintaining the confidentiality of your account credentials.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Proper Use</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Use our services only for educational purposes and in compliance with applicable laws.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">No Sharing</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Do not share, distribute, or resell our educational content without permission.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Payment and Refund Terms
            </h2>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">No Refund Policy</h3>
                    <p className="text-red-800 dark:text-red-200">
                      All purchases are final. No refunds will be provided under any circumstances once payment is approved.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Payment Processing</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Payments are processed securely and require admin approval before access is granted.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Lifetime Access</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Once approved, you receive lifetime access to purchased materials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Intellectual Property Rights
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                All content, materials, and intellectual property on Acadmix are owned by us or our licensors. 
                You are granted a limited, non-exclusive, non-transferable license to access and use the content 
                for personal educational purposes only.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                You may not copy, distribute, modify, or create derivative works from our content without explicit permission.
              </p>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Prohibited Activities
            </h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Sharing account credentials with others</span>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Downloading or copying content for redistribution</span>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Attempting to reverse engineer our platform</span>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Using automated tools to access our services</span>
              </div>
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Engaging in any illegal activities</span>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Limitation of Liability
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Acadmix shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including but not limited to loss of profits, data, or use, incurred by you or any third party, 
                whether in an action in contract or tort, even if Acadmix has been advised of the possibility of such damages.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Our total liability to you for any claims arising from the use of our services shall not exceed 
                the amount you paid for the specific service in question.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Termination
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We may terminate or suspend your account and access to our services at any time, with or without cause, 
                with or without notice, effective immediately. Upon termination, your right to use the service will cease immediately.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                You may terminate your account at any time by contacting our support team. However, no refunds will be provided 
                upon termination.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Email: legal@acadmix.com</li>
                <li>Phone: +91 98765 43210</li>
                <li>Address: Mumbai, Maharashtra, India</li>
                <li>Response Time: Within 48 hours</li>
              </ul>
            </div>
          </section>

          {/* Updates */}
          <section className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <div className="prose dark:prose-invert max-w-none text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                We reserve the right to modify these terms at any time. We will notify users of any material changes 
                by posting the new Terms of Service on this page. Your continued use of our services after such changes 
                constitutes acceptance of the new terms.
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

export default TermsOfService;
