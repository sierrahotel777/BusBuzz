import React from 'react';
import './LegalPages.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page-container">
            <div className="dashboard-header">
                <h2>Privacy Policy</h2>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="legal-content">
                <p className="text-light">We prioritize student privacy and use your data only to provide and improve transport services. Key details are summarized below.</p>
                <h3>1. Information We Collect</h3>
                <p>We collect information that you provide directly to us. For example, we collect information when you create an account, submit feedback, or otherwise communicate with us. The types of information we may collect include your name, email address, college ID, bus route, and any other information you choose to provide.</p>

                <h3>2. Use of Information</h3>
                <p>We may use the information we collect to:</p>
                <ul>
                    <li>Provide, maintain, and improve our services;</li>
                    <li>Respond to your comments, questions, and requests and provide customer service;</li>
                    <li>Communicate with you about products, services, offers, and events offered by BusBuzz and others;</li>
                    <li>Monitor and analyze trends, usage, and activities in connection with our services;</li>
                    <li>Personalize and improve the services and provide content or features that match user profiles or interests.</li>
                </ul>

                <h3>3. Sharing of Information</h3>
                <p>We may share information about you as follows or as otherwise described in this Privacy Policy:</p>
                <ul>
                    <li>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf;</li>
                    <li>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process;</li>
                    <li>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of BusBuzz or others.</li>
                </ul>

                <h3>4. Your Choices</h3>
                <p>You may update, correct or delete information about you at any time by logging into your online account or emailing us. If you wish to delete or deactivate your account, please email us, but note that we may retain certain information as required by law or for legitimate business purposes.</p>
                <p className="text-light">Contact support via the Help & Support page for any privacy-related requests.</p>
            </div>
        </div>
    );
};

export default PrivacyPolicy;