import api from './api';

export const clientService = {
    // Listar todos os clientes
    getAll: async () => {
        try {
            const response = await api.get('/clients');
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            throw error;
        }
    },

    // Buscar cliente por ID
    getById: async (id) => {
        try {
            const response = await api.get(`/clients/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao buscar cliente ${id}:`, error);
            throw error;
        }
    },

    // Criar novo cliente
    create: async (clientData) => {
        try {
            const response = await api.post('/clients', clientData);
            return response.data;
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            throw error;
        }
    },

    // Atualizar cliente
    update: async (id, clientData) => {
        try {
            const response = await api.put(`/clients/${id}`, clientData);
            return response.data;
        } catch (error) {
            console.error(`Erro ao atualizar cliente ${id}:`, error);
            throw error;
        }
    },

    // Excluir cliente
    delete: async (id) => {
        try {
            const response = await api.delete(`/clients/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erro ao excluir cliente ${id}:`, error);
            throw error;
        }
    }
};