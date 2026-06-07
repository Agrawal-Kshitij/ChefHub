import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useThemeAwareStyle } from '../../utils/themeUtils';
import { FaArrowLeft, FaUsers } from 'react-icons/fa';
import LocationInput from '../../components/booking/LocationInput';
import ChefCard from '../../components/booking/ChefCard';
import ChefInfoCard from '../../components/booking/ChefInfoCard';
import ServiceTypeSelector from '../../components/booking/ServiceTypeSelector';
import BookingScheduleForm from '../../components/booking/BookingScheduleForm';
import AddOnsSelector from '../../components/booking/AddOnsSelector';
import PricingSummary from '../../components/booking/PricingSummary';
import { geocodeAddress, getDistance, calculateTotal } from '../../components/booking/bookingUtils';

const BookChef = () => {
  const { isDark, getClass } = useThemeAwareStyle();
  const { id } = useParams();
  const navigate = useNavigate();
  const [chefs, setChefs] = useState([]);
  const [selectedChef, setSelectedChef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [userLocation, setUserLocation] = useState({ 
    address: '', 
    city: '', 
    state: '', 
    lat: '', 
    lon: '' 
  });
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  // Auto-generate complete address when city and state change
  useEffect(() => {
    if (userLocation.city && userLocation.state) {
      const autoAddress = `${userLocation.city}, ${userLocation.state}`;
      setUserLocation(prev => ({ ...prev, address: autoAddress }));
    }
  }, [userLocation.city, userLocation.state]);

  const [bookingDetails, setBookingDetails] = useState({
    serviceType: '', // New field for service type
    date: '',
    time: '',
    duration: 2, // New field for duration in hours
    guestCount: '',
    addOns: [],
    notes: '',
    location: '' // New: store address string
  });

  // Fetch Razorpay configuration from backend
  useEffect(() => {
    const fetchRazorpayConfig = async () => {
      try {
        const res = await api.get('/proxy/razorpay-config');
        const data = res.data;
        if (data.success && data.keyId) {
          setRazorpayKeyId(data.keyId);
        }
      } catch (error) {
        console.error('Failed to fetch Razorpay config:', error);
      }
    };
    fetchRazorpayConfig();
  }, []);

  useEffect(() => {
    const fetchAndSortChefs = async () => {
      try {
        setLoading(true);
        
        const res = await api.get('/chefs');
        
        const response = res.data;
        
        const chefsData = response.chefs || response.data || [];
        
        let chefList = Array.isArray(chefsData) ? chefsData : [];

        // If user location is set, sort chefs by distance using their locationCoords
        if (userLocation.lat && userLocation.lon) {
          // For each chef, calculate distance using their stored coordinates
          const chefDistances = chefList.map((chef) => {
            // Use chef's locationCoords (already in database)
            if (chef.locationCoords && chef.locationCoords.lat && chef.locationCoords.lon) {
              const distance = getDistance(
                [userLocation.lat, userLocation.lon],
                [chef.locationCoords.lat, chef.locationCoords.lon]
              );
              return { ...chef, distance: distance || Number.POSITIVE_INFINITY };
            } else {
              // No coordinates available
              return { ...chef, distance: Number.POSITIVE_INFINITY };
            }
          });
          // Sort by distance
          chefList = chefDistances.sort((a, b) => a.distance - b.distance);
        }
        
        setChefs(chefList);
        if (id && Array.isArray(chefList)) {
          const chefById = chefList.find(c => c._id === id);
          setSelectedChef(chefById);
        }
      } catch (err) {
        setChefs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAndSortChefs();
  }, [id, userLocation.lat, userLocation.lon]);

  const toggleAddOn = (addOnName) => {
    setBookingDetails(prev => ({
      ...prev,
      addOns: prev.addOns.includes(addOnName)
        ? prev.addOns.filter(a => a !== addOnName)
        : [...prev.addOns, addOnName]
    }));
  };

  const handleLocationSet = async () => {
    setLocationError('');
    setLocationLoading(true);
    const coords = await geocodeAddress(userLocation.address);
    setLocationLoading(false);
    if (coords) {
      setUserLocation({ ...userLocation, lat: coords.lat, lon: coords.lon });
    } else {
      setLocationError('Could not find this address. Please try a different one.');
    }
  };

  const handleBooking = async () => {
    if (!selectedChef) return toast.error("No chef selected");
    
    if (!bookingDetails.serviceType) {
      toast.error("Please select a service type");
      return;
    }
    
    if (!bookingDetails.date) {
      toast.error("Please select a date");
      return;
    }
    
    if (!bookingDetails.time) {
      toast.error("Please select a time");
      return;
    }
    
    if (!bookingDetails.guestCount || bookingDetails.guestCount <= 0) {
      toast.error("Please enter the number of guests");
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(bookingDetails.date + 'T' + bookingDetails.time);
    const now = new Date();
    if (selectedDate <= now) {
      toast.error("Please select a future date and time");
      return;
    }

    // Validate user location
    if (!userLocation.city || !userLocation.state || !userLocation.lat || !userLocation.lon) {
      toast.error("Please enter city, state and set your service location before booking.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error("Please log in to make a booking");
        navigate('/login');
        return;
      }

      const bookingPayload = {
        chefId: selectedChef._id,
        date: bookingDetails.date,
        time: bookingDetails.time,
        duration: parseInt(bookingDetails.duration),
        guestCount: parseInt(bookingDetails.guestCount),
        location: userLocation.address,
        locationCoords: { lat: userLocation.lat, lon: userLocation.lon },
        serviceType: bookingDetails.serviceType,
        specialRequests: bookingDetails.notes,
        addOns: bookingDetails.addOns,
        totalPrice: calculateTotal(selectedChef, bookingDetails),
        contactInfo: {
          name: "Customer Name",
          email: "customer@email.com",
          phone: "1234567890"
        }
      };

      const bookingRes = await api.post('/bookings', bookingPayload);

      const bookingResult = bookingRes.data;

      const paymentPayload = {
        amount: calculateTotal(selectedChef, bookingDetails),
        bookingId: bookingResult.booking._id,
        currency: 'INR'
      };

      const paymentRes = await api.post('/payments/create-order', paymentPayload);

      const paymentResult = paymentRes.data;
      initializeRazorpay(paymentResult.data, bookingResult.booking);

    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error booking chef. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Initialize Razorpay payment
  const initializeRazorpay = (paymentData, bookingData) => {
    if (!razorpayKeyId) {
      toast.error('Payment configuration not loaded. Please refresh the page.');
      return;
    }
    
    const options = {
      key: razorpayKeyId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: "ChefHub",
      description: `Booking ${selectedChef.name || selectedChef.fullName} for ${bookingDetails.serviceType}`,
      order_id: paymentData.orderId,
      handler: function (response) {
        verifyPayment(response, bookingData._id);
      },
      prefill: {
        name: bookingData.contactInfo?.name || "Customer",
        email: bookingData.contactInfo?.email || "customer@email.com",
        contact: "9999999999"
      },
      notes: {
        bookingId: bookingData._id,
        serviceType: bookingDetails.serviceType,
        chefName: selectedChef.name || selectedChef.fullName
      },
      theme: {
        color: "#f97316"
      },
      modal: {
        ondismiss: function() {
          handlePaymentFailure(bookingData._id, { description: "Payment cancelled by user" });
        },
        escape: true,
        backdropclose: false
      },
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    if (typeof window.Razorpay === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      script.onerror = () => {
        toast.error('Failed to load payment gateway. Please try again.');
      };
      document.body.appendChild(script);
    } else {
      const rzp = new window.Razorpay(options);
      rzp.open();
    }
  };

  // Verify payment after successful payment
  const verifyPayment = async (response, bookingId) => {
    try {
      const verificationPayload = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        bookingId: bookingId
      };

      const verifyRes = await api.post('/payments/verify', verificationPayload);

      const verifyResult = verifyRes.data;

      if (verifyResult.success) {
        toast.success("Payment successful! Your booking is confirmed.");
        navigate('/dashboard');
      } else {
        toast.error("Payment verification failed. Please contact support.");
      }
    } catch (error) {
      toast.error("Error verifying payment. Please contact support.");
    }
  };

  // Handle payment failure
  const handlePaymentFailure = async (bookingId, error) => {
    try {
      const failurePayload = {
        bookingId: bookingId,
        error: error
      };

      await api.post('/payments/failure', failurePayload);
    } catch (err) {
      // Silent error
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mb-4"></div>
          <p className={`text-xl font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Finding Top Chefs...</p>
        </div>
      </div>
    );
  }

  if (!selectedChef) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl md:text-5xl font-extrabold ${isDark ? 'text-white' : 'text-gray-900'} tracking-tight`}>
              Find Your Perfect Chef
            </h1>
            <p className={`mt-4 max-w-2xl mx-auto text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Book talented chefs for any occasion. Start by telling us your location.
            </p>
          </div>

          {/* User Location Input */}
          <LocationInput
            userLocation={userLocation}
            setUserLocation={setUserLocation}
            locationError={locationError}
            setLocationError={setLocationError}
            locationLoading={locationLoading}
            onSetLocation={handleLocationSet}
            isDark={isDark}
          />

          {/* Chefs Grid */}
          <div className="mt-16">
            {!Array.isArray(chefs) || chefs.length === 0 ? (
              <div className="text-center py-12">
                <FaUsers className={`w-20 h-20 ${isDark ? 'text-gray-700' : 'text-gray-300'} mx-auto mb-6`} />
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>No Chefs Available</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>We're expanding our network. Please check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {chefs.map((chef) => (
                  <ChefCard
                    key={chef._id}
                    chef={chef}
                    onSelect={setSelectedChef}
                    isDark={isDark}
                    getClass={getClass}
                    canBook={Boolean(userLocation.lat && userLocation.lon)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Booking form for selected chef
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <button
          onClick={() => setSelectedChef(null)}
          className={`mb-8 flex items-center font-semibold transition-colors duration-200 group ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <FaArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Chef Selection
        </button>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Left Column: Chef Info & Price Summary */}
          <div className="lg:col-span-1 space-y-8">
            {/* Chef Card */}
            <ChefInfoCard chef={selectedChef} isDark={isDark} />

            {/* Pricing Breakdown */}
            {bookingDetails.serviceType && (
              <PricingSummary
                selectedChef={selectedChef}
                bookingDetails={bookingDetails}
                total={calculateTotal(selectedChef, bookingDetails)}
                isDark={isDark}
              />
            )}
          </div>

          {/* Right Column: Booking Form */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl shadow-lg p-8 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Book Your Experience</h3>
              
              <div className="space-y-8">
                {/* Step 1: Service Type */}
                <ServiceTypeSelector
                  selectedServiceType={bookingDetails.serviceType}
                  onSelect={(serviceId, minDuration) => 
                    setBookingDetails({ ...bookingDetails, serviceType: serviceId, duration: minDuration })
                  }
                  isDark={isDark}
                />

                {/* Step 2: Schedule & Details (collapsible) */}
                {bookingDetails.serviceType && (
                  <div className="space-y-8">
                    <BookingScheduleForm
                      bookingDetails={bookingDetails}
                      setBookingDetails={setBookingDetails}
                      isDark={isDark}
                    />

                    {/* Step 3: Add-ons */}
                    <AddOnsSelector
                      serviceType={bookingDetails.serviceType}
                      selectedAddOns={bookingDetails.addOns}
                      onToggle={toggleAddOn}
                      isDark={isDark}
                    />

                    {/* Step 4: Special Requests */}
                    <div>
                      <label className="block text-lg font-semibold mb-4">4. Special Requests</label>
                      <textarea
                        value={bookingDetails.notes}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
                        placeholder="Any dietary restrictions, allergies, or other notes for the chef..."
                        className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${isDark ? 'border-gray-600 bg-gray-700 text-white focus:ring-orange-500' : 'border-gray-300 bg-white text-gray-900 focus:ring-orange-500'}`}
                        rows="4"
                      />
                    </div>

                    {/* Total and Book Button */}
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                        <span className="text-3xl font-bold text-orange-500">₹{calculateTotal(selectedChef, bookingDetails)}</span>
                      </div>
                      <button
                        onClick={handleBooking}
                        className="w-full p-4 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                      >
                        Proceed to Payment
                      </button>
                      <p className={`text-xs text-center mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>You will be redirected to our secure payment partner.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookChef;
