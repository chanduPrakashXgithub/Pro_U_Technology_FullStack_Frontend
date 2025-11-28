import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useApi } from '../hooks/useApi.js';
import { STATUS_OPTIONS } from '../utils/constants.js';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Select from '../components/common/Select.jsx';
import LoadingSpinner from '../components/common/ui/LoadingSpinner.jsx';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterEmployee, setFilterEmployee] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();
    const { loading, error, request } = useApi();

    const handleDelete = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        try {
            await request('delete', `/tasks/${taskId}`);
            // reload tasks
            let url = '/tasks';
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (filterEmployee) params.append('assignedTo', filterEmployee);
            if (user.role === 'user') params.append('assignedTo', user.id);
            if (params.toString()) url += `?${params}`;
            request('get', url).then(setTasks);
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'deleted', id: taskId } }));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        let mounted = true;
        const fetchTasks = () => {
            let url = '/tasks';
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (filterEmployee) params.append('assignedTo', filterEmployee);
            if (user && user.role === 'user') params.append('assignedTo', user.id);
            if (params.toString()) url += `?${params}`;
            request('get', url).then(res => { if (mounted) setTasks(res); }).catch(() => { });
        };
        fetchTasks();

        const onDataUpdated = (e) => {
            // if tasks changed elsewhere, refresh
            fetchTasks();
        };
        window.addEventListener('dataUpdated', onDataUpdated);

        return () => { mounted = false; window.removeEventListener('dataUpdated', onDataUpdated); };
    }, [filterStatus, filterEmployee, user, request]);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="tasks-page">
            <div className="page-header">
                <h1>Tasks</h1>
                <div className="actions">
                    <Button onClick={() => navigate('/add-task')}>Add Task</Button>
                </div>
            </div>
            {error && <p className="error">{error}</p>}
            <div className="filters">
                <Select
                    options={[{ value: '', label: 'All Statuses' }, ...STATUS_OPTIONS]}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                />
                {/* Employee filter would need employees list; for brevity, skipped */}
            </div>
            <div className="tasks-list">
                {tasks.map(task => (
                    <Card key={task._id} className="task-card animate-stagger">
                        <h3>{task.title}</h3>
                        <div className="task-meta">
                            <span className={`badge status-${(task.status || '').replace(' ', '')}`}>{task.status}</span>
                            <span className="muted">Assigned: {task.assignedTo?.name || '—'}</span>
                        </div>
                        <p className="lead" style={{ marginTop: 6 }}>{task.description}</p>
                        <div className="task-actions">
                            <Button onClick={() => navigate(`/edit-task/${task._id}`)}>Edit</Button>
                            {user && user.role === 'admin' && (
                                <Button variant="danger" onClick={() => handleDelete(task._id)}>Delete</Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Tasks;