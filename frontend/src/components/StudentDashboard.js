import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Re-using the dashboard styles
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import CommendationModal from './CommendationModal';
import { routeData, routeNames } from './routeData';

function StudentDashboard({ feedbackData, announcements, setCommendations, lostAndFoundItems, crowdednessData, setCrowdednessData, users }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  // Filter to get only this student's feedback
  const myFeedback = (feedbackData || []).filter(fb => fb.user === user.name);

  // State for the interactive bus details card
  const initialRoute = user.busRoute && routeData[user.busRoute] 
    ? user.busRoute 
    : routeNames[0];
  
  const stopsForInitialRoute = routeData[initialRoute]?.stops || {};
  
  const initialStop = user.favoriteStop && stopsForInitialRoute[user.favoriteStop]
    ? user.favoriteStop
    : Object.keys(stopsForInitialRoute)[0];

  const myLostAndFoundItems = useMemo(() => 
    (lostAndFoundItems || []).filter(item => item.user === user.name)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [lostAndFoundItems, user.name]);

  const [selectedRoute, setSelectedRoute] = useState(initialRoute);
  const [selectedStop, setSelectedStop] = useState(initialStop);
  const [eta, setEta] = useState(routeData[initialRoute].stops[initialStop]);
  const [notificationSent, setNotificationSent] = useState(false);
  const [isCommendationModalOpen, setIsCommendationModalOpen] = useState(false);

  const unclaimedFoundItems = useMemo(() => 
    (lostAndFoundItems || []).filter(item => item.type === 'found' && item.status === 'unclaimed'), 
    [lostAndFoundItems]
  );

  const currentCrowdedness = useMemo(() => {
    const fifteenMinutesAgo = new Date(new Date().getTime() - 15 * 60 * 1000);
    const recentReports = (crowdednessData || [])
      .filter(report => report.route === selectedRoute && new Date(report.timestamp) > fifteenMinutesAgo)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (recentReports.length > 0) {
      return recentReports[0].level; // Return the most recent report's level
    }
    return 'unknown'; // Default if no recent data
  }, [crowdednessData, selectedRoute]);

  const handleCrowdednessReport = (level) => {
    const newReport = {
      route: selectedRoute,
      level,
      timestamp: new Date().toISOString(),
    };
    // In a real app, you'd send this to a backend. Here, we update the shared state.
    // To keep the demo simple, we'll just add the new report.
    // A real implementation would likely replace old reports from the same user.
    setCrowdednessData(prev => [newReport, ...prev]);
    showNotification(`Thank you for reporting the bus status as "${level}"!`, 'info');
  };

  const handleOvercrowdingReport = () => {
    const newReport = {
      route: selectedRoute,
      level: 'crowded',
      timestamp: new Date().toISOString(),
    };
    // In a real app, this would be sent to a backend.
    setCrowdednessData(prev => [newReport, ...prev]);
    showNotification(`Overcrowding reported for route ${selectedRoute}. Thank you for helping!`, 'info');
  };

  // Reset notification status when route or stop changes
  useEffect(() => {
    setNotificationSent(false);
  }, [selectedRoute, selectedStop]);

  // Effect for checking ETA and sending notification
  useEffect(() => {
    if (!eta || notificationSent) return;

    const parseEta = (timeString) => {
      const now = new Date();
      const [time, modifier] = timeString.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    };

    const etaDate = parseEta(eta);
    const interval = setInterval(() => {
      const now = new Date();
      const minutesUntilEta = (etaDate - now) / 1000 / 60;
      // Notify if bus is arriving in 10 minutes or less, but not if it has already passed
      if (minutesUntilEta <= 10 && minutesUntilEta > 0) {
        showNotification(`Your bus for route ${selectedRoute} is expected in about ${Math.ceil(minutesUntilEta)} minutes.`, 'info');
        setNotificationSent(true); // Mark as sent to prevent re-notifying
        clearInterval(interval); // Stop checking once notification is sent
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [eta, notificationSent, selectedRoute, showNotification]);

  const handleRouteChange = (e) => {
    const newRoute = e.target.value;
    const newStops = routeData[newRoute].stops;
    const firstStop = Object.keys(newStops)[0];
    setSelectedRoute(newRoute);
    setSelectedStop(firstStop);
    setEta(newStops[firstStop]);
  };

  const handleStopChange = (e) => {
    const newStop = e.target.value;
    setSelectedStop(newStop);
    setEta(routeData[selectedRoute].stops[newStop]);
  };

  const whatsNewItems = [
    { icon: '🚨', title: 'Quick Overcrowding Report', description: 'Use the new button in "Quick Actions" to instantly report an overcrowded bus.' },
    { icon: '🗺️', title: 'Live Bus Tracking!', description: 'You can now track your bus in real-time from the "My Bus Details" card.' },
    { icon: '🌙', title: 'Dark Mode is Here', description: 'Easier on the eyes! Toggle between light and dark mode using the switch in the navbar.' },
    { icon: '📊', title: 'New Feedback Categories', description: 'Submitting feedback is now more detailed with new categories to choose from.' },
  ];

  return (
    <div className="dashboard-grid">
      <div className="dashboard-header">
        <h2>Welcome, {user.name}!</h2>
        <p>Here's your transport summary for today.</p>
      </div>

      {/* Live display of the student's raised tickets */}
      <div className="dashboard-card full-width-card my-feedback-card">
        <h3>My Submitted Feedback</h3>
        {myFeedback.length > 0 ? (
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Submitted On</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myFeedback.map(fb => (
                <tr key={fb.id}>
                  <td data-label="Submitted On">{new Date(fb.submittedOn).toLocaleDateString()}</td>
                  <td data-label="Route">{fb.route}</td>
                  <td data-label="Status"><span className={`status ${fb.status.toLowerCase().replace(' ', '-')}`}>{fb.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>You have not submitted any feedback yet.</p>
        )}
      </div>

      <div className="dashboard-card full-width-card">
        <h3>My Lost & Found Reports</h3>
        {myLostAndFoundItems.length > 0 ? (
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myLostAndFoundItems.map(item => (
                <tr key={item.id}>
                  <td data-label="Date">{new Date(item.date).toLocaleDateString()}</td>
                  <td data-label="Item">{item.item}</td>
                  <td data-label="Type"><span className={`status ${item.type}`}>{item.type}</span></td>
                  <td data-label="Status">{item.status ? <span className={`status ${item.status}`}>{item.status}</span> : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>You have not reported any lost or found items.</p>
        )}
      </div>

      <div className="dashboard-card">
        <h3>🚌 My Bus Details</h3>
        <div className="bus-details-interactive">
          <label htmlFor="route-select">Route:</label>
          <select id="route-select" value={selectedRoute} onChange={handleRouteChange}>
            {routeNames.map(route => (
              <option key={route} value={route}>{route}</option>
            ))}
          </select>

          <label htmlFor="stop-select">Your Stop:</label>
          <select id="stop-select" value={selectedStop} onChange={handleStopChange}>
            {Object.keys(routeData[selectedRoute].stops).map(stop => (
              <option key={stop} value={stop}>{stop}</option>
            ))}
          </select>

          <div className="bus-capacity-display">
            <strong>Bus Capacity:</strong>
            <span>{routeData[selectedRoute]?.capacity || 'N/A'} Seats</span>
          </div>
          <div className="eta-display">
            <p><strong>Estimated Arrival:</strong></p>
            <span>{eta}</span>
            <div className="crowdedness-display">
              <strong>Crowdedness:</strong>
              <span className={`crowdedness-indicator ${currentCrowdedness.replace(' ', '-')}`}>{currentCrowdedness}</span>
            </div>
          </div>
        </div>
        <div className="crowdedness-reporter">
            <p>On this bus? Help others by reporting its status:</p>
            <div className="reporter-buttons">
                <button onClick={() => handleCrowdednessReport('empty')} title="Empty">🟢</button>
                <button onClick={() => handleCrowdednessReport('filling up')} title="Filling Up">🟡</button>
                <button onClick={() => handleCrowdednessReport('crowded')} title="Crowded">🔴</button>
            </div>
        </div>
      </div>

      <div className="dashboard-card">
        <h3>🎁 Recently Found Items</h3>
        {unclaimedFoundItems.length > 0 ? (
          <ul className="found-items-list">
            {unclaimedFoundItems.map(item => (
              <li key={item.id}>
                <strong>{item.item}</strong> on Route {item.route}
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No unclaimed items have been reported recently.</p>
        )}
        <Link to="/lost-and-found" className="view-all-link">View All</Link>
      </div>

      <div className="dashboard-card whats-new-card">
        <h3>✨ What's New in BusBuzz?</h3>
        <ul className="whats-new-list">
          {whatsNewItems.map((item, index) => (
            <li key={index}>
              <span className="whats-new-icon">{item.icon}</span>
              <div className="whats-new-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="dashboard-card">
        <h3>📢 Announcements</h3>
        <ul className="announcement-list">
          {announcements.map(ann => (
            <li key={ann.id}>{ann.text}</li>
          ))}
        </ul>
      </div>

      <div className="dashboard-card">
        <h3>🔗 Quick Actions</h3>
        <div className="quick-actions">
          <button onClick={handleOvercrowdingReport} className="action-link report-btn">🚨 Report Overcrowding</button>
          <button onClick={() => setIsCommendationModalOpen(true)} className="action-link commend-btn">🏆 Praise a Driver</button>
          <Link to="/feedback" className="action-link">Submit Feedback</Link>
          <Link to="/profile" className="action-link">View My Profile</Link>
        </div>
      </div>

      <CommendationModal 
        isOpen={isCommendationModalOpen} 
        onClose={() => setIsCommendationModalOpen(false)}
        setCommendations={setCommendations}
      />
    </div>
  );
}

export default StudentDashboard;