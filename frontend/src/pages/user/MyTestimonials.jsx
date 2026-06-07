import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useThemeAwareStyle } from '../../utils/themeUtils';
import { buildApiEndpoint } from '../../utils/apiConfig';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyTestimonials = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useThemeAwareStyle();
  
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your testimonials');
      navigate('/login');
      return;
    }
    
    fetchMyTestimonials();
  }, [isAuthenticated, token]);

  const fetchMyTestimonials = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/testimonials/user/my-testimonials`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestimonials(response.data.testimonials || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to load your testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    try {
      await axios.delete(buildApiEndpoint(`testimonials/${id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Testimonial deleted successfully');
      setTestimonials(testimonials.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Failed to delete testimonial');
    }
  };

  const renderStars = (rating) => (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="20" height="20" fill={i < rating ? '#f59e0b' : '#d1d5db'} viewBox="0 0 20 20">
          <polygon points="10,1 12.59,7.36 19.51,7.36 13.96,11.64 16.55,18 10,13.72 3.45,18 6.04,11.64 0.49,7.36 7.41,7.36"/>
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
          <p className={`mt-4 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100'}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white py-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm mb-6">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
            My Testimonials
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto opacity-95">
            Manage and view all your shared experiences with ChefHub
          </p>
         
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-12 h-12 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-10 h-10 bg-white/15 rounded-full animate-bounce"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Testimonials List */}
        {testimonials.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-100'} rounded-3xl shadow-xl p-16 text-center border`}>
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd"></path>
              </svg>
            </div>
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
              No Testimonials Yet
            </h3>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-8 max-w-md mx-auto`}>
              Share your culinary experience with ChefHub and inspire others to discover amazing chefs
            </p>
            <button
              onClick={() => navigate('/add-testimonial')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              ✨ Create Your First Testimonial
            </button>
          </div>
        ) : (
          <>
            {/* Add New Testimonial Button */}
            <div className="mb-8 flex justify-end">
              <button
                onClick={() => navigate('/add-testimonial')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path>
                </svg>
                Add New Testimonial
              </button>
            </div>

            <div className="grid gap-8">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial._id}
                  className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-100'} rounded-2xl shadow-lg p-8 border hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-orange-500 shadow-md">
                        <img
                          src={testimonial.userProfileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.userName)}&background=f59e0b&color=fff&size=64`}
                          alt={testimonial.userName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.userName)}&background=f59e0b&color=fff&size=64`;
                          }}
                        />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {testimonial.userName}
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {testimonial.userLocation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                        </svg>
                        Published
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    {renderStars(testimonial.rating)}
                  </div>

                  <blockquote className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6 italic leading-relaxed border-l-4 border-orange-500 pl-4`}>
                    "{testimonial.testimonial}"
                  </blockquote>

                  {testimonial.chef && (
                    <div className={`${isDark ? 'bg-gray-700/50' : 'bg-orange-50'} rounded-xl p-4 mb-6`}>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                        </svg>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                          <span className="font-bold">Related Chef:</span> {testimonial.chef.name}
                          {testimonial.chef.specialty && (
                            <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              • {testimonial.chef.specialty}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={`flex justify-between items-center pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                      </svg>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(testimonial.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(testimonial._id)}
                      className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyTestimonials;
