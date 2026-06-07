import React from 'react';
import { FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';

const LocationInput = ({ 
  userLocation, 
  setUserLocation, 
  locationError, 
  locationLoading, 
  onSetLocation,
  isDark 
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <label className={`flex items-center text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
          <FaMapMarkerAlt className="mr-3 text-orange-500" />
          Your Service Location
        </label>
        
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>City *</label>
            <input
              type="text"
              placeholder="e.g., Mumbai"
              value={userLocation.city}
              onChange={e => setUserLocation({ ...userLocation, city: e.target.value, address: `${e.target.value}, ${userLocation.state}` })}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>State *</label>
            <input
              type="text"
              placeholder="e.g., Maharashtra"
              value={userLocation.state}
              onChange={e => setUserLocation({ ...userLocation, state: e.target.value, address: `${userLocation.city}, ${e.target.value}` })}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${isDark ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-orange-500 focus:border-orange-500'}`}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold shadow-md hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={!userLocation.city || !userLocation.state || locationLoading}
            onClick={onSetLocation}
          >
            {locationLoading ? 'Verifying...' : 'Set Location & Find Chefs'}
          </button>
          {userLocation.lat && userLocation.lon && (
            <span className="text-sm flex items-center gap-1 text-green-500">
              <FaCheckCircle />
              Location Verified! Chefs sorted by distance.
            </span>
          )}
        </div>
        {locationError && <p className="text-sm text-red-500 mt-2">{locationError}</p>}
      </div>
    </div>
  );
};

export default LocationInput;
