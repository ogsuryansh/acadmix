import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { googleLogin } = useAuth();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // User is already authenticated via session, just get user info
        await googleLogin();
        setStatus('success');
        setMessage('Redirecting to dashboard...');
        setTimeout(() => navigate('/'), 2000);

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, googleLogin]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Authentication
          </h2>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-effect py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Processing Authentication...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we complete your login.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Success!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Authentication Failed
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {message}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
