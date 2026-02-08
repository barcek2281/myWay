import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8081',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const activeOrgId = localStorage.getItem('active_org_id');
    if (activeOrgId) {
        config.headers['X-Org-ID'] = activeOrgId;
    }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config?.url?.includes('/auth/signin') ||
            error.config?.url?.includes('/auth/signup') ||
            error.config?.url?.includes('/auth/me');

        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/signin';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
