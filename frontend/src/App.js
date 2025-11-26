import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { NotificationProvider } from "./components/NotificationContext";
import { getFeedback } from "./services/api";
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
import ChatAssistant from "./components/ChatAssistant";
import { initialBusData } from "./assets/initialBusData";


import "./App.css";
import "./components/ChatAssistant.css";


const initialAnnouncements = [
    { id: 1, text: "Bus routes will be revised from next Monday. Please check the portal." },
    { id: 2, text: "Transport services will be unavailable on the 25th due to a public holiday." }
];

const initialCommendations = [
    { id: 1, route: 'S1: VALASARAVAKKAM', praise: 'Safe Driving', message: 'Driver was very careful.', date: '2023-11-10' },
    { id: 2, route: 'S5: TIRUVOTRIYUR', praise: 'Helpful & Courteous', message: '', date: '2023-11-09' },
    { id: 3, route: 'S1: VALASARAVAKKAM', praise: 'On-Time Champion', message: 'Always on time!', date: '2023-11-08' },
];


const initialLostAndFound = [];

const initialCrowdednessData = [
    { route: 'S1: VALASARAVAKKAM', level: 'empty', timestamp: new Date().toISOString() }
];
const RootRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return user ? <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace /> : <Login />;
};

function App() {
  const location = useLocation();
  const { user, users, isLoading, isExiting } = useAuth();
  const [feedbackData, setFeedbackData] = useState([]);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [commendations, setCommendations] = useState(initialCommendations);
  const [lostAndFoundItems, setLostAndFoundItems] = useState(initialLostAndFound);
  const [busData, setBusData] = useState(initialBusData);
  const [crowdednessData, setCrowdednessData] = useState(initialCrowdednessData);

  useEffect(() => {
    const fetchAllFeedback = async () => {
      try {
        const data = await getFeedback();
        setFeedbackData(data);
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
      }
    };
    fetchAllFeedback();
  }, []);

  const noNavbarRoutes = ['/', '/forgot-password', '/reset-password'];
  const showNavbar = !noNavbarRoutes.includes(location.pathname);
  const showFooter = showNavbar;

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
            element={
              <ProtectedRoute role="student">
                <StudentDashboard feedbackData={feedbackData} announcements={announcements} setCommendations={setCommendations} lostAndFoundItems={lostAndFoundItems} crowdednessData={crowdednessData} setCrowdednessData={setCrowdednessData} users={users} />
              </ProtectedRoute>} 
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
            path="/feedback/:feedbackId"
            element={<ProtectedRoute role="student"><FeedbackDetail feedbackData={feedbackData} setFeedbackData={setFeedbackData} /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/feedback/:feedbackId"
            element={<ProtectedRoute role="admin"><FeedbackDetail feedbackData={feedbackData} setFeedbackData={setFeedbackData} /></ProtectedRoute>} 
          />
        </Routes>
      </div>
      {user && user.role === 'student' && (
        <ChatAssistant />
      )}
      {showFooter && <Footer />}
    </div>
  );
};

function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default AppWrapper;
