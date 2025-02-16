import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { getChores, getChildChores } from '../services/chores';
import {
  getPaymentSchedule,
  getEarningsHistory,
  getTotalEarnings,
  getPaymentHistory
} from '../services/chores';

const Dashboard = () => {
  const { user, role } = useSelector((state) => state.auth);
  const [chores, setChores] = useState([]);
  const [financials, setFinancials] = useState({ totalEarnings: 0 });
  const [financialsLoading, setFinancialsLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadChoresData();
      loadFinancialData();
    }
  }, [user]);

  const loadChoresData = async () => {
    try {
      let fetchedChores;
      if (role === 'child') {
        fetchedChores = await getChildChores(user.uid);
      } else {
        fetchedChores = await getChores(user.uid);
      }
      setChores(fetchedChores);
    } catch (error) {
      console.error("Error loading chores data:", error);
    }
  };

  const loadFinancialData = async () => {
    try {
      setFinancialsLoading(true);
      const totalEarnings = await getTotalEarnings(user.uid);
      setFinancials({ totalEarnings });
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setFinancialsLoading(false);
    }
  };

  if (!user) return <CircularProgress />;

  const completedChores = chores.filter(chore => chore.completed);
  const activeChores = chores.filter(chore => chore.status === 'pending' && chore.assignedTo === user.uid);

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

        {/* Financial Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Financial Overview
            </Typography>
            {financialsLoading ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : (
              <Typography>
                Total Earnings: ${financials.totalEarnings}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Updated Chores Overview with Text Display */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Chores Overview
            </Typography>
            {chores.length === 0 ? (
              <Box display="flex" justifyContent="center">
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" paragraph>
                  <strong>Active Chores:</strong> {activeChores.length}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Completed Chores:</strong> {completedChores.length}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Total Chores:</strong> {chores.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeChores.length === 0 
                    ? "No active chores at the moment." 
                    : `You have ${activeChores.length} ${activeChores.length === 1 ? 'chore' : 'chores'} to complete.`}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
