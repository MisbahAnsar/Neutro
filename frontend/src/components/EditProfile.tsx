import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  name: string;
  email: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  dietType: string;
  fitnessGoal: string;
  mealsPerDay: number;
  planDuration: number;
  restrictionsAndAllergies: string[] | string;
}

const EditProfile = () => {
  const [formData, setFormData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    axios.get<{ user: User }>('http://localhost:3000/api/auth/profile')
      .then(res => {
        setFormData(res.data.user);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      const response = await axios.post('http://localhost:3000/api/users/update-profile', {
        ...formData,
        restrictionsAndAllergies: typeof formData.restrictionsAndAllergies === 'string'
          ? formData.restrictionsAndAllergies
          : formData.restrictionsAndAllergies.join(', ')
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setMessage('Profile updated successfully!');
      console.log(response.data);
    } catch (err: any) {
      setMessage(`Error updating profile: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;
  if (!formData) return <p className="text-center mt-10 text-gray-500">Failed to load profile.</p>;

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white">
      <h2 className="text-xl font-semibold text-gray-700 mb-6">Edit Profile</h2>

      {message && (
        <div className={`mb-4 text-sm p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Name</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Email</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Age</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="age" 
                type="number" 
                value={formData.age} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Gender</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="gender" 
                value={formData.gender} 
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Height (cm)</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="height" 
                type="number" 
                value={formData.height} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Weight (kg)</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="weight" 
                type="number" 
                value={formData.weight} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Diet Type</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="dietType" 
                value={formData.dietType} 
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Fitness Goal</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="fitnessGoal" 
                value={formData.fitnessGoal} 
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="weight-gain">Weight Gain</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">Meals/Day</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="mealsPerDay" 
                type="number" 
                value={formData.mealsPerDay} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Plan Duration (days)</label>
              <input 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                name="planDuration" 
                type="number" 
                value={formData.planDuration} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">Restrictions/Allergies</label>
            <input 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
              name="restrictionsAndAllergies" 
              value={
                typeof formData.restrictionsAndAllergies === 'string'
                  ? formData.restrictionsAndAllergies
                  : formData.restrictionsAndAllergies.join(', ')
              } 
              onChange={handleChange} 
              placeholder="Comma separated list"
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default EditProfile;