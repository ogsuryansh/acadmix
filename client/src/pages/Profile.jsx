import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, BookOpen, Target, Award, Settings, Edit, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const stats = [
    { label: 'Books Read', value: '12', icon: BookOpen, color: 'text-blue-500' },
    { label: 'Tests Taken', value: '5', icon: Target, color: 'text-green-500' },
    { label: 'Achievements', value: '8', icon: Award, color: 'text-yellow-500' },
    { label: 'Days Active', value: '30', icon: Calendar, color: 'text-purple-500' },
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // Here you would typically make an API call to update user data
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please log in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-12 w-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and track your progress
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                  Account Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors duration-200"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors duration-200"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      {user.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <Mail className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      {user.email}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center text-gray-900 dark:text-white">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Learning Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Learning Progress
              </h3>
              <div className="space-y-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 mr-3`}>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800/30 transition-colors duration-200">
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Continue Reading
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors duration-200">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Take Practice Test
                  </div>
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors duration-200">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    View Achievements
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
