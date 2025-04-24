import type React from "react"
import { useEffect, useState } from "react"
import axios from "axios"

interface User {
  _id: string
  name: string
  email: string
  age: number
  gender: string
  height: number
  weight: number
  bmi: number
  dietType: string
  fitnessGoal: string
  mealsPerDay: number
  planDuration: number
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get<{ user: User }>("http://localhost:3000/api/auth/profile")
      .then((res) => {
        setUser(res.data.user)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">We couldn't find your profile information.</p>
        </div>
      </div>
    )
  }

  const initial = user.name.charAt(0).toUpperCase()
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-500" }
    if (bmi < 25) return { label: "Normal", color: "bg-green-500" }
    if (bmi < 30) return { label: "Overweight", color: "bg-yellow-500" }
    return { label: "Obese", color: "bg-red-500" }
  }

  const bmiInfo = getBmiCategory(user.bmi)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="relative mb-12">
          {/* Background Banner */}
          <div className="h-48 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Profile Avatar and Name */}
          <div className="absolute transform -translate-y-1/2 left-8 sm:left-10 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white p-1.5 rounded-full shadow-xl">
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {initial}
              </div>
            </div>
            <div className="ml-2 sm:mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Personal Information */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-gray-500 mb-1">Age</p>
                <p className="text-xl font-semibold text-gray-800">{user.age} years</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-gray-500 mb-1">Gender</p>
                <p className="text-xl font-semibold text-gray-800">{capitalize(user.gender)}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl hover:shadow-md transition-shadow duration-300">
                <p className="text-sm text-gray-500 mb-1">Plan Duration</p>
                <p className="text-xl font-semibold text-gray-800">{user.planDuration} days</p>
              </div>
            </div>
          </div>

          {/* Fitness Metrics */}
          <div className="bg-gray-50 p-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Fitness Metrics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Height</p>
                    <p className="text-xl font-semibold text-gray-800">{user.height} cm</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Weight</p>
                    <p className="text-xl font-semibold text-gray-800">{user.weight} kg</p>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">BMI</p>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold text-gray-800">{user.bmi.toFixed(1)}</p>
                      <span className={`${bmiInfo.color} text-white text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                        {bmiInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="w-full sm:w-2/3 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                      style={{ width: `${Math.min((user.bmi / 40) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Diet & Fitness Goals */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Diet & Fitness Plan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <p className="text-sm text-indigo-600 font-medium mb-1">Diet Type</p>
                    <p className="text-xl font-semibold text-gray-800">{capitalize(user.dietType)}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-indigo-100">
                    <p className="text-sm text-indigo-600 font-medium mb-1">Meals Per Day</p>
                    <div className="flex items-center gap-1">
                      {[...Array(user.mealsPerDay)].map((_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 md:col-span-2">
                <p className="text-sm text-purple-600 font-medium mb-1">Fitness Goal</p>
                <p className="text-xl font-semibold text-gray-800 mb-4">{formatLabel(user.fitnessGoal)}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {user.fitnessGoal.includes("weight-loss") && (
                    <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Weight Loss
                    </span>
                  )}
                  {user.fitnessGoal.includes("muscle") && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Muscle Building
                    </span>
                  )}
                  {user.fitnessGoal.includes("health") && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      General Health
                    </span>
                  )}
                  {user.fitnessGoal.includes("endurance") && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Endurance
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

// Utility functions
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const formatLabel = (str: string) => str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

export default Profile
