import './App.css'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import HeroSection from './components/HeroSection'
import RegistrationForm from './components/RegistrationForm'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Dashboard from './components/Dashboard'
import Navbar from './components/Navbar'
import MotivationalQuotes from './components/MotivationalQuotes' // 👈 import this

// Wrapper component to conditionally render the Navbar
function AppContent() {
  const location = useLocation();
  const showNavbar = location.pathname !== '/dashboard';
  // const showQuotes = location.pathname !== '/dashboard'; // 👈 optional: hide on dashboard

  return (
    <>
      {showNavbar && <Navbar />}
      {<MotivationalQuotes />} {/* 👈 here’s the magic */}
      <Routes>
        <Route path="/" element={<HeroSection />} />
        <Route path="/register" element={<RegistrationForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App;
