const API_BASE = 'http://localhost:8080/api';

// ── Token helpers ──────────────────────────────────────────
function getToken()  { return localStorage.getItem('pm_token'); }
function getRole()   { return localStorage.getItem('pm_role'); }
function getUserId() { return localStorage.getItem('pm_userId'); }
function getEmail()  { return localStorage.getItem('pm_email'); }

function saveAuth(data) {
    localStorage.setItem('pm_token',  data.token);
    localStorage.setItem('pm_role',   data.role);
    localStorage.setItem('pm_userId', data.userId);
    localStorage.setItem('pm_email',  data.email);
}

function clearAuth() {
    ['pm_token','pm_role','pm_userId','pm_email'].forEach(k => localStorage.removeItem(k));
}

function isLoggedIn() { return !!getToken(); }

function requireAuth(expectedRole) {
    if (!isLoggedIn()) { window.location.href = '/index.html'; return; }
    if (expectedRole && getRole() !== expectedRole) {
        window.location.href = getRole() === 'ADMIN' ? '/pages/admin-dashboard.html' : '/pages/student-dashboard.html';
    }
}

// ── API fetch wrapper ──────────────────────────────────────
async function apiFetch(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (res.status === 401) { clearAuth(); window.location.href = '/index.html'; return; }
    if (res.status === 204 || res.headers.get('content-length') === '0') return null;

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Something went wrong');
    return data;
}

// ── Auth API ───────────────────────────────────────────────
const Auth = {
    login: (email, password) =>
        apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

    register: (payload) =>
        apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),

    logout() {
        clearAuth();
        window.location.href = '/index.html';
    }
};

// ── Student API ────────────────────────────────────────────
const StudentAPI = {
    getProfile:    ()        => apiFetch('/student/profile'),
    updateProfile: (data)    => apiFetch('/student/profile', { method: 'PUT', body: JSON.stringify(data) }),
    applyForJob:   (jobId)   => apiFetch(`/student/apply/${jobId}`, { method: 'POST' }),
    getApplications:()       => apiFetch('/student/applications'),
};

// ── Jobs API ───────────────────────────────────────────────
const JobsAPI = {
    getOpenJobs: ()         => apiFetch('/jobs/open'),
    getJobById:  (id)       => apiFetch(`/jobs/${id}`),
    getAllJobs:  ()         => apiFetch('/jobs'),
    createJob:   (data)     => apiFetch('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    updateJob:   (id, data) => apiFetch(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteJob:   (id)       => apiFetch(`/jobs/${id}`, { method: 'DELETE' }),
    toggleStatus:(id)       => apiFetch(`/jobs/${id}/toggle-status`, { method: 'PATCH' }),
};

// ── Admin API ──────────────────────────────────────────────
const AdminAPI = {
    // Students
    getStudents:   ()     => apiFetch('/admin/students'),
    getStudent:    (id)   => apiFetch(`/admin/students/${id}`),
    deleteStudent: (id)   => apiFetch(`/admin/students/${id}`, { method: 'DELETE' }),

    // Companies
    getCompanies:   ()          => apiFetch('/admin/companies'),
    getCompany:     (id)        => apiFetch(`/admin/companies/${id}`),
    addCompany:     (data)      => apiFetch('/admin/companies', { method: 'POST', body: JSON.stringify(data) }),
    updateCompany:  (id, data)  => apiFetch(`/admin/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCompany:  (id)        => apiFetch(`/admin/companies/${id}`, { method: 'DELETE' }),

    // Applications
    getAllApplications:    ()        => apiFetch('/admin/applications'),
    getApplicationsByJob: (jobId)   => apiFetch(`/admin/applications/job/${jobId}`),
    updateStatus:         (id, data)=> apiFetch(`/admin/applications/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Toast ──────────────────────────────────────────────────
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
}

// ── Badge helper ───────────────────────────────────────────
function statusBadge(status) {
    const map = {
        APPLIED:    'badge-applied',
        SHORTLISTED:'badge-shortlisted',
        SELECTED:   'badge-selected',
        REJECTED:   'badge-rejected',
        OPEN:       'badge-open',
        CLOSED:     'badge-closed',
        PLACED:     'badge-placed',
        NOT_PLACED: 'badge-not-placed',
    };
    return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

// ── Modal helpers ──────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ── Date format ────────────────────────────────────────────
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
