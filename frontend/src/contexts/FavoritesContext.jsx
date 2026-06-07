import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync with backend when authenticated, or load from localStorage when not
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavoritesFromBackend();
    } else {
      loadFavoritesFromStorage();
    }
  }, [isAuthenticated]);

  const fetchFavoritesFromBackend = async () => {
    try {
      setLoading(true);
      const res = await api.get('/user/favorites');
      setFavorites(res.data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // Fallback to local storage if API fails
      loadFavoritesFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFavoritesFromStorage = () => {
    try {
      const savedFavorites = localStorage.getItem('chefFavorites');
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
    }
  };

  // Add chef to favorites
  const addToFavorites = async (chef) => {
    // Optimistic update
    const isAlreadyFavorite = favorites.some(fav => fav._id === chef._id);
    if (isAlreadyFavorite) return;

    const newFavorite = { ...chef, dateAdded: new Date().toISOString() };
    setFavorites(prev => [...prev, newFavorite]);

    if (isAuthenticated) {
      try {
        await api.post(`/user/favorites/${chef._id}`);
        // Optional: Re-fetch to ensure sync, or trust optimistic update
      } catch (error) {
        console.error('Error adding favorite to backend:', error);
        toast.error('Failed to save favorite to account');
        // Revert optimistic update
        setFavorites(prev => prev.filter(f => f._id !== chef._id));
      }
    } else {
      // Local storage update
      updateLocalStorage([...favorites, newFavorite]);
    }
  };

  // Remove chef from favorites
  const removeFromFavorites = async (chefId) => {
    // Optimistic update
    const previousFavorites = [...favorites];
    setFavorites(prev => prev.filter(chef => chef._id !== chefId));

    if (isAuthenticated) {
      try {
        await api.delete(`/user/favorites/${chefId}`);
      } catch (error) {
        console.error('Error removing favorite from backend:', error);
        toast.error('Failed to remove favorite from account');
        // Revert optimistic update
        setFavorites(previousFavorites);
      }
    } else {
      // Local storage update
      const newFavorites = favorites.filter(chef => chef._id !== chefId);
      updateLocalStorage(newFavorites);
    }
  };

  const updateLocalStorage = (newFavorites) => {
    try {
      localStorage.setItem('chefFavorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  };

  // Check if chef is in favorites
  const isFavorite = (chefId) => {
    return favorites.some(chef => chef._id === chefId);
  };

  // Toggle favorite status
  const toggleFavorite = (chef) => {
    if (isFavorite(chef._id)) {
      removeFromFavorites(chef._id);
      return false; // Removed
    } else {
      addToFavorites(chef);
      return true; // Added
    }
  };

  // Get favorite count
  const getFavoriteCount = () => favorites.length;

  // Clear all favorites
  const clearAllFavorites = () => {
    setFavorites([]);
    if (!isAuthenticated) {
      localStorage.removeItem('chefFavorites');
    }
  };

  const value = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    getFavoriteCount,
    clearAllFavorites,
    loading
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
