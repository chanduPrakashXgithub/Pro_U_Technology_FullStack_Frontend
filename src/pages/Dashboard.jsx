import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import Card from '../components/common/Card.jsx';
import LoadingSpinner from '../components/common/ui/LoadingSpinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/common/Button.jsx';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [data, setData] = useState({});
    const [tasks, setTasks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const { loading, error, request } = useApi();
    const { user } = useAuth();

    const navigate = useNavigate();

    const loadSummary = async () => {
        try {
            // keep dashboard endpoint for global stats if needed
            const res = await request('get', '/dashboard').catch(() => null);
            if (res) setData(res);
        } catch (err) {
            console.error(err);
        }
    };

    const loadEmployees = async () => {
        try {
            const res = await request('get', '/employees');
            setEmployees(res || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadTasks = async () => {
        try {
            const query = [];
            if (filterStatus) query.push(`status=${encodeURIComponent(filterStatus)}`);
            if (filterEmployee) query.push(`assignedTo=${encodeURIComponent(filterEmployee)}`);
            // (no implicit assignedTo filter here - frontend will use employee filter)
            const q = query.length ? `?${query.join('&')}` : '';
            const res = await request('get', `/tasks${q}`);
            setTasks(res || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        // Single effect to load summary, employees and tasks when user or filters change.
        let mounted = true;

        const run = async () => {
            if (!mounted) return;
            // load lightweight summary and employees once per change
            await loadSummary();
            await loadEmployees();
            // finally load tasks which may be filtered
            await loadTasks();
        };

        run();

        // On server-side updates only reload tasks (lighter)
        const onDataUpdated = () => { if (mounted) loadTasks(); };
        window.addEventListener('dataUpdated', onDataUpdated);

        return () => { mounted = false; window.removeEventListener('dataUpdated', onDataUpdated); };
        // include filters so effect runs when they change
    }, [user, filterStatus, filterEmployee]);

    const setStatusFilter = (status) => {
        setFilterStatus(status);
    };

    const handleAddTask = () => navigate('/add-task');

    if (loading) return <LoadingSpinner />;

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            {error && <p className="error">{error}</p>}

            <div className="dashboard-cards">
                <Card className="stat-card blue">
                    <div>
                        <div className="label">Total Tasks</div>
                        <div className="stat">{tasks.length || 0}</div>
                    </div>
                    <div className="icon">📋</div>
                </Card>
                <Card className="stat-card green">
                    <div>
                        <div className="label">Completed</div>
                        <div className="stat">{tasks.filter(t => t.status === 'completed').length || 0}</div>
                    </div>
                    <div className="icon">✔️</div>
                </Card>
                <Card className="stat-card orange">
                    <div>
                        <div className="label">In Progress</div>
                        <div className="stat">{tasks.filter(t => t.status === 'in-progress').length || 0}</div>
                    </div>
                    <div className="icon">⚡</div>
                </Card>
                <Card className="stat-card red">
                    <div>
                        <div className="label">Pending</div>
                        <div className="stat">{tasks.filter(t => t.status === 'pending').length || 0}</div>
                    </div>
                    <div className="icon">⏱️</div>
                </Card>
                <Card className="stat-card purple">
                    <div>
                        <div className="label">Completion Rate</div>
                        <div className="stat">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%</div>
                    </div>
                    <div className="icon">📈</div>
                </Card>
            </div>

            <div className="filters-row">
                <div className="filter-pills">
                    <button className={`pill ${filterStatus === '' ? 'active' : ''}`} onClick={() => setStatusFilter('')}>All</button>
                    <button className={`pill ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending</button>
                    <button className={`pill ${filterStatus === 'in-progress' ? 'active' : ''}`} onClick={() => setStatusFilter('in-progress')}>In Progress</button>
                    <button className={`pill ${filterStatus === 'completed' ? 'active' : ''}`} onClick={() => setStatusFilter('completed')}>Completed</button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)}>
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                {/* Show per-employee summaries (filtered/sorted) */}
                {(() => {
                    const byCount = (a, b) => {
                        const aCount = tasks.filter(t => (t.assignedTo?._id === a._id || t.assignedTo === a._id) && (!filterStatus || t.status === filterStatus)).length;
                        const bCount = tasks.filter(t => (t.assignedTo?._id === b._id || t.assignedTo === b._id) && (!filterStatus || t.status === filterStatus)).length;
                        return bCount - aCount;
                    };
                    let shown = [...employees].sort(byCount);
                    if (filterEmployee) shown = shown.filter(emp => emp._id === filterEmployee);
                    return shown.map(emp => {
                        const empTasks = tasks.filter(t => t.assignedTo?._id === emp._id || t.assignedTo === emp._id);
                        return (
                            <div key={emp._id} className="employee-profile" style={{ marginBottom: 16 }}>
                                <div className="employee-header">
                                    <h2>{emp.name}</h2>
                                    <div className="employee-sub">{emp.department || 'Employee'}</div>
                                </div>
                                <div className="employee-stats">
                                    <div className="stat-item">
                                        <div>Total</div>
                                        <div className="value">{empTasks.length}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div>Completed</div>
                                        <div className="value">{empTasks.filter(t => t.status === 'completed').length}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div>In Progress</div>
                                        <div className="value">{empTasks.filter(t => t.status === 'in-progress').length}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div>Pending</div>
                                        <div className="value">{empTasks.filter(t => t.status === 'pending').length}</div>
                                    </div>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    {empTasks.map(task => (
                                        <Card key={task._id} className="task-card" style={{ marginBottom: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{ margin: 0 }}>{task.title}</h3>
                                                    <div className="task-meta">
                                                        <span className={`badge status-${(task.status || '').replace(' ', '')}`}>{task.status}</span>
                                                    </div>
                                                    {task.image && (
                                                        <div style={{ marginTop: 8 }}>
                                                            <img src={task.image} alt={task.title} style={{ maxWidth: 240, width: '100%', borderRadius: 6 }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

            <div className="tasks-list" style={{ marginTop: '1rem' }}>
                {tasks.map(task => (
                    <Card key={task._id} className="task-card" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0 }}>{task.title}</h3>
                                <div className="task-meta">
                                    <span className={`badge status-${(task.status || '').replace(' ', '')}`}>{task.status}</span>
                                </div>
                                {task.image && (
                                    <div style={{ marginTop: 8 }}>
                                        <img src={task.image} alt={task.title} style={{ maxWidth: 240, width: '100%', borderRadius: 6 }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;