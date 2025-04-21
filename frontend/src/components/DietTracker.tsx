import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Utensils, Calendar, Loader, RefreshCcw, CheckCircle, XCircle, ChevronRight, Award, Activity, TrendingUp } from 'lucide-react';

// Constants for API configuration
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 15000; // 15 seconds

interface DietTracker {
  _id: string;
  userId: string;
  dietPlanId: string;
  startDate: string;
  status: 'active' | 'completed' | 'abandoned';
  currentDay: number;
  totalDays: number;
  overallCompletionPercentage: number;
  streak: number;
  adherenceScore: number;
  dailyTrackers: Array<{
    _id: string;
    date: string;
    dayNumber: number;
    completedMeals: number;
    totalMeals: number;
    completionPercentage: number;
    caloriesConsumed: number;
    targetCalories: number;
    nutrition: {
      protein: {
        consumed: number;
        target: number;
      };
      carbs: {
        consumed: number;
        target: number;
      };
      fat: {
        consumed: number;
        target: number;
      };
    };
  }>;
}

interface CurrentDayPlan {
  dayNumber: number;
  meals: Array<{
    _id: string;
    type: string;
    dishName: string;
    description: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    eaten: boolean;
  }>;
}

const DietTrackerComponent: React.FC = () => {
  const navigate = useNavigate();
  const [dietTracker, setDietTracker] = useState<DietTracker | null>(null);
  const [currentDayPlan, setCurrentDayPlan] = useState<CurrentDayPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingTracker, setIsCreatingTracker] = useState<boolean>(false);

  useEffect(() => {
    // Check for token
    const token = localStorage.getItem('neutroToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch active diet tracker
    fetchActiveDietTracker();
  }, [navigate]);

  const fetchActiveDietTracker = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      const response = await axios.get(`${API_BASE_URL}/diet-trackers/active`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      setDietTracker(response.data.dietTracker);
      setCurrentDayPlan(response.data.currentDayPlan);
      setSelectedDay(response.data.dietTracker.currentDay);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        // No active tracker found
        console.log('No active diet tracker found');
        setDietTracker(null);
        setCurrentDayPlan(null);
        // We'll show option to create a tracker
      } else {
        handleApiError(err, 'Error fetching active diet tracker');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDayPlanDetails = async (dayNumber: number) => {
    if (!dietTracker) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      // First get the day details from the diet plan
      const response = await axios.get(`${API_BASE_URL}/diet-plans/days/${dayNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      setCurrentDayPlan(response.data.day);
      setSelectedDay(dayNumber);
    } catch (err: any) {
      handleApiError(err, `Error fetching day ${dayNumber} details`);
    } finally {
      setLoading(false);
    }
  };

  const createTrackerForLatestPlan = async () => {
    setIsCreatingTracker(true);
    setError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      // First get the latest diet plan
      const planResponse = await axios.get(`${API_BASE_URL}/diet-plans/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      const dietPlanId = planResponse.data._id;
      
      // Create a tracker for this plan
      const trackerResponse = await axios.post(
        `${API_BASE_URL}/diet-trackers`,
        { dietPlanId },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: API_TIMEOUT
        }
      );
      
      setDietTracker(trackerResponse.data.dietTracker);
      setSuccessMessage('Diet tracker created successfully!');
      
      // Get the day 1 details
      await fetchDayPlanDetails(1);
    } catch (err: any) {
      handleApiError(err, 'Error creating diet tracker');
    } finally {
      setIsCreatingTracker(false);
    }
  };

  const handleMealStatusUpdate = async (mealId: string, eaten: boolean) => {
    if (!dietTracker || !currentDayPlan) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      // Update the local state with the updated meal status immediately for better UX
      setCurrentDayPlan(prevDayPlan => {
        if (!prevDayPlan) return null;
        
        const updatedMeals = prevDayPlan.meals.map(meal => {
          if (meal._id === mealId) {
            return { ...meal, eaten };
          }
          return meal;
        });
        
        return {
          ...prevDayPlan,
          meals: updatedMeals
        };
      });
      
      setSuccessMessage(`Meal marked as ${eaten ? 'eaten' : 'not eaten'}. Don't forget to submit!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      handleApiError(err, 'Error updating meal status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const submitDailyProgress = async () => {
    if (!dietTracker || !currentDayPlan) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      // Process each meal in the current day for the tracker
      const mealUpdates = [];
      
      for (const meal of currentDayPlan.meals) {
        mealUpdates.push(
          axios.post(
            `${API_BASE_URL}/diet-trackers/track-meal`,
            {
              trackerId: dietTracker._id,
              dayNumber: currentDayPlan.dayNumber,
              mealId: meal._id,
              eaten: meal.eaten
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: API_TIMEOUT
            }
          )
        );
      }
      
      // Execute all meal updates
      const results = await Promise.all(mealUpdates);
      const lastResult = results[results.length - 1].data;
      
      // Update the tracker with new adherence metrics from the last response
      setDietTracker(prevTracker => {
        if (!prevTracker) return null;
        
        return {
          ...prevTracker,
          overallCompletionPercentage: lastResult.dietTracker.overallCompletionPercentage,
          streak: lastResult.dietTracker.streak,
          adherenceScore: lastResult.dietTracker.adherenceScore,
          dailyTrackers: lastResult.dietTracker.dailyTrackers
        };
      });
      
      setSuccessMessage('Daily progress saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      handleApiError(err, 'Error submitting daily progress');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleApiError = (err: any, defaultMsg: string) => {
    console.error(defaultMsg, err);
    
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      setError('Request timed out. Please try again.');
      return;
    }
    
    if (err.response) {
      const status = err.response.status;
      const errorData = err.response.data;
      
      if (status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      if (errorData.error?.details) {
        setError(errorData.error.details);
      } else if (errorData.message) {
        setError(errorData.message);
      } else {
        setError(defaultMsg);
      }
    } else if (err.request) {
      setError('No response from server. Please check your internet connection.');
    } else {
      setError(err.message || defaultMsg);
    }
  };

  // Calculate the completion percentages for a day's nutrition
  const getDailyNutritionProgress = (dayTracker: DietTracker['dailyTrackers'][0]) => {
    return {
      calories: Math.round((dayTracker.caloriesConsumed / dayTracker.targetCalories) * 100),
      protein: Math.round((dayTracker.nutrition.protein.consumed / dayTracker.nutrition.protein.target) * 100),
      carbs: Math.round((dayTracker.nutrition.carbs.consumed / dayTracker.nutrition.carbs.target) * 100),
      fat: Math.round((dayTracker.nutrition.fat.consumed / dayTracker.nutrition.fat.target) * 100)
    };
  };

  const getCurrentDayTracker = () => {
    if (!dietTracker || !selectedDay || !currentDayPlan) return null;
    
    // Find the corresponding day tracker
    const dayTracker = dietTracker.dailyTrackers.find(dt => dt.dayNumber === selectedDay);
    
    if (dayTracker) {
      return dayTracker;
    }
    
    // If no day tracker exists yet for this day, return a placeholder with default values
    return {
      _id: '',
      date: new Date().toISOString(),
      dayNumber: selectedDay,
      completedMeals: 0,
      totalMeals: currentDayPlan.meals.length,
      completionPercentage: 0,
      caloriesConsumed: 0,
      targetCalories: 0,
      nutrition: {
        protein: { consumed: 0, target: 0 },
        carbs: { consumed: 0, target: 0 },
        fat: { consumed: 0, target: 0 }
      }
    };
  };
  
  // Helper function to get status color
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your diet tracker...</p>
        </div>
      </div>
    );
  }

  // No active tracker - offer to create one
  if (!dietTracker) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <Activity className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Track Your Diet Progress</h2>
          <p className="text-gray-600 mb-6">
            You don't have an active diet tracker. Create a tracker to monitor your progress and adherence to your meal plan.
          </p>
          
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <button
            onClick={createTrackerForLatestPlan}
            disabled={isCreatingTracker}
            className={`px-6 py-3 rounded-md text-white font-medium ${
              isCreatingTracker ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
            } transition-colors flex items-center mx-auto`}
          >
            {isCreatingTracker ? (
              <>
                <Loader className="animate-spin mr-2 h-5 w-5" />
                Creating Tracker...
              </>
            ) : (
              <>
                Start Tracking My Diet
                <ChevronRight className="ml-1 h-5 w-5" />
              </>
            )}
          </button>
          
          <p className="mt-4 text-sm text-gray-500">
            This will create a tracker for your latest diet plan. You need to have an active diet plan first.
          </p>
        </div>
      </div>
    );
  }

  const currentDayTracker = getCurrentDayTracker();
  
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Diet Tracker
        </h1>
        <p className="text-green-100">
          Track your meals and monitor your progress
        </p>
        
        {/* Progress metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center text-white mb-1">
              <Award className="h-5 w-5 mr-2" />
              <span className="font-medium">Adherence Score</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {dietTracker.adherenceScore}/100
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center text-white mb-1">
              <TrendingUp className="h-5 w-5 mr-2" />
              <span className="font-medium">Overall Completion</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {dietTracker.overallCompletionPercentage}%
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center text-white mb-1">
              <Activity className="h-5 w-5 mr-2" />
              <span className="font-medium">Current Streak</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {dietTracker.streak} {dietTracker.streak === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>
        
        {/* Day selector */}
        <div className="mt-6 overflow-x-auto">
          <div className="flex space-x-2 pb-2 scrollbar-hide">
            {Array.from({ length: dietTracker.totalDays }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                onClick={() => fetchDayPlanDetails(day)}
                className={`px-4 py-2 rounded-md flex items-center transition-all ${
                  selectedDay === day
                    ? 'bg-white text-teal-600 font-medium shadow-md'
                    : 'bg-teal-600/20 hover:bg-teal-600/30 text-white'
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Day {day}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg shadow-sm flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {/* Main content */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <Loader className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading your meal data...</p>
          </div>
        ) : currentDayPlan ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-500" />
                Day {currentDayPlan.dayNumber} Meal Plan
              </h2>
              
              {currentDayTracker && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                  {currentDayTracker.completionPercentage}% Complete
                </span>
              )}
            </div>
            
            {/* Nutrition progress for the day */}
            {currentDayTracker && (
              <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Daily Nutrition Progress</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Calories</span>
                      <span className="text-sm font-medium text-gray-700">
                        {currentDayTracker.caloriesConsumed} / {currentDayTracker.targetCalories} kcal
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${getStatusColor(getDailyNutritionProgress(currentDayTracker).calories)}`} 
                        style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).calories, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Protein</span>
                        <span className="text-sm font-medium text-gray-700">
                          {currentDayTracker.nutrition.protein.consumed}g / {currentDayTracker.nutrition.protein.target}g
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-blue-600" 
                          style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).protein, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Carbs</span>
                        <span className="text-sm font-medium text-gray-700">
                          {currentDayTracker.nutrition.carbs.consumed}g / {currentDayTracker.nutrition.carbs.target}g
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-yellow-500" 
                          style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).carbs, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Fat</span>
                        <span className="text-sm font-medium text-gray-700">
                          {currentDayTracker.nutrition.fat.consumed}g / {currentDayTracker.nutrition.fat.target}g
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="h-2.5 rounded-full bg-green-600" 
                          style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).fat, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Meals list */}
            <div className="space-y-4">
              {currentDayPlan.meals.map((meal) => (
                <div key={meal._id} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                    <h3 className="font-medium text-gray-800 flex items-center">
                      <Utensils className="h-4 w-4 mr-2 text-green-500" />
                      {meal.type}
                    </h3>
                    <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {meal.nutrition.calories} kcal
                    </span>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-lg mb-2 text-gray-800">{meal.dishName}</h4>
                      <div className="flex">
                        <button
                          onClick={() => handleMealStatusUpdate(meal._id, true)}
                          disabled={updateLoading || meal.eaten === true}
                          className={`p-2 rounded-full mr-1 ${
                            meal.eaten === true
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600'
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleMealStatusUpdate(meal._id, false)}
                          disabled={updateLoading || meal.eaten === false}
                          className={`p-2 rounded-full ${
                            meal.eaten === false
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600'
                          }`}
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm">{meal.description}</p>
                    
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-100">
                        <span className="block text-xs font-medium text-blue-700 mb-1">Protein</span>
                        <span className="block font-bold text-lg text-blue-800">{meal.nutrition.protein}g</span>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-md border border-yellow-100">
                        <span className="block text-xs font-medium text-yellow-700 mb-1">Carbs</span>
                        <span className="block font-bold text-lg text-yellow-800">{meal.nutrition.carbs}g</span>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-md border border-green-100">
                        <span className="block text-xs font-medium text-green-700 mb-1">Fat</span>
                        <span className="block font-bold text-lg text-green-800">{meal.nutrition.fat}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit button for saving all meal updates */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={submitDailyProgress}
                disabled={updateLoading}
                className={`px-6 py-3 rounded-lg text-white font-medium flex items-center ${
                  updateLoading 
                    ? 'bg-green-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all'
                }`}
              >
                {updateLoading ? (
                  <>
                    <Loader className="animate-spin mr-2 h-5 w-5" />
                    Saving Progress...
                  </>
                ) : (
                  <>
                    Save Daily Progress
                  </>
                )}
              </button>
            </div>

            {/* Success/Error messages */}
            {successMessage && (
              <div className="mt-4 bg-green-50 text-green-700 p-4 rounded-lg flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}
            
            {updateError && (
              <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{updateError}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <RefreshCcw className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No meal data available</h3>
            <p className="text-gray-600 mb-4">
              There was a problem fetching your meal data for this day.
            </p>
            <button
              onClick={() => fetchDayPlanDetails(selectedDay || 1)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DietTrackerComponent;
