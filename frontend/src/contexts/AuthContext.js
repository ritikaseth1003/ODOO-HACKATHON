import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.login({ email, password });
      console.log('Login API response:', response);
      if (response && response.data) {
<<<<<<< HEAD
        let userData = response.data.user;
        if (userData && userData.id && !userData._id) {
          userData._id = userData.id;
        }
=======
        const userData = response.data.user;
>>>>>>> 561ced214b15bc227213517fe86b7c389883f92e
        const token = response.data.token;
        localStorage.setItem('token', token);
        setUser(userData);
        return { success: true };
      } else {
        const errorMsg = response && response.message ? response.message : 'Invalid login response';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.register(userData);
      console.log('Register API response:', response);
      if (response && response.data) {
<<<<<<< HEAD
        let newUser = response.data.user;
        if (newUser && newUser.id && !newUser._id) {
          newUser._id = newUser.id;
        }
=======
        const newUser = response.data.user;
>>>>>>> 561ced214b15bc227213517fe86b7c389883f92e
        const token = response.data.token;
        localStorage.setItem('token', token);
        setUser(newUser);
        return { success: true };
      } else {
        const errorMsg = response && response.message ? response.message : 'Invalid register response';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data.user);
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      setLoading(true);
      
      await authAPI.changePassword({ currentPassword, newPassword });
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    currentUser: user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
