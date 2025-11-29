import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useApi } from '../hooks/useApi.js';
import api from '../services/api.js';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
    const { user, dispatch } = useAuth();
    const { loading, error, request } = useApi();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await request('post', '/auth/register', formData);
            // If an admin is creating a user, do not overwrite the admin session.
            if (user && user.role === 'admin') {
                // show a simple success message and clear the form
                alert('User created successfully');
                setFormData({ username: '', password: '', role: 'user' });
            } else {
                // Public registration: store token and populate auth context
                localStorage.setItem('token', data.token);
                // set Authorization header for subsequent calls
                api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
                // fetch user info and dispatch login
                const me = await request('get', '/auth/me');
                dispatch({ type: 'LOGIN', payload: { token: data.token, user: me } });
                navigate('/dashboard');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="register-page">
            <form onSubmit={handleSubmit} className="form">
                <h2>Register</h2>
                {error && <p className="error">{error}</p>}
                <Input label="Username" name="username" autoComplete="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                <Input label="Password" name="password" type="password" autoComplete="new-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <label style={{ marginBottom: '.5rem', fontWeight: 500 }}>Role (for demo/learning)</label>
                <select className="select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <p style={{ fontSize: '.85rem', color: '#666', marginTop: '-0.5rem' }}>Selecting <strong>admin</strong> will create an admin account.</p>
                <Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</Button>
            </form>
        </div>
    );
};

export default Register;
