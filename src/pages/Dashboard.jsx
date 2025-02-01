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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getChores, getChildChores } from '../services/chores';
import {
  getTotalEarnings,
  getEarningsHistory
} from '../services/allowances';

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
  const chartData = [
    { name: 'Active', value: activeChores.length },
    { name: 'Completed', value: completedChores.length }
  ];

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

        {/* Updated Chores Overview with Dynamic Chart */}
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
              <>
                <Typography>
                  {activeChores.length} active chores
                </Typography>
                <Box sx={{ width: '100%', height: 300, minHeight: '300px' }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Number of Chores">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Active' ? '#ff4d4d' : '#4caf50'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
