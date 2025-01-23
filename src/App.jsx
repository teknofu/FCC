import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Alert } from '@mui/material';
import { Provider } from 'react-redux';
import store from './store';
import theme from './theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChoreManagement from './pages/ChoreManagement';
import FamilyManagement from './pages/FamilyManagement';
import AllowanceManagement from './pages/AllowanceManagement';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import PaymentManagement from './pages/PaymentManagement';
import PaymentHistory from './pages/PaymentHistory';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

// Main App component
function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={
                <Container sx={{ mt: 4 }}>
                  <Alert severity="error">
                    You do not have permission to access this page.
                  </Alert>
                </Container>
              } />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chores"
                element={
                  <ProtectedRoute>
                    <ChoreManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/family"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <FamilyManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/allowances"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <AllowanceManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <PaymentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments/history"
                element={
                  <ProtectedRoute>
                    <PaymentHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
