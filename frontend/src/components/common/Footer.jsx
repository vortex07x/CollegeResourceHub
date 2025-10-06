import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Send, Heart } from 'lucide-react';
import { useState } from 'react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const quickLinks = [
    { path: '/browse', label: 'Browse Files' },
    { path: '/my-files', label: 'My Files' },
    { path: '/profile', label: 'Profile' },
    { path: '/help', label: 'Help Center' },
    { path: '/guidelines', label: 'Community Guidelines' },
  ];

  const legalLinks = [
    { path: '/privacy', label: 'Privacy Policy' },
    { path: '/terms', label: 'Terms of Service' },
    { path: '/cookies', label: 'Cookie Policy' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'Facebook', color: 'hover:bg-blue-600' },
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter', color: 'hover:bg-sky-500' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram', color: 'hover:bg-pink-600' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn', color: 'hover:bg-blue-700' },
  ];

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16">
          {/* Column 1: Brand & About */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-white mb-4 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">College Hub</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Your centralized platform for sharing and accessing academic resources. 
              Empowering students to collaborate and succeed together.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-10 h-10 flex items-center justify-center bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-400 ${social.color} hover:border-transparent hover:text-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-base font-semibold text-white mb-6 tracking-wide uppercase text-xs">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 hover:text-purple-400 hover:translate-x-1 transition-all duration-300 inline-flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-purple-400 group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-base font-semibold text-white mb-6 tracking-wide uppercase text-xs">
              Contact Us
            </h3>
            <div className="space-y-4">
              <a 
                href="mailto:support@collegehub.com"
                className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <Mail size={18} className="text-purple-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>support@collegehub.com</span>
              </a>
              <a 
                href="tel:+12345678900"
                className="flex items-start gap-3 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <Phone size={18} className="text-purple-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span>+1 234 567 8900</span>
              </a>
              <div className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin size={18} className="text-purple-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">
                  123 Campus Drive<br />
                  University City, ST 12345
                </span>
              </div>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h3 className="text-base font-semibold text-white mb-6 tracking-wide uppercase text-xs">
              Stay Updated
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe to get updates on new resources and features.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-11 px-4 bg-[#1A1A1A] border border-white/10 rounded-lg text-white text-sm placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Subscribe
              </button>
              {subscribed && (
                <p className="text-xs text-green-400 flex items-center gap-1 animate-fade-in">
                  <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  Successfully subscribed!
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500 text-center sm:text-left flex items-center gap-2">
              © 2025 
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-semibold">College Hub</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> for students
              </span>
            </p>

            {/* Legal Links */}
            <div className="flex gap-6">
              {legalLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm text-gray-500 hover:text-purple-400 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-purple-400 hover:after:w-full after:transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;