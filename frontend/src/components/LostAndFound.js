import React, { useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import './LostAndFound.css';

function LostAndFound({ items, setItems }) {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({ type: 'lost', item: '', route: '', description: '' });
    const [lostSearchTerm, setLostSearchTerm] = useState('');
    const [foundSearchTerm, setFoundSearchTerm] = useState('');

    const lostItems = useMemo(() =>
        items
            .filter(i => i.type === 'lost')
            .filter(i =>
                i.item.toLowerCase().includes(lostSearchTerm.toLowerCase()) ||
                i.description.toLowerCase().includes(lostSearchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date)),
        [items, lostSearchTerm]
    );
    const foundItems = useMemo(() =>
        items
            .filter(i => i.type === 'found')
            .filter(i =>
                i.item.toLowerCase().includes(foundSearchTerm.toLowerCase()) ||
                i.description.toLowerCase().includes(foundSearchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date)),
        [items, foundSearchTerm]
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.item || !formData.route || !formData.description) {
            showNotification("Please fill out all fields.", "error");
            return;
        }

        const newItem = {
            ...formData,
            id: Date.now(),
            user: user.name,
            date: new Date().toISOString(),
            status: formData.type === 'found' ? 'unclaimed' : undefined,
        };

        setItems(prev => [newItem, ...prev]);
        showNotification(`Your ${formData.type} item report has been posted!`);
        setFormData({ type: 'lost', item: '', route: '', description: '' }); // Reset form
    };

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
        <div className="lost-found-container">
            <div className="dashboard-header">
                <h2>Lost & Found</h2>
                <p>Report or find lost items on the bus.</p>
            </div>

            <div className="report-form-card">
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

            <div className="items-grid">
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