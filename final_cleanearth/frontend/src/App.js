import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequestPage from './pages/RequestPage';
import VolunteerDashboard from './pages/VolunteerDashboard';
import CampRegister from './pages/CampRegister';
import VolunteerLeaderboard from './pages/VolunteerLeaderboard';
import AboutUs from './pages/AboutUs';
import AdminDashboard from './pages/AdminDashboard';
import CampPage from './pages/CampPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="w-screen overflow-x-hidden">
        <Routes>
          {/* Public routes that don't require authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutUs />} />
          
          {/* Protected routes that require authentication */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><RequestPage /></ProtectedRoute>} />
          <Route path="/volunteer" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
          <Route path="/camps" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
          <Route path="/camp-register" element={<ProtectedRoute><CampRegister /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><VolunteerLeaderboard /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><HomePage /></ProtectedRoute>} /> {/* Replace with LogsPage when created */}
          <Route path="/badges" element={<ProtectedRoute><HomePage /></ProtectedRoute>} /> {/* Replace with BadgesPage when created */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/camp/:id" element={<ProtectedRoute><CampPage /></ProtectedRoute>} /> {/* Dynamic route for camp details */}
          
          {/* Redirect to home for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Redirect to home for unknown routes */}
        </Routes>
    </div>
  );
}

export default App;