import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './FeedbackDetail.css';

function FeedbackDetail({ feedbackData, setFeedbackData }) {
    const { feedbackId } = useParams();
    const [feedback, setFeedback] = useState(null);
    const [internalNote, setInternalNote] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        // Find the specific feedback from the props
        const foundFeedback = feedbackData.find(fb => fb.id === parseInt(feedbackId));
        setFeedback(foundFeedback);
    }, [feedbackId, feedbackData]);

    const handleStatusChange = (newStatus) => {
        // In a real app, this would be an API call
        setFeedbackData(prevData => prevData.map(fb => {
            if (fb.id === parseInt(feedbackId)) {
                const updatedFeedback = { ...fb, status: newStatus };
                if (newStatus === 'Resolved') {
                    updatedFeedback.resolution = {
                        resolvedBy: user.name,
                        resolvedOn: new Date().toISOString(),
                        notes: internalNote || 'Issue marked as resolved.'
                    };
                }
                return updatedFeedback;
            }
            return fb;
        }));
    };

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
                <h2>Feedback Details</h2>
                <Link to="/admin" className="back-link">← Back to Dashboard</Link>
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
                    {feedback.attachmentName && (
                        <p>
                            <strong>Attachment:</strong> 
                            <a href="#" onClick={(e) => e.preventDefault()} className="attachment-link">{feedback.attachmentName}</a>
                        </p>
                    )}
                </div>

                <div className="detail-card ratings-info">
                    <h3>Ratings</h3>
                    <p><strong>Punctuality:</strong> {feedback.details.punctuality}</p>
                    <p><strong>Driver Behavior:</strong> {feedback.details.driverBehavior}</p>
                    <p><strong>Cleanliness:</strong> {feedback.details.cleanliness}</p>
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
                            <button className="action-btn resolve" onClick={() => handleStatusChange('Resolved')}>Mark as Resolved</button>
                            <button className="action-btn in-progress" onClick={() => handleStatusChange('In Progress')}>Mark as In Progress</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedbackDetail;