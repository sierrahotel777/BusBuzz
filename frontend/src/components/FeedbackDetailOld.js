import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; 
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext'; 
import { getFeedbackById, updateFeedbackStatus } from '../services/api'; 
import './FeedbackDetail.css';

function FeedbackDetail() {
    const { feedbackId } = useParams();
    const { showNotification } = useNotification();
    const { user } = useAuth();
    
    const [feedback, setFeedback] = useState(null);
    const [internalNote, setInternalNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!feedbackId) { 
            setIsLoading(false);
            return;
        }
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                const data = await getFeedbackById(feedbackId); 
                setFeedback({ ...data, id: data._id });
            } catch (error) {
                showNotification(error.message || "Could not load feedback details.", 'error');
                setFeedback(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [feedbackId, showNotification]); 

    const handleStatusChange = async (newStatus) => {
        setIsSubmitting(true);
        try {
            await updateFeedbackStatus(feedbackId, newStatus, internalNote); 
            
            showNotification(`Status updated to ${newStatus}. (Simulation)`, 'success');
            
            setFeedback(prev => ({
                ...prev, 
                status: newStatus,
                resolution: newStatus === 'Resolved' ? {
                    resolvedBy: "Admin", // Hardcode or get from local storage if no auth
                    resolvedOn: new Date().toISOString(),
                    notes: internalNote || 'Issue marked as resolved.'
                } : prev.resolution
            }));
            
            setInternalNote('');
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="feedback-detail-container">Loading details...</div>;
    }

    if (!feedback) {
        return (
            <div className="feedback-detail-container">
                <h2>Feedback Not Found</h2>
                <p>The requested feedback item could not be found or you lack permission.</p>
                <Link to={user && user.role === 'admin' ? '/admin/feedback' : '/student'} className="back-link">← Back</Link>
            </div>
        );
    }
    
    const userName = feedback.userName || "N/A"; 
    const submittedOn = new Date(feedback.submittedOn).toLocaleString(); 

    return (
        <div className="feedback-detail-container">
            <div className="feedback-detail-header">
                <h2>Feedback Details (ID: {feedbackId})</h2>
                <Link to="/admin/feedback" className="back-link">← Back to Management</Link>
            </div>

            <div className="feedback-grid">
                <div className="detail-card user-info">
                    <h3>Submitted By</h3>
                    <p><strong>Name:</strong> {userName}</p>
                    <p><strong>Route:</strong> {feedback.route}</p>
                    <p><strong>Submitted:</strong> {submittedOn}</p>
                </div>
                
                <div className="detail-card bus-info">
                    <h3>Bus Details</h3>
                    <p><strong>Bus No:</strong> {feedback.busNo}</p>
                    <p><strong>Issue:</strong> {feedback.issue}</p>
                    {feedback.attachmentName && (
                        <p><strong>Attachment:</strong> 
                            <button onClick={() => alert('Attachment download/view logic goes here.')} className="attachment-link">{feedback.attachmentName}</button>
                        </p>
                    )}
                </div>

                <div className="detail-card ratings-info">
                    <h3>Ratings</h3>
                    <p><strong>Punctuality:</strong> {feedback.details?.punctuality || 'N/A'}</p>
                    <p><strong>Driver Behavior:</strong> {feedback.details?.driverBehavior || 'N/A'}</p>
                    <p><strong>Cleanliness:</strong> {feedback.details?.cleanliness || 'N/A'}</p>
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

                {user && user.role === 'admin' && feedback.status !== 'Resolved' && (
                    <div className="detail-card admin-actions full-width-card">
                        <h3>Admin Actions</h3>
                        <div className="action-form">
                            <textarea
                                value={internalNote}
                                onChange={(e) => setInternalNote(e.target.value)}
                                placeholder="Add internal notes before changing status..."
                                rows="3"
                            />
                            <div className="action-buttons">
                                {feedback.status === 'Pending' && (
                                    <button onClick={() => handleStatusChange('In Progress')} disabled={isSubmitting} className="btn-progress">
                                        {isSubmitting ? 'Updating...' : 'Mark as In Progress'}
                                    </button>
                                )}
                                {feedback.status !== 'Resolved' && (
                                    <button onClick={() => handleStatusChange('Resolved')} disabled={isSubmitting} className="btn-resolve">
                                        {isSubmitting ? 'Updating...' : 'Mark as Resolved'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedbackDetail;