import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';

const PaymentHistoryTable = ({ payments }) => {
  if (!payments.length) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No payment history found.
        </Typography>
      </Box>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSourceLabel = (source) => {
    switch (source.type) {
      case 'allowance_payment':
        return `Allowance Payment (${source.earningCount} earnings)`;
      case 'chore_payment':
        return 'Chore Payment';
      case 'bonus_payment':
        return 'Bonus Payment';
      default:
        return source.type;
    }
  };

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.createdAt)}</TableCell>
              <TableCell>{formatAmount(payment.amount)}</TableCell>
              <TableCell>{getSourceLabel(payment.source)}</TableCell>
              <TableCell>
                <Chip
                  label={payment.status || 'Completed'}
                  color={payment.status === 'pending' ? 'warning' : 'success'}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

PaymentHistoryTable.propTypes = {
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      createdAt: PropTypes.object.isRequired,
      source: PropTypes.shape({
        type: PropTypes.string.isRequired,
        earningCount: PropTypes.number
      }).isRequired,
      status: PropTypes.string
    })
  ).isRequired
};

export default PaymentHistoryTable;
