import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";
import { getToken, validateToken, removeToken } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuthStatus = useCallback(async () => {
    const token = getToken();
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    // ⚡ FAST PATH: Decode token immediately
    try {
      const decoded = jwtDecode(token);
      
      // Check if token is expired client-side first
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        logout();
        setIsLoading(false);
        return;
      }

      // Set user data INSTANTLY from the token payload
      setUser({
        id: decoded.id || decoded.sub,
        email: decoded.email,
        name: decoded.name
      });
      setIsAuthenticated(true);
      
      // We can stop loading here because we have data!
      setIsLoading(false); 
    } catch {
      // Token format invalid
      logout();
      setIsLoading(false);
      return;
    }

    // 🔒 SECURITY PATH: Still validate with backend in background
    try {
      const validation = await validateToken();
      if (!validation.valid) {
        logout(); 
      } else {
        // Optional: Update with fresh data from DB
        setUser(validation.user);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // Continue with local auth state
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = (token, userData) => {
    
    // Validate input data
    if (!token || !userData || !userData.id || !userData.email) {
      return;
    }
    
    // Ensure all values are valid (not undefined, null, or string 'undefined')
    const cleanUserData = {
      id: userData.id?.toString(),
      email: userData.email,
      name: userData.name || userData.email
    };
    
    // Double-check that we don't have invalid values
    if (cleanUserData.id === 'undefined' || cleanUserData.id === 'null' || !cleanUserData.id) {
      return;
    }
    
    
    // Store token only
    localStorage.setItem('token', token);
    localStorage.setItem('isLoggedIn', 'true');
    
    setIsAuthenticated(true);
    setUser(cleanUserData);
    
  };

  const logout = () => {
    // Clear all auth data
    removeToken();
    localStorage.removeItem('isLoggedIn');
    
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    loading: isLoading, // Alias for compatibility
    isLoading,
    user,
    token: getToken(), // Expose token
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
