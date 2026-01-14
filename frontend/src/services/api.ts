import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy in vite.config.ts handles redirection to backend:8000
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log('API Base URL:', api.defaults.baseURL);
console.log('Environment Mode:', import.meta.env.MODE);


// Interceptor to inject Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Interceptor to handle 401 (Expire Token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            // window.location.href = '/login'; // Brutal redirect, better handled in Context
        }
        return Promise.reject(error);
    }
);

export default api;
