import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { useSelector } from 'react-redux';
import { 
  setupPaymentSchedule, 
  getPaymentSchedule, 
  recordPayment,
  getEarningsHistory
} from '../services/allowances';
import { getFamilyMembers } from '../services/family';
import PaymentScheduleForm from '../components/Payments/PaymentScheduleForm';
import PaymentProcessor from '../components/Payments/PaymentProcessor';
import EarningsList from '../components/Payments/EarningsList';

const PaymentManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schedule, setSchedule] = useState(null);
  const [unpaidEarnings, setUnpaidEarnings] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);

  useEffect(() => {
    if (user?.role === 'parent') {
      loadFamilyMembers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChild) {
      loadPaymentData();
    }
  }, [selectedChild]);

  const loadFamilyMembers = async () => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const members = await getFamilyMembers(user.uid);
      const children = members.filter(member => member.role === 'child');
      setFamilyMembers(children);
      
      // If there's only one child, select them automatically
      if (children.length === 1) {
        setSelectedChild(children[0]);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
      setError('Failed to load family members: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentData = async () => {
    if (!selectedChild?.uid) return;
    
    try {
      setLoading(true);
      setError('');

      // Load payment schedule
      const scheduleData = await getPaymentSchedule(selectedChild.uid);
      setSchedule(scheduleData);

      // Load unpaid earnings
      const earnings = await getEarningsHistory(selectedChild.uid);
      setUnpaidEarnings(earnings.filter(earning => !earning.paid));
    } catch (error) {
      console.error('Error loading payment data:', error);
      setError(error.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (scheduleData) => {
    if (!selectedChild?.uid) {
      setError('Please select a child first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await setupPaymentSchedule({
        childId: selectedChild.uid,
        ...scheduleData
      });

      await loadPaymentData();
    } catch (error) {
      console.error('Error setting up payment schedule:', error);
      setError(error.message || 'Failed to set up payment schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedChild?.uid) {
      setError('Please select a child first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await recordPayment({
        childId: selectedChild.uid
      });

      await loadPaymentData();
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (e) => {
    const child = familyMembers.find(m => m.uid === e.target.value);
    setSelectedChild(child || null);
  };

  if (user?.role !== 'parent') {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Payment Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Child
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Child</InputLabel>
          <Select
            value={selectedChild?.uid || ''}
            label="Child"
            onChange={handleChildSelect}
            disabled={loading}
          >
            {familyMembers
              .filter(member => member.role === 'child')
              .map(child => (
                <MenuItem key={child.uid} value={child.uid}>
                  {child.displayName || child.email}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Paper>

      {selectedChild && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Schedule
            </Typography>
            <PaymentScheduleForm
              schedule={schedule}
              onSubmit={handleScheduleSubmit}
              loading={loading}
              disabled={!selectedChild}
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Process Payment
            </Typography>
            <PaymentProcessor
              onSubmit={handleProcessPayment}
              unpaidEarnings={unpaidEarnings}
              loading={loading}
              disabled={!selectedChild}
            />
          </Paper>
        </>
      )}
    </Container>
  );
};

export default PaymentManagement;
