/**
 * API service layer for ProposalForge AI backend
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('pf_token');
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem('pf_user')); } catch { return null; }
};
export const isAuthenticated = () => !!getToken();

const saveSession = (token, user) => {
  localStorage.setItem('pf_token', token);
  localStorage.setItem('pf_user', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('pf_token');
  localStorage.removeItem('pf_user');
};

// ─── Request helper ────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    throw new Error(typeof body === 'string' ? body : body?.message || `HTTP ${res.status}`);
  }
  return body;
}

const get = (path) => request(path, { method: 'GET' });
const post = (path, body) => request(path, {
  method: 'POST',
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

// ─── Auth API ─────────────────────────────────────────────────────────────────
export async function registerUser({ name, email, password }) {
  const message = await post('/auth/register', { name, email, password });
  if (message === 'Email already registered') {
    throw new Error('This email is already registered. Please log in instead.');
  }
  return message;
}

export async function loginUser({ email, password }) {
  const token = await post('/auth/login', { email, password });
  const user = { email, name: email.split('@')[0] };
  saveSession(token, user);
  return { token, user };
}

export function logoutUser() {
  clearSession();
}

// ─── Proposal Management API ───────────────────────────────────────────────────
export async function createProposal({ title, customerRequirement }) {
  return await post('/api/proposals', { title, customerRequirement });
}

export async function getProposal(id) {
  return await get(`/api/proposals/${id}`);
}

export async function getAllProposals() {
  return await get('/api/proposals');
}

// ─── Workflow Trigger API ─────────────────────────────────────────────────────
export async function startWorkflow(proposalId) {
  return await post(`/api/workflow/start/${proposalId}`);
}

export async function submitClarifications(proposalId, answers, ambiguities) {
  return await post(`/api/workflow/clarify/${proposalId}`, { answers, ambiguities });
}

export async function finalizePricing(proposalId, pricingSelection) {
  return await post(`/api/workflow/pricing/${proposalId}`, pricingSelection);
}

export async function approveProposal(proposalId, finalProposal, actualHoursSpent = null) {
  return await post(`/api/workflow/approve/${proposalId}`, {
    finalProposal,
    ...(actualHoursSpent !== null && actualHoursSpent !== undefined ? { actualHoursSpent } : {}),
  });
}

