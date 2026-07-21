import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          localStorage.removeItem('userInfo');
        }
      }

      try {
        const { data } = await API.get('/auth/me');
        if (data) {
          const storedToken = storedUser ? JSON.parse(storedUser)?.token : '';
          const fullUser = { ...data, token: storedToken };
          setUser(fullUser);
          localStorage.setItem('userInfo', JSON.stringify(fullUser));
        }
      } catch (error) {
        // Unverified session - enforce logout and clear local state
        setUser(null);
        localStorage.removeItem('userInfo');
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  // Helper to generate/fetch device ID and OS details
  const getDeviceCredentials = () => {
    let devId = localStorage.getItem('deviceId');
    if (!devId) {
      devId = `DEV-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`.toUpperCase();
      localStorage.setItem('deviceId', devId);
    }

    const ua = navigator.userAgent;
    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    let browser = 'Unknown Browser';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return {
      deviceId: devId,
      deviceInfo: `${os} / ${browser}`
    };
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { deviceId, deviceInfo } = getDeviceCredentials();
      const { data } = await API.post('/auth/login', { 
        email, 
        password,
        deviceId,
        deviceInfo
      });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      const respData = error.response?.data;
      if (respData?.code === 'UNAUTHORIZED_DEVICE' || respData?.code === 'DEVICE_LOCKED') {
        return { 
          success: false, 
          code: respData.code, 
          message: respData.message,
          registeredDevice: respData.registeredDevice,
          lastUsed: respData.lastUsed
        };
      }
      const message = respData?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, mobile, password, role, collegeName = '', degree = '', yearOfPassing = '', photo = '') => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register', { 
        name, 
        email, 
        mobile, 
        password, 
        role,
        collegeName,
        degree,
        yearOfPassing,
        photo
      });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // Ignore network errors during logout
    }
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('userInfo', JSON.stringify(updatedData));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
