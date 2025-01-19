import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chores from './pages/Chores';
import FamilyManagement from './pages/FamilyManagement';
import ChoreManagement from './pages/ChoreManagement';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

// Main App component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chores"
              element={
                <ProtectedRoute>
                  <Chores />
                </ProtectedRoute>
              }
            />
            
            {/* Parent-only routes */}
            <Route
              path="/family"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <FamilyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chore-management"
              element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <ChoreManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
