/**
 * Splunk/Dashboard API calls.
 */
import api from './api';

export const splunkService = {
  async healthCheck() {
    const res = await api.get('/health/');
    return res.data;
  },

  async getDashboard(earliest = '-24h', latest = 'now') {
    const res = await api.get('/dashboard/', { params: { earliest, latest } });
    return res.data;
  },

  async search(spl, earliest = '-24h', latest = 'now', maxResults = 500) {
    const res = await api.post('/search/', { spl, earliest, latest, max_results: maxResults });
    return res.data;
  },

  async correlateEvents(host, username, pivotTime, windowMinutes = 30) {
    const res = await api.post('/correlate/', {
      host, username, pivot_time: pivotTime, window_minutes: windowMinutes,
    });
    return res.data;
  },

  async getHostEvents(hostname, earliest = '-24h', latest = 'now') {
    const res = await api.get(`/hosts/${hostname}/events/`, { params: { earliest, latest } });
    return res.data;
  },

  async getHostProcesses(hostname, earliest = '-24h', latest = 'now') {
    const res = await api.get(`/hosts/${hostname}/processes/`, { params: { earliest, latest } });
    return res.data;
  },

  async getUserEvents(username, earliest = '-24h', latest = 'now') {
    const res = await api.get(`/users/${username}/events/`, { params: { earliest, latest } });
    return res.data;
  },
};
