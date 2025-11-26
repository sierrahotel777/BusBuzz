import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Dashboard.css'; 
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import CommendationModal from './CommendationModal';
import { getMyFeedback, getLostAndFound } from '../services/api';
import { routeData, routeNames } from './routeData';
import { getRoutes } from '../services/api';

function StudentDashboard({ feedbackData, announcements, setCommendations, lostAndFoundItems, crowdednessData, setCrowdednessData, users }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [myFeedback, setMyFeedback] = useState([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);

  const [routesFromBackend, setRoutesFromBackend] = useState(null);
  useEffect(() => {
    async function loadRoutes() {
      try {
        const data = await getRoutes();
        const map = {};
        const names = [];
        for (const r of data) {
          map[r.name] = { stops: r.stops || {}, capacity: r.capacity };
          names.push(r.name);
        }
        setRoutesFromBackend({ map, names });
      } catch (e) {
        setRoutesFromBackend(null);
      }
    }
    loadRoutes();
  }, []);

  const effectiveRouteData = routesFromBackend?.map || routeData;
  const effectiveRouteNames = routesFromBackend?.names || routeNames;

  const initialRoute = user.busRoute && effectiveRouteData[user.busRoute] 
    ? user.busRoute 
    : effectiveRouteNames[0];
  
  const stopsForInitialRoute = effectiveRouteData[initialRoute]?.stops || {};
  
  const initialStop = user.favoriteStop && stopsForInitialRoute[user.favoriteStop]
    ? user.favoriteStop
    : Object.keys(stopsForInitialRoute)[0];

  const [myLostAndFoundItems, setMyLostAndFoundItems] = useState([]);
  useEffect(() => {
    let timer;
    async function refreshLF() {
      try {
        const items = await getLostAndFound({ userId: user.id });
        const mine = (items || []).filter(item => item.user === user.name)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setMyLostAndFoundItems(mine);
      } catch (_) {}
    }
    if (user?.id) {
      refreshLF();
      timer = setInterval(refreshLF, 30000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [user?.id, user.name]);

  const [selectedRoute, setSelectedRoute] = useState(initialRoute);
  const [selectedStop, setSelectedStop] = useState(initialStop);
  const [eta, setEta] = useState(effectiveRouteData[initialRoute].stops[initialStop]);
  const [notificationSent, setNotificationSent] = useState(false);
  const [isCommendationModalOpen, setIsCommendationModalOpen] = useState(false);

  const location = useLocation();

  // Update selected route and stop when user profile changes (e.g., after editing in Profile page)
  useEffect(() => {
    if (user.busRoute && user.busRoute !== selectedRoute) {
      setSelectedRoute(user.busRoute);
      const stopsForRoute = effectiveRouteData[user.busRoute]?.stops || {};
      const stopToSet = user.favoriteStop && stopsForRoute[user.favoriteStop]
        ? user.favoriteStop
        : Object.keys(stopsForRoute)[0];
      setSelectedStop(stopToSet);
      const newEta = effectiveRouteData[user.busRoute].stops[stopToSet];
      setEta(newEta);
    }
  }, [user.busRoute, user.favoriteStop, selectedRoute, effectiveRouteData]);

  // Fetch user's feedback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function fetchFeedback() {
      setIsLoadingFeedback(true);
      try {
        const feedbacks = await getMyFeedback(user.id); 
        setMyFeedback(feedbacks);
      } catch (error) {
        showNotification(error.message || "Failed to load feedback.", "error");
      }
      setIsLoadingFeedback(false);
    }
    if (user?.id) fetchFeedback(); 
  }, [user?.id, showNotification, location.state?.refresh]);

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
      return recentReports[0].level; 
    }
    return 'unknown'; 
  }, [crowdednessData, selectedRoute]);

  const handleCrowdednessReport = (level) => {
    const newReport = {
      route: selectedRoute,
      level,
      timestamp: new Date().toISOString(),
    };
    setCrowdednessData(prev => [newReport, ...prev]);
    showNotification(`Thank you for reporting the bus status as "${level}"!`, 'info');
  };

  const handleOvercrowdingReport = () => {
    const newReport = {
      route: selectedRoute,
      level: 'crowded',
      timestamp: new Date().toISOString(),
    };
    setCrowdednessData(prev => [newReport, ...prev]);
    showNotification(`Overcrowding reported for route ${selectedRoute}. Thank you for helping!`, 'info');
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setNotificationSent(false);
  }, [selectedRoute, selectedStop]);

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
      if (minutesUntilEta <= 10 && minutesUntilEta > 0) {
        showNotification(`Your bus for route ${selectedRoute} is expected in about ${Math.ceil(minutesUntilEta)} minutes.`, 'info');
        setNotificationSent(true); 
        clearInterval(interval); 
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [eta, notificationSent, selectedRoute, showNotification]);

  const handleRouteChange = (e) => {
    const newRoute = e.target.value;
    const newStops = effectiveRouteData[newRoute].stops;
    const firstStop = Object.keys(newStops)[0];
    setSelectedRoute(newRoute);
    setSelectedStop(firstStop);
    setEta(newStops[firstStop]);
  };

  const handleStopChange = (e) => {
    const newStop = e.target.value;
    setSelectedStop(newStop);
    setEta(effectiveRouteData[selectedRoute].stops[newStop]);
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

      <div className="dashboard-card full-width-card my-feedback-card">
        <h3>My Submitted Feedback</h3>
        {isLoadingFeedback ? <p>Loading feedback...</p> : myFeedback.length > 0 ? (
          <table className="feedback-table">
            <thead>
              <tr>
                <th>Submitted On</th>
                <th>Ref ID</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myFeedback.map(fb => (
                <tr key={fb.id} onClick={() => navigate(`/feedback/${fb.id}`)} className="clickable-row">
                  <td data-label="Submitted On">{new Date(fb.submittedOn).toLocaleDateString()}</td>
                  <td data-label="Ref ID">{fb.referenceId || 'N/A'}</td>
                  <td data-label="Route">{fb.route || 'N/A'}</td>
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
            {Object.keys(effectiveRouteData[selectedRoute].stops).map(stop => (
              <option key={stop} value={stop}>{stop}</option>
            ))}
          </select>

          <div className="bus-capacity-display">
            <strong>Bus Capacity:</strong>
            <span>{effectiveRouteData[selectedRoute]?.capacity || 'N/A'} Seats</span>
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
                <strong>{item.item}</strong> <span className="text-light">on Route {item.route}</span>
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