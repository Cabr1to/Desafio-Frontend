// src/services/cepService.js
import axios from 'axios';

export const fetchAddressByCep = async (cep) => {
    // Remover caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
        throw new Error('CEP inválido');
    }

    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);

        if (response.data.erro) {
            throw new Error('CEP não encontrado');
        }

        return {
            logradouro: response.data.logradouro,
            bairro: response.data.bairro,
            cidade: response.data.cidade,
            uf: response.data.uf
        };
    } catch (error) {
        throw new Error(error.message || 'Erro ao buscar CEP');
    }
};