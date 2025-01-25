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
import FinancialManagement from './pages/FinancialManagement';
import Profile from './pages/Profile';
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
                path="/finances"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <FinancialManagement />
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
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
