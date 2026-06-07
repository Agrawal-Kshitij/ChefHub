import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { Link } from 'react-router-dom';
import { useThemeAwareStyle } from '../../utils/themeUtils';

const ViewBookings = () => {
  const { isDark, getClass } = useThemeAwareStyle();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Fetch bookings from API
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Token check is handled by api interceptor mostly, but we can keep it if we want to avoid call
      // But api.js handles it.
      
      const response = await api.get('/bookings');
      const data = response.data;
      
      
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await api.delete(`/bookings/${bookingId}`);
      const data = response.data;
      
      if (data.success) {
        // Refresh bookings list
        await fetchBookings();
        toast.success('Booking cancelled successfully');
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking. Please try again.');
    }
  };

  // Handle booking status update
  const handleUpdateBooking = async (bookingId, newStatus) => {
    try {
      const response = await api.put(`/bookings/${bookingId}`, { status: newStatus });
      const data = response.data;
      
      if (data.success) {
        // Refresh bookings list
        await fetchBookings();
        toast.success('Booking updated successfully');
      } else {
        toast.error(data.message || 'Failed to update booking');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking. Please try again.');
    }
  };

  // Enhanced filter and sort bookings
  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status?.toLowerCase() === filter);

  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'amount') {
      return (b.totalPrice || 0) - (a.totalPrice || 0);
    } else if (sortBy === 'status') {
      const statusOrder = { 'pending': 0, 'confirmed': 1, 'completed': 2, 'cancelled': 3 };
      return (statusOrder[a.status?.toLowerCase()] || 0) - (statusOrder[b.status?.toLowerCase()] || 0);
    }
    return 0;
  });

  // Button style helpers
  const getButtonClasses = (type = 'default') => {
    const baseClasses = "px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium";
    
    switch (type) {
      case 'cancel':
        return `${baseClasses} ${isDark ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`;
      case 'contact':
        return `${baseClasses} ${isDark ? 'bg-orange-900 text-orange-300 hover:bg-orange-800' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`;
      case 'rate':
        return `${baseClasses} ${isDark ? 'bg-yellow-900 text-yellow-300 hover:bg-yellow-800' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`;
      case 'rebook':
        return `${baseClasses} ${isDark ? 'bg-amber-900 text-amber-300 hover:bg-amber-800' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`;
      case 'details':
        return `${baseClasses} ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`;
      default:
        return `${baseClasses} ${getClass('bgTertiary')} ${getClass('textSecondary')} hover:${getClass('bgSecondary')}`;
    }
  };

  // Get action buttons based on booking status
  const getActionButtons = (booking) => {
    const status = booking.status?.toLowerCase();
    const actions = [];

    switch (status) {
      case 'pending':
        actions.push(
          <button 
            key="cancel"
            className={getButtonClasses('cancel')}
            onClick={() => handleCancelBooking(booking._id)}
          >
            Cancel
          </button>
        );
        break;
      
      case 'confirmed':
        actions.push(
          <button 
            key="contact"
            className={getButtonClasses('contact')}
            onClick={() => {/* Add contact chef functionality */}}
          >
            Contact Chef
          </button>
        );
        actions.push(
          <button 
            key="cancel"
            className={getButtonClasses('cancel')}
            onClick={() => handleCancelBooking(booking._id)}
          >
            Cancel
          </button>
        );
        break;
      
      case 'completed':
        actions.push(
          <button 
            key="rate"
            className={getButtonClasses('rate')}
            onClick={() => handleUpdateBooking(booking._id, 'rated')}
          >
            Rate Chef
          </button>
        );
        actions.push(
          <button 
            key="rebook"
            className={getButtonClasses('rebook')}
            onClick={() => {/* Add rebook functionality */}}
          >
            Book Again
          </button>
        );
        break;
      
      case 'cancelled':
        actions.push(
          <button 
            key="rebook"
            className={getButtonClasses('rebook')}
            onClick={() => {/* Add rebook functionality */}}
          >
            Book Again
          </button>
        );
        break;
      
      default:
        break;
    }

    // Always add view details button
    actions.push(
      <button 
        key="details"
        className={getButtonClasses('details')}
        onClick={() => {/* Add view details functionality */}}
      >
        View Details
      </button>
    );

    return actions;
  };

  // Status configuration with detailed information
  const getStatusConfig = () => ({
    all: {
      label: 'All Bookings',
      description: 'View all your bookings regardless of status',
      color: 'text-gray-600',
      bgColor: isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200',
      icon: ''
    },
    pending: {
      label: 'Pending',
      description: 'Bookings awaiting confirmation',
      color: 'text-yellow-600',
      bgColor: isDark ? 'bg-yellow-900 text-yellow-300 border-yellow-700' : 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: ''
    },
    confirmed: {
      label: 'Confirmed',
      description: 'Approved bookings ready for service',
      color: 'text-amber-600',
      bgColor: isDark ? 'bg-amber-900 text-amber-300 border-amber-700' : 'bg-amber-100 text-amber-800 border-amber-200',
      icon: ''
    },
    completed: {
      label: 'Completed',
      description: 'Successfully delivered services',
      color: 'text-orange-600',
      bgColor: isDark ? 'bg-orange-900 text-orange-300 border-orange-700' : 'bg-orange-100 text-orange-800 border-orange-200',
      icon: ''
    },
    cancelled: {
      label: 'Cancelled',
      description: 'Cancelled bookings and refunds',
      color: 'text-red-600',
      bgColor: isDark ? 'bg-red-900 text-red-300 border-red-700' : 'bg-red-100 text-red-800 border-red-200',
      icon: ''
    }
  });

  const getStatusColor = (status) => {
    const statusKey = status?.toLowerCase();
    const statusInfo = getStatusConfig();
    return statusInfo[statusKey]?.bgColor || statusInfo.all.bgColor;
  };

  const getStatusIcon = (status) => {
    const statusKey = status?.toLowerCase();
    const statusInfo = getStatusConfig();
    return statusInfo[statusKey]?.icon || '?';
  };

  // Calculate status counts from actual bookings
  const statusCounts = {
    all: bookings.length,
    confirmed: bookings.filter(b => b.status?.toLowerCase() === 'confirmed').length,
    pending: bookings.filter(b => b.status?.toLowerCase() === 'pending').length,
    completed: bookings.filter(b => b.status?.toLowerCase() === 'completed').length,
    cancelled: bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  // Format time helper
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  // Fix: statusInfo for status panel
  const statusInfo = getStatusConfig();

  if (loading) {
    return (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h3 className={`text-xl font-semibold mb-2 ${getClass('textPrimary')}`}>Loading Your Bookings</h3>
          <p className={`${getClass('textSecondary')}`}>Please wait while we fetch your booking history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center max-w-md">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
          </svg>
          <h3 className={`text-xl font-semibold mb-2 ${getClass('textPrimary')}`}>Error Loading Bookings</h3>
          <p className={`mb-4 ${getClass('textSecondary')}`}>{error}</p>
          <button 
            onClick={fetchBookings}
            className="px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${getClass('bgPrimary')} lg:ml-32`}>
      {/* Header */}
  <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm mb-6">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            Your Bookings
          </h1>
          <p className="text-lg md:text-xl opacity-95 max-w-2xl mx-auto">
            Manage and track all your chef booking experiences
          </p>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-8 h-8 bg-white/15 rounded-full animate-bounce"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
        {/* Enhanced Stats Overview */}
      

        {/* Enhanced Filters and Sorting */}
  <div className={`rounded-2xl shadow-lg p-6 mt-5 mb-4 border border-orange-100 ${getClass('bgSecondary')} ${isDark ? 'border-orange-700' : ''}`}>
          <div className="flex flex-col gap-6">
            {/* Status Filter with Visual Cards */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${getClass('textPrimary')}`}>
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
                </svg>
                Filter by Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(getStatusConfig()).map(([status, info]) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md ${
                      filter === status
                        ? `border-orange-500 shadow-md ${isDark ? 'bg-orange-900' : 'bg-orange-50'}`
                        : `hover:border-orange-300 ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className={`font-semibold ${info.color}`}>
                        {info.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ml-auto ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {statusCounts[status]}
                      </span>
                    </div>
                    <p className={`text-xs ${getClass('textMuted')}`}>{info.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Filters */}
            <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <span className={`font-medium ${getClass('textSecondary')}`}>Quick Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                >
                  {Object.entries(getStatusConfig()).map(([status, info]) => (
                    <option key={status} value={status}>
                      {info.icon} {info.label} ({statusCounts[status]})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`font-medium ${getClass('textSecondary')}`}>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDark ? 'border-gray-600 bg-gray-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="amount">Amount (Highest First)</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Empty State */}
        {sortedBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className={`rounded-3xl shadow-lg p-12 border border-orange-100 ${getClass('bgSecondary')} ${isDark ? 'border-orange-700' : ''}`}>
              <div className="text-6xl mb-6">
                {filter === 'all' ? '' : getStatusConfig()[filter]?.icon || ''}
              </div>
              <h3 className={`text-2xl font-bold mb-4 ${getClass('textSecondary')}`}>
                {filter === 'all' ? 'No bookings found' : `No ${getStatusConfig()[filter]?.label.toLowerCase()} bookings`}
              </h3>
              <p className={`mb-8 max-w-md mx-auto ${getClass('textMuted')}`}>
                {filter === 'all' 
                  ? "You haven't made any bookings yet. Start exploring our amazing chefs and book your first culinary experience!"
                  : filter === 'pending'
                  ? "No pending bookings. All your bookings have been processed!"
                  : filter === 'confirmed'
                  ? "No confirmed bookings. Book a chef to see confirmed appointments here."
                  : filter === 'completed'
                  ? "No completed bookings yet. Your completed services will appear here."
                  : filter === 'cancelled'
                  ? "No cancelled bookings. Great job managing your appointments!"
                  : `No ${filter} bookings found. Try changing the filter.`
                }
              </p>
              
              {/* Action buttons based on filter */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {filter === 'all' && (
                  <Link 
                    to="/book-chef" 
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    Book Your First Chef
                    <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </Link>
                )}
                
                {filter !== 'all' && (
                  <>
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      View All Bookings
                    </button>
                    
                    <Link 
                      to="/book-chef" 
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-medium"
                    >
                      Book New Chef
                      <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedBookings.map((booking) => (
              <div key={booking._id} className={`rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100 dark:border-orange-700 overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}> 
                <div className="p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Chef Info */}
                    <div className="flex items-center gap-4">
                      <img
                        src={booking.chef?.profileImage?.url || booking.chef?.photo || 'https://images.unsplash.com/photo-1594736797933-d0d6ee7ad6e1?w=400&auto=format&fit=crop&q=60'}
                        alt={booking.chef?.fullName || booking.chef?.name || 'Chef'}
                        className={`w-16 h-16 rounded-full object-cover border-2 ${isDark ? 'border-orange-600' : 'border-orange-200'}`}
                      />
                      <div>
                        <h3 className={`text-xl font-bold ${getClass('textPrimary')}`}>
                          {booking.chef?.fullName || booking.chef?.name || 'Unknown Chef'}
                        </h3>
                        <p className={`font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                          {booking.chef?.specialties?.[0] || booking.serviceType || 'Culinary Expert'}
                        </p>
                        <div className="flex items-center mt-1">
                          <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          <span className={`text-sm ${getClass('textMuted')}`}>
                            {booking.chef?.averageRating?.toFixed(1) || booking.chef?.rating || '4.5'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className={`text-sm mb-1 ${getClass('textMuted')}`}>Date & Time</div>
                        <div className={`font-semibold ${getClass('textPrimary')}`}>{formatDate(booking.date)}</div>
                        <div className={`text-sm ${getClass('textMuted')}`}>{formatTime(booking.time)}</div>
                      </div>
                      
                      <div>
                        <div className={`text-sm mb-1 ${getClass('textMuted')}`}>Service & Guests</div>
                        <div className={`font-semibold ${getClass('textPrimary')}`}>{booking.serviceType || 'N/A'}</div>
                        <div className={`text-sm ${getClass('textMuted')}`}>{booking.guestCount || 0} guests</div>
                      </div>
                      
                      <div>
                        <div className={`text-sm mb-1 ${getClass('textMuted')}`}>Duration</div>
                        <div className={`font-semibold ${getClass('textPrimary')}`}>{booking.duration || 'N/A'}</div>
                      </div>
                      
                      <div>
                        <div className={`text-sm mb-1 ${getClass('textMuted')}`}>Total Amount</div>
                        <div className={`font-bold text-lg ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                          Rs. {(booking.totalPrice || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        <span className="mr-2">{getStatusIcon(booking.status)}</span>
                        {booking.status || 'Pending'}
                      </span>
                      
                      <div className="flex gap-2 flex-wrap">
                        {getActionButtons(booking)}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Special Requests and Status Info */}
                  {booking.specialRequests && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl border border-orange-100 dark:border-orange-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Special Requests</div>
                      <div className="text-gray-700 dark:text-gray-300">{booking.specialRequests}</div>
                    </div>
                  )}

                  {/* Status Information Panel */}
                  <div className={`mt-6 p-4 rounded-xl border border-gray-100 dark:border-gray-700 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}> 
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Current Status</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{getStatusIcon(booking.status)}</span>
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {statusInfo[booking.status?.toLowerCase()]?.label || booking.status || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {statusInfo[booking.status?.toLowerCase()]?.description || 'Status information unavailable'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Booked on</div>
                        <div className="font-medium text-gray-700 dark:text-gray-300">{formatDate(booking.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {sortedBookings.length > 0 && (
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-orange-600 to-red-400 rounded-3xl p-8 text-white">
              <h3 className="text-3xl font-bold mb-4">Ready for Your Next Culinary Adventure?</h3>
              <p className="text-xl mb-8 opacity-95">Book another amazing chef and create more memorable experiences</p>
              <Link 
                to="/book-chef" 
                className="inline-flex items-center px-8 py-3 bg-white text-orange-600 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
              >
                Book Another Chef
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewBookings;
