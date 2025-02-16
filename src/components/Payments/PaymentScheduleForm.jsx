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
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday default
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    if (schedule) {
      setFrequency(schedule.frequency || 'biweekly');
      setDayOfWeek(schedule.dayOfWeek || 1);
      setDayOfMonth(schedule.dayOfMonth || 1);
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
      const scheduleData = {
        frequency,
        ...(frequency === 'biweekly' ? { dayOfWeek } : { dayOfMonth }),
      };
      onSubmit(scheduleData);
    } catch (error) {
      setError(error.message || 'Failed to update payment schedule');
    }
  };

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const monthDays = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}${getDayOfMonthSuffix(i + 1)}`,
  }));

  function getDayOfMonthSuffix(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

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

      {frequency === 'biweekly' && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="day-of-week-label">Payment Day</InputLabel>
          <Select
            labelId="day-of-week-label"
            value={dayOfWeek}
            label="Payment Day"
            onChange={(e) => setDayOfWeek(e.target.value)}
            disabled={disabled || loading}
          >
            {weekDays.map((day) => (
              <MenuItem key={day.value} value={day.value}>
                {day.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {frequency === 'monthly' && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="day-of-month-label">Payment Day</InputLabel>
          <Select
            labelId="day-of-month-label"
            value={dayOfMonth}
            label="Payment Day"
            onChange={(e) => setDayOfMonth(e.target.value)}
            disabled={disabled || loading}
          >
            {monthDays.map((day) => (
              <MenuItem key={day.value} value={day.value}>
                {day.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

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
    dayOfWeek: PropTypes.number,
    dayOfMonth: PropTypes.number,
    nextPaymentDue: PropTypes.object
  }),
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  loading: PropTypes.bool
};

export default PaymentScheduleForm;
