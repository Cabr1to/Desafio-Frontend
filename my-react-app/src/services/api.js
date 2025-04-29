// services/api.js
import axios from 'axios';

// Criar instância do axios com configuração base
const api = axios.create({
    baseURL: 'http://localhost:8081',
    timeout: 10000,
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Definir um tratamento personalizado para erros 401 e 403
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Verificar se o erro não veio das rotas de login ou refresh token
            const isAuthRoute = error.config.url.includes('/login') ||
                error.config.url.includes('/refresh-token');

            if (!isAuthRoute) {
                console.log('Sessão expirada. Redirecionando para login...');
                // Guardar URL atual para redirecionar de volta após login
                localStorage.setItem('redirectUrl', window.location.pathname);

                // Importante: Não redirecionar automaticamente em todos os casos
                // apenas armazenar um flag para verificar no componente
                localStorage.setItem('sessionExpired', 'true');

                // Aqui, ao invés de redirecionar diretamente, vamos deixar o componente
                // tratar o erro e decidir se redireciona ou não
            }
        }
        return Promise.reject(error);
    }
);

// Serviço de autenticação
const authService = {
    login: async (username, password) => {
        const response = await api.post('/api/v1/auth/login', { username, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.removeItem('sessionExpired');
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('sessionExpired');
        window.location.href = '/login';
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    getUserInfo: () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Erro ao parsear informações do usuário:', e);
                return null;
            }
        }
        return null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    checkSessionExpired: () => {
        return localStorage.getItem('sessionExpired') === 'true';
    },

    clearSessionExpiredFlag: () => {
        localStorage.removeItem('sessionExpired');
    }
};

export { authService };
export default api;