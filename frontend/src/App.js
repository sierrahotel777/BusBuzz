import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { NotificationProvider } from "./components/NotificationContext";
import { ThemeProvider } from "./components/ThemeContext";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Profile from "./components/Profile";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Feedback from "./components/Feedback";
import ForgotPassword from "./components/ForgotPassword";
import SystemStatus from "./components/SystemStatus";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import LostAndFound from "./components/LostAndFound";
import HelpAndSupport from "./components/HelpAndSupport";
import TermsOfService from "./components/TermsOfService";
import PrivacyPolicy from "./components/PrivacyPolicy";
import UserManagement from "./components/UserManagement";
import ResetPassword from "./components/ResetPassword";
import FeedbackDetail from "./components/FeedbackDetail";
import Notification from "./components/Notification";
import LoadingSpinner from "./components/LoadingSpinner";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import FeedbackManagement from "./components/FeedbackManagement";
import BusManagement from "./components/BusManagement";
import { getFeedback } from "./services/api";
import "./App.css";

// This component handles the logic for the root path.
// If the user is logged in, it redirects them to their dashboard.
// Otherwise, it shows the Login page.
const RootRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return user ? <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace /> : <Login />;
};

// A helper component to conditionally render the Navbar
const AppContent = () => {
  const location = useLocation();
  const [feedbackData, setFeedbackData] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [commendations, setCommendations] = useState([]);
  const [lostAndFoundItems, setLostAndFoundItems] = useState([]);
  const [busData, setBusData] = useState([]);
  const [crowdednessData, setCrowdednessData] = useState([]);
  const { user, users, isLoading, isExiting } = useAuth();

  useEffect(() => {
    const fetchFeedback = async () => {
      // Only fetch if the user is logged in and has a token
      if (!user?.token) return;

      try {
        // Use the centralized getFeedback function which handles auth
        const data = await getFeedback(user.token);
        setFeedbackData(data);
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
        // Optionally, show a notification to the user
      }
    };

    fetchFeedback();
  }, [user]); // Re-run when the user object changes (e.g., on login)
  
  // We don't want to show the Navbar on the Login or Signup pages
  const noNavbarRoutes = ['/', '/forgot-password', '/reset-password'];
  const showNavbar = !noNavbarRoutes.includes(location.pathname);
  const showFooter = showNavbar; // Show footer on the same pages as navbar

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={isExiting ? 'app-wrapper exiting' : 'app-wrapper'}>
      {showNavbar && user && <Navbar />}
      <Notification />
      <div className="page-content-wrapper" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<RootRedirect />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/lost-and-found" element={<ProtectedRoute><LostAndFound items={lostAndFoundItems} setItems={setLostAndFoundItems} /></ProtectedRoute>} />
          <Route path="/status" element={<ProtectedRoute><SystemStatus /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><HelpAndSupport /></ProtectedRoute>} />
          <Route path="/terms" element={<ProtectedRoute><TermsOfService /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route 
            path="/student" 
            element={<ProtectedRoute role="student"><StudentDashboard feedbackData={feedbackData} announcements={announcements} setCommendations={setCommendations} lostAndFoundItems={lostAndFoundItems} crowdednessData={crowdednessData} setCrowdednessData={setCrowdednessData} users={users} /></ProtectedRoute>} 
          />
          <Route 
            path="/admin" 
            element={<ProtectedRoute role="admin"><AdminDashboard feedbackData={feedbackData} announcements={announcements} setAnnouncements={setAnnouncements} commendations={commendations} lostAndFoundItems={lostAndFoundItems} setLostAndFoundItems={setLostAndFoundItems} /></ProtectedRoute>}
          />
          <Route 
            path="/admin/user-management" 
            element={<ProtectedRoute role="admin"><UserManagement /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/bus-details" 
            element={<ProtectedRoute role="admin"><BusManagement busData={busData} setBusData={setBusData} users={users} /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/lost-and-found" 
            element={<ProtectedRoute role="admin"><LostAndFound items={lostAndFoundItems} setItems={setLostAndFoundItems} isAdminPage={true} /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/feedback" 
            element={<ProtectedRoute role="admin"><FeedbackManagement feedbackData={feedbackData} /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/analytics" 
            element={<ProtectedRoute role="admin"><AnalyticsDashboard feedbackData={feedbackData} crowdednessData={crowdednessData} /></ProtectedRoute>} 
          />
          <Route 
            path="/feedback" 
            element={<ProtectedRoute role="student"><Feedback setFeedbackData={setFeedbackData} /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/feedback/:feedbackId" 
            element={<ProtectedRoute role="admin"><FeedbackDetail feedbackData={feedbackData} setFeedbackData={setFeedbackData} /></ProtectedRoute>} 
          />
        </Routes>
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
