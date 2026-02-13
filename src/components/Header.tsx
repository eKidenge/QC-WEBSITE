import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import qinexLogo from '../assets/qinex.png';

interface HeaderProps {
  user?: any;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center h-20">

          {/* 🔹 Logo Section */}
          <div className="flex items-center space-x-4">
            <img
              src={qinexLogo}
              alt="Qinex Kenya Logo"
              className="h-12 w-auto object-contain"
            />
            <span className="text-lg font-semibold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-cyan-400 to-purple-500">
              QINEX KENYA
            </span>
          </div>

          {/* 🔹 Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">

            <a
              href="#services"
              className="text-gray-300 hover:text-cyan-400 transition-all duration-300 font-medium"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              className="text-gray-300 hover:text-purple-400 transition-all duration-300 font-medium"
            >
              How It Works
            </a>

            <a
              href="#professionals"
              className="text-gray-300 hover:text-yellow-400 transition-all duration-300 font-medium"
            >
              For Professionals
            </a>

            {user ? (
              <div className="flex items-center space-x-4">

                <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-lg">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-gray-200">
                    {user.username} ({user.role})
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-4 py-1.5 border border-red-500 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-medium text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>

              </div>
            ) : (
              <button className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 via-cyan-400 to-purple-500 text-black font-semibold hover:opacity-90 transition-all duration-300 shadow-lg">
                Get Started
              </button>
            )}

          </div>

          {/* 🔹 Mobile Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-300"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

        </div>

        {/* 🔹 Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-6 space-y-4 border-t border-gray-800 bg-black">

            <a
              href="#services"
              className="block text-gray-300 hover:text-cyan-400 font-medium"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              className="block text-gray-300 hover:text-purple-400 font-medium"
            >
              How It Works
            </a>

            <a
              href="#professionals"
              className="block text-gray-300 hover:text-yellow-400 font-medium"
            >
              For Professionals
            </a>

            {user ? (
              <div className="space-y-4">

                <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-gray-200">
                    {user.username} ({user.role})
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-medium text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>

              </div>
            ) : (
              <button className="w-full px-5 py-2 rounded-lg bg-gradient-to-r from-yellow-400 via-cyan-400 to-purple-500 text-black font-semibold hover:opacity-90 transition-all duration-300">
                Get Started
              </button>
            )}

          </div>
        )}

      </nav>
    </header>
  );
}
