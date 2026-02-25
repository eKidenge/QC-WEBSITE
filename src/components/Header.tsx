import { Menu, X, User, LogOut, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import qinexLogo from '../assets/qinex.png';

interface HeaderProps {
  user?: any;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      // Hide the install button
      setIsInstallable(false);
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleGetStarted = () => {
    // Navigate to login/signup page
    navigate('/login');
  };

  const handleServicesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If on home page, scroll to services section
    if (window.location.pathname === '/') {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If on another page, navigate to home with hash
      navigate('/#services');
    }
  };

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If on home page, scroll to how it works section
    if (window.location.pathname === '/') {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If on another page, navigate to home with hash
      navigate('/#how-it-works');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center h-20">

          {/* 🔹 Logo Section - Make logo clickable to go home */}
          <div 
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => navigate('/')}
          >
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
              onClick={handleServicesClick}
              className="text-gray-300 hover:text-cyan-400 transition-all duration-300 font-medium cursor-pointer"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="text-gray-300 hover:text-purple-400 transition-all duration-300 font-medium cursor-pointer"
            >
              How It Works
            </a>

            {/* 🔹 Add to phone - PWA Installation Button */}
            {isInstallable && (
              <button
                onClick={handleInstallClick}
                className="text-gray-300 hover:text-yellow-400 transition-all duration-300 font-medium flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>Add to phone</span>
              </button>
            )}

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
              <button
                onClick={handleGetStarted}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-400 via-cyan-400 to-purple-500 text-black font-semibold hover:opacity-90 transition-all duration-300 shadow-lg cursor-pointer"
              >
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
              onClick={(e) => {
                handleServicesClick(e);
                setIsMenuOpen(false);
              }}
              className="block text-gray-300 hover:text-cyan-400 font-medium cursor-pointer"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              onClick={(e) => {
                handleHowItWorksClick(e);
                setIsMenuOpen(false);
              }}
              className="block text-gray-300 hover:text-purple-400 font-medium cursor-pointer"
            >
              How It Works
            </a>

            {/* 🔹 Mobile Add to phone */}
            {isInstallable && (
              <button
                onClick={() => {
                  handleInstallClick();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 text-gray-300 hover:text-yellow-400 font-medium"
              >
                <Download className="h-5 w-5" />
                <span>Add to phone</span>
              </button>
            )}

            {user ? (
              <div className="space-y-4">

                <div className="flex items-center space-x-2 bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-gray-200">
                    {user.username} ({user.role})
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (onLogout) onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-1 px-3 py-2 border border-red-500 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 font-medium text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>

              </div>
            ) : (
              <button
                onClick={() => {
                  handleGetStarted();
                  setIsMenuOpen(false);
                }}
                className="w-full px-5 py-2 rounded-lg bg-gradient-to-r from-yellow-400 via-cyan-400 to-purple-500 text-black font-semibold hover:opacity-90 transition-all duration-300 cursor-pointer"
              >
                Get Started
              </button>
            )}

          </div>
        )}

      </nav>
    </header>
  );
}