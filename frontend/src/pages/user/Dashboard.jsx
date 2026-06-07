import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useThemeAwareStyle } from '../../utils/themeUtils';

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const { isDark, getClass } = useThemeAwareStyle();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    recentActivity: [],
    upcomingBookings: [],
    stats: {
      totalBookings: 0,
      favoriteChefs: 0,
      totalSpent: 0,
      reviewsGiven: 0
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load user data and dashboard data from backend
  useEffect(() => {
    // Wait for auth to complete
    if (authLoading) {
      return;
    }

    const loadDashboardData = async () => {
      try {
        //   isAuthenticated, 
        //   user: user ? { id: user.id, email: user.email, name: user.name } : null,
        //   hasToken: !!token 
        // });

        if (!isAuthenticated || !user || !token) {
          setUserData({
            name: 'Guest User',
            email: null
          });
          setLoading(false);
          return;
        }

        const response = await api.get('/user/dashboard/batch');
        const { user: backendUser, bookings, stats } = response.data;

        setUserData(backendUser);

        // Format recent activity from bookings
        const recent = bookings
          .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
          .slice(0, 5)
          .map(b => ({
            type: 'booking',
            action: `Booked ${b.chef?.name || 'Chef'}`,
            time: getTimeAgo(b.createdAt || b.date)
          }));

        // Filter upcoming bookings
        // Note: bookings from batch are limited to 10 most recent creations.
        // For a full production app, we might want a separate upcoming endpoint
        // to ensure we catch future bookings made long ago.
        const upcoming = bookings
          .filter(b => {
            const bookingDate = new Date(b.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return bookingDate >= today && (b.status === 'confirmed' || b.status === 'pending');
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);

        setDashboardData({
          recentActivity: recent,
          upcomingBookings: upcoming,
          stats: {
            totalBookings: stats.totalBookings,
            favoriteChefs: stats.favoriteChefs,
            totalSpent: stats.totalSpent,
            reviewsGiven: stats.reviewsGiven
          }
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fall back to AuthContext user data
        if (user) {
          setUserData({
            name: user.name || 'User',
            email: user.email
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [authLoading, isAuthenticated, user, token]);

  // Helper functions
  const formatBookingDate = (date, time) => {
    if (!date) return 'Date TBD';
    const bookingDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (bookingDate.toDateString() === today.toDateString()) {
      return `Today ${time || ''}`;
    } else if (bookingDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${time || ''}`;
    } else {
      return `${bookingDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} ${time || ''}`;
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const userName = userData?.name || 'User';

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const quickActions = [
    {
      title: "AI Features",
      description: "AI-powered chef booking, recommendations & menu generation",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
        </svg>
      ),
      link: "/ai-features",
      gradient: "from-orange-600 to-amber-600",
      bgColor: "bg-stone-100 dark:bg-gray-900",
      borderColor: "border-stone-300 dark:border-orange-700",
    },
    {
      title: "Book a Chef",
      description: "Find and book professional chefs for your next event",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6V5a2 2 0 114 0v1H8zm2 3a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clipRule="evenodd"></path>
        </svg>
      ),
      link: "/book-chef",
      gradient: "from-orange-600 to-amber-600",
      bgColor: "bg-stone-100 dark:bg-gray-900",
      borderColor: "border-stone-300 dark:border-orange-700"
    },
    {
      title: "Become a Chef",
      description: "Join our platform as a professional chef",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
        </svg>
      ),
      link: "/chef-onboarding",
      gradient: "from-orange-600 to-amber-600",
      bgColor: "bg-stone-100 dark:bg-gray-900",
      borderColor: "border-stone-300 dark:border-orange-700"
    },
    {
      title: "My Favorites",
      description: "View and manage your saved chefs",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
        </svg>
      ),
      link: "/favorites",
      gradient: "from-orange-600 to-amber-600",
      bgColor: "bg-stone-100 dark:bg-gray-900",
      borderColor: "border-stone-300 dark:border-orange-700"
    },
    {
      title: "My Profile",
      description: "Manage your account and preferences",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"></path>
        </svg>
      ),
      link: "/profile",
      gradient: "from-orange-600 to-amber-600",
      bgColor: "bg-stone-100 dark:bg-gray-900",
      borderColor: "border-stone-300 dark:border-orange-700"
    }
  ];

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${getClass('bgPrimary')}`}>
        <div className={`rounded-3xl shadow-xl p-8 text-center ${getClass('bgSecondary')}`}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h3 className={`text-xl font-semibold mb-2 ${getClass('textPrimary')}`}>Loading Dashboard</h3>
          <p className={`${getClass('textSecondary')}`}>Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getClass('bgPrimary')}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Header */}
        <div className={`bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white mb-6 sm:mb-8 relative overflow-hidden`}>
          <div className="absolute top-5 right-5 sm:top-10 sm:right-10 w-12 h-12 sm:w-20 sm:h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-3 left-5 sm:bottom-5 sm:left-10 w-10 h-10 sm:w-16 sm:h-16 bg-white/15 rounded-full animate-bounce"></div>

          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">
              {getGreeting()}, {userName}!
            </h1>
            <p className="text-base sm:text-lg md:text-xl opacity-95 mb-3 sm:mb-4">
              Ready to create amazing culinary experiences?
            </p>
            <div className="flex items-center text-sm sm:text-base md:text-lg opacity-90">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
              </svg>
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4 sm:mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className={`group border-2 rounded-2xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-opacity-80 ${isDark ? 'bg-gray-900 border-orange-700' : 'bg-stone-100 border-stone-300'}`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl flex items-center justify-center text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 group-hover:text-orange-600 transition-colors duration-300 ${getClass('textPrimary')}`}>
                  {action.title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${getClass('textSecondary')}`}>
                  {action.description}
                </p>
                <div className="mt-3 sm:mt-4 flex items-center text-orange-600 text-xs sm:text-sm font-semibold group-hover:text-orange-700">
                  Explore
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Upcoming Bookings */}
          <div className={`lg:col-span-2 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border ${getClass('bgSecondary')} ${isDark ? 'border-gray-700' : 'border-stone-200'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${getClass('textPrimary')}`}>Upcoming Bookings</h3>
              <Link to="/my-bookings" className="text-orange-600 hover:text-orange-700 font-semibold text-xs sm:text-sm flex items-center">
                View All
                <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </Link>
            </div>

            {dashboardData.upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingBookings.map((booking, index) => (
                  <div key={booking._id || index} className={`group border rounded-xl p-6 hover:shadow-md transition-all duration-300 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-stone-200'}`}>
                    {/* Chef Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative flex-shrink-0">
                          <img
                            src={booking.chef?.profilePicture || booking.chef?.profileImage?.url || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=60'}
                            alt={booking.chef?.name || 'Chef'}
                            className="w-14 h-14 rounded-full object-cover ring-4 ring-orange-100 dark:ring-orange-900/30 group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              if (!e.target.dataset.errorHandled) {
                                e.target.dataset.errorHandled = 'true';
                                e.target.src = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&auto=format&fit=crop&q=60';
                              }
                            }}
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {booking.chef?.name || booking.chef?.fullName || 'Chef'}
                          </h4>
                          <p className={`text-sm font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                            {booking.serviceType || 'Booking'}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {booking.status?.toLowerCase() === 'pending' && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-yellow-100 text-yellow-800'}`}>
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                            Pending
                          </span>
                        )}
                        {booking.status?.toLowerCase() === 'confirmed' && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-100 text-green-800'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                            Confirmed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-2.5 mb-4">
                      <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <svg className="w-5 h-5 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <svg className="w-5 h-5 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{booking.time || 'Time not specified'}</span>
                      </div>
                      {booking.guestCount && (
                        <div className={`flex items-center text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <svg className="w-5 h-5 mr-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium">{booking.guestCount} Guest{booking.guestCount !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {booking.location && (
                        <div className={`flex items-start text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          <svg className="w-5 h-5 mr-3 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">{booking.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      {booking.totalPrice && (
                        <div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Amount</p>
                          <p className={`text-xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>₹{booking.totalPrice.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-stone-300'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
                <p className={`mb-4 ${getClass('textMuted')}`}>No upcoming bookings</p>
                <Link to="/book-chef" className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold">
                  Book Your First Chef
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border ${getClass('bgSecondary')} ${isDark ? 'border-gray-700' : 'border-stone-200'}`}>
            <h3 className={`text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 ${getClass('textPrimary')}`}>Recent Activity</h3>
            {dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className={`flex items-start space-x-3 pb-4 border-b last:border-b-0 ${isDark ? 'border-gray-700' : 'border-stone-200'}`}>
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.type === 'booking' ? `bg-orange-500 ${isDark ? 'bg-orange-300' : ''}` :
                      activity.type === 'favorite' ? `bg-amber-500 ${isDark ? 'bg-amber-300' : ''}` :
                        activity.type === 'completed' ? `bg-green-500 ${isDark ? 'bg-green-300' : ''}` :
                          `bg-orange-400 ${isDark ? 'bg-orange-300' : ''}`
                      }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${getClass('textPrimary')}`}>{activity.action}</p>
                      <p className={`text-xs ${getClass('textMuted')}`}>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3"></div>
                <p className={`text-sm ${getClass('textMuted')}`}>No recent activity</p>
                <p className={`text-xs mt-1 ${getClass('textMuted')} opacity-70`}>Your activity will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          {[
            {
              label: "Total Bookings",
              value: dashboardData.stats.totalBookings.toString(),
              icon: "",
              color: "text-orange-600"
            },
            {
              label: "Favorite Chefs",
              value: dashboardData.stats.favoriteChefs.toString(),
              icon: "",
              color: "text-amber-600"
            },

            {
              label: "Reviews Given",
              value: dashboardData.stats.reviewsGiven.toString(),
              icon: "",
              color: "text-amber-600"
            }
          ].map((stat, index) => (
            <div key={index} className={`rounded-2xl p-4 sm:p-6 shadow-lg border text-center ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-stone-50 border-stone-200'}`}>
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</div>
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className={`text-xs sm:text-sm ${getClass('textSecondary')}`}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
