import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bmi: '',
    dietType: '',
    fitnessGoal: '',
    restrictionsAndAllergies: '',
    mealsPerDay: '',
    planDuration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('neutroToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Try to fetch existing user data
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.user) {
          const userData = response.data.user;
          
          // If user already has a completed profile, pre-fill the form
          if (userData.profileCompleted) {
            setIsUpdate(true);
            
            // Pre-fill form with existing user data
            setFormData({
              name: userData.name || '',
              age: userData.age ? String(userData.age) : '',
              gender: userData.gender || '',
              height: userData.height ? String(userData.height) : '',
              weight: userData.weight ? String(userData.weight) : '',
              bmi: userData.bmi ? String(userData.bmi) : '',
              dietType: userData.dietType || '',
              fitnessGoal: userData.fitnessGoal || '',
              restrictionsAndAllergies: userData.restrictionsAndAllergies?.join(', ') || '',
              mealsPerDay: userData.mealsPerDay ? String(userData.mealsPerDay) : '',
              planDuration: userData.planDuration ? String(userData.planDuration) : ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error, we'll just continue with an empty form
      }
    };
    
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (formData.height && formData.weight) {
      const heightInMeters = Number(formData.height) / 100;
      const weightInKg = Number(formData.weight);
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      setFormData(prev => ({ ...prev, bmi: bmi.toFixed(2) }));
    }
  }, [formData.height, formData.weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Make sure all required fields are filled
      const requiredFields = ['name', 'age', 'gender', 'height', 'weight', 'bmi', 'dietType', 'fitnessGoal', 'mealsPerDay', 'planDuration'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      const dataToSend = {
        ...formData,
        restrictionsAndAllergies: formData.restrictionsAndAllergies ? 
          formData.restrictionsAndAllergies.split(',').map(item => item.trim()) : [],
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        bmi: Number(formData.bmi),
        mealsPerDay: Number(formData.mealsPerDay),
        planDuration: Number(formData.planDuration)
      };
      
      // Log the data being sent for debugging
      console.log('Sending data:', dataToSend);
      
      const token = localStorage.getItem('neutroToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Use the update profile endpoint to update existing user
      const response = await axios.post('http://localhost:3000/api/users/update-profile', dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Response:', response.data);
      
      // Navigate to dashboard
      setError('');
      alert(isUpdate ? 'Profile updated successfully!' : 'Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      setError(`Failed: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">
          {isUpdate ? 'Update Your Profile' : 'Complete Registration'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                id="age"
                name="age"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.age}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                id="gender"
                name="gender"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700">Height (cm)</label>
              <input
                type="number"
                id="height"
                name="height"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.height}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                required
                min="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.weight}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="bmi" className="block text-sm font-medium text-gray-700">BMI</label>
              <input
                type="text"
                id="bmi"
                name="bmi"
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                value={formData.bmi}
              />
            </div>
          </div>

          <div>
            <label htmlFor="dietType" className="block text-sm font-medium text-gray-700">Diet Type</label>
            <select
              id="dietType"
              name="dietType"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.dietType}
              onChange={handleChange}
            >
              <option value="">Select diet type</option>
              <option value="veg">Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>

          <div>
            <label htmlFor="fitnessGoal" className="block text-sm font-medium text-gray-700">Fitness Goal</label>
            <select
              id="fitnessGoal"
              name="fitnessGoal"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.fitnessGoal}
              onChange={handleChange}
            >
              <option value="">Select fitness goal</option>
              <option value="weight-loss">Weight Loss</option>
              <option value="weight-gain">Weight Gain</option>
              <option value="muscle-building">Muscle Building</option>
            </select>
          </div>

          <div>
            <label htmlFor="restrictionsAndAllergies" className="block text-sm font-medium text-gray-700">
              Restrictions & Allergies (comma-separated)
            </label>
            <textarea
              id="restrictionsAndAllergies"
              name="restrictionsAndAllergies"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.restrictionsAndAllergies}
              onChange={handleChange}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mealsPerDay" className="block text-sm font-medium text-gray-700">Meals per Day</label>
              <input
                type="number"
                id="mealsPerDay"
                name="mealsPerDay"
                required
                min="2"
                max="6"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.mealsPerDay}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="planDuration" className="block text-sm font-medium text-gray-700">Plan Duration (days)</label>
              <input
                type="number"
                id="planDuration"
                name="planDuration"
                required
                min="3"
                max="60"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                value={formData.planDuration}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-full text-lg font-semibold text-white ${
              loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
            } transition-colors`}
          >
            {loading ? 'Processing...' : (isUpdate ? 'Update Profile' : 'Complete Registration')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegistrationForm;