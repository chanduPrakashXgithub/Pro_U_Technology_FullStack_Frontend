import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const Navbar = () => {
    const { user, dispatch } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        setOpen(false);
        dispatch({ type: 'LOGOUT' });
        navigate('/login');
    };

    return (
        <nav className={`nav ${open ? 'open' : ''}`}>
            <div className="nav-left">
                <Link to="/" className="nav-brand" onClick={() => setOpen(false)}>Employee Tracker</Link>

                <button
                    className="hamburger"
                    aria-label="Toggle navigation"
                    aria-expanded={open}
                    onClick={() => setOpen(v => !v)}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <div className="nav-links">
                    {user && <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>}
                    {user && <Link to="/employees" onClick={() => setOpen(false)}>{user.role === 'admin' ? 'Add Employees' : 'Employees'}</Link>}
                    {user && user.role === 'admin' && (
                        <Link to="/tasks" onClick={() => setOpen(false)}>Edit Tasks</Link>
                    )}
                    <Link to="/about" onClick={() => setOpen(false)}>About</Link>
                </div>
            </div>

            <div className="nav-right">
                {user ? (
                    <>
                        <span className="nav-user">{user.username} ({user.role})</span>
                        <button className="btn" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                        <Link to="/register" onClick={() => setOpen(false)}>Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
