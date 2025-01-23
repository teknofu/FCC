import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { getPaymentHistory } from '../services/allowances';
import { getFamilyMembers } from '../services/family';
import PaymentHistoryTable from '../components/Payments/PaymentHistoryTable';

const PaymentHistory = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      loadPaymentHistory();
    }
  }, [selectedChild]);

  const loadFamilyMembers = async () => {
    try {
      const members = await getFamilyMembers();
      const children = members.filter(member => member.role === 'child');
      setFamilyMembers(children);
      
      // If there's only one child, select them automatically
      if (children.length === 1) {
        setSelectedChild(children[0].id);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
      setError('Failed to load family members');
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const history = await getPaymentHistory(selectedChild);
      setPayments(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          Please log in to view payment history.
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Payment History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            {user.role === 'parent' && (
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel id="child-select-label">Select Child</InputLabel>
                  <Select
                    labelId="child-select-label"
                    value={selectedChild}
                    label="Select Child"
                    onChange={(e) => setSelectedChild(e.target.value)}
                    disabled={loading}
                  >
                    {familyMembers.map((child) => (
                      <MenuItem key={child.id} value={child.id}>
                        {child.displayName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <PaymentHistoryTable payments={payments} />
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PaymentHistory;
