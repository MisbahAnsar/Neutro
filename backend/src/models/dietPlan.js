const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    required: true
  },
  dishName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  eaten: {
    type: Boolean,
    default: false
  }
});

const dayPlanSchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true
  },
  meals: [mealSchema]
});

const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly-active', 'moderately-active', 'very-active', 'extra-active'],
    required: true
  },
  goal: {
    type: String,
    enum: ['weight-loss', 'weight-gain', 'maintenance'],
    required: true
  },
  planDuration: {
    type: Number,
    required: true,
    min: 1,
    max: 30 // Limit to 30 days max for performance reasons
  },
  foodType: {
    type: String,
    enum: ['veg', 'non-veg', 'both'], // Allow only these values
    required: true // Making it mandatory
  },
  dailyCalories: {
    type: Number,
    required: true
  },
  dailyMacros: {
    protein: Number,
    carbs: Number,
    fat: Number
  },
  days: [dayPlanSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

module.exports = DietPlan; 