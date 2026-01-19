import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Target,
  GraduationCap,
  Shield,
  FileText,
  MessageCircle
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Class 11', href: '/class11' },
    { name: 'Class 12', href: '/class12' },
    { name: 'My Books', href: '/my-books' },
    { name: 'Login', href: '/login' },
    { name: 'Register', href: '/register' },
  ];

  const studyMaterials = [
    { name: 'NEET Preparation', href: '/class11?category=NEET' },
    { name: 'JEE Preparation', href: '/class11?category=JEE' },
    { name: 'Physics', href: '/class11?subject=physics' },
    { name: 'Chemistry', href: '/class11?subject=chemistry' },
    { name: 'Biology', href: '/class11?subject=biology' },
    { name: 'Mathematics', href: '/class11?subject=mathematics' },
  ];

  const support = [
    { name: 'Help Center', href: '/help' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Refund Policy', href: '/refund' },
    { name: 'FAQ', href: '/faq' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold">Acadmix</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted partner for NEET & JEE preparation. Access comprehensive study materials,
              practice tests, and expert guidance to excel in your entrance exams.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Study Materials */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              Study Materials
            </h3>
            <ul className="space-y-2">
              {studyMaterials.map((material) => (
                <li key={material.name}>
                  <Link
                    to={material.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {material.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Contact & Support
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href="mailto:acadmixlord@gmail.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                  acadmixlord@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href="https://wa.me/212780729301" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  +212 780729301 (WhatsApp)
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-gray-400" />
                <a href="https://t.me/preachify" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  @preachify (Telegram)
                </a>
              </div>
            </div>
            <div className="pt-2">
              <ul className="space-y-2">
                {support.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {currentYear} Acadmix. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/refund" className="text-gray-400 hover:text-white transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
