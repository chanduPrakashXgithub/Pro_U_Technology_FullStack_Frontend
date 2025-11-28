import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="home-page">
            <h1>Welcome to Employee Task Tracker</h1>
            <p className="lead">A simple, minimal interface to manage your team's employees and tasks with role-based controls.</p>
            <ul>
                <li>Admins: add and manage employees and tasks.</li>
                <li>Team members: view assigned tasks and monitor progress.</li>
                <li>Smart filters and clear summaries to help prioritize work.</li>
            </ul>
            <div className="home-actions">
                {!user ? (
                    <>
                        <Link to="/login" className="btn">Login</Link>
                        <Link to="/register" className="btn btn-outline">Register</Link>
                    </>
                ) : (
                    <>
                        <Link to="/dashboard" className="btn">Go to Dashboard</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;
