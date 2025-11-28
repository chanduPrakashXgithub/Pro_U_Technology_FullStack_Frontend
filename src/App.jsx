import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import Tasks from './pages/Tasks.jsx';
import AddTask from './pages/AddTask.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Navbar from './components/common/Navbar.jsx';
import './styles/globals.css';

function App() {
    const { user, loading } = useAuth();

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="app">
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<Home />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
                <Route path="/register" element={user && user.role !== 'admin' ? <Navigate to="/dashboard" /> : <Register />} />

                {user && (
                    <>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/employees" element={<Employees />} />
                        {user.role === 'admin' && (
                            <>
                                <Route path="/tasks" element={<Tasks />} />
                                <Route path="/add-task" element={<AddTask />} />
                                <Route path="/edit-task/:id" element={<AddTask />} />
                            </>
                        )}
                    </>
                )}

                <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
            </Routes>
        </div>
    );
}

export default App;