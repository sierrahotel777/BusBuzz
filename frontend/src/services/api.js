//const API_URL = process.env.REACT_APP_API_URL || 'https://busbuzz-api-live-eus.azurewebsites.net/api';
const API_URL = 'https://busbuzz-api-live-eus.azurewebsites.net/api';

/**
 * Registers a new user.
 * @param {Object} userData - The user's registration data.
 * @returns {Promise<Object>} The response data from the server.
 */
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

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<Object>} The response data, including the user object.
 */
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

/**
 * Fetches all users from the backend.
 * @returns {Promise<Array>} A list of all users.
 */
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

/**
 * Fetches all feedback submitted by the currently logged-in user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} An array of the user's feedback objects.
 */
export const getMyFeedback = async (userId) => { // userId is now explicitly passed as query param
  const response = await fetch(`${API_URL}/auth/feedback/?userId=${userId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch your feedback.');
  return data;
};

/**
 * Fetches all feedback from the backend (for admin).
 * @returns {Promise<Array>} A list of all feedback items.
 */
export const getFeedback = async () => { // No token parameter
  try {
    // Fetch all feedback without authentication
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

/**
 * Triggers a download of all users as a CSV file.
 */
export const exportUsers = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/users/export`);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to export users.');
    }

    // Trigger file download
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
/**
 * Imports users from a parsed CSV file.
 * @param {Array<Object>} users - An array of user objects to import.
 * @returns {Promise<Object>} The result of the import operation.
 */
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

/**
 * Updates the status of a specific feedback item with admin notes.
 * @param {string} feedbackId - The MongoDB ObjectId of the feedback item.
 * @param {string} newStatus - The new status ('In Progress' or 'Resolved').
 * @param {string} notes - Internal resolution notes.
 * @param {string} token - The user's JWT token for authorization.
 * @returns {Promise<Object>} The update confirmation.
 */
export const updateFeedbackStatus = async (feedbackId, newStatus, notes) => { // No token parameter
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

/**
 * Submits new feedback from a user.
 * @param {Object} feedbackData - The feedback data from the form.
 * @param {string} token - The user's JWT for authorization.
 * @returns {Promise<Object>} The server response, including the newly created feedback.
 */
export const submitFeedback = async (feedbackData) => { // No token parameter
  const response = await fetch(`${API_URL}/auth/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to submit feedback.');
  return data;
};

/**
 * Fetches feedback details by ID.
 * @param {string} id - The ID of the feedback to fetch.
 * @returns {Promise<Object>} The feedback details.
 */
export const getFeedbackById = async (id) => { // No token parameter
  // Backend expects /:feedbackId, not ?_id=
  const response = await fetch(`${API_URL}/auth/feedback/${id}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch feedback.');
  return data;
};