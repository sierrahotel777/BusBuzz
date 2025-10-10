export const API_URL = process.env.REACT_APP_API_URL || 'https://busbuzz-api-live-eus.azurewebsites.net/api';

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
 * Creates a new user via the admin panel.
 * @param {Object} userData - The new user's data.
 * @param {string} token - The admin's JWT for authorization.
 * @returns {Promise<Object>} The newly created user object.
 */
export const createUser = async (userData, token) => {
  const response = await fetch(`${API_URL}/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create user.');
  return data;
};

/**
 * Updates an existing user's data.
 * @param {string} userId - The ID of the user to update.
 * @param {Object} userData - The updated user data.
 * @param {string} token - The admin's JWT for authorization.
 * @returns {Promise<Object>} The updated user object.
 */
export const updateUser = async (userId, userData, token) => {
  const response = await fetch(`${API_URL}/auth/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update user.');
  return data;
};

/**
 * Deletes a user.
 * @param {string} userId - The ID of the user to delete.
 * @param {string} token - The admin's JWT for authorization.
 */
export const deleteUser = async (userId, token) => {
  const response = await fetch(`${API_URL}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete user.');
  }
  // DELETE requests might not return a body, so we check for status 204 or 200
  if (response.status !== 204 && response.status !== 200) {
    throw new Error('Failed to delete user.');
  }
};

/**
 * Fetches all buses from the backend.
 * @param {string} token - The user's JWT for authorization.
 * @returns {Promise<Array>} A list of all buses.
 */
export const getBuses = async (token) => {
  const response = await fetch(`${API_URL}/buses`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch buses.');
  return data;
};

/**
 * Creates a new bus.
 * @param {Object} busData - The new bus's data.
 * @param {string} token - The admin's JWT for authorization.
 * @returns {Promise<Object>} The newly created bus object.
 */
export const createBus = async (busData, token) => {
  const response = await fetch(`${API_URL}/buses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(busData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to create bus.');
  return data;
};

/**
 * Updates an existing bus's data.
 * @param {string} busId - The ID of the bus to update.
 * @param {Object} busData - The updated bus data.
 * @param {string} token - The admin's JWT for authorization.
 * @returns {Promise<Object>} The updated bus object.
 */
export const updateBus = async (busId, busData, token) => {
  const response = await fetch(`${API_URL}/buses/${busId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(busData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update bus.');
  return data;
};

/**
 * Deletes a bus.
 * @param {string} busId - The ID of the bus to delete.
 * @param {string} token - The admin's JWT for authorization.
 */
export const deleteBus = async (busId, token) => {
  const response = await fetch(`${API_URL}/buses/${busId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete bus.');
  }
  if (response.status !== 204 && response.status !== 200) {
    throw new Error('Failed to delete bus.');
  }
};

/**
 * Fetches all feedback from the backend.
 * @param {string} token - The user's JWT for authorization.
 * @returns {Promise<Array>} A list of all feedback items.
 */
export const getFeedback = async (token) => {
  const response = await fetch(`${API_URL}/feedback`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch feedback.');
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
export const updateFeedbackStatus = async (feedbackId, newStatus, notes, token) => {
  try {
    const response = await fetch(`${API_URL}/feedback/${feedbackId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Pass JWT for authorization
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