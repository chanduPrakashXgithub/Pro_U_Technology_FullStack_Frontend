import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useApi } from '../hooks/useApi.js';
import { STATUS_OPTIONS } from '../utils/constants.js';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Button from '../components/common/Button.jsx';

const AddTask = () => {
    const [formData, setFormData] = useState({ title: '', description: '', status: 'pending', assignedTo: '' });
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { loading, error, request } = useApi();
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        // load employees for the Assigned To select
        request('get', '/employees').then(res => {
            const opts = (res || []).map(emp => ({ value: emp._id, label: emp.name }));
            setEmployees([{ value: '', label: 'Select employee' }, ...opts]);
            // If no assignedTo selected yet, set default to first employee id
            if (!formData.assignedTo && opts.length) setFormData(fd => ({ ...fd, assignedTo: fd.assignedTo || opts[0].value }));
        }).catch(() => setEmployees([{ value: '', label: 'No employees' }]));

        if (id) {
            request('get', `/tasks/${id}`).then(task => {
                if (!task) return;
                const assignedId = task.assignedTo && task.assignedTo._id ? task.assignedTo._id : task.assignedTo || '';
                setFormData({ title: task.title || '', description: task.description || '', status: task.status || 'pending', assignedTo: assignedId });
            }).catch(() => { });
        }
    }, [id, request]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                await request('put', `/tasks/${id}`, formData);
                // notify others that tasks changed
                window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'updated', id } }));
            } else {
                await request('post', '/tasks', formData);
                window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'created' } }));
            }
            navigate('/tasks');
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (!confirm('Delete this task?')) return;
        try {
            await request('delete', `/tasks/${id}`);
            // notify others that tasks changed
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'deleted', id } }));
            navigate('/tasks');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="add-task-page">
            <h1>{id ? 'Edit Task' : 'Add Task'}</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="form">
                <Input
                    label="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Select
                    label="Status"
                    options={STATUS_OPTIONS}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                />
                <Select
                    label="Assigned To"
                    options={employees}
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button type="submit" disabled={loading || !formData.assignedTo}>{loading ? 'Saving...' : 'Save'}</Button>
                    {id && user && user.role === 'admin' && (
                        <Button variant="danger" onClick={handleDelete}>Delete</Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AddTask;