import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getLostAndFound, postLostAndFound, updateLostAndFound, deleteLostAndFound } from '../services/api';
import ConfirmationModal from './ConfirmationModal';
import './LostAndFound.css';
import './Form.css';
import './LostAndFoundAdmin.css';

function LostAndFound({ items, setItems, isAdminPage = false }) {
    const { user, awardPoints } = useAuth();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({ type: 'lost', item: '', route: '', description: '' });
    const [lostSearchTerm, setLostSearchTerm] = useState('');
    const [foundSearchTerm, setFoundSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [adminSearchTerm, setAdminSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });

    const filteredAndSortedItems = useMemo(() => {
        let filtered = [...items];

        if (isAdminPage && adminSearchTerm) {
            const lowercasedTerm = adminSearchTerm.toLowerCase();
            filtered = items.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(lowercasedTerm)
                )
            );
        }

        return filtered.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
    }, [items, isAdminPage, adminSearchTerm, sortConfig]);

    const lostItems = useMemo(() => filteredAndSortedItems.filter(i => i.type === 'lost' && (i.item.toLowerCase().includes(lostSearchTerm.toLowerCase()) || i.description.toLowerCase().includes(lostSearchTerm.toLowerCase()))), [filteredAndSortedItems, lostSearchTerm]);
    const foundItems = useMemo(() => filteredAndSortedItems.filter(i => i.type === 'found' && (i.item.toLowerCase().includes(foundSearchTerm.toLowerCase()) || i.description.toLowerCase().includes(foundSearchTerm.toLowerCase()))), [filteredAndSortedItems, foundSearchTerm]);

    const itemsPerPage = 10;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAndSortedItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    // Fetch items when the component mounts if items are empty (so data syncs with backend)
    useEffect(() => {
        let mounted = true;
        if (!items || items.length === 0) {
            getLostAndFound().then(data => {
                if (!mounted) return;
                // normalize id field
                const mapped = data.map(d => ({ ...d, id: d.id || d._id }));
                setItems(mapped);
            }).catch(err => {
                // keep using local data if backend is unreachable
                console.warn('Failed to load lost & found from backend:', err.message);
            });
        }
        return () => { mounted = false; };
    }, [items, setItems]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    const handleMarkAsClaimed = async (itemId) => {
        try {
            await updateLostAndFound(itemId, { status: 'claimed' });
            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemId ? { ...item, status: 'claimed' } : item
                )
            );
            showNotification("Item status updated to 'Claimed'.");
        } catch (err) {
            showNotification(err.message || 'Failed to mark claimed', 'error');
        }
    };

    const openDeleteModal = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteLostAndFound(itemToDelete.id);
            setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
            showNotification(`Item "${itemToDelete.item}" has been deleted.`, "info");
        } catch (err) {
            showNotification(err.message || 'Failed to delete item.', 'error');
        }
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.item || !formData.route || !formData.description) {
            showNotification("Please fill out all fields.", "error");
            return;
        }
        try {
            const payload = { ...formData, user: user.name };
            const created = await postLostAndFound(payload);
            // backend returns { ...doc, id }
            setItems(prev => [{ ...created, id: created.id }, ...prev]);
            if (created.type === 'found') {
                awardPoints(20);
            }
            showNotification(`Your ${formData.type} item report has been posted!`);
            setFormData({ type: 'lost', item: '', route: '', description: '' });
        } catch (err) {
            showNotification(err.message || 'Failed to post report.', 'error');
        }
    };

    if (isAdminPage) {
        return (
            <div className="dashboard-grid">
                <div className="dashboard-header">
                    <h2>Manage Lost & Found</h2>
                    <p>Review, update, and manage all reported items.</p>
                </div>
                <div className="dashboard-card full-width-card">
                    <div className="table-controls">
                        <input
                            type="text"
                            placeholder="Search all items..."
                            value={adminSearchTerm}
                            onChange={(e) => setAdminSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th onClick={() => requestSort('item')} className="sortable-header">
                                    Item {getSortIndicator('item')}
                                </th>
                                <th onClick={() => requestSort('type')} className="sortable-header">
                                    Type {getSortIndicator('type')}
                                </th>
                                <th onClick={() => requestSort('route')} className="sortable-header">
                                    Route {getSortIndicator('route')}
                                </th>
                                <th onClick={() => requestSort('user')} className="sortable-header">
                                    Reported By {getSortIndicator('user')}
                                </th>
                                <th onClick={() => requestSort('date')} className="sortable-header">
                                    Date {getSortIndicator('date')}
                                </th>
                                <th onClick={() => requestSort('status')} className="sortable-header">
                                    Status {getSortIndicator('status')}
                                </th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(item => (
                                <tr key={item.id}>
                                    <td data-label="Item">{item.item}</td>
                                    <td data-label="Type"><span className={`item-type-badge ${item.type}`}>{item.type}</span></td>
                                    <td data-label="Route">{item.route}</td>
                                    <td data-label="Reported By">{item.user}</td>
                                    <td data-label="Date">{new Date(item.date).toLocaleDateString()}</td>
                                    <td data-label="Status">
                                        {item.status ? <span className={`status ${item.status}`}>{item.status}</span> : 'N/A'}
                                    </td>
                                    <td data-label="Actions" className="action-cell">
                                        {item.type === 'found' && item.status === 'unclaimed' && (
                                            <button onClick={() => handleMarkAsClaimed(item.id)} className="claim-btn">Mark Claimed</button>
                                        )}
                                        <button onClick={() => openDeleteModal(item)} className="delete-btn">Delete</button>
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
                <ConfirmationModal
                    show={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={confirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the report for "${itemToDelete?.item}"? This action cannot be undone.`}
                />
            </div>
        );
    }

    const ItemCard = ({ item }) => (
        <div className={`item-card ${item.type === 'found' ? 'found-item' : 'lost-item'}`}>
            <h4>{item.item}</h4>
            <p><strong>{item.type === 'lost' ? 'Last Seen on:' : 'Found on:'}</strong> Route {item.route}</p>
            <p>{item.description}</p>
            <div className="item-footer">
                <span>Posted by {item.user}</span>
                {item.status && <span className={`item-status ${item.status}`}>{item.status}</span>}
                <span>{new Date(item.date).toLocaleDateString()}</span>
            </div>
        </div>
    );
    

    return (
        <div className="dashboard-grid">
            <div className="dashboard-header">
                <h2>Lost & Found</h2>
                <p>Report or find lost items on the bus.</p>
            </div>

            <div className="form-container report-form-card">
                <h2>Report an Item</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="report-type-selector">
                            <label className={formData.type === 'lost' ? 'active' : ''}>
                                <input type="radio" name="type" value="lost" checked={formData.type === 'lost'} onChange={handleChange} />
                                <span>🔍 I've Lost an Item</span>
                            </label>
                            <label className={formData.type === 'found' ? 'active' : ''}>
                                <input type="radio" name="type" value="found" checked={formData.type === 'found'} onChange={handleChange} />
                                <span>🎁 I've Found an Item</span>
                            </label>
                        </div>
                    </div>
                    <div className="form-group-inline">
                        <div className="form-group">
                            <label htmlFor="item-name">Item Name</label>
                            <input type="text" name="item" placeholder="What was the item? (e.g., Black Notebook)" value={formData.item} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="bus-route">Bus Route</label>
                            <input type="text" name="route" placeholder="Which bus route? (e.g., S5)" value={formData.route} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea name="description" rows="3" placeholder="Provide a brief description, like color, brand, or where you last saw it..." value={formData.description} onChange={handleChange} required></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn-submit-report">Post Report</button>
                    </div>
                </form>
            </div>

            <div className="dashboard-card full-width-card">
                <div className="items-column">
                    <h3><span className="column-icon">🔍</span>Recently Lost</h3>
                    <div className="search-bar-container">
                        <input
                            type="text"
                            placeholder="Search lost items by name or description..."
                            value={lostSearchTerm}
                            onChange={(e) => setLostSearchTerm(e.target.value)}
                            className="item-search"
                        />
                    </div>
                    <div className="items-list">
                        {lostItems.length > 0 ? lostItems.map(item => <ItemCard key={item.id} item={item} />) : <p>No lost items reported.</p>}
                    </div>
                </div>
            </div>
            <div className="dashboard-card full-width-card">
                <div className="items-column">
                    <h3><span className="column-icon">🎁</span>Recently Found</h3>
                    <div className="search-bar-container">
                        <input
                            type="text"
                            placeholder="Search found items by name or description..."
                            value={foundSearchTerm}
                            onChange={(e) => setFoundSearchTerm(e.target.value)}
                            className="item-search"
                        />
                    </div>
                    <div className="items-list">
                        {foundItems.length > 0 ? foundItems.map(item => <ItemCard key={item.id} item={item} />) : <p>No found items reported.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LostAndFound;