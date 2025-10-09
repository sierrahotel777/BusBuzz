import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { importUsers, exportUsers } from '../services/api';
import UserFormModal from './UserFormModal';
import ConfirmationModal from './ConfirmationModal';
import './UserManagement.css';

function UserManagement() {
    const { users, deleteUser, user: currentUser, refetchUsers } = useAuth();
    const { showNotification } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const fileInputRef = useRef(null);

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

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportUsers();
            showNotification('User data export started.', 'info');
        } catch (error) {
            console.error('Export failed:', error);
            showNotification(`Export failed: ${error.message}`, 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setIsImporting(true);
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const response = await importUsers(results.data);
                        let message = response.message;
                        if (response.errors && response.errors.length > 0) {
                            message += ` ${response.errors.length} rows had errors.`;
                        }
                        showNotification(message, 'info');
                        refetchUsers(); // Refresh the user list
                    } catch (error) {
                        console.error('Import failed:', error);
                        showNotification(`Import failed: ${error.message}`, 'error');
                    } finally {
                        setIsImporting(false);
                        if(fileInputRef.current) fileInputRef.current.value = "";
                    }
                },
                error: (error) => {
                    console.error('CSV parsing error:', error);
                    showNotification(`Error parsing CSV: ${error.message}`, 'error');
                    setIsImporting(false);
                }
            });
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
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
                    <div className="header-actions">
                        <input
                            type="file"
                            accept=".csv"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button onClick={triggerFileInput} className="import-btn" disabled={isImporting}>
                            {isImporting ? 'Importing...' : 'Import CSV'}
                        </button>
                        <button onClick={handleExport} className="export-btn" disabled={isExporting}>
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                        <button onClick={() => handleOpenModal()} className="add-user-btn">Add New User</button>
                    </div>
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