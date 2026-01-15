import Header from './Header';
import Hero from './Hero';
import Services from './Services';
import HowItWorks from './HowItWorks';
import Footer from './Footer';

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header user={null} onLogout={() => {}} />
      <Hero />
      <Services />
      <HowItWorks />
      <Footer />
    </div>
  );
}
