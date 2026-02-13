import { Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  user?: any;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">QK</span>
            </div>
            <span className="text-xl font-bold text-gray-900">QINEX KENYA</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Services
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              How It Works
            </a>
            <a href="#professionals" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              For Professionals
            </a>
            
            {/* Show user info or login button */}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
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
              <button className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Download App
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t">
            <a href="#services" className="block text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Services
            </a>
            <a href="#how-it-works" className="block text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              How It Works
            </a>
            <a href="#professionals" className="block text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              For Professionals
            </a>
            
            {/* Mobile: Show user info or download app */}
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
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
              <button className="w-full px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
                Download App
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
