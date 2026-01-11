
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import BoardView from './components/BoardView';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage'; // Added ProfilePage import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/board/:boardId"
          element={
            <ProtectedRoute>
              <BoardView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard" // Changed root path to /dashboard
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile" // Added ProfilePage route
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> {/* Added a default route for "/" */}
      </Routes>
    </Router>
  );
}

export default App;