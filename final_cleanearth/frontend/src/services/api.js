// API service utility for CleanEarth

const API_BASE_URL = 'http://localhost:5000';

/**
 * Makes a request to the API with proper headers
 */
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
    credentials: 'include'
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, config);
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'API request failed');
    }
    
    return { data: responseData, status: response.status };
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API endpoints
export const authAPI = {
  register: (userData) => apiRequest('/api/register', 'POST', userData),
  login: (credentials) => apiRequest('/api/login', 'POST', credentials),
  getProfile: () => apiRequest('/api/profile')
};

// Request API endpoints
export const requestsAPI = {
  createRequest: (requestData) => apiRequest('/api/request_register', 'POST', requestData),
  getUserRequests: () => apiRequest('/api/user_requests'),
  getRequestById: (id) => apiRequest(`/api/managerequest?id=${id}`)
};

// Camp API endpoints
export const campsAPI = {
  createCamp: (campData) => apiRequest('/api/camp_register', 'POST', campData),
  getAllCamps: () => apiRequest('/api/managecamp'),
  getCampById: (id) => apiRequest(`/api/managecamp?id=${id}`),
  joinCamp: (id) => apiRequest(`/api/join-campaign/${id}`, 'POST'),
  leaveCamp: (id) => apiRequest(`/api/leave-campaign/${id}`, 'POST')
};

// Admin API endpoints
export const adminAPI = {
  getAllUsers: () => apiRequest('/api/admin/users'),
  toggleUserBlock: (id) => apiRequest(`/api/admin/toggle_block/${id}`, 'POST'),
  awardBadge: (badgeData) => apiRequest('/api/admin/award_badge', 'POST', badgeData)
};