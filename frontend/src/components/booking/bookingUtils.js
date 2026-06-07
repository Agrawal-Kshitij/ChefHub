import { buildApiEndpoint } from '../../utils/apiConfig';
import { serviceTypes, getAddOnsForService } from './bookingConstants.jsx';

// Helper function for fetch with timeout and retry
const fetchWithRetry = async (url, options = {}, retries = 2, timeout = 10000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

// Geocode address to lat/lon using backend proxy (with rate limiting)
export const geocodeAddress = async (address) => {
  try {
    // Add a small delay to prevent rate limiting (stagger requests)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const res = await fetchWithRetry(
      `${buildApiEndpoint('')}proxy/geocode?address=${encodeURIComponent(address)}`,
      { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!res.ok) {
      console.warn(`Geocoding failed with status: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    if (data.success && data.data) {
      return { 
        lat: data.data.latitude, 
        lon: data.data.longitude 
      };
    }
    return null;
  } catch (e) {
    console.error('Geocoding error:', e.message || e);
    return null;
  }
};

// Calculate distance (meters) between two [lat, lon] points using Haversine formula
// Expected format: [latitude, longitude]
export const getDistance = (from, to) => {
  try {
    // Validate input coordinates
    if (!from || !to || from.length !== 2 || to.length !== 2) {
      console.warn('Invalid coordinates provided to getDistance');
      return null;
    }

    // Haversine formula for calculating great-circle distance
    const toRad = (value) => (value * Math.PI) / 180;
    
    const [lat1, lon1] = from; // Correct order: latitude first, longitude second
    const [lat2, lon2] = to;
    
    // Validate coordinate ranges
    if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lon1) > 180 || Math.abs(lon2) > 180) {
      console.warn('Coordinates out of valid range');
      return null;
    }
    
    // Earth's radius in meters
    const R = 6371000;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Return distance in meters, rounded to nearest meter
    return Math.round(distance);
  } catch (e) {
    console.error('Distance calculation error:', e.message || e);
    return null;
  }
};

// Calculate total booking price
export const calculateTotal = (selectedChef, bookingDetails) => {
  if (!selectedChef || !bookingDetails.serviceType) return 0;
  
  const selectedService = serviceTypes.find(service => service.id === bookingDetails.serviceType);
  if (!selectedService) return 0;

  // Base price calculation
  let basePrice = selectedChef.pricePerHour || selectedChef.rate || 1200;
  
  // Apply service type multiplier
  basePrice *= selectedService.baseMultiplier;
  
  // Calculate for duration
  const duration = parseInt(bookingDetails.duration) || selectedService.minDuration;
  let totalBasePrice = basePrice * duration;

  // Guest count adjustments
  const guestCount = parseInt(bookingDetails.guestCount) || 1;
  let guestMultiplier = 1;
  
  if (bookingDetails.serviceType === 'marriage') {
    // Marriage events scale significantly with guest count
    if (guestCount > 100) guestMultiplier = 2.0;
    else if (guestCount > 50) guestMultiplier = 1.5;
    else if (guestCount > 25) guestMultiplier = 1.2;
  } else if (bookingDetails.serviceType === 'birthday') {
    // Birthday parties moderate scaling
    if (guestCount > 20) guestMultiplier = 1.3;
    else if (guestCount > 10) guestMultiplier = 1.15;
  } else if (bookingDetails.serviceType === 'daily') {
    // Daily cook - minimal scaling
    if (guestCount > 6) guestMultiplier = 1.1;
  }

  totalBasePrice *= guestMultiplier;

  // Weekend premium (only for special events)
  if (bookingDetails.date && (bookingDetails.serviceType === 'birthday' || bookingDetails.serviceType === 'marriage')) {
    const selectedDate = new Date(bookingDetails.date);
    const isWeekend = selectedDate.getDay() === 0 || selectedDate.getDay() === 6;
    if (isWeekend) {
      totalBasePrice *= 1.2; // 20% weekend premium
    }
  }

  // Add-ons calculation
  const currentAddOns = getAddOnsForService(bookingDetails.serviceType);
  const addOnTotal = bookingDetails.addOns.reduce((total, addOnName) => {
    const addOn = currentAddOns.find(opt => opt.name === addOnName);
    return total + (addOn ? addOn.price : 0);
  }, 0);

  // GST calculation (18%)
  const subtotal = totalBasePrice + addOnTotal;

  return Math.round(subtotal);
};

// Helper function to get pricing breakdown
export const getPricingBreakdown = (selectedChef, bookingDetails) => {
  if (!selectedChef || !bookingDetails.serviceType) return null;
  
  const selectedService = serviceTypes.find(service => service.id === bookingDetails.serviceType);
  if (!selectedService) return null;

  let basePrice = selectedChef.pricePerHour || selectedChef.rate || 1200;
  basePrice *= selectedService.baseMultiplier;
  
  const duration = parseInt(bookingDetails.duration) || selectedService.minDuration;
  const guestCount = parseInt(bookingDetails.guestCount) || 1;
  
  let guestMultiplier = 1;
  if (bookingDetails.serviceType === 'marriage') {
    if (guestCount > 100) guestMultiplier = 2.0;
    else if (guestCount > 50) guestMultiplier = 1.5;
    else if (guestCount > 25) guestMultiplier = 1.2;
  } else if (bookingDetails.serviceType === 'birthday') {
    if (guestCount > 20) guestMultiplier = 1.3;
    else if (guestCount > 10) guestMultiplier = 1.15;
  } else if (bookingDetails.serviceType === 'daily') {
    if (guestCount > 6) guestMultiplier = 1.1;
  }

  const baseTotal = basePrice * duration * guestMultiplier;
  
  const currentAddOns = getAddOnsForService(bookingDetails.serviceType);
  const addOnTotal = bookingDetails.addOns.reduce((total, addOnName) => {
    const addOn = currentAddOns.find(opt => opt.name === addOnName);
    return total + (addOn ? addOn.price : 0);
  }, 0);

  const subtotal = baseTotal + addOnTotal;

  return {
    baseRate: basePrice,
    duration,
    guestMultiplier,
    baseTotal,
    addOnTotal,
    subtotal,
    total: Math.round(subtotal)
  };
};
