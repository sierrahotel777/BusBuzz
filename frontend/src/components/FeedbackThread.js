import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { uploadAttachment, addConversationEntry } from '../services/api';
import './FeedbackThread.css';

function FeedbackThread({ feedbackData, setFeedbackData }) {
    const { feedbackId } = useParams();
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const feedback = useMemo(() => 
        (feedbackData || []).find(fb => fb.id.toString() === feedbackId),
        [feedbackData, feedbackId]
    );

    const [reply, setReply] = useState('');
    const [newStatus, setNewStatus] = useState(feedback ? feedback.status : '');
    const [attachmentModal, setAttachmentModal] = useState(null);

    const handleReplySubmit = (e) => {
        e.preventDefault();
        if (!reply.trim()) return;

        const newConversationEntry = {
            user: user.name,
            message: reply,
            timestamp: new Date().toISOString(),
        };

        setFeedbackData(prevData =>
            prevData.map(fb =>
                fb.id.toString() === feedbackId
                    ? { ...fb, conversation: [...(fb.conversation || []), newConversationEntry] }
                    : fb
            )
        );

        setReply('');
        showNotification("Your reply has been posted.");
    };

    const handleStatusChange = (e) => {
        const status = e.target.value;
        setNewStatus(status);

        const statusUpdateMessage = `Status changed to "${status}" by ${user.name}.`;
        const newConversationEntry = {
            user: 'System',
            message: statusUpdateMessage,
            timestamp: new Date().toISOString(),
        };

        setFeedbackData(prevData =>
            prevData.map(fb =>
                fb.id.toString() === feedbackId
                    ? { ...fb, status, conversation: [...(fb.conversation || []), newConversationEntry] }
                    : fb
            )
        );

        showNotification(`Feedback status updated to "${status}".`);
    };

    if (!feedback) {
        return (
            <div className="feedback-thread-container">
                <h2>Feedback Not Found</h2>
                <p>The requested feedback item could not be found.</p>
                <Link to={user.role === 'admin' ? '/admin/feedback' : '/student'} className="back-link">
                    ← Back to list
                </Link>
            </div>
        );
    }

    return (
        <div className="feedback-thread-container">
            <div className="dashboard-header">
                <h2>Feedback Details ({feedback.id})</h2>
                <p>Issue: {feedback.issue}</p>
            </div>

            <div className="dashboard-card">
                <div className="feedback-meta">
                    <span><strong>Route:</strong> {feedback.route}</span>
                    <span><strong>Submitted:</strong> {new Date(feedback.submittedOn).toLocaleString()}</span>
                    <span><strong>Status:</strong> <span className={`status ${feedback.status.toLowerCase().replace(' ', '-')}`}>{feedback.status}</span></span>
                </div>

                <div className="conversation-thread">
                    {(feedback.conversation || []).map((entry, index) => (
                        <div key={index} className={`message-bubble ${entry.user === user.name ? 'own-message' : 'other-message'} ${entry.user === 'System' ? 'system-message' : ''}`}>
                            <div className="message-header">
                                <strong>{entry.user}</strong>
                                <span className="message-timestamp">{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                            <p>{entry.message}</p>
                            {entry.attachment && (
                                <div className="message-attachment">
                                    <button type="button" className="attachment-btn" onClick={() => setAttachmentModal({ url: entry.attachment.url, name: entry.attachment.name })}>📎 {entry.attachment.name}</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {attachmentModal && (
                    <div className="attachment-modal" onClick={() => setAttachmentModal(null)}>
                        <div className="attachment-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="attachment-modal-header">
                                <strong>{attachmentModal.name}</strong>
                                <button className="close-btn" onClick={() => setAttachmentModal(null)}>✕</button>
                            </div>
                            <div className="attachment-modal-body">
                                {(() => {
                                    const url = attachmentModal.url;
                                    const ext = (attachmentModal.name || '').split('.').pop().toLowerCase();
                                    if (['png','jpg','jpeg','gif','webp'].includes(ext)) return <img src={url} alt={attachmentModal.name} />;
                                    if (['mp4','webm','ogg'].includes(ext)) return <video src={url} controls />;
                                    if (['pdf'].includes(ext)) return <iframe src={url} title={attachmentModal.name} />;
                                    return <a href={url} target="_blank" rel="noopener noreferrer">Open attachment</a>;
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                <div className="reply-section">
                    <h3>Your Reply</h3>
                    <form onSubmit={handleReplySubmit}>
                        <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Type your reply here..."
                            rows="4"
                            required
                        />
                        <button type="submit">Post Reply</button>
                    </form>
                </div>

                {user.role === 'admin' && (
                    <div className="admin-actions-section">
                        <h3>Admin Actions</h3>
                        <div className="form-group">
                            <label htmlFor="status-select">Change Status:</label>
                            <select id="status-select" value={newStatus} onChange={handleStatusChange}>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FeedbackThread;

