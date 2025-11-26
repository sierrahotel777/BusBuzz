import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { getFeedbackById, uploadAttachment, addConversationEntry, deleteFeedback, updateFeedbackStatus, API_BASE } from '../services/api';
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
    const [modal, setModal] = useState(null);
    const [copied, setCopied] = useState(false);

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
                <div className="header-left">
                    <h2>Feedback Details</h2>
                    <div className="ref-block">
                        <span className="ref-label">Ref:</span>
                        <span className="ref-id">{feedback.referenceId || 'N/A'}</span>
                        <button
                            type="button"
                            className="copy-btn"
                            onClick={async () => {
                                try {
                                    const text = feedback.referenceId || '';
                                    if (!text) throw new Error('No reference ID available');
                                    await navigator.clipboard.writeText(text);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 1400);
                                    showNotification('Reference ID copied to clipboard.', 'success');
                                } catch (err) {
                                    showNotification(err.message || 'Failed to copy reference ID.', 'error');
                                }
                            }}
                        >{copied ? 'Copied' : 'Copy'}</button>
                    </div>
                </div>
                <div className="header-right">
                    <Link to={user && user.role === 'admin' ? '/admin/feedback' : '/student'} className="back-link">← Back</Link>
                    {(user?.role === 'admin' || feedback.userId === user?.id) && (
                        <button
                            className="danger-btn"
                            onClick={async () => {
                                if (!window.confirm('Delete this feedback? This cannot be undone.')) return;
                                try {
                                    await deleteFeedback(feedbackId);
                                    showNotification('Feedback deleted.', 'success');
                                    navigate(user && user.role === 'admin' ? '/admin/feedback' : '/student', { state: { refresh: Date.now() } });
                                } catch (err) {
                                    showNotification(err.message || 'Failed to delete feedback.', 'error');
                                }
                            }}
                        >Delete</button>
                    )}
                    {(user?.role === 'admin' || feedback.userId === user?.id) && feedback.status !== 'Closed' && (
                        <button
                            className="btn-secondary"
                            onClick={async () => {
                                const resolution = window.prompt('Enter a short resolution note (optional):', feedback.resolution || '');
                                if (resolution === null) return; // cancelled
                                try {
                                    await updateFeedbackStatus(feedbackId, 'Closed', resolution || '');
                                    setFeedback(prev => ({ ...prev, status: 'Closed', resolution, resolutionBy: user?.name || 'Admin', resolutionOn: new Date().toISOString() }));
                                    showNotification('Feedback marked as closed.', 'success');
                                } catch (err) {
                                    showNotification(err.message || 'Failed to update feedback status.', 'error');
                                }
                            }}
                        >Mark Resolved</button>
                    )}
                </div>
            </div>

            <div className="feedback-grid">
                <div className="detail-card user-info">
                    <h3>Submitted By</h3>
                    <p><strong>Name:</strong> {userName}</p>
                    <p><strong>Route:</strong> {feedback.route || 'N/A'}</p>
                    <p><strong>Submitted:</strong> {submittedOn}</p>
                </div>

                <div className="detail-card bus-info">
                    <h3>Bus Details</h3>
                    <p><strong>Bus No:</strong> {feedback.busNo || 'N/A'}</p>
                    <p><strong>Issue:</strong> {feedback.issue || 'N/A'}</p>
                    {(feedback.attachments && feedback.attachments.length > 0) ? (
                        (() => {
                            const att = feedback.attachments[0];
                            const rawUrl = att.url || '';
                            const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `${API_BASE}${rawUrl}`;
                            return (
                                <div>
                                    <div className="attachment-preview">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="attachment-link">Open Attachment</a>
                                    </div>
                                </div>
                            );
                        })()
                    ) : feedback.attachmentName ? (
                        (() => {
                            const url = `${API_BASE}/uploads/${feedback.attachmentName}`;
                            return (
                                <div>
                                    <div className="attachment-preview">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="attachment-link">Open Attachment</a>
                                    </div>
                                </div>
                            );
                        })()
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

                {feedback.status === 'Closed' && (
                    <div className="detail-card resolution-info full-width-card">
                        <h3>Resolution</h3>
                        <p>{feedback.resolution || 'No resolution note provided.'}</p>
                        <p style={{marginTop:8, fontSize:'0.9rem', color:'var(--muted-color)'}}>
                            <strong>Status:</strong> Closed
                            {feedback.resolutionBy ? ` • Resolved by ${feedback.resolutionBy}` : ''}
                            {feedback.resolutionOn ? ` • ${new Date(feedback.resolutionOn).toLocaleString()}` : ''}
                        </p>
                    </div>
                )}

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
                                        {(() => {
                                            const raw = entry.attachment.url || '';
                                            const url = /^https?:\/\//i.test(raw) ? raw : `${API_BASE}${raw}`;
                                            const name = entry.attachment.name || 'Attachment';
                                            return (
                                                <button type="button" className="attachment-btn" onClick={() => setModal({ url, name })}>📎 {name}</button>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="comment-form">
                        {feedback.status === 'Closed' ? (
                            <div className="closed-note">
                                <p>This feedback has been closed. Comments are disabled.</p>
                                <p style={{fontSize:'0.95rem', color:'var(--muted-color)'}}><strong>Resolution:</strong> {feedback.resolution || 'No resolution provided.'}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleCommentSubmit}>
                                <label htmlFor="comment">Add a comment or attachment</label>
                                <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Write a reply..." />
                                <input type="file" onChange={handleFileChange} />
                                {selectedFile && (
                                    <div className="selected-file">Selected: {selectedFile.name}</div>
                                )}
                                <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Posting...' : 'Post Comment'}</button>
                            </form>
                        )}
                    </div>
                </div>

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
        </div>
    );
}

export default FeedbackDetail;
