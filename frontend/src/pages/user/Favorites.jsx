import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useFavorites } from '../../contexts/FavoritesContext';
import FavoriteButton from '../../components/features/FavoriteButton';
import { useThemeAwareStyle } from '../../utils/themeUtils';
import api from '../../utils/api';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const geocodeAddress = async (address) => {
  try {
    const response = await api.get('/proxy/geocode', {
      params: { address }
    });
    const data = response.data;
    if (data.success && data.data) {
      return {
        latitude: data.data.latitude,
        longitude: data.data.longitude
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const Favorites = () => {
  const { isDark } = useThemeAwareStyle();
  const { favorites } = useFavorites();
  const [filter, setFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleLocationSearch = async () => {
    if (!locationFilter.trim()) return;

    setIsLoadingLocation(true);
    try {
      const coordinates = await geocodeAddress(locationFilter);
      if (coordinates) {
        setUserLocation(coordinates);
      } else {
        toast.error('Location not found. Please try a different address.');
      }
    } catch (error) {
      toast.error('Error searching for location. Please try again.');
    }
    setIsLoadingLocation(false);
  };

  const clearLocationFilter = () => {
    setUserLocation(null);
    setLocationFilter('');
  };

  let filteredChefs = filter === 'all'
    ? favorites
    : favorites.filter(chef =>
      chef.specialty?.toLowerCase().includes(filter.toLowerCase()) ||
      chef.name?.toLowerCase().includes(filter.toLowerCase())
    );

  // Apply location filtering if user location is set
  if (userLocation) {
    filteredChefs = filteredChefs.map(chef => {
      if (chef.locationCoords) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          chef.locationCoords.lat,
          chef.locationCoords.lon
        );
        return { ...chef, distance };
      }
      return chef;
    }).sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      if (a.distance) return -1;
      if (b.distance) return 1;
      return 0;
    });
  }

  const cuisineTypes = ['all', 'indian', 'italian', 'american', 'british', 'chinese', 'thai'];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100'}`}>
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-8">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            Your Favorite Chefs
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed opacity-95">
            Your carefully curated collection of exceptional chefs, ready to create memorable culinary experiences
          </p>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-12 h-12 bg-white/15 rounded-full animate-bounce"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Filter Bar */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <h2 className={`text-3xl font-bold ${isDark ? 'bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent'}`}>
              {favorites.length} Saved Chef{favorites.length !== 1 ? 's' : ''}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Filter by cuisine:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDark ? 'border-gray-600 bg-gray-700 text-gray-100' : 'border-gray-300 bg-white text-gray-700'}`}
                >
                  {cuisineTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location Filter */}
          <div className={`rounded-xl p-6 shadow-sm border mb-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Enter your location to sort by distance..."
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${isDark ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleLocationSearch}
                  disabled={isLoadingLocation || !locationFilter.trim()}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingLocation ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
                          <animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite" />
                        </circle>
                      </svg>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Sort by Distance
                    </>
                  )}
                </button>
                {userLocation && (
                  <button
                    onClick={clearLocationFilter}
                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
            {userLocation && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Showing chefs sorted by distance from your location
              </p>
            )}
          </div>
        </div>

        {/* Chefs Grid */}
        {filteredChefs.length === 0 ? (
          <div className="text-center py-16">
            <svg className={`w-24 h-24 mx-auto mb-6 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
            </svg>
            <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No favorite chefs yet</h3>
            <p className={`mb-8 max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Start exploring our amazing chefs and save your favorites to see them here.
            </p>
            <Link
              to="/book-chef"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
            >
              Discover Chefs
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {filteredChefs.map((chef) => (
              <div key={chef._id} className={`group rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-100'}`}>
                <div className="relative">
                  <img
                    src={chef.profileImage?.url || chef.photo || 'https://images.unsplash.com/photo-1659354219145-dedd2324698e?w=600&auto=format&fit=crop&q=60'}
                    alt={chef.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = 'https://images.unsplash.com/photo-1659354219145-dedd2324698e?w=600&auto=format&fit=crop&q=60';
                    }}
                  />
                  {/* <div className="absolute top-2 left-15">
                    <FavoriteButton chef={chef} variant="card" />
                  </div> */}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`text-2xl font-bold group-hover:text-orange-600 transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {chef.name}
                      </h3>
                      <p className={`font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>{chef.specialty}</p>
                    </div>

                  </div>
                  <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{chef.bio}</p>

                  <div className="space-y-2 mb-4">
                    <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path>
                      </svg>
                      {chef.distance ? (
                        <span className={`font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                          {chef.distance.toFixed(1)} km away
                        </span>
                      ) : (
                        chef.serviceableLocations?.length > 0 ? chef.serviceableLocations[0] : 'Location not specified'
                      )}
                    </div>
                    <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                      </svg>
                      {chef.experienceYears} years experience
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                      ))}
                      <span className={`text-sm ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>(4.5)</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/book-chef?chef=${chef._id}`}
                      className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
                    >
                      Book Now
                    </Link>
                    <FavoriteButton
                      chef={chef}
                      variant="icon"
                      className={`px-4 py-2 rounded-xl transition-all duration-300 border font-semibold ${isDark ? 'bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 border-amber-700' : 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {filteredChefs.length > 0 && (
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 text-white">
              <h3 className="text-3xl font-bold mb-4">Ready to Book Your Next Experience?</h3>
              <p className="text-xl mb-8 opacity-95">Choose from your favorite chefs and create unforgettable memories</p>
              <Link
                to="/book-chef"
                className={`inline-flex items-center px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold ${isDark ? 'bg-gray-800 text-orange-400' : 'bg-white text-orange-600'}`}
              >
                Explore More Chefs
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

export default Favorites;
