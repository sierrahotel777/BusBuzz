import React, { useState, useMemo } from "react";
import { Link } from 'react-router-dom';
import "./Dashboard.css";
import ConfirmationModal from "./ConfirmationModal";
import { useNotification } from "./NotificationContext";
import FeedbackChart from "./FeedbackChart";
import CountUp from "./CountUp";

function AdminDashboard({ feedbackData, announcements, setAnnouncements, commendations, lostAndFoundItems, setLostAndFoundItems }) {
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [editingAnnId, setEditingAnnId] = useState(null);
  const [editingAnnText, setEditingAnnText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // You can adjust this number
  const [sortConfig, setSortConfig] = useState({ key: 'submittedOn', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState("");
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

  // --- Search/Filter Logic ---
  const filteredFeedback = useMemo(() => {
    if (!searchTerm) {
      return feedbackData;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return feedbackData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(lowercasedTerm)
      )
    );
  }, [feedbackData, searchTerm]);

  // --- Sorting Logic (now uses filtered data) ---
  const sortedFeedback = useMemo(() => {
    let sortableItems = [...filteredFeedback];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredFeedback, sortConfig]);

  // --- Pagination Logic (now uses sorted data) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFeedback = sortedFeedback.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedFeedback.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to the first page when sorting changes
  };

  // Bonus Feature: Handle clicks on chart segments to filter the table
  const handleChartSegmentClick = (category) => {
    setSearchTerm(category);
    showNotification(`Filtering table for category: "${category}"`, 'info');
  };

  // Get unique routes for the filter dropdown
  const uniqueRoutes = useMemo(() => ['All', ...new Set(feedbackData.map(fb => fb.route))], [feedbackData]);

  const handleMarkAsClaimed = (itemId) => {
    setLostAndFoundItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, status: 'claimed' } : item
      )
    );
    showNotification("Item status updated to 'Claimed'.");
  };

  const handleExport = () => {
    const headers = ["ID", "User", "College ID", "Route", "Bus No", "Issue", "Status", "Submitted On", "Comments"];
    const rows = sortedFeedback.map(fb => [
      fb.id,
      `"${fb.user}"`,
      `"${fb.collegeId}"`,
      `"${fb.route}"`,
      `"${fb.busNo}"`,
      `"${fb.issue}"`,
      `"${fb.status}"`,
      `"${new Date(fb.submittedOn).toLocaleString()}"`,
      `"${fb.comments.replace(/"/g, '""')}"` // Handle quotes in comments
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "feedback_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <FeedbackChart feedbackData={chartFilteredData} onSegmentClick={handleChartSegmentClick} />
      </div>

      <div className="dashboard-card full-width-card">
        <h3>Manage Found Items</h3>
        <table className="feedback-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Route</th>
              <th>Posted On</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(lostAndFoundItems || []).filter(i => i.type === 'found').map(item => (
              <tr key={item.id}>
                <td data-label="Item">{item.item}</td>
                <td data-label="Route">{item.route}</td>
                <td data-label="Posted On">{new Date(item.date).toLocaleDateString()}</td>
                <td data-label="Status"><span className={`status ${item.status}`}>{item.status}</span></td>
                <td data-label="Action">
                  {item.status === 'unclaimed' && (
                    <button onClick={() => handleMarkAsClaimed(item.id)} className="claim-btn">Mark as Claimed</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <div className="dashboard-card full-width-card">
        <h3>Recent Feedback Submissions</h3>
        <div className="table-controls">
          <button onClick={handleExport} className="export-btn">
            Export to CSV
          </button>
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <table className="feedback-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('user')} className="sortable-header">
                User {sortConfig.key === 'user' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </th>
              <th onClick={() => requestSort('route')} className="sortable-header">
                Route {sortConfig.key === 'route' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </th>
              <th onClick={() => requestSort('issue')} className="sortable-header">
                Issue Category {sortConfig.key === 'issue' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </th>
              <th onClick={() => requestSort('status')} className="sortable-header">
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'ascending' ? '▲' : '▼')}
              </th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentFeedback.map(fb => (
              <tr key={fb.id} className={fb.issue === 'Safety Concern' ? 'high-priority-row' : ''}>
                <td data-label="User">{fb.user}</td>
                <td data-label="Route">{fb.route}</td>
                <td data-label="Issue Category">{fb.issue}</td>
                <td data-label="Status"><span className={`status ${fb.status.toLowerCase().replace(' ', '-')}`}>{fb.status}</span></td>
                <td data-label="Action"><Link to={`/admin/feedback/${fb.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="pagination-container">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              &laquo; Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next &raquo;
            </button>
          </div>
        )}
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
