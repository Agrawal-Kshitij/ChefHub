import React, { useState, useEffect } from 'react';
import { UnifiedAIFeatures, AIChatAssistant } from '../components/ai';
import AdvancedSearch from '../components/AdvancedSearch';
import api from '../utils/api';

const AIAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalChefs: 0,
    totalBookings: 0,
    revenue: 0,
    topCuisines: [],
    bookingTrends: [],
    userActivity: []
  });
  const [aiInsights, setAiInsights] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      // Simulated analytics data - replace with real API calls
      const response = await api.get('/bookings/admin/stats');
      setAnalyticsData(response.data.data);
      generateAIInsights(response.data.data);
    } catch {
      // Fallback data for demo
      setAnalyticsData({
        totalUsers: 245,
        totalChefs: 18,
        totalBookings: 127,
        revenue: 234500,
        topCuisines: [
          { name: 'North Indian', bookings: 45 },
          { name: 'Italian', bookings: 32 },
          { name: 'Continental', bookings: 28 }
        ],
        bookingTrends: [
          { month: 'Jan', bookings: 12 },
          { month: 'Feb', bookings: 19 },
          { month: 'Mar', bookings: 25 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async (data) => {
    try {
      const response = await api.post('/ai/analytics-insights', {
        analyticsData: data
      });
      setAiInsights(response.data.data);
    } catch (error) {
      console.error('AI insights generation failed:', error);
    }
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  if (loading) {
    return (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading AI Analytics</h3>
          <p className="text-gray-600">Analyzing platform data...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            🤖 AI-Powered Analytics Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Intelligent insights for your chef booking platform
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="text-4xl mb-2"></div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {analyticsData.totalUsers.toLocaleString()}
            </div>
            <div className="text-gray-600 text-sm">Total Users</div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="text-4xl mb-2">ðŸ‘¨â€ðŸ³</div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {analyticsData.totalChefs}
            </div>
            <div className="text-gray-600 text-sm">Active Chefs</div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="text-4xl mb-2"></div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {analyticsData.totalBookings}
            </div>
            <div className="text-gray-600 text-sm">Total Bookings</div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
            <div className="text-4xl mb-2"></div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">
              Rs. {(analyticsData.revenue / 1000).toFixed(0)}K
            </div>
            <div className="text-gray-600 text-sm">Total Revenue</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Insights */}
            {aiInsights && (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  AI Business Insights
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Growth Opportunities</h4>
                    <p className="text-blue-700">{aiInsights.growthOpportunities}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Market Trends</h4>
                    <p className="text-green-700">{aiInsights.marketTrends}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">Optimization Suggestions</h4>
                    <p className="text-purple-700">{aiInsights.optimizations}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Search */}
            <AdvancedSearch 
              onResults={handleSearchResults}
              onFiltersChange={(filters) => console.log('Filters:', filters)}
            />

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Search Results ({searchResults.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {searchResults.slice(0, 4).map((chef, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {chef.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-800">{chef.name}</h4>
                          <p className="text-purple-600 text-sm mb-1">{chef.specialty}</p>
                          <p className="text-gray-600 text-sm mb-2">{chef.experienceYears} years experience</p>
                          <div className="flex items-center justify-between">
                            <span className="text-green-600 font-semibold">Rs. {chef.pricePerHour}/hr</span>
                            <div className="flex items-center">
                              <span className="text-yellow-500"></span>
                              <span className="text-sm text-gray-600 ml-1">{chef.averageRating?.toFixed(1) || chef.rating || 'New'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Cuisines */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">
                Popular Cuisines
              </h3>
              <div className="space-y-4">
                {analyticsData.topCuisines.map((cuisine, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-800">{cuisine.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                          style={{ width: `${(cuisine.bookings / 50) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{cuisine.bookings}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Chat Assistant */}
            <AIChatAssistant />

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                 Quick AI Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm">
                  Generate Market Forecast
                </button>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm">
                  Create Performance Report
                </button>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm">
                  Optimize Pricing Strategy
                </button>
                <button className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 text-sm">
                   AI Business Consultation
                </button>
              </div>
            </div>

            {/* Platform Health */}
            <div className="bg-white rounded-3xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Platform Health
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Satisfaction</span>
                  <div className="flex items-center">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                      92%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Chef Quality Score</span>
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      4.7/5
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Booking Success Rate</span>
                  <div className="flex items-center">
                    <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                      88%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">AI Accuracy</span>
                  <div className="flex items-center">
                    <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                      95%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;
