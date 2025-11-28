import { useContext, useReducer, useEffect } from 'react';
import api from '../services/api.js';
import AuthContext from './authContextInstance.js';

const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    loading: true
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            localStorage.setItem('token', action.payload.token);
            api.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
            return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
        case 'LOGOUT':
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            return { ...state, user: null, token: null, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        if (state.token) {
            // Ensure the default Authorization header is set before requesting /auth/me
            api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
            api.get('/auth/me').then(res => {
                dispatch({ type: 'LOGIN', payload: { token: state.token, user: res.data } });
            }).catch(() => {
                dispatch({ type: 'LOGOUT' });
            });
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [state.token]);

    // open a server-sent events connection to receive cross-client updates
    useEffect(() => {
        let es;
        if (state.token) {
            try {
                const url = `/api/updates?token=${state.token}`;
                es = new EventSource(url);
                es.onmessage = (ev) => {
                    try {
                        const payload = JSON.parse(ev.data);
                        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: payload }));
                    } catch (err) { /* ignore parse errors */ }
                };
                es.onerror = () => { /* keep open; errors handled by server */ };
            } catch (err) { /* ignore EventSource errors */ }
        }

        return () => { if (es) es.close(); };
    }, [state.token]);

    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);