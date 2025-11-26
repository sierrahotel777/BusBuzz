import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Form.css";
import "./Feedback.css";
import { useNotification } from "./NotificationContext";
import { submitFeedback, uploadAttachment } from "../services/api";

function Feedback({ setFeedbackData }) {
  const [route, setRoute] = useState("");
  const [busNo, setBusNo] = useState("");
  const [driverBehavior, setDriverBehavior] = useState("");
  const [punctuality, setPunctuality] = useState("");
  const [cleanliness, setCleanliness] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Attachment and rating fields are optional now — do not block submission

    setIsSubmitting(true);

    // If a file is selected, upload it first and attach the returned URL
    let attachments = null;
    if (attachmentFile) {
      console.log('Uploading attachment:', attachmentFile.name);
      try {
        const upload = await uploadAttachment(attachmentFile);
        console.log('Upload result:', upload);
        attachments = [{ url: upload.url, name: upload.originalName }];
        // store filename for backward compatibility display
        setAttachmentName(upload.filename || attachmentFile.name);
      } catch (uploadError) {
        console.error('Attachment upload failed:', uploadError);
        showNotification('Warning: Attachment upload failed, but feedback can still be submitted without it.', 'warning');
        // Continue without attachment
      }
    }

    const newFeedback = {
      route,
      busNo,
      comments,
      message: comments, // some backends expect `message` — include for compatibility
      issue: issueCategory,
      details: {
        punctuality,
        driverBehavior,
        cleanliness,
      },
      attachmentName: attachmentName,
      attachments: attachments,
      userId: user.id,
      userName: user.name,
    };
    try {
      console.log('=== FEEDBACK SUBMISSION DEBUG ===');
      console.log('Route:', route);
      console.log('BusNo:', busNo);
      console.log('Comments:', comments);
      console.log('Issue:', issueCategory);
      console.log('Details:', { punctuality, driverBehavior, cleanliness });
      console.log('Full payload:', JSON.stringify(newFeedback, null, 2));
      console.log('Submitting feedback payload:', newFeedback);
      const data = await submitFeedback(newFeedback); // No token needed
      console.log('Backend response for feedback submit:', data);

      if (setFeedbackData) {
        // Backend may return `feedback.id` or `feedback._id`. Normalize it for the frontend list.
        const fb = data.feedback || data;
        const normalized = { ...fb, _id: fb._id || fb.id };
        setFeedbackData(prevData => [normalized, ...prevData]);
      }

      showNotification("Feedback submitted successfully!", "success");
      navigate('/student');
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showNotification(error.message || "An error occurred while submitting feedback.", "error");
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
      setAttachmentFile(e.target.files[0]);
    }
  };

  return (
    <>
    <div className="feedback-page-container">
      <div className="dashboard-header">
        <h2>Submit Feedback</h2>
        <p>Report an issue or share your experience with us.</p>
      </div>
      <div className="form-container">
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
            <select value={driverBehavior} onChange={(e) => setDriverBehavior(e.target.value)}>
              <option value="" disabled>Select rating</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          <div className="form-group">
            <label>Punctuality</label>
            <select value={punctuality} onChange={(e) => setPunctuality(e.target.value)}>
              <option value="" disabled>Select rating</option>
              <option value="On Time">On Time</option>
              <option value="Slightly Late">Slightly Late</option>
              <option value="Very Late">Very Late</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cleanliness</label>
            <select value={cleanliness} onChange={(e) => setCleanliness(e.target.value)}>
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
            <input type="file" id="attachment" name="attachment" onChange={handleFileChange} accept="image/*,video/*" />
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
    </div>
    </>
  );
}

export default Feedback;
