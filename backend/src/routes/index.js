const express = require('express');
const router = express.Router();
const { validateUserRegistration, validateCompleteProfile, validateUserLogin, auth } = require('../middleware');
const { 
  createUser, 
  getUserDashboard, 
  getAllUsers, 
  updateUserProfile,
  generateDietPlan,
  getLatestDietPlan,
  getDietPlanDay,
  getAllDietPlans,
  trackMeal,
  createDietTracker,
  updateTrackerForMeal,
  getActiveTracker,
  getTrackerDay,
  getAllTrackers,
  updateTrackerStatus
} = require('../controllers/index');
const { signup, login, getUserProfile } = require('../controllers/auth');

// Authentication routes
router.post('/auth/signup', validateUserRegistration, signup);
router.post('/auth/login', validateUserLogin, login);
router.get('/auth/profile', auth, getUserProfile);

// Profile routes
router.post('/users/update-profile', auth, updateUserProfile);

// Legacy registration route (kept for backwards compatibility)
router.post('/users', validateCompleteProfile, createUser);

// Protected routes
router.get('/users/:id/dashboard', auth, getUserDashboard);
router.get('/users/me/dashboard', auth, getUserDashboard);

// Admin routes - also protected now
router.get('/users', auth, getAllUsers);

// Diet plan routes
router.post('/diet-plans', auth, generateDietPlan);
router.get('/diet-plans/latest', auth, getLatestDietPlan);
router.get('/diet-plans/days/:dayNumber', auth, getDietPlanDay);
router.get('/diet-plans', auth, getAllDietPlans);
router.post('/diet-plans/track-meal', auth, trackMeal);

// Diet tracker routes
router.post('/diet-trackers', auth, createDietTracker);
router.post('/diet-trackers/track-meal', auth, updateTrackerForMeal);
router.get('/diet-trackers/active', auth, getActiveTracker);
router.get('/diet-trackers/:trackerId/days/:dayNumber', auth, getTrackerDay);
router.get('/diet-trackers', auth, getAllTrackers);
router.post('/diet-trackers/update-status', auth, updateTrackerStatus);

module.exports = router;