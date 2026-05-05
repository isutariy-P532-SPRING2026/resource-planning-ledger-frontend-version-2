import axios from 'axios';

const API_BASE = 'https://resource-planning-ledger-backend-version-w90h.onrender.com/';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${API_BASE}/api`
});

export default api;

// ── Plans ────────────────────────────────────────────────────────────────────
export const listPlans        = ()          => api.get('/plans').then(r => r.data);
export const getPlan          = (id)        => api.get(`/plans/${id}`).then(r => r.data);
export const createPlan       = (body)      => api.post('/plans', body).then(r => r.data);
export const getPlanReport    = (id, status) =>
  api.get(`/plans/${id}/report`, { params: status ? { status } : undefined }).then(r => r.data);
export const addChildNode     = (id, body)  => api.post(`/plans/${id}/children`, body).then(r => r.data);
export const getPlanMetrics   = (id)        => api.get(`/plans/${id}/metrics`).then(r => r.data);
export const getPlanActions   = (id, status) =>
  api.get(`/plans/${id}/actions`, { params: status ? { status } : undefined }).then(r => r.data);

// ── Actions ──────────────────────────────────────────────────────────────────
export const getAction        = (id)        => api.get(`/actions/${id}`).then(r => r.data);
export const implementAction  = (id, body)  => api.post(`/actions/${id}/implement`, body).then(r => r.data);
export const completeAction   = (id)        => api.post(`/actions/${id}/complete`, {}).then(r => r.data);
export const suspendAction    = (id, body)  => api.post(`/actions/${id}/suspend`, body).then(r => r.data);
export const resumeAction     = (id)        => api.post(`/actions/${id}/resume`, {}).then(r => r.data);
export const abandonAction     = (id)       => api.post(`/actions/${id}/abandon`, {}).then(r => r.data);
export const submitForApproval = (id)       => api.post(`/actions/${id}/submit-for-approval`, {}).then(r => r.data);
export const approveAction     = (id)       => api.post(`/actions/${id}/approve`, {}).then(r => r.data);
export const rejectAction      = (id)       => api.post(`/actions/${id}/reject`, {}).then(r => r.data);
export const reopenAction      = (id)       => api.post(`/actions/${id}/reopen`, {}).then(r => r.data);
export const addAllocation     = (id, body) => api.post(`/actions/${id}/allocations`, body).then(r => r.data);

// ── Accounts / Ledger ────────────────────────────────────────────────────────
export const listAccounts     = ()                    => api.get('/accounts').then(r => r.data);
export const getEntries       = (accountId)           => api.get(`/accounts/${accountId}/entries`).then(r => r.data);
export const depositToAccount = (accountId, body)     => api.post(`/accounts/${accountId}/deposit`, body).then(r => r.data);

// ── Protocols ────────────────────────────────────────────────────────────────
export const listProtocols    = ()          => api.get('/protocols').then(r => r.data);
export const createProtocol   = (body)      => api.post('/protocols', body).then(r => r.data);
export const updateProtocol   = (id, body)  => api.put(`/protocols/${id}`, body).then(r => r.data);
export const deleteProtocol   = (id)        => api.delete(`/protocols/${id}`).then(r => r.data);

// ── Resource Types ───────────────────────────────────────────────────────────
export const listResourceTypes  = ()         => api.get('/resource-types').then(r => r.data);
export const createResourceType = (body)     => api.post('/resource-types', body).then(r => r.data);
export const updateResourceType = (id, body) => api.put(`/resource-types/${id}`, body).then(r => r.data);
export const deleteResourceType = (id)       => api.delete(`/resource-types/${id}`).then(r => r.data);

// ── Audit Log ────────────────────────────────────────────────────────────────
export const listAuditLog     = ()          => api.get('/audit-log').then(r => r.data);

