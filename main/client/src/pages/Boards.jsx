import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Target, GraduationCap, Brain, Zap, ArrowRight, Star, Users, Clock, User, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import BookCard from '../components/BookCard';

const Boards = () => {
    const { user } = useAuth();
    const { data: books, isLoading } = useQuery({
        queryKey: ['books', 'boards'],
        queryFn: () => api.get('/books?section=boards').then(res => res.data),
    });

    // You might want to categorize boards books if needed, e.g., Class 10, Class 12 Boards, etc.
    // For now, we'll just display all books retrieved for the 'boards' section.
    const cbseBooks = books || [];

    const features = [
        {
            icon: GraduationCap,
            title: 'CBSE Curriculum',
            description: 'Strictly aligned with latest CBSE syllabus',
            color: 'text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        },
        {
            icon: Brain,
            title: 'Board Exam Focus',
            description: 'Chapter-wise important questions & solutions',
            color: 'text-green-500',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
        },
        {
            icon: Zap,
            title: 'Previous Years',
            description: 'Solved papers for better practice',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        },
    ];

    const stats = [
        { number: '100+', label: 'Board Papers', icon: BookOpen },
        { number: '5K+', label: 'Students', icon: Users },
        { number: '90%+', label: 'Score High', icon: Star },
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
                                    <span className="text-lg font-semibold text-yellow-400">Ace Your Boards</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                                    Master <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">CBSE Boards</span>
                                </h1>
                                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                                    Comprehensive materials for Class 10 & 12 Board Exams
                                </p>
                                <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
                                    Your path to scoring 95%+ starts here. Access curated notes, sample papers, and important questions.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to="/boards"
                                        className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                                    >
                                        Explore Materials
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </>
                        ) : (
                            // Non-logged-in user content
                            <>
                                <div className="flex items-center justify-center mb-6">
                                    <GraduationCap className="h-8 w-8 text-yellow-400 mr-2" />
                                    <span className="text-lg font-semibold text-yellow-400">CBSE Board Prep</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-shadow-lg">
                                    Target <span className="gradient-text bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">95% Plus</span>
                                </h1>
                                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                                    The Ultimate Resource for CBSE Board Students
                                </p>
                                <p className="text-lg mb-12 text-primary-200 max-w-3xl mx-auto leading-relaxed">
                                    Get access to chapter-wise notes, previous year papers, and expert tips to excel in your board examinations.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to="/register"
                                        className="group bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center"
                                    >
                                        Start Preparing
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
                            {user ? 'Your Board Materials' : 'CBSE Study Resources'}
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {user ? 'Continue with your preparation' : 'Everything you need for board exam success'}
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center">
                            <div className="spinner h-12 w-12"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {cbseBooks.length > 0 ? (
                                cbseBooks.map((book, index) => (
                                    <div key={book._id} className="animate-scale-in h-full" style={{ animationDelay: `${index * 0.1}s` }}>
                                        <BookCard book={book} />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-12">
                                    <div className="inline-flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                                        <BookOpen className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No materials found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">Check back later for new CBSE resources.</p>
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
                            Why Choose Our <span className="gradient-text">Board</span> Materials?
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Focused content designed to help you maximize your board exam score
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

export default Boards;
