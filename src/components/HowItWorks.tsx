import { UserPlus, Search, MessageCircle, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Download & Sign Up',
    description: 'Get the app and create your account in under 2 minutes.'
  },
  {
    icon: Search,
    title: 'Choose Your Category',
    description: 'Select from Legal, Mental Health, Career, or Medical services.'
  },
  {
    icon: MessageCircle,
    title: 'Connect Instantly',
    description: 'Skip the search or refine your needs, then connect via chat, call, or video.'
  },
  {
    icon: CheckCircle,
    title: 'Get Expert Help',
    description: 'Receive professional guidance and pay securely per session.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Four simple steps to connect with verified professionals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <step.icon className="text-white" size={32} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-emerald-300 to-transparent -ml-4"></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 sm:p-12 text-center text-white">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">Join thousands who skip the search and get answers instantly</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-emerald-600 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg">
              Download for iOS
            </button>
            <button className="px-8 py-4 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors font-semibold text-lg border-2 border-white/20">
              Download for Android
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
