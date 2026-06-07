import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const geocodeAddress = async (address) => {
  try {
    const response = await api.get(`/proxy/geocode?address=${encodeURIComponent(address)}`);
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

const AdvancedSearch = ({ onResults, onFiltersChange }) => {
  const [filters, setFilters] = useState({
    query: '',
    cuisineTypes: [],
    priceRange: { min: 0, max: 10000 },
    experience: { min: 0, max: 20 },
    rating: 0,
    availability: '',
    location: '',
    city: '',
    state: '',
    specialDiets: [],
    serviceTypes: []
  });

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const cuisineOptions = [
    'North Indian', 'South Indian', 'Continental', 'Chinese', 
    'Italian', 'Mexican', 'Thai', 'Japanese', 'Mediterranean'
  ];

  const dietOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Diabetic-Friendly', 'Jain'
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleLocationSearch = async () => {
    if (!filters.location.trim()) return;
    
    setIsLoadingLocation(true);
    try {
      const coordinates = await geocodeAddress(filters.location);
      if (coordinates) {
        setUserLocation(coordinates);
      } else {
        toast.error('Location not found. Please try a different address.');
      }
    } catch {
      toast.error('Error searching for location. Please try again.');
    }
    setIsLoadingLocation(false);
  };

  const handleArrayFilter = (key, value, checked) => {
    const currentArray = filters[key];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, newArray);
  };

  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      // Enhanced search with multiple parameters
      const searchParams = new URLSearchParams();
      
      if (filters.query) searchParams.append('q', filters.query);
      if (filters.cuisineTypes.length) searchParams.append('cuisine', filters.cuisineTypes.join(','));
      if (filters.priceRange.min) searchParams.append('minPrice', filters.priceRange.min);
      if (filters.priceRange.max) searchParams.append('maxPrice', filters.priceRange.max);
      if (filters.rating) searchParams.append('minRating', filters.rating);
      if (filters.location) searchParams.append('location', filters.location);
      if (filters.city) searchParams.append('city', filters.city);
      if (filters.state) searchParams.append('state', filters.state);

      const response = await api.get(`/chefs/search?${searchParams.toString()}`);
      let results = response.data.data || [];
      
      // If user has set a location, calculate distances and sort by distance
      if (userLocation) {
        results = results.map(chef => {
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
          // Sort by distance if both have distance, otherwise by rating
          if (a.distance && b.distance) return a.distance - b.distance;
          if (a.distance) return -1;
          if (b.distance) return 1;
          return (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0);
        });
      }
      
      setSearchResults(results);
      onResults?.(results);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters, userLocation, onResults]);

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      cuisineTypes: [],
      priceRange: { min: 0, max: 10000 },
      experience: { min: 0, max: 20 },
      rating: 0,
      availability: '',
      location: '',
      city: '',
      state: '',
      specialDiets: [],
      serviceTypes: []
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (filters.query.length >= 2 || Object.values(filters).some(v => 
        Array.isArray(v) ? v.length > 0 : v !== '' && v !== 0
      )) {
        performSearch();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters, performSearch]);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          ðŸ” Smart Chef Search
        </h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
        >
          {showAdvanced ? 'Simple Search' : 'Advanced Filters'}
        </button>
      </div>

      {/* Basic Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={filters.query}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            placeholder="Search chefs by name, specialty, or cuisine..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
          </svg>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6 border-t pt-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Price Range (Rs./hour)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.priceRange.min}
                onChange={(e) => handleFilterChange('priceRange', { 
                  ...filters.priceRange, 
                  min: parseInt(e.target.value) || 0 
                })}
                placeholder="Min price"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                value={filters.priceRange.max}
                onChange={(e) => handleFilterChange('priceRange', { 
                  ...filters.priceRange, 
                  max: parseInt(e.target.value) || 10000 
                })}
                placeholder="Max price"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Cuisine Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cuisine Specialties
            </label>
            <div className="grid grid-cols-3 gap-2">
              {cuisineOptions.map((cuisine) => (
                <label key={cuisine} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.cuisineTypes.includes(cuisine)}
                    onChange={(e) => handleArrayFilter('cuisineTypes', cuisine, e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{cuisine}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Minimum Rating
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('rating', rating)}
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    filters.rating >= rating
                      ? 'bg-yellow-400 border-yellow-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-yellow-50'
                  }`}
                >
                  {rating}⭐
                </button>
              ))}
            </div>
          </div>

          {/* Experience Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Experience (years)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.experience.min}
                onChange={(e) => handleFilterChange('experience', { 
                  ...filters.experience, 
                  min: parseInt(e.target.value) || 0 
                })}
                placeholder="Min years"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="number"
                value={filters.experience.max}
                onChange={(e) => handleFilterChange('experience', { 
                  ...filters.experience, 
                  max: parseInt(e.target.value) || 20 
                })}
                placeholder="Max years"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Special Diets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dietary Specializations
            </label>
            <div className="grid grid-cols-3 gap-2">
              {dietOptions.map((diet) => (
                <label key={diet} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.specialDiets.includes(diet)}
                    onChange={(e) => handleArrayFilter('specialDiets', diet, e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{diet}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ðŸ“ Location Details
            </label>
            
            {/* City and State Row */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="e.g., Mumbai, Delhi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  placeholder="e.g., Maharashtra, Delhi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Area/Address for Distance */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Specific Area/Address (for distance sorting)
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                placeholder="Enter area, landmark, or address for distance calculation"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Add for sorting chefs by distance from your location
              </p>
            </div>

            {/* Set Location Button */}
            <div className="flex gap-2 items-center">
              <button
                onClick={handleLocationSearch}
                disabled={isLoadingLocation || !filters.location.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {isLoadingLocation ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
                      <animate attributeName="stroke-dashoffset" dur="1s" values="32;0" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                )}
                Set Location
              </button>
              {userLocation && (
                <span className="text-green-600 text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Location set!
                </span>
              )}
            </div>
            
            <p className="text-xs text-purple-600 mt-2">
              ðŸ’¡ City/state filters help find chefs in your area, even when multiple cities share the same name
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={performSearch}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'ðŸ” Searching...' : 'ðŸ” Search Chefs'}
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {searchResults.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-green-800 font-medium">
              Found {searchResults.length} chef{searchResults.length !== 1 ? 's' : ''} matching your criteria
            </span>
            <span className="text-green-600 text-sm">
              ✨ Results optimized by AI
            </span>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-6 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mr-3"></div>
          <span className="text-gray-600">Searching for the perfect chefs...</span>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
