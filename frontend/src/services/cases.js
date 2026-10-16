/**
 * Investigation cases, findings, evidence API calls.
 */
import api from './api';

export const casesService = {
  // Cases
  async listCases() {
    const res = await api.get('/investigations/cases/');
    return res.data;
  },
  async getCase(id) {
    const res = await api.get(`/investigations/cases/${id}/`);
    return res.data;
  },
  async createCase(data) {
    const res = await api.post('/investigations/cases/', data);
    return res.data;
  },
  async updateCase(id, data) {
    const res = await api.patch(`/investigations/cases/${id}/`, data);
    return res.data;
  },
  async addNote(caseId, content) {
    const res = await api.post(`/investigations/cases/${caseId}/add_note/`, { content });
    return res.data;
  },
  async addEvidence(caseId, data) {
    const res = await api.post(`/investigations/cases/${caseId}/add_evidence/`, data);
    return res.data;
  },

  // Findings
  async listFindings() {
    const res = await api.get('/investigations/findings/');
    return res.data;
  },
  async createFinding(data) {
    const res = await api.post('/investigations/findings/', data);
    return res.data;
  },
  async updateFinding(id, data) {
    const res = await api.patch(`/investigations/findings/${id}/`, data);
    return res.data;
  },

  // Hunts
  async listHunts(category = '') {
    const params = category ? { category } : {};
    const res = await api.get('/detections/hunts/', { params });
    return res.data;
  },
  async runHunt(huntId, earliest = '-24h', latest = 'now') {
    const res = await api.post(`/detections/hunts/${huntId}/run/`, { earliest, latest });
    return res.data;
  },

  // Detection Rules
  async listRules() {
    const res = await api.get('/detections/rules/');
    return res.data;
  },
  async runRule(ruleId, earliest = '-24h', latest = 'now') {
    const res = await api.post(`/detections/rules/${ruleId}/run/`, { earliest, latest });
    return res.data;
  },

  // MITRE
  async listTechniques() {
    const res = await api.get('/mitre/techniques/');
    return res.data;
  },
  async getMITRESummary() {
    const res = await api.get('/mitre/summary/');
    return res.data;
  },

  // Reports
  async generateReport(caseId, format = 'json') {
    const res = await api.post('/reports/generate/', { case_id: caseId, format });
    return res.data;
  },
  async listReports() {
    const res = await api.get('/reports/reports/');
    return res.data;
  },
};
