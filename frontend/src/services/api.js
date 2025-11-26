// Default API base; allow override with REACT_APP_API_URL
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_BASE = API_URL.replace(/\/api\/?$/, '');

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Registration failed.');
  return data;
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed.');
  return data;
};

export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/users`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch users.');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await fetch(`${API_URL}/auth/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update profile.');
    return data;
  } catch (error) {
    console.error('API Error (updateUserProfile):', error);
    throw error;
  }
};

export const getMyFeedback = async (userId) => { 
  const response = await fetch(`${API_URL}/feedback?userId=${userId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch your feedback.');
  return data;
};

export const getFeedback = async () => { 
  try {
    const response = await fetch(`${API_URL}/feedback`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch feedback.');
    }

    return data;
  } catch (error) {
    console.error('API Error (getFeedback):', error);
    throw error;
  }
};

export const exportUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/users/export`);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to export users.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'users.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
export const importUsers = async (users) => {
  const response = await fetch(`${API_URL}/auth/users/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Import failed.');
  return data;
};

export const updateFeedbackStatus = async (feedbackId, newStatus, notes) => { 
  try {
    // Backend expects { status, resolution } and uses PUT for update
    const response = await fetch(`${API_URL}/feedback/${feedbackId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus, resolution: notes }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update feedback status.');
    }

    return data;
  } catch (error) {
    console.error('API Error (Update Feedback):', error);
    throw error;
  }
};

export const submitFeedback = async (feedbackData) => { 
  try {
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData),
    });

    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { text }; }

    if (!response.ok) {
      const msg = (data && (data.message || data.error)) || response.statusText || 'Failed to submit feedback.';
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    // Normalise network errors
    if (err && err.message) throw err;
    throw new Error('Network error submitting feedback.');
  }
};

export const getFeedbackById = async (id) => { 
  const response = await fetch(`${API_URL}/feedback/${id}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch feedback.');
  return data;
};

export const uploadAttachment = async (file) => {
  console.log('uploadAttachment: Starting upload for file:', file.name, 'Size:', file.size);
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_URL}/attachments`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json();
  console.log('uploadAttachment: Response status:', response.status, 'Data:', data);
  if (!response.ok) throw new Error(data.message || 'Failed to upload attachment.');
  // Normalize returned URL to absolute so frontend links always work
  if (data && data.url) {
    if (!/^https?:\/\//i.test(data.url)) {
      // If the URL is relative (e.g. /uploads/.. or /api/attachments/..), prefix with API base
      data.url = `${API_BASE}${data.url}`;
    }
  }
  console.log('uploadAttachment: Final returned data:', data);
  return data; // { filename, url, originalName }
};

export const addConversationEntry = async (feedbackId, entry) => {
  const response = await fetch(`${API_URL}/feedback/${feedbackId}/conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to add conversation entry.');
  return data;
};

export const deleteFeedback = async (feedbackId) => {
  const response = await fetch(`${API_URL}/feedback/${feedbackId}`, {
    method: 'DELETE',
  });
  if (response.status === 204) return true;
  const data = await response.json();
  throw new Error(data.message || 'Failed to delete feedback.');
};

// Lost & Found API
export const getLostAndFound = async (query = {}) => {
  const params = new URLSearchParams(query).toString();
  const url = params ? `${API_URL}/lostfound?${params}` : `${API_URL}/lostfound`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch lost & found items.');
  return data;
};

export const postLostAndFound = async (item) => {
  try {
    const res = await fetch(`${API_URL}/lostfound`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { text }; }
    if (!res.ok) {
      const msg = data && (data.message || data.error) ? `${res.status} ${res.statusText}: ${data.message || data.error}` : `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    // Surface network errors or HTTP errors with clearer messages
    if (err && err.message) throw err;
    throw new Error('Network error posting lost & found item.');
  }
};

export const updateLostAndFound = async (id, update) => {
  const res = await fetch(`${API_URL}/lostfound/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update item.');
  return data;
};

export const deleteLostAndFound = async (id) => {
  const res = await fetch(`${API_URL}/lostfound/${id}`, { method: 'DELETE' });
  if (res.status === 204) return true;
  const data = await res.json();
  throw new Error(data.message || 'Failed to delete item.');
};