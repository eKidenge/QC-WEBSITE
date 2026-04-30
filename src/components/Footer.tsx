import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* MAIN GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

          {/* BRAND SECTION */}
          <div>
            <div className="flex items-center space-x-2 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <span className="text-xl font-bold text-white">
                QINEX Platform
              </span>
            </div>

            <p className="text-gray-400 mb-5 leading-relaxed">
              Your trusted cross-professional platform connecting users with verified experts across multiple fields including professional services, guidance, and support.
            </p>

            {/* SOCIALS */}
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* SERVICES */}
          <div>
            <h4 className="text-white font-semibold mb-5">Services</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Personal Guidance</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Professional Coaching</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Career Development</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Relationship Support</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Wellness & Support Services</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Business Consultation</a></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="text-white font-semibold mb-5">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">About QINEX</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Become a Professional</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Platform Guidelines</a></li>
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="text-white font-semibold mb-5">Contact</h4>

            <ul className="space-y-4">

              <li className="flex items-start gap-3">
                <Mail size={20} className="mt-0.5 text-indigo-400" />
                <span>support@qinex.com</span>
              </li>

              <li className="flex items-start gap-3">
                <Phone size={20} className="mt-0.5 text-indigo-400" />
                <span>+254 700 123 456</span>
              </li>

              <li className="flex items-start gap-3">
                <MapPin size={20} className="mt-0.5 text-indigo-400" />
                <span>Nairobi, Kenya</span>
              </li>

              <li className="flex items-start gap-3">
                <span className="text-indigo-400 font-semibold">24/7</span>
                <span>Platform Support Available</span>
              </li>

            </ul>
          </div>

        </div>

        {/* DIVIDER */}
        <div className="border-t border-gray-800 pt-8">

          <div className="flex flex-col md:flex-row justify-between items-center gap-5">

            <p className="text-gray-400 text-sm">
              &copy; 2025 QINEX KENYA / QINEX Platform. A cross-professional digital services platform.
            </p>

            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Cookies</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Security</a>
            </div>

          </div>

        </div>

      </div>

    </footer>
  );
}