/**
 * Authentication service — login, logout, token management.
 */
import api from './api';

export const authService = {
  async login(username, password) {
    const res = await api.post('/auth/login/', { username, password });
    const { access, refresh } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return res.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  async getCurrentUser() {
    const res = await api.get('/auth/me/');
    return res.data;
  },
};
