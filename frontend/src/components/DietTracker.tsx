import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Utensils, Calendar, Loader, RefreshCcw, CheckCircle, XCircle, ChevronRight, Award, Activity, TrendingUp, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const calculateCurrentNutrition = () => {
    if (!currentDayPlan) return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    return currentDayPlan.meals.reduce((acc, meal) => {
      if (meal.eaten) {
        acc.calories += meal.nutrition.calories;
        acc.protein += meal.nutrition.protein;
        acc.carbs += meal.nutrition.carbs;
        acc.fat += meal.nutrition.fat;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };
  
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
      // Optimistically update the UI
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
      setTimeout(() => setSuccessMessage(null), 3000);
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
      
      // Log the meals we're about to send
      console.log("Current day meals:", currentDayPlan.meals);
      
      // Process each meal in the current day for the tracker
      const mealUpdates = currentDayPlan.meals.map(meal => {
        if (!meal._id) {
          console.error('Meal is missing ID:', meal);
          return Promise.reject(new Error('Meal is missing ID'));
        }
  
        return axios.post(
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
        ).catch(err => {
          console.error(`Failed to update meal ${meal._id}:`, err.response?.data || err.message);
          return Promise.reject(err);
        });
      });
      
      // Execute all meal updates with better error handling
      const results = await Promise.allSettled(mealUpdates);
      
      // Check for failures
      const failedUpdates = results.filter(r => r.status === 'rejected');
      if (failedUpdates.length > 0) {
        console.error('Some meal updates failed:', failedUpdates);
        throw new Error(`${failedUpdates.length} meal updates failed`);
      }
      
      // All succeeded
      const successfulUpdates = results.filter(r => r.status === 'fulfilled');
      const lastResult = successfulUpdates[successfulUpdates.length - 1].value.data;
      
      setDietTracker(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          overallCompletionPercentage: lastResult.dietTracker.overallCompletionPercentage,
          streak: lastResult.dietTracker.streak,
          adherenceScore: lastResult.dietTracker.adherenceScore,
          dailyTrackers: lastResult.dietTracker.dailyTrackers
        };
      });
      
      setSuccessMessage('Daily progress saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Error in submitDailyProgress:', err);
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
    
    // Find existing day tracker or create default one
    let dayTracker = dietTracker.dailyTrackers.find(dt => dt.dayNumber === selectedDay);
    
    // Calculate current values from the meal plan
    const currentNutrition = calculateCurrentNutrition();
    const eatenMealsCount = currentDayPlan.meals.filter(m => m.eaten).length;
    const totalMeals = currentDayPlan.meals.length;
    const completionPercentage = Math.round((eatenMealsCount / totalMeals) * 100);
    
    // If we have a day tracker, merge with current values
    if (dayTracker) {
      return {
        ...dayTracker,
        completedMeals: eatenMealsCount,
        totalMeals: totalMeals,
        completionPercentage: completionPercentage,
        caloriesConsumed: currentNutrition.calories,
        nutrition: {
          protein: {
            consumed: currentNutrition.protein,
            target: dayTracker.nutrition.protein.target
          },
          carbs: {
            consumed: currentNutrition.carbs,
            target: dayTracker.nutrition.carbs.target
          },
          fat: {
            consumed: currentNutrition.fat,
            target: dayTracker.nutrition.fat.target
          }
        }
      };
    }
    
    // No existing tracker - create a new one with current values
    return {
      _id: '',
      date: new Date().toISOString(),
      dayNumber: selectedDay,
      completedMeals: eatenMealsCount,
      totalMeals: totalMeals,
      completionPercentage: completionPercentage,
      caloriesConsumed: currentNutrition.calories,
      targetCalories: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.calories, 0),
      nutrition: {
        protein: {
          consumed: currentNutrition.protein,
          target: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.protein, 0)
        },
        carbs: {
          consumed: currentNutrition.carbs,
          target: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.carbs, 0)
        },
        fat: {
          consumed: currentNutrition.fat,
          target: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.fat, 0)
        }
      }
    };
  };

  // Add this helper function near your other utility functions
