import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, Clock, ArrowRight, Star, Zap, Target, User, Mail, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import BookCard from '../components/BookCard';

const Home = () => {
  const { user } = useAuth();
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', 'home'],
    queryFn: () => api.get('/books?section=home').then(res => res.data),
  });

  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Study Material',
      description: 'Access to high-quality study materials for NEET and JEE preparation.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: Users,
      title: 'Expert Guidance',
      description: 'Learn from experienced educators and subject matter experts.',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: Award,
      title: 'Proven Results',
      description: 'Thousands of students have achieved their goals with our materials.',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      icon: Clock,
      title: '24/7 Access',
      description: 'Study at your own pace with round-the-clock access to materials.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Students', icon: Users },
    { number: '95%', label: 'Success Rate', icon: Target },
    { number: '500+', label: 'Study Materials', icon: BookOpen },
    { number: '24/7', label: 'Support', icon: Zap },
  ];

  return (
    <div className="min-h-screen">
      <section className="gradient-bg text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in">
            {user ? (
              // Logged-in user content
              <>
                <div className="flex items-center justify-center mb-6">
                  <User className="h-8 w-8 text-yellow-400 mr-2" />
                  <span className="text-lg font-semibold text-yellow-400">Welcome back, {user.name}!</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                  Continue Your <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Learning Journey</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                  Pick up where you left off and keep progressing
                </p>
                <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
                  Your personalized study materials and progress tracking are ready for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/class11"
                    className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    Continue Learning
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/tests"
                    className="group border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    Take Practice Test
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            ) : (
              // Non-logged-in user content
              <>
                <div className="flex items-center justify-center mb-6">
                  <Star className="h-8 w-8 text-yellow-400 mr-2 animate-pulse" />
                  <span className="text-lg font-semibold text-yellow-400">Trusted by 10,000+ Students</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                  Welcome to <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Acadmix</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                  Your Gateway to NEET & JEE Success
                </p>
                <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
                  Access comprehensive study materials, practice tests, and expert guidance
                  to excel in your medical and engineering entrance exams.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/class11"
                    className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    Start Learning
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/register"
                    className="group border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                  >
                    Join Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full">
                    <stat.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose <span className="gradient-text">Acadmix</span>?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We provide everything you need to succeed in your entrance exams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`${feature.bgColor} w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-10 w-10 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Contact Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Need help? We're here to support your learning journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Email */}
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Get quick responses to your questions</p>
              <a
                href="mailto:acadmix.shop@gmail.com"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                acadmix.shop@gmail.com
              </a>
            </div>

            {/* WhatsApp */}
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">WhatsApp</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Instant messaging support</p>
              <a
                href="https://wa.me/212780729301"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors"
              >
                +212 780729301
              </a>
            </div>

            {/* Telegram */}
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Telegram</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Join our community channel</p>
              <a
                href="https://t.me/preachify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                @preachify
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-24 h-24 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute bottom-10 left-10 w-16 h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in">
            {user ? (
              <>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-shadow">
                  Keep Up the Great Work!
                </h2>
                <p className="text-xl mb-10 text-primary-100 max-w-2xl mx-auto leading-relaxed">
                  Your dedication to learning is the key to your success. Keep pushing forward!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/tests"
                    className="group bg-white text-primary-600 px-10 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg inline-flex items-center"
                  >
                    Take Practice Test
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/class12"
                    className="group border-2 border-white text-white px-10 py-4 rounded-xl font-semibold hover:bg-white hover:text-primary-600 transition-all duration-300 transform hover:scale-105 text-lg inline-flex items-center"
                  >
                    Explore Advanced Topics
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-shadow">
                  Ready to Start Your Journey?
                </h2>
                <p className="text-xl mb-10 text-primary-100 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of students who have achieved their dreams with Acadmix
                </p>
                <Link
                  to="/register"
                  className="group bg-white text-primary-600 px-10 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg inline-flex items-center"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 