import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import PropTypes from 'prop-types';
import PaymentScheduleForm from '../Payments/PaymentScheduleForm';
import PaymentProcessor from '../Payments/PaymentProcessor';

/**
 * Component for displaying earnings overview and processing payments
 */
const EarningsOverview = ({
  selectedChild = null,
  earnings = [],
  totalEarnings = 0,
  paymentSchedule = null,
  onScheduleSubmit,
  onPaymentSubmit,
  loading = false,
  error = ''
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const unpaidEarnings = earnings.filter(earning => !earning.paid);
  const totalUnpaid = unpaidEarnings.reduce((sum, earning) => sum + earning.amount, 0);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Earnings Summary
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Total Earnings: {formatCurrency(totalEarnings)}
                </Typography>
                <Typography variant="body1">
                  Unpaid Earnings: {formatCurrency(totalUnpaid)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Recent Earnings
              </Typography>
              {earnings.length > 0 ? (
                earnings.slice(0, 5).map((earning) => (
                  <Box key={earning.id} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      {formatCurrency(earning.amount)} - {earning.source?.type || 'Unknown'}
                      {earning.paid && (
                        <Typography
                          component="span"
                          color="success.main"
                          sx={{ ml: 1 }}
                        >
                          (Paid)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">
                  No recent earnings
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Schedule
            </Typography>
            <PaymentScheduleForm
              schedule={paymentSchedule}
              onSubmit={onScheduleSubmit}
              loading={loading}
              disabled={!selectedChild}
            />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Process Payment
            </Typography>
            <PaymentProcessor
              unpaidEarnings={unpaidEarnings}
              onSubmit={onPaymentSubmit}
              loading={loading}
              disabled={!selectedChild || unpaidEarnings.length === 0}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

EarningsOverview.propTypes = {
  selectedChild: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    displayName: PropTypes.string
  }),
  earnings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      source: PropTypes.shape({
        type: PropTypes.string
      }),
      paid: PropTypes.bool
    })
  ).isRequired,
  totalEarnings: PropTypes.number.isRequired,
  paymentSchedule: PropTypes.shape({
    frequency: PropTypes.string,
    nextPaymentDue: PropTypes.object
  }),
  onScheduleSubmit: PropTypes.func.isRequired,
  onPaymentSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
};

export default EarningsOverview;
