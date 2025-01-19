import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Header from './components/Layout/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chores from './pages/Chores';
import FamilyManagement from './pages/FamilyManagement';
import ChoreManagement from './pages/ChoreManagement';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
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
              {/* Parent-only routes will be added here */}
              {/* Child-only routes will be added here */}
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
