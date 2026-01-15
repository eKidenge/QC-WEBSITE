import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CallPage from './pages/CallPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import PaymentPage from './components/PaymentPage';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import AdminDashboard from './components/AdminDashboard';

// --- Protected Homepage for logged-in users ---
function ProtectedHomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={handleLogout} />
      <Hero />
      <Services />
      <HowItWorks />
      <Footer />
    </div>
  );
}

// --- Public Homepage for visitors & Googlebot ---
function PublicHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header /> {/* no user required */}
      <Hero />
      <Services />
      <HowItWorks />
      <Footer />
    </div>
  );
}

// --- Authentication helpers ---
function isLoggedIn() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
}

function isProfessional() {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const userData = JSON.parse(user);
    return userData.role === 'professional' || userData.user_type === 'professional';
  } catch (e) { return false; }
}

function isAdmin() {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const userData = JSON.parse(user);
    return userData.role === 'admin' || userData.user_type === 'admin';
  } catch (e) { return false; }
}

// --- App Component with clean routing ---
function App() {
  return (
    <Router>
      <Routes>
        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root "/" - public for visitors, protected for logged-in users */}
        <Route path="/" element={
          isLoggedIn() ? <ProtectedHomePage /> : <PublicHomePage />
        } />

        {/* Professional Dashboard */}
        <Route path="/professional/dashboard" element={
          isLoggedIn() && isProfessional() ?
            <ProfessionalDashboard /> :
            <Navigate to="/login" />
        } />

        {/* Admin Dashboard & sub-routes */}
        <Route path="/admin/*" element={
          isLoggedIn() && isAdmin() ?
            <AdminDashboard /> :
            <Navigate to="/login" />
        } />

        {/* Call Page */}
        <Route path="/call" element={
          isLoggedIn() ? <CallPage /> : <Navigate to="/login" />
        } />

        {/* Payment Pages */}
        <Route path="/payment" element={
          isLoggedIn() ? <PaymentPage /> : <Navigate to="/login" />
        } />
        <Route path="/payment-success" element={
          isLoggedIn() ? <PaymentSuccessPage /> : <Navigate to="/login" />
        } />

        {/* Fallback for all other paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
