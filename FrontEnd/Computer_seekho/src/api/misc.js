import { client } from './client';

// ---- Placements ----
export const getAllPlacements = () => client.get('/api/placements').then((r) => r.data);
export const getPlacementsByBatch = (batchId) => client.get(`/api/placements/batch/${batchId}`).then((r) => r.data);
export const getPlacementsByRecruiter = (recruiterId) => client.get(`/api/placements/recruiter/${recruiterId}`).then((r) => r.data);
export const createPlacement = (payload) => client.post('/api/placements', payload).then((r) => r.data);
export const updatePlacement = (id, payload) => client.put(`/api/placements/${id}`, payload).then((r) => r.data);
export const deletePlacement = (id) => client.delete(`/api/placements/${id}`).then((r) => r.data);

// ---- Dashboard ----
export const getDashboardSummary = () => client.get('/api/dashboard/summary').then((r) => r.data);

// ---- Excel bulk upload ----
export const validateExcel = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/api/excel/validate', form).then((r) => r.data);
};
export const uploadExcel = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/api/excel/upload', form).then((r) => r.data);
};
export const validateRecruiterExcel = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/api/excel/recruiters/validate', form).then((r) => r.data);
};
export const uploadRecruiterExcel = (file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post('/api/excel/recruiters/upload', form).then((r) => r.data);
};