import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNotification } from "./NotificationContext";
import "./Profile.css"; 
import { routeData, routeNames } from './routeData';
import { updateUserProfile } from '../services/api';

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
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    collegeId: user.collegeId,
    role: user.role,
    busRoute: user.busRoute || "",
    favoriteStop: user.favoriteStop || "",
  });
  const [originalProfileData, setOriginalProfileData] = useState(profileData);
  const { showNotification } = useNotification();

  const handleEditClick = () => {
    setOriginalProfileData(profileData); 
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setProfileData(originalProfileData); 
    setIsEditing(false);
  };

  const handleSaveClick = async () => {
    try {
      // Update in the database
      const updates = {
        name: profileData.name,
        busRoute: profileData.busRoute,
        favoriteStop: profileData.favoriteStop,
      };
      
      const response = await updateUserProfile(user.id, updates);
      
      // Update local auth context
      updateUser(profileData);
      
      // Update original data to prevent unsaved changes on next edit
      setOriginalProfileData(profileData);
      setIsEditing(false);
      showNotification("Profile updated successfully!");
    } catch (error) {
      showNotification(error.message || 'Failed to update profile.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'busRoute') {
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
      <div className="dashboard-header">
        <h2>My Profile</h2>
        <p>View and manage your personal information and preferences.</p>
      </div>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=007bff,1abc9c,3498db,9b59b6,e74c3c&backgroundType=gradientLinear`} alt="User Avatar" />
            {isEditing && (
              <div className="avatar-upload">
                <label htmlFor="avatar-input">Change</label> 
                <input id="avatar-input" type="file" accept="image/*" disabled />
              </div>
            )}
          </div>
        </div>
        <div className="profile-details">
          <div className="profile-field half-width">
            <label>Name</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={profileData.name}
                onChange={handleChange}
              />
            ) : (
              <p>{profileData.name || user.name}</p>
            )}
          </div>
          <div className="profile-field half-width">
            <label>College Email</label>
            <p>{profileData.email}</p>
          </div>
          <div className="profile-field half-width">
            <label>College ID</label>
            <p>{profileData.email?.split('@')[0] || user.email?.split('@')[0] || 'N/A'}</p>
          </div>
          <div className="profile-field half-width" style="">
            <label>Role</label>
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
              <p>{profileData.busRoute || user.busRoute || 'Not Assigned'}</p>
            )}
          </div>
          <div className="profile-field full-width">
            <label>Favorite Bus Stop</label>
            {isEditing ? (
              <select name="favoriteStop" value={profileData.favoriteStop} onChange={handleChange} disabled={!profileData.busRoute}>
                <option value="" disabled>Select a Stop</option>
                {profileData.busRoute && routeData[profileData.busRoute] && Object.keys(routeData[profileData.busRoute].stops).map(stop => (
                    <option key={stop} value={stop}>{stop}</option>
                ))}
              </select>
            ) : (
              <p>{profileData.favoriteStop || user.favoriteStop || 'Not Set'}</p>
            )}
          </div>
          <div className="profile-field half-width">
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
            <button onClick={handleEditClick} className="edit-btn">Edit Profile</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
