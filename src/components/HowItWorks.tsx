import { UserPlus, Search, MessageCircle, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Sign Up',
    description: 'Create your account in under 2 minutes to get started.'
  },
  {
    icon: Search,
    title: 'Find Your Therapist',
    description: 'Browse licensed mental health professionals specialized in your needs.'
  },
  {
    icon: MessageCircle,
    title: 'Connect Instantly',
    description: 'Start a confidential chat, call, or video session with your chosen therapist.'
  },
  {
    icon: CheckCircle,
    title: 'Get Mental Health Support',
    description: 'Receive professional guidance and pay securely per session.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-pink-500/10 text-pink-600 rounded-full text-sm font-medium border border-pink-200 mb-4">
            Mental Health Focus
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start your journey to better mental health in four simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <step.icon className="text-white" size={32} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                    {index + 1}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-pink-300 to-transparent -ml-4"></div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-8 sm:p-12 text-center text-white">
          <h3 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Start Your Mental Health Journey?</h3>
          <p className="text-xl mb-8 opacity-90">Connect with licensed therapists who understand your needs</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="relative inline-block">
              <button className="px-8 py-4 bg-white text-pink-600 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg shadow-lg opacity-75 cursor-not-allowed">
                Download for iOS
              </button>
              <span className="absolute -top-3 -right-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                COMING SOON
              </span>
            </div>
            <div className="relative inline-block">
              <button className="px-8 py-4 bg-pink-700 text-white rounded-xl hover:bg-pink-800 transition-colors font-semibold text-lg border-2 border-white/20 opacity-75 cursor-not-allowed">
                Download for Android
              </button>
              <span className="absolute -top-3 -right-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                COMING SOON
              </span>
            </div>
          </div>
          <p className="text-sm mt-6 text-pink-100">
            We're working hard to bring the app to you. Stay tuned!
          </p>
        </div>
      </div>
    </section>
  );
}