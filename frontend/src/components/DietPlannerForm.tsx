import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ActivitySquare, Scale, Ruler, UserCircle2, Calendar, Target, Dumbbell, ArrowRight } from 'lucide-react';

// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

interface DietPlannerFormProps {
  onPlanGenerated: (planData: any) => void;
}

const DietPlannerForm: React.FC<DietPlannerFormProps> = ({ onPlanGenerated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activityLevel: 'moderately-active',
    goal: 'weight-loss',
    planDuration: '7'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  // Fetch user profile data to pre-fill the form
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('neutroToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const profile = response.data;
        
        // Only pre-fill if the profile contains the necessary data
        if (profile && profile.age && profile.weight && profile.height) {
          setUserProfile(profile);
          
          setFormData(prev => ({
            ...prev,
            age: profile.age.toString(),
            weight: profile.weight.toString(),
            height: profile.height.toString(),
            gender: profile.gender || prev.gender
          }));
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        // Just continue with empty form, don't show error
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Clear error when user starts typing
    if (error) setError('');
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');
    
    if (currentStep === 1) {
      if (!formData.age) {
        setError('Please enter your age');
        return false;
      }
      if (!formData.weight) {
        setError('Please enter your weight');
        return false;
      }
      if (!formData.height) {
        setError('Please enter your height');
        return false;
      }
      
      // Additional validation for ranges
      const age = parseInt(formData.age);
      const weight = parseInt(formData.weight);
      const height = parseInt(formData.height);
      
      if (age < 18 || age > 100) {
        setError('Age must be between 18 and 100 years');
        return false;
      }
      
      if (weight < 30 || weight > 250) {
        setError('Weight must be between 30 and 250 kg');
        return false;
      }
      
      if (height < 100 || height > 250) {
        setError('Height must be between 100 and 250 cm');
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    if (!validateStep(step)) return;
    
    setLoading(true);
    setError('');
    setStatusMessage('Generating your personalized meal plan... This may take a moment.');

    try {
      // Convert string values to numbers
      const dietPlanParams = {
        age: parseInt(formData.age),
        weight: parseInt(formData.weight),
        height: parseInt(formData.height),
        gender: formData.gender,
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        planDuration: parseInt(formData.planDuration)
      };

      // Get token from localStorage
      const token = localStorage.getItem('neutroToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Make API request to generate diet plan
      const response = await axios.post(
        `${API_BASE_URL}/diet-plans`,
        dietPlanParams,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 120000 // 120 second timeout (increased for more complex plans)
        }
      );

      // Clear the status message
      setStatusMessage('');

      // Call the callback with the generated plan
      if (response.data && response.data.dietPlan) {
        onPlanGenerated(response.data.dietPlan);
      } else {
        setError('Received an invalid response from the server. Please try again.');
      }
    } catch (err: any) {
      console.error('Error generating diet plan:', err);
      setStatusMessage('');
      
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timed out. The server might be busy processing your plan. Please try again later.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 429) {
        setError('You have made too many requests. Please wait a while before trying again.');
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to generate diet plan. Please try again later.';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <UserCircle2 className="mr-2 h-6 w-6 text-teal-600" />
                Physical Details
              </h2>
              <p className="mt-1 text-gray-500">
                Let's start with your basic physical information
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="age" className="flex items-center text-sm font-medium text-gray-700">
                    <Calendar className="mr-2 h-4 w-4 text-teal-500" />
                    Age (years) <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="18"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <p className="text-xs text-gray-500">Between 18 and 100 years</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="weight" className="flex items-center text-sm font-medium text-gray-700">
                    <Scale className="mr-2 h-4 w-4 text-teal-500" />
                    Weight (kg) <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    min="30"
                    max="250"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <p className="text-xs text-gray-500">Between 30 and 250 kg</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="height" className="flex items-center text-sm font-medium text-gray-700">
                    <Ruler className="mr-2 h-4 w-4 text-teal-500" />
                    Height (cm) <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    min="100"
                    max="250"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <p className="text-xs text-gray-500">Between 100 and 250 cm</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="gender" className="flex items-center text-sm font-medium text-gray-700">
                    <UserCircle2 className="mr-2 h-4 w-4 text-teal-500" />
                    Gender <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="button"
                onClick={nextStep}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Dumbbell className="mr-2 h-6 w-6 text-teal-600" />
                Fitness & Goals
              </h2>
              <p className="mt-1 text-gray-500">
                Tell us about your activity level and nutritional goals
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="activityLevel" className="flex items-center text-sm font-medium text-gray-700">
                    <ActivitySquare className="mr-2 h-4 w-4 text-teal-500" />
                    Activity Level <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="activityLevel"
                    name="activityLevel"
                    value={formData.activityLevel}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="sedentary">Sedentary (little or no exercise)</option>
                    <option value="lightly-active">Lightly Active (1-3 days/week)</option>
                    <option value="moderately-active">Moderately Active (3-5 days/week)</option>
                    <option value="very-active">Very Active (6-7 days/week)</option>
                    <option value="extra-active">Extra Active (very active + physical job)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="goal" className="flex items-center text-sm font-medium text-gray-700">
                    <Target className="mr-2 h-4 w-4 text-teal-500" />
                    Goal <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="goal"
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="weight-loss">Weight Loss</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="weight-gain">Weight Gain</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="planDuration" className="flex items-center text-sm font-medium text-gray-700">
                    <Calendar className="mr-2 h-4 w-4 text-teal-500" />
                    Plan Duration <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="planDuration"
                    name="planDuration"
                    value={formData.planDuration}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="21">21 days</option>
                    <option value="30">30 days</option>
                  </select>
                  <p className="text-xs text-gray-500">Longer plans may take more time to generate</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <button 
                type="button"
                onClick={prevStep} 
                className="border border-teal-500 text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-md transition-colors"
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={loading}
                className={`bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md transition-colors ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Generating Plan...' : 'Generate Diet Plan'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto border rounded-lg shadow-lg bg-white">
      {/* Error message */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
          <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Status/loading message */}
      {statusMessage && (
        <div className="mx-6 mt-6 p-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg flex items-center justify-between">
          <span>{statusMessage}</span>
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-teal-600"></div>
        </div>
      )}
      
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-teal-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">Step {step} of {totalSteps}</p>
      </div>
      
      {/* Form content */}
      <div className="p-6">
        <form onSubmit={handleSubmit}>
          {renderStepContent()}
        </form>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          Your data is securely processed to create a personalized nutrition plan tailored to your specific needs.
          <br />
          <span className="text-red-500">*</span> Required fields
        </p>
      </div>
    </div>
  );
};

export default DietPlannerForm;
