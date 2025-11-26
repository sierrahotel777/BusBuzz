import React, { useMemo } from 'react';
import './AnalyticsDashboard.css';
import FeedbackByHourChart from './FeedbackByHourChart';
import CrowdednessByRouteChart from './CrowdednessByRouteChart';

function AnalyticsDashboard({ feedbackData = [], crowdednessData = [], lostAndFoundItems = [] }) {
    const totals = useMemo(() => {
        const feedbackCount = feedbackData.length;
        const lfLost = lostAndFoundItems.filter(i => i.type === 'lost').length;
        const lfFound = lostAndFoundItems.filter(i => i.type === 'found').length;
        const unresolved = feedbackData.filter(f => f.status !== 'Resolved' && f.status !== 'Rejected').length;
        return { feedbackCount, lfLost, lfFound, unresolved };
    }, [feedbackData, lostAndFoundItems]);

    return (
        <div className="analytics-container">
            <div className="dashboard-header">
                <h2>Insightful Analytics</h2>
                <p>Visualize trends and identify systemic issues.</p>
            </div>

            <div className="analytics-grid">
                <div className="analytics-card">
                    <h3>Overview</h3>
                    <ul className="analytics-overview">
                        <li><strong>Total Feedback:</strong> {totals.feedbackCount}</li>
                        <li><strong>Unresolved Feedback:</strong> {totals.unresolved}</li>
                        <li><strong>Lost Items:</strong> {totals.lfLost}</li>
                        <li><strong>Found Items:</strong> {totals.lfFound}</li>
                    </ul>
                </div>
                <div className="analytics-card">
                    <h3>Feedback Volume by Hour of Day</h3>
                    <div className="chart-wrapper">
                        <FeedbackByHourChart feedbackData={feedbackData} />
                    </div>
                </div>
                <div className="analytics-card">
                    <h3>Most Crowded Routes</h3>
                    <div className="chart-wrapper">
                        <CrowdednessByRouteChart crowdednessData={crowdednessData} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;