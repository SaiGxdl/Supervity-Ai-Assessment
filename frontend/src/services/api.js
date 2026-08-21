import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const api = {
  // Fetch all exceptions with optional filters
  getExceptions: async (status = null, severity = null) => {
    const params = {};
    if (status && status !== 'ALL') params.status = status;
    if (severity && severity !== 'ALL') params.severity = severity;
    const response = await apiClient.get('/exceptions', { params });
    return response.data;
  },

  // Fetch single exception by ID
  getExceptionById: async (id) => {
    const response = await apiClient.get(`/exceptions/${id}`);
    return response.data;
  },

  // Request AI Explanation
  explainException: async (id, userQuery = null) => {
    const response = await apiClient.post(`/exceptions/${id}/explain`, { user_query: userQuery });
    return response.data;
  },

  // Request AI Resolution Suggestion
  suggestResolution: async (id) => {
    const response = await apiClient.post(`/exceptions/${id}/suggest-resolution`);
    return response.data;
  },

  // Contextual Chatbot Query
  chatException: async (id, message) => {
    const response = await apiClient.post(`/exceptions/${id}/chat`, { message });
    return response.data;
  },

  // Execute Human Manual Approval Resolution
  resolveException: async (id, notes = 'Manually approved by reviewer') => {
    const response = await apiClient.post(`/exceptions/${id}/resolve`, { notes });
    return response.data;
  },

  // Execute Automated Resolution (Policy Enforced)
  autoResolveException: async (id) => {
    const response = await apiClient.post(`/exceptions/${id}/auto-resolve`);
    return response.data;
  },

  // Fetch KPI Metrics Summary
  getMetrics: async () => {
    const response = await apiClient.get('/metrics');
    return response.data;
  },

  // Reset Synthetic Dataset
  resetDataset: async () => {
    const response = await apiClient.post('/reset');
    return response.data;
  },
};

export default api;
