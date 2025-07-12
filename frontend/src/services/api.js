const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  changePassword: async (passwordData) => {
    return apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },
};

// Items API
export const itemsAPI = {
  
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/items?${queryString}`);
  },

  getFeatured: async () => {
    return apiRequest('/items/featured');
  },

  getById: async (id) => {
    return apiRequest(`/items/${id}`);
  },

  create: async (itemData, images = []) => {
    const formData = new FormData();
    // Add text fields
    Object.keys(itemData).forEach(key => {
      if (key === 'tags') {
        formData.append('tags', JSON.stringify(itemData[key]));
      } else {
        formData.append(key, itemData[key]);
      }
    });
    // Add images (raw File objects)
    images.forEach(file => formData.append('images', file));
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create item');
    }
    return data;
  },

  update: async (id, itemData) => {
    return apiRequest(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  toggleLike: async (id) => {
    return apiRequest(`/items/${id}/like`, {
      method: 'POST',
    });
  },

  getUserItems: async (userId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/items/user/${userId}?${queryString}`);
  },
};

// Swaps API
export const swapsAPI = {
  create: async (swapData) => {
    return apiRequest('/swaps', {
      method: 'POST',
      body: JSON.stringify(swapData),
    });
  },

  getReceived: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/swaps/received?${queryString}`);
  },

  getSent: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/swaps/sent?${queryString}`);
  },

  getById: async (id) => {
    return apiRequest(`/swaps/${id}`);
  },

  accept: async (id, responseMessage) => {
    return apiRequest(`/swaps/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ responseMessage }),
    });
  },

  reject: async (id, responseMessage) => {
    return apiRequest(`/swaps/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ responseMessage }),
    });
  },

  complete: async (id) => {
    return apiRequest(`/swaps/${id}/complete`, {
      method: 'PUT',
    });
  },

  cancel: async (id, reason) => {
    return apiRequest(`/swaps/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  markAsRead: async (id) => {
    return apiRequest(`/swaps/${id}/read`, {
      method: 'PUT',
    });
  },
};

// Users API
export const usersAPI = {
  getProfile: async () => {
    return apiRequest('/users/profile');
  },

  updateProfile: async (profileData) => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  getById: async (id) => {
    return apiRequest(`/users/${id}`);
  },

  getItems: async (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users/${id}/items?${queryString}`);
  },

  getStats: async (id) => {
    return apiRequest(`/users/${id}/stats`);
  },

  getLeaderboard: async (type = 'points', limit = 10) => {
    return apiRequest(`/users/leaderboard/${type}?limit=${limit}`);
  },
};

// Admin API
export const adminAPI = {
  getDashboard: async () => {
    return apiRequest('/admin/dashboard');
  },

  getItems: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/items?${queryString}`);
  },

  approveItem: async (id, adminNotes) => {
    return apiRequest(`/admin/items/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes }),
    });
  },

  rejectItem: async (id, reason) => {
    return apiRequest(`/admin/items/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  deleteItem: async (id) => {
    return apiRequest(`/admin/items/${id}`, {
      method: 'DELETE',
    });
  },

  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users?${queryString}`);
  },

  featureItem: async (userId, itemId, duration = 7) => {
    return apiRequest(`/admin/users/${userId}/feature`, {
      method: 'PUT',
      body: JSON.stringify({ itemId, duration }),
    });
  },

  unfeatureItem: async (userId, itemId) => {
    return apiRequest(`/admin/users/${userId}/unfeature`, {
      method: 'PUT',
      body: JSON.stringify({ itemId }),
    });
  },

  getReports: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/reports?${queryString}`);
  },
};

export default {
  auth: authAPI,
  items: itemsAPI,
  swaps: swapsAPI,
  users: usersAPI,
  admin: adminAPI,
}; 