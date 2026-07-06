import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { buildApiEndpoint, API_BASE_URL } from '../../utils/apiConfig';
import logo from '../../assets/logo.png';
import { useThemeAwareStyle } from '../../utils/themeUtils';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme, isDark } = useThemeAwareStyle();

  // Get the page user was trying to access before being redirected to login
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      const response = await axios.post(buildApiEndpoint('auth/resend-verification'), {
        email: credentials.email
      });
      
      setError({
        message: response.data.message || 'Verification email sent successfully!',
        isSuccess: true
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(buildApiEndpoint('auth/login'), credentials);
      const { token, user } = response.data;

      // Use AuthContext login method
      login(token, {
        id: user.id,
        email: user.email,
        name: user.name
      });

      // Navigate to intended destination or dashboard
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (error) {
      const errorData = error.response?.data;
      
      // Handle unverified email
      if (errorData?.emailNotVerified) {
        setError({
          message: errorData.message,
          canResend: true
        });
      } else if (errorData?.isOAuthUser) {
        setError({
          message: errorData.message,
          showResetPassword: true
        });
      } else {
        setError(errorData?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
  <div className="relative min-h-screen overflow-hidden">
      {/* Dynamic Saffron Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-orange-50 via-amber-100 to-orange-100'}`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,183,77,0.3),rgba(255,255,255,0))]"></div>
        {/* Floating Saffron Elements */}
        <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse ${isDark ? 'bg-gradient-to-r from-orange-900/20 to-amber-900/20' : 'bg-gradient-to-r from-orange-200/30 to-amber-300/30'}`}></div>
        <div className={`absolute top-3/4 right-1/4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse ${isDark ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20' : 'bg-gradient-to-r from-yellow-200/30 to-orange-400/30'}`} style={{animationDelay: '2s'}}></div>
        <div className={`absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse ${isDark ? 'bg-gradient-to-r from-amber-900/20 to-yellow-900/20' : 'bg-gradient-to-r from-amber-200/30 to-yellow-300/30'}`} style={{animationDelay: '4s'}}></div>
        <div className={`absolute top-1/2 right-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse ${isDark ? 'bg-gradient-to-r from-orange-900/15 to-amber-900/15' : 'bg-gradient-to-r from-orange-100/25 to-amber-200/25'}`} style={{animationDelay: '1s'}}></div>
        <div className={`absolute bottom-1/3 left-1/2 w-80 h-80 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-pulse ${isDark ? 'bg-gradient-to-r from-yellow-900/15 to-orange-900/15' : 'bg-gradient-to-r from-yellow-100/25 to-orange-200/25'}`} style={{animationDelay: '3s'}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-150 max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-block relative">
              <img 
                src={logo} 
                alt="ChefHub Logo" 
                className="w-20 h-30 object-contain relative z-10 mx-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-16 h-16 flex items-center justify-center rounded-full text-xl font-bold relative z-10 mx-auto bg-gradient-to-r from-orange-100 to-amber-100 text-orange-600" style={{display: 'none'}}>
                CH
              </div>
            </div>
            <h1 className={`text-3xl font-bold mt-4 mb-2 ${isDark ? 'text-orange-400' : 'text-orange-900'}`}>Welcome Back</h1>
            <p className={isDark ? 'text-orange-300' : 'text-orange-700'}>Sign in to continue</p>
          </div>

          {/* Login Form Card */}
          <div className={`backdrop-blur-md border rounded-2xl p-8 shadow-xl ${isDark ? 'bg-gray-800/40 border-gray-700/30' : 'bg-white/20 border-orange-200/30'}`}>
            {error && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${
                error.isSuccess 
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : error.canResend
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                    : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <p className="mb-2">
                  {typeof error === 'string' ? error : error.message}
                </p>
                {error.canResend && credentials.email && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    {resendingEmail ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      '📧 Resend Verification Email'
                    )}
                  </button>
                )}
                {error.showResetPassword && (
                  <div className="mt-3 text-sm text-gray-700">
                    <p>If your email is linked to social login, please use the same provider or reset your password.</p>
                    <Link
                      to="/forgot-password"
                      className="inline-block mt-2 text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Reset password
                    </Link>
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 w-full">
              {/* Email */}
              <div>
                <label htmlFor="email" className={`block text-sm font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    required
                    className={`w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                    placeholder="you@example.com"
                    value={credentials.email}
                    onChange={handleChange}
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                  </svg>
                </div>
              </div>
              {/* Password */}
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="password" className={`block text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Password</label>
                  <Link to="/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-700">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    className={`w-full p-3 pl-10 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                    placeholder="password"
                    value={credentials.password}
                    onChange={handleChange}
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full p-3 bg-gradient-to-br from-amber-700 to-amber-400 text-white font-semibold rounded-lg shadow hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
            {/* Social login */}
            <div className={`text-center my-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>or continue with</div>
            <div className="flex justify-center mb-4">
              <button onClick={handleGoogleLogin} className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:shadow-md transition-all duration-200 ${isDark ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-orange-300 bg-orange-100 hover:bg-orange-200'}`} title="Sign in with Google">
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="w-5 h-5" />
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-orange-800'}`}>Continue with Google</span>
              </button>
            </div>
            <p className={`text-center text-sm font-medium mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Don't have an account? <Link to="/signup" className={`font-semibold transition-colors duration-200 ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-800 hover:text-orange-900'}`}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
