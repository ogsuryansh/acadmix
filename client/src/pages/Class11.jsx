import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Target, GraduationCap, Brain, Zap, ArrowRight, Star, Users, Clock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import BookCard from '../components/BookCard';

const Class11 = () => {
  const { user } = useAuth();
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', 'class11'],
    queryFn: () => api.get('/books?section=class11').then(res => res.data),
  });

  const neetBooks = books?.filter(book => book.category === 'NEET') || [];
  const jeeBooks = books?.filter(book => book.category === 'JEE') || [];

  const features = [
    {
      icon: GraduationCap,
      title: 'Foundation Building',
      description: 'Strong base for advanced concepts',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: Brain,
      title: 'Concept Clarity',
      description: 'Clear understanding of fundamentals',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: Zap,
      title: 'Quick Learning',
      description: 'Efficient study methods',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
  ];

  const stats = [
    { number: '500+', label: 'Study Materials', icon: BookOpen },
    { number: '10K+', label: 'Students', icon: Users },
    { number: '95%', label: 'Success Rate', icon: Star },
    { number: '24/7', label: 'Support', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
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
                  <span className="text-lg font-semibold text-yellow-400">Your Class 11 Journey</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                  Continue Your <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Foundation</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                  Keep building your strong base for NEET & JEE
                </p>
                <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
                  You're making great progress! Continue with your personalized study materials 
                  and track your learning journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/class11"
                    className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    Continue Reading
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
                  <GraduationCap className="h-8 w-8 text-yellow-400 mr-2" />
                  <span className="text-lg font-semibold text-yellow-400">Class 11 Foundation</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                  Class 11 <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Study Materials</span>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                  Build a Strong Foundation for NEET & JEE Success
                </p>
                <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
                  Comprehensive study materials for Class 11 students preparing for NEET and JEE entrance exams.
                  Build a strong foundation with our expert-curated content.
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

      {/* Stats Section */}
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

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Our <span className="gradient-text">Class 11</span> Materials?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {user ? 'Personalized learning experience tailored to your progress' : 'Comprehensive study materials designed for success'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      {/* NEET Books Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {user ? 'Your NEET Study Materials' : 'NEET Study Materials'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {user ? 'Continue with your NEET preparation' : 'Comprehensive materials for NEET preparation'}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="spinner h-12 w-12"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {neetBooks.slice(0, 8).map((book, index) => (
                <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* JEE Books Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {user ? 'Your JEE Study Materials' : 'JEE Study Materials'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {user ? 'Continue with your JEE preparation' : 'Comprehensive materials for JEE preparation'}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <div className="spinner h-12 w-12"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {jeeBooks.slice(0, 8).map((book, index) => (
                <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
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
                  Keep Building Your Foundation!
                </h2>
                <p className="text-xl mb-10 text-primary-100 max-w-2xl mx-auto leading-relaxed">
                  Your dedication to learning is creating a strong base for your future success.
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
                  Ready to Start Your Foundation?
                </h2>
                <p className="text-xl mb-10 text-primary-100 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of students building their foundation for NEET & JEE success
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

export default Class11; 