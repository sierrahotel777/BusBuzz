import React, { useState, useMemo } from 'react';
import { useNotification } from './NotificationContext';
import { updateLostAndFound, deleteLostAndFound, getLostAndFound } from '../services/api';
import './Dashboard.css';
import './LostAndFound.css';

function LostAndFoundAdmin({ lostAndFoundItems, setLostAndFoundItems }) {
    const { showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

    const filteredItems = useMemo(() => {
        if (!searchTerm) {
            return lostAndFoundItems || [];
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return (lostAndFoundItems || []).filter(item =>
            item.item.toLowerCase().includes(lowercasedTerm) ||
            item.description.toLowerCase().includes(lowercasedTerm) ||
            item.user.toLowerCase().includes(lowercasedTerm) ||
            item.route.toLowerCase().includes(lowercasedTerm)
        );
    }, [lostAndFoundItems, searchTerm]);

    const sortedItems = useMemo(() => {
        let sortableItems = [...filteredItems];
        if (sortConfig.key) {
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
    }, [filteredItems, sortConfig]);

    const handleMarkAsClaimed = async (itemId) => {
        try {
            await updateLostAndFound(itemId, { status: 'claimed' });
            setLostAndFoundItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemId ? { ...item, status: 'claimed' } : item
                )
            );
            showNotification("Item status updated to 'Claimed'.");
        } catch (err) {
            showNotification(err.message || 'Failed to mark claimed', 'error');
        }
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="bus-management-container">
            <div className="dashboard-header">
                <h2>Lost & Found Management</h2>
                <p>View and manage all items reported as lost or found.</p>
            </div>

            <div className="dashboard-card full-width-card">
                <h3>All Reported Items</h3>
                <div className="table-controls">
                    <input
                        type="text"
                        placeholder="Search by item, user, route..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                {sortedItems.length > 0 ? (
                    <table className="feedback-table">
                        <thead>
                            <tr>
                                <th onClick={() => requestSort('item')} className="sortable-header">Item</th>
                                <th onClick={() => requestSort('user')} className="sortable-header">User</th>
                                <th onClick={() => requestSort('route')} className="sortable-header">Route</th>
                                <th onClick={() => requestSort('date')} className="sortable-header">Date</th>
                                <th onClick={() => requestSort('type')} className="sortable-header">Type</th>
                                <th onClick={() => requestSort('status')} className="sortable-header">Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedItems.map(item => (
                                <tr key={item.id}>
                                    <td data-label="Item">{item.item}</td>
                                    <td data-label="User">{item.user}</td>
                                    <td data-label="Route">{item.route}</td>
                                    <td data-label="Date">{new Date(item.date).toLocaleDateString()}</td>
                                    <td data-label="Type"><span className={`status-badge status-${item.type}`}>{item.type}</span></td>
                                    <td data-label="Status">
                                        <span className={`status-badge status-${item.status || 'reported'}`}>
                                            {item.status || 'Reported'}
                                        </span>
                                    </td>
                                    <td data-label="Action">
                                        {item.type === 'found' && item.status === 'unclaimed' && (
                                            <button onClick={() => handleMarkAsClaimed(item.id)} className="claim-btn">Mark as Claimed</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p>No items match your search or none have been reported yet.</p>}
            </div>
        </div>
    );
}

export default LostAndFoundAdmin;