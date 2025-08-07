import { useQuery } from '@tanstack/react-query';
import { BookOpen, Target, Clock, Award, Zap, ArrowRight, Star, Users, Brain, TrendingUp, CheckCircle } from 'lucide-react';
import api from '../services/api';
import BookCard from '../components/BookCard';

const Tests = () => {
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', 'test'],
    queryFn: () => api.get('/books?section=test').then(res => res.data),
  });

  const neetTests = books?.filter(book => book.category === 'NEET') || [];
  const jeeTests = books?.filter(book => book.category === 'JEE') || [];

  const features = [
    {
      icon: Clock,
      title: 'Timed Tests',
      description: 'Practice with realistic exam timing',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: Award,
      title: 'Detailed Analysis',
      description: 'Get comprehensive performance reports',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: Target,
      title: 'Topic-wise Tests',
      description: 'Focus on specific subjects and topics',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  const stats = [
    { number: '200+', label: 'Test Papers', icon: BookOpen },
    { number: '20K+', label: 'Students', icon: Users },
    { number: '99%', label: 'Accuracy', icon: Star },
    { number: '24/7', label: 'Available', icon: Clock },
  ];

  const testTypes = [
    {
      icon: Brain,
      title: 'Full Length Tests',
      description: 'Complete exam simulation with time pressure',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tests',
      description: 'Track your improvement over time',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      icon: CheckCircle,
      title: 'Chapter Tests',
      description: 'Subject-wise comprehensive testing',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
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
            <div className="flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-yellow-400 mr-2" />
              <span className="text-lg font-semibold text-yellow-400">Test Series & Practice</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
              Test Series & <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Practice Papers</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Assess Your Knowledge & Improve Performance
            </p>
            <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
              Comprehensive test series and practice papers for NEET and JEE preparation.
              Assess your knowledge and improve your performance with our expert-curated tests.
            </p>
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
              Why Choose Our <span className="gradient-text">Test Series</span>?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Designed to help you excel in your entrance exams
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

      {/* Test Types Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Types of <span className="gradient-text">Tests</span> Available
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive testing solutions for every need
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testTypes.map((type, index) => (
              <div key={index} className="card p-6 group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`${type.bgColor} w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <type.icon className={`h-8 w-8 ${type.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {type.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="spinner h-12 w-12"></div>
            </div>
          ) : (
            <div className="space-y-16">
              {/* NEET Tests */}
              <section className="animate-fade-in">
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mr-4">
                    <Target className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">NEET Test Series</h2>
                    <p className="text-gray-600 dark:text-gray-400">Comprehensive tests for medical entrance preparation</p>
                  </div>
                </div>
                
                {neetTests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {neetTests.map((book, index) => (
                      <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                        <BookCard book={book} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 card border-dashed border-2 border-gray-300 dark:border-gray-600">
                    <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No NEET Test Series Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">We're working on adding comprehensive NEET test series.</p>
                  </div>
                )}
              </section>

              {/* JEE Tests */}
              <section className="animate-fade-in">
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mr-4">
                    <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">JEE Test Series</h2>
                    <p className="text-gray-600 dark:text-gray-400">Advanced tests for engineering entrance preparation</p>
                  </div>
                </div>
                
                {jeeTests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {jeeTests.map((book, index) => (
                      <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                        <BookCard book={book} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 card border-dashed border-2 border-gray-300 dark:border-gray-600">
                    <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No JEE Test Series Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">We're working on adding comprehensive JEE test series.</p>
                  </div>
                )}
              </section>

              {/* Test Preparation Tips */}
              <section className="card p-8 animate-fade-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Test Preparation Tips
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Maximize your test performance with these strategies</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full mr-4 mt-1">
                        <Target className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Before the Test:</h4>
                        <ul className="text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Revise key concepts thoroughly
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Get adequate sleep the night before
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Keep all necessary materials ready
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Practice time management
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full mr-4 mt-1">
                        <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">During the Test:</h4>
                        <ul className="text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Read questions carefully
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Answer easy questions first
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Manage your time effectively
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Review your answers if time permits
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Performance Analytics */}
              <section className="card p-8 animate-fade-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Performance Analytics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Track your progress with detailed insights</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                    <TrendingUp className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Progress Tracking</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monitor your improvement over time with detailed analytics</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                    <Brain className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Weak Areas</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Identify and focus on your weak subjects and topics</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                    <Award className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ranking</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Compare your performance with other aspirants</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Tests; 