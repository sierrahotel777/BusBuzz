import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FeedbackManagement.css';

const FeedbackManagement = ({ feedbackData }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [sortConfig, setSortConfig] = useState({ key: 'submittedOn', direction: 'descending' });
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

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

    // --- Sorting Logic ---
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

    // --- Pagination Logic ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFeedback = sortedFeedback.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedFeedback.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '';
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    return (
        <div className="admin-page-container">
            <div className="dashboard-header">
                <h2>Manage Feedback</h2>
                <p>Review, search, and manage all user feedback submissions.</p>
            </div>
            <div className="dashboard-card full-width-card">
                <div className="table-controls">
                    <input
                        type="text"
                        placeholder="Search feedback..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="search-input"
                    />
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('user')} className="sortable-header">
                                User {getSortIndicator('user')}
                            </th>
                            <th onClick={() => requestSort('route')} className="sortable-header">
                                Route {getSortIndicator('route')}
                            </th>
                            <th onClick={() => requestSort('issue')} className="sortable-header">
                                Issue {getSortIndicator('issue')}
                            </th>
                            <th onClick={() => requestSort('status')} className="sortable-header">
                                Status {getSortIndicator('status')}
                            </th>
                            <th onClick={() => requestSort('submittedOn')} className="sortable-header">
                                Date {getSortIndicator('submittedOn')}
                            </th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentFeedback.map(fb => (
                            <tr key={fb._id} className={fb.issue === 'Safety Concern' ? 'high-priority-row' : ''}>
                                <td data-label="User">{fb.user}</td>
                                <td data-label="Route">{fb.route}</td>
                                <td data-label="Issue">{fb.issue}</td>
                                <td data-label="Status">
                                    <span className={`status ${fb.status.toLowerCase().replace(' ', '-')}`}>{fb.status}</span>
                                </td>
                                <td data-label="Date">{new Date(fb.submittedOn).toLocaleDateString()}</td>
                                <td data-label="Action">
                                    <button onClick={() => navigate(`/admin/feedback/${fb._id}`)}>
                                        View Details
                                    </button>
                                </td>
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
        </div>
    );
};

export default FeedbackManagement;