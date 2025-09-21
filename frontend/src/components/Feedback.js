import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Form.css";
import { useNotification } from "./NotificationContext";

function Feedback({ setFeedbackData }) {
  const [route, setRoute] = useState("");
  const [busNo, setBusNo] = useState("");
  const [driverBehavior, setDriverBehavior] = useState("");
  const [punctuality, setPunctuality] = useState("");
  const [cleanliness, setCleanliness] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!attachmentName) {
      showNotification("A photo or video attachment is required to submit feedback.", "error");
      return;
    }

    setIsSubmitting(true);

    const feedbackData = {
      route,
      busNo,
      comments,
      // Add all the other required fields for a complete object
      id: Date.now(), // Simple unique ID
      user: user.name,
      collegeId: user.collegeId,
      issue: issueCategory,
      status: 'Pending',
      submittedOn: new Date().toISOString(),
      details: {
        punctuality,
        driverBehavior,
        cleanliness,
      },
      attachmentName: attachmentName,
    };

    // Simulate an API call to make the loading state visible
    setTimeout(() => {
      // Update the main state in App.js
      setFeedbackData(prevData => [feedbackData, ...prevData]);

      showNotification("Feedback submitted successfully!");
      navigate('/student');
      // No need to reset isSubmitting, as we are navigating away.
    }, 1000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, you'd handle the file object here for upload.
      // For now, we'll just store the name.
      setAttachmentName(e.target.files[0].name);
    }
  };

  return (
    <div className="form-container">
      <h2>Submit Feedback</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="route">Route Number</label>
          <input
            id="route"
            type="text"
            placeholder="e.g., 5A"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="busNo">Bus Number</label>
          <input
            id="busNo"
            type="text"
            placeholder="e.g., KA-01-F-1234"
            value={busNo}
            onChange={(e) => setBusNo(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="issueCategory">Primary Issue Category</label>
          <select id="issueCategory" value={issueCategory} onChange={(e) => setIssueCategory(e.target.value)} required>
            <option value="" disabled>Select a category</option>
            <option value="Punctuality">Punctuality</option>
            <option value="Driver Behavior">Driver Behavior</option>
            <option value="Cleanliness">Cleanliness</option>
            <option value="Bus Condition">Bus Condition (AC, Seats, etc.)</option>
            <option value="Route/Stop Issue">Route/Stop Issue</option>
            <option value="Safety Concern">Safety Concern</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <fieldset className="rating-group">
          <legend>Rate Your Experience</legend>
          <div className="form-group">
            <label>Driver Behavior</label>
            <select value={driverBehavior} onChange={(e) => setDriverBehavior(e.target.value)} required>
              <option value="" disabled>Select rating</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div className="form-group">
            <label>Punctuality</label>
            <select value={punctuality} onChange={(e) => setPunctuality(e.target.value)} required>
              <option value="" disabled>Select rating</option>
              <option value="On Time">On Time</option>
              <option value="Slightly Late">Slightly Late</option>
              <option value="Very Late">Very Late</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cleanliness</label>
            <select value={cleanliness} onChange={(e) => setCleanliness(e.target.value)} required>
              <option value="" disabled>Select rating</option>
              <option value="Very Clean">Very Clean</option>
              <option value="Clean">Clean</option>
              <option value="Average">Average</option>
              <option value="Dirty">Dirty</option>
            </select>
          </div>
        </fieldset>

        <div className="form-group">
          <label htmlFor="comments">Additional Comments</label>
          <textarea
            id="comments"
            rows="4"
            placeholder="Provide any extra details here..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="attachment">Attach Photo/Video</label>
          <div className="file-input-wrapper">
            <input type="file" id="attachment" name="attachment" onChange={handleFileChange} accept="image/*,video/*" required />
            <span className="file-input-label">
              {attachmentName || 'Choose a file...'}
            </span>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}

export default Feedback;
