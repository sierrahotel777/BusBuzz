import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import ConfirmationModal from './ConfirmationModal';
import './UserManagement.css'; // We will create this file next

function UserManagement() {
    const { users, updateUser, deleteUser, register, refetchUsers } = useAuth();
    const { showNotification } = useNotification();

    const [editingUser, setEditingUser] = useState(null); // The user object being edited
    const [editedData, setEditedData] = useState({});
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
    const [isAdding, setIsAdding] = useState(false);

    const [userToDelete, setUserToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleEdit = (user) => {
        setEditingUser(user);
        setEditedData(user);
    };

    const handleCancel = () => {
        setEditingUser(null);
        setEditedData({});
    };

    const handleSave = () => {
        // In a real app, you would call an API here.
        // The updateUser function in AuthContext is a placeholder.
        updateUser(editedData);
        showNotification(`User ${editedData.name} updated successfully!`);
        handleCancel();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.password) {
            showNotification('Name, email, and password are required.', 'error');
            return;
        }
        try {
            await register(newUser);
            showNotification('User added successfully!', 'success');
            setNewUser({ name: '', email: '', password: '', role: 'student' }); // Reset form
            setIsAdding(false); // Hide form
            refetchUsers(); // Refetch users to show the new one
        } catch (error) {
            showNotification(error.message || 'Failed to add user.', 'error');
        }
    };

    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setUserToDelete(null);
        setShowDeleteModal(false);
    };

    const confirmDelete = () => {
        // In a real app, you would call an API here.
        // The deleteUser function in AuthContext is a placeholder.
        deleteUser(userToDelete.id);
        showNotification(`User ${userToDelete.name} has been deleted.`, 'info');
        closeDeleteModal();
    };

    return (
        <div className="user-management-container">
            <div className="dashboard-header">
                <h2>User Management</h2>
                <p>Add, edit, or remove users from the system.</p>
            </div>

            {!isAdding && (
                <div className="user-actions">
                    <button onClick={() => setIsAdding(true)} className="add-user-btn">
                        + Add New User
                    </button>
                </div>
            )}

            {isAdding && (
                <div className="dashboard-card">
                    <h3>Add New User</h3>
                    <form onSubmit={handleAddUser} className="add-user-form">
                        <input type="text" name="name" placeholder="Full Name" value={newUser.name} onChange={handleNewUserChange} required />
                        <input type="email" name="email" placeholder="Email Address" value={newUser.email} onChange={handleNewUserChange} required />
                        <input type="password" name="password" placeholder="Password" value={newUser.password} onChange={handleNewUserChange} required />
                        <select name="role" value={newUser.role} onChange={handleNewUserChange}>
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                        <div className="form-actions">
                            <button type="submit">Save User</button>
                            <button type="button" onClick={() => setIsAdding(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="dashboard-card full-width-card">
                <h3>All Users</h3>
                <div className="table-responsive">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id || user.email}>
                                    {editingUser?.id === user.id ? (
                                        <>
                                            <td><input type="text" name="name" value={editedData.name} onChange={handleChange} /></td>
                                            <td>{user.email}</td>
                                            <td>
                                                <select name="role" value={editedData.role} onChange={handleChange}>
                                                    <option value="student">Student</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="action-cell">
                                                <button onClick={handleSave} className="save-btn">Save</button>
                                                <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td data-label="Name">{user.name}</td>
                                            <td data-label="Email">{user.email}</td>
                                            <td data-label="Role"><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                                            <td className="action-cell">
                                                <button onClick={() => handleEdit(user)} className="edit-btn">Edit</button>
                                                <button onClick={() => openDeleteModal(user)} className="delete-btn">Remove</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Confirm User Deletion"
                message={`Are you sure you want to remove ${userToDelete?.name}? This action cannot be undone.`}
            />
        </div>
    );
}

export default UserManagement;