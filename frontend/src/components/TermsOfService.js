import React from 'react';
import './LegalPages.css';

const TermsOfService = () => {
    return (
        <div className="legal-page-container">
            <div className="dashboard-header">
                <h2>Terms of Service</h2>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="legal-content">
                <h3>1. Introduction</h3>
                <p>Welcome to BusBuzz! These terms and conditions outline the rules and regulations for the use of BusBuzz's services.</p>

                <h3>2. Intellectual Property Rights</h3>
                <p>Other than the content you own, under these Terms, BusBuzz and/or its licensors own all the intellectual property rights and materials contained in this Application.</p>

                <h3>3. Restrictions</h3>
                <p>You are specifically restricted from all of the following:</p>
                <ul>
                    <li>publishing any Application material in any other media;</li>
                    <li>selling, sublicensing and/or otherwise commercializing any Application material;</li>
                    <li>publicly performing and/or showing any Application material;</li>
                    <li>using this Application in any way that is or may be damaging to this Application;</li>
                    <li>using this Application contrary to applicable laws and regulations, or in any way may cause harm to the Application, or to any person or business entity;</li>
                </ul>

                <h3>4. Your Content</h3>
                <p>In these Application Standard Terms and Conditions, “Your Content” shall mean any audio, video text, images or other material you choose to display on this Application. By displaying Your Content, you grant BusBuzz a non-exclusive, worldwide irrevocable, sub-licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.</p>

                <h3>5. No warranties</h3>
                <p>This Application is provided "as is," with all faults, and BusBuzz express no representations or warranties, of any kind related to this Application or the materials contained on this Application.</p>

                <h3>6. Limitation of liability</h3>
                <p>In no event shall BusBuzz, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Application whether such liability is under contract.</p>
            </div>
        </div>
    );
};

export default TermsOfService;