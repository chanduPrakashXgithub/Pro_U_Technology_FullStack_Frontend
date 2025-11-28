import { useState, useCallback } from 'react';
import api from '../services/api.js';

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = useCallback(async (method, url, data = null) => {
        setLoading(true);
        setError(null);
        try {
            const config = { method };
            if (data) config.data = data;
            const response = await api(url, config);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, request };
};