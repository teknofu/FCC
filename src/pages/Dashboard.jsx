import React from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';

const Dashboard = () => {
  const { user, role } = useSelector((state) => state.auth);
  const { chores, loading: choresLoading } = useSelector((state) => state.chores);
  const { rewards } = useSelector((state) => state.rewards);

  if (!user) return <CircularProgress />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {user.displayName}!
            </Typography>
            <Typography variant="subtitle1">
              {role === 'parent' ? 'Parent Dashboard' : 'Child Dashboard'}
            </Typography>
          </Paper>
        </Grid>

        {/* Chores Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Chores Overview
            </Typography>
            {choresLoading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : (
              <Typography>
                {chores.length} active chores
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Rewards Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Rewards Balance
            </Typography>
            <Typography variant="h4">
              ${rewards[user.uid] || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
