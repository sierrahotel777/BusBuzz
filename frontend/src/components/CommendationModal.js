import React, { useState } from 'react';
import { useNotification } from './NotificationContext';
import './CommendationModal.css';
import { routeNames } from './routeData';

const praiseTags = ["Safe Driving", "Helpful & Courteous", "On-Time Champion", "Clean Bus"];

function CommendationModal({ isOpen, onClose, setCommendations }) {
    const [selectedRoute, setSelectedRoute] = useState('');
    const [selectedPraise, setSelectedPraise] = useState('');
    const [message, setMessage] = useState('');
    const { showNotification } = useNotification();;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedRoute || !selectedPraise) {
            showNotification("Please select a route and a reason for praise.", "error");
            return;
        }

        const newCommendation = {
            id: Date.now(),
            route: selectedRoute,
            praise: selectedPraise,
            message,
            date: new Date().toISOString(),
        };

        setCommendations(prev => [newCommendation, ...prev]);
        showNotification("Thank you for your positive feedback!");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content commendation-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✖</button>
                <h3>🏆 Praise a Driver</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="route-select">Which bus route?</label>
                        <select id="route-select" value={selectedRoute} onChange={(e) => setSelectedRoute(e.target.value)} required>
                            <option value="" disabled>Select a route</option>
                            {routeNames.map(route => <option key={route} value={route}>{route}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>What would you like to praise?</label>
                        <div className="praise-tags">
                            {praiseTags.map(tag => (
                                <button
                                    type="button"
                                    key={tag}
                                    className={`praise-tag ${selectedPraise === tag ? 'selected' : ''}`}
                                    onClick={() => setSelectedPraise(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">Add an optional message</label>
                        <textarea id="message" rows="3" placeholder="e.g., The driver was very helpful today." value={message} onChange={(e) => setMessage(e.target.value)}></textarea>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
                        <button type="submit" className="btn-save">Submit Praise</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CommendationModal;