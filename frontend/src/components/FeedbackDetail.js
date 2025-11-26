import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getFeedbackById, uploadAttachment, addConversationEntry, deleteFeedback } from '../services/api';
import './FeedbackDetail.css';

function FeedbackDetail() {
    const { feedbackId } = useParams();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [feedback, setFeedback] = useState(null);
    const [comment, setComment] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
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
                setFeedback({ ...data, id: data._id || data.id });
            } catch (error) {
                showNotification(error.message || "Could not load feedback details.", 'error');
                setFeedback(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [feedbackId, showNotification]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim() && !selectedFile) {
            showNotification('Please add a comment or attachment.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            let attachmentUrl = null;
            let attachmentName = null;

            if (selectedFile) {
                const uploadResult = await uploadAttachment(selectedFile);
                attachmentUrl = uploadResult.url;
                attachmentName = uploadResult.originalName;
            }

            const entry = {
                user: user.name,
                message: comment || '',
                timestamp: new Date().toISOString(),
                attachment: attachmentUrl ? { url: attachmentUrl, name: attachmentName } : null,
            };

            await addConversationEntry(feedbackId, entry);

            // Update local state
            setFeedback(prev => ({
                ...prev,
                conversation: [...(prev.conversation || []), entry]
            }));

            setComment('');
            setSelectedFile(null);
            showNotification('Comment posted successfully!', 'success');
        } catch (error) {
            showNotification(error.message || 'Failed to post comment.', 'error');
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

    const userName = feedback.userName || 'N/A';
    const submittedOn = new Date(feedback.submittedOn).toLocaleString();

    return (
        <div className="feedback-detail-container">
            <div className="feedback-detail-header">
                <h2>Feedback Details (ID: {feedbackId})</h2>
                <div className="header-actions">
                    <Link to={user && user.role === 'admin' ? '/admin/feedback' : '/student'} className="back-link">← Back</Link>
                    {(user?.role === 'admin' || feedback.userId === user?.id) && (
                        <button
                            className="danger-btn"
                            onClick={async () => {
                                if (!window.confirm('Delete this feedback? This cannot be undone.')) return;
                                try {
                                    await deleteFeedback(feedbackId);
                                    showNotification('Feedback deleted.', 'success');
                                    navigate(user && user.role === 'admin' ? '/admin/feedback' : '/student');
                                } catch (err) {
                                    showNotification(err.message || 'Failed to delete feedback.', 'error');
                                }
                            }}
                        >Delete</button>
                    )}
                </div>
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
                    {(feedback.attachments && feedback.attachments.length > 0) ? (
                        <p><strong>Attachment:</strong>
                            <a href={feedback.attachments[0].url} target="_blank" rel="noopener noreferrer" className="attachment-link">View/Download</a>
                        </p>
                    ) : feedback.attachmentName ? (
                        // Fallback for older records that only have attachmentName
                        <p><strong>Attachment:</strong>
                            <a href={`/uploads/${feedback.attachmentName}`} target="_blank" rel="noopener noreferrer" className="attachment-link">View/Download</a>
                        </p>
                    ) : null}
                </div>

                <div className="detail-card ratings-info">
                    <h3>Ratings</h3>
                    <p><strong>Punctuality:</strong> {feedback.details?.punctuality || 'N/A'}</p>
                    <p><strong>Driver Behavior:</strong> {feedback.details?.driverBehavior || 'N/A'}</p>
                    <p><strong>Cleanliness:</strong> {feedback.details?.cleanliness || 'N/A'}</p>
                </div>

                <div className="detail-card comments-info full-width-card">
                    <h3>Student's Comments</h3>
                    <p>{feedback.comments || feedback.message || 'No additional comments.'}</p>
                </div>

                <div className="detail-card conversation-section full-width-card">
                    <h3>Conversation</h3>
                    <div className="conversation-thread">
                        {(feedback.conversation || []).map((entry, idx) => (
                            <div key={idx} className={`message-bubble ${entry.user === user?.name ? 'own-message' : 'other-message'}`}>
                                <div className="message-header">
                                    <strong>{entry.user}</strong>
                                    <span className="message-timestamp">{new Date(entry.timestamp).toLocaleString()}</span>
                                </div>
                                {entry.message && <p>{entry.message}</p>}
                                {entry.attachment && (
                                    <div className="message-attachment">
                                        <a href={entry.attachment.url} target="_blank" rel="noopener noreferrer">📎 {entry.attachment.name}</a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="detail-card comment-form full-width-card">
                    <h3>Add Comment</h3>
                    <form onSubmit={handleCommentSubmit}>
                        <div className="form-group">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add your comment here..."
                                rows="4"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="comment-attachment">Attach a file (optional):</label>
                            <input
                                id="comment-attachment"
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,video/*,.pdf,.doc,.docx"
                            />
                            {selectedFile && <p className="selected-file">Selected: {selectedFile.name}</p>}
                        </div>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default FeedbackDetail;
