import React, { useState } from 'react';
import './HelpAndSupport.css';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const faqs = [
    {
        question: "How do I submit feedback?",
        answer: "Navigate to the 'Submit Feedback' page from the main menu. Fill in the details about the route, bus number, and your experience, then click 'Submit Feedback'."
    },
    {
        question: "How do I change my profile information?",
        answer: "Go to the 'Profile' page from the main menu. Click the 'Edit Profile' button, make your changes, and then click 'Save'."
    },
    {
        question: "How does the 'Last Active' status work?",
        answer: "Your 'Last Active' status updates automatically every minute while you have the BusBuzz application open. It helps you see when you were last using the service."
    },
    {
        question: "What do the different feedback statuses mean?",
        answer: "'Pending' means your feedback has been received and is waiting for review. 'In Progress' means an administrator is actively looking into your feedback. 'Resolved' means the issue has been addressed."
    }
];

function HelpAndSupport() {
    const [openIndex, setOpenIndex] = useState(null);
    const { user } = useAuth();
    const { showNotification } = useNotification();

    const [contactForm, setContactForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleContactChange = (e) => {
        const { name, value } = e.target;
        setContactForm(prev => ({ ...prev, [name]: value }));
    };

    const handleContactSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate an API call to a support desk or email service
        setTimeout(() => {
            setIsSubmitting(false);
            showNotification("Your message has been sent! We'll get back to you shortly.", 'info');
            // Only clear the message field, keep user details
            setContactForm(prev => ({ ...prev, message: '' }));
        }, 1500);
    };

    return (
        <div className="help-container">
            <div className="dashboard-header">
                <h2>Help & Support</h2>
                <p>Find answers to common questions about BusBuzz.</p>
            </div>
            <div className="faq-section">
                {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <div className="faq-question" onClick={() => toggleFAQ(index)}>
                            <span>{faq.question}</span>
                            <span className={`faq-icon ${openIndex === index ? 'open' : ''}`}>+</span>
                        </div>
                        <div className={`faq-answer ${openIndex === index ? 'open' : ''}`}>
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="contact-section">
                <h3>Still Need Help?</h3>
                <p>If you couldn't find an answer, feel free to send us a message directly.</p>
                <form onSubmit={handleContactSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Your Name</label>
                            <input type="text" id="name" name="name" value={contactForm.name} onChange={handleContactChange} required readOnly />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Your Email</label>
                            <input type="email" id="email" name="email" value={contactForm.email} onChange={handleContactChange} required readOnly />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea id="message" name="message" rows="5" value={contactForm.message} onChange={handleContactChange} required placeholder="Please describe your issue or question..."></textarea>
                    </div>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default HelpAndSupport;