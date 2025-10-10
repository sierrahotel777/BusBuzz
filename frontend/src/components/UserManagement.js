import React, { useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import './UserManagement.css';

function UserManagement() {
    const { users, isLoading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user =>
            (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    if (isLoading && !users.length) {
        return <div className="dashboard-grid"><p>Loading users...</p></div>;
    }

    return (
        <div className="dashboard-grid">
            <div className="dashboard-header">
                <h2>User Management</h2>
                <p>Add, edit, or import users for the BusBuzz system.</p>
            </div>

            <div className="dashboard-card full-width-card">
                <div className="table-actions-container">
                    <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <div className="user-management-actions">
                        <button className="import-csv-btn">Import Users</button>
                        <button className="add-new-btn">Add New User</button>
                    </div>
                </div>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Bus Route</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td data-label="Name">{user.name}</td>
                                <td data-label="Email">{user.email}</td>
                                <td data-label="Role">
                                    <span className={`status-badge status-${user.role}`}>{user.role}</span>
                                </td>
                                <td data-label="Bus Route">{user.busRoute || 'N/A'}</td>
                                <td data-label="Status">
                                    <span className={`status-badge status-${user.isActive ? 'active' : 'inactive'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <button className="edit-btn">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserManagement;