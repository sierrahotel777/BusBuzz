import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import "./Profile.css"; // Using dedicated styles for the profile page
import { routeData, routeNames } from './routeData';

// Helper function to format the 'last active' time
function formatTimeAgo(isoString) {
    if (!isoString) return 'never';
    
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) {
        return 'just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 2) {
        return 'yesterday';
    } else {
        return `${days} days ago`;
    }
}

function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  // Initial profile data now comes from the authenticated user
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    collegeId: user.collegeId,
    role: user.role,
    busRoute: user.busRoute || "",
    favoriteStop: user.favoriteStop || "",
  });
  // Store original data to handle cancellation of edits
  const [originalProfileData, setOriginalProfileData] = useState(profileData);
  const { showNotification } = useNotification();

  const handleEditClick = () => {
    setOriginalProfileData(profileData); // Save current state before editing
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setProfileData(originalProfileData); // Revert to original data
    setIsEditing(false);
  };

  const handleSaveClick = () => {
    updateUser(profileData);
    setOriginalProfileData(profileData); // Update the 'original' data to the new saved state
    setIsEditing(false);
    showNotification("Profile updated successfully!");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'busRoute') {
        // When route changes, reset the favorite stop to the first one in the new route
        const newStops = routeData[value]?.stops || {};
        const firstStop = Object.keys(newStops)[0] || '';
        setProfileData(prev => ({
            ...prev,
            busRoute: value,
            favoriteStop: firstStop
        }));
    } else {
        setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          <img src={`https://i.pravatar.cc/150?u=${user.email}`} alt="User Avatar" />
          {isEditing && (
            <div className="avatar-upload">
              <label htmlFor="avatar-input">Change</label>
              <input id="avatar-input" type="file" accept="image/*" />
            </div>
          )}
        </div>
        <h2>My Profile</h2>
        <div className="profile-details">
          <div className="profile-field">
            <label>Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleChange}
              />
            ) : (
              <p>{profileData.name}</p>
            )}
          </div>
          <div className="profile-field">
            <label>College Email</label>
            {/* Email is often a unique ID and not editable */}
            <p>{profileData.email}</p>
          </div>
          <div className="profile-field">
            <label>College ID</label>
            {/* College ID should not be editable */}
            <p>{profileData.collegeId}</p>
          </div>
          <div className="profile-field">
            <label>Role</label>
            {/* Role is typically not user-editable */}
            <p>{profileData.role}</p>
          </div>
          <div className="profile-field">
            <label>Assigned Bus Route</label>
            {isEditing ? (
              <select name="busRoute" value={profileData.busRoute} onChange={handleChange}>
                <option value="" disabled>Select a Route</option>
                {routeNames.map(route => <option key={route} value={route}>{route}</option>)}
              </select>
            ) : (
              <p>{profileData.busRoute || 'Not Assigned'}</p>
            )}
          </div>
          <div className="profile-field">
            <label>Favorite Bus Stop</label>
            {isEditing ? (
              <select name="favoriteStop" value={profileData.favoriteStop} onChange={handleChange} disabled={!profileData.busRoute}>
                <option value="" disabled>Select a Stop</option>
                {profileData.busRoute && routeData[profileData.busRoute] && Object.keys(routeData[profileData.busRoute].stops).map(stop => (
                    <option key={stop} value={stop}>{stop}</option>
                ))}
              </select>
            ) : (
              <p>{profileData.favoriteStop || 'Not Set'}</p>
            )}
          </div>
          <div className="profile-field">
            <label>Community Points</label>
            <p className="points-field">
              <span className="points-icon">⭐</span>
              {user.points || 0} Points
            </p>
          </div>
          <div className="profile-field">
            <label>Last Active</label>
            <p className="status-field">
              <span className="status-indicator active"></span>{formatTimeAgo(user.lastActive)}
            </p>
          </div>
        </div>
        <div className="profile-actions">
          {isEditing ? (
            <>
              <button onClick={handleSaveClick} className="save-btn">Save</button>
              <button onClick={handleCancelClick} className="cancel-btn">Cancel</button>
            </>
          ) : (
            <button onClick={handleEditClick}>Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
