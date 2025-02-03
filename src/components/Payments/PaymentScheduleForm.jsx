import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Alert
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Form component for managing payment schedules
 */
const PaymentScheduleForm = ({ 
  schedule = null, 
  onSubmit, 
  disabled = false, 
  loading = false 
}) => {
  const [frequency, setFrequency] = useState('biweekly');
  const [error, setError] = useState('');

  useEffect(() => {
    if (schedule?.frequency) {
      setFrequency(schedule.frequency);
    }
  }, [schedule]);

  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    try {
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      return new Date(timestamp.toDate()).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      onSubmit({ frequency });
    } catch (error) {
      setError(error.message || 'Failed to update payment schedule');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {schedule && schedule.nextPaymentDue && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Next payment due: {formatDate(schedule.nextPaymentDue) || 'Not set'}
        </Typography>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="frequency-label">Payment Frequency</InputLabel>
        <Select
          labelId="frequency-label"
          value={frequency}
          label="Payment Frequency"
          onChange={(e) => setFrequency(e.target.value)}
          disabled={disabled || loading}
        >
          <MenuItem value="biweekly">Every Two Weeks</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>
      </FormControl>

      <Button
        type="submit"
        variant="contained"
        disabled={disabled || loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Save Schedule'}
      </Button>
    </Box>
  );
};

PaymentScheduleForm.propTypes = {
  schedule: PropTypes.shape({
    frequency: PropTypes.string,
    nextPaymentDue: PropTypes.object
  }),
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool
};

export default PaymentScheduleForm;
