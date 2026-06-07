import React, { useState } from 'react';
import { useFavorites } from '../../contexts/FavoritesContext';
import toast from 'react-hot-toast';

const FavoriteButton = ({
  chef,
  className = '',
  size = 'medium',
  showText = false,
  variant = 'icon' // 'icon' | 'button' | 'card'
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  // Guard against undefined chef object
  if (!chef || !chef._id) {
    console.warn('FavoriteButton: chef prop is missing or invalid', chef);
    return null;
  }

  const isChefFavorited = isFavorite(chef._id);

  const handleToggleFavorite = () => {
    const wasAdded = toggleFavorite(chef);

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Show user feedback
    if (wasAdded) {
      toast.success('Added to favorites!');
    } else {
      toast.success('Removed from favorites!');
    }
  };

  // Size configurations
  const sizeConfig = {
    small: {
      icon: 'w-4 h-4',
      button: 'px-3 py-1.5 text-sm',
      text: 'text-sm'
    },
    medium: {
      icon: 'w-5 h-5',
      button: 'px-4 py-2 text-base',
      text: 'text-base'
    },
    large: {
      icon: 'w-6 h-6',
      button: 'px-6 py-3 text-lg',
      text: 'text-lg'
    }
  };

  const config = sizeConfig[size];

  // Icon variant (minimal)
  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleFavorite}
        className={`
          relative transition-all duration-300 hover:scale-110 focus:outline-none
          min-h-[44px] min-w-[44px] flex items-center justify-center
          ${isAnimating ? 'animate-pulse' : ''}
          ${className}
        `}
        title={isChefFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className={`
            ${config.icon} transition-all duration-300
            ${isChefFavorited
              ? 'text-amber-500 fill-current'
              : 'text-gray-400 hover:text-amber-400'
            }
          `}
          fill={isChefFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        {isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-amber-200 animate-ping opacity-75"></div>
          </div>
        )}
      </button>
    );
  }

  // Button variant (with background)
  if (variant === 'button') {
    return (
      <button
        onClick={handleToggleFavorite}
        className={`
          ${config.button} rounded-xl font-semibold transition-all duration-300 
          flex items-center justify-center space-x-2
          ${isChefFavorited
            ? 'bg-amber-100 text-amber-600 border border-amber-200 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200'
          }
          ${isAnimating ? 'scale-95' : 'hover:scale-105'}
          ${className}
        `}
      >
        <svg
          className={`${config.icon} transition-all duration-300`}
          fill={isChefFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        {showText && (
          <span className={config.text}>
            {isChefFavorited ? 'Favorited' : 'Add to Favorites'}
          </span>
        )}
      </button>
    );
  }

  // Card variant (for chef cards)
  if (variant === 'card') {
    return (
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
        <button
          onClick={handleToggleFavorite}
          className={`
            p-2.5 sm:p-2 rounded-full backdrop-blur-sm transition-all duration-300
            min-h-[44px] min-w-[44px] flex items-center justify-center
            ${isChefFavorited
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white/80 text-gray-600 hover:bg-amber-50 hover:text-amber-500'
            }
            ${isAnimating ? 'scale-90' : 'hover:scale-110'}
            ${className}
          `}
          title={isChefFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            className={`${config.icon} transition-all duration-300`}
            fill={isChefFavorited ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return null;
};

export default FavoriteButton;

