import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../utils/apiConfig';
import { useAuth } from '../../context/AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { token, isAuthenticated, loading } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is resolved
    }

    if (!token || !isAuthenticated) {
      // Don't attempt to connect without a valid authenticated user
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setSocket(null);
      setIsConnected(false);
      return;
    }

    console.debug('[SOCKET_DEBUG] connecting with token:', token);

    const newSocket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Debug: capture connection errors for diagnosis
    newSocket.on('connect_error', (err) => {
      console.error('[SOCKET_DEBUG] connect_error:', err);
    });

    newSocket.on('connect_timeout', (err) => {
      console.error('[SOCKET_DEBUG] connect_timeout:', err);
    });

    newSocket.on('error', (err) => {
      console.error('[SOCKET_DEBUG] generic socket error:', err);
    });

    // Listen for booking status updates
    newSocket.on('booking-status-changed', (data) => {
      addNotification({
        id: Date.now(),
        type: 'booking',
        title: 'Booking Status Updated',
        message: data.message || `Your booking status has been changed to ${data.status}`,
        timestamp: data.timestamp,
        data: data
      });
    });

    // Listen for new messages
    newSocket.on('new-message', (data) => {
      addNotification({
        id: Date.now(),
        type: 'message',
        title: 'New Message',
        message: data.message,
        timestamp: data.timestamp,
        data: data
      });
    });

    // Listen for payment updates
    newSocket.on('payment-status-update', (data) => {
      addNotification({
        id: Date.now(),
        type: 'payment',
        title: 'Payment Update',
        message: `Payment ${data.status} for booking`,
        timestamp: data.timestamp,
        data: data
      });
    });

    // Listen for chef location updates
    newSocket.on('chef-location-update', (data) => {
      addNotification({
        id: Date.now(),
        type: 'location',
        title: 'Chef Location Update',
        message: `Chef is on the way. ETA: ${data.estimatedArrival}`,
        timestamp: data.timestamp,
        data: data
      });
    });

    // Listen for system announcements
    newSocket.on('system-announcement', (data) => {
      addNotification({
        id: Date.now(),
        type: 'system',
        title: 'System Announcement',
        message: data.message,
        timestamp: data.timestamp,
        data: data
      });
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      newSocket.close();
      socketRef.current = null;
    };
  }, [token]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only latest 10
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const sendMessage = (recipientId, message, bookingId) => {
    if (socket) {
      socket.emit('send-message', {
        recipientId,
        message,
        bookingId
      });
    }
  };

  const updateLocation = (bookingId, latitude, longitude, estimatedArrival) => {
    if (socket) {
      socket.emit('location-update', {
        bookingId,
        latitude,
        longitude,
        estimatedArrival
      });
    }
  };

  const value = {
    socket,
    isConnected,
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    sendMessage,
    updateLocation
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Notification Display Component
export const NotificationCenter = () => {
  const { notifications, removeNotification, clearAllNotifications } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking': return 'ðŸ“…';
      case 'message': return 'ðŸ’¬';
      case 'payment': return 'ðŸ’³';
      case 'location': return 'ðŸ“';
      case 'system': return 'ðŸ“¢';
      default: return 'ðŸ””';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'message': return 'bg-green-50 border-green-200 text-green-800';
      case 'payment': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'location': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'system': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">ðŸ””</div>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${getNotificationColor(notification.type)}`}
                  onClick={() => removeNotification(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 truncate">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Ã—
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Connection Status Indicator
export const ConnectionStatus = () => {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm text-gray-600">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

// Real-time Chat Component
export const RealTimeChat = ({ recipientId, bookingId }) => {
  const { sendMessage } = useSocket();
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(recipientId, message, bookingId);
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        message,
        sent: true,
        timestamp: new Date().toISOString()
      }]);
      setMessage('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4">ðŸ’¬ Chat</h3>
      
      <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {chatHistory.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet</p>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} className={`mb-3 ${msg.sent ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-3 rounded-lg max-w-xs ${
                msg.sent 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                <p className="text-sm">{msg.message}</p>
                <span className="text-xs opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default SocketProvider;