const getDateForDay = (startDate: string, dayNumber: number) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayNumber - 1)); // Subtract 1 since dayNumber starts at 1
  return date;
};

// Format date as short string (e.g., "Mon, Jun 5")
const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
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

  // Add these helper functions after the existing utility functions
  const getCalendarDays = (startDate: string, totalDays: number) => {
    const start = new Date(startDate);
    const days = [];
    
    // Get the first day of the month
    const firstDay = new Date(start.getFullYear(), start.getMonth(), 1);
    // Get the last day of the month
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    
    // Add empty cells for days before the start date
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push({ date: null, dayNumber: null, isCurrentMonth: false });
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(start.getFullYear(), start.getMonth(), i);
      const dayNumber = Math.floor((currentDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      days.push({
        date: currentDate,
        dayNumber: dayNumber > 0 && dayNumber <= totalDays ? dayNumber : null,
        isCurrentMonth: true
      });
    }
    
    return days;
  };

  const getWeekDays = () => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  };

  // Add these helper functions after the existing utility functions
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Add these functions after the existing functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateInMealPlan = (date: Date) => {
    if (!dietTracker?.startDate) return false;
    const startDate = new Date(dietTracker.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (dietTracker.totalDays - 1));
    
    return date >= startDate && date <= endDate;
  };

  const getDayNumberForDate = (date: Date) => {
    if (!dietTracker?.startDate) return null;
    const startDate = new Date(dietTracker.startDate);
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 && diffDays <= dietTracker.totalDays ? diffDays : null;
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
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-xl p-4">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
          Diet Tracker
        </h1>
        <p className="text-green-100 text-sm">
          Track your meals and monitor your progress
        </p>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Main content with side-by-side layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar section */}
        <div className="bg-white rounded-xl shadow-sm p-4 h-fit">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-800">
              {getMonthName(currentMonth)}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {getWeekDays().map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1);
              const dayNumber = getDayNumberForDate(date);
              const isInMealPlan = isDateInMealPlan(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = dayNumber && dayNumber < (dietTracker?.currentDay || 0);
              const isFuture = dayNumber && dayNumber > (dietTracker?.currentDay || 0);
              
              const dayTracker = dietTracker?.dailyTrackers.find(dt => dt.dayNumber === dayNumber);
              const isCompleted = dayTracker && dayTracker.completionPercentage === 100;
              
              return (
                <button
                  key={index}
                  onClick={() => dayNumber && fetchDayPlanDetails(dayNumber)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 transition-all relative overflow-hidden ${
                    !isInMealPlan
                      ? 'bg-gray-50 text-gray-300'
                      : selectedDay === dayNumber
                        ? 'bg-teal-600 text-white shadow-md'
                        : isCompleted
                          ? 'bg-green-500 text-white shadow-sm'
                          : isPast
                            ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                            : isFuture
                              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  }`}
                  disabled={!dayNumber || !isInMealPlan}
                >
                  <span className={`text-sm font-semibold ${
                    isCompleted ? 'text-white' : 'text-gray-700'
                  }`}>
                    {index + 1}
                  </span>
                  {isPast && !isCompleted && (
                    <CheckCircle className="h-3 w-3 mt-0.5 text-teal-500" />
                  )}
                  {isToday && (
                    <span className="text-[10px] mt-0.5 bg-teal-600 text-white px-1.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                  {isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-green-500 opacity-10 rounded-lg"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meal plans section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <Loader className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading your meal data...</p>
              </div>
            ) : currentDayPlan && dietTracker ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-500" />
                    {formatShortDate(getDateForDay(dietTracker.startDate, currentDayPlan.dayNumber))}
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
      </div>
    </div>
  );
};

export default DietTrackerComponent;
