import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useThemeAwareStyle } from '../../utils/themeUtils';
import FavoriteButton from '../../components/features/FavoriteButton';
import { cachedFetch } from '../../utils/apiCache';
import { debounce } from '../../utils/debounce';

const Chefs = () => {
  const { getClass, classes, isDark } = useThemeAwareStyle();
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const cuisineTypes = ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai', 'French', 'Japanese', 'Mediterranean'];
  const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];

  // Debounced fetch function - waits 500ms after user stops typing
  const debouncedFetchRef = useRef(
    debounce((search, cuisine, location) => {
      fetchChefsWithParams(search, cuisine, location);
    }, 500)
  );

  useEffect(() => {
    // Use debounced function for search, immediate for filters
    if (searchTerm) {
      debouncedFetchRef.current(searchTerm, selectedCuisine, selectedLocation);
    } else {
      // Immediate fetch when no search term or filters change
      fetchChefsWithParams(searchTerm, selectedCuisine, selectedLocation);
    }

    // Cleanup function to cancel pending debounced calls
    return () => {
      if (debouncedFetchRef.current.cancel) {
        debouncedFetchRef.current.cancel();
      }
    };
  }, [searchTerm, selectedCuisine, selectedLocation]);

  const fetchChefsWithParams = async (search, cuisine, location) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (cuisine) params.append('cuisine', cuisine);
      if (location) params.append('location', location);

      const queryString = params.toString();
      const endpoint = queryString ? `/chefs/search?${queryString}` : '/chefs';
      
      // Create cache key based on filters
      const cacheKey = `chefs-${search}-${cuisine}-${location}`;

      // Use cached fetch with 2 minute TTL
      const data = await cachedFetch(
        cacheKey,
        async () => {
          const response = await api.get(endpoint);
          return response.data;
        },
        2 * 60 * 1000 // Cache for 2 minutes
      );
      
      setChefs(data.chefs || data.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      setChefs([]);
    } finally {
      setLoading(false);
    }
  };



  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCuisineChange = (e) => {
    setSelectedCuisine(e.target.value);
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCuisine('');
    setSelectedLocation('');
  };

  if (loading) {
    return (
  <div className={getClass('min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100', 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900')}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
            <p className={getClass('mt-4 text-lg text-gray-600', 'mt-4 text-lg text-gray-300')}>Loading amazing chefs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className={getClass('min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 ml-20', 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ml-20')}>
      {/* Header Section */}
  <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-16 sm:py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full backdrop-blur-sm mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
              Our Talented Chefs
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl opacity-95 max-w-3xl mx-auto">
              Discover professional chefs ready to create amazing culinary experiences for you
            </p>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-12 h-12 bg-white/15 rounded-full animate-bounce"></div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={getClass('bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8', 'bg-gray-900 rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-800')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className={getClass('block text-sm font-medium text-gray-700 mb-2', 'block text-sm font-medium text-gray-200 mb-2')}>Search Chefs</label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, specialty, or description..."
                className={`w-full px-3 sm:px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${classes.input.bg} ${classes.input.border} ${classes.input.text} ${classes.input.placeholder}`}
              />
            </div>

            {/* Cuisine Filter */}
            <div>
              <label className={getClass('block text-sm font-medium text-gray-700 mb-2', 'block text-sm font-medium text-gray-200 mb-2')}>Cuisine Type</label>
              <select
                value={selectedCuisine}
                onChange={handleCuisineChange}
                className={`w-full px-3 sm:px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base ${classes.input.bg} ${classes.input.border} ${classes.input.text}`}
              >
                <option value="">All Cuisines</option>
                {cuisineTypes.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className={getClass('block text-sm font-medium text-gray-700 mb-2', 'block text-sm font-medium text-gray-200 mb-2')}>Location</label>
              <select
                value={selectedLocation}
                onChange={handleLocationChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent ${classes.input.bg} ${classes.input.border} ${classes.input.text}`}
              >
                <option value="">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || selectedCuisine || selectedLocation) && (
            <div className="mt-4 text-center">
              <button
                onClick={clearFilters}
                className={getClass('px-6 py-2 text-orange-600 hover:text-orange-700 font-medium transition-colors duration-300', 'px-6 py-2 text-orange-400 hover:text-orange-300 font-medium transition-colors duration-300')}
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className={getClass('bg-red-50 border border-red-200 rounded-xl p-6 mb-8', 'bg-red-900/20 border border-red-700 rounded-xl p-6 mb-8')}>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              <div>
                <p className={getClass('text-red-800 font-medium', 'text-red-300 font-medium')}>Error loading chefs</p>
                <p className={getClass('text-red-600', 'text-red-400')}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6">
          <p className={getClass('text-lg text-gray-700', 'text-lg text-gray-300')}>
            {chefs.length === 0 ? 'No chefs found' : 
             chefs.length === 1 ? '1 chef found' : 
             `${chefs.length} chefs found`}
          </p>
        </div>

        {/* Chefs Grid */}
        {chefs.length === 0 ? (
          <div className="text-center py-16">
            <div className={getClass('inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6', 'inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-full mb-6')}>
              <svg className={getClass('w-10 h-10 text-gray-400', 'w-10 h-10 text-gray-500')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className={getClass('text-xl font-semibold text-gray-800 mb-2', 'text-xl font-semibold text-orange-300 mb-2')}>No chefs found</h3>
            <p className={getClass('text-gray-600 mb-6', 'text-gray-400 mb-6')}>Try adjusting your search criteria or clear the filters.</p>
            {(searchTerm || selectedCuisine || selectedLocation) && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {chefs.map((chef) => (
              <div key={chef._id} className={getClass('group rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border overflow-hidden bg-white border-orange-100', 'group rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border overflow-hidden bg-gray-800 border-gray-700')}>
                {/* Chef Image */}
                <div className="relative">
                  {chef.profileImage?.url ? (
                    <img
                      src={chef.profileImage.url}
                      alt={chef.name}
                      className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1659354219145-dedd2324698e?w=600&auto=format&fit=crop&q=60"
                      alt={chef.name}
                      className="w-full h-48 sm:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                 
                  
                  {/* Favorite Button */}
                  <div className="absolute top-2 left-4 sm:top-2 sm:left-4">
                    <FavoriteButton chef={chef} variant="card" />
                  </div>
                </div>

                {/* Chef Info */}
                <div className="p-4 sm:p-6">
                  <h3 className={getClass('text-lg sm:text-2xl font-bold mb-2 group-hover:text-orange-600 transition-colors duration-300 text-orange-900', 'text-lg sm:text-2xl font-bold mb-2 group-hover:text-orange-600 transition-colors duration-300 text-orange-300')}>
                    {chef.name}
                  </h3>
                  
                  {/* Specialty */}
                  {chef.specialty && (
                    <p className="text-orange-600 font-semibold mb-3 text-sm sm:text-base">
                      {chef.specialty}
                    </p>
                  )}

                  {/* Rating Badge - Professional placement */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={getClass('flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200', 'flex items-center gap-1 bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-700')}>
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span className={getClass('text-sm font-semibold text-amber-700', 'text-sm font-semibold text-amber-400')}>
                        {chef.averageRating ? chef.averageRating.toFixed(1) : 'New'}
                      </span>
                      <span className={getClass('text-xs text-amber-600', 'text-xs text-amber-500')}>
                        ({chef.totalReviews || 0})
                      </span>
                    </div>
                    
                    {/* Experience Badge */}
                    {chef.experienceYears && (
                      <div className={getClass('flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200', 'flex items-center gap-1 bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-700')}>
                        <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                        </svg>
                        <span className={getClass('text-xs font-medium text-orange-700', 'text-xs font-medium text-orange-400')}>{chef.experienceYears} yrs</span>
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  {chef.bio && (
                    <p className={getClass('text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2 text-gray-600', 'text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2 text-gray-400')}>
                      {chef.bio}
                    </p>
                  )}

                  {/* Location */}
                  {(chef.city || chef.address) && (
                    <div className="flex items-center gap-1 mb-4">
                      <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                      </svg>
                      <span className={getClass('text-xs font-medium text-gray-600', 'text-xs font-medium text-gray-400')}>
                        {chef.city || chef.address}
                      </span>
                      <span className={getClass('text-xs text-gray-500 ml-auto', 'text-xs text-gray-500 ml-auto')}>Distance: N/A</span>
                    </div>
                  )}

                  {/* Book Button - Full Width */}
                  <Link
                    to={`/book/${chef._id}`}
                    className="block w-full text-center px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] font-semibold text-sm sm:text-base"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chefs;
