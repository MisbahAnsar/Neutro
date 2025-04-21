import { Brain, Rocket, Target, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function HeroSection() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('neutroUserId');
    const token = localStorage.getItem('neutroToken');
    
    if (userId && token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 pt-12 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center gap-2 pb-8">
                <Leaf className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold">Nutri-Guide</h1>
            </div>
            <h2 className="text-5xl font-bold text-start leading-tight mb-6">
              Your Smart Companion for Personalized Diet Planning
            </h2>
            <p className="text-md text-start text-gray-600 mb-8">
              Powered by AI, Nutri-Guide crafts tailor-made meal plans to match your health goals, lifestyle, and dietary preferences—effortlessly and intelligently.
            </p>
            <div className="flex gap-4">
              {!isLoggedIn ? (
                // Show signup button for non-logged in users
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-8 py-3 bg-green-600 text-white rounded-full text-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Get Started
                </button>
              ) : (
                // Show dashboard button for logged in users
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 bg-green-600 text-white rounded-full text-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              )}
              
              {!isLoggedIn && (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 border-2 border-green-200 bg-green-50 rounded-full text-lg font-semibold text-green-700 hover:bg-green-100 transition-colors"
                >
                  View Demo
                </button>
              )}
              
              <button className="px-8 py-3 border-2 border-gray-200 rounded-full text-lg font-semibold hover:border-gray-300 transition-colors">
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <div 
              className="bg-green-100 rounded-2xl shadow-2xl w-full h-[400px] flex items-center justify-center"
            >
              <div className="text-center p-6">
                <Leaf className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <p className="text-xl font-semibold text-green-800">Healthy Eating</p>
                <p className="text-gray-600 mt-2">Fresh, nutritious meals for your wellness journey</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">AI-Powered</h3>
            <p className="text-gray-600">
              Advanced algorithms create personalized meal plans based on your unique needs and preferences.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <Rocket className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Health-First</h3>
            <p className="text-gray-600">
              Science-backed nutrition recommendations tailored to support your wellness journey.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Results-Driven</h3>
            <p className="text-gray-600">
              Track your progress and adjust your plan to achieve your health goals effectively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;