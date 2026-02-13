import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import qinexLogo from '@/assets/qinex.png'; // adjust path if needed

interface HeaderProps {
  user?: any;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* 🔹 Logo Section */}
          <div className="flex items-center">
            <img
              src={qinexLogo}
              alt="Qinex Kenya Logo"
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* 🔹 Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-gray-700 hover:text-black transition-colors font-medium">
              Services
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-black transition-colors font-medium">
              How It Works
            </a>
            <a href="#professionals" className="text-gray-700 hover:text-black transition-colors font-medium">
              For Professionals
            </a>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {user.username} ({user.role})
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button className="px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Get Started
              </button>
            )}
          </div>

          {/* 🔹 Mobile Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* 🔹 Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t">
            <a href="#services" className="block text-gray-700 hover:text-black font-medium">
              Services
            </a>
            <a href="#how-it-works" className="block text-gray-700 hover:text-black font-medium">
              How It Works
            </a>
            <a href="#professionals" className="block text-gray-700 hover:text-black font-medium">
              For Professionals
            </a>

            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {user.username} ({user.role})
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <button className="w-full px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                Get Started
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
