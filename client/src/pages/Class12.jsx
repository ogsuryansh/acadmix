import { useQuery } from '@tanstack/react-query';
import { BookOpen, Target, Trophy, Brain, Zap, ArrowRight, Star, Users, Clock, Award } from 'lucide-react';
import api from '../services/api';
import BookCard from '../components/BookCard';

const Class12 = () => {
  const { data: books, isLoading } = useQuery({
    queryKey: ['books', 'class12'],
    queryFn: () => api.get('/books?section=class12').then(res => res.data),
  });

  const neetBooks = books?.filter(book => book.category === 'NEET') || [];
  const jeeBooks = books?.filter(book => book.category === 'JEE') || [];

  const features = [
    {
      icon: Trophy,
      title: 'Advanced Concepts',
      description: 'Master complex topics and applications',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      icon: Brain,
      title: 'Deep Understanding',
      description: 'Comprehensive knowledge building',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: Zap,
      title: 'Exam Ready',
      description: 'Final preparation for entrance exams',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  const stats = [
    { number: '1000+', label: 'Advanced Materials', icon: BookOpen },
    { number: '15K+', label: 'Students', icon: Users },
    { number: '98%', label: 'Success Rate', icon: Star },
    { number: '24/7', label: 'Expert Support', icon: Clock },
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
              <Trophy className="h-8 w-8 text-yellow-400 mr-2" />
              <span className="text-lg font-semibold text-yellow-400">Class 12 Excellence</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
              Class 12 <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Study Materials</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Master Advanced Concepts for NEET & JEE Success
            </p>
            <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
              Advanced study materials for Class 12 students preparing for NEET and JEE entrance exams.
              Master the concepts and excel in your final year.
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
              Why Choose Our <span className="gradient-text">Class 12</span> Materials?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Designed specifically for Class 12 students to master advanced concepts
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

      {/* Content Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="spinner h-12 w-12"></div>
            </div>
          ) : (
            <div className="space-y-16">
              {/* NEET Section */}
              <section className="animate-fade-in">
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mr-4">
                    <Target className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">NEET Preparation</h2>
                    <p className="text-gray-600 dark:text-gray-400">Advanced materials for medical entrance excellence</p>
                  </div>
                </div>
                
                {neetBooks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {neetBooks.map((book, index) => (
                      <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                        <BookCard book={book} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 card border-dashed border-2 border-gray-300 dark:border-gray-600">
                    <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No NEET Materials Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">We're working on adding comprehensive NEET materials for Class 12.</p>
                  </div>
                )}
              </section>

              {/* JEE Section */}
              <section className="animate-fade-in">
                <div className="flex items-center mb-8">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mr-4">
                    <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">JEE Preparation</h2>
                    <p className="text-gray-600 dark:text-gray-400">Expert materials for engineering entrance mastery</p>
                  </div>
                </div>
                
                {jeeBooks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {jeeBooks.map((book, index) => (
                      <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                        <BookCard book={book} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 card border-dashed border-2 border-gray-300 dark:border-gray-600">
                    <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No JEE Materials Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">We're working on adding comprehensive JEE materials for Class 12.</p>
                  </div>
                )}
              </section>

              {/* Study Tips */}
              <section className="card p-8 animate-fade-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Study Tips for Class 12
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Expert strategies for final year success</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full mr-4 mt-1">
                        <Target className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">For NEET Aspirants:</h4>
                        <ul className="text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Revise Class 11 concepts thoroughly
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Focus on human physiology and genetics
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Practice previous year question papers
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Take regular mock tests
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
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">For JEE Aspirants:</h4>
                        <ul className="text-gray-600 dark:text-gray-400 space-y-2 text-sm">
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Master advanced mathematics topics
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Focus on electrostatics and magnetism
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Practice complex problem-solving
                          </li>
                          <li className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary-600 dark:text-primary-400 mr-2 mt-0.5 flex-shrink-0" />
                            Time management in exams
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Success Stories */}
              <section className="card p-8 animate-fade-in">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Success Stories
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Students who achieved their dreams with our materials</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl">
                    <Award className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">NEET AIR 45</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Our materials helped me understand complex concepts easily."</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                    <Award className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">JEE AIR 127</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"The advanced problem-solving techniques were game-changing."</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                    <Award className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">NEET AIR 89</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">"Comprehensive coverage of all important topics."</p>
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

export default Class12; 