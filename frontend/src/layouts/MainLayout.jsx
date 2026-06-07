import React, { useState, useEffect } from 'react';
import { ThemeToggleButton } from '../components/inputs';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/layout';
import { useTheme } from '../context/ThemeContext';
import { Footer } from '../components/layout';

const MainLayout = ({ children }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  const noSidebarPages = ['/login', '/register', '/signup', '/forgot-password', '/mobile-login'];
  const showSidebar = !noSidebarPages.includes(location.pathname) && !location.pathname.startsWith('/reset-password/');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check for mobile screen with enhanced responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      
      // Handle very small screens (< 360px)
      if (window.innerWidth < 360) {
        document.documentElement.style.setProperty('--mobile-padding', '0.5rem');
      } else {
        document.documentElement.style.setProperty('--mobile-padding', '1rem');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
  <div className={`flex min-h-screen overflow-x-hidden max-w-full ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
    {/* Floating Theme Toggle Button - Always visible */}
    <React.Suspense fallback={null}>
      <ThemeToggleButton />
    </React.Suspense>
      {/* Sidebar - handles its own responsive behavior */}
      {showSidebar && <Sidebar />}
{/* import { ThemeToggleButton } from '../components/inputs'; */}

      {/* Page content */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 overflow-x-hidden max-w-full ${
          showSidebar ? (isMobile ? 'ml-0' : 'ml-20 mr-20') : ''
        }`}
      >
        {/* Main content with responsive padding and overflow handling */}
        <main className={`flex-grow w-full overflow-x-hidden max-w-full container-responsive ${
          showSidebar && isMobile 
            ? 'pt-20 px-2 sm:px-4 pb-4' // More top padding for mobile menu button, responsive horizontal padding
            : showSidebar 
              ? 'p-2 sm:p-4 lg:p-6' // Responsive padding for pages with sidebar
              : 'p-0' // No padding for login/signup pages to allow full control
        }`}>
          <div className="w-full max-w-full overflow-x-hidden container-responsive">
            {children}
          </div>
        </main>

        {/* Footer with responsive behavior */}
        <div className="w-full max-w-full overflow-x-hidden">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
