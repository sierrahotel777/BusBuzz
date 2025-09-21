import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import UserFormModal from './UserFormModal';
import ConfirmationModal from './ConfirmationModal';
import './UserManagement.css';

function UserManagement() {
    const { users, deleteUser, user: currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleOpenDeleteModal = (user) => {
        if (user.id === currentUser.id) {
            showNotification("You cannot delete your own account.", "error");
            return;
        }
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setUserToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleDeleteConfirm = () => {
        deleteUser(userToDelete.id);
        showNotification(`User "${userToDelete.name}" has been deleted.`, 'info');
        handleCloseDeleteModal();
    };

    return (
        <div className="user-management-container">
            <div className="dashboard-header">
                <h2>User Management</h2>
                <p>Add, edit, or remove user accounts.</p>
            </div>
            <div className="dashboard-card">
                <div className="table-header">
                    <h3>All Users ({users.length})</h3>
                    <button onClick={() => handleOpenModal()} className="add-user-btn">Add New User</button>
                </div>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>College ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                                <td>{user.collegeId}</td>
                                <td className="action-cell">
                                    <button onClick={() => handleOpenModal(user)} className="edit-btn">Edit</button>
                                    <button onClick={() => handleOpenDeleteModal(user)} className="delete-btn">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <UserFormModal isOpen={isModalOpen} onClose={handleCloseModal} user={editingUser} />
            <ConfirmationModal show={isDeleteModalOpen} onClose={handleCloseDeleteModal} onConfirm={handleDeleteConfirm} title="Confirm User Deletion" message={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`} />
        </div>
    );
}

export default UserManagement;