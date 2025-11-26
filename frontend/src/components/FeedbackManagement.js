import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FeedbackManagement.css'; 

function FeedbackManagement({ feedbackData }) {
  const navigate = useNavigate();

  const sortedFeedback = feedbackData ? [...feedbackData].sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn)) : [];

  const handleRowClick = (id) => {
    navigate(`/admin/feedback/${id}`);
  };

  return (
    <div className="dashboard-grid">
      <div className="dashboard-header">
        <h2>Feedback Management</h2>
        <p>Review, track, and resolve all user-submitted feedback.</p>
      </div>

      <div className="dashboard-card full-width-card">
        <h3>All Submitted Feedback</h3>
        {sortedFeedback.length > 0 ? (
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Submitted On</th>
                <th>User</th>
                <th>Route</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedFeedback.map(fb => (
                <tr key={fb._id} onClick={() => handleRowClick(fb._id)} className="clickable-row">
                  <td data-label="Submitted On">{new Date(fb.submittedOn).toLocaleDateString()}</td>
                  <td data-label="User">{fb.userName || 'N/A'}</td>
                  <td data-label="Route">{fb.route || 'N/A'}</td>
                  <td data-label="Issue">{fb.issue || 'N/A'}</td>
                  <td data-label="Status"><span className={`status ${fb.status.toLowerCase().replace(' ', '-')}`}>{fb.status}</span></td>
                  <td data-label="Action" className="action-link" onClick={(e) => { e.stopPropagation(); handleRowClick(fb._id); }}>View Detail</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No feedback has been submitted yet.</p>
        )}
      </div>
    </div>
  );
}

export default FeedbackManagement;