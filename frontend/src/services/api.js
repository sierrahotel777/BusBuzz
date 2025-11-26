// Default to local backend for development; allow override with REACT_APP_API_URL
const API_URL = 'https://busbuzz-api-live-eus.azurewebsites.net/api';

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

export const getMyFeedback = async (userId) => { 
  const response = await fetch(`${API_URL}/auth/feedback/?userId=${userId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch your feedback.');
  return data;
};

export const getFeedback = async () => { 
  try {
    const response = await fetch(`${API_URL}/auth/feedback`);
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
    const response = await fetch(`${API_URL}/auth/feedback/${feedbackId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newStatus, notes }),
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
    const response = await fetch(`${API_URL}/auth/feedback`, {
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
  const response = await fetch(`${API_URL}/auth/feedback/${id}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch feedback.');
  return data;
};

export const uploadAttachment = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_URL}/attachments`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to upload attachment.');
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