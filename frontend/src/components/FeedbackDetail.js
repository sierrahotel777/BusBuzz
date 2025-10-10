// frontend/src/components/FeedbackDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // useParams is CRITICAL
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext'; // Assuming this hook exists
import { getFeedbackDetail } from '../services/api'; 
import './FeedbackDetail.css';

function FeedbackDetail() {
    // 1. Get the ID from the URL path, as defined in App.js route
    const { id } = useParams(); // <-- Change from feedbackId to id
    const { user } = useAuth();
    const { showNotification } = useNotification();
    
    const [feedback, setFeedback] = useState(null);
    const [internalNote, setInternalNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id || !user?.token) {
            setIsLoading(false);
            return;
        }
        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                const data = await getFeedbackDetail(id, user.token);
                setFeedback({ ...data, id: data._id });
            } catch (error) {
                showNotification(error.message || "Could not load feedback details.", 'error');
                setFeedback(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [id, user, showNotification]);

    const handleStatusChange = async (newStatus) => {
        if (!user || !user.token) return;

        setIsSubmitting(true);
        try {
            // Placeholder: Call the API service to update the status (similar to getFeedbackDetail)
            // await updateFeedbackStatus(feedbackId, newStatus, internalNote, user.token); 
            
            showNotification(`Status updated to ${newStatus}. (Simulation)`, 'success');
            
            // Optimistically update the local state 
            setFeedback(prev => ({
                ...prev, 
                status: newStatus,
                resolution: newStatus === 'Resolved' ? {
                    resolvedBy: user.user.name, // Use user.user.name if stored that way
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
                <Link to="/admin/feedback-management" className="back-link">← Back to Management</Link>
            </div>
        );
    }
    
    // 🛑 Ensure you use the backend data structure for display:
    const userName = feedback.userName || "N/A"; 
    const submittedOn = new Date(feedback.submittedOn).toLocaleString(); 

    return (
        <div className="feedback-detail-container">
            <div className="feedback-detail-header">
                <h2>Feedback Details (ID: {id})</h2>
                <Link to="/admin/feedback-management" className="back-link">← Back to Management</Link>
            </div>

            <div className="feedback-grid">
                {/* USER INFO CARD */}
                <div className="detail-card user-info">
                    <h3>Submitted By</h3>
                    <p><strong>Name:</strong> {userName}</p>
                    <p><strong>Route:</strong> {feedback.route}</p>
                    <p><strong>Submitted:</strong> {submittedOn}</p>
                </div>
                
                {/* BUS INFO CARD */}
                <div className="detail-card bus-info">
                    <h3>Bus Details</h3>
                    <p><strong>Bus No:</strong> {feedback.busNo}</p>
                    <p><strong>Issue:</strong> {feedback.issue}</p>
                    {feedback.attachmentName && (
                        <p><strong>Attachment:</strong> <a href="#" className="attachment-link">{feedback.attachmentName}</a></p>
                    )}
                </div>

                {/* RATINGS CARD */}
                <div className="detail-card ratings-info">
                    <h3>Ratings</h3>
                    {/* Assuming details field exists, adjust access based on your specific MongoDB structure */}
                    <p><strong>Punctuality:</strong> {feedback.details?.punctuality || 'N/A'}</p>
                    <p><strong>Driver Behavior:</strong> {feedback.details?.driverBehavior || 'N/A'}</p>
                    <p><strong>Cleanliness:</strong> {feedback.details?.cleanliness || 'N/A'}</p>
                </div>

                {/* COMMENTS CARD */}
                <div className="detail-card comments-info full-width-card">
                    <h3>Student's Comments</h3>
                    <p>{feedback.comments}</p>
                </div>

                {/* RESOLUTION/ACTIONS CARD */}
                {/* (The existing logic for resolution and actions remains valid here) */}
                
                {feedback.status === 'Resolved' && feedback.resolution && (
                    <div className="detail-card resolution-info full-width-card">
                        <h3>Resolution Details</h3>
                        <p><strong>Resolved By:</strong> {feedback.resolution.resolvedBy}</p>
                        <p><strong>Resolved On:</strong> {new Date(feedback.resolution.resolvedOn).toLocaleString()}</p>
                        <p><strong>Notes:</strong> {feedback.resolution.notes}</p>
                    </div>
                )}

                {feedback.status !== 'Resolved' && (
                    <div className="detail-card admin-actions full-width-card">
                        {/* Action buttons using isSubmitting state */}
                        {/* ... */}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedbackDetail;