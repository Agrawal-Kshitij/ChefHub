import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MobileLoginTest = () => {
  const [status, setStatus] = useState('Checking...');
  const navigate = useNavigate();

  const testFirebaseConfig = () => {
    try {
      // Test Firebase import
      import('../../firebase/config').then(() => {
        setStatus('âœ… Firebase config loaded successfully');
      }).catch((error) => {
        setStatus('âŒ Firebase config error: ' + error.message);
      });
    } catch (error) {
      setStatus('âŒ Import error: ' + error.message);
    }
  };

  const testAuthAPI = () => {
    try {
      import('../../utils/auth').then(() => {
        setStatus('âœ… Auth API loaded successfully');
      }).catch((error) => {
        setStatus('âŒ Auth API error: ' + error.message);
      });
    } catch (error) {
      setStatus('âŒ Auth API import error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Mobile Login Test Page
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Status: {status}</p>
            </div>

            <button
              onClick={testFirebaseConfig}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
            >
              Test Firebase Config
            </button>

            <button
              onClick={testAuthAPI}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Test Auth API
            </button>

            <button
              onClick={() => navigate('/mobile-login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              Go to Mobile Login
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
            >
              Go to Regular Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileLoginTest;
