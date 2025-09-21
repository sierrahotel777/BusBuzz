import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./Form.css";
import { useNotification } from "./NotificationContext";
import PasswordInput from "./PasswordInput";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addUser, loginWithProvider } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showNotification("Passwords do not match.", "error");
      return;
    }
    setIsLoading(true);

    const newUserData = { name, email, password, collegeId, role: 'student', points: 0, provider: 'email' };
    addUser(newUserData);
    showNotification("Signup successful! Please log in.", "success");
    navigate('/');
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider) => {
      const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
      const mockUserEmail = provider === 'google' ? 'student@college.com' : 'tim.c@apple.com';

      // Simulate the pop-up and account selection
      const consent = window.confirm(`This is a mock authentication flow.\n\nDo you want to sign up as ${providerName} user "${mockUserEmail}"?`);

      if (!consent) {
          return; // User cancelled the "pop-up"
      }

      setIsLoading(true);
      try {
          const user = await loginWithProvider(provider);
          if (user) {
              navigate('/student'); // Social logins always go to student dashboard in this mock
          }
      } catch (error) {
          showNotification(error.message, 'error');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="form-container">
        <h2>Create Account</h2>
        <p className="form-description" style={{ fontSize: '14px', color: '#6c757d' }}>Join us! Please fill in your details to get started.</p>
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">College Email</label>
            <input id="email" type="email" placeholder="Enter your college email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="collegeId">College ID</label>
            <input id="collegeId" type="text" placeholder="Enter your college ID" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? <span className="button-spinner"></span> : 'Sign Up'}
          </button>
        </form>
        <div className="social-login-divider">or</div>
        <div className="social-login-buttons">
            <button onClick={() => handleSocialLogin('google')} className="social-btn google" disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9873 5.48182 18 9 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29H0.957275C0.347727 8.55 0 9.74091 0 11.0318C0 12.3227 0.347727 13.5136 0.957275 14.71L3.96409 10.71Z" fill="#FBBC05"/>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.02409 12.4405 4.925L15.0218 2.34364C13.4673 0.891818 11.43 0 9 0C5.48182 0 2.43818 2.01273 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              <span>Sign up with Google</span>
            </button>
            <button onClick={() => handleSocialLogin('apple')} className="social-btn apple" disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.2093 9.3813C14.2333 9.3333 14.2573 9.2773 14.2813 9.2133C14.0253 8.7813 13.6893 8.4133 13.2813 8.1013C12.5253 7.5253 11.6493 7.2613 10.6893 7.2613C9.8013 7.2453 8.8893 7.5493 8.1933 8.1013C7.4893 8.6453 7.0413 9.4213 6.9053 10.2933C6.9053 10.3013 6.9053 10.3093 6.9053 10.3173C7.8333 10.2613 8.7373 9.8853 9.4813 9.2613C9.5293 9.2213 9.5773 9.1813 9.6253 9.1413C9.1693 8.6293 8.8413 8.0053 8.6733 7.3333C8.2413 7.4773 7.8493 7.7493 7.5453 8.1013C6.7893 8.8853 6.4413 9.9333 6.5453 10.9893C6.6813 12.3333 7.4013 13.5013 8.4573 14.1813C9.1293 14.6213 9.9213 14.8293 10.7133 14.8213C10.8813 14.8213 11.0493 14.8133 11.2173 14.7893C11.9613 14.6853 12.6413 14.3413 13.1853 13.8053C13.2413 13.7573 13.2973 13.7093 13.3533 13.6613C13.8093 14.1813 14.4093 14.6293 15.1293 14.8213C15.0813 14.5413 15.0093 14.2613 14.9253 13.9893C14.6253 13.0213 14.7453 11.9893 15.2493 11.1013C15.4573 10.7413 15.7293 10.4293 16.0573 10.1813C15.5213 9.8693 14.8893 9.6613 14.2093 9.3813ZM12.2173 5.5813C12.7293 5.0053 13.0413 4.2613 13.1133 3.4693C12.3133 3.6613 11.5293 4.1413 10.9933 4.7813C10.4813 5.3413 10.1613 6.0933 10.0893 6.8853C10.9293 6.7413 11.7133 6.2613 12.2173 5.5813Z" fill="white"/>
              </svg>
              <span>Sign up with Apple</span>
            </button>
        </div>
        <p className="form-links" style={{ justifyContent: 'center', marginTop: '24px', fontSize: '14px' }}>
          Already have an account? <Link to="/" style={{ marginLeft: '5px' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
