import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import Card from '../components/common/Card.jsx';
import LoadingSpinner from '../components/common/ui/LoadingSpinner.jsx';
import { useAuth } from '../hooks/useAuth.js';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [tasks, setTasks] = useState([]);
    const { loading, error, request } = useApi();
    const { user } = useAuth();

    const load = async () => {
        try {
            const [emps, tks] = await Promise.all([request('get', '/employees'), request('get', '/tasks')]);
            setEmployees(emps || []);
            setTasks(tks || []);
        } catch (err) {
            console.error(err);
        }
    };

    const [showAddEmployee, setShowAddEmployee] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', email: '', department: '', status: 'active' });
    const [editing, setEditing] = useState(null);
    const [showAddTaskFor, setShowAddTaskFor] = useState(null);
    const [newTask, setNewTask] = useState({ title: '', description: '', status: 'pending' });
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingTaskData, setEditingTaskData] = useState({ title: '', description: '', status: 'pending' });

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        try {
            await request('post', '/employees', newEmployee);
            setNewEmployee({ name: '', email: '', department: '', status: 'active' });
            setShowAddEmployee(false);
            load();
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'employees', action: 'created' } }));
        } catch (err) { console.error(err); }
    };

    const handleUpdateEmployee = async (id, data) => {
        try {
            await request('put', `/employees/${id}`, data);
            setEditing(null);
            load();
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'employees', action: 'updated', id } }));
        } catch (err) { console.error(err); }
    };

    const handleDeleteEmployee = async (id) => {
        if (!confirm('Delete this employee? This will not delete tasks.')) return;
        try {
            await request('delete', `/employees/${id}`);
            load();
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'employees', action: 'deleted', id } }));
        } catch (err) { console.error(err); }
    };

    const handleCreateTaskFor = async (empId, e) => {
        e.preventDefault();
        try {
            const payload = { ...newTask, assignedTo: empId };
            await request('post', '/tasks', payload);
            setNewTask({ title: '', description: '', status: 'pending' });
            setShowAddTaskFor(null);
            load();
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'created' } }));
        } catch (err) { console.error(err); }
    };

    const handleUpdateTask = async (taskId, data) => {
        try {
            await request('put', `/tasks/${taskId}`, data);
            // refresh tasks
            load();
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'updated', id: taskId } }));
        } catch (err) { console.error(err); }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        try {
            await request('delete', `/tasks/${taskId}`);
            load();
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'deleted', id: taskId } }));
        } catch (err) { console.error(err); }
    };

    const openEditTask = (task) => {
        setEditingTaskId(task._id);
        setEditingTaskData({ title: task.title || '', description: task.description || '', status: task.status || 'pending' });
    };

    const handleSaveEditTask = async (e) => {
        e.preventDefault();
        try {
            await request('put', `/tasks/${editingTaskId}`, editingTaskData);
            setEditingTaskId(null);
            setEditingTaskData({ title: '', description: '', status: 'pending' });
            load();
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { scope: 'tasks', action: 'updated', id: editingTaskId } }));
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        let mounted = true;
        const run = async () => { if (!mounted) return; await load(); };
        run();

        const onDataUpdated = (e) => { run(); };
        window.addEventListener('dataUpdated', onDataUpdated);

        return () => { mounted = false; window.removeEventListener('dataUpdated', onDataUpdated); };
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="employees-page">
            {error && <p className="error">{error}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h1>Employees</h1>
                {user && user.role === 'admin' && (
                    <div>
                        <Button onClick={() => setShowAddEmployee(v => !v)}>+ Add Employee</Button>
                    </div>
                )}
            </div>


            {showAddEmployee && user && user.role === 'admin' && (
                <form onSubmit={handleCreateEmployee} style={{ maxWidth: 560, marginBottom: 16 }}>
                    <Input label="Name" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
                    <Input label="Email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} />
                    <Input label="Department" value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} />
                    <select className="select" value={newEmployee.status} onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <div style={{ marginTop: 8 }}>
                        <Button type="submit">Create</Button>
                        <Button variant="secondary" onClick={() => setShowAddEmployee(false)} style={{ marginLeft: 8 }}>Cancel</Button>
                    </div>
                </form>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
                {employees.map(emp => {
                    const empTasks = tasks.filter(t => t.assignedTo?._id === emp._id || t.assignedTo === emp._id);
                    return (
                        <div key={emp._id} className="employee-profile">
                            <div className="employee-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2>{emp.name}</h2>
                                    <div className="employee-sub">{emp.department}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {user && user.role === 'admin' && (
                                        <>
                                            <Button onClick={() => setEditing(emp._id)}>Edit</Button>
                                            <Button variant="secondary" onClick={() => handleDeleteEmployee(emp._id)}>Delete</Button>
                                        </>
                                    )}
                                </div>
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
                                {editing === emp._id ? (
                                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateEmployee(emp._id, { name: emp.name, email: emp.email, department: emp.department, status: emp.status }); setEditing(null); }} style={{ marginBottom: 12 }}>
                                        <Input value={emp.name} onChange={(e) => { emp.name = e.target.value; setEmployees([...employees]); }} />
                                        <Input value={emp.email} onChange={(e) => { emp.email = e.target.value; setEmployees([...employees]); }} />
                                        <Input value={emp.department} onChange={(e) => { emp.department = e.target.value; setEmployees([...employees]); }} />
                                        <select className="select" value={emp.status} onChange={(e) => { emp.status = e.target.value; setEmployees([...employees]); }}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        <div style={{ marginTop: 8 }}>
                                            <Button type="submit">Save</Button>
                                            <Button variant="secondary" onClick={() => setEditing(null)} style={{ marginLeft: 8 }}>Cancel</Button>
                                        </div>
                                    </form>
                                ) : null}
                                {empTasks.map(task => (
                                    <Card key={task._id} className="task-card" style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0 }}>{task.title}</h3>
                                                <div className="task-meta">
                                                    <span className={`badge status-${(task.status || '').replace(' ', '')}`}>{task.status}</span>
                                                </div>
                                                {editingTaskId === task._id ? (
                                                    <form onSubmit={handleSaveEditTask} style={{ marginTop: 8 }}>
                                                        <Input value={editingTaskData.title} onChange={(e) => setEditingTaskData({ ...editingTaskData, title: e.target.value })} />
                                                        <Input value={editingTaskData.description} onChange={(e) => setEditingTaskData({ ...editingTaskData, description: e.target.value })} />
                                                        <select className="select" value={editingTaskData.status} onChange={(e) => setEditingTaskData({ ...editingTaskData, status: e.target.value })}>
                                                            <option value="pending">Pending</option>
                                                            <option value="in-progress">In Progress</option>
                                                            <option value="completed">Completed</option>
                                                        </select>
                                                        <div style={{ marginTop: 8 }}>
                                                            <Button type="submit">Save</Button>
                                                            <Button variant="secondary" onClick={() => setEditingTaskId(null)} style={{ marginLeft: 8 }}>Cancel</Button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <p style={{ marginTop: 6 }}>{task.description}</p>
                                                )}
                                            </div>
                                            <div className="task-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <select value={task.status} onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}>
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                                {user && user.role === 'admin' && (
                                                    <>
                                                        <Button onClick={() => openEditTask(task)}>Edit</Button>
                                                        <Button variant="danger" onClick={() => handleDeleteTask(task._id)}>Delete</Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}

                                {user && user.role === 'admin' && (
                                    <div style={{ marginTop: 8 }}>
                                        {!showAddTaskFor || showAddTaskFor !== emp._id ? (
                                            <Button onClick={() => setShowAddTaskFor(emp._id)}>+ Add Task</Button>
                                        ) : (
                                            <form onSubmit={(e) => handleCreateTaskFor(emp._id, e)} style={{ marginTop: 8 }}>
                                                <Input label="Title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
                                                <Input label="Description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
                                                <select className="select" value={newTask.status} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}>
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                                <div style={{ marginTop: 8 }}>
                                                    <Button type="submit">Create Task</Button>
                                                    <Button variant="secondary" onClick={() => setShowAddTaskFor(null)} style={{ marginLeft: 8 }}>Cancel</Button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Employees;
