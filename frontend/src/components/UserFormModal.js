import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import './UserFormModal.css';
import PasswordInput from './PasswordInput';

function UserFormModal({ isOpen, onClose, user }) {
    const { addUser, updateUser } = useAuth();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'student',
        password: '',
        collegeId: '',
        busRoute: ''
    });

    const isEditing = user !== null;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    role: user.role || 'student',
                    password: '', 
                    collegeId: user.collegeId || '',
                    busRoute: user.busRoute || ''
                });
            } else {
                setFormData({ name: '', email: '', role: 'student', password: '', collegeId: '', busRoute: '' });
            }
        }
    }, [user, isEditing, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            const dataToUpdate = { ...formData };
            if (!dataToUpdate.password) {
                delete dataToUpdate.password;
            }
            updateUser({ ...user, ...dataToUpdate });
            showNotification('User updated successfully!');
        } else {
            addUser(formData);
            showNotification('User added successfully!');
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content user-form-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✖</button>
                <h3>{isEditing ? 'Edit User' : 'Add New User'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <PasswordInput 
                            name="password" 
                            placeholder={isEditing ? 'Leave blank to keep current' : ''} 
                            value={formData.password}
                            onChange={handleChange} 
                            required={!isEditing} 
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="collegeId">College ID</label>
                        <input type="text" name="collegeId" value={formData.collegeId} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="busRoute">Bus Route</label>
                        <input type="text" name="busRoute" value={formData.busRoute} onChange={handleChange} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
                        <button type="submit" className="btn-save">{isEditing ? 'Save Changes' : 'Add User'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UserFormModal;