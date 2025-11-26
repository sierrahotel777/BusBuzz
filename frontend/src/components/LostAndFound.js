import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getLostAndFound, postLostAndFound, updateLostAndFound, deleteLostAndFound, uploadAttachment, getRoutes } from '../services/api';
import ConfirmationModal from './ConfirmationModal';
import './LostAndFound.css';
import './Form.css';
import './LostAndFoundAdmin.css';

function LostAndFound({ items = [], setItems, isAdminPage = false }) {
    const { user, awardPoints } = useAuth();
    const { showNotification } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ type: 'lost', item: '', route: '', description: '' });
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentName, setAttachmentName] = useState('');
    const [modal, setModal] = useState(null);
    const [lostSearchTerm, setLostSearchTerm] = useState('');
    const [foundSearchTerm, setFoundSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [adminSearchTerm, setAdminSearchTerm] = useState('');
    const [routes, setRoutes] = useState([]);
    const [routeSearch, setRouteSearch] = useState('');
    const [showRouteDropdown, setShowRouteDropdown] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function loadRoutes() {
            try {
                const data = await getRoutes();
                if (mounted) setRoutes(Array.isArray(data) ? data : []);
            } catch (e) {
                console.warn('Failed to load routes for Lost & Found:', e);
                if (mounted) setRoutes([]);
            }
        }
        loadRoutes();
        return () => { mounted = false; };
    }, []);

    // Compute filtered items for student view
    const lostItems = useMemo(() => 
        items.filter(item => item.type === 'lost' && item.item.toLowerCase().includes(lostSearchTerm.toLowerCase())) || [],
        [items, lostSearchTerm]
    );

    const foundItems = useMemo(() => 
        items.filter(item => item.type === 'found' && item.item.toLowerCase().includes(foundSearchTerm.toLowerCase())) || [],
        [items, foundSearchTerm]
    );

    // Compute filtered items for admin view
    const filteredAdminItems = useMemo(() => 
        items.filter(item => 
            item.item.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(adminSearchTerm.toLowerCase())
        ) || [],
        [items, adminSearchTerm]
    );

    // Fetch items from backend on component mount or when user changes
    useEffect(() => {
        let mounted = true;
        const fetchItems = async () => {
            setIsLoading(true);
            try {
                // Students see only their own items; admins see all items
                const query = isAdminPage ? {} : { userId: user?.id };
                const data = await getLostAndFound(query);
                // Normalize id field for consistency
                const mapped = (data || []).map(d => ({ ...d, id: d.id || d._id }));
                if (mounted) {
                    setItems(mapped);
                }
            } catch (err) {
                console.error('Failed to fetch lost & found from backend:', err.message);
                showNotification('Failed to load lost & found items.', 'error');
                if (mounted) setItems([]);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        if (user?.id) fetchItems();
        return () => { mounted = false; };
    }, [user?.id, isAdminPage, setItems, showNotification]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const filteredRoutes = useMemo(() => 
        routes.filter(r => r.name.toLowerCase().includes(routeSearch.toLowerCase())),
        [routes, routeSearch]
    );

    const handleRouteInputChange = (e) => {
        setRouteSearch(e.target.value);
        setShowRouteDropdown(true);
    };

    const handleRouteSelect = (routeName) => {
        setFormData(prev => ({ ...prev, route: routeName }));
        setRouteSearch(routeName);
        setShowRouteDropdown(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
            setAttachmentName(e.target.files[0].name);
        }
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
            const descWithEmail = user?.email ? `${formData.description}\n\nContact: ${user.email}` : formData.description;
            const payload = { ...formData, description: descWithEmail, user: user.name, userId: user.id };
            // If attachment present, upload first
            if (attachmentFile) {
                try {
                    const up = await uploadAttachment(attachmentFile);
                    payload.attachments = [{ url: up.url, name: up.originalName }];
                    payload.attachmentName = up.filename || attachmentFile.name;
                } catch (upErr) {
                    console.error('Attachment upload failed:', upErr);
                    showNotification('Attachment upload failed; posting report without attachment.', 'warning');
                }
            }
            const created = await postLostAndFound(payload);
            // backend returns { ...doc, id }
            setItems(prev => [{ ...created, id: created.id || created._id }, ...prev]);
            if (created.type === 'found') {
                awardPoints(20);
            }
            showNotification(`Your ${formData.type} item report has been posted!`);
            setFormData({ type: 'lost', item: '', route: '', description: '' });
            setAttachmentFile(null);
            setAttachmentName('');
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
                                <th>Item</th>
                                <th>Type</th>
                                <th>Route</th>
                                <th>Reported By</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdminItems.map(item => (
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
            {item.attachments && item.attachments.length > 0 && (
                <div className="attachment-row">
                    {(() => {
                        const raw = item.attachments[0].url || '';
                        const url = /^https?:\/\//i.test(raw) ? raw : `${process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/api\/?$/,'') : ''}${raw}`;
                        const name = item.attachments[0].name || 'Attachment';
                        return (
                            <button className="attachment-btn" onClick={() => setModal({ url, name })}>View Attachment</button>
                        );
                    })()}
                </div>
            )}
            <div className="item-footer">
                <span>Posted by {item.user}</span>
                {item.status && <span className={`item-status ${item.status}`}>{item.status}</span>}
                <span>{new Date(item.date).toLocaleDateString()}</span>
                {item.type === 'lost' && item.userId === user.id && (
                    <button className="delete-btn" onClick={() => openDeleteModal(item)}>Remove from list</button>
                )}
            </div>
        </div>
    );
    

    return (
        <>
        <div className="lost-and-found-container">
            <div className="dashboard-header">
                <h2>Lost & Found</h2>
                <p>Report or find lost items on the bus.</p>
            </div>

            {isLoading && <div className="dashboard-card full-width-card"><p>Loading items...</p></div>}

            <div className="dashboard-card full-width-card report-form-card">
                <h3>Report an Item</h3>
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
                            <label htmlFor="item-name">Item Name <span style={{ color: 'red' }}>*</span></label>
                            <input type="text" name="item" placeholder="What was the item? (e.g., Black Notebook)" value={formData.item} onChange={handleChange} required />
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label htmlFor="bus-route">Bus Route <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                name="route"
                                placeholder="Search or select a route..."
                                value={routeSearch}
                                onChange={handleRouteInputChange}
                                onFocus={() => setShowRouteDropdown(true)}
                                autoComplete="off"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--border-radius)',
                                    fontSize: '1rem',
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-color)'
                                }}
                            />
                            {showRouteDropdown && filteredRoutes.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    backgroundColor: 'var(--surface-color)',
                                    border: '1.5px solid var(--border-color)',
                                    borderRadius: '6px',
                                    marginTop: '4px',
                                    zIndex: 1000,
                                    boxShadow: '0 4px 8px var(--shadow-color)'
                                }}>
                                    {filteredRoutes.map(r => (
                                        <div
                                            key={r._id || r.name}
                                            onClick={() => handleRouteSelect(r.name)}
                                            style={{
                                                padding: '12px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--border-color)',
                                                color: 'var(--text-color)',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--subtle-bg)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            {r.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description <span style={{ color: 'red' }}>*</span></label>
                        <textarea name="description" rows="3" placeholder="Provide a brief description, like color, brand, or where you last saw it..." value={formData.description} onChange={handleChange} required></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="attachment">Attach a photo (optional)</label>
                        <input type="file" id="attachment" accept="image/*,video/*,.pdf" onChange={handleFileChange} />
                        {attachmentName && <p className="selected-file">Selected: {attachmentName}</p>}
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn-submit-report">Post Report</button>
                    </div>
                </form>
            </div>

            {!isLoading && (
                <>
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
                        <div className="items-list">{foundItems.length > 0 ? foundItems.map(item => <ItemCard key={item.id} item={item} />) : <p>No found items reported.</p>}</div>
                    </div>
                </div>
                </>
            )}
        </div>
        {modal && (
            <div className="attachment-modal" onClick={() => setModal(null)}>
                <div className="attachment-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="attachment-modal-header">
                        <strong>{modal.name}</strong>
                        <button className="close-btn" onClick={() => setModal(null)}>✕</button>
                    </div>
                    <div className="attachment-modal-body">
                        {(() => {
                            const url = modal.url;
                            const ext = (modal.name || '').split('.').pop().toLowerCase();
                            if (['png','jpg','jpeg','gif','webp'].includes(ext)) return <img src={url} alt={modal.name} />;
                            if (['mp4','webm','ogg'].includes(ext)) return <video src={url} controls />;
                            if (['pdf'].includes(ext)) return <iframe src={url} title={modal.name} />;
                            return <a href={url} target="_blank" rel="noopener noreferrer">Open attachment</a>;
                        })()}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

export default LostAndFound;