import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { useNotification } from './NotificationContext';
import BusFormModal from './BusFormModal';
import './BusManagement.css';

function BusManagement({ busData, setBusData, users }) {
    const { showNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentBus, setCurrentBus] = useState(null);
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
        event.target.value = null;
    };

    const handleOpenModal = (bus = null) => {
        setCurrentBus(bus);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentBus(null);
    };

    const handleSaveBus = (formData, isEditing) => {
        if (isEditing) {
            setBusData(prevData =>
                prevData.map(bus =>
                    bus.busNo === formData.busNo ? { ...bus, ...formData } : bus
                )
            );
            showNotification(`Bus ${formData.busNo} updated successfully!`);
        } else {
            const busExists = busData.some(bus => bus.busNo === formData.busNo);
            if (busExists) {
                showNotification(`Bus with number ${formData.busNo} already exists.`, 'error');
                return;
            }
            const newBus = { ...formData, capacity: parseInt(formData.capacity, 10) || 0 };
            setBusData(prevData => [newBus, ...prevData]);
            showNotification(`Bus ${formData.busNo} added successfully!`, 'success');
        }
        handleCloseModal();
    };

    const itemsPerPage = 10;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBuses = busData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(busData.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const drivers = users.filter(u => u.role === 'driver').map(d => d.name);

    return (
        <div className="dashboard-grid"> 
            <div className="dashboard-header">
                <h2>Bus Management</h2>
                <p>View, edit, and import bus details for the entire fleet.</p>
            </div>

            <div className="dashboard-card full-width-card">
                <div className="table-actions-container">
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
                    <div className="user-management-actions">
                        <button onClick={() => handleOpenModal()} className="download-template-btn">Create New Bus</button>
                    </div>
                </div>
                <table className="admin-table">
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
                        {currentBuses.map(bus => (
                            <tr key={bus.busNo}>                               
                                <td data-label="Bus No.">{bus.busNo}</td>
                                <td data-label="Route">{bus.route}</td>
                                <td data-label="Capacity">{bus.capacity}</td>
                                <td data-label="Driver">{bus.driver || 'Unassigned'}</td>
                                <td data-label="Status"><span className={`status-badge status-${bus.status?.toLowerCase().replace(' ', '-')}`}>{bus.status}</span></td>
                                <td className="action-cell">
                                    <button onClick={() => handleOpenModal(bus)} className="edit-btn">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="pagination-container">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            &laquo; Previous
                        </button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                            Next &raquo;
                        </button>
                    </div>
                )}
            </div>
            <BusFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveBus}
                bus={currentBus}
                drivers={drivers}
            />
        </div>
    );
}

export default BusManagement;
