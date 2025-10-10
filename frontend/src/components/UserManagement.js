import React, { useState, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import UserFormModal from './UserFormModal';
import ConfirmationModal from './ConfirmationModal';
import './UserManagement.css';
import Papa from 'papaparse';
import { exportUsers, importUsers } from '../services/api';


const UserManagement = () => {
    const { users, setUsers } = useAuth();
    const { showNotification } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
    const [searchTerm, setSearchTerm] = useState('');

    const fileInputRef = useRef(null);

    const itemsPerPage = 10;

    const handleOpenModal = (user = null) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleSaveUser = (formData, isEditing) => {
        if (isEditing) {
            setUsers(prevUsers => prevUsers.map(u => u.id === formData.id ? { ...u, ...formData } : u));
            showNotification(`User "${formData.name}" updated successfully.`);
        } else {
            const userExists = users.some(u => u.collegeId === formData.collegeId);
            if (userExists) {
                showNotification(`User with College ID ${formData.collegeId} already exists.`, 'error');
                return;
            }
            const newUser = { ...formData, id: `USR${Date.now()}` };
            setUsers(prevUsers => [newUser, ...prevUsers]);
            showNotification(`User "${formData.name}" created successfully.`, 'success');
        }
        handleCloseModal();
    };

    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteUser = () => {
        if (!userToDelete) return;
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
        showNotification(`User "${userToDelete.name}" has been deleted.`, 'info');
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const response = await importUsers(results.data);
                        showNotification(response.message, 'success');
                        // Here you might want to refresh the user list from the backend
                        // For now, we'll just optimistically update if possible or just show the message.
                    } catch (error) {
                        showNotification(error.message, 'error');
                    }
                },
                error: (error) => {
                    showNotification(`Error parsing CSV: ${error.message}`, 'error');
                }
            });
        }
        event.target.value = null; // Reset file input
    };

    const handleExportClick = async () => {
        try {
            await exportUsers();
            showNotification('User data is being downloaded.', 'info');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    const handleDownloadTemplate = () => {
        // This can be a static file in your public folder
        window.location.href = '/assets/users_template.csv';
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.collegeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const sortedUsers = useMemo(() => {
        let sortableItems = [...filteredUsers];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredUsers, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

    return (
        <div className="admin-page-container">
            <div className="dashboard-header">
                <h2>User Management</h2>
                <p>Add, edit, or remove users from the system.</p>
            </div>

            <div className="dashboard-card full-width-card">
                <div className="table-actions-container">
                    <div className="bus-actions">
                        <button onClick={handleImportClick} className="import-csv-btn">Import CSV</button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                        <button onClick={handleExportClick} className="download-template-btn">Export CSV</button>
                        <button onClick={handleDownloadTemplate} className="download-template-btn">Download Template</button>
                    </div>
                    <div className="table-search-and-add">
                        <input
                            type="text"
                            placeholder="Search by name, ID, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <button onClick={() => handleOpenModal()} className="download-template-btn">Create New User</button>
                    </div>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')} className="sortable-header">Name {getSortIndicator('name')}</th>
                            <th onClick={() => requestSort('collegeId')} className="sortable-header">College ID {getSortIndicator('collegeId')}</th>
                            <th onClick={() => requestSort('role')} className="sortable-header">Role {getSortIndicator('role')}</th>
                            <th onClick={() => requestSort('status')} className="sortable-header">Status {getSortIndicator('status')}</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.map(user => (
                            <tr key={user.id}>
                                <td data-label="Name">{user.name}</td>
                                <td data-label="College ID">{user.collegeId}</td>
                                <td data-label="Role" className="role-cell">{user.role}</td>
                                <td data-label="Status"><span className={`status-badge status-${user.status}`}>{user.status}</span></td>
                                <td className="action-cell">
                                    <button onClick={() => handleOpenModal(user)} className="edit-btn">Edit</button>
                                    <button onClick={() => openDeleteModal(user)} className="delete-btn">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="pagination-container">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&laquo; Previous</button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next &raquo;</button>
                    </div>
                )}
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUser}
                user={currentUser}
            />
            <ConfirmationModal
                show={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteUser}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the user "${userToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default UserManagement;