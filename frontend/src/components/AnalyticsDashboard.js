import React from 'react';
import './AnalyticsDashboard.css';
import FeedbackByHourChart from './FeedbackByHourChart';
import CrowdednessByRouteChart from './CrowdednessByRouteChart';

function AnalyticsDashboard({ feedbackData, crowdednessData }) {
    return (
        <div className="analytics-container">
            <div className="dashboard-header">
                <h2>Insightful Analytics</h2>
                <p>Visualize trends and identify systemic issues.</p>
            </div>

            <div className="analytics-grid">
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