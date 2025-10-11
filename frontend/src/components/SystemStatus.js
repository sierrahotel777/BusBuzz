import React from 'react';
import './SystemStatus.css';

const services = [
    { name: 'User Authentication', status: 'Operational', icon: '👤' },
    { name: 'Feedback Submissions', status: 'Operational', icon: '📝' },
    { name: 'Admin Dashboard', status: 'Operational', icon: '⚙️' },
    { name: 'Notification Service', status: 'Operational', icon: '🔔' },
    { name: 'Database Connectivity', status: 'Operational', icon: '💾' }
];

const statusInfo = {
    'Operational': { className: 'operational', text: 'All systems normal.' },
    'Degraded Performance': { className: 'degraded', text: 'The service is working but may be slow.' },
    'Outage': { className: 'outage', text: 'The service is currently unavailable.' }
};

function SystemStatus() {
    const overallStatus = services.some(s => s.status === 'Outage') 
        ? 'Major Outage' 
        : services.some(s => s.status === 'Degraded Performance') 
        ? 'Degraded Performance' 
        : 'All Systems Operational';

    const overallStatusClass = overallStatus.toLowerCase().replace(' ', '-');

    return (
        <div className="system-status-container">
            <div className="dashboard-header">
                <h2>System Status</h2>
                <p>Live status of all BusBuzz services.</p>
            </div>

            <div className={`overall-status-banner ${overallStatusClass}`}>
                <h3>{overallStatus}</h3>
            </div>

            <div className="status-list">
                {services.map((service, index) => (
                    <div key={index} className="status-item">
                        <div className="status-name">
                            <span className="status-icon">{service.icon}</span>
                            <span>{service.name}</span>
                        </div>
                        <div className={`status-badge ${statusInfo[service.status]?.className}`}>
                            {service.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SystemStatus;