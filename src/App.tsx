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
import AdminDashboard from './components/AdminDashboard'; // Import the Admin Dashboard

// Protected Homepage - only shows if logged in
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

// Check if user is logged in
function isLoggedIn() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
}

// Check if user is a professional - FIXED to check both fields
function isProfessional() {
  const user = localStorage.getItem('user');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    // Check both possible field names
    return userData.role === 'professional' || userData.user_type === 'professional';
  } catch (e) {
    return false;
  }
}

// Check if user is a client - FIXED to check both fields
function isClient() {
  const user = localStorage.getItem('user');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    // Check both possible field names
    return userData.role === 'client' || userData.user_type === 'client';
  } catch (e) {
    return false;
  }
}

// Check if user is an admin - NEW function
function isAdmin() {
  const user = localStorage.getItem('user');
  if (!user) return false;
  
  try {
    const userData = JSON.parse(user);
    // Check both possible field names
    return userData.role === 'admin' || userData.user_type === 'admin';
  } catch (e) {
    return false;
  }
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Page - accessible to everyone */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Root path "/" - Shows HomePage if logged in, redirects to login if not */}
        <Route path="/" element={
          isLoggedIn() ? <ProtectedHomePage /> : <Navigate to="/login" />
        } />
        
        {/* Professional Dashboard - only accessible by professionals */}
        <Route path="/professional/dashboard" element={
          isLoggedIn() && isProfessional() ? 
            <ProfessionalDashboard /> : 
            <Navigate to="/login" />
        } />
        
        {/* Admin Dashboard - only accessible by admins */}
        <Route path="/admin" element={
          isLoggedIn() && isAdmin() ? 
            <AdminDashboard /> : 
            <Navigate to="/login" />
        } />
        
        {/* Admin sub-routes - all protected by admin check */}
        <Route path="/admin/*" element={
          isLoggedIn() && isAdmin() ? 
            <AdminDashboard /> : 
            <Navigate to="/login" />
        } />
        
        {/* Call page - protected, requires login */}
        <Route path="/call" element={
          isLoggedIn() ? <CallPage /> : <Navigate to="/login" />
        } />
        
        {/* Payment routes - protected, requires login */}
        <Route path="/payment" element={
          isLoggedIn() ? <PaymentPage /> : <Navigate to="/login" />
        } />
        <Route path="/payment-success" element={
          isLoggedIn() ? <PaymentSuccessPage /> : <Navigate to="/login" />
        } />
        
        {/* Redirect all other paths */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
