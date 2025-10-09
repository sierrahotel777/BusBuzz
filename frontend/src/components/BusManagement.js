import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useNotification } from './NotificationContext';
import './BusManagement.css';

function BusManagement({ busData, setBusData, users }) {
    const { showNotification } = useNotification();
    const [editingBus, setEditingBus] = useState(null);
    const [editedData, setEditedData] = useState({});
    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const newBuses = results.data.map(row => ({
                        ...row,
                        capacity: parseInt(row.capacity, 10) || 0,
                    }));

                    // Merge new data with existing data, updating by busNo
                    setBusData(prevData => {
                        const busMap = new Map(prevData.map(bus => [bus.busNo, bus]));
                        newBuses.forEach(bus => busMap.set(bus.busNo, { ...busMap.get(bus.busNo), ...bus }));
                        return Array.from(busMap.values());
                    });

                    showNotification(`${newBuses.length} bus records imported/updated successfully!`, 'success');
                },
                error: (error) => {
                    showNotification(`Error parsing CSV: ${error.message}`, 'error');
                }
            });
        }
        // Reset file input so the same file can be uploaded again
        event.target.value = null;
    };

    const handleEdit = (bus) => {
        setEditingBus(bus.busNo);
        setEditedData(bus);
    };

    const handleCancel = () => {
        setEditingBus(null);
        setEditedData({});
    };

    const handleSave = () => {
        setBusData(prevData =>
            prevData.map(bus =>
                bus.busNo === editingBus ? { ...bus, ...editedData } : bus
            )
        );
        showNotification(`Bus ${editingBus} updated successfully!`);
        handleCancel();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedData(prev => ({ ...prev, [name]: value }));
    };

    const drivers = users.filter(u => u.role === 'driver').map(d => d.name);

    return (
        <div className="bus-management-container">
            <div className="dashboard-header">
                <h2>Bus Fleet Management</h2>
                <p>View, edit, and import bus details for the entire fleet.</p>
            </div>

            <div className="bus-actions">
                <button onClick={handleImportClick} className="import-csv-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                    Import from CSV
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".csv"
                    onChange={handleFileChange}
                />
                 <a href="/assets/buses.csv" download="buses_template.csv" className="download-template-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                    Download Template
                </a>
            </div>

            <div className="dashboard-card full-width-card">
                <h3>Bus Details</h3>
                <div className="table-responsive">
                    <table className="bus-table">
                        <thead>
                            <tr>
                                <th>Bus No.</th>
                                <th>Route</th>
                                <th>Capacity</th>
                                <th>Assigned Driver</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {busData.map(bus => (
                                <tr key={bus.busNo}>
                                    {editingBus === bus.busNo ? (
                                        <>
                                            <td>{bus.busNo}</td>
                                            <td><input type="text" name="route" value={editedData.route} onChange={handleChange} /></td>
                                            <td><input type="number" name="capacity" value={editedData.capacity} onChange={handleChange} /></td>
                                            <td>
                                                <select name="driver" value={editedData.driver || ''} onChange={handleChange}>
                                                    <option value="">Unassigned</option>
                                                    {drivers.map(driver => <option key={driver} value={driver}>{driver}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <select name="status" value={editedData.status} onChange={handleChange}>
                                                    <option value="On Route">On Route</option>
                                                    <option value="Idle">Idle</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                </select>
                                            </td>
                                            <td className="action-cell">
                                                <button onClick={handleSave} className="save-btn">Save</button>
                                                <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td data-label="Bus No.">{bus.busNo}</td>
                                            <td data-label="Route">{bus.route}</td>
                                            <td data-label="Capacity">{bus.capacity}</td>
                                            <td data-label="Driver">{bus.driver || 'Unassigned'}</td>
                                            <td data-label="Status"><span className={`status-badge status-${bus.status?.toLowerCase().replace(' ', '-')}`}>{bus.status}</span></td>
                                            <td className="action-cell">
                                                <button onClick={() => handleEdit(bus)} className="edit-btn">Edit</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default BusManagement;

```

### 4. Create `BusManagement.css`

This file will style the new bus management page.

```diff