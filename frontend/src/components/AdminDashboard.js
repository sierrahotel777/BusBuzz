import React, { useState, useMemo } from "react";
import { Link } from 'react-router-dom';
import "./Dashboard.css";
import ConfirmationModal from "./ConfirmationModal";
import { useNotification } from "./NotificationContext";
import FeedbackChart from "./FeedbackChart";
import CountUp from "./CountUp";

function AdminDashboard({ feedbackData, announcements, setAnnouncements, commendations }) {
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [editingAnnId, setEditingAnnId] = useState(null);
  const [editingAnnText, setEditingAnnText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // You can adjust this number
  const [chartRouteFilter, setChartRouteFilter] = useState('All');
  const { showNotification } = useNotification();

  // Calculate stats from live data
  const stats = {
    totalFeedback: feedbackData.length,
    pendingIssues: feedbackData.filter(fb => fb.status === 'Pending').length,
    busesOnRoute: 32,
  };

  // --- Data for Chart (filtered by route) ---
  const chartFilteredData = useMemo(() => {
    if (chartRouteFilter === 'All') {
      return feedbackData;
    }
    return feedbackData.filter(fb => fb.route === chartRouteFilter);
  }, [feedbackData, chartRouteFilter]);

  // --- Leaderboard Logic ---
  const commendationCounts = useMemo(() => {
    return (commendations || []).reduce((acc, comm) => {
        acc[comm.route] = (acc[comm.route] || 0) + 1;
        return acc;
    }, {});
  }, [commendations]);

  const leaderboard = useMemo(() => {
      return Object.entries(commendationCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5); // Top 5
  }, [commendationCounts]);

  // Get unique routes for the filter dropdown
  const uniqueRoutes = useMemo(() => ['All', ...new Set(feedbackData.map(fb => fb.route))], [feedbackData]);

  const handlePostAnnouncement = () => {
    if (newAnnouncement.trim() === "") return; // Prevent empty posts

    const announcement = {
      id: Date.now(),
      text: newAnnouncement,
    };

    setAnnouncements(prev => [announcement, ...prev]);
    setNewAnnouncement(""); // Clear the input
    showNotification("Announcement posted successfully!");
  };

  const openDeleteModal = (id) => {
    setAnnouncementToDelete(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setAnnouncementToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = () => {
    setAnnouncements(prev => prev.filter(ann => ann.id !== announcementToDelete));
    closeDeleteModal();
    showNotification("Announcement deleted.", "info");
  };

  const handleEditClick = (announcement) => {
    setEditingAnnId(announcement.id);
    setEditingAnnText(announcement.text);
  };

  const handleCancelEdit = () => {
    setEditingAnnId(null);
    setEditingAnnText("");
  };

  const handleSaveEdit = (id) => {
    setAnnouncements(prev =>
      prev.map(ann => (ann.id === id ? { ...ann, text: editingAnnText } : ann))
    );
    setEditingAnnId(null);
    setEditingAnnText("");
    showNotification("Announcement updated successfully!");
  };

  return (
    <div className="dashboard-grid">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <p>Overview of the transport system's performance and feedback.</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h4><span className="stat-icon">📊</span>Total Feedback</h4>
          <p><CountUp end={stats.totalFeedback} /></p>
        </div>
        <div className="stat-card">
          <h4><span className="stat-icon">❗</span>Pending Issues</h4>
          <p className="warning-text"><CountUp end={stats.pendingIssues} /></p>
        </div>
        <div className="stat-card">
          <h4><span className="stat-icon">🚌</span>Buses on Route</h4>
          <p><CountUp end={stats.busesOnRoute} /></p>
        </div>
      </div>

      <div className="dashboard-card full-width-card">
        <h3>Feedback Overview</h3>
        <div className="chart-controls">
          <label htmlFor="chart-route-filter">Filter by Route:</label>
          <select 
            id="chart-route-filter" 
            value={chartRouteFilter} 
            onChange={(e) => setChartRouteFilter(e.target.value)}
          >
            {uniqueRoutes.map(route => <option key={route} value={route}>{route}</option>)}
          </select>
        </div>
        <FeedbackChart feedbackData={chartFilteredData} />
      </div>

      <div className="dashboard-card full-width-card">
        <h3>System Management</h3>
        <div className="quick-actions">
            <Link to="/admin/bus-details" className="action-link">Manage Buses</Link>
            <Link to="/admin/route-details" className="action-link">Manage Routes</Link>
            <Link to="/admin/feedback" className="action-link">Manage Feedback</Link>
            <Link to="/admin/user-management" className="action-link">Manage Users</Link>
            <Link to="/admin/lost-and-found" className="action-link">Manage Lost & Found</Link>
        </div>
      </div>

      <div className="dashboard-card">
        <h3>🏆 Driver of the Month Leaderboard</h3>
        {leaderboard.length > 0 ? (
          <ul className="leaderboard-list">
            {leaderboard.map(([route, count], index) => (
              <li key={route}>
                <span className="leaderboard-rank">{index + 1}</span>
                <span className="leaderboard-route">{route}</span>
                <span className="leaderboard-count">{count} commendations</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No commendations received yet this month.</p>
        )}
      </div>

      <div className="dashboard-card">
        <h3>Post a New Announcement</h3>
        <textarea
          className="announcement-textarea"
          rows="4"
          placeholder="Type your announcement here..."
          value={newAnnouncement}
          onChange={(e) => setNewAnnouncement(e.target.value)}
        ></textarea>
        <button onClick={handlePostAnnouncement} className="post-announcement-btn">
          Post Announcement
        </button>
      </div>

      <div className="dashboard-card">
        <h3>Current Announcements</h3>
        <ul className="announcement-list admin-announcements">
          {announcements.length > 0 ? announcements.map(ann => (
            <li key={ann.id}>
              {editingAnnId === ann.id ? (
                <textarea
                  className="announcement-textarea-edit"
                  value={editingAnnText}
                  onChange={(e) => setEditingAnnText(e.target.value)}
                  rows="2"
                />
              ) : (
                <span>{ann.text}</span>
              )}
              <div className="announcement-actions">
                {editingAnnId === ann.id ? (
                  <>
                    <button onClick={() => handleSaveEdit(ann.id)} className="save-announcement-btn">Save</button>
                    <button onClick={handleCancelEdit} className="cancel-announcement-btn">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEditClick(ann)} className="edit-announcement-btn">Edit</button>
                    <button onClick={() => openDeleteModal(ann.id)} className="delete-announcement-btn">Delete</button>
                  </>
                )}
              </div>
            </li>
          )) : <p>No announcements posted yet.</p>}
        </ul>
      </div>

      <ConfirmationModal
        show={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
      />
    </div>
  );
}

export default AdminDashboard;
