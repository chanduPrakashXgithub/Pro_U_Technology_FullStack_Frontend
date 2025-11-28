import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useApi } from '../hooks/useApi.js';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const { dispatch } = useAuth();
    const navigate = useNavigate();
    const { loading, error, request } = useApi();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await request('post', '/auth/login', formData);
            dispatch({ type: 'LOGIN', payload: data });
            navigate('/dashboard');
        } catch (err) {
            console.error(error);
        }
    };

    return (
        <div className="login-page">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Login</h2>
                {error && <p className="error">{error}</p>}
                <Input
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <Input
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <Button type="submit" disabled={loading}>Login</Button>
            </form>
        </div>
    );
};

export default Login;