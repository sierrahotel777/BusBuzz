import React, { useState, useEffect } from 'react';
import './UserFormModal.css'; // Re-using styles for consistency

function BusFormModal({ isOpen, onClose, onSave, bus, drivers }) {
    const [formData, setFormData] = useState({
        busNo: '',
        route: '',
        capacity: '',
        driver: '',
        status: 'Idle',
    });

    const isEditing = bus !== null;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setFormData({
                    busNo: bus.busNo || '',
                    route: bus.route || '',
                    capacity: bus.capacity || '',
                    driver: bus.driver || '',
                    status: bus.status || 'Idle',
                });
            } else {
                // Reset for new bus
                setFormData({
                    busNo: '',
                    route: '',
                    capacity: '',
                    driver: '',
                    status: 'Idle',
                });
            }
        }
    }, [bus, isEditing, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, isEditing);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content user-form-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✖</button>
                <h3>{isEditing ? 'Edit Bus' : 'Add New Bus'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="busNo">Bus Number</label>
                        <input type="text" name="busNo" value={formData.busNo} onChange={handleChange} required disabled={isEditing} placeholder="e.g., TN01AB1234" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="route">Route</label>
                        <input type="text" name="route" value={formData.route} onChange={handleChange} required placeholder="e.g., S1: VALASARAVAKKAM" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="capacity">Capacity</label>
                        <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required placeholder="e.g., 55" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="driver">Assigned Driver</label>
                        <select name="driver" value={formData.driver} onChange={handleChange}>
                            <option value="">Unassigned</option>
                            {drivers.map(driver => <option key={driver} value={driver}>{driver}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange}>
                            <option value="On Route">On Route</option>
                            <option value="Idle">Idle</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
                        <button type="submit" className="btn-save">{isEditing ? 'Save Changes' : 'Add Bus'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default BusFormModal;