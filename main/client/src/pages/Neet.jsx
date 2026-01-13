import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Target, GraduationCap, Brain, Zap, ArrowRight, Star, Users, Clock, User, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import BookCard from '../components/BookCard';

const Neet = () => {
    const { user } = useAuth();
    // Fetch books specifically with category=NEET. 
    // We can also filter by section if we had a dedicated 'neet' section, but using category is safer to catch all NEET books.
    const { data: books, isLoading } = useQuery({
        queryKey: ['books', 'neet'],
        queryFn: () => api.get('/books?category=NEET').then(res => res.data),
    });

    const features = [
        {
            icon: Heart,
            title: 'Biology Mastery',
            description: 'In-depth NCERT based notes',
            color: 'text-red-500',
            bgColor: 'bg-red-100 dark:bg-red-900/20',
        },
        {
            icon: Brain,
            title: 'Concept Clarity',
            description: 'Physics & Chemistry simplified',
            color: 'text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            icon: Zap,
            title: 'Exam Strategy',
            description: 'Tips to crack NEET with high rank',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        },
    ];

    const stats = [
        { number: '10K+', label: 'Questions', icon: BookOpen },
        { number: '20K+', label: 'NEET Aspirants', icon: Users },
        { number: '650+', label: 'Avg Target', icon: Star },
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
                                    <span className="text-lg font-semibold text-yellow-400">Future Doctors</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                                    Crack <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">NEET</span> with Confidence
                                </h1>
                                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                                    Your One-Stop Solution for Medical Entrance Preparation
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to="/neet"
                                        className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                                    >
                                        Start Studying
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </>
                        ) : (
                            // Non-logged-in user content
                            <>
                                <div className="flex items-center justify-center mb-6">
                                    <Target className="h-8 w-8 text-yellow-400 mr-2" />
                                    <span className="text-lg font-semibold text-yellow-400">NEET Preparation</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                                    Achieve Your <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">Medical Dream</span>
                                </h1>
                                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                                    Comprehensive Study Materials, Mock Tests & Detailed Notes
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to="/register"
                                        className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
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

            {/* Books Section */}
            <section className="py-16 bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 animate-fade-in">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {user ? 'Your NEET Materials' : 'NEET Study Resources'}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {user ? 'Continue with your preparation' : 'Curated content for NEET excellence'}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center">
                            <div className="spinner h-12 w-12"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {books && books.length > 0 ? (
                                books.map((book, index) => (
                                    <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <BookCard book={book} />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <div className="inline-flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                                        <BookOpen className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No NEET materials found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">We are updating our library. Check back soon!</p>
                                </div>
                            )}
                        </div>
                    )}
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
                            Why Choose Our <span className="gradient-text">NEET</span> Materials?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Focused content designed to help you maximize your NEET score
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
        </div>
    );
};

export default Neet;
