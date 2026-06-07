import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useThemeAwareStyle } from '../../utils/themeUtils';
import { useAuth } from '../../context/AuthContext';
import TextInput from '../../components/inputs/TextInput';
import CheckboxGroup from '../../components/inputs/CheckboxGroup';
import TextareaInput from '../../components/inputs/TextareaInput';
import { prepareImageForUpload } from '../../utils/imageOptimizer';

const ChefOnboarding = () => {
  const { getClass, classes } = useThemeAwareStyle();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialties: [],
    bio: '',
    serviceTypes: '', // Changed: Single service type selection
    rates: {
      birthday: '',
      marriage: '',
      daily: ''
    },
    experience: '',
    profileImage: null,
    certifications: [],
    availability: 'full-time',
    address: '',
    city: '',
    state: '',
    locationLat: '',
    locationLon: ''
  });

  const cuisineOptions = [
    'Indian', 'Italian', 'Mexican', 'Chinese', 'Thai', 'French', 
    'Mediterranean', 'Japanese', 'Korean', 'Lebanese', 'Continental'
  ];

  const serviceTypeOptions = [
    { value: 'birthday', label: '🎂 Birthday Parties', description: 'Celebrate special birthdays with custom menus' },
    { value: 'marriage', label: '💍 Wedding Events', description: 'Catering for weddings and receptions' },
    { value: 'daily', label: '🍳 Daily Meal Service', description: 'Regular home cooking and meal prep' }
  ];

  const certificationOptions = [
    'Culinary Arts Diploma', 'Food Safety Certification', 'Pastry Arts',
    'Wine Sommelier', 'Nutrition Specialist', 'Organic Cooking'
  ];

  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  // Auto-populate email from logged-in user
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  // Auto-generate complete address when city and state change
  useEffect(() => {
    if (formData.city && formData.state) {
      const autoAddress = `${formData.city}, ${formData.state}`;
      setFormData(prev => ({ ...prev, address: autoAddress }));
    }
  }, [formData.city, formData.state]);

  // Geocode address to lat/lon using backend proxy (avoids CORS)
  const geocodeAddress = async (address) => {
    try {
      setLocationLoading(true);
      
      const response = await api.post('/geocode', { address });
      
      
      const data = response.data;
      
      if (data.features && data.features.length > 0) {
        const coords = data.features[0].geometry.coordinates;
        setLocationError(''); // Clear any previous errors
        return { lat: coords[1], lon: coords[0] };
      } else {
        setLocationError('No location found for this address. Please try a more specific address.');
        return null;
      }
    } catch (e) {
      const errorMessage = e.response?.data?.error || 'Network error. Please check your connection and try again.';
      setLocationError(`Geocoding failed: ${errorMessage}`);
      return null;
    } finally {
      setLocationLoading(false);
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (option) => {
    setFormData((prev) => {
      const updated = prev.specialties.includes(option)
        ? prev.specialties.filter((c) => c !== option)
        : [...prev.specialties, option];
      return { ...prev, specialties: updated };
    });
  };

  const handleCertificationChange = (option) => {
    setFormData((prev) => {
      const updated = prev.certifications.includes(option)
        ? prev.certifications.filter((c) => c !== option)
        : [...prev.certifications, option];
      return { ...prev, certifications: updated };
    });
  };

  const handleServiceTypeChange = (serviceType) => {
    setFormData((prev) => ({ ...prev, serviceTypes: serviceType }));
  };

  const handleRateChange = (serviceType, value) => {
    setFormData((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [serviceType]: value
      }
    }));
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      try {
        // Optimize image before setting it
        const optimizedFile = await prepareImageForUpload(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85
        });
        
        setFormData(prev => ({ ...prev, [name]: optimizedFile }));
      } catch (error) {
        toast.error(error.message || 'Failed to process image');
      }
    }
  };

  const getValidationErrors = () => {
    const errors = [];
    
    // Validate full name
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    if (!formData.fullName) {
      errors.push('Full name is required');
    } else if (!nameRegex.test(formData.fullName)) {
      errors.push('Full name should only contain letters and spaces (2-50 characters)');
    }

    // Validate email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email) {
      errors.push('Email address is required');
    } else if (!emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    // Validate phone
    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!formData.phone) {
      errors.push('Phone number is required');
    } else if (!phoneRegex.test(formData.phone)) {
      errors.push('Phone number must be 10 digits starting with 6, 7, 8, or 9');
    }

    // Validate specialties
    if (formData.specialties.length === 0) {
      errors.push('Please select at least one specialty');
    }

    // Validate service types
    if (!formData.serviceTypes) {
      errors.push('Please select a service type');
    }

    // Validate rates for selected service type
    if (formData.serviceTypes) {
      const serviceType = formData.serviceTypes;
      const rate = formData.rates[serviceType];
      if (!rate || rate === '') {
        const serviceLabel = serviceTypeOptions.find(s => s.value === serviceType)?.label || serviceType;
        errors.push(`Rate is required for ${serviceLabel}`);
      } else if (rate < 500 || rate > 50000) {
        const serviceLabel = serviceTypeOptions.find(s => s.value === serviceType)?.label || serviceType;
        errors.push(`Rate for ${serviceLabel} must be between Rs. 500 and Rs. 50,000`);
      }
    }
    if (!formData.state) {
      errors.push('State is required');
    }
    // Address is auto-generated, so just check that city and state create a valid address
    if (!formData.address || formData.address.trim() === '') {
      errors.push('Address could not be generated. Please ensure city and state are filled correctly');
    }
    if (!formData.locationLat || !formData.locationLon) {
      errors.push('You must set your location using the Set Location button');
    }

    // Validate bio
    if (!formData.bio) {
      errors.push('Professional bio is required');
    } else if (formData.bio.length < 50) {
      errors.push('Bio must be at least 50 characters long');
    } else if (formData.bio.length > 1000) {
      errors.push('Bio must not exceed 1000 characters');
    }

    // Remove individual rate validation (now handled in service types section)

    // Validate experience
    if (!formData.experience) {
      errors.push('Years of experience is required');
    } else if (formData.experience < 1 || formData.experience > 50) {
      errors.push('Experience must be between 1 and 50 years');
    }

    return errors;
  };

  // Calculate actual completion based on filled fields (not just absence of errors)
  const getCompletionProgress = () => {
    let completed = 0;
    // 10 required fields: name, email, phone, specialties, serviceTypes, bio, rates (for selected services), experience, address, location
    const totalFields = 10;
    if (formData.fullName && formData.fullName.trim() !== '') completed++;
    if (formData.email && formData.email.trim() !== '') completed++;
    if (formData.phone && formData.phone.trim() !== '') completed++;
    if (formData.specialties.length > 0) completed++;
    if (formData.serviceTypes) completed++;
    if (formData.bio && formData.bio.trim() !== '' && formData.bio.length >= 50) completed++;
    // Check if rate is filled for selected service type
    if (formData.serviceTypes && formData.rates[formData.serviceTypes] && formData.rates[formData.serviceTypes] !== '') completed++;
    if (formData.experience && formData.experience !== '') completed++;
    if (formData.address && formData.address.trim() !== '') completed++;
    if (formData.locationLat && formData.locationLon) completed++;
    return { completed, total: totalFields };
  };

  const validateForm = () => {
    return getValidationErrors().length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    const validationErrors = getValidationErrors();
    if (validationErrors.length > 0) {
      toast.error('Please fix the following errors: ' + validationErrors.join('; '));
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Create FormData to handle file upload
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('name', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('specialty', formData.specialties.join(', '));
      formDataToSend.append('bio', formData.bio);
      
      // Add service types and rates
      // Send as array for backward compatibility if needed, or just as is. 
      // Since backend ignores it mostly but frontend might use it later, let's send as array of 1.
      formDataToSend.append('serviceTypes', JSON.stringify([formData.serviceTypes]));
      formDataToSend.append('rates', JSON.stringify(formData.rates));
      
      // Calculate average rate (just the single rate now)
      const rate = Number(formData.rates[formData.serviceTypes]);
      const avgRate = !isNaN(rate) ? rate : 0;
      formDataToSend.append('pricePerHour', avgRate);
      
      formDataToSend.append('experienceYears', Number(formData.experience));
      formDataToSend.append('certifications', formData.certifications.join(', '));
      formDataToSend.append('availability', formData.availability);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      // Add serviceableLocations as a single-item array with the address
      if (formData.address && formData.address.trim() !== '') {
        formDataToSend.append('serviceableLocations', formData.address);
      }
      if (formData.locationLat && formData.locationLon) {
        formDataToSend.append('locationCoords[lat]', formData.locationLat);
        formDataToSend.append('locationCoords[lon]', formData.locationLon);
      }
      
      // Add profile image if uploaded
      if (formData.profileImage) {
        formDataToSend.append('profileImage', formData.profileImage);
      }

      // Log FormData contents
      for (let [key, value] of formDataToSend.entries()) {
        if (key === 'profileImage') {
          console.log(`${key}: [File]`);
        } else {
          console.log(`${key}:`, value);
        }
      }

      const response = await api.post('/chefs', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Chef onboarding response:', response.data);
      
      // Success message and redirect
      toast.success('Chef profile created successfully! Redirecting to dashboard...');
      navigate('/dashboard');
      
    } catch (error) {
      
      // More user-friendly error messages
      let userMessage = error.message;
      if (error.message && error.message.includes('Network Error')) {
        userMessage = 'Unable to connect to server. Please check if the backend is running on port 5000.';
      } else if (error.response?.data?.message) {
        userMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        userMessage = error.response.data.error;
      }
      
      if (userMessage && userMessage.includes('email already exists')) {
        userMessage = 'This email is already registered. Please use a different email address.';
      }
      
      toast.error(`Error: ${userMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
  <div className={getClass('min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100', 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900')}>
      {/* Header */}
  <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-16">
  <div className="absolute inset-0 bg-black/20"></div>
  <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm mb-6">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            Join Our Chef Community
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto opacity-95">
            Create your professional chef profile and start connecting with food enthusiasts
          </p>
        </div>
        
        {/* Floating elements */}
  <div className="absolute top-10 left-10 w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
  <div className="absolute bottom-10 right-10 w-8 h-8 bg-white/15 rounded-full animate-bounce"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className={getClass('bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-orange-100', 'bg-gray-900 rounded-3xl shadow-xl p-8 md:p-12 border border-gray-800')}>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
              Chef Registration
            </h2>
            <p className={getClass('text-gray-600 mb-4', 'text-gray-300 mb-4')}>Complete your profile to join our chef community</p>
            
            {/* Progress Indicator */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className={getClass('text-sm font-medium text-gray-600', 'text-sm font-medium text-gray-300')}>Profile Completion</span>
                <span className="text-sm font-medium text-orange-600">
                  {Math.round((getCompletionProgress().completed / getCompletionProgress().total) * 100)}%
                </span>
              </div>
              <div className={getClass('w-full bg-gray-200 rounded-full h-2', 'w-full bg-gray-700 rounded-full h-2')}>
                <div 
                  className="bg-gradient-to-r from-orange-600 to-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((getCompletionProgress().completed / getCompletionProgress().total) * 100)}%` }}
                ></div>
              </div>
              <p className={getClass('text-xs text-gray-500 mt-1', 'text-xs text-gray-400 mt-1')}>
                {getCompletionProgress().completed} of {getCompletionProgress().total} required fields completed
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className={getClass('text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2', 'text-xl font-semibold text-orange-300 border-b border-gray-700 pb-2')}>
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <TextInput
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  minLength="2"
                  maxLength="50"
                  pattern="^[a-zA-Z\s]+$"
                  title="Name should only contain letters and spaces (2-50 characters)"
                  required
                />
                <TextInput
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  type="email"
                  maxLength="100"
                  pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                  readOnly
                  disabled
                  required
                />
              </div>
              {/* Location Input */}
              <div>
                <label className={getClass('block text-sm font-medium text-gray-700 mb-3', 'block text-sm font-medium text-gray-200 mb-3')}>
                  Location
                </label>
                
                {/* City and State Row */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={getClass('block text-xs font-medium text-gray-600 mb-1', 'block text-xs font-medium text-gray-300 mb-1')}>City <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className={getClass('block text-xs font-medium text-gray-600 mb-1', 'block text-xs font-medium text-gray-300 mb-1')}>State <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Auto-Generated Address Display */}
                <div className="mb-4">
                  <label className={getClass('block text-xs font-medium text-gray-600 mb-1', 'block text-xs font-medium text-gray-300 mb-1')}>
                    Address
                  </label>
                  <div className={getClass('w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700', 'w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-800 text-gray-300')}>
                    {formData.address || 'Address will be auto-generated'}
                  </div>
                </div>

                {/* Geocode / Clear Location Button (single button, two modes) */}
                <div className="flex gap-3 items-center">
                  <button
                    type="button"
                    className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-semibold shadow hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      // In "set" mode, require city & state & not loading
                      (!formData.locationLat || !formData.locationLon)
                        ? (!formData.city || !formData.state || locationLoading)
                        // In "clear" mode, never disable (unless you want to guard on loading)
                        : false
                    }
                    onClick={async () => {
                      // CLEAR MODE: location already set -> clear it
                      if (formData.locationLat && formData.locationLon) {
                        setFormData(prev => ({ ...prev, locationLat: '', locationLon: '' }));
                        setLocationError('');
                        return;
                      }

                      // SET MODE: validate city/state first
                      if (!formData.city || !formData.state) {
                        setLocationError('Please enter both city and state first');
                        return;
                      }

                      setLocationError('');

                      const coords = await geocodeAddress(formData.address);
                      if (coords) {
                        setFormData(prev => ({ ...prev, locationLat: coords.lat, locationLon: coords.lon }));
                      } else {
                        // Error message already handled in geocodeAddress
                      }
                    }}
                  >
                    {formData.locationLat && formData.locationLon
                      ? 'Clear Location'
                      : (locationLoading ? 'Setting...' : 'Set Location')}
                  </button>
                  {formData.locationLat && formData.locationLon && (
                    <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Location verified
                    </span>
                  )}
                </div>
                {locationError && <p className="text-red-500 text-xs mt-2">{locationError}</p>}
              </div>
              
              <TextInput
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                type="tel"
                pattern="^[6-9][0-9]{9}$"
                minLength="10"
                maxLength="10"
                title="Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)"
                required
              />
            </div>

            {/* Culinary Expertise Section */}
            <div className="space-y-6">
              <h3 className={getClass('text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2', 'text-xl font-semibold text-orange-300 border-b border-gray-700 pb-2')}>
                Culinary Expertise
              </h3>
              
              <CheckboxGroup
                label="Specialties"
                options={cuisineOptions}
                selectedOptions={formData.specialties}
                onChange={handleCheckboxChange}
              />
              
              <TextareaInput
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Describe your culinary experience and expertise (50-1000 characters)"
                minLength="50"
                maxLength="1000"
                required
                rows={5}
              />
            </div>

            {/* Professional Details Section */}
            <div className="space-y-6">
              <h3 className={getClass('text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2', 'text-xl font-semibold text-orange-300 border-b border-gray-700 pb-2')}>
                Service Types & Pricing
              </h3>
              
              {/* Service Type Selection */}
              <div>
                <label className={getClass('block text-sm font-medium text-gray-700 mb-3', 'block text-sm font-medium text-gray-200 mb-3')}>
                  Service Types <span className="text-red-500">*</span>
                </label>
                <div className="grid gap-4">
                  {serviceTypeOptions.map((service) => (
                    <div
                      key={service.value}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        formData.serviceTypes === service.value
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-300 hover:border-orange-300 dark:border-gray-700 dark:hover:border-orange-700'
                      }`}
                      onClick={() => handleServiceTypeChange(service.value)}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="radio"
                          name="serviceType"
                          checked={formData.serviceTypes === service.value}
                          onChange={() => handleServiceTypeChange(service.value)}
                          className="mt-1 w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <h4 className={getClass('font-semibold text-gray-900', 'font-semibold text-gray-100')}>
                            {service.label}
                          </h4>
                          
                          {/* Rate Input for Selected Service */}
                          {formData.serviceTypes === service.value && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <label className={getClass('block text-xs font-medium text-gray-600 mb-2', 'block text-xs font-medium text-gray-300 mb-2')}>
                                Rate (INR) <span className="text-red-500">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">₹</span>
                                <input
                                  type="number"
                                  min="500"
                                  max="50000"
                                  step="100"
                                  value={formData.rates[service.value] || ''}
                                  onChange={(e) => handleRateChange(service.value, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="2000"
                                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${classes.input.bg} ${classes.input.border} ${classes.input.text}`}
                                  required
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <TextInput
                label="Experience (Years)"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="5"
                type="number"
                min="1"
                max="50"
                step="1"
                required
              />
              
              <div>
                <label className={getClass('block text-sm font-medium text-gray-700 mb-2', 'block text-sm font-medium text-gray-200 mb-2')}>
                  Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${classes.input.bg} ${classes.input.border} ${classes.input.text}`}
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="weekends">Weekends only</option>
                  <option value="events">Events only</option>
                </select>
              </div>
            </div>

            {/* Additional Qualifications Section */}
            <div className="space-y-6">
              <h3 className={getClass('text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2', 'text-xl font-semibold text-orange-300 border-b border-gray-700 pb-2')}>
                Additional Qualifications
              </h3>
              
              <CheckboxGroup
                label="Certifications (Optional)"
                options={certificationOptions}
                selectedOptions={formData.certifications}
                onChange={handleCertificationChange}
              />
              
              <div>
                <label className={getClass('block text-sm font-medium text-gray-700 mb-2', 'block text-sm font-medium text-gray-200 mb-2')}>
                  Profile Picture (Optional)
                </label>
                <input
                  type="file"
                  name="profileImage"
                  onChange={handleFileChange}
                  accept="image/*"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 ${classes.input.bg} ${classes.input.border} ${classes.input.text}`}
                />
                {formData.profileImage && (
                  <div className="mt-2">
                    <p className={getClass('text-sm text-gray-600', 'text-sm text-gray-400')}>
                      {formData.profileImage.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Status Section */}
            {!validateForm() && getValidationErrors().length > 0 && (
              <div className={getClass('bg-yellow-50 border border-yellow-200 rounded-xl p-4', 'bg-yellow-900/20 border border-yellow-700 rounded-xl p-4')}>
                <p className={getClass('text-sm font-medium text-yellow-800 mb-2', 'text-sm font-medium text-yellow-300 mb-2')}>Please complete required fields:</p>
                <ul className="list-disc list-inside space-y-1">
                  {getValidationErrors().map((error, index) => (
                    <li key={index} className={getClass('text-sm text-yellow-700', 'text-sm text-yellow-300')}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <div className={getClass('flex justify-center pt-8 border-t border-gray-200', 'flex justify-center pt-8 border-t border-gray-700')}>
              <button
                type="submit"
                disabled={isSubmitting || !validateForm()}
                className={`px-12 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  isSubmitting || !validateForm()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChefOnboarding;

