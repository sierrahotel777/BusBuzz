// frontend/components/FeedbackDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { updateFeedbackStatus } from '../services/api'; 
import './FeedbackDetail.css';

// 🛑 IMPORTANT ASSUMPTION: This component will now FETCH data by ID 
// instead of relying on props, which is necessary for a backend-driven app.

function FeedbackDetail() {
    const { feedbackId } = useParams();
    const [feedback, setFeedback] = useState(null);
    const [internalNote, setInternalNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // 🎯 FIX: Added missing state
    const [isLoading, setIsLoading] = useState(true);
    
    const { user } = useAuth();
    const { showNotification } = useNotification();

    // Placeholder for fetching a single feedback item (This is necessary!)
    useEffect(() => {
        const fetchFeedback = async () => {
            if (!user || !user.token) return;

            try {
                setIsLoading(true);
                // 🛑 NOTE: You need a GET /api/feedback/:id endpoint (already defined in backend/routes/feedback.js)
                const response = await fetch(`${process.env.REACT_APP_API_URL}/feedback/${feedbackId}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                    },
                });
                const data = await response.json();

                if (!response.ok) {
                    showNotification(data.message || 'Failed to load feedback.', 'error');
                    setFeedback(null);
                } else {
                    setFeedback(data);
                }
            } catch (error) {
                showNotification('Network error while fetching details.', 'error');
                setFeedback(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFeedback();
    }, [feedbackId, user, showNotification]);

    const handleStatusChange = async (newStatus) => {
        if (!user || !user.token) {
            showNotification('Authentication required.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Call the API service to update the status
            await updateFeedbackStatus(
                feedbackId, 
                newStatus, 
                internalNote, 
                user.token
            );
            
            // Optimistically update the local state after successful API call
            setFeedback(prev => ({
                ...prev, 
                status: newStatus,
                resolution: newStatus === 'Resolved' ? {
                    resolvedBy: user.name,
                    resolvedOn: new Date().toISOString(),
                    notes: internalNote || 'Issue marked as resolved.'
                } : prev.resolution
            }));
            
            showNotification(`Status updated to ${newStatus}.`, 'success');
            setInternalNote(''); // Clear the note field
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="feedback-detail-container">Loading feedback details...</div>;
    }

    if (!feedback) {
        return (
            <div className="feedback-detail-container">
                <h2>Feedback Not Found</h2>
                <p>The requested feedback item could not be found.</p>
                <Link to="/admin" className="back-link">← Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="feedback-detail-container">
            <div className="feedback-detail-header">
                <h2>Feedback Details ({feedback.id})</h2>
                <Link to="/admin" className="back-link">← Back to Dashboard</Link>
            </div>

            <div className={`status-badge ${feedback.status.toLowerCase().replace(' ', '-')}`}>
                Current Status: {feedback.status}
            </div>

            <div className="feedback-grid">
                <div className="detail-card user-info">
                    <h3>Submitted By</h3>
                    <p><strong>Name:</strong> {feedback.user}</p>
                    <p><strong>College ID:</strong> {feedback.collegeId}</p>
                    <p><strong>Submitted:</strong> {new Date(feedback.submittedOn).toLocaleString()}</p>
                </div>

                <div className="detail-card bus-info">
                    <h3>Bus Details</h3>
                    <p><strong>Route:</strong> {feedback.route}</p>
                    <p><strong>Bus No:</strong> {feedback.busNo}</p>
                    {feedback.attachments && feedback.attachments.length > 0 && (
                        <p>
                            <strong>Attachments:</strong> 
                            <a href={feedback.attachments[0]} target="_blank" rel="noopener noreferrer" className="attachment-link">View Attachment</a>
                        </p>
                    )}
                </div>

                <div className="detail-card ratings-info">
                    <h3>Ratings / Category</h3>
                    {feedback.details.punctuality && <p><strong>Punctuality:</strong> {feedback.details.punctuality}</p>}
                    {feedback.details.driverBehavior && <p><strong>Driver Behavior:</strong> {feedback.details.driverBehavior}</p>}
                    {feedback.details.cleanliness && <p><strong>Cleanliness:</strong> {feedback.details.cleanliness}</p>}
                    {feedback.issue && <p><strong>Issue Category:</strong> {feedback.issue}</p>}
                </div>

                <div className="detail-card comments-info full-width-card">
                    <h3>Student's Comments</h3>
                    <p>{feedback.comments}</p>
                </div>

                {feedback.status === 'Resolved' && feedback.resolution && (
                    <div className="detail-card resolution-info full-width-card">
                        <h3>Resolution Details</h3>
                        <p><strong>Resolved By:</strong> {feedback.resolution.resolvedBy}</p>
                        <p><strong>Resolved On:</strong> {new Date(feedback.resolution.resolvedOn).toLocaleString()}</p>
                        <p><strong>Notes:</strong> {feedback.resolution.notes}</p>
                    </div>
                )}

                {/* 🎯 FIX: Buttons now correctly check the isSubmitting state */}
                {feedback.status !== 'Resolved' && (
                    <div className="detail-card admin-actions full-width-card">
                        <h3>Admin Actions</h3>
                        <div className="action-group">
                            <label htmlFor="internalNote">Add Internal Note / Resolution</label>
                            <textarea 
                                id="internalNote"
                                rows="4"
                                placeholder="e.g., Spoke with the driver..."
                                value={internalNote}
                                onChange={(e) => setInternalNote(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="action-buttons">
                            <button 
                                className="action-btn resolve" 
                                onClick={() => handleStatusChange('Resolved')}
                                disabled={isSubmitting} // 🎯 FIX: Use isSubmitting to disable
                            >
                                {isSubmitting ? 'Resolving...' : 'Mark as Resolved'}
                            </button>
                            <button 
                                className="action-btn in-progress" 
                                onClick={() => handleStatusChange('In Progress')}
                                disabled={isSubmitting} // 🎯 FIX: Use isSubmitting to disable
                            >
                                {isSubmitting ? 'Updating...' : 'Mark as In Progress'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedbackDetail;